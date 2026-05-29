import * as GoUsbAiCore from "@go-usb-ai/core";
import { spawn } from "node:child_process";
import { SkillManager } from "@go-usb-ai/kernel";
import type { RequestRestartParams } from "@go-usb-ai-service/shared/types/cli.types.js";
import { ManagedServiceCommandService, type StartServiceOptions } from "@go-usb-ai-service/shared/services/runtime/service-managed-startup.service.js";
import { ManagedServiceSupervisor } from "@go-usb-ai-service/shared/services/runtime/managed-service-supervisor.service.js";
import { GoUsbAiGatewayRuntime } from "@go-usb-ai-service/shared/services/gateway/go-usb-ai-gateway-runtime.service.js";
import { GoUsbAiDistributionService } from "@go-usb-ai-service/shared/services/runtime/go-usb-ai-distribution.service.js";
import { describeUnmanagedHealthyTargetMessage, inspectUiTarget } from "@go-usb-ai-service/shared/utils/service-port-probe.utils.js";
import { resolveCliSubcommandEntry } from "@go-usb-ai-service/shared/utils/marketplace/cli-subcommand-launch.utils.js";
import { isLoopbackHost, resolvePublicIp, resolveUiStaticDir } from "@go-usb-ai-service/shared/utils/cli.utils.js";
export { buildMarketplaceSkillInstallArgs, pickUserFacingCommandSummary } from "@go-usb-ai-service/shared/utils/marketplace/service-marketplace-helpers.utils.js";
export { describeUnmanagedHealthyTargetMessage };
const {
  getWorkspacePath,
  loadConfig,
} = GoUsbAiCore;
type Config = GoUsbAiCore.Config;

export class RuntimeCommandService {
  private loggingInstalled = false;
  private processExitLoggingInstalled = false;
  private readonly runtimeLogger = GoUsbAiCore.getAppLogger("service.runtime");
  private readonly managedServiceSupervisor = new ManagedServiceSupervisor();
  private readonly managedServiceCommandService = new ManagedServiceCommandService({
    startGateway: async (options) => await this.startGateway(options),
    printPublicUiUrls: async (host, port) => await this.printPublicUiUrls(host, port),
    printServiceControlHints: () => this.printServiceControlHints(),
    checkUiPortPreflight: async (params) => await this.checkUiPortPreflight(params),
    resolveUiStaticDir: () => resolveUiStaticDir(GoUsbAiDistributionService.get().uiDistDir)
  });

  constructor(private deps: {
    requestRestart: (params: RequestRestartParams) => Promise<void>;
    initializeAgentHomeDirectory: (homeDirectory: string) => void;
  }) {}

  startGateway = async (options: { uiOverrides?: Partial<Config["ui"]>; uiStaticDir?: string | null } = {}): Promise<void> => {
    this.ensureRuntimeLoggingInstalled();
    this.installProcessExitLogging();
    this.managedServiceSupervisor.installCurrentProcessLifecycleTracking();
    this.runtimeLogger.info("runtime.process.started", {
      runtimeKind: "serve-process",
      pid: process.pid,
      source: "RuntimeCommandService.startGateway"
    });
    await new GoUsbAiGatewayRuntime({
      requestRestart: this.deps.requestRestart,
      initializeAgentHomeDirectory: this.deps.initializeAgentHomeDirectory,
      startService: this.startService,
      stopService: this.stopService,
      runCliSubcommand: this.runCliSubcommand,
      installBuiltinMarketplaceSkill: this.installBuiltinMarketplaceSkill,
    }, {
      ...options
    }).start();
    this.runtimeLogger.info("runtime.process.ready", {
      runtimeKind: "serve-process",
      pid: process.pid,
      source: "RuntimeCommandService.startGateway"
    });
  };

  startService = async (options: StartServiceOptions): Promise<void> => {
    await this.managedServiceCommandService.startService(options);
  };

  stopService = async (): Promise<void> => {
    await this.managedServiceCommandService.stopService();
  };

  runForeground = async (options: {
    uiOverrides: Partial<Config["ui"]>;
    open: boolean;
  }): Promise<void> => {
    await this.managedServiceCommandService.runForeground(options);
  };

  private installBuiltinMarketplaceSkill = (slug: string, _force: boolean | undefined): { message: string; output?: string } | null => {
    const workspace = getWorkspacePath(loadConfig().agents.defaults.workspace);
    if (!new SkillManager({ workspace }).findBuiltinSkill(slug)) {
      return null;
    }
    return {
      message: `${slug} is already available (built-in)`
    };
  };

  private mergeCommandOutput = (stdout: string, stderr: string): string => {
    return `${stdout}\n${stderr}`.trim();
  };

