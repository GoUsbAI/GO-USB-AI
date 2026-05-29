export type FeishuProbeResult = {
  ok: boolean;
  detail: string;
};

export function probeFeishu(_params: { appId: string; appSecret: string }): FeishuProbeResult {
  return { ok: false, detail: "Feishu channel is not available" };
}
