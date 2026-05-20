import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RotateCcw, X, Settings, Activity, ArrowLeft, Trash2, Zap } from "lucide-react";

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
  const [clockHold, setClockHold] = useState(false);
  const holdRef = useRef<number | null>(null);

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

  const resetOne = (id: string) =>
    setActive((a) => a.map((x) => (x.id === id ? { ...x, startedAt: Date.now() } : x)));
  const removeOne = (id: string) => setActive((a) => a.filter((x) => x.id !== id));

  const addTemplate = (name: string, pieces: number, minutes: number) => {
    if (!name.trim() || pieces <= 0 || minutes <= 0) return;
    setTemplates((t) => [...t, { id: uid(), name: name.trim(), pieces, minutes }]);
  };
  const delTemplate = (id: string) => setTemplates((t) => t.filter((x) => x.id !== id));

  // Long-press clock for easter egg
  const startHold = () => {
    holdRef.current = window.setTimeout(() => {
      setTab("egg");
      setClockHold(false);
    }, 900);
    setClockHold(true);
  };
  const endHold = () => {
    if (holdRef.current) clearTimeout(holdRef.current);
    holdRef.current = null;
    setClockHold(false);
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
            <div className="flex items-center justify-between px-2 h-6 border-b border-[color:var(--panel-border)] bg-[color:var(--panel)]">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--safe)] animate-pulse" />
                <span className="text-[8px] tracking-widest text-[color:var(--muted-foreground)]">LINEA·A3</span>
              </div>
              <button
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerLeave={endHold}
                className={`font-mono text-[11px] px-1 rounded transition ${clockHold ? "bg-[color:var(--accent)]/30 text-[color:var(--accent)]" : "text-[color:var(--foreground)]"}`}
              >
                {clock}
              </button>
            </div>

            {/* Body */}
            <div className="h-[calc(320px-24px-22px)] overflow-y-auto no-scrollbar">
              {tab === "monitor" && (
                <Monitor templates={templates} active={active} now={now} onLaunch={launch} onReset={resetOne} onRemove={removeOne} />
              )}
              {tab === "config" && (
                <Config templates={templates} onAdd={addTemplate} onDelete={delTemplate} />
              )}
              {tab === "egg" && <EasterEgg onBack={() => setTab("monitor")} />}
            </div>

            {/* Bottom nav */}
            {tab !== "egg" && (
              <div className="absolute bottom-0 left-0 right-0 h-[22px] flex border-t border-[color:var(--panel-border)] bg-[color:var(--panel)]">
                <NavBtn active={tab === "monitor"} onClick={() => setTab("monitor")} icon={<Activity size={11} />} label="MONITOR" />
                <NavBtn active={tab === "config"} onClick={() => setTab("config")} icon={<Settings size={11} />} label="CONFIG" />
              </div>
            )}
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
      className={`flex-1 flex items-center justify-center gap-1 text-[8px] tracking-widest transition ${
        active ? "text-[color:var(--accent)] bg-[color:var(--accent)]/10" : "text-[color:var(--muted-foreground)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Monitor({
  templates, active, now, onLaunch, onReset, onRemove,
}: {
  templates: Template[]; active: Active[]; now: number;
  onLaunch: (t: Template) => void; onReset: (id: string) => void; onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {/* Launch pad */}
      <div className="px-1.5 pt-1.5 pb-1 border-b border-[color:var(--panel-border)]">
        <div className="text-[7px] tracking-[0.2em] text-[color:var(--muted-foreground)] mb-1 px-0.5">LANZAMIENTO</div>
        <div className="grid grid-cols-2 gap-1">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => onLaunch(t)}
              className="group bg-[color:var(--muted)] border border-[color:var(--panel-border)] rounded px-1 py-1 text-left active:bg-[color:var(--accent)]/20 active:border-[color:var(--accent)] transition"
            >
              <div className="flex items-center gap-1">
                <Plus size={9} className="text-[color:var(--accent)]" />
                <div className="text-[9px] font-semibold truncate">{t.name}</div>
              </div>
              <div className="text-[7px] text-[color:var(--muted-foreground)] tracking-wider">
                {t.pieces}u·{t.minutes}m
              </div>
            </button>
          ))}
          {templates.length === 0 && (
            <div className="col-span-2 text-[8px] text-[color:var(--muted-foreground)] text-center py-2">
              Sin plantillas. Ve a CONFIG.
            </div>
          )}
        </div>
      </div>

      {/* Active list */}
      <div className="px-1.5 pt-1 pb-2">
        <div className="text-[7px] tracking-[0.2em] text-[color:var(--muted-foreground)] mb-1 px-0.5 flex justify-between">
          <span>ACTIVOS</span><span>{active.length}</span>
        </div>
        {active.length === 0 ? (
          <div className="text-[8px] text-[color:var(--muted-foreground)] text-center py-3 border border-dashed border-[color:var(--panel-border)] rounded">
            Sin carros activos
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {active.map((a) => (
              <ActiveRow key={a.id} a={a} now={now} onReset={() => onReset(a.id)} onRemove={() => onRemove(a.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveRow({ a, now, onReset, onRemove }: { a: Active; now: number; onReset: () => void; onRemove: () => void }) {
  const elapsed = Math.floor((now - a.startedAt) / 1000);
  const remaining = Math.max(0, a.totalSec - elapsed);
  const pct = Math.max(0, Math.min(1, remaining / a.totalSec));
  const piecesLeft = Math.max(0, Math.ceil(a.pieces * pct));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const alert = remaining <= 0;
  const color = alert ? "var(--danger)" : pct > 0.25 ? "var(--safe)" : "var(--warn)";

  return (
    <div
      className={`relative rounded border ${alert ? "alert-blink border-[color:var(--danger)]" : "border-[color:var(--panel-border)] bg-[color:var(--muted)]"} px-1.5 py-1`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="text-[9px] font-semibold truncate flex items-center gap-1">
          {alert && <Zap size={9} className="text-white" />}
          {a.name}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onReset} className="p-0.5 rounded bg-black/40 active:bg-[color:var(--accent)]/40">
            <RotateCcw size={9} />
          </button>
          <button onClick={onRemove} className="p-0.5 rounded bg-black/40 active:bg-[color:var(--danger)]/40">
            <X size={9} />
          </button>
        </div>
      </div>

      {alert ? (
        <div className="text-[8px] font-bold text-white tracking-wider mt-0.5">
          ¡ALERTA REAPROVISIONAMIENTO!
        </div>
      ) : (
        <div className="flex items-baseline justify-between mt-0.5">
          <div className="font-mono text-[16px] leading-none font-bold" style={{ color }}>
            {mm}:{ss}
          </div>
          <div className="text-[8px] text-[color:var(--muted-foreground)]">
            <span style={{ color }} className="font-bold">{piecesLeft}</span>/{a.pieces} u
          </div>
        </div>
      )}

      <div className="mt-1 h-1 rounded-full bg-black/60 overflow-hidden">
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
    <div className="px-1.5 pt-1.5 pb-2">
      <div className="text-[7px] tracking-[0.2em] text-[color:var(--muted-foreground)] mb-1 px-0.5">PLANTILLAS</div>
      <div className="flex flex-col gap-1 mb-2">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-[color:var(--muted)] border border-[color:var(--panel-border)] rounded px-1.5 py-1">
            <div className="min-w-0">
              <div className="text-[9px] font-semibold truncate">{t.name}</div>
              <div className="text-[7px] text-[color:var(--muted-foreground)]">{t.pieces}u · {t.minutes}min</div>
            </div>
            <button onClick={() => onDelete(t.id)} className="p-0.5 rounded bg-black/40 active:bg-[color:var(--danger)]/40">
              <Trash2 size={9} />
            </button>
          </div>
        ))}
      </div>

      <div className="text-[7px] tracking-[0.2em] text-[color:var(--muted-foreground)] mb-1 px-0.5">NUEVA</div>
      <div className="flex flex-col gap-1 bg-[color:var(--muted)] border border-[color:var(--panel-border)] rounded p-1.5">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="bg-black/60 text-[9px] rounded px-1.5 py-1 outline-none border border-transparent focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted-foreground)]"
        />
        <div className="grid grid-cols-2 gap-1">
          <input
            value={pieces} onChange={(e) => setPieces(e.target.value.replace(/\D/g, ""))}
            placeholder="Piezas" inputMode="numeric"
            className="bg-black/60 text-[9px] rounded px-1.5 py-1 outline-none border border-transparent focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted-foreground)]"
          />
          <input
            value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
            placeholder="Min" inputMode="numeric"
            className="bg-black/60 text-[9px] rounded px-1.5 py-1 outline-none border border-transparent focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted-foreground)]"
          />
        </div>
        <button
          onClick={submit}
          className="bg-[color:var(--accent)]/20 border border-[color:var(--accent)] text-[color:var(--accent)] text-[9px] font-bold tracking-widest rounded py-1 active:bg-[color:var(--accent)]/40"
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
      <div className="px-1.5 py-1 border-b border-[color:var(--panel-border)] flex items-center gap-1">
        <button onClick={onBack} className="p-0.5 rounded bg-black/40 active:bg-[color:var(--accent)]/40">
          <ArrowLeft size={11} />
        </button>
        <span className="text-[8px] tracking-widest text-[color:var(--muted-foreground)]">AGV CHAOS</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-3 text-center gap-2">
        <div className="text-[22px]">🪳</div>
        <div className="text-[10px] font-bold text-[color:var(--accent)] tracking-widest">AGV CHAOS</div>
        <div className="text-[8px] text-[color:var(--muted-foreground)] leading-tight">
          Listo para integrar código de Claude
        </div>
      </div>
    </div>
  );
}
