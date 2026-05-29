import type { Config, MessageBus } from "@go-usb-ai/core";
import { startBusChannelExtension, warnNcpEventError } from "@go-usb-ai/extension-sdk";
import { WhatsAppChannel } from "./services/whatsapp-channel.service.js";

await startBusChannelExtension<Config["channels"]["whatsapp"], MessageBus>({
  channelId: "whatsapp",
  createChannel: ({ config, bus }) => new WhatsAppChannel(config, bus),
  onChannelStartError: warnNcpEventError("whatsapp"),
});
