import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExpiryBadge } from "@/components/ui/expiry-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProportionBar } from "@/components/ui/proportion-bar";
import { StatusChips } from "@/components/ui/status-chips";
import { Timeline, type TimelineItem } from "@/components/ui/timeline";
import { DashboardHero } from "./dashboard-hero";
import {
  formatCurrency,
  formatNumero,
  formatRelativo,
  saludoHorario,
  formatFechaLarga,
  categoriaGastoLabel,
} from "@/lib/format";
import {
  Box,
  Users2,
  Truck,
  Route,
  Wallet,
  Fuel,
  Wrench,
  ShieldCheck,
  ArrowRight,
  CalendarClock,
  FileText,
  Receipt,
  Landmark,
  UserCog,
  CreditCard,
  Settings,
  History,
  Plus,
  Gauge,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";
import { GastosChart } from "@/components/charts/gastos-chart";
import { ActivosTipoChart } from "@/components/charts/activos-tipo-chart";

const ENTIDAD_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  Activo: { label: "activo", icon: Box },
  Mantenimiento: { label: "mantenimiento", icon: Wrench },
  Vehiculo: { label: "vehículo", icon: Truck },
  Conductor: { label: "conductor", icon: Users2 },
  Traslado: { label: "traslado", icon: Route },
  CombustibleCarga: { label: "carga de combustible", icon: Fuel },
  Gasto: { label: "gasto", icon: Receipt },
  Impuesto: { label: "impuesto", icon: Landmark },
  Documento: { label: "documento", icon: FileText },
  Proveedor: { label: "proveedor", icon: Users2 },
  Comodato: { label: "comodato", icon: FileText },
  User: { label: "usuario", icon: UserCog },
  Suscripcion: { label: "plan", icon: CreditCard },
  Empresa: { label: "empresa", icon: Settings },
};

const ACCION_LABEL: Record<string, string> = {
  CREAR: "creó",
  EDITAR: "editó",
  ELIMINAR: "eliminó",
  ACTIVAR: "activó",
  DESACTIVAR: "desactivó",
  CONTRATAR_PLAN: "contrató",
};

// Por categoriaLabel (texto de las 4 tarjetas resumen, siempre uno de estos
// 5 valores fijos -- ver CATEGORIA_LABEL en vencimientos-center.ts).
const ATENCION_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Activos: Box,
  Documentación: FileText,
  Flota: Truck,
  Mantenimiento: Wrench,
  Impuestos: Landmark,
};

// Por categoría (enum estable): la lista de "Requiere atención" usa
// categoriaLabel para el texto específico del tipo de activo (ej.
// "Matafuego", "Calibración"), así que el ícono se resuelve por la
// categoría fija, no por esa etiqueta variable.
const ATENCION_ICON_POR_CATEGORIA: Record<string, React.ComponentType<{ className?: string }>> = {
  ACTIVO: Box,
  DOCUMENTO: FileText,
  VEHICULO: Truck,
  MANTENIMIENTO: Wrench,
  IMPUESTO: Landmark,
};

const VEHICULO_ESTADO_COLOR: Record<string, string> = {
  DISPONIBLE: "var(--success)",
  EN_VIAJE: "var(--info)",
  EN_MANTENIMIENTO: "var(--warning)",
  FUERA_DE_SERVICIO: "var(--text-muted)",
};

