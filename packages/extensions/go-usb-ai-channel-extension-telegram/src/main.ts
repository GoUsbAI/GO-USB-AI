import type { Config, MessageBus } from "@go-usb-ai/core";
import { startBusChannelExtension, warnNcpEventError } from "@go-usb-ai/extension-sdk";
import { TelegramChannel } from "./services/telegram-channel.service.js";

await startBusChannelExtension<Config["channels"]["telegram"], MessageBus>({
  channelId: "telegram",
  createChannel: ({ config, bus, channel }) => new TelegramChannel(config, bus, channel.commands),
  onChannelStartError: warnNcpEventError("telegram"),
});
