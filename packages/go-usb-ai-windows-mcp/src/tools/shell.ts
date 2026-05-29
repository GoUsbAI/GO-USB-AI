import { execSync } from "node:child_process";
import { runPs } from "../utils/powershell.js";

export interface ShellResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function execShell(command: string, timeoutMs = 60000): ShellResult {
  const encoded = Buffer.from(command, "utf-16le").toString("base64");
  try {
    const stdout = execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { encoding: "utf-8", timeout: timeoutMs, windowsHide: true },
    ).trim();
    return { exitCode: 0, stdout, stderr: "" };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "stdout" in e) {
      const err = e as { stdout: Buffer | string; stderr: Buffer | string; status: number | null };
      return {
        exitCode: err.status ?? 1,
        stdout: String(err.stdout ?? "").trim(),
        stderr: String(err.stderr ?? "").trim(),
      };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { exitCode: 1, stdout: "", stderr: msg };
  }
}

/** Execute a command via cmd.exe (for non-PowerShell commands). */
export function execCmd(command: string, timeoutMs = 60000): ShellResult {
  try {
    const stdout = execSync(command, {
      encoding: "utf-8",
      timeout: timeoutMs,
      windowsHide: true,
      shell: "cmd.exe",
    }).trim();
    return { exitCode: 0, stdout, stderr: "" };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "stdout" in e) {
      const err = e as { stdout: Buffer | string; stderr: Buffer | string; status: number | null };
      return {
        exitCode: err.status ?? 1,
        stdout: String(err.stdout ?? "").trim(),
        stderr: String(err.stderr ?? "").trim(),
      };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { exitCode: 1, stdout: "", stderr: msg };
  }
}

/** Launch an application by name or path. */
export function launchApp(appName: string): { ok: boolean; message: string } {
  const script = `Start-Process "${appName.replace(/"/g, '`"')}"`;
  try {
    runPs(script);
    return { ok: true, message: `Launched: ${appName}` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}
