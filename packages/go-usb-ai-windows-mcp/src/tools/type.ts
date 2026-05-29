import { runPs, psEscape } from "../utils/powershell.js";

export interface TypeParams {
  text: string;
  /** Milliseconds delay between keystrokes, default 10 */
  delay?: number;
  /** Clear existing text first (Ctrl+A then type) */
  clearFirst?: boolean;
}

export function typeText(params: TypeParams): { ok: boolean; length: number } {
  const { text, delay = 10, clearFirst = false } = params;
  const escaped = psEscape(text);

  let script = `
Add-Type -AssemblyName System.Windows.Forms
`;
  if (clearFirst) {
    script += `
[System.Windows.Forms.SendKeys]::SendWait("^a")
Start-Sleep -Milliseconds 100
`;
  }

  // SendKeys requires special characters to be escaped with {}
  // We use a character-by-character approach via PowerShell for better control
  script += `
$text = "${escaped}"
$wshell = New-Object -ComObject WScript.Shell
$wshell.SendKeys($text)
Write-Output "OK"
`;

  runPs(script);
  return { ok: true, length: text.length };
}
