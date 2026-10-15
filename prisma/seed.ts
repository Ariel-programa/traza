import { PrismaClient, Rol, TipoUbicacion, EstadoProveedor, EstadoTecnico, TipoActivo, EstadoActivo, Modalidad, TipoMantenimiento, EntidadDocumento, EstadoDocumento, EstadoVehiculo, EstadoConductor, EstadoTraslado, CategoriaGasto, NombrePlan, EstadoSuscripcion, EstadoPago } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------- helpers ----------
function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickIndex<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pad(n: number, len = 5) {
  return String(n).padStart(len, "0");
}
const HOY = new Date();

function estadoDesdeFecha(fecha: Date): EstadoActivo {
  const dias = Math.round((fecha.getTime() - HOY.getTime()) / 86400000);
  if (dias < 0) return EstadoActivo.VENCIDO;
  if (dias <= 30) return EstadoActivo.PROXIMO_A_VENCER;
  return EstadoActivo.VIGENTE;
}
function estadoImpuestoDesdeFecha(fecha: Date, pagado: boolean): "PAGADO" | "PENDIENTE" | "VENCIDO" {
  if (pagado) return "PAGADO";
  const dias = Math.round((fecha.getTime() - HOY.getTime()) / 86400000);
  return dias < 0 ? "VENCIDO" : "PENDIENTE";
}
function estadoDocDesdeFecha(fecha: Date): EstadoDocumento {
  const dias = Math.round((fecha.getTime() - HOY.getTime()) / 86400000);
  if (dias < 0) return EstadoDocumento.VENCIDO;
  if (dias <= 30) return EstadoDocumento.PROXIMO_A_VENCER;
  return EstadoDocumento.VIGENTE;
}

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.auditLog.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.suscripcion.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.impuesto.deleteMany();
  await prisma.combustibleCarga.deleteMany();
  await prisma.traslado.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.mantenimiento.deleteMany();
  await prisma.comodato.deleteMany();
  await prisma.activo.deleteMany();
  await prisma.conductor.deleteMany();
  await prisma.vehiculo.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tecnico.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.ubicacion.deleteMany();
  await prisma.webhookConfig.deleteMany();
  await prisma.empresa.deleteMany();

  // ---------- Planes ----------
  console.log("Creando planes...");
  const planFree = await prisma.plan.create({
    data: {
      nombre: NombrePlan.FREE,
      precioMensual: 0,
      limiteActivos: 15,
      limiteUsuarios: 2,
      features: JSON.stringify(["activos", "qr", "mantenimiento_basico", "dashboard"]),
    },
  });
  const planPro = await prisma.plan.create({
    data: {
      nombre: NombrePlan.PROFESIONAL,
      precioMensual: 25000,
      limiteActivos: 150,
      limiteUsuarios: 8,
      features: JSON.stringify([
        "activos", "qr", "mantenimiento", "proveedores", "documentacion", "alertas", "reportes", "automatizaciones",
      ]),
    },
  });
  const planEmpresa = await prisma.plan.create({
    data: {
      nombre: NombrePlan.EMPRESA,
      precioMensual: 60000,
      limiteActivos: 1000,
      limiteUsuarios: 50,
      features: JSON.stringify([
        "activos", "qr", "mantenimiento", "proveedores", "documentacion", "alertas", "reportes",
        "flota", "logistica", "combustible", "gastos", "usuarios_multiples", "automatizaciones",
      ]),
    },
  });

  // ---------- Empresas ----------
  console.log("Creando empresas...");
  const empresasData = [
    { nombre: "Bodega San Rafael S.A.", cuit: "30-71234567-8", email: "contacto@sanrafael.demo", telefono: "261-4550012", plan: planEmpresa },
    { nombre: "Clínica Los Aromos", cuit: "30-70998812-3", email: "administracion@losaromos.demo", telefono: "351-4223344", plan: planPro },
    { nombre: "Colegio Nuevo Horizonte", cuit: "30-69887744-1", email: "info@nuevohorizonte.demo", telefono: "11-47781122", plan: planFree },
    { nombre: "Hotel Costanera Suites", cuit: "30-70112233-5", email: "recepcion@costanerasuites.demo", telefono: "342-4556677", plan: planPro },
    { nombre: "Distribuidora Andina Logística S.R.L.", cuit: "30-71556699-0", email: "operaciones@andinalog.demo", telefono: "261-4998877", plan: planEmpresa },
  ];

  const empresas = [];
  for (const e of empresasData) {
    const empresa = await prisma.empresa.create({
      data: { nombre: e.nombre, cuit: e.cuit, email: e.email, telefono: e.telefono },
    });
    await prisma.suscripcion.create({
      data: {
        empresaId: empresa.id,
        planId: e.plan.id,
        estado: e.plan.nombre === NombrePlan.FREE ? EstadoSuscripcion.DEMO : EstadoSuscripcion.ACTIVA,
        fechaInicio: addDays(HOY, -randInt(30, 400)),
        fechaRenovacion: addDays(HOY, randInt(5, 60)),
      },
    });
    empresas.push({ ...empresa, planNombre: e.plan.nombre });
  }
  const [bodega, clinica, colegio, hotel, andina] = empresas;

  // pagos demo para empresas pagas
  for (const emp of empresas.filter((e) => e.planNombre !== NombrePlan.FREE)) {
    const susc = await prisma.suscripcion.findUnique({ where: { empresaId: emp.id } });
    if (!susc) continue;
    for (let i = 3; i >= 1; i--) {
      await prisma.pago.create({
        data: {
          suscripcionId: susc.id,
          monto: emp.planNombre === NombrePlan.EMPRESA ? 60000 : 25000,
          fecha: addDays(HOY, -30 * i),
          metodo: "demo",
          estado: EstadoPago.APROBADO,
        },
      });
    }
  }

  // ---------- Ubicaciones ----------
  console.log("Creando ubicaciones...");
  const ubicacionesPorEmpresa: Record<string, string[]> = {};
  const ubicacionSeed: [typeof bodega, string, TipoUbicacion, string][] = [
    [bodega, "Planta de Elaboración", TipoUbicacion.PLANTA, "Ruta 40 Km 12, San Rafael"],
    [bodega, "Depósito de Insumos", TipoUbicacion.DEPOSITO, "Ruta 40 Km 12, San Rafael"],
    [bodega, "Oficina Administrativa", TipoUbicacion.OFICINA, "San Martín 450, San Rafael"],
    [clinica, "Guardia y Emergencias", TipoUbicacion.SUCURSAL, "Av. Colón 1250, Córdoba"],
    [clinica, "Internación 2do piso", TipoUbicacion.SUCURSAL, "Av. Colón 1250, Córdoba"],
    [clinica, "Quirófano", TipoUbicacion.SUCURSAL, "Av. Colón 1250, Córdoba"],
    [colegio, "Edificio Primaria", TipoUbicacion.SUCURSAL, "Belgrano 800, CABA"],
    [colegio, "Edificio Secundaria", TipoUbicacion.SUCURSAL, "Belgrano 820, CABA"],
    [colegio, "Depósito de Mantenimiento", TipoUbicacion.DEPOSITO, "Belgrano 820, CABA"],
    [hotel, "Recepción y Lobby", TipoUbicacion.SUCURSAL, "Bv. Costanera 300, Santa Fe"],
    [hotel, "Torre Habitaciones", TipoUbicacion.SUCURSAL, "Bv. Costanera 300, Santa Fe"],
    [hotel, "Cocina y Depósito", TipoUbicacion.DEPOSITO, "Bv. Costanera 300, Santa Fe"],
    [andina, "Depósito Central", TipoUbicacion.DEPOSITO, "Parque Industrial, Guaymallén"],
    [andina, "Taller de Flota", TipoUbicacion.TALLER, "Parque Industrial, Guaymallén"],
    [andina, "Oficina Comercial", TipoUbicacion.OFICINA, "Av. San Martín 2100, Mendoza"],
  ];
  const ubicaciones: Record<string, string> = {};
  for (const [empresa, nombre, tipo, direccion] of ubicacionSeed) {
    const u = await prisma.ubicacion.create({ data: { empresaId: empresa.id, nombre, tipo, direccion } });
    ubicacionesPorEmpresa[empresa.id] = ubicacionesPorEmpresa[empresa.id] ?? [];
    ubicacionesPorEmpresa[empresa.id].push(u.id);
    ubicaciones[`${empresa.nombre}-${nombre}`] = u.id;
  }

  // ---------- Proveedores ----------
  console.log("Creando proveedores...");
  const proveedoresData = [
    { empresa: bodega, nombre: "Extintores Cuyo S.R.L.", servicio: "Matafuegos", cuit: "30-65112233-4" },
    { empresa: andina, nombre: "FireSafe Mendoza", servicio: "Matafuegos", cuit: "30-65778899-2" },
    { empresa: clinica, nombre: "MedEquip Argentina", servicio: "Equipos médicos", cuit: "30-66112244-7" },
    { empresa: clinica, nombre: "BioTec Service", servicio: "Equipos médicos", cuit: "30-66558811-9" },
    { empresa: colegio, nombre: "Mantenimientos Integrales SH", servicio: "Mantenimiento", cuit: "30-67112200-3" },
    { empresa: hotel, nombre: "Fix It Servicios Técnicos", servicio: "Mantenimiento", cuit: "30-67445566-8" },
    { empresa: andina, nombre: "Transportes del Oeste", servicio: "Transporte", cuit: "30-68112277-5" },
    { empresa: andina, nombre: "Logística Rápida S.A.", servicio: "Logística", cuit: "30-68998855-1" },
    { empresa: andina, nombre: "YPF Flota Empresas", servicio: "Combustible", cuit: "30-69112288-6" },
    { empresa: bodega, nombre: "Seguridad Industrial Andina", servicio: "Equipo contra incendio", cuit: "30-69445522-0" },
  ];
  const proveedores = [];
  for (const p of proveedoresData) {
    const prov = await prisma.proveedor.create({
      data: {
        empresaId: p.empresa.id,
        nombre: p.nombre,
        cuit: p.cuit,
        contacto: pick(["Marcelo Díaz", "Laura Fernández", "Julián Torres", "Carla Gómez", "Ezequiel Ríos"]),
        telefono: `0${randInt(261, 351)}-${randInt(4000000, 4999999)}`,
        email: p.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "") + "@proveedor.demo",
        servicio: p.servicio,
        estado: EstadoProveedor.ACTIVO,
      },
    });
    proveedores.push(prov);
  }

  // ---------- Técnicos ----------
  console.log("Creando técnicos...");
  const tecnicosNombres = [
    ["Roberto", "Álvarez"], ["Natalia", "Suárez"], ["Diego", "Molina"], ["Florencia", "Castro"],
    ["Sergio", "Ponce"], ["Ayelén", "Correa"], ["Matías", "Ledesma"], ["Rocío", "Ibáñez"],
    ["Pablo", "Acosta"], ["Daniela", "Vega"],
  ];
  const tecnicos = [];
  for (let i = 0; i < tecnicosNombres.length; i++) {
    const [nombre, apellido] = tecnicosNombres[i];
    const empresa = pickIndex(empresas, i);
    const t = await prisma.tecnico.create({
      data: {
        empresaId: empresa.id,
        nombre,
        apellido,
        matricula: `TEC-${pad(i + 1, 4)}`,
        telefono: `11-${randInt(2000, 6999)}${randInt(1000, 9999)}`,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@tecnico.demo`,
        estado: EstadoTecnico.ACTIVO,
      },
    });
    tecnicos.push(t);
  }

  // ---------- Activos: Matafuegos ----------
  console.log("Creando matafuegos...");
  const tiposMatafuego = ["ABC", "BC", "CO2", "AGUA", "ESPUMA"];
  const capacidades = [1, 2.5, 5, 10];
  const activosMatafuegos = [];
  for (let i = 0; i < 30; i++) {
    const empresa = pickIndex(empresas, i);
    const ubicId = pick(ubicacionesPorEmpresa[empresa.id]);
    const proveedor = pick(proveedores.filter((p) => p.servicio === "Matafuegos" || p.servicio === "Equipo contra incendio"));
    const ultimaInspeccion = addDays(HOY, -randInt(30, 300));
    // distribuir vencimientos: ~40% vigente lejano, ~30% próximo, ~20% vencido, resto sin variación
    const bucket = i % 5;
    let vencimientoOffset: number;
    if (bucket === 0) vencimientoOffset = -randInt(3, 40); // vencido
    else if (bucket === 1) vencimientoOffset = randInt(1, 28); // próximo
    else vencimientoOffset = randInt(60, 380); // vigente
    const vencimiento = addDays(HOY, vencimientoOffset);
    const modalidad = i % 4 === 0 ? Modalidad.COMODATO : Modalidad.PROPIO;
    const codigo = `MF-${pad(i + 1)}`;
    const activo = await prisma.activo.create({
      data: {
        codigo,
        tipo: TipoActivo.MATAFUEGO,
        nombre: `Matafuego ${pick(tiposMatafuego)} ${pick(capacidades)}kg`,
        marca: pick(["Drago", "Amerex", "Extin", "Fenwal"]),
        modelo: `M-${randInt(100, 999)}`,
        numeroSerie: `SN${randInt(100000, 999999)}`,
        estado: estadoDesdeFecha(vencimiento),
        empresaId: empresa.id,
        ubicacionId: ubicId,
        proveedorId: proveedor.id,
        modalidad,
        fechaAlta: addDays(HOY, -randInt(200, 1000)),
        fechaAdquisicion: addDays(HOY, -randInt(200, 1000)),
        ultimaInspeccion,
        proximoVencimiento: vencimiento,
        atributos: JSON.stringify({ tipoMatafuego: pick(tiposMatafuego), capacidadKg: pick(capacidades) }),
        qrSlug: codigo.toLowerCase(),
      },
    });
    activosMatafuegos.push(activo);
  }

  // ---------- Activos: Equipos médicos ----------
  console.log("Creando equipos médicos...");
  const subtiposMedicos = ["Monitor multiparamétrico", "Desfibrilador", "Bomba de infusión", "Electrocardiógrafo", "Oxímetro de pulso"];
  const activosMedicos = [];
  for (let i = 0; i < 10; i++) {
    const ubicId = pick(ubicacionesPorEmpresa[clinica.id]);
    const proveedor = pick(proveedores.filter((p) => p.servicio === "Equipos médicos"));
    const bucket = i % 5;
    let offset: number;
    if (bucket === 0) offset = -randInt(2, 20);
    else if (bucket === 1) offset = randInt(1, 25);
    else offset = randInt(60, 300);
    const vencimiento = addDays(HOY, offset);
    const codigo = `EQ-${pad(i + 1)}`;
    const activo = await prisma.activo.create({
      data: {
        codigo,
        tipo: TipoActivo.EQUIPO_MEDICO,
        nombre: pick(subtiposMedicos),
        marca: pick(["Philips", "Mindray", "GE Healthcare", "Drager"]),
        modelo: `EM-${randInt(100, 999)}`,
        numeroSerie: `SNM${randInt(100000, 999999)}`,
        estado: estadoDesdeFecha(vencimiento),
        empresaId: clinica.id,
        ubicacionId: ubicId,
        proveedorId: proveedor.id,
        modalidad: i % 3 === 0 ? Modalidad.COMODATO : Modalidad.PROPIO,
        fechaAlta: addDays(HOY, -randInt(100, 800)),
        fechaAdquisicion: addDays(HOY, -randInt(100, 800)),
        ultimaInspeccion: addDays(HOY, -randInt(20, 180)),
        proximoVencimiento: vencimiento,
        atributos: JSON.stringify({
          subtipo: pick(subtiposMedicos),
          responsable: "Jefatura de Enfermería",
        }),
        qrSlug: codigo.toLowerCase(),
      },
    });
    activosMedicos.push(activo);
  }

  // ---------- Activos: Otros ----------
  console.log("Creando otros activos...");
  const otrosTemplates: [TipoActivo, string, string][] = [
    [TipoActivo.EQUIPO_INFORMATICO, "Notebook administración", "Dell"],
    [TipoActivo.EQUIPO_INFORMATICO, "Impresora multifunción", "HP"],
    [TipoActivo.HERRAMIENTA, "Amoladora angular", "Bosch"],
    [TipoActivo.MAQUINARIA, "Compresor de aire", "Chicago Pneumatic"],
    [TipoActivo.ALARMA, "Central de alarma contra incendio", "Notifier"],
    [TipoActivo.EQUIPO_ELECTRICO, "Grupo electrógeno", "Kohler"],
    [TipoActivo.EQUIPO_CONTRA_INCENDIO, "Manguera contra incendio 20m", "Eagle"],
    [TipoActivo.HERRAMIENTA, "Taladro de banco", "Makita"],
    [TipoActivo.EQUIPO_INFORMATICO, "Servidor de archivos", "Lenovo"],
    [TipoActivo.MAQUINARIA, "Autoclave de esterilización", "Tuttnauer"],
  ];
  const activosOtros = [];
  for (let i = 0; i < otrosTemplates.length; i++) {
    const [tipo, nombre, marca] = otrosTemplates[i];
    const empresa = pickIndex(empresas, i + 2);
    const ubicId = pick(ubicacionesPorEmpresa[empresa.id]);
    const bucket = i % 5;
    let offset: number;
    if (bucket === 0) offset = -randInt(5, 30);
    else if (bucket === 1) offset = randInt(2, 27);
    else offset = randInt(90, 400);
    const vencimiento = addDays(HOY, offset);
    const codigo = `OT-${pad(i + 1)}`;
    const activo = await prisma.activo.create({
      data: {
        codigo,
        tipo,
        nombre,
        marca,
        modelo: `${marca.slice(0, 2).toUpperCase()}-${randInt(100, 999)}`,
        numeroSerie: `SNO${randInt(100000, 999999)}`,
        estado: estadoDesdeFecha(vencimiento),
        empresaId: empresa.id,
        ubicacionId: ubicId,
        modalidad: Modalidad.PROPIO,
        fechaAlta: addDays(HOY, -randInt(100, 700)),
        fechaAdquisicion: addDays(HOY, -randInt(100, 700)),
        ultimaInspeccion: addDays(HOY, -randInt(30, 200)),
        proximoVencimiento: vencimiento,
        qrSlug: codigo.toLowerCase(),
      },
    });
    activosOtros.push(activo);
  }

  const todosLosActivos = [...activosMatafuegos, ...activosMedicos, ...activosOtros];

  // ---------- Comodatos ----------
  console.log("Creando comodatos...");
  const activosComodato = todosLosActivos.filter((a) => a.modalidad === Modalidad.COMODATO).slice(0, 15);
  for (const activo of activosComodato) {
    const empresa = empresas.find((e) => e.id === activo.empresaId)!;
    const proveedor = pick(proveedores);
    await prisma.comodato.create({
      data: {
        activoId: activo.id,
        propietario: proveedor.nombre,
        cliente: empresa.nombre,
        fechaInicio: addDays(HOY, -randInt(60, 500)),
        fechaFinal: addDays(HOY, randInt(30, 400)),
        estado: "Vigente",
        ubicacion: "Según ubicación del activo",
        observaciones: "Comodato demo generado automáticamente.",
      },
    });
  }

  // ---------- Mantenimientos ----------
  console.log("Creando mantenimientos...");
  const tiposMant = [TipoMantenimiento.INSPECCION, TipoMantenimiento.MANTENIMIENTO, TipoMantenimiento.RECARGA, TipoMantenimiento.REPARACION, TipoMantenimiento.CALIBRACION];
  for (let i = 0; i < 20; i++) {
    const activo = pickIndex(todosLosActivos, i);
    const empresaTecnicos = tecnicos.filter((t) => t.empresaId === activo.empresaId);
    const tecnico = empresaTecnicos.length ? pick(empresaTecnicos) : pick(tecnicos);
    const proveedor = activo.proveedorId ? await prisma.proveedor.findUnique({ where: { id: activo.proveedorId } }) : pick(proveedores);
    const fecha = addDays(HOY, -randInt(5, 250));
    await prisma.mantenimiento.create({
      data: {
        activoId: activo.id,
        fecha,
        proveedorId: proveedor?.id,
        tecnicoId: tecnico.id,
        tipo: pick(tiposMant),
        resultado: pick(["Aprobado", "Aprobado con observaciones", "Requiere seguimiento"]),
        observaciones: "Intervención registrada en el marco del plan de mantenimiento preventivo.",
        proximaFecha: addDays(fecha, 365),
      },
    });
  }

  // ---------- Documentos ----------
  console.log("Creando documentos...");
  const tiposDocumento = ["Certificado de habilitación", "Seguro", "Garantía", "Manual técnico", "Constancia de servicio"];
  for (let i = 0; i < 30; i++) {
    const bucket = i % 5;
    let offset: number;
    if (bucket === 0) offset = -randInt(5, 60);
    else if (bucket === 1) offset = randInt(1, 28);
    else offset = randInt(60, 400);
    const vencimiento = addDays(HOY, offset);
    const emision = addDays(vencimiento, -365);

    const target = i % 3;
    if (target === 0) {
      const activo = pickIndex(todosLosActivos, i);
      await prisma.documento.create({
        data: {
          entidadTipo: EntidadDocumento.ACTIVO,
          entidadId: activo.id,
          activoId: activo.id,
          tipo: pick(tiposDocumento),
          numero: `DOC-${pad(i + 1, 4)}`,
          fechaEmision: emision,
          vencimiento,
          estado: estadoDocDesdeFecha(vencimiento),
        },
      });
    } else if (target === 1) {
      const proveedor = pickIndex(proveedores, i);
      await prisma.documento.create({
        data: {
          entidadTipo: EntidadDocumento.PROVEEDOR,
          entidadId: proveedor.id,
          proveedorId: proveedor.id,
          tipo: "Constancia de inscripción AFIP",
          numero: `DOC-${pad(i + 1, 4)}`,
          fechaEmision: emision,
          vencimiento,
          estado: estadoDocDesdeFecha(vencimiento),
        },
      });
    } else {
      const empresa = pickIndex(empresas, i);
      await prisma.documento.create({
        data: {
          entidadTipo: EntidadDocumento.EMPRESA,
          entidadId: empresa.id,
          tipo: "Habilitación municipal",
          numero: `DOC-${pad(i + 1, 4)}`,
          fechaEmision: emision,
          vencimiento,
          estado: estadoDocDesdeFecha(vencimiento),
        },
      });
    }
  }

  // ---------- Vehículos ----------
  console.log("Creando vehículos...");
  const vehiculosData = [
    { empresa: andina, patente: "AC123DE", marca: "Ford", modelo: "Transit", tipo: "Furgón", anio: 2021 },
    { empresa: andina, patente: "AD456FG", marca: "Mercedes-Benz", modelo: "Sprinter", tipo: "Furgón", anio: 2022 },
    { empresa: andina, patente: "AE789HI", marca: "Iveco", modelo: "Daily", tipo: "Camión liviano", anio: 2020 },
    { empresa: andina, patente: "AF012JK", marca: "Toyota", modelo: "Hilux", tipo: "Camioneta", anio: 2023 },
    { empresa: andina, patente: "AG345LM", marca: "Volkswagen", modelo: "Amarok", tipo: "Camioneta", anio: 2021 },
    { empresa: andina, patente: "AH678NO", marca: "Renault", modelo: "Kangoo", tipo: "Utilitario", anio: 2019 },
    { empresa: hotel, patente: "AI901PQ", marca: "Mercedes-Benz", modelo: "Sprinter Van", tipo: "Traslado pasajeros", anio: 2022 },
    { empresa: bodega, patente: "AJ234RS", marca: "Chevrolet", modelo: "S10", tipo: "Camioneta", anio: 2020 },
  ];
  const vehiculos = [];
  for (const v of vehiculosData) {
    const bucketVtv = randInt(0, 4);
    const vehiculo = await prisma.vehiculo.create({
      data: {
        empresaId: v.empresa.id,
        patente: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        tipo: v.tipo,
        kilometraje: randInt(15000, 180000),
        estado: pick([EstadoVehiculo.DISPONIBLE, EstadoVehiculo.DISPONIBLE, EstadoVehiculo.EN_VIAJE, EstadoVehiculo.EN_MANTENIMIENTO]),
        serviceProximo: addDays(HOY, randInt(-10, 90)),
        vtvVencimiento: addDays(HOY, bucketVtv === 0 ? -randInt(5, 30) : randInt(5, 300)),
        seguroVencimiento: addDays(HOY, randInt(-15, 300)),
      },
    });
    vehiculos.push(vehiculo);

    await prisma.documento.create({
      data: {
        entidadTipo: EntidadDocumento.VEHICULO,
        entidadId: vehiculo.id,
        vehiculoId: vehiculo.id,
        tipo: "VTV",
        numero: `VTV-${vehiculo.patente}`,
        fechaEmision: addDays(HOY, -300),
        vencimiento: vehiculo.vtvVencimiento,
        estado: estadoDocDesdeFecha(vehiculo.vtvVencimiento!),
      },
    });
    await prisma.documento.create({
      data: {
        entidadTipo: EntidadDocumento.VEHICULO,
        entidadId: vehiculo.id,
        vehiculoId: vehiculo.id,
        tipo: "Seguro",
        numero: `POL-${vehiculo.patente}`,
        fechaEmision: addDays(HOY, -200),
        vencimiento: vehiculo.seguroVencimiento,
        estado: estadoDocDesdeFecha(vehiculo.seguroVencimiento!),
      },
    });
  }

  // ---------- Conductores ----------
  console.log("Creando conductores...");
  const conductoresNombres = [
    ["Hugo", "Farías"], ["Lorena", "Benítez"], ["Nicolás", "Aguirre"], ["Verónica", "Peralta"],
    ["Gustavo", "Ojeda"], ["Melina", "Sosa"], ["Iván", "Bustos"], ["Yamila", "Núñez"],
    ["Cristian", "Paz"], ["Soledad", "Herrera"],
  ];
  const conductores = [];
  for (let i = 0; i < conductoresNombres.length; i++) {
    const [nombre, apellido] = conductoresNombres[i];
    const empresa = i < 8 ? andina : hotel;
    const licVenc = addDays(HOY, randInt(-10, 400));
    const conductor = await prisma.conductor.create({
      data: {
        empresaId: empresa.id,
        nombre,
        apellido,
        documento: `${randInt(20000000, 45000000)}`,
        licencia: `LIC-${pad(i + 1, 4)}`,
        licenciaVencimiento: licVenc,
        telefono: `261-${randInt(4000000, 6999999)}`,
        estado: EstadoConductor.ACTIVO,
      },
    });
    conductores.push(conductor);
    await prisma.documento.create({
      data: {
        entidadTipo: EntidadDocumento.CONDUCTOR,
        entidadId: conductor.id,
        conductorId: conductor.id,
        tipo: "Licencia de conducir",
        numero: conductor.licencia,
        vencimiento: licVenc,
        estado: estadoDocDesdeFecha(licVenc),
      },
    });
  }

  // ---------- Traslados ----------
  console.log("Creando traslados...");
  const ciudades = ["Mendoza", "San Rafael", "Malargüe", "San Juan", "Córdoba", "Buenos Aires", "Rosario", "Santa Fe", "Neuquén", "La Plata"];
  const traslados = [];
  for (let i = 0; i < 20; i++) {
    const vehiculo = pickIndex(vehiculos, i);
    const conductoresEmpresa = conductores.filter((c) => c.empresaId === vehiculo.empresaId);
    const conductor = conductoresEmpresa.length ? pick(conductoresEmpresa) : pick(conductores);
    const estado = i < 4 ? EstadoTraslado.PLANIFICADO : i < 8 ? EstadoTraslado.EN_CURSO : i < 18 ? EstadoTraslado.COMPLETADO : EstadoTraslado.CANCELADO;
    const traslado = await prisma.traslado.create({
      data: {
        numero: `TR-${pad(i + 1, 4)}`,
        empresaId: vehiculo.empresaId,
        fecha: addDays(HOY, randInt(-30, 15)),
        origen: pick(ciudades),
        destino: pick(ciudades),
        vehiculoId: vehiculo.id,
        conductorId: conductor.id,
        cliente: pick(["Distribuidora Andina Logística S.R.L.", "Cliente Mayorista Cuyo", "Supermercados Oeste", "Exportadora del Sur"]),
        estado,
        observaciones: estado === EstadoTraslado.CANCELADO ? "Cancelado por el cliente." : undefined,
      },
    });
    traslados.push(traslado);
  }

  // ---------- Combustible ----------
  console.log("Creando cargas de combustible...");
  for (let i = 0; i < 30; i++) {
    const vehiculo = pickIndex(vehiculos, i);
    const conductoresEmpresa = conductores.filter((c) => c.empresaId === vehiculo.empresaId);
    const conductor = conductoresEmpresa.length ? pick(conductoresEmpresa) : null;
    const litros = randInt(20, 80);
    const precioLitro = 900 + randInt(-50, 150);
    await prisma.combustibleCarga.create({
      data: {
        fecha: addDays(HOY, -randInt(0, 90)),
        vehiculoId: vehiculo.id,
        conductorId: conductor?.id,
        estacion: pick(["YPF Ruta 40", "Shell Acceso Este", "Axion San Martín", "YPF Costanera"]),
        litros,
        precioLitro,
        importe: litros * precioLitro,
        kilometraje: randInt(15000, 180000),
      },
    });
  }

  // ---------- Gastos ----------
  console.log("Creando gastos...");
  const categorias = [CategoriaGasto.COMBUSTIBLE, CategoriaGasto.PEAJE, CategoriaGasto.MANTENIMIENTO, CategoriaGasto.REPARACION, CategoriaGasto.ENVIO, CategoriaGasto.SEGURO, CategoriaGasto.OTROS];
  for (let i = 0; i < 30; i++) {
    const empresa = pickIndex(empresas, i);
    const categoria = pick(categorias);
    const vehiculosEmpresa = vehiculos.filter((v) => v.empresaId === empresa.id);
    const trasladosEmpresa = traslados.filter((t) => t.empresaId === empresa.id);
    await prisma.gasto.create({
      data: {
        empresaId: empresa.id,
        fecha: addDays(HOY, -randInt(0, 120)),
        categoria,
        importe: randInt(3000, 250000),
        proveedorId: categoria === CategoriaGasto.MANTENIMIENTO || categoria === CategoriaGasto.REPARACION ? pick(proveedores).id : undefined,
        vehiculoId: vehiculosEmpresa.length && Math.random() > 0.4 ? pick(vehiculosEmpresa).id : undefined,
        trasladoId: trasladosEmpresa.length && categoria === CategoriaGasto.PEAJE ? pick(trasladosEmpresa).id : undefined,
        observaciones: undefined,
      },
    });
  }

  // ---------- Impuestos ----------
  console.log("Creando impuestos...");
  const nombresImpuesto = ["Patente", "Ingresos Brutos", "Monotributo", "Tasa municipal", "Seguro obligatorio"];
  for (let i = 0; i < 18; i++) {
    const empresa = pickIndex(empresas, i);
    const vehiculosEmpresa = vehiculos.filter((v) => v.empresaId === empresa.id);
    const esDeVehiculo = vehiculosEmpresa.length > 0 && i % 3 !== 2;
    const vehiculo = esDeVehiculo ? pick(vehiculosEmpresa) : null;
    const nombreBase = pick(nombresImpuesto);
    // distribuir: ~30% vencido, ~35% próximo/pendiente, ~35% ya pagado
    const bucket = i % 3;
    let vencimientoOffset: number;
    if (bucket === 0) vencimientoOffset = -randInt(3, 45);
    else if (bucket === 1) vencimientoOffset = randInt(1, 60);
    else vencimientoOffset = -randInt(10, 90);
    const vencimiento = addDays(HOY, vencimientoOffset);
    const pagado = bucket === 2;
    await prisma.impuesto.create({
      data: {
        empresaId: empresa.id,
        nombre: vehiculo ? `${nombreBase} ${vehiculo.patente}` : `${nombreBase} ${HOY.getFullYear()}`,
        vehiculoId: vehiculo?.id,
        importe: randInt(15000, 400000),
        vencimiento,
        fechaPago: pagado ? addDays(vencimiento, -randInt(1, 10)) : undefined,
        estado: estadoImpuestoDesdeFecha(vencimiento, pagado),
        observaciones: undefined,
      },
    });
  }

  // ---------- Webhooks (n8n) demo ----------
  console.log("Creando configuración de automatizaciones (demo)...");
  await prisma.webhookConfig.create({
    data: {
      empresaId: andina.id,
      evento: "ACTIVO_PROXIMO_A_VENCER",
      url: "https://n8n.tu-dominio.com/webhook/traza-vencimientos",
      activo: false,
    },
  });
  await prisma.webhookConfig.create({
    data: {
      empresaId: andina.id,
      evento: "MANTENIMIENTO_REALIZADO",
      url: "https://n8n.tu-dominio.com/webhook/traza-mantenimiento",
      activo: false,
    },
  });

  // ---------- Usuarios ----------
  console.log("Creando usuarios...");
  const passwordHash = await bcrypt.hash("demo1234", 10);
  await prisma.user.create({
    data: { email: "admin@traza.local", passwordHash, nombre: "Admin", apellido: "TRAZA", rol: Rol.ADMIN, activo: true },
  });
  await prisma.user.create({
    data: { email: "empresa@traza.local", passwordHash, nombre: "Marina", apellido: "López", rol: Rol.EMPRESA, empresaId: bodega.id, activo: true },
  });
  for (const emp of [clinica, colegio, hotel, andina]) {
    const slug = emp.nombre.toLowerCase().split(" ")[0];
    await prisma.user.create({
      data: {
        email: `contacto@${slug}.demo`,
        passwordHash,
        nombre: pick(["Carlos", "Andrea", "Mauricio", "Silvina"]),
        apellido: pick(["Ramos", "Quiroga", "Funes", "Domínguez"]),
        rol: Rol.EMPRESA,
        empresaId: emp.id,
        activo: true,
      },
    });
  }
  const proveedorDemo = proveedores[0];
  await prisma.user.create({
    data: {
      email: "proveedor@traza.local",
      passwordHash,
      nombre: "Marcelo",
      apellido: "Díaz",
      rol: Rol.PROVEEDOR,
      empresaId: proveedorDemo.empresaId,
      proveedorId: proveedorDemo.id,
      activo: true,
    },
  });
  const tecnicoDemo = tecnicos[0];
  await prisma.user.create({
    data: {
      email: "tecnico@traza.local",
      passwordHash,
      nombre: tecnicoDemo.nombre,
      apellido: tecnicoDemo.apellido,
      rol: Rol.TECNICO,
      empresaId: tecnicoDemo.empresaId,
      tecnicoId: tecnicoDemo.id,
      activo: true,
    },
  });
  const conductorDemo = conductores[0];
  await prisma.user.create({
    data: {
      email: "conductor@traza.local",
      passwordHash,
      nombre: conductorDemo.nombre,
      apellido: conductorDemo.apellido,
      rol: Rol.CONDUCTOR,
      empresaId: conductorDemo.empresaId,
      conductorId: conductorDemo.id,
      activo: true,
    },
  });

  console.log("Seed completado ✔");
  console.log(`Empresas: ${empresas.length}, Proveedores: ${proveedores.length}, Técnicos: ${tecnicos.length}`);
  console.log(`Activos: ${todosLosActivos.length} (Matafuegos: ${activosMatafuegos.length}, Equipos médicos: ${activosMedicos.length}, Otros: ${activosOtros.length})`);
  console.log(`Vehículos: ${vehiculos.length}, Conductores: ${conductores.length}, Traslados: ${traslados.length}`);
  console.log(`Impuestos: 18`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
