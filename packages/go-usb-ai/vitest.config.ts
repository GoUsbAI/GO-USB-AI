import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "../go-usb-ai-core/src"),
      "@go-usb-ai/shared": path.resolve(__dirname, "../go-usb-ai-shared/src/index.ts"),
      "@kernel": path.resolve(__dirname, "../go-usb-ai-kernel/src"),
    },
  },
});
