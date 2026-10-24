"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { foto } from "@/lib/photos";
import type { Propiedad } from "@/lib/types";

export function Toasts() {
  const { toasts, fecharToast } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tono}`}>
          {t.tono === "ok" ? <CheckCircle2 size={18} /> : t.tono === "err" ? <AlertTriangle size={18} /> : <Info size={18} />}
          <span>{t.texto}</span>
          <button className="toast-x" onClick={() => fecharToast(t.id)} aria-label="Cerrar aviso">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Modal({ abierto, titulo, onCerrar, children, pie, ancho }: { abierto: boolean; titulo: string; onCerrar: () => void; children: ReactNode; pie?: ReactNode; ancho?: boolean }) {
  useEffect(() => {
    if (!abierto) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  return (
    <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className={`modal ${ancho ? "modal-ancho" : ""}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal-top">
          <h3>{titulo}</h3>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-cuerpo">{children}</div>
        {pie && <div className="modal-pie">{pie}</div>}
      </div>
    </div>
  );
}

export function Panel({ abierto, onCerrar, titulo, children }: { abierto: boolean; onCerrar: () => void; titulo: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!abierto) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, [abierto, onCerrar]);
  return (
    <>
      <div className={`scrim ${abierto ? "show" : ""}`} onClick={onCerrar} />
      <aside className={`panel ${abierto ? "open" : ""}`} aria-hidden={!abierto}>
        <div className="panel-top">
          <div className="panel-titulo">{titulo}</div>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar panel">
            <X size={18} />
          </button>
        </div>
        <div className="panel-cuerpo">{abierto && children}</div>
      </aside>
    </>
  );
}

export const Skel = ({ h = 16, w = "100%", r = 10, style }: { h?: number; w?: number | string; r?: number; style?: CSSProperties }) => <div className="skel" style={{ height: h, width: w, borderRadius: r, ...style }} />;

export function Barra({ valor, max, tono = "accent" }: { valor: number; max: number; tono?: "accent" | "ok" | "warn" | "err" | "clay" }) {
  const p = Math.max(0, Math.min(1, max ? valor / max : 0));
  return (
    <div className="barra" aria-hidden="true">
      <span className={`t-${tono}`} style={{ width: `${p * 100}%` }} />
    </div>
  );
}

/** tarjeta que se inclina en perspectiva real bajo el puntero, con la luz siguiéndolo */
export function Tilt({ children, className = "", fuerza = 7, style }: { children: ReactNode; className?: string; fuerza?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef(0);
  const mover = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${(-y * fuerza).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * fuerza).toFixed(2)}deg`);
      el.style.setProperty("--lx", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--ly", `${((y + 0.5) * 100).toFixed(1)}%`);
      el.classList.add("tilting");
    });
  };
  const salir = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.classList.remove("tilting");
  };
  return (
    <div ref={ref} className={`tilt ${className}`} style={style} onPointerMove={mover} onPointerLeave={salir}>
      {children}
      <span className="tilt-luz" aria-hidden="true" />
    </div>
  );
}

export function Vacio({ icono, titulo, texto, accion }: { icono: ReactNode; titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <div className="vacio">
      <div className="vacio-ic">{icono}</div>
      <b>{titulo}</b>
      <p>{texto}</p>
      {accion}
    </div>
  );
}

export function Btn({ children, cargando, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { cargando?: boolean }) {
  return (
    <button {...rest} className={`btn ${className}`} disabled={rest.disabled || cargando}>
      {cargando && <Loader2 size={16} className="spin" />}
      {children}
    </button>
  );
}

export function Foto({ src, alt, w, h, className = "", style }: { src: string; alt: string; w: number; h: number; className?: string; style?: CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={w} height={h} loading="lazy" decoding="async" className={`foto ${className}`} style={style} />;
}

export function FotoProp({ p, w = 96, h = 72, className = "" }: { p: Propiedad | undefined; w?: number; h?: number; className?: string }) {
  if (!p) return <div className={`foto foto-vacia ${className}`} style={{ width: w, height: h }} />;
  return <Foto src={foto(p.foto, w * 2, h * 2, p.fx)} alt={p.nombre} w={w} h={h} className={className} />;
}

export function Paginas({ pagina, total, onCambio }: { pagina: number; total: number; onCambio: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="paginas">
      <button className="icon-btn" onClick={() => onCambio(pagina - 1)} disabled={pagina <= 1} aria-label="Página anterior">
        <ChevronLeft size={18} />
      </button>
      <span>
        Página <b>{pagina}</b> de {total}
      </span>
      <button className="icon-btn" onClick={() => onCambio(pagina + 1)} disabled={pagina >= total} aria-label="Página siguiente">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function Kpi({ icono, valor, rotulo, nota, tono = "accent" }: { icono: ReactNode; valor: ReactNode; rotulo: string; nota?: ReactNode; tono?: "accent" | "ok" | "warn" | "err" | "clay" }) {
  return (
    <Tilt className={`kpi kpi-${tono}`} fuerza={5}>
      <div className="kpi-ic">{icono}</div>
      <div className="kpi-valor">{valor}</div>
      <div className="kpi-rot">{rotulo}</div>
      {nota && <div className="kpi-nota">{nota}</div>}
    </Tilt>
  );
}
