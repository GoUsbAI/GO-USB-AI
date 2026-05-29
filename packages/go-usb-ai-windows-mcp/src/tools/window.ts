import { runPs } from "../utils/powershell.js";

export interface WindowInfo {
  id: number;
  name: string;
  processName: string;
  mainWindowTitle: string;
}

export function listWindows(filter?: string): WindowInfo[] {
  let script = `
Get-Process | Where-Object { $_.MainWindowTitle -ne '' } |
  Select-Object Id, ProcessName, MainWindowTitle |
  Sort-Object MainWindowTitle |
  ForEach-Object {
    Write-Output "$($_.Id)|$($_.ProcessName)|$($_.MainWindowTitle)"
  }
`;
  if (filter) {
    const escaped = filter.replace(/'/g, "''");
    script = `
Get-Process | Where-Object { $_.MainWindowTitle -ne '' -and $_.MainWindowTitle -like '*${escaped}*' } |
  Select-Object Id, ProcessName, MainWindowTitle |
  Sort-Object MainWindowTitle |
  ForEach-Object {
    Write-Output "$($_.Id)|$($_.ProcessName)|$($_.MainWindowTitle)"
  }
`;
  }
  const out = runPs(script);
  if (!out) return [];
  return out.split("\n").map((line) => {
    const [id, processName, mainWindowTitle] = line.split("|");
    return {
      id: parseInt(id, 10),
      name: mainWindowTitle,
      processName,
      mainWindowTitle,
    };
  });
}

const ACTIVATE_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class BinClawWin {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
}
"@
`;

export function activateWindow(windowId: number): { ok: boolean } {
  const script = `
${ACTIVATE_SCRIPT}
$h = [IntPtr]::new(${windowId})
if ([BinClawWin]::IsIconic($h)) { [BinClawWin]::ShowWindow($h, 9) }
[BinClawWin]::SetForegroundWindow($h)
Write-Output "OK"
`;
  runPs(script);
  return { ok: true };
}

export function resizeWindow(
  windowId: number,
  width: number,
  height: number,
): { ok: boolean } {
  const script = `
${ACTIVATE_SCRIPT}
$h = [IntPtr]::new(${windowId})
$sig = @'
[DllImport("user32.dll")]
public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
'@
Add-Type -MemberDefinition $sig -Name "BinClawMove" -Namespace "Win32"
[Win32.BinClawMove]::MoveWindow($h, 100, 100, ${width}, ${height}, $true)
Write-Output "OK"
`;
  runPs(script);
  return { ok: true };
}

export function minimizeWindow(windowId: number): { ok: boolean } {
  const script = `
${ACTIVATE_SCRIPT}
$h = [IntPtr]::new(${windowId})
[BinClawWin]::ShowWindow($h, 6)
Write-Output "OK"
`;
  runPs(script);
  return { ok: true };
}
