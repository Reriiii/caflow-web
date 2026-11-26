import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "caflow-web",
    compatibilityDate: "2026-11-10",
    assets: { htmlHandling: "auto-trailing-slash", notFoundHandling: "404-page" },
  },
});
