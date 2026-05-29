import type { Config, MessageBus } from "@go-usb-ai/core";
import { startBusChannelExtension, warnNcpEventError } from "@go-usb-ai/extension-sdk";
import { EmailChannel } from "./services/email-channel.service.js";

await startBusChannelExtension<Config["channels"]["email"], MessageBus>({
  channelId: "email",
  createChannel: ({ config, bus }) => new EmailChannel(config, bus),
  onChannelStartError: warnNcpEventError("email"),
});
