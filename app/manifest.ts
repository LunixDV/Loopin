import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Loopin Calendar Sync",
    short_name: "Loopin",
    description:
      "Drop images or paste notes to extract events and sync them to Google Calendar.",
    start_url: "/",
    display: "standalone",
    background_color: "#090b11",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
