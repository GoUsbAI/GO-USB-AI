import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@go-usb-ai/shared": new URL("../go-usb-ai-shared/src/index.ts", import.meta.url).pathname
    }
  }
});