  private runCliSubcommand = (args: string[], timeoutMs = 180_000): Promise<string> => {
    const cliEntry = resolveCliSubcommandEntry({
      argvEntry: process.argv[1],
      importMetaUrl: import.meta.url
    });
    return this.runCommand(process.execPath, [...process.execArgv, cliEntry, ...args], {
      cwd: process.cwd(),
      timeoutMs
    }).then((result) => this.mergeCommandOutput(result.stdout, result.stderr));
  };

  private runCommand = (command: string, args: string[], options: { cwd?: string; timeoutMs?: number } = {}): Promise<{ stdout: string; stderr: string }> => {
    const timeoutMs = options.timeoutMs ?? 180_000;
    return new Promise((resolvePromise, rejectPromise) => {
      const child = spawn(command, args, {
        cwd: options.cwd ?? process.cwd(),
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      });

      let stdout = "";
      let stderr = "";
      child.stdout?.setEncoding("utf-8");
      child.stderr?.setEncoding("utf-8");
      child.stdout?.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr?.on("data", (chunk: string) => {
        stderr += chunk;
      });

      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        rejectPromise(new Error(`command timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      child.on("error", (error) => {
        clearTimeout(timer);
        rejectPromise(new Error(`failed to start command: ${String(error)}`));
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const output = this.mergeCommandOutput(stdout, stderr);
        if (code === 0) {
          resolvePromise({ stdout, stderr });
          return;
        }
        rejectPromise(new Error(output || `command failed with code ${code ?? 1}`));
      });
    });
  };

  private ensureRuntimeLoggingInstalled = (): void => {
    if (this.loggingInstalled) {
      return;
    }
    GoUsbAiCore.configureAppLogging({
      installConsoleMirror: true,
      installProcessCrashMonitor: true
    });
    this.loggingInstalled = true;
  };

  private installProcessExitLogging = (): void => {
    if (this.processExitLoggingInstalled) {
      return;
    }
    this.processExitLoggingInstalled = true;
    process.once("exit", (code) => {
      this.runtimeLogger.warn("runtime.process.exited", {
        runtimeKind: "serve-process",
        pid: process.pid,
        code
      });
    });
  };

  private checkUiPortPreflight = async (params: {
    host: string;
    port: number;
    healthUrl: string;
  }): Promise<
    | { ok: true; reusedExistingHealthyTarget: boolean }
    | { ok: false; message: string }
  > => {
    const target = await inspectUiTarget(params);
    if (target.state === "available") {
      return { ok: true, reusedExistingHealthyTarget: false };
    }
    if (target.state === "healthy-existing") {
      return { ok: true, reusedExistingHealthyTarget: true };
    }

    const lines = [`Port probe: ${target.availabilityDetail}`];
    if (target.probeError) {
      lines.push(`Health probe: ${target.probeError}`);
    }
    lines.push("The port is occupied by a process that does not answer as a healthy GoUsbAi HTTP server.");
    lines.push(`Fix: free port ${params.port} or start GoUsbAi with another port via --ui-port <port>.`);
    lines.push(`Inspect locally with: ss -ltnp | grep ${params.port} || lsof -iTCP:${params.port} -sTCP:LISTEN -n -P`);
    return {
      ok: false,
      message: lines.join("\n")
    };
  };

  private printPublicUiUrls = async (host: string, port: number): Promise<void> => {
    if (isLoopbackHost(host)) {
      console.log("Public URL: disabled (UI host is loopback). Current release expects public exposure; run go-usb-ai restart.");
      return;
    }

    const publicIp = await resolvePublicIp();
    if (!publicIp) {
      console.log("Public URL: UI is exposed, but automatic public IP detection failed.");
      return;
    }

    const publicBase = `http://${publicIp}:${port}`;
    console.log(`Public UI (if firewall/NAT allows): ${publicBase}`);
    console.log(`Public API (if firewall/NAT allows): ${publicBase}/api`);
    console.log(`Public deploy note: GoUsbAi serves plain HTTP on ${port}.`);
    console.log(`For https:// or standard 80/443 access, terminate TLS in Nginx/Caddy and proxy to http://127.0.0.1:${port}.`);
    console.log(`If a reverse proxy returns 502, verify its upstream is http://127.0.0.1:${port} (not https://, not a stale port, and not a stopped process).`);
  };

  private printServiceControlHints = (): void => {
    console.log("Service controls:");
    console.log("  - Check status: GoUsbAi status");
    console.log("  - If you need to stop the service, run: GoUsbAi stop");
    console.log("  - View log paths: GoUsbAi logs path");
    console.log("  - Tail recent logs: GoUsbAi logs tail");
    console.log("  - Check autostart: GoUsbAi service autostart status --user");
  };
}
