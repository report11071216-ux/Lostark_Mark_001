// ─────────────────────────────────────────────
//  api/discord.ts
//  지원 메서드: POST (전송) · PATCH (수정) · DELETE (삭제)
//  + 다중 웹훅 target 지원
//    body.target = "raid"    → DISCORD_WEBHOOK_RAID
//    body.target = "welcome" → DISCORD_WEBHOOK_WELCOME
//    body.target = (없음)    → DISCORD_WEBHOOK_URL (기본)
//  + Discord rate limit 자동 재시도
// ─────────────────────────────────────────────

const MAX_RETRIES = 3;

/**
 * target 값에 따라 환경변수에서 웹훅 URL 선택
 * DISCORD_WEBHOOK_RAID / DISCORD_WEBHOOK_WELCOME 미설정 시
 * 기본 DISCORD_WEBHOOK_URL 로 폴백
 */
function resolveWebhookUrl(target?: string): string | undefined {
  switch (target) {
    case "raid":
      return process.env.DISCORD_WEBHOOK_RAID || process.env.DISCORD_WEBHOOK_URL;
    case "welcome":
      return process.env.DISCORD_WEBHOOK_WELCOME || process.env.DISCORD_WEBHOOK_URL;
    default:
      return process.env.DISCORD_WEBHOOK_URL;
  }
}

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
  if (!["POST", "PATCH", "DELETE"].includes(req.method)) {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed (POST · PATCH · DELETE only)",
    });
  }

  // target 에 따라 웹훅 URL 결정
  const target = req.body?.target as string | undefined;
  const webhookUrl = resolveWebhookUrl(target);

  if (!webhookUrl) {
    return res.status(500).json({
      ok: false,
      error: `웹훅 URL이 설정되지 않았습니다. target="${target ?? "default"}" — 환경변수를 확인해주세요.`,
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
            content: req.body.content ?? req.body.message ?? "",
            embeds:  req.body.embeds ?? [],
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
        discord:   data,
      });
    }

    // ── PATCH: 기존 메시지 수정 ──────────────────────────
    if (req.method === "PATCH") {
      const { messageId, message, content, embeds } = req.body || {};

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
            content: content ?? message ?? "",
            embeds:  embeds ?? [],
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

      return res.status(200).json({ ok: true, discord: data });
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
