/// <reference types="vite/client" />

import type { GoUsbAiDesktopBridge } from './desktop/desktop-update.types';

export {};

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_DEV_PROXY_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt(): Promise<void>;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }

  interface Window {
    goUsbAiDesktop?: GoUsbAiDesktopBridge;
  }
}
