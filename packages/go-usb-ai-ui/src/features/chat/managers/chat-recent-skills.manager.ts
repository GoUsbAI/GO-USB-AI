import { RecentSelectionManager } from './recent-selection.manager';

export const chatRecentSkillsManager = new RecentSelectionManager({
  storageKey: 'go-usb-ai.chat.recent-skills',
  limit: 5
});

export const CHAT_RECENT_SKILLS_MIN_OPTIONS = 4;
