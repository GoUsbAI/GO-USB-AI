import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type I18nRuntimeModule = typeof import('./i18n-language-owner');

type MockStorage = {
  clear: () => void;
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

declare global {
  interface Window {
    goUsbAiDesktop?: {
      localePreference?: 'en' | 'zh' | null;
      setLocalePreference?: (language: 'en' | 'zh' | null) => Promise<'en' | 'zh' | null>;
    };
  }
}

async function loadOwner(): Promise<I18nRuntimeModule> {
  vi.resetModules();
  return await import('./i18n-language-owner');
}

function createMockStorage(): MockStorage {
  const state = new Map<string, string>();
  return {
    clear: () => state.clear(),
    getItem: (key) => state.get(key) ?? null,
    removeItem: (key) => {
      state.delete(key);
    },
    setItem: (key, value) => {
      state.set(key, value);
    }
  };
}

describe('I18nLanguageOwner', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createMockStorage()
    });
    window.localStorage.clear();
    window.goUsbAiDesktop = undefined;
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'en-US'
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    window.goUsbAiDesktop = undefined;
    vi.restoreAllMocks();
  });

  it('prefers desktop locale preference over web localStorage', async () => {
    window.localStorage.setItem('go-usb-ai.ui.language', 'en');
    window.goUsbAiDesktop = {
      localePreference: 'zh',
      setLocalePreference: vi.fn(async (language) => language)
    };

    const owner = await loadOwner();

    expect(owner.initializeI18n()).toBe('zh');
  });

  it('writes desktop locale preference through the desktop bridge', async () => {
    const setLocalePreference = vi.fn(async (language: 'en' | 'zh' | null) => language);
    window.goUsbAiDesktop = {
      localePreference: 'en',
      setLocalePreference
    };

    const owner = await loadOwner();
    owner.initializeI18n();
    owner.setLanguage('zh');

    expect(setLocalePreference).toHaveBeenCalledWith('zh');
    expect(window.localStorage.getItem('go-usb-ai.ui.language')).toBeNull();
  });

  it('keeps using localStorage on web runtimes', async () => {
    const owner = await loadOwner();
    owner.initializeI18n();
    owner.setLanguage('zh');

    expect(window.localStorage.getItem('go-usb-ai.ui.language')).toBe('zh');
  });
});
