import { useCompanionShellStore, type CompanionShellSnapshot } from "../stores/companion-shell.store.js";

export class CompanionShellManager {
  readonly bootstrap = async (): Promise<CompanionShellSnapshot> => {
    const bootstrap = await window.goUsbAiCompanion.getBootstrap();
    const snapshot: CompanionShellSnapshot = {
      baseUrl: bootstrap.baseUrl,
      bootstrapped: true
    };
    useCompanionShellStore.getState().setSnapshot(snapshot);
    return snapshot;
  };

  readonly open = async (): Promise<void> => {
    await window.goUsbAiCompanion.open();
  };

  readonly quit = async (): Promise<void> => {
    await window.goUsbAiCompanion.quit();
  };
}
