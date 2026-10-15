# TRAZA — Handoff / continuidad de desarrollo

Este archivo es el punto de partida para retomar el proyecto en otra máquina (o para que Claude Code se oriente rápido al abrir la carpeta). El detalle completo de arquitectura, módulos y automatizaciones está en [`README.md`](./README.md) — acá va lo operativo: qué hay, cómo instalarlo, cómo verificarlo y qué falta saber.

_Generado: 2026-09-16, como preparación de portabilidad (sin cambios de funcionalidad)._

## 1. Estado actual del proyecto

- App funcional de punta a punta: landing pública, login, dashboard y los ~20 módulos del panel, todos con CRUD real contra Postgres (nada de mocks en el panel).
- Verificado en esta sesión (ver sección 6): `tsc`, `eslint`, los 6 scripts de test contra el servidor real, y `next build` — todo en verde.
- **Working tree con cambios sin commitear** al momento de este handoff (ver `git status` abajo) — son la última iteración de la landing pública (`/`), no tocan `(dashboard)/**` ni Prisma. Quedan como archivos en disco (se copian igual al mover la carpeta), pero **no están en el historial de git todavía** — si querés preservarlos como commit, hacelo antes de copiar/comprimir el proyecto.
- La base de datos local (Docker/Postgres) **no viaja con la carpeta del proyecto**: es un volumen Docker separado. En la notebook nueva hay que crearla de cero con migraciones + seed (paso a paso en la sección 4).

## 2. Requisitos en la máquina nueva

- **Node.js 20+** y **npm** (esta sesión corrió con Node v24.16.0 / npm 11.13.0 — cualquier 20+ debería andar).
- **Docker Desktop** (o un Postgres 16 accesible por su cuenta) — el proyecto no trae una base transportable, `docker-compose.yml` levanta Postgres 16 en `localhost:5433`.
- Git, para conservar el historial de commits.

No hace falta instalar nada más manualmente: todo lo demás (Next.js, Prisma, Playwright, etc.) se instala con `npm install`.

## 3. Instalación paso a paso

```bash
# 1. Copiar/clonar la carpeta del proyecto (sin node_modules/.next, ver sección 7)
npm install                  # reconstruye node_modules desde package-lock.json
cp .env.example .env         # completar JWT_SECRET con un valor propio (ver sección 5)
docker compose up -d         # levanta Postgres 16 local en localhost:5433 (requiere Docker Desktop corriendo)
npx prisma migrate deploy    # aplica la migración existente (prisma/migrations/20260909145928_init)
npm run db:seed              # carga el dataset demo (5 empresas, activos, flota, etc.)
npm run dev                  # http://localhost:3000
```

Cuentas demo (todas con password `demo1234`): `admin@traza.local`, `empresa@traza.local`, `proveedor@traza.local`, `tecnico@traza.local`, `conductor@traza.local` — detalle de cada una en el README, sección "Cuentas demo".

## 4. Base de datos: cómo reconstruirla desde cero

La base **no se copia** — se reconstruye con las migraciones versionadas en `prisma/migrations/`:

1. `docker compose up -d` — crea el contenedor `trazar-db-1` (Postgres 16, puerto host `5433`, usuario/clave/DB `traza`/`traza`/`traza`, definidos en `docker-compose.yml`, no son secretos reales, son solo para el contenedor local de desarrollo).
2. `npx prisma migrate deploy` — aplica `prisma/migrations/20260909145928_init/migration.sql` (la única migración existente, versionada en git) y crea todas las tablas del `schema.prisma`.
3. `npm run db:seed` — ejecuta `prisma/seed.ts`: **borra y recrea** todos los datos con un dataset demo ficticio completo y consistente (idempotente, pensado para dejar la demo siempre prolija).

Si en algún momento la base local queda en un estado raro, `npm run db:reset` hace `prisma migrate reset --force` (borra todo) + reaplica migraciones + seed — **solo usar en local/demo**, nunca contra una base de producción.

`npx prisma studio` sirve para inspeccionar los datos con una UI si hace falta.

## 5. Variables de entorno

`.env.example` ya está en el repo con todas las variables que el código realmente lee (confirmado por búsqueda de `process.env.*` en `src/`, `prisma/` y `scripts/`) — no hay ninguna variable usada en el código que falte ahí. Nada de `.env.example` es un secreto real:

