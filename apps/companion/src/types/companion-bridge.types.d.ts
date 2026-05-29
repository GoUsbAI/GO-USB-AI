declare global {
  interface Window {
    goUsbAiCompanion: {
      open: () => Promise<void>;
      quit: () => Promise<void>;
      getBootstrap: () => Promise<{ baseUrl: string }>;
    };
  }
}

export {};
