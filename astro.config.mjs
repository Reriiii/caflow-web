import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://caflow-web.quockientran100.workers.dev",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
  vite: { plugins: [tailwindcss()], css: { postcss: { plugins: [] } } },
});
