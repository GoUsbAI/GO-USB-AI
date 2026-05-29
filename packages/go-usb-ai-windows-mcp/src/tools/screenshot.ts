import { runPs } from "../utils/powershell.js";

export interface ScreenshotParams {
  /** Output filename (relative to CWD). Default: screenshot_{timestamp}.png */
  filename?: string;
  /** Capture region: x,y,width,height. Omit for full screen. */
  region?: { x: number; y: number; width: number; height: number };
}

export interface ScreenshotResult {
  ok: boolean;
  path: string;
  width: number;
  height: number;
}

const SCREENSHOT_DECL = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
`;

export function takeScreenshot(params: ScreenshotParams = {}): ScreenshotResult {
  const { region } = params;
  const ts = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "");
  const filename = params.filename || `screenshot_${ts}.png`;

  let script = SCREENSHOT_DECL;

  if (region) {
    const { x, y, width, height } = region;
    script += `
$bmp = New-Object System.Drawing.Bitmap(${width}, ${height})
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(${x}, ${y}, 0, 0, $bmp.Size)
$g.Dispose()
$bmp.Save("${filename.replace(/"/g, '`"')}", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "${width}|${height}"
`;
  } else {
    script += `
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$w = $screen.Bounds.Width
$h = $screen.Bounds.Height
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(0, 0, 0, 0, $bmp.Size)
$g.Dispose()
$bmp.Save("${filename.replace(/"/g, '`"')}", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "$w|$h"
`;
  }

  const out = runPs(script);
  const [ws, hs] = out.split("|");
  return {
    ok: true,
    path: filename,
    width: parseInt(ws, 10),
    height: parseInt(hs, 10),
  };
}
