import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ecobus Transport",
    short_name: "Ecobus",
    description: "Book Ecobus intercity trips, manage tickets, and request vehicle hire.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eff6ff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/ecobus-logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
