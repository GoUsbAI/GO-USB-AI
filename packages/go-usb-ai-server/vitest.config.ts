import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@go-usb-ai-server/": new URL("./src/", import.meta.url).pathname,
      "@/": new URL("./src/", import.meta.url).pathname,
      "@core/": new URL("../go-usb-ai-core/src/", import.meta.url).pathname,
      "@core": new URL("../go-usb-ai-core/src", import.meta.url).pathname,
      "@kernel/": new URL("../go-usb-ai-kernel/src/", import.meta.url).pathname,
      "@kernel": new URL("../go-usb-ai-kernel/src", import.meta.url).pathname,
      "@go-usb-ai/core": new URL("../go-usb-ai-core/src/index.ts", import.meta.url).pathname,
      "@go-usb-ai/kernel": new URL("../go-usb-ai-kernel/src/index.ts", import.meta.url).pathname,
      "@go-usb-ai/shared": new URL("../go-usb-ai-shared/src/index.ts", import.meta.url).pathname
    }
  }
});