| Variable | Obligatoria | Qué es |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión a Postgres. El valor de ejemplo apunta al Postgres local de `docker-compose.yml` (`traza`/`traza`, puerto 5433 — no estándar a propósito, para no chocar con un Postgres que ya tengas en 5432). |
| `JWT_SECRET` | Sí | Firma las cookies de sesión. El valor de ejemplo es un placeholder ("cambiar por un secreto largo y aleatorio") — **generar uno propio** antes de usar la app en serio. |
| `NEXT_PUBLIC_APP_NAME` | No (no se usa actualmente en el código, queda reservada) | — |
| `NEXT_PUBLIC_APP_URL` | Sí | Base URL pública, usada para construir la URL del QR (`/api/qr/[slug]`). |
| `N8N_WEBHOOK_URL`, `CRON_SECRET`, `SMTP_*`, `WHATSAPP_WEBHOOK_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `STRIPE_SECRET_KEY` | No | Integraciones opcionales, documentadas en el README. Sin configurarlas, esas funciones quedan preparadas pero inactivas — no rompen nada. |

El `.env` real de esta máquina **no se copia ni se expone** — está en `.gitignore` (`.env*` con excepción explícita de `.env.example`) y no se incluyó en ningún resumen de esta tarea.

## 6. Verificaciones ejecutadas en esta sesión (resultados reales, no supuestos)

Todas corridas contra el servidor de desarrollo real (`npm run dev`, puerto 3000) y la base Postgres local ya seedeada:

| Verificación | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | ✅ 0 errores |
| Lint | `npm run lint` | ✅ 0 errores, 0 warnings |
| Smoke test E2E (Playwright, 21 pasos: login, alta de cada módulo, QR público, etc.) | `npm run test:e2e` | ✅ `SMOKE TEST: TODO OK` |
| Guardas de borrado (no se puede eliminar un registro con historial asociado) | `npm run test:delete-guard` | ✅ `VERIFY DELETE GUARD: TODO OK` |
| Revocación de sesión al desactivar un usuario | `npm run test:session-revocation` | ✅ `VERIFY SESSION REVOCATION: TODO OK` |
| Límites de plan aplicados de verdad (no solo visual) | `npm run test:plan-limits` | ✅ `VERIFY PLAN LIMITS: TODO OK` |
| Aislamiento multi-tenant (un id de otra empresa no se puede colar por formData) | `npm run test:tenant-isolation` | ✅ `VERIFY TENANT ISOLATION: TODO OK` |
| Dashboard: datos reales y aislados por empresa | `npm run test:dashboard` | ✅ `VERIFY DASHBOARD: TODO OK` |
| Build de producción | `npm run build` | ✅ compila y genera las 38 rutas sin error |

Como los tests de verificación crean datos reales contra la base, se corrió `npm run db:seed` después de cada tanda para dejar la demo en estado limpio — la base queda igual que como se documenta en el README ("Datos demo (seed)").

No se encontró ningún problema que impida abrir y correr el proyecto en otra máquina.

## 7. Qué copiar (y qué no) al mover la carpeta

**Copiar** (es todo lo que hace falta para reconstruir el proyecto):

```
src/  prisma/  scripts/  public/
package.json  package-lock.json
next.config.ts  tsconfig.json  eslint.config.mjs  postcss.config.mjs
docker-compose.yml
.env.example
.gitignore  .git/  (para conservar el historial de commits)
README.md  AGENTS.md  CLAUDE.md  TRAZA_HANDOFF.md
```

**NO copiar** (se regeneran solos, o son basura local — ya están en `.gitignore`, pero si vas a comprimir la carpeta a mano, excluilos explícitamente):

```
node_modules/       -> se reconstruye con npm install
.next/              -> build de desarrollo, se regenera con npm run dev / build
*.tsbuildinfo        -> cache incremental de TypeScript
.env                 -> tiene secretos reales de ESTA máquina, no se copia
prisma/dev.db*       -> residuo de un motor sqlite anterior, no aplica (el proyecto usa Postgres vía Docker)
scripts/smoke-failure-*.png -> capturas de fallos de test, no había ninguna al momento de este handoff
```

La base de datos en sí (los datos de Postgres) tampoco viaja — es un volumen Docker en esta máquina. En la notebook nueva se recrea vacía y se puebla con `npm run db:seed` (sección 4).

## 8. Comandos de referencia rápida

```bash
npm run dev                    # desarrollo (Turbopack), http://localhost:3000
npm run build && npm run start # build + servir producción
npm run lint                   # ESLint
npx tsc --noEmit                # typecheck
npm run test:e2e                # smoke test Playwright (requiere npm run dev en otra terminal)
npm run test:delete-guard
npm run test:session-revocation
npm run test:plan-limits
npm run test:tenant-isolation
npm run test:dashboard
npm run db:seed                 # recrea el dataset demo (borra datos actuales)
npm run db:reset                # reset completo de la base + seed (solo local/demo)
npx prisma studio                # explorar la base con una UI
```

## 9. Cosas a tener en cuenta al retomar

- El proyecto **no tiene selector de tema claro/oscuro** — toda la app (dashboard y landing) es dark-mode único, por diseño.
- La landing pública (`src/app/page.tsx` + `src/components/marketing/**`) tiene una sección de "TRAZA IA" que es **100% demo, sin red ni credenciales** (`src/lib/ai-demo/`) — el contrato `AiProvider` está pensado para que un proveedor real lo reemplace sin tocar los componentes de UI, pero hoy no hay ninguna integración de IA real conectada a nada.
- No hay ruta de registro/signup pública — el alta de usuarios es interna (panel de Usuarios, o `prisma/seed.ts` para datos demo).
- Windows: en esta máquina, `docker-compose.yml` depende de que **Docker Desktop esté corriendo** (no alcanza con tener el CLI de `docker` instalado) — si `docker compose up -d` falla con un error de pipe/engine, es porque Docker Desktop no arrancó todavía.
