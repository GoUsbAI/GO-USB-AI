import { RecentSelectionManager } from './recent-selection.manager';

export const chatRecentModelsManager = new RecentSelectionManager({
  storageKey: 'go-usb-ai.chat.recent-models',
  limit: 3
});

export const CHAT_RECENT_MODELS_MIN_OPTIONS = 5;
