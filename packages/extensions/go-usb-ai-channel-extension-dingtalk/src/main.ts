import type { Config, MessageBus } from "@go-usb-ai/core";
import { startBusChannelExtension, warnNcpEventError } from "@go-usb-ai/extension-sdk";
import { DingTalkChannel } from "./services/dingtalk-channel.service.js";

await startBusChannelExtension<Config["channels"]["dingtalk"], MessageBus>({
  channelId: "dingtalk",
  createChannel: ({ config, bus }) => new DingTalkChannel(config, bus),
  onChannelStartError: warnNcpEventError("dingtalk"),
});
