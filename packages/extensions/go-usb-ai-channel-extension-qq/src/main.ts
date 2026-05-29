import { startBusChannelExtension, warnNcpEventError } from "@go-usb-ai/extension-sdk";
import { QQChannel, type QQChannelConfig } from "./services/qq-channel.service.js";

await startBusChannelExtension<QQChannelConfig>({
  channelId: "qq",
  createChannel: ({ config, bus }) => new QQChannel(config, bus),
  onChannelStartError: warnNcpEventError("qq"),
});
