import { describe, expect, it } from "vitest";
import { resolvePublishPackageName } from "./marketplace-identity.utils.js";

describe("resolvePublishPackageName", () => {
  it("includes exact GoUsbAi Web and CLI guidance when username is missing", () => {
    expect(() =>
      resolvePublishPackageName({
        slug: "publish-to-go-usb-ai-marketplace",
        adminTokenPresent: false,
        currentUser: {
          token: "token-1",
          platformBase: "https://platform.go-usb-ai.io",
          v1Base: "https://ai-gateway-api.go-usb-ai.io/v1",
          user: {
            id: "user-1",
            email: "publisher@example.com",
            role: "user",
            username: null
          }
        }
      })
    ).toThrowError(
      /https:\/\/platform\.go-usb-ai\.io\/account.*go-usb-ai account set-username <username>/
    );
  });

  it("uses the personal username scope when the account is ready", () => {
    expect(
      resolvePublishPackageName({
        slug: "publish-to-go-usb-ai-marketplace",
        adminTokenPresent: false,
        currentUser: {
          token: "token-2",
          platformBase: "https://platform.go-usb-ai.io",
          v1Base: "https://ai-gateway-api.go-usb-ai.io/v1",
          user: {
            id: "user-2",
            email: "publisher@example.com",
            role: "user",
            username: "alice-dev"
          }
        }
      })
    ).toBe("@alice-dev/publish-to-go-usb-ai-marketplace");
  });
});
