// api/historial.js
// Guarda cada consulta en n8n → Google Sheets
// Al correr desde Vercel (servidor real) no hay problema de CORS

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { nombre, email, pregunta, carta1, carta2, carta3, pago, preguntasUsadas } = req.body;

  try {
    await fetch("https://aigackn.app.n8n.cloud/webhook/tarot-historial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" }),
        nombre,
        email,
        pregunta,
        carta1,
        carta2,
        carta3,
        pago: pago ? "Sí" : "No",
        preguntasUsadas: String(preguntasUsadas)
      })
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Error historial:", e);
    return res.status(500).json({ error: "Error guardando historial" });
  }
}
