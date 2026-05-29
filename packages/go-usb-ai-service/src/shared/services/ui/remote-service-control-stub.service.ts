﻿﻿﻿﻿﻿﻿﻿﻿﻿import type { Config } from "@go-usb-ai/core";

export type RemoteServiceView = {
  running: boolean;
  currentProcess: { pid: number } | null;
};

export function resolveRemoteServiceView(_uiConfig: Pick<Config["ui"], "host" | "port">): RemoteServiceView {
  return { running: false, currentProcess: null };
}

export async function controlRemoteService(
  _action: "start" | "stop" | "restart",
  _deps: unknown,
): Promise<{ accepted: boolean; message: string }> {
  return { accepted: false, message: "Remote service control is not available in USB offline mode" };
}
