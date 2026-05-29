# GO-USB-AI Logo 替换方法

## 概述

本项目包含多个位置的图标文件，需要统一替换以保持品牌一致性。

## 图标位置清单

### 1. 前端 PWA 图标

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `packages/go-usb-ai-ui/public/pwa-192.png` | 192×192 | PWA 安装后任务栏/开始菜单图标 |
| `packages/go-usb-ai-ui/public/pwa-512.png` | 512×512 | PWA 安装图标 |
| `packages/go-usb-ai-ui/public/favicon.svg` | 32×32 | 浏览器标签页图标 |
| `packages/go-usb-ai-ui/public/logo.svg` | 960×960 | 主 logo SVG |

### 2. 后端托管图标

```
packages/go-usb-ai/ui-dist/pwa-192.png
packages/go-usb-ai/ui-dist/pwa-512.png
```

### 3. 桌面端安装程序图标

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `apps/desktop/build/icons/icon.png` | 512×512 | 桌面程序图标 |
| `apps/desktop/build/icons/icon.ico` | 多尺寸 | Windows 安装程序/快捷方式图标 |

## 替换步骤

### 步骤 1：准备 logo 文件

确保新 logo 满足以下要求：
- 正方形尺寸（推荐 512×512 或更大）
- 支持透明背景（PNG 格式）
- 图标主体居中

### 步骤 2：替换前端图标

```bash
# 复制图标到前端 public 目录
copy new-logo-192.png packages/go-usb-ai-ui/public/pwa-192.png
copy new-logo-512.png packages/go-usb-ai-ui/public/pwa-512.png
copy new-favicon.svg packages/go-usb-ai-ui/public/favicon.svg
copy new-logo.svg packages/go-usb-ai-ui/public/logo.svg
```

### 步骤 3：重新构建前端

```bash
cd packages/go-usb-ai-ui
pnpm build
```

### 步骤 4：同步到后端

前端构建后，产物会自动复制到 `packages/go-usb-ai/ui-dist/`

### 步骤 5：替换桌面端图标

```bash
# 复制图标到桌面端构建目录
copy new-logo-512.png apps/desktop/build/icons/icon.png
# icon.ico 需要特殊处理，建议使用专门工具生成
```

### 步骤 6：验证

启动服务验证图标显示：
```bash
cd packages/go-usb-ai
pnpm start
```
访问 http://localhost:18792/ 查看效果

## 自动生成脚本

项目提供了自动生成图标的脚本：

```bash
# 使用 Node.js 脚本生成图标
node generate-correct-icons.mjs
```

脚本功能：
- 根据 SVG logo 生成不同尺寸的 PNG 图标
- 自动替换所有图标位置
- 生成 Windows ICO 格式图标

## 当前 logo 设计规范（更新于 2026-05-27）

- **背景**: 蓝色渐变（#40B0E6 → #1A8CD8）
- **形状**: 圆角正方形（20% 圆角半径）
- **内容**: U 盘图标 + "GO-USB-AI" 文字
- **颜色**: 白色文字，灰色图标

## 完整 SVG Logo 代码

```svg
<svg width="960" height="960" viewBox="0 0 960 960" xmlns="http://www.w3.org/2000/svg">
   <defs>
     <!-- 背景渐变 -->
     <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
       <stop offset="0%" style="stop-color:#40B0E6;stop-opacity:1" />
       <stop offset="100%" style="stop-color:#1A8CD8;stop-opacity:1" />
     </linearGradient>
   </defs>

   <!-- 20%圆角渐变背景 -->
   <rect width="960" height="960" fill="url(#bgGrad)" rx="192" ry="192" />

   <!-- U盘图标：灰色 #d0d0d0，加粗描边，下层居中 -->
   <g transform="translate(241, 241) scale(1)">
     <path fill="#d0d0d0" stroke="#d0d0d0" stroke-width="6" stroke-linejoin="round"
       d="M475.308,104.166L373.484,2.342c-3.124-3.123-8.188-3.123-11.312,0L311.26,53.254
       c-3.174-3.001-8.138-3.001-11.312,0l-28.288,28.28l-5.656-5.656c-3.174-3.001-8.138-3.001-11.312,0L29.788,300.798
       c-40.237,40.988-39.629,106.835,1.36,147.072c40.457,39.715,105.268,39.712,145.72-0.008l224.896-224.904
       c3.123-3.124,3.123-8.188,0-11.312l-5.656-5.656l28.288-28.288c3.123-3.124,3.123-8.188,0-11.312l50.912-50.912
       C478.431,112.354,478.431,107.29,475.308,104.166z M165.556,436.55c-34.368,34.368-90.088,34.368-124.456,0
       s-34.368-90.088,0-124.456L260.348,92.846l124.448,124.456L165.556,436.55z M384.796,194.67L282.98,92.846l22.616-22.624
       l101.832,101.824L384.796,194.67z M413.084,155.078l-39.6-39.6l11.312-11.312l-11.312-11.32l-11.312,11.32l-39.6-39.6l45.256-45.256
       l90.504,90.512L413.084,155.078z"/>
     <path fill="#d0d0d0" stroke="#d0d0d0" stroke-width="6"
       d="M356.514,53.249l11.315-11.313l22.626,22.629l-11.315,11.313L356.514,53.249z"/>
     <path fill="#d0d0d0" stroke="#d0d0d0" stroke-width="6"
       d="M401.772,98.511l11.315-11.313l22.626,22.629l-11.315,11.313L401.772,98.511z"/>
   </g>

   <!-- 居中文字 GO-USB-AI（上层纯白色） -->
   <text x="480" y="580"
         font-family="Arial, sans-serif"
         font-size="200"
         font-weight="bold"
         fill="white"
         text-anchor="middle">
     GO-USB-AI
   </text>
 </svg>
```

## 已更新的 Logo 文件位置

| 路径 | 说明 |
|------|------|
| `logo.svg` | 项目根目录主 Logo |
| `packages/go-usb-ai-ui/public/logo.svg` | 前端 UI Logo |
| `packages/go-usb-ai/ui-dist/logo.svg` | 后端托管 Logo |
| `apps/docs/public/logo.svg` | 文档站 Logo |
| `apps/landing/public/logo.svg` | 落地页 Logo |

## 注意事项

1. **尺寸要求**: 所有 PNG 图标必须是正方形，否则会显示异常
2. **ICO 格式**: Windows 图标需要专门工具生成，包含多种尺寸
3. **缓存问题**: 更新后可能需要清除浏览器缓存才能看到新图标
4. **构建同步**: 修改前端图标后必须重新构建才能同步到后端
5. **品牌名称**: Logo 中的文字必须使用 "GO-USB-AI"（全大写，含连字符）
