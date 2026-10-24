"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, BedDouble, CalendarCheck2, CalendarRange, CheckCircle2, CircleDot, Home, Link2, PlugZap, ShieldCheck, Tags, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { altasLibres, pasos, simular } from "@/lib/sim";
import { Hero3D } from "@/components/three/Scenes";
import { Barra, FotoProp, Kpi, Skel, Tilt } from "@/components/ui";
import { miles, noches as fNoches } from "@/lib/format";

export default function Resumen() {
  const { db } = useStore();
  const sim = useMemo(() => (db ? simular(db) : null), [db]);
  const ps = useMemo(() => (db ? pasos(db) : null), [db]);
  const pendientes = db?.bloqueos.filter((b) => b.estado === "solo-airbnb").length ?? 0;

  const atencion = useMemo(() => {
    if (!db) return [];
    return db.props
      .map((p) => {
        const a = db.anuncios.find((x) => x.real === p.id)!;
        const e = db.emparejado[a.id];
        const motivos: string[] = [];
        const blo = db.bloqueos.filter((b) => b.anuncio === a.id && b.estado === "solo-airbnb").length;
        if (blo) motivos.push(blo === 1 ? "1 bloqueo sin cargar" : `${blo} bloqueos sin cargar`);
        if (!e.prop) motivos.push("anuncio sin emparejar");
        else if (e.check === "error") motivos.push("emparejado cruzado");
        else if (e.check !== "ok") motivos.push("emparejado sin comprobar");
        const altas = altasLibres(db, p.id).filter((n) => n.smoobu === null || !n.revisada).length;
        if (altas) motivos.push(`${altas} noches altas sin revisar`);
        return { p, motivos };
      })
      .filter((x) => x.motivos.length)
      .sort((x, y) => y.motivos.length - x.motivos.length);
  }, [db]);

  return (
    <div className="pagina">
      <section className="hero">
        <Hero3D pendientes={pendientes} total={db?.bloqueos.length ?? 24} />
        <div className="hero-txt">
          <span className="eyebrow">
            <Home size={14} /> Cartera de 12 propiedades
          </span>
          <h1>El calendario cambia de mano y el huésped ni se entera</h1>
          <p>
            Airbnb sigue vendiendo como siempre. Lo que cambia es quién decide el precio y la disponibilidad de cada noche: desde la conexión, manda Smoobu. Aquí el traspaso va en orden, para que ninguna noche prometida vuelva a la venta en el camino.
          </p>
          <div className="hero-cta">
            <Link href="/conexion" className="btn btn-primary">
              <PlugZap size={17} /> Ver qué pasaría si conecto hoy
            </Link>
            <Link href="/inventario" className="btn btn-ghost">
              Empezar por el inventario <ArrowRight size={16} />
            </Link>
          </div>
          <div className="leyenda">
            <span>
              <i className="sw sw-reserva" /> Reserva de Airbnb
            </span>
            <span>
              <i className="sw sw-bloqueo" /> Bloqueo a mano, solo en Airbnb
            </span>
            <span>
              <i className="sw sw-cargado" /> Bloqueo ya cargado en Smoobu
            </span>
          </div>
        </div>
      </section>

      {!db || !sim || !ps ? (
        <div className="grid g-kpi" style={{ marginTop: 18 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skel key={i} h={128} r={18} />
          ))}
        </div>
      ) : (
        <>
          <section className={`aviso-sim ${sim.limpio ? "limpio" : ""} entra`}>
            <div className="aviso-ic">{sim.limpio ? <ShieldCheck size={26} /> : <TriangleAlert size={26} />}</div>
            <div className="aviso-txt">
              <b>{sim.limpio ? "Si conectara ahora, la primera sincronización saldría limpia" : "Si conectara ahora mismo"}</b>
              {sim.limpio ? (
                <p>Todos los bloqueos están en Smoobu, las noches altas revisadas y cada anuncio cae en su fila.</p>
              ) : (
                <ul>
                  {sim.nochesReabiertas > 0 && (
                    <li>
                      <b>{fNoches(sim.nochesReabiertas)}</b> bloqueadas a mano volverían a la venta en Airbnb{sim.choques.length ? <>, y en {sim.choques.length} de esos bloqueos de las fiestas ya entraría otro huésped</> : null}.
                    </li>
                  )}
                  {sim.nochesPrecioBase > 0 && (
                    <li>
                      <b>{fNoches(sim.nochesPrecioBase)}</b> de temporada alta todavía a la venta saldrían a precio base{sim.precioBase.some((x) => x.noches.some((n) => n.fecha === "2026-12-31")) ? ", Año Nuevo incluido" : ""}.
                    </li>
                  )}
                  {sim.cruzadas.length + sim.fueraDeSmoobu.length > 0 && (
                    <li>
                      <b>{sim.cruzadas.length + sim.fueraDeSmoobu.length} reservas</b> caerían en la fila de otra propiedad o quedarían fuera de Smoobu.
                    </li>
                  )}
                </ul>
              )}
            </div>
            <Link href="/conexion" className="btn btn-dark">
              Simular la conexión <ArrowRight size={16} />
            </Link>
          </section>

          <section className="grid g-kpi">
            <Kpi icono={<BedDouble size={20} />} valor={db.props.length} rotulo="Propiedades creadas en Smoobu" nota="Con fotos, capacidad y precio base" />
            <Kpi icono={<CalendarCheck2 size={20} />} valor={db.reservas.length} rotulo="Reservas futuras de Airbnb" nota="Estas sí las importa Smoobu al conectar" tono="ok" />
            <Kpi icono={<AlertTriangle size={20} />} valor={`${pendientes} de ${db.bloqueos.length}`} rotulo="Bloqueos a mano sin cargar" nota="Smoobu no los trae solo" tono={pendientes ? "warn" : "ok"} />
            <Kpi icono={<Tags size={20} />} valor={`${ps.carga.altas} de ${ps.carga.totalAltas}`} rotulo="Noches altas revisadas" nota="Las que siguen a la venta en las fiestas" tono={ps.carga.altas === ps.carga.totalAltas ? "ok" : "clay"} />
          </section>

          <section className="bloque">
            <div className="bloque-head">
              <h2>El traspaso, en cinco pasos</h2>
              <p className="muted">El tercero decide: la primera sincronización publica lo que encuentra en Smoobu, ni más ni menos.</p>
            </div>
            <div className="pasos">
              <Paso n={1} titulo="Inventario de Airbnb" href="/inventario" icono={<CalendarRange size={18} />} listo={ps.inventario} texto={ps.inventario ? "Firmado: es la foto de la cuenta antes del traspaso." : "Reservas, bloqueos a mano y precios en una sola lista, para firmar."} valor={ps.inventario ? 1 : 0} max={1} />
              <Paso n={2} titulo="Propiedades emparejadas" href="/emparejado" icono={<Link2 size={18} />} listo={ps.emparejado.listo} texto={`${ps.emparejado.hechos} de ${ps.emparejado.total} anuncios comprobados con una reserva testigo.`} valor={ps.emparejado.hechos} max={ps.emparejado.total} />
              <Paso
                n={3}
                decide
                titulo="Bloqueos y tarifas cargados"
                href="/inventario"
                icono={<Tags size={18} />}
                listo={ps.carga.listo}
                texto={`${ps.carga.bloqueos} de ${ps.carga.totalBloqueos} bloqueos en Smoobu, ${ps.carga.altas} de ${ps.carga.totalAltas} noches altas revisadas.`}
                valor={ps.carga.bloqueos + ps.carga.altas}
                max={ps.carga.totalBloqueos + ps.carga.totalAltas}
              />
              <Paso n={4} titulo="Conexión" href="/conexion" icono={<PlugZap size={18} />} listo={ps.conexion} texto={ps.conexion ? "Smoobu ya maneja los calendarios de Airbnb." : "En un día tranquilo, con todo lo anterior adentro."} valor={ps.conexion ? 1 : 0} max={1} />
              <Paso n={5} titulo="Cuadre reserva por reserva" href="/conexion#cuadre" icono={<CheckCircle2 size={18} />} listo={ps.cuadre.listo} texto={ps.conexion ? `${ps.cuadre.hechas} de ${ps.cuadre.total} filas cuadradas contra Airbnb.` : "Se abre después de conectar."} valor={ps.cuadre.hechas} max={Math.max(1, ps.cuadre.total)} />
            </div>
          </section>

          <section className="grid g-2">
            <div className="card">
              <div className="card-head">
                <h3>Propiedades que piden atención</h3>
                <span className="chip">{atencion.length}</span>
              </div>
              {atencion.length === 0 ? (
                <p className="muted">Ninguna. Las doce están listas para conectar.</p>
              ) : (
                <ul className="lista-atencion">
                  {atencion.slice(0, 6).map(({ p, motivos }, i) => (
                    <li key={p.id} style={{ animationDelay: `${i * 60}ms` }}>
                      <FotoProp p={p} w={64} h={48} className="mini" />
                      <div>
                        <b>{p.nombre}</b>
                        <span className="muted small">{motivos.join(" · ")}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <h3>Actividad</h3>
                <span className="muted small">{miles(db.actividad.length)} movimientos</span>
              </div>
              <ul className="actividad">
                {db.actividad.slice(0, 7).map((a) => (
                  <li key={a.id} className={`act-${a.tono}`}>
                    <CircleDot size={14} />
                    <span>{a.texto}</span>
                    <time>{a.hora}</time>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Paso({ n, titulo, texto, href, icono, listo, valor, max, decide }: { n: number; titulo: string; texto: string; href: string; icono: React.ReactNode; listo: boolean; valor: number; max: number; decide?: boolean }) {
  return (
    <Link href={href} className="paso-link" style={{ animationDelay: `${n * 70}ms` }}>
      <Tilt className={`paso ${listo ? "listo" : ""} ${decide ? "decide" : ""}`} fuerza={6}>
        {decide && <span className="paso-tag">El punto que decide</span>}
        <div className="paso-top">
          <span className="paso-n">{listo ? <CheckCircle2 size={18} /> : n}</span>
          <span className="paso-ic">{icono}</span>
        </div>
        <b>{titulo}</b>
        <p>{texto}</p>
        <Barra valor={valor} max={max} tono={listo ? "ok" : decide ? "clay" : "accent"} />
      </Tilt>
    </Link>
  );
}
