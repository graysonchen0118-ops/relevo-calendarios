"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, CalendarX2, Check, CheckCircle2, Circle, Inbox, Layers, Link2, Loader2, MoveRight, PlugZap, Search, ShieldCheck, Sparkles, Tags, TriangleAlert, Upload, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { celdasFiestas, filasCuadre, NOCHES_FIESTAS, simular, type Celda } from "@/lib/sim";
import { diffDays, fechaConDia, fechaCorta, fechaLarga, noches, plano } from "@/lib/format";
import type { EstadoFila, FilaCuadre } from "@/lib/types";
import { Sync3D } from "@/components/three/Scenes";
import { Barra, Btn, Modal, Paginas, Skel, Vacio } from "@/components/ui";

const TXT_CELDA: Record<Celda, string> = {
  libre: "Libre",
  reserva: "Reserva de Airbnb",
  bloqueo: "Bloqueo a mano, solo en Airbnb",
  cargado: "Bloqueo ya cargado en Smoobu",
  reabierta: "Bloqueo que vuelve a la venta",
  choque: "Dos reservas en la misma noche",
  precio: "Noche alta que sale a precio base o sin revisar",
  cruzada: "Reserva en la fila equivocada o fuera de Smoobu",
};

const PASOS_CONEXION = ["Autorizando la cuenta de Airbnb", "Leyendo los 12 anuncios", "Importando reservas actuales y futuras", "Publicando en Airbnb la disponibilidad de Smoobu"];

