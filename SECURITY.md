# Seguridad pre-producción — estado de TRAZA

Revisión contra el checklist "Seguridad antes de salir a producción". Cada punto: cómo se cumple y cómo verificarlo.

| # | Punto | Estado | Dónde / cómo verificar |
|---|---|---|---|
| 1 | Claves en variables de entorno, falla fuerte en prod | ✅ | `src/lib/env.ts` + `src/instrumentation.ts`: sin `JWT_SECRET` válido (≥32 caracteres, distinto del de ejemplo) el server no arranca. `npm run test:security`. |
| 2 | Secretos fuera del VCS | ✅ | `.gitignore` excluye `.env*` salvo `.env.example`. CI corre gitleaks sobre todo el historial. |
| 3 | Acceso del cliente a la base | N/A | Backend propio: el navegador nunca habla con Postgres. |
| 4/7 | Aislamiento entre empresas / permisos por objeto | ✅ | Filtrado por `empresaId` en cada query (`src/lib/scope.ts`) y chequeo en cada action. `npm run test:tenant-isolation` (lectura por id → 404, listados, inyección de ids ajenos) corre en CI. |
| 6 | Default cerrado | ✅ | `src/proxy.ts`: todo exige sesión salvo una lista pública justificada línea por línea. |
| 8 | Sin asignación masiva | ✅ | Schemas zod con campos explícitos; `rol`/`empresaId` se validan contra la sesión. |
| 9 | Cookies de sesión | ✅ | `traza_session`: HttpOnly, Secure en prod, SameSite=Lax. |
| 10 | Contraseñas hasheadas + política | ✅ | bcrypt (12 rondas). `src/lib/password-policy.ts`: mín. 10 caracteres, bloqueo de comunes y del usuario del email. |
| 11 | Rate limiting | ✅ app / ⚠️ borde | `src/lib/rate-limit.ts`: 5 fallos por email o 20 por IP en 15 min bloquean el login (persistido en AuditLog). En el borde: configurar una regla de rate limit del WAF/CDN para `/login`. |
| 12 | Anti-bot | N/A | No hay registro abierto: los usuarios los crea un ADMIN/EMPRESA. Si se agrega registro público, sumar Turnstile + bloqueo de emails descartables. |
| 13 | Queries parametrizadas | ✅ | Solo Prisma; cero `$queryRaw`/`$executeRaw`. |
| 14 | Validación de inputs | ✅ | zod + `src/lib/validation.ts` (fechas, números, URLs): datos inválidos → mensaje claro, no 500. |
| 15 | Anti-XSS | ✅ | React escapa por defecto; cero `dangerouslySetInnerHTML`. Enlaces de comprobantes solo `http(s)`. |
| 16 | Archivos subidos | ✅ | Foto de ticket: re-codificada a JPEG en el navegador; el server valida tipo real (magic bytes), solo JPEG/PNG/WebP, máx. 700 KB. Se muestra como `<img>` (no ejecutable). |
| 17 | Respuestas sin secretos | ✅ | `passwordHash` omitido globalmente en Prisma (`src/lib/prisma.ts`); solo el login lo pide. |
| 18 | Security headers + CSP | ✅ (CSP en Report-Only) | `next.config.ts`. Violaciones en logs como `[csp]`. Con cero violaciones → `CSP_ENFORCE=true`. |
| 19 | HTTPS + HSTS | ✅ | HSTS con preload en prod. Vercel redirige 80→443; en self-hosting, `FORCE_HTTPS=true`. |
| 20 | Auditoría de dependencias | ✅ | `npm run security:audit` en CI (falla ante high/critical nuevas; excepciones con motivo y vencimiento en `.audit-allowlist.json`) + Dependabot. |

## Riesgos propios de TRAZA (★)

- **SSRF en webhooks**: las empresas configuran URLs que el server llama. `src/lib/webhook-url.ts` bloquea metadata cloud, redes privadas y localhost en prod (salvo `WEBHOOK_ALLOWED_HOSTS`), no sigue redirects y corta a los 8 s.
- **Fichas públicas por QR**: el slug lleva un sufijo aleatorio para que no se puedan enumerar. Los activos creados antes conservan el slug viejo: correr `npm run security:rotar-qr-slugs -- --confirm` antes del lanzamiento (invalida etiquetas ya impresas).
- **Borrado restringido por rol**: solo ADMIN y EMPRESA pueden eliminar registros (`src/lib/permisos.ts`, chequeado en cada server action); técnicos, conductores y proveedores cargan y editan.
- **Open redirect tras login**: `?next=` solo acepta rutas internas (`src/lib/safe-redirect.ts`).
- **Cron**: secreto comparado en tiempo constante; preferir el header `x-cron-secret` o `Authorization: Bearer` al `?secret=` (queda en logs).

## Antes de lanzar

- [ ] `JWT_SECRET` y `CRON_SECRET` generados al azar en el entorno del server (nunca por chat).
- [ ] No correr `npm run db:seed` en producción (crea usuarios demo con contraseña `demo1234`).
- [ ] Rotar slugs QR viejos (ver arriba).
- [ ] Regla de rate limit en el borde para `/login`.
- [ ] Revisar logs `[csp]` y pasar a `CSP_ENFORCE=true`.
- [ ] Upgrade a Prisma 7 en PR dedicado (cierra GHSA-ggr8-5vv4-36mx, excepción vence 2026-12-31).