const VEHICULO_ESTADO_LABEL: Record<string, string> = {
  DISPONIBLE: "Disponible",
  EN_VIAJE: "En viaje",
  EN_MANTENIMIENTO: "En mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de servicio",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getDashboardData(session);
  const puedeGestionar = session.rol === "ADMIN" || session.rol === "EMPRESA";

  const totalAtencion = data.vencidosCount + data.urgentesCount;

  // Resumen del hero -- solo categorías con elementos realmente urgentes
  // (mismo criterio que totalAtencion: vencido o dentro de 7 días), nunca
  // inventado.
  const resumenHero = data.resumenPorCategoria
    .map((r) => ({ label: r.label.toLowerCase(), count: r.vencidos + r.urgentes }))
    .filter((r) => r.count > 0)
    .map((r) => `${r.count} ${r.label}`)
    .join(" · ");

  const timelineItems: TimelineItem[] = data.actividadReciente.map((log) => {
    const meta = ENTIDAD_META[log.entidad] ?? { label: log.entidad.toLowerCase(), icon: History };
    const actor = log.user ? `${log.user.nombre} ${log.user.apellido}` : "Sistema";
    const verbo = ACCION_LABEL[log.accion] ?? log.accion.toLowerCase();
    return {
      id: log.id,
      time: formatRelativo(log.fecha),
      nodeColorVar: log.accion === "ELIMINAR" ? "var(--danger)" : log.accion === "EDITAR" ? "var(--brand)" : "var(--accent)",
      haloColorVar: log.accion === "ELIMINAR" ? "var(--danger-soft)" : log.accion === "EDITAR" ? "var(--brand-soft)" : "var(--accent-soft)",
      content: (
        <>
          <span className="font-medium">{actor}</span>{" "}
          <span className="text-[var(--text-secondary)]">{verbo} un {meta.label}</span>
          {log.detalle && <span className="text-[var(--text-muted)]"> · {log.detalle}</span>}
        </>
      ),
    };
  });

  const vehiculosVisibles = data.vehiculosDetalle.slice(0, 3);
  const vehiculosRestantes = data.vehiculosDetalle.length - vehiculosVisibles.length;
  const topCategoriaGasto = data.gastosPorCategoria[0];
  const totalEsteMes = data.gastosMes + data.combustibleMesImporte;

  return (
    <div>
      <DashboardHero
        saludo={`${saludoHorario()}, ${session.nombre.split(" ")[0]}`}
        fecha={formatFechaLarga()}
        totalAtencion={totalAtencion}
        resumen={resumenHero || undefined}
      />

      {/* A. Resumen -- "¿cómo está mi empresa?": cuánto administro, de un
          vistazo, antes de entrar en el detalle de qué requiere atención. */}
      <SectionLabel>A · Resumen</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          href="/vencimientos"
          label="Vencimientos"
          value={totalAtencion}
          hint={data.vencidosCount > 0 ? `${data.vencidosCount} ya vencidos` : "Próximos 7 días"}
          icon={<CalendarClock className="h-4 w-4" />}
          tone={data.vencidosCount > 0 ? "danger" : totalAtencion > 0 ? "warning" : "success"}
          stripe={totalAtencion > 0}
        />
        <StatCard href="/activos" label="Activos" value={data.activosTotales} hint="Total registrado" icon={<Box className="h-4 w-4" />} tone="brand" />
        <StatCard
          href="/mantenimiento"
          label="Mantenimiento"
          value={data.mantenimientoAtencionCount}
          hint={data.mantenimientoAtencionCount > 0 ? "Vencido o próximo (30d)" : "Sin pendientes"}
          icon={<Wrench className="h-4 w-4" />}
          tone={data.mantenimientoAtencionCount > 0 ? "warning" : "success"}
          stripe={data.mantenimientoAtencionCount > 0}
        />
        <StatCard
          href="/flota"
          label="Vehículos"
          value={data.vehiculosCount}
          hint={data.vehiculosKmTotal > 0 ? `${formatNumero(data.vehiculosKmTotal)} km en total` : undefined}
          icon={<Truck className="h-4 w-4" />}
        />
        <StatCard
          href="/gastos"
          label="Gastos del mes"
          value={formatCurrency(data.gastosMes)}
          hint={data.combustibleMesImporte > 0 ? `+ ${formatCurrency(data.combustibleMesImporte)} en combustible` : "Este mes"}
          icon={<Wallet className="h-4 w-4" />}
          spark={data.gastosPorMes.some((m) => m.gastos + m.combustible > 0) ? data.gastosPorMes.map((m) => m.gastos + m.combustible) : undefined}
        />
        <StatCard
          href="/logistica"
          label="Operaciones"
          value={data.trasladosEnCurso}
          hint={`${data.trasladosPorEstado.PLANIFICADO} planificadas`}
          icon={<Route className="h-4 w-4" />}
          tone={data.trasladosEnCurso > 0 ? "accent" : "neutral"}
        />
      </div>

      {/* B. Atención -- "¿qué requiere acción?". La parte más importante
          del Dashboard: cada número y cada fila son accionables. */}
      <SectionLabel>B · Atención</SectionLabel>
      <Card className="mb-6 border-[var(--border-strong)] shadow-[var(--shadow-md)] animate-in">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${
                totalAtencion === 0 ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"
              }`}
            >
              {totalAtencion === 0 ? <ShieldCheck className="h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
            </div>
            <div className="min-w-0">
              <CardTitle>
                {totalAtencion === 0 ? "Todo bajo control" : `${totalAtencion} elemento${totalAtencion === 1 ? "" : "s"} requiere${totalAtencion === 1 ? "" : "n"} atención`}
              </CardTitle>
              <CardDescription>Vencidos o por vencer en los próximos 7 días.</CardDescription>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm" className="self-start sm:self-auto shrink-0">
            <Link href="/vencimientos">Ver centro de vencimientos <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {totalAtencion === 0 ? (
            <div className="flex items-center gap-3 py-2">
              <p className="text-sm text-[var(--text-secondary)]">
                No hay vencimientos críticos esta semana.{" "}
                {data.proximos30Count > 0 && `${data.proximos30Count} más para seguir en los próximos 30 días.`}
              </p>
            </div>
          ) : (
            <>
              {/* Vencidos / próximos 7d / próximos 30d -- el corte que responde
                  "¿qué tan urgente es esto?" de un vistazo, y cada número
                  lleva directo al Centro de Vencimientos ya filtrado por ese
                  rango (mismo ?rango= que soporta /vencimientos). */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <Link href="/vencimientos?rango=vencidos" className="rounded-[var(--radius-md)] bg-[var(--danger-soft)] px-4 py-3 block hover:brightness-110 transition-[filter]">
                  <p className="text-kpi text-[var(--danger)]">{data.vencidosCount}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Vencidos</p>
                </Link>
                <Link href="/vencimientos?rango=7" className="rounded-[var(--radius-md)] bg-[var(--warning-soft)] px-4 py-3 block hover:brightness-110 transition-[filter]">
                  <p className="text-kpi text-[var(--warning)]">{data.urgentesCount}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Próximos 7 días</p>
                </Link>
                <Link href="/vencimientos?rango=30" className="rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 block hover:bg-[var(--surface-hover)] transition-colors">
                  <p className="text-kpi text-[var(--text-primary)]">{data.proximos30Count}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Próximos 30 días</p>
                </Link>
              </div>

              {data.resumenPorCategoria.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  {data.resumenPorCategoria.map((r) => {
                    const totalCategoria = r.vencidos + r.urgentes + r.proximos;
                    const Icon = ATENCION_ICON[r.label] ?? History;
                    return (
                      <Link key={r.categoria} href="/vencimientos" className="block group">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {r.label}
                          </span>
                          <span className="text-sm font-semibold tabular-nums">{totalCategoria}</span>
                        </div>
                        <ProportionBar
                          segments={[
                            { value: r.vencidos, colorVar: "var(--danger)", label: "Vencido" },
                            { value: r.urgentes, colorVar: "var(--warning)", label: "Urgente (≤7d)" },
                            { value: r.proximos, colorVar: "var(--caution)", label: "Próximo (≤30d)" },
                          ]}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
              <ul className="divide-y divide-[var(--border)] -mx-5">
                {data.requiereAtencion.map((item) => {
                  const Icon = ATENCION_ICON_POR_CATEGORIA[item.categoria] ?? History;
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--surface-hover)] transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-2)] text-[var(--text-muted)]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={item.href} className="text-sm font-medium hover:text-[var(--brand-hover)] truncate block">
                          {item.titulo}
                        </Link>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.categoriaLabel} · {item.detalle}</p>
                      </div>
                      <ExpiryBadge dias={item.dias} className="shrink-0" />
                      <Button asChild variant="ghost" size="sm" className="shrink-0 hidden sm:inline-flex">
                        <Link href={item.href}>Ver</Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* C. Operación -- "¿cómo están mis activos y operaciones?". Activos,
          Flota y Operación (traslados) son todos parte de lo operativo:
          se agrupan visualmente en un mismo bloque en vez de competir como
          tarjetas sueltas. */}
      <SectionLabel>C · Operación</SectionLabel>
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Activos</CardTitle>
            <span className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">{data.activosTotales}</span>
          </CardHeader>
          <CardContent>
            {data.activosPorTipo.length === 0 ? (
              <EmptyState title="Sin activos" description="Todavía no hay activos cargados en esta cuenta." />
            ) : (
              <>
                <ActivosTipoChart data={data.activosPorTipo.map((a) => ({ tipo: a.tipo, cantidad: a._count._all }))} />
                <Link href="/activos" className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--brand-hover)] hover:underline">
                  Ver todos los activos <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle>Estado de flota</CardTitle>
                <CardDescription>Vehículos, kilometraje y documentación al día.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="self-start sm:self-auto shrink-0">
                <Link href="/flota">Ver flota <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.vehiculosCount === 0 ? (
                <EmptyState
                  title="Sin vehículos registrados"
                  description="Sumá tu primer vehículo para empezar a controlar kilometraje, VTV, seguro y service."
                  icon={<Truck className="h-8 w-8" />}
                  action={
                    puedeGestionar && (
                      <Button asChild size="sm">
                        <Link href="/flota/nuevo"><Plus className="h-3.5 w-3.5" /> Nuevo vehículo</Link>
                      </Button>
                    )
                  }
                />
              ) : (
                <div>
                  <div className="flex items-center gap-4 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 mb-4">
                    <Gauge className="h-5 w-5 text-[var(--text-muted)] shrink-0" />
                    <div>
                      <p className="text-lg font-semibold tabular-nums leading-none">{formatNumero(data.vehiculosKmTotal)} km</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Kilometraje total de la flota</p>
                    </div>
                  </div>
                  <ul className="divide-y divide-[var(--border)] -mx-5">
                    {vehiculosVisibles.map((v) => (
                      <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                        <div className="min-w-0 flex-1">
                          <Link href={`/flota/${v.id}`} className="text-sm font-medium hover:text-[var(--brand-hover)] truncate block">
                            {v.patente} · {v.marca} {v.modelo}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: VEHICULO_ESTADO_COLOR[v.estado] }} aria-hidden="true" />
                            <span className="text-xs text-[var(--text-secondary)]">{VEHICULO_ESTADO_LABEL[v.estado] ?? v.estado}</span>
                            <span className="text-xs text-[var(--text-muted)]">· {formatNumero(v.kilometraje)} km</span>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                          <DocMiniBadge label="Seguro" cfg={v.seguro} />
                          <DocMiniBadge label="VTV" cfg={v.vtv} />
                        </div>
                        <Button asChild variant="ghost" size="sm" className="shrink-0">
                          <Link href={`/flota/${v.id}`}>Ver <ArrowRight className="h-3 w-3" /></Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {vehiculosRestantes > 0 && (
                    <Link href="/flota" className="block text-center text-xs text-[var(--brand-hover)] hover:underline pt-2">
                      +{vehiculosRestantes} vehículo{vehiculosRestantes === 1 ? "" : "s"} más
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de la operación</CardTitle>
              <CardDescription>Traslados y vehículos en ruta.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.trasladosCount === 0 ? (
                <EmptyState
                  title="Sin traslados"
                  description="Registrá tu primer traslado para hacer seguimiento de la logística."
                  icon={<Route className="h-8 w-8" />}
                  action={
                    puedeGestionar && (
                      <Button asChild size="sm">
                        <Link href="/logistica/nuevo"><Plus className="h-3.5 w-3.5" /> Nuevo traslado</Link>
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums leading-none">{data.trasladosEnCurso}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      traslado{data.trasladosEnCurso === 1 ? "" : "s"} en curso
                      {(data.vehiculosPorEstado.EN_VIAJE ?? 0) > 0 && ` · ${data.vehiculosPorEstado.EN_VIAJE} vehículo${data.vehiculosPorEstado.EN_VIAJE === 1 ? "" : "s"} en viaje`}
                    </p>
                  </div>
                  <StatusChips
                    data={[
                      { label: "Planificados", value: data.trasladosPorEstado.PLANIFICADO, colorVar: "var(--info)" },
                      { label: "En curso", value: data.trasladosPorEstado.EN_CURSO, colorVar: "var(--brand)" },
                      { label: "Completados", value: data.trasladosPorEstado.COMPLETADO, colorVar: "var(--success)" },
                    ]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* D. Costos -- "¿cuánto estoy gastando?". */}
      <SectionLabel>D · Costos</SectionLabel>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Gastos de operación</CardTitle>
            <CardDescription>Incluye gastos operativos y cargas de combustible.</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums leading-none">{formatCurrency(totalEsteMes)}</p>
            <p className="mt-1 flex items-center justify-end gap-1 text-xs text-[var(--text-muted)]">
              este mes
              {data.variacionMensual !== null && (
                <span className={`inline-flex items-center gap-0.5 font-medium ${data.variacionMensual > 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                  {data.variacionMensual > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(Math.round(data.variacionMensual))}% vs. mes anterior
                </span>
              )}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <GastosChart data={data.gastosPorMes} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gastos por categoría</CardTitle>
          <CardDescription>¿Dónde se concentró el gasto en los últimos 12 meses?</CardDescription>
        </CardHeader>
        <CardContent>
          {data.gastosPorCategoria.length === 0 ? (
            <EmptyState title="Sin gastos registrados" description="Todavía no hay gastos ni cargas de combustible en este período." />
          ) : (
            <>
              <div className="overflow-x-auto thin-scroll -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      <th className="px-1 pb-2 font-medium">Categoría</th>
                      <th className="px-1 pb-2 font-medium w-1/3">&nbsp;</th>
                      <th className="px-1 pb-2 font-medium text-right">Total</th>
                      <th className="px-1 pb-2 font-medium text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.gastosPorCategoria.map((c) => (
                      <tr key={c.categoria} className="border-t border-[var(--border)]">
                        <td className="px-1 py-2 text-[var(--text-secondary)] whitespace-nowrap">{categoriaGastoLabel(c.categoria)}</td>
                        <td className="px-1 py-2">
                          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <span className="block h-full rounded-full bg-[var(--brand)]" style={{ width: `${c.pct}%` }} />
                          </div>
                        </td>
                        <td className="px-1 py-2 text-right font-semibold tabular-nums whitespace-nowrap">{formatCurrency(c.total)}</td>
                        <td className="px-1 py-2 text-right tabular-nums text-[var(--text-muted)] whitespace-nowrap">{Math.round(c.pct)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {topCategoriaGasto && topCategoriaGasto.pct > 30 && (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--text-secondary)]">{categoriaGastoLabel(topCategoriaGasto.categoria)}</span> concentra el {Math.round(topCategoriaGasto.pct)}% del gasto registrado.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* E. Actividad -- "¿qué ocurrió recientemente?". Estado vacío
          compacto: no debe ocupar media pantalla cuando no hay nada. */}
      <SectionLabel>E · Actividad</SectionLabel>
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>Últimas acciones registradas en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className={timelineItems.length === 0 ? undefined : "pt-5"}>
          {timelineItems.length === 0 ? (
            <div className="flex items-center gap-3 py-2">
              <History className="h-5 w-5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">No hay nuevas actividades.</p>
                <p className="text-xs text-[var(--text-muted)]">Las acciones realizadas en TRAZA van a aparecer acá.</p>
              </div>
            </div>
          ) : (
            <Timeline items={timelineItems} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
      {children}
    </p>
  );
}

function DocMiniBadge({ label, cfg }: { label: string; cfg: { urgencia: string; label: string; Icon: React.ComponentType<{ className?: string }> } }) {
  const ok = cfg.urgencia === "ok";
  const critico = cfg.urgencia === "critico";
  return (
    <span
      title={`${label}: ${cfg.label}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
        ok
          ? "bg-[var(--success-soft)] text-[var(--success)]"
          : critico
            ? "bg-[var(--danger-soft)] text-[var(--danger)]"
            : "bg-[var(--warning-soft)] text-[var(--warning)]"
      }`}
    >
      <cfg.Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
