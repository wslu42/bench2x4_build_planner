import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/bench2x4_build_planner/",
  plugins: [react()],
});
