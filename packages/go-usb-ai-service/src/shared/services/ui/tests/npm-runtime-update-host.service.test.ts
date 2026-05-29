import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoUsbAiKernel } from "@go-usb-ai/kernel";
import { eventKeys } from "@go-usb-ai/shared";
import { GoUsbAiDistributionService } from "@go-usb-ai-service/shared/services/runtime/go-usb-ai-distribution.service.js";
import { NpmRuntimeUpdateHost } from "../npm-runtime-update-host.service.js";

const mocks = vi.hoisted(() => {
  const state = {
    channel: "stable" as const,
    currentVersion: null,
    downloadedVersion: "0.18.12-beta.4",
    downloadedReleaseNotesUrl: null,
    lastUpdateCheckAt: null,
    badVersions: [],
    updatePreferences: {
      automaticChecks: false,
      autoDownload: true
    }
  };

  return {
    getPackageVersion: vi.fn(() => "0.18.12-beta.4"),
    requestManagedServiceRestart: vi.fn().mockResolvedValue(undefined),
    sourceOptions: [] as Array<{ packagedPublicKeyPath?: string } | undefined>,
    stateStore: {
      read: vi.fn(() => state),
      update: vi.fn((updater: (current: typeof state) => typeof state) => {
        Object.assign(state, updater(state));
        return state;
      })
    },
    manager: {
      getSnapshot: vi.fn(() => ({
        installationKind: "npm-runtime-bundle",
        channel: "stable" as const,
        hostVersion: "0.18.12-beta.4",
        currentVersion: null,
        availableVersion: null,
        downloadedVersion: "0.18.12-beta.4",
        minimumHostVersion: null,
        releaseNotesUrl: null,
        lastCheckedAt: null,
        progress: null,
        canAutoDownload: true,
        canApplyInApp: true,
        requiresRestart: false,
        blockReason: null,
        recoveryCommand: null,
        errorMessage: null,
        preferences: {
          automaticChecks: false,
          autoDownload: true
        },
        status: "downloaded" as const
      })),
      applyDownloadedUpdate: vi.fn(() => ({
        installationKind: "npm-runtime-bundle",
        channel: "stable" as const,
        hostVersion: "0.18.12-beta.4",
        currentVersion: "0.18.12-beta.4",
        availableVersion: null,
        downloadedVersion: null,
        minimumHostVersion: null,
        releaseNotesUrl: null,
        lastCheckedAt: null,
        progress: null,
        canAutoDownload: true,
        canApplyInApp: false,
        requiresRestart: true,
        blockReason: null,
        recoveryCommand: null,
        errorMessage: null,
        preferences: {
          automaticChecks: false,
          autoDownload: true
        },
        status: "restart-required" as const
      }))
    }
  };
});

vi.mock("@go-usb-ai-service/shared/utils/cli.utils.js", () => ({
  getPackageVersion: mocks.getPackageVersion
}));

vi.mock("@go-usb-ai-service/shared/services/ui/service-remote-access.service.js", () => ({
  requestManagedServiceRestart: (...args: unknown[]) => mocks.requestManagedServiceRestart(...args)
}));

vi.mock("@go-usb-ai-service/launcher/npm-runtime-bundle-layout.store.js", () => ({
  NpmRuntimeBundleLayoutStore: class {
    getStatePath = () => "/tmp/go-usb-ai-runtime-update-state.json";
  }
}));

vi.mock("@go-usb-ai-service/launcher/npm-runtime-update-state.store.js", () => ({
  NpmRuntimeUpdateStateStore: class {
    read = () => mocks.stateStore.read();
    update = (updater: Parameters<typeof mocks.stateStore.update>[0]) => mocks.stateStore.update(updater);
  }
}));

vi.mock("@go-usb-ai-service/launcher/npm-runtime-bundle.service.js", () => ({
  NpmRuntimeBundleService: class {}
}));

vi.mock("@go-usb-ai-service/launcher/npm-runtime-update.service.js", () => ({
  NpmRuntimeUpdateService: class {}
}));

