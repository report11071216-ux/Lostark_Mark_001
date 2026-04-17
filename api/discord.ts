export default async function handler(req, res) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({
      ok: false,
      error: "DISCORD_WEBHOOK_URL is missing",
    });
  }

  if (!["POST", "PATCH"].includes(req.method)) {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    if (req.method === "POST") {
      const response = await fetch(`${webhookUrl}?wait=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: req.body.message ?? "",
          embeds: req.body.embeds ?? [],
        }),
      });

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

    const { messageId, message, embeds } = req.body || {};

    if (!messageId) {
      return res.status(400).json({
        ok: false,
        error: "messageId is required",
      });
    }

    const response = await fetch(`${webhookUrl}/messages/${messageId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message ?? "",
        embeds: embeds ?? [],
      }),
    });

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
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
