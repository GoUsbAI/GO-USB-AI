import type { GoUsbAiKernel } from "@kernel/app/go-usb-ai-kernel.js";
import type { KernelBranch } from "@kernel/contributions/kernel-branch/index.js";
import {
  buildAgentRunRequestMetadata,
  type AgentRunRequest,
  type ToolProvider,
} from "@kernel/features/agent-run/index.js";
import { resolveGoUsbAiNcpRunContext } from "@kernel/features/native-runtime/index.js";
import {
  eventKeys,
} from "@go-usb-ai/shared";
import {
  NcpEventType,
  type NcpTool,
} from "@go-usb-ai/ncp";

export class KernelToolProvider implements ToolProvider {
  constructor(
    private readonly kernel: GoUsbAiKernel,
    private readonly branch: KernelBranch,
  ) {}

  provide = async (request: AgentRunRequest): Promise<readonly NcpTool[]> => {
    const session = request.sessionId
      ? await this.branch.sessionRepository.getSession(request.sessionId)
      : null;
    const sessionId = session?.sessionId ?? request.sessionId ?? request.message.sessionId ?? "";
    const requestMetadata = buildAgentRunRequestMetadata({ request, session });
    const runContext = resolveGoUsbAiNcpRunContext({
      configManager: this.kernel.configManager,
      sessionId,
      requestMetadata,
      sessionMetadata: session?.metadata ?? requestMetadata,
      storedAgentId: request.agentId ?? session?.agentId,
    });
    const toolRegistry = this.kernel.toolManager.createRuntimeRegistry({
      updateToolCallResult: async ({ result, sessionId: targetSessionId, toolCallId }) => {
        this.kernel.eventBus.emit(eventKeys.ncpEvent, {
          type: NcpEventType.MessageToolCallResult,
          payload: {
            sessionId: targetSessionId,
            toolCallId,
            content: result,
          },
        }, {
          emittedAt: new Date().toISOString(),
          source: "agent-run-tool-provider",
        });
      },
    });
    toolRegistry.prepareForRun(runContext.toolRunContext);
    return toolRegistry.listTools();
  };
}
