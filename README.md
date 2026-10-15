# TRAZA

**Todo bajo control.**

TRAZA es una plataforma de gestión, trazabilidad y operaciones empresariales. Centraliza activos, mantenimiento, proveedores, documentación, códigos QR, vencimientos, alertas, flota, logística, combustible y gastos en un solo lugar.

El primer caso de uso completo es la gestión de **matafuegos** (control de vencimientos, inspecciones y recargas), pero la arquitectura es genérica: soporta equipos médicos, equipos informáticos, herramientas, maquinaria, alarmas y cualquier otro tipo de activo con el mismo modelo de datos.

---

## Índice

- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Datos demo (seed)](#datos-demo-seed)
- [Cuentas demo](#cuentas-demo)
- [Ejecución](#ejecución)
- [Testing](#testing)
- [Módulos funcionales](#módulos-funcionales)
- [Códigos QR](#códigos-qr)
- [Automatizaciones (n8n)](#automatizaciones-n8n)
- [Email y WhatsApp](#email-y-whatsapp)
- [Planes / SaaS y pagos](#planes--saas-y-pagos)
- [Roles y permisos](#roles-y-permisos)
- [Estructura del proyecto](#estructura-del-proyecto)

---

## Arquitectura

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Estilos | Tailwind CSS v4. Dark mode profesional como identidad persistente (no es un toggle): toda la app consume el mismo set de variables CSS en `globals.css` (superficies, texto, semánticos, spacing, radius, shadows), por eso un solo cambio de paleta re-estiliza todo el panel. Glassmorphism acotado a header, Command Palette y overlays (`.glass` en `globals.css`). |
| Base de datos | PostgreSQL vía Prisma ORM (`prisma/schema.prisma`); en local corre en Docker (`docker-compose.yml`) |
| Autenticación | Cookie httpOnly + JWT firmado (`jose`) y contraseñas con `bcryptjs`. Implementación propia, sin proveedor externo. |
| Mutaciones | Server Actions de Next.js (sin capa de API REST intermedia para el CRUD interno) |
| QR | Generación server-side con `qrcode`, servido en `/api/qr/[slug]` |
| Gráficos | Recharts |
| Automatizaciones | Webhooks salientes hacia n8n + endpoint de verificación de vencimientos |
| Testing | `tsc --noEmit`, y un smoke test end-to-end con Playwright |

No hay una API REST pública separada: las páginas del panel (`src/app/(dashboard)/**`) son Server Components que leen directo de Prisma, y las mutaciones (crear/editar/eliminar) son Server Actions co-ubicadas en cada módulo (`actions.ts`). Las únicas rutas HTTP explícitas son:

- `GET /api/qr/[slug]` — imagen PNG del código QR de un activo.
- `GET /public/activo/[slug]` — ficha pública (sin login) que ve alguien al escanear el QR.
- `GET /api/cron/verificar-vencimientos` — pensado para ser llamado por un scheduler externo (ver [Automatizaciones](#automatizaciones-n8n)).

El modelo de datos central es **`Activo`**: una entidad genérica con `tipo` (matafuego, equipo médico, equipo informático, herramienta, maquinaria, alarma, equipo contra incendio, equipo eléctrico, vehículo, otro), estado de vencimiento, ubicación, proveedor, modalidad (propio/comodato) y un campo `atributos` (JSON) para los datos específicos de cada tipo (por ejemplo, capacidad y tipo de carga en un matafuego, o subtipo y responsable en un equipo médico). Esto permite agregar nuevos tipos de activo sin migrar el esquema.

## Instalación

Requisitos: Node.js 20+ y npm.

```bash
npm install
cp .env.example .env       # completar JWT_SECRET con un valor propio
docker compose up -d       # levanta PostgreSQL local en localhost:5433
npx prisma migrate deploy  # aplica el esquema
npm run db:seed            # carga datos demo ficticios
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Variables de entorno

Ver `.env.example`. Las obligatorias para correr en local son:

```
DATABASE_URL="postgresql://traza:traza@localhost:5433/traza"
JWT_SECRET="un-secreto-largo-y-aleatorio"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

El resto (`N8N_WEBHOOK_URL`, `CRON_SECRET`, `SMTP_*`, `WHATSAPP_WEBHOOK_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `STRIPE_SECRET_KEY`) son opcionales y habilitan integraciones externas descriptas más abajo. Sin configurarlas, TRAZA funciona igual: esas funciones quedan preparadas pero inactivas (nunca se inventan credenciales ni se simulan integraciones reales).

## Base de datos y migraciones

El esquema vive en `prisma/schema.prisma` (PostgreSQL). En local, `docker-compose.yml` levanta un Postgres en `localhost:5433` (puerto no estándar a propósito, para no chocar con un Postgres que ya tengas corriendo en el `5432`). En producción, `DATABASE_URL` apunta a la base gestionada que corresponda (Neon, Supabase, RDS, etc.) — el resto del código no depende del proveedor.

```bash
npx prisma migrate dev --name <nombre>   # crear una migración nueva (local)
npx prisma migrate deploy                # aplicar migraciones pendientes (producción)
npx prisma studio                        # explorar los datos con una UI
npm run db:reset                         # borra todo y vuelve a aplicar migraciones + seed (¡solo en local/demo!)
```

## Datos demo (seed)

`prisma/seed.ts` genera un dataset ficticio completo y consistente:

- 5 empresas de rubros distintos (bodega, clínica, colegio, hotel, distribuidora logística)
- 15 ubicaciones, 10 proveedores, 10 técnicos
- 50 activos: 30 matafuegos, 10 equipos médicos, 10 otros (notebooks, herramientas, maquinaria, alarmas, etc.)
- 15 comodatos, 20 mantenimientos, 30 documentos
- 8 vehículos, 10 conductores, 20 traslados, 30 cargas de combustible, 30 gastos, 18 impuestos
- Planes (Free/Profesional/Empresa), suscripciones y pagos demo
- Vencimientos distribuidos deliberadamente entre vigente / próximo a vencer / vencido, para que las alertas y los estados se vean poblados desde el primer login

Volver a correr `npm run db:seed` **borra y recrea todos los datos** (incluida cualquier prueba manual que hayas hecho) — es idempotente y pensado para dejar la demo siempre en un estado prolijo.

## Cuentas demo

Todas con contraseña **`demo1234`**:

| Email | Rol | Contexto |
|---|---|---|
| `admin@traza.local` | Administrador | Ve todas las empresas |
| `empresa@traza.local` | Empresa | Bodega San Rafael S.A. (plan Empresa) |
| `proveedor@traza.local` | Proveedor | Ve sus activos y mantenimientos asignados |
| `tecnico@traza.local` | Técnico | Pensado para el flujo mobile de mantenimiento |
| `conductor@traza.local` | Conductor | Ve traslados y carga combustible |

## Ejecución

```bash
npm run dev     # desarrollo (Turbopack)
npm run build   # build de producción
npm run start   # servir el build
npm run lint    # ESLint
```

## Testing

- `npx tsc --noEmit` — chequeo de tipos de todo el proyecto.
- `npm run test:e2e` — smoke test end-to-end con Playwright (`scripts/smoke-test.mjs`). Requiere el servidor de desarrollo corriendo en otra terminal (`npm run dev`). Recorre por navegador real el flujo completo: login, alta de activo, mantenimiento (verifica que actualiza el vencimiento), proveedor, documento, comodato, vehículo, conductor, traslado, combustible, gasto, impuesto, ficha del vehículo, Centro de Vencimientos, usuario, checkout demo de plan, configuración de empresa, webhook de n8n y la ficha pública de QR sin login.
- `npm run test:delete-guard` — verifica con Playwright (`scripts/verify-delete-guard.mjs`) que no se puedan eliminar activos, vehículos, proveedores, conductores ni traslados con historial asociado: el intento debe bloquearse con un mensaje y el registro debe seguir existiendo. También requiere el servidor de desarrollo corriendo.
- `npm run test:session-revocation` — verifica con Playwright (`scripts/verify-session-revocation.mjs`) que desactivar un usuario desde **Usuarios** corte su sesión ya iniciada de inmediato, en vez de esperar a que el JWT expire por su cuenta (hasta 7 días). También requiere el servidor de desarrollo corriendo.
- `npm run test:plan-limits` — verifica con Playwright (`scripts/verify-plan-limits.mjs`) que el límite de activos del plan (Free/Profesional/Empresa) se aplique de verdad al crear un activo, no solo se muestre como barra de progreso en **Planes**. También requiere el servidor de desarrollo corriendo.
- `npm run test:tenant-isolation` — verifica con Playwright (`scripts/verify-tenant-isolation.mjs`) que un usuario no pueda enganchar un traslado o un gasto nuevo al vehículo/traslado de otra empresa manipulando el `<select>` del formulario (los Server Actions revalidan la empresa de cada id recibido, no confían en que la UI solo ofrezca las opciones propias). También requiere el servidor de desarrollo corriendo.
- `npm run test:dashboard` — verifica con Playwright (`scripts/verify-dashboard.mjs`) que las tarjetas, "Gastos por categoría" y la actividad reciente del Dashboard muestren exactamente los datos de la empresa logueada (nunca los de otra) y que un alta real por la UI aparezca en la línea de tiempo de actividad. También requiere el servidor de desarrollo corriendo.

  Como estos tests crean datos reales contra la base, conviene correr `npm run db:seed` después de usarlos para dejar la demo limpia de datos de prueba.

## Módulos funcionales

Completamente funcionales (CRUD real contra la base, sin datos simulados):

Dashboard como centro de control operativo (hero funcional, Centro de Atención con el corte vencido/7d/30d, KPIs enlazados a su módulo, estado de flota y operación, tendencia de gastos con selector de período, gastos por categoría e insight, actividad reciente) · Buscador global (`Ctrl K` / `⌘K`, Command Palette con resultados en vivo sobre activos, vehículos, proveedores, conductores y traslados — mismo motor que `/buscar`, en `src/lib/search.ts`) · Activos (genérico: matafuegos, equipos médicos —con calibración—, otros) · Mantenimiento · Proveedores · Documentación · Comodatos · Centro de Vencimientos (`/vencimientos`, consolida activos/documentos/flota/mantenimiento/impuestos por rango de días) · Impuestos (patentes, ingresos brutos, monotributo, etc. con vencimiento y estado de pago real) · QR (generación, ficha pública, etiqueta imprimible) · Flota (vehículos con ficha completa tipo "centro de control", y conductores) · Logística (traslados con costo calculado) · Combustible · Gastos · Reportes agregados (incluye impuestos y gasto por vehículo) · Usuarios y roles · Planes/SaaS con checkout demo y límites de uso aplicados de verdad · Configuración de empresa y automatizaciones · Auditoría.

## Códigos QR

Cada `Activo` tiene un `qrSlug` único. `/api/qr/[slug]` genera la imagen PNG on-the-fly apuntando a `/public/activo/[slug]`, una ficha **pública y mobile-first** que no requiere login y no expone datos sensibles (sin costos, sin observaciones internas, sin datos de otras empresas). Desde la ficha de cada activo en el panel se puede ver el QR, abrir la página pública o generar una etiqueta lista para imprimir (`/qr/[id]/imprimir`).

## Automatizaciones (n8n)

TRAZA no envía emails ni WhatsApp directamente. El flujo es:

```
TRAZA → Webhook → n8n → Email / WhatsApp
```

1. En **Configuración → Automatizaciones** se cargan webhooks por evento (`ACTIVO_PROXIMO_A_VENCER`, `ACTIVO_VENCIDO`, `MANTENIMIENTO_PROXIMO`, `DOCUMENTACION_PROXIMA_A_VENCER`, `NUEVO_TRASLADO`, `MANTENIMIENTO_REALIZADO`, `IMPUESTO_PROXIMO_A_VENCER`, `IMPUESTO_VENCIDO`, `VEHICULO_DOCUMENTACION_PROXIMA_A_VENCER`) apuntando a una URL de webhook de n8n.
2. TRAZA dispara esos webhooks automáticamente al registrar un mantenimiento o un traslado.
3. Para los eventos de vencimiento (que dependen del paso del tiempo, no de una acción del usuario), existe `GET /api/cron/verificar-vencimientos`: recalcula el estado de todos los activos, documentos, impuestos, mantenimientos programados (`Mantenimiento.proximaFecha`) y flota (VTV/seguro/service de `Vehiculo`), y dispara los webhooks correspondientes a los que están vencidos o próximos a vencer — las mismas cinco categorías que alimentan el Centro de Vencimientos (`src/lib/vencimientos-center.ts`), así que todo lo que se ve ahí también sale por webhook. Está pensado para ser llamado una vez por día desde un **Schedule Trigger de n8n** (o cualquier cron externo), pasando el secreto configurado en `CRON_SECRET` como `?secret=...` o header `x-cron-secret`. Sin `CRON_SECRET` configurado, el endpoint responde `501` y queda deshabilitado por seguridad.

## Email y WhatsApp

No se inventaron credenciales ni proveedores. La integración queda preparada así:

- **Email**: configurar `SMTP_*` en `.env` y que el workflow de n8n que recibe los webhooks envíe el correo (n8n trae un nodo SMTP/Email listo para usar).
- **WhatsApp**: agregar el webhook de WhatsApp Business API (o el proveedor que se use) dentro del mismo workflow de n8n, disparado por los eventos de TRAZA. `WHATSAPP_WEBHOOK_URL` queda como referencia en `.env.example`.

## Planes / SaaS y pagos

`Plan` (Free/Profesional/Empresa) y `Suscripcion` son modelos reales en la base. La pantalla **Planes** muestra el uso actual contra el límite del plan y permite "contratar" un plan: esto **no cobra dinero real**, crea un registro de `Pago` con `metodo: "demo"` para dejar completo el flujo de UI/datos. La integración real con Mercado Pago o Stripe queda como próximo paso (variables `MERCADOPAGO_ACCESS_TOKEN` / `STRIPE_SECRET_KEY` reservadas en `.env.example`, sin usar).

Los límites de activos y de usuarios por plan (`Plan.limiteActivos` / `Plan.limiteUsuarios`) no son solo decorativos: `src/lib/plan-limits.ts` los aplica al crear un activo o un usuario, devolviendo un error si la empresa ya alcanzó el límite de su plan.

## Roles y permisos

| Rol | Alcance |
|---|---|
| `ADMIN` | Ve y administra todas las empresas |
| `EMPRESA` | Acotado a su propia empresa; puede gestionar todos sus módulos y usuarios |
| `PROVEEDOR` | Pensado para ver los activos y mantenimientos donde está asignado |
| `TECNICO` | Flujo mobile: escanear QR → ver activo → registrar mantenimiento |
| `CONDUCTOR` | Ve sus traslados y registra cargas de combustible |

El middleware (`src/proxy.ts`) protege todo el panel salvo `/login`, `/public/**` y los endpoints públicos de QR/webhooks. Cada Server Action valida además que el usuario tenga permiso sobre la empresa del registro que está modificando.

## Estructura del proyecto

```
prisma/
  schema.prisma        modelo de datos completo
  seed.ts               datos demo ficticios
src/
  app/
    login/              login (Server Action + useActionState)
    (dashboard)/         panel protegido: un directorio por módulo
      <modulo>/
        page.tsx          listado (Server Component)
        actions.ts         Server Actions (crear/editar/eliminar)
        <modulo>-form.tsx   formulario (Client Component)
        <modulo>-table.tsx  tabla con búsqueda/filtros (Client Component)
    api/
      qr/[slug]/          imagen QR
      cron/verificar-vencimientos/
    public/activo/[slug]/ ficha pública sin login
  components/
    ui/                   sistema de diseño (Button, Badge, Card, DataTable, ...)
    layout/               sidebar, topbar, navegación mobile
    charts/               gráficos (Recharts)
    brand/                logo
    marketing/            landing pública (nav, footer, secciones e ilustraciones propias)
      sections/           un archivo por sección de la landing (Hero, Problema, Dashboard, ...)
      illustrations/       piezas visuales SVG/CSS propias (sin screenshots ni deps nuevas)
  lib/
    ai-demo/              tipos + proveedor demo (sin red) del asistente "TRAZA IA" de la landing
    ...                    prisma client, auth, scoping por empresa, formatters, webhooks
scripts/
  smoke-test.mjs          test end-to-end (Playwright)
  verify-*.mjs            scripts de verificación puntuales (ver Testing)
```

Patrón repetido en cada módulo del panel: `page.tsx` (Server Component) hace `getSession()` + query a Prisma scopeada por empresa (`empresaWhere`) y le pasa los datos ya resueltos a un Client Component `<Modulo>Table` que arma las columnas de `DataTable` (las funciones de render no pueden cruzar el límite Server → Client de React Server Components, por eso las tablas viven en un Client Component aparte). Las mutaciones son Server Actions con validación `zod`, chequeo de permiso por empresa y `revalidatePath` + `redirect` al terminar.
