import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Settings, Activity, ArrowLeft, Trash2, Zap } from "lucide-react";
import hysterOperator from "@/assets/hyster-operator.png";

export const Route = createFileRoute("/")({
  component: Device,
});

type Template = { id: string; name: string; pieces: number; minutes: number };
type Active = { id: string; templateId: string; name: string; pieces: number; totalSec: number; startedAt: number };

const DEFAULT_TEMPLATES: Template[] = [
  { id: "t-luces", name: "Luces", pieces: 24, minutes: 20 },
  { id: "t-manecillas", name: "Manecillas", pieces: 10, minutes: 15 },
  { id: "t-techos", name: "Techos", pieces: 3, minutes: 30 },
];

const uid = () => Math.random().toString(36).slice(2, 9);

function Device() {
  const [tab, setTab] = useState<"monitor" | "config" | "egg">("monitor");
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [active, setActive] = useState<Active[]>([]);
  const [now, setNow] = useState(Date.now());
  const [holdProgress, setHoldProgress] = useState(0); // 0..1
  const holdRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const HOLD_MS = 5000;

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, []);

  const launch = (t: Template) => {
    setActive((a) => [
      ...a,
      { id: uid(), templateId: t.id, name: t.name, pieces: t.pieces, totalSec: t.minutes * 60, startedAt: Date.now() },
    ]);
  };

  const removeOne = (id: string) => setActive((a) => a.filter((x) => x.id !== id));

  const addTemplate = (name: string, pieces: number, minutes: number) => {
    if (!name.trim() || pieces <= 0 || minutes <= 0) return;
    setTemplates((t) => [...t, { id: uid(), name: name.trim(), pieces, minutes }]);
  };
  const delTemplate = (id: string) => setTemplates((t) => t.filter((x) => x.id !== id));

  // Long-press operator icon (5s) for easter egg
  const startHold = () => {
    holdStartRef.current = Date.now();
    holdRef.current = window.setInterval(() => {
      const elapsed = Date.now() - (holdStartRef.current ?? Date.now());
      const p = Math.min(1, elapsed / HOLD_MS);
      setHoldProgress(p);
      if (p >= 1) {
        endHold();
        setTab("egg");
      }
    }, 60);
  };
  const endHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = null;
    holdStartRef.current = null;
    setHoldProgress(0);
  };

  const clock = new Date(now).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,#0a0a0a,#000)]">
      <div className="flex flex-col items-center gap-6">
        {/* Bezel scaled x2 for usability */}
        <div style={{ width: 420, height: 760 }} className="relative">
          <div
            className="relative rounded-[28px] bg-neutral-950 p-3 shadow-[0_0_60px_rgba(0,229,255,0.08),inset_0_0_0_1px_#1a1a1a] origin-top-left"
            style={{ width: 210, height: 380, transform: "scale(2)" }}
          >
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.3em] text-neutral-700">
            LILYGO • T-DISPLAY-S3
          </div>
          <div
            className="relative overflow-hidden rounded-[6px] bg-black scanline"
            style={{ width: 170, height: 320, margin: "20px auto 0" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-2 h-7 border-b border-[color:var(--panel-border)] bg-[color:var(--panel)]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--safe)] animate-pulse" />
                <span className="text-[10px] tracking-widest text-[color:var(--muted-foreground)]">SNLK</span>
                <button
                  onClick={() => setTab("egg")}
                  aria-label="Operador Hyster"
                  className="p-0 rounded active:bg-[color:var(--accent)]/30 transition"
                >
                  <img
                    src={hysterOperator}
                    alt=""
                    width={20}
                    height={20}
                    className="block"
                    style={{ imageRendering: "pixelated", objectFit: "contain" }}
                    draggable={false}
                  />
                </button>
              </div>
              <button
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerLeave={endHold}
                className={`font-mono text-[14px] font-bold px-1 rounded transition ${clockHold ? "bg-[color:var(--accent)]/30 text-[color:var(--accent)]" : "text-[color:var(--foreground)]"}`}
              >
                {clock}
              </button>
            </div>

            {/* Body */}
            <div className="h-[calc(320px-28px-32px)] overflow-y-auto no-scrollbar">
              {tab === "monitor" && (
                <Monitor templates={templates} active={active} now={now} onLaunch={launch} onRemove={removeOne} />
              )}
              {tab === "config" && (
                <Config templates={templates} onAdd={addTemplate} onDelete={delTemplate} />
              )}
              {tab === "egg" && <EasterEgg onBack={() => setTab("monitor")} />}
            </div>

            {/* Bottom nav */}
            {tab !== "egg" && (
              <div className="absolute bottom-0 left-0 right-0 h-[32px] flex border-t border-[color:var(--panel-border)] bg-[color:var(--panel)]">
                <NavBtn active={tab === "monitor"} onClick={() => setTab("monitor")} icon={<Activity size={14} />} label="MONITOR" />
                <NavBtn active={tab === "config"} onClick={() => setTab("config")} icon={<Settings size={14} />} label="CONFIG" />
              </div>
            )}
          </div>
          </div>
        </div>
        <p className="text-[10px] text-neutral-600 tracking-widest">PROTO · TÁCTIL 170×320</p>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-widest transition ${
        active ? "text-[color:var(--accent)] bg-[color:var(--accent)]/10" : "text-[color:var(--muted-foreground)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Monitor({
  templates, active, now, onLaunch, onRemove,
}: {
  templates: Template[]; active: Active[]; now: number;
  onLaunch: (t: Template) => void; onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {/* Launch pad */}
      <div className="px-2 pt-2 pb-2 border-b border-[color:var(--panel-char)]" style={{ borderColor: "var(--panel-border)" }}>
        <div className="text-[10px] tracking-[0.2em] text-[color:var(--muted-foreground)] mb-1.5">LANZAR</div>
        <div className="flex flex-col gap-1.5">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => onLaunch(t)}
              className="bg-[color:var(--muted)] border border-[color:var(--panel-border)] rounded px-2 py-2 text-left active:bg-[color:var(--accent)]/20 active:border-[color:var(--accent)] transition flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Plus size={14} className="text-[color:var(--accent)] shrink-0" />
                <div className="text-[13px] font-semibold truncate">{t.name}</div>
              </div>
              <div className="text-[10px] text-[color:var(--muted-foreground)] tracking-wider shrink-0">
                {t.pieces}u·{t.minutes}m
              </div>
            </button>
          ))}
          {templates.length === 0 && (
            <div className="text-[11px] text-[color:var(--muted-foreground)] text-center py-2">
              Sin plantillas. Ve a CONFIG.
            </div>
          )}
        </div>
      </div>

      {/* Active list */}
      <div className="px-2 pt-2 pb-2">
        <div className="text-[10px] tracking-[0.2em] text-[color:var(--muted-foreground)] mb-1.5 flex justify-between">
          <span>ACTIVOS</span><span>{active.length}</span>
        </div>
        {active.length === 0 ? (
          <div className="text-[11px] text-[color:var(--muted-foreground)] text-center py-4 border border-dashed border-[color:var(--panel-border)] rounded">
            Sin carros activos
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {active.map((a) => (
              <ActiveRow key={a.id} a={a} now={now} onRemove={() => onRemove(a.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveRow({ a, now, onRemove }: { a: Active; now: number; onRemove: () => void }) {
  const elapsed = Math.floor((now - a.startedAt) / 1000);
  const remaining = Math.max(0, a.totalSec - elapsed);
  const pct = Math.max(0, Math.min(1, remaining / a.totalSec));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const alert = remaining <= 0;
  const color = alert ? "var(--danger)" : pct > 0.25 ? "var(--safe)" : "var(--warn)";

  return (
    <div
      className={`relative rounded border ${alert ? "alert-blink border-[color:var(--danger)]" : "border-[color:var(--panel-border)] bg-[color:var(--muted)]"} px-2 py-1.5`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="text-[12px] font-semibold truncate flex items-center gap-1">
          {alert && <Zap size={12} className="text-white" />}
          {a.name}
        </div>
        <button onClick={onRemove} className="p-1 rounded bg-black/40 active:bg-[color:var(--danger)]/40">
          <X size={14} />
        </button>
      </div>

      {alert ? (
        <div className="text-[11px] font-bold text-white tracking-wider">
          ¡REAPROVISIONAR!
        </div>
      ) : (
        <div className="font-mono text-[26px] leading-none font-bold" style={{ color }}>
          {mm}:{ss}
        </div>
      )}

      <div className="mt-1.5 h-1.5 rounded-full bg-black/60 overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Config({
  templates, onAdd, onDelete,
}: { templates: Template[]; onAdd: (n: string, p: number, m: number) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState("");
  const [pieces, setPieces] = useState("");
  const [minutes, setMinutes] = useState("");

  const submit = () => {
    const p = parseInt(pieces, 10), m = parseInt(minutes, 10);
    if (!name.trim() || !p || !m) return;
    onAdd(name, p, m);
    setName(""); setPieces(""); setMinutes("");
  };

  return (
    <div className="px-2 pt-2 pb-3">
      <div className="text-[10px] tracking-[0.2em] text-[color:var(--muted-foreground)] mb-1.5">PLANTILLAS</div>
      <div className="flex flex-col gap-1.5 mb-3">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-[color:var(--muted)] border border-[color:var(--panel-border)] rounded px-2 py-1.5">
            <div className="min-w-0">
              <div className="text-[12px] font-semibold truncate">{t.name}</div>
              <div className="text-[10px] text-[color:var(--muted-foreground)]">{t.pieces}u · {t.minutes}min</div>
            </div>
            <button onClick={() => onDelete(t.id)} className="p-1 rounded bg-black/40 active:bg-[color:var(--danger)]/40">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="text-[10px] tracking-[0.2em] text-[color:var(--muted-foreground)] mb-1.5">NUEVA</div>
      <div className="flex flex-col gap-1.5 bg-[color:var(--muted)] border border-[color:var(--panel-border)] rounded p-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="bg-black/60 text-[13px] rounded px-2 py-1.5 outline-none border border-transparent focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted-foreground)]"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <input
            value={pieces} onChange={(e) => setPieces(e.target.value.replace(/\D/g, ""))}
            placeholder="Piezas" inputMode="numeric"
            className="bg-black/60 text-[13px] rounded px-2 py-1.5 outline-none border border-transparent focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted-foreground)] min-w-0"
          />
          <input
            value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
            placeholder="Min" inputMode="numeric"
            className="bg-black/60 text-[13px] rounded px-2 py-1.5 outline-none border border-transparent focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted-foreground)] min-w-0"
          />
        </div>
        <button
          onClick={submit}
          className="bg-[color:var(--accent)]/20 border border-[color:var(--accent)] text-[color:var(--accent)] text-[12px] font-bold tracking-widest rounded py-2 active:bg-[color:var(--accent)]/40"
        >
          + AÑADIR
        </button>
      </div>
    </div>
  );
}

function EasterEgg({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-2 py-1.5 border-b border-[color:var(--panel-border)] flex items-center gap-2">
        <button onClick={onBack} className="p-1 rounded bg-black/40 active:bg-[color:var(--accent)]/40">
          <ArrowLeft size={16} />
        </button>
        <span className="text-[11px] tracking-widest text-[color:var(--muted-foreground)]">AGV CHAOS</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-3 text-center gap-2">
        <div className="text-[36px]">🪳</div>
        <div className="text-[14px] font-bold text-[color:var(--accent)] tracking-widest">AGV CHAOS</div>
        <div className="text-[10px] text-[color:var(--muted-foreground)] leading-tight">
          Listo para integrar código de Claude
        </div>
      </div>
    </div>
  );
}
