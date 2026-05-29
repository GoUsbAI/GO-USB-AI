import type { ChatComposerNode } from '@go-usb-ai/agent-chat-ui';
import type { NcpMessagePart } from '@go-usb-ai/ncp';
import type { NcpDraftAttachment } from '@go-usb-ai/ncp-react';
import type { ThinkingLevel } from '@/shared/lib/api';

export type SendMessageParams = {
  message: string;
  sessionKey?: string;
  agentId: string;
  sessionType?: string;
  model?: string;
  thinkingLevel?: ThinkingLevel;
  requestedSkills?: string[];
  attachments?: NcpDraftAttachment[];
  parts?: NcpMessagePart[];
  stopSupported?: boolean;
  stopReason?: string;
  restoreDraftOnError?: boolean;
  composerNodes?: ChatComposerNode[];
};

export type ResumeRunParams = {
  sessionKey: string;
};

export type ChatStreamActions = {
  sendMessage: (payload: SendMessageParams) => Promise<void>;
  stopCurrentRun: () => Promise<void>;
  resumeRun: (run: ResumeRunParams) => Promise<void>;
  resetStreamState: () => void;
  applyHistoryMessages: (messages: unknown[], options?: { isLoading?: boolean }) => void;
};
