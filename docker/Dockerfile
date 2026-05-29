FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile

RUN pnpm -C packages/go-usb-ai-core build \
  && pnpm -C packages/ncp-packages/go-usb-ai-ncp build \
  && pnpm -C packages/go-usb-ai-runtime build \
  && pnpm -C packages/extensions/go-usb-ai-channel-runtime build \
  && pnpm -C packages/extensions/go-usb-ai-engine-plugin-codex-sdk build \
  && pnpm -C packages/extensions/go-usb-ai-engine-plugin-claude-agent-sdk build \
  && pnpm -C packages/go-usb-ai-openclaw-compat build \
  && pnpm -C packages/go-usb-ai-server build \
  && pnpm -C packages/go-usb-ai-agent-chat build \
  && pnpm -C packages/go-usb-ai-ui build \
  && pnpm -C packages/go-usb-ai build

ENV GOUSB_AI_HOME=/data
ENV GOUSB_AI_UI_PORT=55667

VOLUME ["/data"]
EXPOSE 18790 55667

CMD ["sh", "-lc", "node /app/packages/go-usb-ai/dist/cli/index.js serve --ui-port ${GOUSB_AI_UI_PORT:-55667}"]