vi.mock("@go-usb-ai-service/launcher/npm-runtime-update-source.service.js", () => ({
  NpmRuntimeUpdateSourceService: class {
    constructor(options?: { packagedPublicKeyPath?: string }) {
      mocks.sourceOptions.push(options);
    }

    resolveChannel = () => "stable";
    resolveBundlePublicKey = () => "mock-public-key";
    resolveManifestUrl = () => "https://example.invalid/manifest.json";
  }
}));

vi.mock("@go-usb-ai-service/launcher/npm-runtime-update.manager.js", () => ({
  NpmRuntimeUpdateManager: class {
    getSnapshot = () => mocks.manager.getSnapshot();
    applyDownloadedUpdate = () => mocks.manager.applyDownloadedUpdate();
  }
}));

const TEST_DISTRIBUTION = {
  version: "0.18.12-beta.4",
  packageRoot: "/pkg",
  appEntrypoint: "/pkg/dist/cli/app/index.js",
  uiDistDir: "/pkg/ui-dist",
  runtimeUpdatePublicKeyPath: "/pkg/resources/update-bundle-public.pem"
};

describe("NpmRuntimeUpdateHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sourceOptions.length = 0;
    GoUsbAiDistributionService.configure(TEST_DISTRIBUTION);
  });

  it("uses distribution metadata when creating the runtime update source", () => {
    const eventBus = new GoUsbAiKernel().eventBus;
    new NpmRuntimeUpdateHost({
      eventBus,
      applyRestartMode: "manual-process-restart",
      requestRestart: vi.fn(),
      uiConfig: { port: 55667 }
    });

    expect(mocks.sourceOptions).toEqual([
      { packagedPublicKeyPath: "/pkg/resources/update-bundle-public.pem" }
    ]);
    expect(mocks.getPackageVersion).not.toHaveBeenCalled();
  });

  it("keeps a foreground serve process alive after applying a downloaded runtime update", async () => {
    const requestRestart = vi.fn();
    const eventBus = new GoUsbAiKernel().eventBus;
    const host = new NpmRuntimeUpdateHost({
      eventBus,
      applyRestartMode: "manual-process-restart",
      requestRestart,
      uiConfig: { port: 55667 }
    });

    await expect(host.applyDownloadedUpdate()).resolves.toMatchObject({
      status: "restart-required",
      currentVersion: "0.18.12-beta.4",
      recoveryCommand: "Restart this GoUsbAi process to launch the downloaded runtime."
    });
    expect(mocks.requestManagedServiceRestart).not.toHaveBeenCalled();
    expect(requestRestart).not.toHaveBeenCalled();
  });

  it("restarts the managed local service after applying a downloaded runtime update", async () => {
    const requestRestart = vi.fn();
    const eventBus = new GoUsbAiKernel().eventBus;
    const host = new NpmRuntimeUpdateHost({
      eventBus,
      applyRestartMode: "managed-service-restart",
      requestRestart,
      uiConfig: { port: 55667 }
    });

    await expect(host.applyDownloadedUpdate()).resolves.toMatchObject({
      status: "restart-required",
      currentVersion: "0.18.12-beta.4",
      recoveryCommand: null
    });
    expect(mocks.requestManagedServiceRestart).toHaveBeenCalledWith(requestRestart, {
      reason: "runtime update apply",
      uiPort: 55667
    });
  });

  it("publishes runtime update snapshots through the app event bus", async () => {
    const statuses: string[] = [];
    const eventBus = new GoUsbAiKernel().eventBus;
    const unsubscribe = eventBus.on(eventKeys.runtimeUpdateSnapshot, (snapshot) => {
      statuses.push(snapshot.status);
    });
    const host = new NpmRuntimeUpdateHost({
      eventBus,
      applyRestartMode: "manual-process-restart",
      requestRestart: vi.fn(),
      uiConfig: { port: 55667 }
    });

    try {
      await host.applyDownloadedUpdate();
    } finally {
      unsubscribe();
    }

    expect(statuses).toEqual(["applying", "restart-required"]);
  });
});
