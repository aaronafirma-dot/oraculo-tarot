// src/App.js
import { useState, useEffect, useRef } from "react";
import { auth, db, googleProvider } from "./firebase/config";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

// ── Constantes ────────────────────────────────────────────────
const PAYPAL_CLIENT_ID = "AalJEIzRoq9IvH1Nqawdi3sJk09PLxVDzR9VLtrzuzJrTUOHKuDVuJltMx5-RwvFOGRFXMWLabp7bbaT";
const PRECIO_MXN = 50;
const PREGUNTAS_GRATIS = 3;
const PREGUNTAS_BONUS = 3;

const CARDS = [
  { id:0,  name:"El Loco",              symbol:"🌬️", color:"#7ecac3", keywords:"nuevos comienzos, libertad, salto de fe" },
  { id:1,  name:"El Mago",              symbol:"⚡",  color:"#e8c84a", keywords:"voluntad, manifestación, habilidad" },
  { id:2,  name:"La Papisa",            symbol:"🌙", color:"#9b8ec4", keywords:"intuición, misterio, sabiduría interior" },
  { id:3,  name:"La Emperatriz",        symbol:"🌸", color:"#e88fa0", keywords:"abundancia, fertilidad, creación" },
  { id:4,  name:"El Emperador",         symbol:"🏛️", color:"#c47a3a", keywords:"autoridad, estructura, estabilidad" },
  { id:5,  name:"El Hierofante",        symbol:"✝️", color:"#a08060", keywords:"tradición, guía espiritual, convención" },
  { id:6,  name:"Los Enamorados",       symbol:"💫", color:"#e87070", keywords:"amor, unión, decisión del corazón" },
  { id:7,  name:"El Carro",             symbol:"⚔️", color:"#6a9fd8", keywords:"control, victoria, determinación" },
  { id:8,  name:"La Fuerza",            symbol:"🦁", color:"#e8a840", keywords:"coraje, paciencia, dominio interior" },
  { id:9,  name:"El Ermitaño",          symbol:"🕯️", color:"#8ea8b8", keywords:"introspección, guía, soledad fértil" },
  { id:10, name:"Rueda de la Fortuna",  symbol:"☸️", color:"#c4a030", keywords:"cambio, ciclos, destino" },
  { id:11, name:"La Justicia",          symbol:"⚖️", color:"#7ab870", keywords:"verdad, karma, equilibrio" },
  { id:12, name:"El Colgado",           symbol:"🌀", color:"#6888c4", keywords:"pausa, rendición, nueva perspectiva" },
  { id:13, name:"La Muerte",            symbol:"🌑", color:"#606880", keywords:"transformación, fin de ciclo, renacimiento" },
  { id:14, name:"La Templanza",         symbol:"✨", color:"#70c4b8", keywords:"equilibrio, moderación, alquimia" },
  { id:15, name:"El Diablo",            symbol:"🔥", color:"#c44040", keywords:"apego, sombra, liberación pendiente" },
  { id:16, name:"La Torre",             symbol:"⚡", color:"#c46840", keywords:"revelación, ruptura, caos necesario" },
  { id:17, name:"La Estrella",          symbol:"⭐", color:"#70a8e8", keywords:"esperanza, inspiración, renovación" },
  { id:18, name:"La Luna",              symbol:"🌕", color:"#8878c4", keywords:"ilusiones, miedos, el inconsciente" },
  { id:19, name:"El Sol",               symbol:"☀️", color:"#e8c030", keywords:"alegría, claridad, éxito radiante" },
  { id:20, name:"El Juicio",            symbol:"🔔", color:"#c0a870", keywords:"renacimiento, llamado interior, perdón" },
  { id:21, name:"El Mundo",             symbol:"🌍", color:"#60b878", keywords:"culminación, plenitud, integración" },
];

const POSITIONS = [
  { label:"Lo que fue" },
  { label:"Lo que es" },
  { label:"Lo que será" },
];

const LOADING_MSGS = [
  "Mezclando el mazo...",
  "Las cartas están hablando...",
  "El universo está respondiendo...",
  "Interpretando los arcanos...",
];

// ── Firebase helpers ──────────────────────────────────────────
const getUserData = async (uid) => {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { preguntasUsadas: 0, preguntasPagadas: 0, pagos: 0 });
    return { preguntasUsadas: 0, preguntasPagadas: 0, pagos: 0 };
  }
  return snap.data();
};

