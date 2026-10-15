import type { MetadataRoute } from "next";

// La landing es lo único público para indexar. Las rutas del panel ya
// redirigen a /login sin sesión; se excluyen además la API, el login y las
// fichas públicas de activos (se comparten por QR, no son para buscadores).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/public/"],
    },
  };
}
