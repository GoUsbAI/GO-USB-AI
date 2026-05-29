import { execSync } from "node:child_process";

/**
 * Run a PowerShell script and return stdout trimmed.
 * Uses Base64 UTF-16LE encoding to avoid shell quoting hell.
 */
export function runPs(script: string, timeoutMs = 30000): string {
  const encoded = Buffer.from(script, "utf-16le").toString("base64");
  try {
    return execSync(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { encoding: "utf-8", timeout: timeoutMs, windowsHide: true },
    ).trim();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`PowerShell failed: ${msg}`);
  }
}

/** Escape a string for safe use inside a PowerShell double-quoted string. */
export function psEscape(s: string): string {
  return s.replace(/`/g, "``").replace(/"/g, '`"').replace(/\$/g, "`$");
}
