// api/tarot.js
// Vercel Serverless Function — proxy entre el frontend y Anthropic
// Esto resuelve el problema de CORS completamente

export default async function handler(req, res) {
  // Permitir CORS desde cualquier origen
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, cards, userName } = req.body;

  if (!question || !cards || cards.length !== 3) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const POSITIONS = ["Lo que fue", "Lo que es", "Lo que será"];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `Eres una tarotista mexicana, profunda, cálida y directa. Hablas de tú a tú con calidez y autoridad espiritual. Tu lenguaje es poético pero claro, nunca genérico. NUNCA menciones que eres IA. Respondes ÚNICAMENTE con JSON válido, sin markdown ni texto fuera del JSON.`,
        messages: [{
          role: "user",
          content: `La persona se llama ${userName} y pregunta: "${question}"

Cartas:
- ${POSITIONS[0]}: ${cards[0].name} (${cards[0].keywords})
- ${POSITIONS[1]}: ${cards[1].name} (${cards[1].keywords})
- ${POSITIONS[2]}: ${cards[2].name} (${cards[2].keywords})

Responde SOLO con este JSON:
{
  "cards": [
    {"position":"${POSITIONS[0]}","name":"${cards[0].name}","reading":"2-3 oraciones íntimas. Menciona a ${userName} por su nombre."},
    {"position":"${POSITIONS[1]}","name":"${cards[1].name}","reading":"2-3 oraciones sobre el presente"},
    {"position":"${POSITIONS[2]}","name":"${cards[2].name}","reading":"2-3 oraciones sobre lo que viene"}
  ],
  "synthesis":"4-6 oraciones respondiendo directamente la pregunta de ${userName}. Cierra con frase poderosa."
}`
        }]
      })
    });

    const data = await response.json();
    const raw = data.content?.find(b => b.type === "text")?.text || "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Error Anthropic:", error);
    return res.status(500).json({ error: "Error al consultar las cartas" });
  }
}
