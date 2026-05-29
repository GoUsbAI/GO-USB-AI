import * as GoUsbAiCore from "@go-usb-ai/core";
import type { NcpSessionSkillsView, SessionSkillEntryView } from "@go-usb-ai-server/shared/types/server-api.types.js";
import { loadConfigOrDefault } from "@go-usb-ai-server/features/config/index.js";
import type { UiRouterOptions } from "@go-usb-ai-server/app/types/router-options.types.js";
import { readNonEmptyString } from "@go-usb-ai-server/shared/utils/http-response.utils.js";
import { MARKETPLACE_ZH_COPY_BY_SLUG } from "@go-usb-ai-server/features/marketplace/index.js";

type SkillInfo = GoUsbAiCore.SkillInfo;
type SkillsLoaderInstance = InstanceType<typeof GoUsbAiCore.SkillsLoader>;

const SCOPE_SORT_ORDER: Record<SessionSkillEntryView["scope"], number> = {
  project: 0,
  workspace: 1,
  builtin: 2,
};

export class SessionSkillsViewBuilder {
  constructor(private readonly options: UiRouterOptions) {}

  build = (params: {
    sessionId: string;
    sessionMetadata?: Record<string, unknown> | null;
  }): NcpSessionSkillsView => {
    const config = loadConfigOrDefault(this.options.configPath);
    const projectContext = GoUsbAiCore.resolveSessionProjectContext({
      sessionMetadata: params.sessionMetadata,
      workspace: GoUsbAiCore.getWorkspacePathFromConfig(config),
    });
    const skillsLoader = new GoUsbAiCore.SkillsLoader({
      workspace: projectContext.hostWorkspace,
      projectRoot: projectContext.projectRoot,
    });
    const availableRefs = new Set(
      skillsLoader.listSkills(true).map((skill) => skill.ref),
    );
    const records = skillsLoader
      .listSkills(false)
      .map((skill) => this.buildRecord(skill, skillsLoader, availableRefs))
      .sort((left, right) => this.compareRecords(left, right));

    return {
      sessionId: params.sessionId,
      total: records.length,
      refs: records.map((record) => record.ref),
      records,
    };
  };

  private buildRecord = (
    skill: SkillInfo,
    skillsLoader: SkillsLoaderInstance,
    availableRefs: Set<string>,
  ): SessionSkillEntryView => {
    const metadata = skillsLoader.getSkillMetadata(skill) ?? {};
    const description = readNonEmptyString(metadata.description);
    const descriptionZh =
      readNonEmptyString(metadata.description_zh) ??
      readNonEmptyString(metadata.descriptionZh) ??
      readNonEmptyString(MARKETPLACE_ZH_COPY_BY_SLUG[skill.name]?.description);

    return {
      ref: skill.ref,
      name: skill.name,
      path: skill.path,
      scope: skill.scope,
      source: skill.source,
      available: availableRefs.has(skill.ref),
      ...(description ? { description } : {}),
      ...(descriptionZh ? { descriptionZh } : {}),
    };
  };

  private compareRecords = (
    left: SessionSkillEntryView,
    right: SessionSkillEntryView,
  ): number => {
    const scopeCompare = SCOPE_SORT_ORDER[left.scope] - SCOPE_SORT_ORDER[right.scope];
    if (scopeCompare !== 0) {
      return scopeCompare;
    }
    const nameCompare = left.name.localeCompare(right.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return left.ref.localeCompare(right.ref);
  };
}
