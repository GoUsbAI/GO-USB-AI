-- Seed official optional agent runtime plugins (2026-03-19)
INSERT INTO marketplace_plugin_items (
  id,
  slug,
  name,
  summary,
  summary_i18n,
  description,
  description_i18n,
  tags,
  author,
  source_repo,
  homepage,
  install_kind,
  install_spec,
  install_command,
  published_at,
  updated_at
) VALUES (
  'plugin-ncp-runtime-codex-sdk',
  'ncp-runtime-plugin-codex-sdk',
  'Codex SDK NCP Runtime Plugin',
  'Optional GoUsbAi plugin that adds a Codex-powered NCP session type.',
  '{"en":"Optional GoUsbAi plugin that adds a Codex-powered NCP session type.","zh":"为 GoUsbAi 提供 Codex 驱动 NCP 会话类型的可选插件。"}',
  'Registers a pluggable Codex SDK runtime for NCP so users can create Codex sessions from the standard GoUsbAi chat entry without changing the default built-in runtime.',
  '{"en":"Registers a pluggable Codex SDK runtime for NCP so users can create Codex sessions from the standard GoUsbAi chat entry without changing the default built-in runtime.","zh":"为 NCP 注册一个可插拔的 Codex SDK runtime，让用户可以直接在 GoUsbAi 标准聊天入口里创建 Codex 会话，同时保持默认内置 runtime 不变。"}',
  '["plugin","agent-runtime","ncp","codex"]',
  'GoUsbAi',
  'https://github.com/go-usb-ai/go-usb-ai',
  'https://github.com/go-usb-ai/go-usb-ai',
  'npm',
  '@go-usb-ai/go-usb-ai-ncp-runtime-plugin-codex-sdk',
  'go-usb-ai plugins install @go-usb-ai/go-usb-ai-ncp-runtime-plugin-codex-sdk',
  '2026-03-19T00:00:00.000Z',
  '2026-03-19T00:00:00.000Z'
) ON CONFLICT(slug) DO UPDATE SET
  name=excluded.name,
  summary=excluded.summary,
  summary_i18n=excluded.summary_i18n,
  description=excluded.description,
  description_i18n=excluded.description_i18n,
  tags=excluded.tags,
  author=excluded.author,
  source_repo=excluded.source_repo,
  homepage=excluded.homepage,
  install_kind=excluded.install_kind,
  install_spec=excluded.install_spec,
  install_command=excluded.install_command,
  published_at=excluded.published_at,
  updated_at=excluded.updated_at;

INSERT OR IGNORE INTO marketplace_plugin_recommendation_scenes (id, title, description)
VALUES ('plugins-default', 'Recommended Plugins', 'Curated plugin list');

INSERT INTO marketplace_plugin_recommendation_items (scene_id, item_id, sort_order)
VALUES ('plugins-default', 'plugin-ncp-runtime-codex-sdk', 10)
ON CONFLICT(scene_id, item_id) DO UPDATE SET sort_order=excluded.sort_order;
