import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RemoteAccessPage, useRemoteAccessStore } from "@/features/remote";
import { setLanguage } from "@/shared/lib/i18n";

const mocks = vi.hoisted(() => ({
  reauthorizeRemoteAccess: vi.fn(),
  repairRemoteAccess: vi.fn(),
  enableRemoteAccess: vi.fn(),
  disableRemoteAccess: vi.fn(),
  syncStatus: vi.fn(),
  openGoUsbAiWeb: vi.fn(),
  statusQuery: {
    data: undefined as unknown,
    isLoading: false,
  },
}));

vi.mock("@/features/remote/hooks/use-remote-access", () => ({
  useRemoteStatus: () => mocks.statusQuery,
}));

vi.mock("@/app/components/app-manager-provider", () => ({
  useAppManager: () => ({
    remoteAccessManager: {
      reauthorizeRemoteAccess: mocks.reauthorizeRemoteAccess,
      repairRemoteAccess: mocks.repairRemoteAccess,
      enableRemoteAccess: mocks.enableRemoteAccess,
      disableRemoteAccess: mocks.disableRemoteAccess,
      syncStatus: mocks.syncStatus,
    },
    accountManager: {
      openGoUsbAiWeb: mocks.openGoUsbAiWeb,
    },
  }),
}));

describe("RemoteAccessPage", () => {
  beforeEach(() => {
    setLanguage("zh");
    mocks.reauthorizeRemoteAccess.mockReset();
    mocks.repairRemoteAccess.mockReset();
    mocks.enableRemoteAccess.mockReset();
    mocks.disableRemoteAccess.mockReset();
    mocks.syncStatus.mockReset();
    mocks.openGoUsbAiWeb.mockReset();
    useRemoteAccessStore.setState({
      enabled: false,
      deviceName: "",
      platformApiBase: "",
      draftTouched: false,
      advancedOpen: false,
      actionLabel: null,
      doctor: null,
    });
    mocks.statusQuery = {
      data: {
        account: {
          loggedIn: true,
          email: "user@example.com",
          apiBase: "https://ai-gateway-api.go-usb-ai.io/v1",
          platformBase: "https://ai-gateway-api.go-usb-ai.io",
        },
        settings: {
          enabled: true,
          deviceName: "MacBook Pro",
          platformApiBase: "https://ai-gateway-api.go-usb-ai.io/v1",
        },
        service: {
          running: true,
          currentProcess: false,
        },
        localOrigin: "http://127.0.0.1:55667",
        configuredEnabled: true,
        platformBase: "https://ai-gateway-api.go-usb-ai.io",
        runtime: {
          enabled: true,
          mode: "service",
          state: "error",
          lastError: "Invalid or expired token.",
          updatedAt: "2026-03-23T00:00:00.000Z",
        },
      },
      isLoading: false,
    };
  });

  it("shows a user-facing reauthorization flow instead of raw token errors", async () => {
    const user = userEvent.setup();

    render(<RemoteAccessPage />);

    expect(screen.getByText("登录已过期，请重新登录 GoUsbAi")).toBeTruthy();
    expect(screen.getByText("重新登录并恢复远程访问")).toBeTruthy();
    expect(screen.queryByText("Invalid or expired token.")).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "重新登录并恢复远程访问" }),
    );

    expect(mocks.reauthorizeRemoteAccess).toHaveBeenCalledTimes(1);
    expect(mocks.repairRemoteAccess).not.toHaveBeenCalled();
  });
});