const incrementarPregunta = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), { preguntasUsadas: increment(1) });
};

const agregarPreguntasPagadas = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), {
    preguntasPagadas: increment(PREGUNTAS_BONUS),
    pagos: increment(1)
  });
};

// ── StarField ─────────────────────────────────────────────────
function StarField({ active }) {
  const ref = useRef(null);
  const anim = useRef(null);
  const stars = useRef([]);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    stars.current = Array.from({length:180}, () => ({
      x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight,
      r: Math.random()*1.5+0.2, speed: Math.random()*0.3+0.08,
      dir: Math.random()*Math.PI*2, tw: Math.random()*Math.PI*2,
    }));
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height);
      stars.current.forEach(s => {
        s.tw += 0.02;
        const a = active ? 0.3+0.6*Math.abs(Math.sin(s.tw)) : 0.05+0.08*Math.abs(Math.sin(s.tw));
        if (active) { s.x+=Math.cos(s.dir)*s.speed; s.y+=Math.sin(s.dir)*s.speed; }
        if (s.x<0) s.x=c.width; if (s.x>c.width) s.x=0;
        if (s.y<0) s.y=c.height; if (s.y>c.height) s.y=0;
        const g = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*3);
        g.addColorStop(0,`rgba(255,235,180,${a})`); g.addColorStop(1,"rgba(255,235,180,0)");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(s.x,s.y,s.r*3,0,Math.PI*2); ctx.fill();
      });
      anim.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(anim.current); window.removeEventListener("resize", resize); };
  }, [active]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}} />;
}

// ── Card Face SVG ─────────────────────────────────────────────
function CardFace({ card, size=130 }) {
  const h = Math.round(size*1.72);
  const nums = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];
  const words = card.keywords.split(", ");
  return (
    <svg width={size} height={h} viewBox="0 0 130 224" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg${card.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d0520"/><stop offset="50%" stopColor="#1a0840"/><stop offset="100%" stopColor="#0d0520"/>
        </linearGradient>
        <radialGradient id={`gl${card.id}`} cx="50%" cy="42%" r="45%">
          <stop offset="0%" stopColor={card.color} stopOpacity="0.22"/><stop offset="100%" stopColor={card.color} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="130" height="224" rx="10" fill={`url(#bg${card.id})`}/>
      <rect width="130" height="224" rx="10" fill={`url(#gl${card.id})`}/>
      <rect x="1" y="1" width="128" height="222" rx="9" fill="none" stroke={card.color} strokeWidth="1.5" strokeOpacity="0.8"/>
      <rect x="8" y="8" width="114" height="208" rx="6" fill="none" stroke={card.color} strokeWidth="0.5" strokeOpacity="0.25"/>
      {[[14,22],[116,22],[14,216],[116,216]].map(([x,y],i)=><text key={i} x={x} y={y} fontSize="10" fill={card.color} fillOpacity="0.6" fontFamily="serif" textAnchor="middle">✦</text>)}
      <text x="65" y="42" fontSize="11" fill={card.color} fillOpacity="0.55" fontFamily="serif" textAnchor="middle" letterSpacing="2">{nums[card.id]}</text>
      <line x1="20" y1="48" x2="110" y2="48" stroke={card.color} strokeWidth="0.5" strokeOpacity="0.25"/>
      <text x="65" y="128" fontSize="50" textAnchor="middle" dominantBaseline="middle">{card.symbol}</text>
      <circle cx="65" cy="118" r="34" fill="none" stroke={card.color} strokeWidth="0.7" strokeOpacity="0.2" strokeDasharray="3 4"/>
      <line x1="20" y1="158" x2="110" y2="158" stroke={card.color} strokeWidth="0.5" strokeOpacity="0.25"/>
      <text x="65" y="177" fontSize="10.5" fill="#e8d4b0" fontFamily="serif" fontWeight="bold" textAnchor="middle">{card.name.toUpperCase()}</text>
      <text x="65" y="194" fontSize="7.5" fill={card.color} fillOpacity="0.55" fontFamily="serif" fontStyle="italic" textAnchor="middle">{words.slice(0,2).join(", ")}</text>
      {words[2] && <text x="65" y="206" fontSize="7.5" fill={card.color} fillOpacity="0.55" fontFamily="serif" fontStyle="italic" textAnchor="middle">{words.slice(2).join(", ")}</text>}
    </svg>
  );
}

