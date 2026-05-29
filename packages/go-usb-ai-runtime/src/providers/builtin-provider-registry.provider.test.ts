import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { configureProviderCatalog, listProviderSpecs } from "@go-usb-ai/core";

describe("@go-usb-ai/runtime module boundary", () => {
  it("keeps builtin providers local to runtime", async () => {
    configureProviderCatalog([]);

    const runtime = await import("./builtin-provider-registry.provider.js");

    assert.ok(runtime.builtinProviderIds().length > 0);
    assert.deepEqual(listProviderSpecs(), []);
  });
});
