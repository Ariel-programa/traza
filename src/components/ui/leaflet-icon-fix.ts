import L from "leaflet";

// Bug conocido de Leaflet + bundlers: las rutas de los íconos por defecto se
// resuelven vía `import.meta.url`/webpack y terminan rotas (404) salvo que
// se las pise a mano apuntando a un CDN. Sin esto el pin del mapa no se ve.
export function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- limpiamos el getter interno que Leaflet usa para resolver los íconos por defecto
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
