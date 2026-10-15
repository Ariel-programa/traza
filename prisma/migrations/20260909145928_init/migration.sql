-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'EMPRESA', 'PROVEEDOR', 'TECNICO', 'CONDUCTOR');

-- CreateEnum
CREATE TYPE "NombrePlan" AS ENUM ('FREE', 'PROFESIONAL', 'EMPRESA');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('ACTIVA', 'VENCIDA', 'CANCELADA', 'DEMO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('APROBADO', 'PENDIENTE', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "TipoUbicacion" AS ENUM ('PLANTA', 'SUCURSAL', 'DEPOSITO', 'OFICINA', 'TALLER');

-- CreateEnum
CREATE TYPE "EstadoProveedor" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoTecnico" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoActivo" AS ENUM ('MATAFUEGO', 'EQUIPO_MEDICO', 'EQUIPO_INFORMATICO', 'HERRAMIENTA', 'MAQUINARIA', 'ALARMA', 'EQUIPO_CONTRA_INCENDIO', 'EQUIPO_ELECTRICO', 'VEHICULO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoActivo" AS ENUM ('VIGENTE', 'PROXIMO_A_VENCER', 'VENCIDO', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('PROPIO', 'COMODATO');

-- CreateEnum
CREATE TYPE "TipoMantenimiento" AS ENUM ('INSPECCION', 'MANTENIMIENTO', 'REPARACION', 'RECARGA', 'CALIBRACION', 'INSTALACION', 'RETIRO', 'OTRO');

-- CreateEnum
CREATE TYPE "EntidadDocumento" AS ENUM ('ACTIVO', 'VEHICULO', 'CONDUCTOR', 'PROVEEDOR', 'EMPRESA');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('VIGENTE', 'PROXIMO_A_VENCER', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoVehiculo" AS ENUM ('DISPONIBLE', 'EN_VIAJE', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO');

-- CreateEnum
CREATE TYPE "EstadoConductor" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoTraslado" AS ENUM ('PLANIFICADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('COMBUSTIBLE', 'PEAJE', 'MANTENIMIENTO', 'REPARACION', 'ENVIO', 'SEGURO', 'OTROS');

-- CreateEnum
CREATE TYPE "EstadoImpuesto" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT,
    "proveedorId" TEXT,
    "tecnicoId" TEXT,
    "conductorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "nombre" "NombrePlan" NOT NULL,
    "precioMensual" INTEGER NOT NULL,
    "limiteActivos" INTEGER NOT NULL,
    "limiteUsuarios" INTEGER NOT NULL,
    "features" TEXT NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suscripcion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'DEMO',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRenovacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "suscripcionId" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" TEXT NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'APROBADO',

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoUbicacion" NOT NULL,
    "direccion" TEXT,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "servicio" TEXT NOT NULL,
    "estado" "EstadoProveedor" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tecnico" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "matricula" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "estado" "EstadoTecnico" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoActivo" NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "estado" "EstadoActivo" NOT NULL DEFAULT 'VIGENTE',
    "empresaId" TEXT NOT NULL,
    "ubicacionId" TEXT,
    "proveedorId" TEXT,
    "modalidad" "Modalidad" NOT NULL DEFAULT 'PROPIO',
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAdquisicion" TIMESTAMP(3),
    "ultimaInspeccion" TIMESTAMP(3),
    "proximoVencimiento" TIMESTAMP(3),
    "atributos" TEXT,
    "observaciones" TEXT,
    "qrSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comodato" (
    "id" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "propietario" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinal" TIMESTAMP(3),
    "estado" TEXT NOT NULL,
    "ubicacion" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "Comodato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mantenimiento" (
    "id" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedorId" TEXT,
    "tecnicoId" TEXT,
    "tipo" "TipoMantenimiento" NOT NULL,
    "resultado" TEXT,
    "observaciones" TEXT,
    "proximaFecha" TIMESTAMP(3),
    "documentoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "entidadTipo" "EntidadDocumento" NOT NULL,
    "entidadId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "fechaEmision" TIMESTAMP(3),
    "vencimiento" TIMESTAMP(3),
    "archivoUrl" TEXT,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'VIGENTE',
    "activoId" TEXT,
    "vehiculoId" TEXT,
    "conductorId" TEXT,
    "proveedorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "patente" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER,
    "tipo" TEXT NOT NULL,
    "kilometraje" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoVehiculo" NOT NULL DEFAULT 'DISPONIBLE',
    "serviceProximo" TIMESTAMP(3),
    "vtvVencimiento" TIMESTAMP(3),
    "seguroVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conductor" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "documento" TEXT,
    "licencia" TEXT,
    "licenciaVencimiento" TIMESTAMP(3),
    "telefono" TEXT,
    "estado" "EstadoConductor" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Conductor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Traslado" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "vehiculoId" TEXT,
    "conductorId" TEXT,
    "cliente" TEXT,
    "estado" "EstadoTraslado" NOT NULL DEFAULT 'PLANIFICADO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Traslado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombustibleCarga" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehiculoId" TEXT NOT NULL,
    "conductorId" TEXT,
    "estacion" TEXT,
    "litros" DOUBLE PRECISION NOT NULL,
    "precioLitro" DOUBLE PRECISION NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,
    "kilometraje" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CombustibleCarga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" "CategoriaGasto" NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,
    "proveedorId" TEXT,
    "activoId" TEXT,
    "vehiculoId" TEXT,
    "trasladoId" TEXT,
    "comprobanteUrl" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Impuesto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "vehiculoId" TEXT,
    "activoId" TEXT,
    "importe" DOUBLE PRECISION NOT NULL,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "estado" "EstadoImpuesto" NOT NULL DEFAULT 'PENDIENTE',
    "comprobanteUrl" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Impuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "empresaId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookConfig" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT,
    "evento" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_empresaId_idx" ON "User"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_nombre_key" ON "Plan"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Suscripcion_empresaId_key" ON "Suscripcion"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Activo_codigo_key" ON "Activo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Activo_qrSlug_key" ON "Activo"("qrSlug");

-- CreateIndex
CREATE INDEX "Activo_empresaId_idx" ON "Activo"("empresaId");

-- CreateIndex
CREATE INDEX "Activo_tipo_idx" ON "Activo"("tipo");

-- CreateIndex
CREATE INDEX "Activo_estado_idx" ON "Activo"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Comodato_activoId_key" ON "Comodato"("activoId");

-- CreateIndex
CREATE INDEX "Mantenimiento_activoId_idx" ON "Mantenimiento"("activoId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "Vehiculo"("patente");

-- CreateIndex
CREATE UNIQUE INDEX "Traslado_numero_key" ON "Traslado"("numero");

-- CreateIndex
CREATE INDEX "Impuesto_empresaId_idx" ON "Impuesto"("empresaId");

-- CreateIndex
CREATE INDEX "Impuesto_estado_idx" ON "Impuesto"("estado");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suscripcion" ADD CONSTRAINT "Suscripcion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suscripcion" ADD CONSTRAINT "Suscripcion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "Suscripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tecnico" ADD CONSTRAINT "Tecnico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comodato" ADD CONSTRAINT "Comodato_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conductor" ADD CONSTRAINT "Conductor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traslado" ADD CONSTRAINT "Traslado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traslado" ADD CONSTRAINT "Traslado_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traslado" ADD CONSTRAINT "Traslado_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombustibleCarga" ADD CONSTRAINT "CombustibleCarga_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombustibleCarga" ADD CONSTRAINT "CombustibleCarga_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_trasladoId_fkey" FOREIGN KEY ("trasladoId") REFERENCES "Traslado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impuesto" ADD CONSTRAINT "Impuesto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impuesto" ADD CONSTRAINT "Impuesto_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impuesto" ADD CONSTRAINT "Impuesto_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
