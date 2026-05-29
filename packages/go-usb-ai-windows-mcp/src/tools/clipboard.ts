import { runPs, psEscape } from "../utils/powershell.js";

export function getClipboard(): string {
  const script = `Get-Clipboard -Raw`;
  try {
    return runPs(script);
  } catch {
    return "";
  }
}

export function setClipboard(text: string): { ok: boolean } {
  const escaped = psEscape(text);
  const script = `
$text = @"\n${escaped}\n"@
Set-Clipboard -Value $text
Write-Output "OK"
`;
  runPs(script);
  return { ok: true };
}
