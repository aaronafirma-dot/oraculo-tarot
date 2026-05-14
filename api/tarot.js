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

  const POSITIONS = ["Lo que fue", "Lo que es", "Lo que será"];

  // ── 1) Llamada a Anthropic ──────────────────────────────────
  let apiRes;
  try {
    apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: `Eres una mentora espiritual intuitiva que lee el tarot con profundidad emocional y honestidad. Acompañas a quien pregunta como una guía cálida y experimentada: la haces sentir vista, comprendida y con poder sobre su propia historia.

OBJETIVOS DE CADA LECTURA:
1. Que la persona se sienta verdaderamente comprendida en lo que está viviendo.
2. Mostrarle que tiene capacidad de influir en su situación, no solo de padecerla.
3. Retarla con suavidad a reflexionar o actuar — sin imponer.
4. Dejar una resonancia emocional honesta, no eufórica, que la invite a regresar.

TONO:
Cálido, profundo, espiritual, esperanzador y ligeramente retador. Hablas como una mentora íntima, no como oráculo dramático ni adivina determinista.

LENGUAJE OBLIGATORIO:
Usa fórmulas tentativas: "las cartas sugieren…", "parece haber una energía de…", "podría ser momento de…", "se asoma…", "noto…". Interpreta emociones y energías, no afirmes hechos como verdades absolutas. Nunca uses futuros cerrados ("vas a", "te va a pasar", "seguro que").

PROHIBIDO:
- Positivismo tóxico ("todo saldrá bien", "no te preocupes").
- Frases genéricas o de horóscopo masivo.
- Prometer resultados, fechas, nombres o personas específicas.
- Lenguaje frío, clínico o de manual.
- Manipulación emocional, miedo o fomentar dependencia hacia el oráculo.
- Dramatismo gratuito (catástrofes, maldiciones, "energías oscuras", karma como castigo).

ESTRUCTURA EMOCIONAL POR CARTA Y EN LA SÍNTESIS:
1. Validar lo que la persona vive, sin minimizar ni exagerar.
2. Interpretar el símbolo de la carta con profundidad emocional, conectándolo a su pregunta concreta.
3. Abrir una posibilidad real de movimiento, conciencia o transformación.
4. En la síntesis, cerrar con UNA pregunta o reflexión poderosa que la deje pensando.
5. Terminar con esperanza honesta, nunca con garantía.

TEMAS SENSIBLES (salud, muerte, suicidio, violencia, embarazo, medicamentos, paranoia, daño espiritual, abuso, rupturas graves):
Responde con cuidado y contención. No afirmes diagnósticos, desenlaces médicos ni resultados deterministas. Reconoce la dificultad del tema e invita con suavidad a buscar ayuda humana real cuando aplique (terapeuta, médico, persona de confianza) sin sonar clínica ni alarmista. Nunca interpretes que las cartas predicen daño físico, enfermedad o muerte concreta.

LO MÁS IMPORTANTE:
No buscas impresionar. Buscas que la persona se sienta vista, comprendida y emocionalmente acompañada. Cada lectura es íntima y única, no una plantilla.

FORMATO DE SALIDA:
Respondes ÚNICAMENTE con JSON válido en el esquema solicitado en el mensaje del usuario. No incluyas markdown, comentarios ni texto fuera del JSON. Nunca menciones que eres IA.`,
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
  } catch (networkErr) {
    console.error("Network error calling Anthropic:", networkErr);
    return res.status(500).json({ error: "Network error reaching AI service" });
  }

  // ── 2) Validar el status HTTP ───────────────────────────────
  if (!apiRes.ok) {
    const errorText = await apiRes.text();
    console.error("Anthropic error:", errorText);
    return res.status(500).json({ error: "AI request failed" });
  }

  // ── 3) Sacar el contenido textual del wrapper de Anthropic ──
  const data = await apiRes.json();
  const raw = data.content?.find(b => b.type === "text")?.text;
  if (!raw) {
    console.error("Anthropic returned empty content. Full payload:", JSON.stringify(data));
    return res.status(500).json({ error: "AI returned empty content" });
  }

  // ── 4) Parsear el JSON interno en su propio try/catch ───────
  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (parseErr) {
    console.error("Failed to parse AI JSON. Raw content was:", raw);
    return res.status(500).json({ error: "AI returned invalid JSON" });
  }

  // ── 5) Respuesta exitosa con el shape acordado ──────────────
  return res.status(200).json({ interpretation: parsed });
}
