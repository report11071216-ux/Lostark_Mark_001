export default async function handler(req, res) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: req.body.message,
      embeds: req.body.embeds,
    }),
  });

  res.status(200).json({ ok: true });
}
