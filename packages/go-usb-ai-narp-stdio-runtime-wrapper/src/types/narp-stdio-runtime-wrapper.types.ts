import type {
  NcpAgentRuntime,
  NcpProviderRuntimeRoute,
  OpenAITool,
} from "@go-usb-ai/ncp";

export type NarpStdioPromptMeta = {
  correlationId?: string;
  providerRoute?: NcpProviderRuntimeRoute;
  sessionMetadata?: Record<string, unknown>;
  tools?: ReadonlyArray<OpenAITool>;
};

export type NarpStdioRuntimeWrapperContext = {
  sessionId: string;
  cwd?: string;
  modelId?: string;
  promptMeta: NarpStdioPromptMeta;
};

export type NarpStdioRuntimeWrapperConfig = {
  agentName: string;
  createRuntime: (
    context: NarpStdioRuntimeWrapperContext,
  ) => NcpAgentRuntime | Promise<NcpAgentRuntime>;
};
