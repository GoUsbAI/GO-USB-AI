#!/usr/bin/env node
/**
 * BinClaw Windows MCP Server
 *
 * Provides Windows desktop automation tools via stdio MCP transport.
 * Zero external runtime dependency – uses PowerShell (built into Windows).
 *
 * Tools:
 *   win_click          – Mouse click at coordinates
 *   win_type           – Type text via keyboard (SendKeys)
 *   win_clipboard_get  – Read clipboard text
 *   win_clipboard_set  – Write text to clipboard
 *   win_window_list    – List open windows
 *   win_window_activate – Bring a window to foreground
 *   win_window_resize  – Resize a window
 *   win_window_minimize – Minimize a window
 *   win_shell          – Execute a PowerShell command
 *   win_launch         – Launch an application
 *   win_screenshot     – Capture screen (or region) to file
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import { click, getCursorPos } from "./tools/click.js";
import { typeText } from "./tools/type.js";
import { getClipboard, setClipboard } from "./tools/clipboard.js";
import {
  listWindows,
  activateWindow,
  resizeWindow,
  minimizeWindow,
} from "./tools/window.js";
import { execShell, execCmd, launchApp } from "./tools/shell.js";
import { takeScreenshot } from "./tools/screenshot.js";

const server = new McpServer(
  { name: "BinClaw Windows Control", version: "0.1.0" },
  {
    capabilities: { tools: {} },
  },
);

// ── win_click ──
server.tool(
  "win_click",
  "Click the mouse at specified screen coordinates. Use win_cursor_pos to get current position first.",
  {
    x: z.number().int().describe("X coordinate on screen"),
    y: z.number().int().describe("Y coordinate on screen"),
    button: z
      .enum(["left", "right", "middle"])
      .default("left")
      .describe("Mouse button"),
    doubleClick: z
      .boolean()
      .default(false)
      .describe("Set true for double-click"),
  },
  (args) => {
    const result = click(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── win_cursor_pos ──
server.tool(
  "win_cursor_pos",
  "Get the current mouse cursor position on screen.",
  {},
  () => {
    const pos = getCursorPos();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(pos, null, 2),
        },
      ],
    };
  },
);

// ── win_type ──
server.tool(
  "win_type",
  "Type text via keyboard input (SendKeys). Use win_click first to focus the target field.",
  {
    text: z.string().describe("Text to type"),
    delay: z
      .number()
      .int()
      .default(10)
      .describe("Milliseconds delay between keystrokes"),
    clearFirst: z
      .boolean()
      .default(false)
      .describe("Press Ctrl+A before typing to clear existing text"),
  },
  (args) => {
    const result = typeText(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── win_clipboard_get ──
server.tool(
  "win_clipboard_get",
  "Read the current text content from the Windows clipboard.",
  {},
  () => {
    const text = getClipboard();
    return {
      content: [
        {
          type: "text",
          text: text || "(clipboard is empty or contains non-text content)",
        },
      ],
    };
  },
);

// ── win_clipboard_set ──
server.tool(
  "win_clipboard_set",
  "Write text to the Windows clipboard.",
  {
    text: z.string().describe("Text to place on clipboard"),
  },
  (args) => {
    const result = setClipboard(args.text);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── win_window_list ──
server.tool(
  "win_window_list",
  "List all open windows with their process ID, name, and title. Optionally filter by title text.",
  {
    filter: z
      .string()
      .optional()
      .describe("Optional text filter for window titles (case-insensitive substring match)"),
  },
  (args) => {
    const windows = listWindows(args.filter);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(windows, null, 2),
        },
      ],
    };
  },
);

// ── win_window_activate ──
server.tool(
  "win_window_activate",
  "Bring a window to the foreground by its process ID (from win_window_list).",
  {
    windowId: z
      .number()
      .int()
      .positive()
      .describe("Window process ID from win_window_list"),
  },
  (args) => {
    const result = activateWindow(args.windowId);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── win_window_resize ──
server.tool(
  "win_window_resize",
  "Resize and reposition a window by its process ID.",
  {
    windowId: z
      .number()
      .int()
      .positive()
      .describe("Window process ID from win_window_list"),
    width: z.number().int().positive().describe("New width in pixels"),
    height: z
      .number()
      .int()
      .positive()
      .describe("New height in pixels"),
  },
  (args) => {
    const result = resizeWindow(args.windowId, args.width, args.height);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── win_window_minimize ──
server.tool(
  "win_window_minimize",
  "Minimize a window by its process ID.",
  {
    windowId: z
      .number()
      .int()
      .positive()
      .describe("Window process ID from win_window_list"),
  },
  (args) => {
    const result = minimizeWindow(args.windowId);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── win_shell ──
server.tool(
  "win_shell",
  "Execute a PowerShell command and return stdout, stderr, and exit code.",
  {
    command: z.string().describe("PowerShell command to execute"),
    timeoutMs: z
      .number()
      .int()
      .default(60000)
      .describe("Timeout in milliseconds (default 60000)"),
  },
  (args) => {
    const result = execShell(args.command, args.timeoutMs);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── win_launch ──
server.tool(
  "win_launch",
  "Launch an application by name or path. Example: 'notepad', 'calc', or full path.",
  {
    app: z.string().describe("Application name or full path to executable"),
  },
  (args) => {
    const result = launchApp(args.app);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── win_screenshot ──
server.tool(
  "win_screenshot",
  "Capture a screenshot of the entire screen or a region. Saves to a PNG file.",
  {
    filename: z
      .string()
      .optional()
      .describe("Output filename (relative to CWD). Default: screenshot_{timestamp}.png"),
    x: z
      .number()
      .int()
      .optional()
      .describe("Region X offset (omit for full screen)"),
    y: z
      .number()
      .int()
      .optional()
      .describe("Region Y offset (omit for full screen)"),
    width: z
      .number()
      .int()
      .optional()
      .describe("Region width (omit for full screen)"),
    height: z
      .number()
      .int()
      .optional()
      .describe("Region height (omit for full screen)"),
  },
  (args) => {
    const result = takeScreenshot({
      filename: args.filename,
      region:
        args.x !== undefined &&
        args.y !== undefined &&
        args.width !== undefined &&
        args.height !== undefined
          ? { x: args.x, y: args.y, width: args.width, height: args.height }
          : undefined,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── Start stdio transport ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr to avoid interfering with stdio protocol
  process.stderr.write("[BinClaw-Windows-MCP] Server started on stdio\n");
}

main().catch((err) => {
  process.stderr.write(
    `[BinClaw-Windows-MCP] Fatal: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
