import { runPs } from "../utils/powershell.js";

const ADD_TYPE_DECL = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class BinClawMouse {
    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X; public int Y; }
}
"@
`;

const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;
const MOUSEEVENTF_MIDDLEDOWN = 0x0020;
const MOUSEEVENTF_MIDDLEUP = 0x0040;

export interface ClickParams {
  x: number;
  y: number;
  button?: "left" | "right" | "middle";
  doubleClick?: boolean;
}

export interface ClickResult {
  ok: boolean;
  x: number;
  y: number;
  button: string;
}

export function click(params: ClickParams): ClickResult {
  const { x, y, button = "left", doubleClick = false } = params;
  const downFlag =
    button === "right"
      ? MOUSEEVENTF_RIGHTDOWN
      : button === "middle"
        ? MOUSEEVENTF_MIDDLEDOWN
        : MOUSEEVENTF_LEFTDOWN;
  const upFlag =
    button === "right"
      ? MOUSEEVENTF_RIGHTUP
      : button === "middle"
        ? MOUSEEVENTF_MIDDLEUP
        : MOUSEEVENTF_LEFTUP;

  const script = `
${ADD_TYPE_DECL}
[BinClawMouse]::SetCursorPos(${x}, ${y})
[BinClawMouse]::mouse_event(${downFlag}, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[BinClawMouse]::mouse_event(${upFlag}, 0, 0, 0, 0)
${
  doubleClick
    ? `
Start-Sleep -Milliseconds 100
[BinClawMouse]::mouse_event(${downFlag}, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[BinClawMouse]::mouse_event(${upFlag}, 0, 0, 0, 0)
`
    : ""
}
Write-Output "OK"
`;

  runPs(script);
  return { ok: true, x, y, button: doubleClick ? `${button}-double` : button };
}

export function getCursorPos(): { x: number; y: number } {
  const script = `
${ADD_TYPE_DECL}
$p = New-Object BinClawMouse+POINT
[BinClawMouse]::GetCursorPos([ref]$p)
Write-Output "$($p.X),$($p.Y)"
`;
  const out = runPs(script);
  const [xs, ys] = out.split(",");
  return { x: parseInt(xs, 10), y: parseInt(ys, 10) };
}
