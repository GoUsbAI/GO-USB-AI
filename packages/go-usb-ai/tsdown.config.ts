import { defineConfig } from "tsdown/config";

export default defineConfig({
  deps: {
    alwaysBundle: ["@go-usb-ai/remote"],
    onlyBundle: false
  }
});
