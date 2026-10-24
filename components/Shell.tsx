"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRightLeft, CalendarRange, History, Home, KeyRound, Link2, Menu, PlugZap, RotateCcw, Tags, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Backdrop } from "./three/Scenes";
import { Modal, Toasts, Btn } from "./ui";

const NAV = [
  { href: "/", label: "Resumen", icon: Home },
  { href: "/inventario", label: "Inventario", icon: CalendarRange },
  { href: "/emparejado", label: "Emparejado", icon: Link2 },
  { href: "/tarifas", label: "Tarifas", icon: Tags },
  { href: "/conexion", label: "Conexión", icon: PlugZap },
  { href: "/historial", label: "Historial", icon: History },
];

function Marca({ chica }: { chica?: boolean }) {
  return (
    <span className={`brand ${chica ? "brand-chica" : ""}`}>
      <span className="brand-mark">
        <KeyRound size={chica ? 15 : 19} />
      </span>
      <span>
        Relevo
        {!chica && <small>Traspaso de Airbnb a Smoobu</small>}
      </span>
    </span>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { db, reiniciar } = useStore();
  const [menu, setMenu] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    setMenu(false);
  }, [path]);

  const activo = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const conectada = db?.conexion.estado === "conectada";

  return (
    <>
      <Backdrop />
      <div className="app">
        <header className="top">
          <div className="top-in">
            <button className="icon-btn burger" onClick={() => setMenu(true)} aria-label="Abrir menú">
              <Menu size={20} />
            </button>
            <Link href="/" aria-label="Relevo, resumen">
              <Marca />
            </Link>
            <nav className="nav" aria-label="Principal">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={activo(n.href) ? "on" : ""}>
                  <n.icon size={16} />
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="top-der">
              {db ? (
                <span className={`pill-estado ${conectada ? "ok" : "warn"}`}>
                  <i className="dot" />
                  {conectada ? "Conectada" : "Sin conectar"}
                </span>
              ) : (
                <span className="pill-estado skel" style={{ width: 118 }} />
              )}
              <button className="icon-btn" onClick={() => setConfirmar(true)} aria-label="Restablecer escenario" title="Restablecer escenario">
                <RotateCcw size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className={`scrim ${menu ? "show" : ""}`} onClick={() => setMenu(false)} />
        <aside className={`menu-lateral ${menu ? "open" : ""}`} aria-hidden={!menu}>
          <div className="menu-top">
            <Marca />
            <button className="icon-btn" onClick={() => setMenu(false)} aria-label="Cerrar menú">
              <X size={20} />
            </button>
          </div>
          <nav className="menu-nav">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={activo(n.href) ? "on" : ""}>
                <n.icon size={18} />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="menu-pie">
            <ArrowRightLeft size={16} />
            <span>Airbnb sigue publicando. Lo que cambia es quién manda en el calendario.</span>
          </div>
        </aside>

        <main className="main">{children}</main>

        <footer className="foot">
          <div className="foot-in">
            <Marca chica />
            <span className="muted">Traspaso de calendarios, tarifas y reservas · © 2026</span>
            <span className="muted small">Fotos: Unsplash</span>
          </div>
        </footer>
      </div>
      <Modal
        abierto={confirmar}
        titulo="Restablecer el escenario"
        onCerrar={() => setConfirmar(false)}
        pie={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
            <Btn
              className="btn-primary"
              onClick={() => {
                setConfirmar(false);
                reiniciar();
              }}
            >
              <RotateCcw size={16} />
              Restablecer
            </Btn>
          </>
        }
      >
        <p>La cuenta vuelve al punto de partida: bloqueos sin cargar, los dos departamentos del piso 2 cruzados, tarifas sin traer y sin conexión. Sirve para recorrer el traspaso de nuevo.</p>
      </Modal>
      <Toasts />
    </>
  );
}
