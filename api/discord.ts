// ─────────────────────────────────────────────
//  api/discord.ts
//  지원 메서드: POST (전송) · PATCH (수정) · DELETE (삭제)
//  + Discord rate limit 자동 재시도
// ─────────────────────────────────────────────

const MAX_RETRIES = 3;

/**
 * Discord 웹훅 fetch + rate limit(429) 자동 재시도
 */
async function discordFetch(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 429 && retries > 0) {
    let retryAfterMs = 1000;

    try {
      const data = await response.clone().json();
      retryAfterMs = (data?.retry_after ?? 1) * 1000;
    } catch {
      // JSON 파싱 실패 시 기본값 사용
    }

    await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    return discordFetch(url, options, retries - 1);
  }

  return response;
}

export default async function handler(req: any, res: any) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({
      ok: false,
      error: "DISCORD_WEBHOOK_URL is missing",
    });
  }

  if (!["POST", "PATCH", "DELETE"].includes(req.method)) {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed (POST · PATCH · DELETE only)",
    });
  }

  try {
    // ── POST: 새 메시지 전송 ──────────────────────────────
    if (req.method === "POST") {
      const response = await discordFetch(
        `${webhookUrl}?wait=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: req.body.message ?? "",
            embeds: req.body.embeds ?? [],
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return res.status(response.status).json({
          ok: false,
          error: data || "Discord send failed",
        });
      }

      return res.status(200).json({
        ok: true,
        messageId: data?.id,
        discord: data,
      });
    }

    // ── PATCH: 기존 메시지 수정 ──────────────────────────
    if (req.method === "PATCH") {
      const { messageId, message, embeds } = req.body || {};

      if (!messageId) {
        return res.status(400).json({
          ok: false,
          error: "messageId is required for PATCH",
        });
      }

      const response = await discordFetch(
        `${webhookUrl}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: message ?? "",
            embeds: embeds ?? [],
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return res.status(response.status).json({
          ok: false,
          error: data || "Discord update failed",
        });
      }

      return res.status(200).json({
        ok: true,
        discord: data,
      });
    }

    // ── DELETE: 기존 메시지 삭제 ─────────────────────────
    if (req.method === "DELETE") {
      const { messageId } = req.body || {};

      if (!messageId) {
        return res.status(400).json({
          ok: false,
          error: "messageId is required for DELETE",
        });
      }

      const response = await discordFetch(
        `${webhookUrl}/messages/${messageId}`,
        { method: "DELETE" }
      );

      // 204 No Content = 성공
      if (response.status === 204 || response.ok) {
        return res.status(200).json({ ok: true });
      }

      const data = await response.json().catch(() => null);
      return res.status(response.status).json({
        ok: false,
        error: data || "Discord delete failed",
      });
    }
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
