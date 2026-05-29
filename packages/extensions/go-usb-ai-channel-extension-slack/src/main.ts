import type { Config, MessageBus } from "@go-usb-ai/core";
import { startBusChannelExtension, warnNcpEventError } from "@go-usb-ai/extension-sdk";
import { SlackChannel } from "./services/slack-channel.service.js";

await startBusChannelExtension<Config["channels"]["slack"], MessageBus>({
  channelId: "slack",
  createChannel: ({ config, bus }) => new SlackChannel(config, bus),
  onChannelStartError: warnNcpEventError("slack"),
});