function CardBack({ size=130 }) {
  const h = Math.round(size*1.72);
  return (
    <svg width={size} height={h} viewBox="0 0 130 224" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c0420"/><stop offset="50%" stopColor="#1c0940"/><stop offset="100%" stopColor="#0c0420"/>
        </linearGradient>
        <pattern id="bp" x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M0 0 L9 9 M9 0 L0 9" stroke="rgba(184,150,106,0.06)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="130" height="224" rx="10" fill="url(#bb)"/>
      <rect width="130" height="224" rx="10" fill="url(#bp)"/>
      <rect x="1" y="1" width="128" height="222" rx="9" fill="none" stroke="rgba(184,150,106,0.4)" strokeWidth="1.5"/>
      <rect x="8" y="8" width="114" height="208" rx="6" fill="none" stroke="rgba(184,150,106,0.15)" strokeWidth="0.8"/>
      <circle cx="65" cy="112" r="42" fill="none" stroke="rgba(184,150,106,0.12)" strokeWidth="0.8"/>
      <circle cx="65" cy="112" r="28" fill="none" stroke="rgba(184,150,106,0.18)" strokeWidth="0.8"/>
      <circle cx="65" cy="112" r="14" fill="none" stroke="rgba(184,150,106,0.22)" strokeWidth="0.8"/>
      <text x="65" y="119" fontSize="18" textAnchor="middle" fill="rgba(184,150,106,0.45)" fontFamily="serif">✦</text>
      {[[18,22],[112,22],[18,204],[112,204]].map(([x,y],i)=><text key={i} x={x} y={y} fontSize="9" textAnchor="middle" fill="rgba(184,150,106,0.3)" fontFamily="serif">✦</text>)}
    </svg>
  );
}

// ── Tarot Card con flip ───────────────────────────────────────
function TarotCard({ card, position, revealed, delay }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    if (revealed) { const t = setTimeout(()=>setFlipped(true), delay); return ()=>clearTimeout(t); }
    else setFlipped(false);
  }, [revealed, delay]);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",opacity:revealed?1:0,transform:revealed?"translateY(0)":"translateY(40px)",transition:`opacity .7s ease ${delay}ms,transform .7s ease ${delay}ms`}}>
      <div style={{fontSize:"10px",letterSpacing:"4px",textTransform:"uppercase",color:"#b8966a",fontFamily:"serif",textAlign:"center"}}>{position.label}</div>
      <div style={{perspective:"900px",width:"130px",height:"224px"}}>
        <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transition:"transform 1s cubic-bezier(.4,0,.2,1)",transform:flipped?"rotateY(180deg)":"rotateY(0deg)"}}>
          <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden"}}><CardBack size={130}/></div>
          <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:"10px",overflow:"hidden",boxShadow:`0 10px 40px rgba(0,0,0,.7),0 0 20px ${card.color}33`}}>
            <CardFace card={card} size={130}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PayPal Button ─────────────────────────────────────────────
function PayPalButton({ onSuccess }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const ex = document.getElementById("pp-sdk");
    if (ex && window.paypal) { setLoaded(true); render(); return; }
    if (ex) { ex.onload = ()=>{ setLoaded(true); render(); }; return; }
    const s = document.createElement("script");
    s.id="pp-sdk";
    s.src=`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=MXN&intent=capture`;
    s.onload=()=>{ setLoaded(true); render(); };
    s.onerror=()=>setError(true);
    document.body.appendChild(s);
  }, []);
  const render = () => setTimeout(()=>{
    if (!window.paypal||!ref.current) return;
    ref.current.innerHTML="";
    window.paypal.Buttons({
      style:{layout:"vertical",color:"gold",shape:"pill",label:"pay",height:46},
      createOrder:(_,a)=>a.order.create({purchase_units:[{amount:{value:PRECIO_MXN.toString(),currency_code:"MXN"},description:`Oráculo del Tarot — ${PREGUNTAS_BONUS} lecturas`}]}),
      onApprove:async(_,a)=>{ await a.order.capture(); onSuccess(); },
      onError:()=>setError(true),
    }).render(ref.current);
  }, 200);
  if (error) return <p style={{color:"rgba(184,150,106,.6)",fontSize:"13px",textAlign:"center"}}>Error al cargar el pago. Recarga la página.</p>;
  return <div>{!loaded && <p style={{color:"rgba(184,150,106,.5)",fontSize:"13px",textAlign:"center",fontStyle:"italic"}}>Cargando pago seguro...</p>}<div ref={ref}/></div>;
}

