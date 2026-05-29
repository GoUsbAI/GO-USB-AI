# @go-usb-ai/agent-chat-ui

Reusable GoUsbAi agent chat UI package.

This package contains the reusable chat presentation layer extracted from `@go-usb-ai/ui`:

- chat input bar components
- chat message list components
- chat view-model types
- chat-local hooks and utilities
- default skin primitives used by the chat package itself

It intentionally does not include GoUsbAi host wiring such as presenter/store access, runtime adapters, page shells, or product-specific business logic.

## Install

```bash
npm i @go-usb-ai/agent-chat-ui
```

## Development

```bash
pnpm -C packages/go-usb-ai-agent-chat-ui tsc
pnpm -C packages/go-usb-ai-agent-chat-ui test
pnpm -C packages/go-usb-ai-agent-chat-ui build
```

## Public API

```ts
import {
  ChatInputBar,
  ChatMessageList,
  useStickyBottomScroll,
  useCopyFeedback,
  copyText,
  type ChatInputBarProps,
  type ChatMessageListProps
} from '@go-usb-ai/agent-chat-ui';
```

## Scope

- Reusable: presentation, local interaction hooks, UI-owned utils, view-model contracts
- Not included: GoUsbAi containers, adapters to runtime/store types, presenter wiring, page-level chat panels

## Links

- Repository: https://github.com/Peiiii/go-usb-ai
- Package source: https://github.com/Peiiii/go-usb-ai/tree/master/packages/go-usb-ai-agent-chat-ui
- Product docs: https://docs.go-usb-ai.io
