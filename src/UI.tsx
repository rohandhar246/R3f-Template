import { useEffect, useState, useRef } from "react";

const getHS = () => parseInt(localStorage.getItem("flappy_hs") || "0");
const saveHS = (s: number): boolean => {
  if (s > getHS()) {
    localStorage.setItem("flappy_hs", String(s));
    return true;
  }
  return false;
};

const CAM_LABELS = ["BACK VIEW", "SIDE VIEW"];

export default function UI() {
  type Screen = "start" | "playing" | "gameover";
  const [screen, setScreen] = useState<Screen>("start");
  const [finalScore, setFinalScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [highScore, setHighScore] = useState(getHS);
  const [camIdx, setCamIdx] = useState(() => parseInt(localStorage.getItem("camIndex") || "0"));
  const flashRef = useRef<HTMLDivElement>(null!);

  // ── Event listeners from game world ──────────────────────────────────────
  useEffect(() => {
    const onGameOver = () => {
      const s = parseInt(document.getElementById("score")?.innerText || "0");
      const nb = saveHS(s);
      setFinalScore(s);
      setIsNewBest(nb);
      setHighScore(getHS());

      // Pure Tailwind Red Flash (No Keyframes needed)
      const el = flashRef.current;
      if (el) {
        el.classList.remove("opacity-0");
        el.classList.add("opacity-100");
        setTimeout(() => {
          if (el) el.classList.remove("opacity-100");
          if (el) el.classList.add("opacity-0");
        }, 150);
      }
      setTimeout(() => setScreen("gameover"), 200);
    };
    window.addEventListener("gameOver", onGameOver);
    return () => window.removeEventListener("gameOver", onGameOver);
  }, []);

  const startGame = () => {
    (window as any).gameStatus = "PLAYING";
    setScreen("playing");
  };

  const toggleCam = () => {
    const next = (camIdx + 1) % CAM_LABELS.length;
    setCamIdx(next);
    localStorage.setItem("camIndex", String(next));
    (window as any).camIndex = next;
  };

  return (
    <>
      {/* ── Scanline overlay ───────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{
          background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.035) 2px,rgba(0,0,0,0.035) 4px)"
        }}
      />

      {/* ── Red hit flash (Now using Tailwind Transitions) ─────────────────── */}
      <div ref={flashRef} className="fixed inset-0 bg-red-600/70 pointer-events-none z-[90] opacity-0 transition-opacity duration-150 ease-out" />

      {/* ════════════════════════ START SCREEN ════════════════════════════════ */}
      {screen === "start" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 px-4 bg-black/20 backdrop-blur-[2px]" onClick={startGame}>
          {/* ── Title (CRISP AND READABLE) ── */}
          <div className="text-center z-10 ">
            <p className="font-mono text-l tracking-[0.4em] text-blue-600 font-bold mb-3 uppercase drop-shadow-md">★ Rdeon Presents ★</p>
            <h1
              className="font-black leading-none tracking-tighter text-white"
              style={{
                fontFamily: "'Impact','Arial Black',sans-serif",
                fontSize: "clamp(56px, 14vw, 120px)",
                WebkitTextStroke: "2px #0284c7", // 🔥 Ab text background mein mix nahi hoga
                textShadow: "0 10px 20px rgba(0,0,0,0.8), 0 0 40px rgba(56,189,248,0.6)"
              }}
            >
              FLAPPY BIRD
              <span className="block text-sky-400" style={{ fontSize: "0.62em", letterSpacing: "0.12em", WebkitTextStroke: "2px #005EFF" }}>
                3D
              </span>
            </h1>
          </div>

          {/* ── Stats pill ── */}
          <div className="flex items-center gap-8 px-8 py-4 z-10 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <div className="text-center">
              <div className="font-mono font-black text-sky-400 tabular-nums drop-shadow-lg" style={{ fontSize: "clamp(24px, 6vw, 36px)" }}>
                {highScore}
              </div>
              <div className="text-[11px] tracking-[0.25em] text-white/50 font-bold uppercase mt-0.5">Best</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="font-mono font-black text-white drop-shadow-lg" style={{ fontSize: "clamp(24px, 6vw, 36px)" }}>
                TAP
              </div>
              <div className="text-[11px] tracking-[0.25em] text-white/50 font-bold uppercase mt-0.5">To fly</div>
            </div>
          </div>

          {/* ── CTA buttons (Native Tailwind, Zero JS hacks) ── */}
          <div className="flex flex-col items-center gap-4 z-10 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="flex items-center justify-center gap-2 text-white font-black rounded-full px-12 py-5 text-xl tracking-wider outline-none transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.6),_0_8px_0_#1e3a8a]"
            >
              ▶ START GAME
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCam();
              }}
              className="px-6 py-3 text-white/80 font-bold text-sm tracking-widest bg-black/40 border border-white/10 hover:bg-white/10 hover:text-white active:scale-95 rounded-full transition-all duration-200 shadow-lg backdrop-blur-md"
            >
              📷 {CAM_LABELS[camIdx]}
            </button>
          </div>

          {/* ── Controls hint ── */}
          <div className="z-10 mt-4 animate-bounce">
            <div className="px-6 py-3 flex gap-4 text-[12px] text-white/60 tracking-[0.15em] font-bold bg-black/30 rounded-full border border-white/5 backdrop-blur-sm shadow-md">
              <span>⌨ SPACE</span>
              <span className="text-white/20">•</span>
              <span>📱 TAP SCREEN</span>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════ GAME OVER SCREEN ════════════════════════════ */}
      {screen === "gameover" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 px-5 bg-black/60 backdrop-blur-md transition-all duration-500">
          {/* CRASHED TITLE */}
          <div className="text-center mt-[-5vh] animate-bounce">
            <h1
              className="font-black leading-none text-white tracking-tighter"
              style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: "clamp(56px, 15vw, 120px)",
                WebkitTextStroke: "3px #b91c1c", // Dark red outline
                textShadow: "0 10px 25px rgba(220,38,38,0.8), 0 6px 0px #7f1d1d"
              }}
            >
              CRASHED
            </h1>
          </div>

          {/* SCORE CARD */}
          <div className="px-8 py-8 text-center w-full max-w-[340px] bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 relative rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
            {/* New Best Banner */}
            {isNewBest && (
              <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-yellow-500/0 via-yellow-400 to-yellow-500/0 py-1.5 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                <p className="font-mono font-black text-slate-900 text-[11px] tracking-[0.4em] uppercase">★ New Best ★</p>
              </div>
            )}

            <p className="text-white/50 text-[12px] tracking-[0.3em] font-bold uppercase mt-4 mb-1 drop-shadow-md">Score</p>
            <div
              className="text-white font-black tabular-nums tracking-tight"
              style={{
                fontFamily: "'Impact', monospace",
                fontSize: "clamp(72px, 18vw, 96px)",
                lineHeight: 1,
                WebkitTextStroke: "1px #334155",
                textShadow: "0 8px 20px rgba(0,0,0,0.6)"
              }}
            >
              {finalScore}
            </div>

            <div className="h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0 my-6" />

            <div className="flex justify-between px-2">
              <div className="text-center w-1/2 border-r border-white/10">
                <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-1">Best</p>
                <p className="text-sky-400 font-black font-mono text-4xl tabular-nums drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">{highScore}</p>
              </div>
              <div className="text-center w-1/2">
                <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-1">Pipes</p>
                <p className="text-white/90 font-black font-mono text-4xl tabular-nums drop-shadow-md">{Math.max(0, Math.floor(finalScore * 0.9))}</p>
              </div>
            </div>
          </div>

          {/* RETRY BUTTON */}
          <div className="flex flex-col items-center gap-3 mt-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-3 text-white font-black rounded-full px-14 py-5 text-2xl tracking-wide outline-none transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.5),_0_8px_0_#7f1d1d]"
            >
              <span className="text-3xl mb-1">↻</span> RETRY
            </button>
          </div>
        </div>
      )}
    </>
  );
}
