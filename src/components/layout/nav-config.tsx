import {
  LayoutDashboard,
  Box,
  Wrench,
  Truck,
  Users2,
  FileText,
  Route,
  Fuel,
  Receipt,
  BarChart3,
  UserCog,
  CreditCard,
  Settings,
  Flame,
  HeartPulse,
  Package,
  Landmark,
  CalendarClock,
  History,
  MapPin,
} from "lucide-react";
import type { Rol } from "@prisma/client";

export type NavGroup = "Operación" | "Control" | "Información" | "Configuración";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: NavGroup;
  roles?: Rol[];
  children?: { label: string; href: string; icon?: React.ComponentType<{ className?: string }> }[];
};

// Agrupado en 4 secciones conceptuales para el sidebar. El agrupamiento es
// puramente visual (campo `group`) -- no cambia rutas, roles ni permisos.
export const NAV_ITEMS: NavItem[] = [
  // Operación
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Operación" },
  {
    label: "Activos",
    href: "/activos",
    icon: Box,
    group: "Operación",
    children: [
      { label: "Todos", href: "/activos" },
      { label: "Matafuegos", href: "/activos?tipo=MATAFUEGO", icon: Flame },
      { label: "Equipos médicos", href: "/activos?tipo=EQUIPO_MEDICO", icon: HeartPulse },
      { label: "Otros activos", href: "/activos?tipo=OTRO", icon: Package },
    ],
  },
  { label: "Mantenimiento", href: "/mantenimiento", icon: Wrench, group: "Operación" },
  {
    label: "Flota",
    href: "/flota",
    icon: Truck,
    group: "Operación",
    roles: ["ADMIN", "EMPRESA", "CONDUCTOR"],
    children: [
      { label: "Vehículos", href: "/flota" },
      { label: "Conductores", href: "/flota/conductores" },
    ],
  },
  { label: "Logística", href: "/logistica", icon: Route, group: "Operación", roles: ["ADMIN", "EMPRESA", "CONDUCTOR"] },
  { label: "Monitoreo", href: "/monitoreo", icon: MapPin, group: "Operación", roles: ["ADMIN", "EMPRESA", "CONDUCTOR"] },

  // Control
  { label: "Documentación", href: "/documentacion", icon: FileText, group: "Control" },
  { label: "Comodatos", href: "/comodatos", icon: FileText, group: "Control", roles: ["ADMIN", "EMPRESA"] },
  { label: "Vencimientos", href: "/vencimientos", icon: CalendarClock, group: "Control" },
  { label: "Proveedores", href: "/proveedores", icon: Users2, group: "Control", roles: ["ADMIN", "EMPRESA"] },
  { label: "Combustible", href: "/combustible", icon: Fuel, group: "Control", roles: ["ADMIN", "EMPRESA", "CONDUCTOR"] },
  { label: "Gastos", href: "/gastos", icon: Receipt, group: "Control", roles: ["ADMIN", "EMPRESA"] },
  { label: "Impuestos", href: "/impuestos", icon: Landmark, group: "Control", roles: ["ADMIN", "EMPRESA"] },

  // Información
  { label: "Reportes", href: "/reportes", icon: BarChart3, group: "Información", roles: ["ADMIN", "EMPRESA"] },
  { label: "Auditoría", href: "/auditoria", icon: History, group: "Información", roles: ["ADMIN", "EMPRESA"] },

  // Configuración
  { label: "Usuarios", href: "/usuarios", icon: UserCog, group: "Configuración", roles: ["ADMIN", "EMPRESA"] },
  { label: "Planes", href: "/planes", icon: CreditCard, group: "Configuración", roles: ["ADMIN", "EMPRESA"] },
  { label: "Configuración", href: "/configuracion", icon: Settings, group: "Configuración", roles: ["ADMIN", "EMPRESA"] },
];

export type QuickAction = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Rol[];
};

// Acciones de alta rapida ("+ Nueva accion" en el topbar). Los roles
// reflejan exactamente los mismos permisos que ya rigen cada modulo en
// NAV_ITEMS -- no se inventa una capa de permisos nueva.
export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Nuevo activo", href: "/activos/nuevo", icon: Box },
  { label: "Nuevo mantenimiento", href: "/mantenimiento/nuevo", icon: Wrench },
  { label: "Nuevo vehículo", href: "/flota/nuevo", icon: Truck, roles: ["ADMIN", "EMPRESA"] },
  { label: "Nuevo conductor", href: "/flota/conductores/nuevo", icon: Users2, roles: ["ADMIN", "EMPRESA"] },
  { label: "Nuevo traslado", href: "/logistica/nuevo", icon: Route, roles: ["ADMIN", "EMPRESA", "CONDUCTOR"] },
  { label: "Registrar carga de combustible", href: "/combustible/nuevo", icon: Fuel, roles: ["ADMIN", "EMPRESA", "CONDUCTOR"] },
  { label: "Nuevo gasto", href: "/gastos/nuevo", icon: Receipt, roles: ["ADMIN", "EMPRESA"] },
  { label: "Nuevo impuesto", href: "/impuestos/nuevo", icon: Landmark, roles: ["ADMIN", "EMPRESA"] },
  { label: "Nuevo documento", href: "/documentacion/nuevo", icon: FileText },
  { label: "Nuevo proveedor", href: "/proveedores/nuevo", icon: Users2, roles: ["ADMIN", "EMPRESA"] },
  { label: "Nuevo comodato", href: "/comodatos/nuevo", icon: FileText, roles: ["ADMIN", "EMPRESA"] },
  { label: "Nuevo usuario", href: "/usuarios/nuevo", icon: UserCog, roles: ["ADMIN", "EMPRESA"] },
];