export default function Conexion() {
  const { db, conectar } = useStore();
  const [fase, setFase] = useState<"hoy" | "despues">("hoy");
  const [hover, setHover] = useState<{ fila: number; col: number } | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const conectada = db?.conexion.estado === "conectada";
  const conectando = db?.conexion.estado === "conectando";
  const faseVista = conectada ? "despues" : fase;

  const [compacto, setCompacto] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const f = () => setCompacto(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  // en pantallas chicas, solo las noches que más pesan: de Nochebuena al 4 de enero
  const desde = compacto ? NOCHES_FIESTAS.indexOf("2026-12-24") : 0;
  const hasta = compacto ? NOCHES_FIESTAS.indexOf("2027-01-05") : NOCHES_FIESTAS.length;
  const nochesVista = useMemo(() => NOCHES_FIESTAS.slice(desde, hasta), [desde, hasta]);

  const sim = useMemo(() => (db ? simular(db) : null), [db]);
  const filas = useMemo(() => (db ? celdasFiestas(db, faseVista).map((f) => ({ nombre: f.prop.nombre, celdas: f.celdas.slice(desde, hasta) })) : []), [db, faseVista, desde, hasta]);
  const onHover = useCallback((x: { fila: number; col: number } | null) => setHover(x), []);

  if (!db || !sim) {
    return (
      <div className="pagina">
        <div className="pg-head">
          <div>
            <h1>Conexión</h1>
          </div>
        </div>
        <Skel h={480} r={22} />
      </div>
    );
  }

  const info = hover ? { prop: filas[hover.fila]?.nombre, fecha: nochesVista[hover.col], celda: filas[hover.fila]?.celdas[hover.col] } : null;
  const checks = [
    { ok: db.inventarioFirmado, txt: "Inventario de Airbnb firmado", href: "/inventario" },
    { ok: sim.sinComprobar === 0, txt: `Anuncios comprobados con reserva testigo, faltan ${sim.sinComprobar}`, okTxt: "Los 12 anuncios caen en su fila", href: "/emparejado" },
    { ok: sim.reabiertas.length === 0, txt: `Bloqueos a mano sin cargar: ${sim.reabiertas.length}`, okTxt: "Todos los bloqueos están en Smoobu", href: "/inventario" },
    { ok: sim.nochesPrecioBase === 0 && sim.sinRevisar === 0, txt: `Noches altas sin traer o sin revisar: ${sim.nochesPrecioBase + sim.sinRevisar}`, okTxt: "Noches altas revisadas", href: "/tarifas" },
  ];

  return (
    <div className="pagina">
      <div className="pg-head">
        <div>
          <span className="eyebrow">
            <PlugZap size={14} /> Paso 4 y paso 5
          </span>
          <h1>Conexión</h1>
          <p>La primera sincronización publica en Airbnb lo que encuentra en Smoobu, ni más ni menos. Aquí se ve antes de que pase: las fiestas de las doce propiedades, una ficha por noche.</p>
        </div>
      </div>

      {conectada && db.conexion.fecha && (
        <div className={`banda ${sim.reabiertas.length || db.choques.some((c) => !db.resueltas[c.id]) ? "banda-err" : "banda-ok"}`}>
          {db.choques.length ? <TriangleAlert size={20} /> : <ShieldCheck size={20} />}
          <p>
            <b>Conectada.</b> Smoobu maneja los calendarios desde el {fechaLarga(db.conexion.fecha.slice(0, 10))}.{" "}
            {db.choques.length ? `Entraron ${db.choques.length} reservas nuevas de Airbnb sobre noches que estaban bloqueadas a mano. Están abajo, en el cuadre.` : "La primera sincronización salió con todos los bloqueos puestos."}
          </p>
        </div>
      )}

      <section className="sync">
        <div className="sync-barra">
          {!conectada ? (
            <div className="segmento" role="tablist" aria-label="Qué calendario ver">
              <button role="tab" aria-selected={fase === "hoy"} className={fase === "hoy" ? "on" : ""} onClick={() => setFase("hoy")}>
                Hoy en Airbnb
              </button>
              <button role="tab" aria-selected={fase === "despues"} className={fase === "despues" ? "on" : ""} onClick={() => setFase("despues")}>
                Después de conectar
              </button>
            </div>
          ) : (
            <span className="chip chip-ok">
              <Check size={14} /> Calendario publicado por Smoobu
            </span>
          )}
          {!conectada && fase === "hoy" && (
            <button className="btn btn-dark" onClick={() => setFase("despues")}>
              <Layers size={16} /> Simular primera sincronización
            </button>
          )}
        </div>
        <div className="sync-escena">
          <Sync3D key={nochesVista.length} filas={filas} noches={nochesVista} onHover={onHover} />
          <div className={`sync-tip ${info ? "show" : ""}`} aria-live="polite">
            {info && info.celda ? (
              <>
                <b>{info.prop}</b> · {fechaConDia(info.fecha)}
                <span className={`tip-${info.celda}`}>{TXT_CELDA[info.celda]}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="leyenda leyenda-sync">
          {(faseVista === "hoy" ? (["reserva", "bloqueo", "cargado", "libre"] as Celda[]) : (["reserva", "cargado", "reabierta", "choque", "precio", "cruzada", "libre"] as Celda[])).map((c) => (
            <span key={c}>
              <i className={`sw sw-${c}`} /> {TXT_CELDA[c]}
            </span>
          ))}
        </div>
      </section>

      {!conectada && (
        <section className="grid g-2 conexion-bajo">
          <div className="card">
            <div className="card-head">
              <h3>{fase === "despues" ? "Lo que publicaría la primera sincronización" : "Antes de conectar"}</h3>
            </div>
            {fase === "hoy" ? (
              <p className="muted">
                Así se ve hoy el calendario de Airbnb para las fiestas. Las fichas ámbar son noches cerradas a mano: una familia que reservó por WhatsApp, el dueño, una reparación. Toque <b>Simular primera sincronización</b> para ver qué hace Smoobu con ellas.
              </p>
            ) : sim.limpio ? (
              <Vacio icono={<ShieldCheck size={26} />} titulo="Nada que corregir" texto="Cada bloqueo está en Smoobu, las noches altas revisadas y cada reserva cae en su fila." />
            ) : (
              <div className="hallazgos">
                {sim.reabiertas.length > 0 && (
                  <div className="hallazgo h-err">
                    <div className="h-top">
                      <CalendarX2 size={18} />
                      <b>
                        {noches(sim.nochesReabiertas)} vuelven a la venta en Airbnb
                      </b>
                      <Link href="/inventario" className="h-link">
                        Cargar bloqueos <ArrowRight size={14} />
                      </Link>
                    </div>
                    <ul>
                      {sim.choques.slice(0, 5).map((b) => {
                        const p = db.props.find((x) => x.id === db.anuncios.find((a) => a.id === b.anuncio)?.real);
                        return (
                          <li key={b.id}>
                            <b>{p?.nombre}</b>, {fechaCorta(b.inicio)} al {fechaCorta(b.fin)}: {b.nota.split(".")[0]}. Con las noches libres, entraría por Airbnb {b.choque?.huesped} con {b.choque?.personas} personas.
                          </li>
                        );
                      })}
                      {sim.reabiertas.length > sim.choques.slice(0, 5).length && <li className="muted">Y {sim.reabiertas.length - sim.choques.slice(0, 5).length} bloqueos más fuera de las fiestas.</li>}
                    </ul>
                  </div>
                )}
                {sim.nochesPrecioBase + sim.sinRevisar > 0 && (
                  <div className="hallazgo h-clay">
                    <div className="h-top">
                      <Tags size={18} />
                      <b>{noches(sim.nochesPrecioBase + sim.sinRevisar)} altas sin precio revisado</b>
                      <Link href="/tarifas" className="h-link">
                        Revisar tarifas <ArrowRight size={14} />
                      </Link>
                    </div>
                    <ul>
                      {sim.precioBase.slice(0, 4).map(({ prop, noches: ns }) => {
                        const n = ns.find((x) => x.fecha === "2026-12-31") ?? [...ns].sort((x, y) => y.airbnb - x.airbnb)[0];
                        return (
                          <li key={prop.id}>
                            <b>{prop.nombre}</b>: {ns.length === 1 ? "1 noche saldría" : `${ns.length} noches saldrían`} a precio base. {n.etiqueta ?? fechaCorta(n.fecha)} a USD {prop.base} cuando hoy vale USD {n.airbnb}.
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {sim.cruzadas.length + sim.fueraDeSmoobu.length > 0 && (
                  <div className="hallazgo h-cross">
                    <div className="h-top">
                      <Link2 size={18} />
                      <b>{sim.cruzadas.length + sim.fueraDeSmoobu.length} reservas caen mal</b>
                      <Link href="/emparejado" className="h-link">
                        Corregir emparejado <ArrowRight size={14} />
                      </Link>
                    </div>
                    <ul>
                      {sim.cruzadas.length > 0 && <li>{sim.cruzadas.length} reservas de los departamentos del piso 2 caerían cada una en la fila del otro.</li>}
                      {sim.fueraDeSmoobu.length > 0 && <li>{sim.fueraDeSmoobu.length} reservas de anuncios sin emparejar no entrarían a Smoobu.</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Lista para conectar</h3>
            </div>
            <ul className="checklist">
              {checks.map((c) => (
                <li key={c.txt} className={c.ok ? "ok" : ""}>
                  {c.ok ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  <span>{c.ok ? (c.okTxt ?? c.txt) : c.txt}</span>
                  {!c.ok && (
                    <Link href={c.href} className="h-link">
                      Ir <ArrowRight size={13} />
                    </Link>
                  )}
                </li>
              ))}
              <li className="info">
                <Sparkles size={18} />
                <span>Los Precios Inteligentes de Airbnb se apagan solos al conectar.</span>
              </li>
            </ul>
            {conectando ? (
              <div className="conectando">
                {PASOS_CONEXION.map((t, i) => {
                  const paso = db.conexion.paso;
                  const hecho = paso > i + 1;
                  const ahora = paso === i + 1;
                  return (
                    <div key={t} className={`c-paso ${hecho ? "hecho" : ahora ? "ahora" : ""}`}>
                      {hecho ? <CheckCircle2 size={17} /> : ahora ? <Loader2 size={17} className="spin" /> : <Circle size={17} />}
                      {t}
                    </div>
                  );
                })}
              </div>
            ) : (
              <button className={`btn w100 ${sim.limpio ? "btn-primary" : "btn-dark"}`} onClick={() => (sim.limpio ? conectar() : setConfirmar(true))}>
                <PlugZap size={17} /> Conectar ahora
              </button>
            )}
          </div>
        </section>
      )}

      {conectada && <Cuadre />}

      <Modal
        abierto={confirmar}
        titulo="Conectar con pendientes"
        onCerrar={() => setConfirmar(false)}
        pie={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmar(false)}>
              Volver y corregir
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setConfirmar(false);
                setFase("despues");
                conectar();
              }}
            >
              Conectar igual
            </button>
          </>
        }
      >
        <p>Si conecta ahora, la primera sincronización sale con lo que hay en Smoobu:</p>
        <ul className="lista-simple">
          {sim.reabiertas.length > 0 && <li>{noches(sim.nochesReabiertas)} bloqueadas a mano vuelven a la venta en Airbnb.</li>}
          {sim.choques.length > 0 && <li>En {sim.choques.length} de esos bloqueos de las fiestas entra otro huésped por Airbnb.</li>}
          {sim.nochesPrecioBase > 0 && <li>{noches(sim.nochesPrecioBase)} altas salen a precio base.</li>}
          {sim.cruzadas.length + sim.fueraDeSmoobu.length > 0 && <li>{sim.cruzadas.length + sim.fueraDeSmoobu.length} reservas caen en otra fila o quedan fuera.</li>}
        </ul>
        <p className="muted small">Cada choque se resuelve después reubicando a un huésped o cancelando, y cuando el anfitrión cancela, Airbnb cobra una multa y deja un aviso en el anuncio.</p>
      </Modal>
    </div>
  );
}

const ROT: Record<EstadoFila, string> = { ok: "En su lugar", "otra-fila": "Fila equivocada", "sin-importar": "Fuera de Smoobu", reabierta: "Volvió a la venta", choque: "Dos reservas, una noche" };
const POR_PAGINA = 14;

function Cuadre() {
  const { db, ocupado, resolver } = useStore();
  const [filtro, setFiltro] = useState<"problemas" | "todas" | "cuadradas">("problemas");
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(1);
  const [choque, setChoque] = useState<FilaCuadre | null>(null);

  const filas = useMemo(() => (db ? filasCuadre(db) : []), [db]);
  const lista = useMemo(() => {
    const l = filas.filter((f) => {
      const problema = f.estado !== "ok" && !f.resuelta;
      if (filtro === "problemas" && !problema) return false;
      if (filtro === "cuadradas" && problema) return false;
      if (q) {
        const p = db?.props.find((x) => x.id === f.prop)?.nombre ?? "";
        if (!plano(`${f.titulo} ${f.detalle} ${p}`).includes(plano(q))) return false;
      }
      return true;
    });
    // lo urgente primero: dos reservas en una noche, después las noches que volvieron a la venta
    if (filtro !== "problemas") return l;
    const peso: Record<EstadoFila, number> = { choque: 0, reabierta: 1, "otra-fila": 2, "sin-importar": 3, ok: 4 };
    return [...l].sort((x, y) => peso[x.estado] - peso[y.estado] || (x.inicio < y.inicio ? -1 : x.inicio > y.inicio ? 1 : 0));
  }, [filas, filtro, q, db]);
  if (!db) return null;
  const hechas = filas.filter((f) => f.estado === "ok" || f.resuelta).length;
  const problemas = filas.length - hechas;
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pg = Math.min(pagina, paginas);
  const visibles = lista.slice((pg - 1) * POR_PAGINA, pg * POR_PAGINA);
  const prop = (id: string) => db.props.find((p) => p.id === id);

  const accion = (f: FilaCuadre) => {
    const p = prop(f.prop)?.nombre;
    if (f.estado === "otra-fila") return { txt: "Mover a su fila", icon: <MoveRight size={14} />, hacer: () => resolver(f.id, `${f.titulo} movida a la fila de ${p}.`) };
    if (f.estado === "sin-importar") return { txt: "Emparejar e importar", icon: <Link2 size={14} />, hacer: () => resolver(f.id, `${f.titulo} importada a ${p} al emparejar su anuncio.`) };
    if (f.estado === "reabierta") return { txt: "Bloquear en Smoobu", icon: <Upload size={14} />, hacer: () => resolver(f.id, `Bloqueo de ${p} cargado después de conectar.`) };
    if (f.estado === "choque") return { txt: "Resolver choque", icon: <Users size={14} />, hacer: () => setChoque(f) };
    return null;
  };

  return (
    <section className="bloque" id="cuadre">
      <div className="bloque-head">
        <h2>Cuadre reserva por reserva</h2>
        <p className="muted">Cada reserva y cada bloqueo de Airbnb, comparado con lo que muestra Smoobu después de conectar.</p>
      </div>
      <div className="progreso-card">
        <div>
          <b>
            {hechas} de {filas.length}
          </b>{" "}
          filas cuadradas {problemas ? <span className="muted">· quedan {problemas}</span> : <span className="ok-txt">· todo en su lugar</span>}
        </div>
        <Barra valor={hechas} max={filas.length} tono={problemas ? "warn" : "ok"} />
        <div className="toolbar toolbar-plano">
          <div className="chips">
            {(
              [
                ["problemas", "Con problemas", problemas],
                ["todas", "Todas", filas.length],
                ["cuadradas", "Cuadradas", hechas],
              ] as const
            ).map(([k, t, n]) => (
              <button key={k} className={`chip-btn ${filtro === k ? "on" : ""}`} onClick={() => { setFiltro(k); setPagina(1); }}>
                {t} <span>{n}</span>
              </button>
            ))}
          </div>
          <label className="buscar">
            <Search size={16} />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPagina(1); }} placeholder="Buscar huésped o propiedad" aria-label="Buscar en el cuadre" />
          </label>
        </div>
      </div>

      {lista.length === 0 ? (
        <Vacio icono={filtro === "problemas" ? <BadgeCheck size={26} /> : <Inbox size={26} />} titulo={filtro === "problemas" ? "Sin problemas pendientes" : "Nada con esa búsqueda"} texto={filtro === "problemas" ? "Cada reserva y cada bloqueo de Airbnb está donde tiene que estar en Smoobu." : "Pruebe con otro nombre."} />
      ) : (
        <div className="tabla-wrap">
          <table className="tabla cuadre">
            <thead>
              <tr>
                <th>Qué</th>
                <th>Propiedad</th>
                <th>Noches</th>
                <th>Estado</th>
                <th className="der">Acción</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f, i) => {
                const a = f.resuelta ? null : accion(f);
                return (
                  <tr key={f.id} className={f.estado !== "ok" && !f.resuelta ? `fila-${f.estado}` : ""} style={{ animationDelay: `${i * 22}ms` }}>
                    <td>
                      <b>{f.titulo}</b>
                      <span className="muted small block">{f.resuelta ?? f.detalle}</span>
                    </td>
                    <td>{prop(f.prop)?.nombre}</td>
                    <td>
                      {fechaCorta(f.inicio)} al {fechaCorta(f.fin)}
                      <span className="muted small block">{noches(diffDays(f.inicio, f.fin))}</span>
                    </td>
                    <td>
                      <span className={`estado ${f.resuelta || f.estado === "ok" ? "e-ok" : f.estado === "choque" || f.estado === "reabierta" ? "e-err" : "e-cross"}`}>{f.resuelta ? "Cuadrada" : ROT[f.estado]}</span>
                    </td>
                    <td className="der">
                      {a ? (
                        <Btn className={`btn-sm ${f.estado === "choque" ? "btn-danger" : "btn-dark"}`} cargando={!!ocupado[`fila-${f.id}`]} onClick={a.hacer}>
                          {!ocupado[`fila-${f.id}`] && a.icon} {a.txt}
                        </Btn>
                      ) : (
                        <span className="muted small">
                          <Check size={14} /> Listo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Paginas pagina={pg} total={paginas} onCambio={setPagina} />

      <Modal abierto={!!choque} titulo="Dos reservas para las mismas noches" onCerrar={() => setChoque(null)}>
        {choque && (
          <div className="choque">
            <p>
              <b>{prop(choque.prop)?.nombre}</b>, del {fechaConDia(choque.inicio)} al {fechaConDia(choque.fin)}. {choque.detalle}. Las mismas noches quedaron prometidas dos veces y solo una promesa se puede cumplir.
            </p>
            <div className="opciones">
              <button
                className="opcion"
                onClick={() => {
                  resolver(choque.id, `Choque en ${prop(choque.prop)?.nombre}: se ofreció otra propiedad libre al huésped de Airbnb.`);
                  setChoque(null);
                }}
              >
                <b>Ofrecer otra propiedad libre</b>
                <span>Se le escribe al huésped de Airbnb con una alternativa de igual o mayor categoría. Depende de que haya una libre esas noches y de que la acepte.</span>
              </button>
              <button
                className="opcion opcion-err"
                onClick={() => {
                  resolver(choque.id, `Choque en ${prop(choque.prop)?.nombre}: se canceló la reserva de Airbnb, con multa y aviso en el anuncio.`);
                  setChoque(null);
                }}
              >
                <b>Cancelar la reserva de Airbnb</b>
                <span>Airbnb cobra una multa al anfitrión y deja un aviso en el anuncio que los próximos huéspedes van a leer.</span>
              </button>
            </div>
            <p className="muted small">Las dos salidas cuestan algo. La única gratis era cargar el bloqueo antes de conectar.</p>
          </div>
        )}
      </Modal>
    </section>
  );
}