// ── Loading Screen ────────────────────────────────────────────
function LoadingScreen({ msg }) {
  return (
    <div style={{minHeight:"55vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px"}}>
      <div style={{position:"relative",width:"110px",height:"110px"}}>
        {[0,1,2,3,4,5].map(i=>(
          <div key={i} style={{position:"absolute",top:"50%",left:"50%",width:"5px",height:"5px",marginTop:"-2.5px",marginLeft:"-2.5px",animation:`orbit 3s linear ${i*0.5}s infinite`,transformOrigin:"0 -44px"}}>
            <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"rgba(184,150,106,0.85)"}}/>
          </div>
        ))}
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"44px"}}>🔮</div>
      </div>
      <p style={{color:"rgba(184,150,106,.8)",fontStyle:"italic",letterSpacing:"2px",fontSize:"16px",textAlign:"center"}}>{msg}</p>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stage, setStage] = useState("input"); // input | loading | reveal | result | paywall
  const [question, setQuestion] = useState("");
  const [cards, setCards] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [cardReadings, setCardReadings] = useState([]);
  const [synthesis, setSynthesis] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);

  // Guard contra dobles ejecuciones de handleReveal (clics rápidos, re-render de StrictMode, etc.)
  const inFlightRef = useRef(false);

  // ── 1) AUTH: solo gestiona Firebase Auth (listener). ──
  // Con popup el resultado del login llega vía onAuthStateChanged cuando
  // Firebase actualiza el estado tras cerrarse la ventana de Google.
  // No hace nada de Firestore aquí — eso vive en su propio efecto debajo.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("[AUTH] State changed:", u);
      setAuthLoading(false);
      if (u) {
        setUser(u);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── 2) FIRESTORE: cada vez que cambia el user, carga su documento. ──
  // Si Firestore falla, no bloquea la UI — usamos un userData por defecto.
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getUserData(user.uid);
        if (!cancelled) setUserData(data);
      } catch (e) {
        console.error("[AUTH] getUserData failed (¿Firestore configurado?):", e);
        if (!cancelled) setUserData({ preguntasUsadas: 0, preguntasPagadas: 0, pagos: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Loading messages rotator
  useEffect(() => {
    if (stage !== "loading") return;
    let i = 0; setLoadingMsg(LOADING_MSGS[0]);
    const t = setInterval(()=>{ i=(i+1)%LOADING_MSGS.length; setLoadingMsg(LOADING_MSGS[i]); }, 1800);
    return ()=>clearInterval(t);
  }, [stage]);

  const preguntasRestantes = () => {
    if (!userData) return 0;
    const total = PREGUNTAS_GRATIS + userData.preguntasPagadas;
    return Math.max(0, total - userData.preguntasUsadas);
  };

  const handleLogin = async () => {
    console.log("[AUTH] Initiating signInWithPopup...");
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { console.error("[AUTH] signInWithPopup error:", e); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setStage("input"); setQuestion(""); setCards([]);
  };

  const handleReveal = async () => {
    // Guard: ignora clics duplicados o re-entradas mientras hay una lectura en curso.
    // Toda la lectura completa (pregunta + 3 cartas + síntesis) cuenta como UNA sola consulta.
    if (inFlightRef.current) return;
    if (!question.trim() || preguntasRestantes() <= 0) return;
    inFlightRef.current = true;

    const shuffled = [...CARDS].sort(()=>Math.random()-.5).slice(0,3);
    setCards(shuffled); setCardReadings([]); setSynthesis(""); setRevealed(false);
    setStage("loading");

    // 1) Esperamos la respuesta de la API ANTES de tocar el contador, así
    //    el usuario ve siempre su lectura aunque algo raro pase con el conteo.
    let readings=[], synth="";
    try {
      const res = await fetch("/api/tarot", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          question,
          cards: shuffled,
          userName: user.displayName?.split(" ")[0] || "querida"
        })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `API ${res.status}`);
      }
      const data = await res.json();
      // ── DIAGNÓSTICO TEMPORAL — paso 1: respuesta cruda ────
      console.log("[DEBUG] RAW data:", data);
      console.log("[DEBUG] interpretation:", data?.interpretation);
      console.log("[DEBUG] cards:", data?.interpretation?.cards);
      console.log("[DEBUG] synthesis:", data?.interpretation?.synthesis);
      // ──────────────────────────────────────────────────────
      // El backend envuelve la lectura en { interpretation: { cards, synthesis } }
      const interp = data.interpretation || {};
      readings = interp.cards || [];
      synth = interp.synthesis || "";
    } catch (err) {
      console.error("Fallback de lectura, error:", err);
      synth = `${user.displayName?.split(" ")[0] || "Querida"}, las cartas son claras: estás ante un momento de transformación real. Confía en tu guía interior.`;
    }

    // 2) Lectura ya disponible: ahora SÍ contamos la consulta una única vez.
    //    incrementarPregunta es fire-and-forget para no bloquear la animación.
    const nuevoUsadas = (userData?.preguntasUsadas || 0) + 1;
    incrementarPregunta(user.uid).catch(e => console.error("Error al guardar contador:", e));
    setUserData(prev => ({ ...prev, preguntasUsadas: nuevoUsadas }));

    // Guardar historial (fire-and-forget)
    fetch("/api/historial", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        nombre: user.displayName,
        email: user.email,
        pregunta: question,
        carta1: shuffled[0].name,
        carta2: shuffled[1].name,
        carta3: shuffled[2].name,
        pago: userData?.pagos > 0,
        preguntasUsadas: nuevoUsadas
      })
    }).catch(()=>{});

    setStage("reveal");
    setTimeout(()=>setRevealed(true), 300);
    setTimeout(()=>{
      setCardReadings(readings);
      setSynthesis(synth);
      // ── DIAGNÓSTICO TEMPORAL — paso 2: setState ──────────
      console.log("[DEBUG] SET cardReadings:", readings);
      console.log("[DEBUG] SET synthesis:", synth);
      // ─────────────────────────────────────────────────────
      setStage("result");
      inFlightRef.current = false; // libera el guard cuando ya está todo en pantalla
    }, 3*380+1400);
  };

  const handleNewQuestion = () => {
    if (preguntasRestantes() <= 0) { setStage("paywall"); return; }
    setStage("input"); setQuestion(""); setCards([]); setRevealed(false); setCardReadings([]); setSynthesis("");
  };

  const handlePaySuccess = async () => {
    await agregarPreguntasPagadas(user.uid);
    setUserData(prev => ({ ...prev, preguntasPagadas: (prev?.preguntasPagadas||0)+PREGUNTAS_BONUS, pagos: (prev?.pagos||0)+1 }));
    setStage("input"); setQuestion(""); setCards([]);
  };

  const restantes = preguntasRestantes();
  const nombre = user?.displayName?.split(" ")[0] || "";

  // ── Estilos globales ────────────────────────────────────────
  const gold = "#b8966a";
  const s = {
    page: { minHeight:"100vh", background:"radial-gradient(ellipse at 25% 10%,#1b0638 0%,#070012 50%,#000005 100%)", color:"#e8d4b0", fontFamily:"Georgia,serif", position:"relative", overflowX:"hidden" },
    container: { position:"relative", zIndex:2, maxWidth:"820px", margin:"0 auto", padding:"40px 20px 80px" },
    card: { background:"linear-gradient(135deg,rgba(255,255,255,.025),rgba(184,150,106,.035))", border:`1px solid rgba(184,150,106,.16)`, borderRadius:"24px", padding:"clamp(24px,5vw,48px)", backdropFilter:"blur(14px)", boxShadow:"0 20px 60px rgba(0,0,0,.45)" },
    btn: (active) => ({ width:"100%", marginTop:"16px", padding:"17px", background:active?"linear-gradient(135deg,#3b1e0c,#8a5c28,#c9a55a,#8a5c28,#3b1e0c)":"rgba(255,255,255,.03)", border:`1px solid ${active?"rgba(184,150,106,.6)":"rgba(184,150,106,.1)"}`, borderRadius:"14px", color:active?"#fdf0d5":"rgba(184,150,106,.2)", fontFamily:"serif", fontSize:"12px", letterSpacing:"4px", fontWeight:"bold", cursor:active?"pointer":"not-allowed", transition:"all .4s" }),
    input: { width:"100%", background:"rgba(0,0,0,.32)", border:`1px solid rgba(184,150,106,.22)`, borderRadius:"14px", padding:"16px 18px", color:"#e8d4b0", fontSize:"16px", fontFamily:"Georgia,serif", boxSizing:"border-box", lineHeight:1.7, outline:"none" },
  };

  // ── DIAGNÓSTICO TEMPORAL — paso 3: estado en cada render ──
  console.log("[DEBUG] STATE cardReadings:", cardReadings);
  console.log("[DEBUG] STATE synthesis:", synthesis);
  // ── paso 4: verificación defensiva justo antes del render ─
  if (stage === "result" && (!cardReadings || cardReadings.length === 0)) {
    console.warn("[DEBUG] cardReadings vacío en render");
  }
  // ──────────────────────────────────────────────────────────

  if (authLoading) return (
    <div style={{...s.page, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{fontSize:"48px"}}>🔮</div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        @keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
        @keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes moon-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes orbit{from{transform:rotate(0deg) translateY(-44px)}to{transform:rotate(360deg) translateY(-44px)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 20px rgba(184,150,106,.15)}50%{box-shadow:0 0 45px rgba(184,150,106,.4)}}
        textarea:focus,input:focus{border-color:rgba(184,150,106,.55)!important;box-shadow:0 0 15px rgba(184,150,106,.08)}
        textarea::placeholder,input::placeholder{color:rgba(184,150,106,.35);font-style:italic}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(184,150,106,.25);border-radius:2px}
      `}</style>

      <StarField active={stage==="reveal"||stage==="result"||stage==="loading"} />

      <div style={s.container}>

        {/* Header */}
        <header style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"15px",letterSpacing:"14px",color:`rgba(184,150,106,.35)`,marginBottom:"14px"}}>☽ &nbsp; ✦ &nbsp; ☾</div>
          <h1 style={{fontFamily:"serif",fontSize:"clamp(20px,5vw,34px)",fontWeight:"bold",letterSpacing:"3px",background:"linear-gradient(90deg,#6b4a22,#e8c870,#c9a55a,#e8c870,#6b4a22)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 7s linear infinite",marginBottom:"8px"}}>
            Oráculo del Tarot
          </h1>
          <p style={{fontSize:"11px",letterSpacing:"5px",textTransform:"uppercase",color:`rgba(184,150,106,.4)`,fontFamily:"serif"}}>Tirada de Tres Arcanos Mayores</p>

          {/* Auth + contador */}
          {user ? (
            <div style={{marginTop:"14px",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",justifyContent:"center"}}>
                <img src={user.photoURL} alt="" style={{width:"28px",height:"28px",borderRadius:"50%",border:`1px solid rgba(184,150,106,.4)`}}/>
                <span style={{fontSize:"13px",color:`rgba(232,212,176,.7)`,fontStyle:"italic"}}>Bienvenida, {nombre} ✦</span>
                <button onClick={handleLogout} style={{background:"transparent",border:`1px solid rgba(184,150,106,.2)`,borderRadius:"8px",padding:"4px 10px",color:`rgba(184,150,106,.5)`,fontSize:"11px",cursor:"pointer",fontFamily:"serif"}}>Salir</button>
              </div>
              <div style={{display:"inline-block",padding:"6px 16px",background:`rgba(184,150,106,.08)`,border:`1px solid rgba(184,150,106,.2)`,borderRadius:"20px",fontSize:"12px",fontFamily:"serif",letterSpacing:"2px",color:gold}}>
                {restantes > 0 ? `✦ ${restantes} consulta${restantes!==1?"s":""} restante${restantes!==1?"s":""}` : "✦ Consultas agotadas"}
              </div>
            </div>
          ) : (
            <div style={{marginTop:"14px"}}>
              <div style={{display:"inline-block",padding:"6px 16px",background:`rgba(184,150,106,.08)`,border:`1px solid rgba(184,150,106,.2)`,borderRadius:"20px",fontSize:"12px",fontFamily:"serif",letterSpacing:"2px",color:gold}}>
                ✦ 3 consultas gratuitas
              </div>
            </div>
          )}
        </header>

        {/* ── LOGIN (si no hay usuario) ── */}
        {!user && (
          <div style={{animation:"fade-up .8s ease"}}>
            <div style={s.card}>
              <div style={{textAlign:"center",marginBottom:"24px",fontSize:"40px",animation:"moon-float 6s ease-in-out infinite",display:"inline-block",width:"100%"}}>🌙</div>
              <h2 style={{fontFamily:"serif",fontSize:"clamp(16px,3vw,22px)",textAlign:"center",color:"#e8d4b0",marginBottom:"10px",letterSpacing:"2px"}}>Bienvenida al Oráculo</h2>
              <p style={{textAlign:"center",fontSize:"clamp(14px,2.5vw,16px)",fontStyle:"italic",color:"rgba(232,212,176,.7)",marginBottom:"28px",lineHeight:1.9}}>
                Inicia sesión con Google para que las cartas<br/>te conozcan y guarden tu historial de consultas.
              </p>
              <button onClick={handleLogin} style={{...s.btn(true), display:"flex", alignItems:"center", justifyContent:"center", gap:"10px"}}>
                <span style={{fontSize:"18px"}}>G</span>
                <span>ENTRAR CON GOOGLE</span>
              </button>
              <p style={{textAlign:"center",fontSize:"11px",color:`rgba(184,150,106,.3)`,marginTop:"14px",fontStyle:"italic"}}>Tus primeras 3 consultas son completamente gratuitas</p>
            </div>
          </div>
        )}

        {/* ── INPUT ── */}
        {user && stage==="input" && (
          <div style={{animation:"fade-up .8s ease"}}>
            <div style={s.card}>
              <div style={{textAlign:"center",marginBottom:"22px",fontSize:"34px",animation:"moon-float 6s ease-in-out infinite",display:"inline-block",width:"100%"}}>🌙</div>
              <p style={{textAlign:"center",fontSize:"clamp(14px,2.5vw,16px)",fontStyle:"italic",color:"rgba(232,212,176,.7)",marginBottom:"26px",lineHeight:1.9,maxWidth:"420px",margin:"0 auto 26px"}}>
                Cierra los ojos un momento. Respira profundo.<br/>
                Formula tu pregunta con el corazón.
              </p>
              <textarea value={question} onChange={e=>setQuestion(e.target.value)}
                placeholder="¿Qué necesitas saber hoy?..." rows={4}
                style={{...s.input, resize:"none"}}/>
              <button onClick={handleReveal} disabled={!question.trim()||restantes<=0} style={s.btn(question.trim()&&restantes>0)}>
                ✦ &nbsp; REVELAR LOS ARCANOS &nbsp; ✦
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {user && stage==="loading" && <LoadingScreen msg={loadingMsg}/>}

        {/* ── REVEAL + RESULT ── */}
        {user && (stage==="reveal"||stage==="result") && (
          <div style={{animation:"fade-up .6s ease"}}>
            <div style={{textAlign:"center",marginBottom:"32px",padding:"14px 22px",background:"rgba(184,150,106,.05)",border:`1px solid rgba(184,150,106,.12)`,borderRadius:"14px"}}>
              <div style={{fontSize:"10px",letterSpacing:"4px",color:`rgba(184,150,106,.4)`,marginBottom:"6px",fontFamily:"serif"}}>TU PREGUNTA</div>
              <div style={{fontStyle:"italic",fontSize:"clamp(14px,2vw,16px)",color:"#e8d4b0",lineHeight:1.6}}>"{question}"</div>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:"clamp(12px,4vw,42px)",flexWrap:"wrap",marginBottom:"40px"}}>
              {cards.map((card,i)=><TarotCard key={card.id} card={card} position={POSITIONS[i]} revealed={revealed} delay={i*380}/>)}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"24px"}}>
              <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,transparent,rgba(184,150,106,.25))"}}/>
              <div style={{fontSize:"16px",color:`rgba(184,150,106,.4)`}}>✦</div>
              <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,rgba(184,150,106,.25),transparent)"}}/>
            </div>
            {stage==="result" && cardReadings.length>0 && (
              <div style={{display:"flex",flexDirection:"column",gap:"14px",marginBottom:"20px"}}>
                {cardReadings.map((r,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,.02)",border:`1px solid rgba(184,150,106,.1)`,borderRadius:"16px",padding:"20px 22px",animation:`fade-up .7s ease ${i*160}ms both`,display:"flex",gap:"16px",alignItems:"flex-start"}}>
                    <div style={{flexShrink:0}}><CardFace card={cards[i]} size={50}/></div>
                    <div>
                      <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"7px",flexWrap:"wrap"}}>
                        <span style={{fontSize:"10px",letterSpacing:"3px",color:`rgba(184,150,106,.45)`,fontFamily:"serif"}}>{r.position}</span>
                        <span style={{width:"1px",height:"10px",background:`rgba(184,150,106,.2)`}}/>
                        <span style={{fontSize:"13px",fontFamily:"serif",fontWeight:"bold",color:"#e8d4b0"}}>{r.name}</span>
                      </div>
                      <p style={{fontSize:"14px",lineHeight:1.85,color:"rgba(232,212,176,.8)",fontStyle:"italic",margin:0}}>{r.reading}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {stage==="result" && synthesis && (
              <div style={{background:"linear-gradient(135deg,rgba(184,150,106,.07),rgba(90,40,140,.05))",border:`1px solid rgba(184,150,106,.2)`,borderRadius:"20px",padding:"26px 30px",marginBottom:"26px",animation:"fade-up .8s ease .5s both"}}>
                <div style={{textAlign:"center",marginBottom:"16px",fontFamily:"serif",fontSize:"11px",letterSpacing:"4px",color:gold}}>✦ &nbsp; EL MENSAJE DE LAS CARTAS &nbsp; ✦</div>
                <p style={{fontSize:"clamp(14px,2.2vw,16px)",lineHeight:2,color:"#f0e4c8",textAlign:"center",margin:0,fontWeight:"500"}}>{synthesis}</p>
              </div>
            )}
            {stage==="result" && synthesis && (
              <div style={{textAlign:"center",animation:"fade-up .6s ease .85s both"}}>
                <button onClick={handleNewQuestion} style={{padding:"13px 38px",background:"transparent",border:`1px solid rgba(184,150,106,.28)`,borderRadius:"12px",color:`rgba(184,150,106,.6)`,fontFamily:"serif",fontSize:"11px",letterSpacing:"3px",cursor:"pointer"}}>
                  ✦ &nbsp; NUEVA CONSULTA &nbsp; ✦
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PAYWALL ── */}
        {user && stage==="paywall" && (
          <div style={{animation:"fade-up .8s ease"}}>
            <div style={{...s.card, textAlign:"center", animation:"pulse 3s ease infinite"}}>
              <div style={{fontSize:"40px",marginBottom:"16px",animation:"moon-float 5s ease-in-out infinite",display:"inline-block"}}>🔮</div>
              <h2 style={{fontFamily:"serif",fontSize:"clamp(16px,3.5vw,22px)",color:"#e8d4b0",marginBottom:"12px",letterSpacing:"2px"}}>Las cartas tienen más que decirte</h2>
              <p style={{fontSize:"clamp(13px,2vw,15px)",fontStyle:"italic",color:"rgba(232,212,176,.72)",lineHeight:1.9,marginBottom:"24px",maxWidth:"380px",margin:"0 auto 24px"}}>
                {nombre}, tus consultas gratuitas han concluido. Desbloquea {PREGUNTAS_BONUS} lecturas más y deja que el oráculo te acompañe.
              </p>
              <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",padding:"16px 28px",background:`rgba(184,150,106,.1)`,border:`1px solid rgba(184,150,106,.28)`,borderRadius:"16px",marginBottom:"22px"}}>
                <div style={{fontFamily:"serif",fontSize:"10px",letterSpacing:"3px",color:`rgba(184,150,106,.55)`,marginBottom:"5px"}}>INVERSIÓN</div>
                <div style={{fontFamily:"serif",fontSize:"36px",color:"#e8c870",lineHeight:1,fontWeight:"bold"}}>$50</div>
                <div style={{fontSize:"11px",color:`rgba(184,150,106,.5)`,letterSpacing:"2px",marginTop:"3px"}}>MXN · {PREGUNTAS_BONUS} consultas</div>
                <div style={{fontSize:"10px",color:`rgba(184,150,106,.35)`,marginTop:"4px",fontStyle:"italic"}}>≈ $17 MXN por lectura</div>
              </div>
              <div style={{marginBottom:"16px"}}><PayPalButton onSuccess={handlePaySuccess}/></div>
              <div style={{display:"flex",justifyContent:"center",gap:"16px",fontSize:"11px",color:`rgba(184,150,106,.35)`,flexWrap:"wrap"}}>
                <span>🔒 Pago seguro</span><span>🌍 Internacional</span><span>⚡ Acceso inmediato</span>
              </div>
            </div>
          </div>
        )}

        <div style={{textAlign:"center",marginTop:"56px",color:`rgba(184,150,106,.15)`,fontSize:"11px",letterSpacing:"3px",textTransform:"uppercase",fontFamily:"serif"}}>
          22 Arcanos Mayores · Oráculo del Tarot
        </div>
      </div>
    </div>
  );
}
