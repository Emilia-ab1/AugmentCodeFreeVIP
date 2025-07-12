# Edge扩展图标

本目录包含Edge专用扩展的图标文件。

## 图标规格

- **icon16.png**: 16x16像素，用于扩展列表
- **icon48.png**: 48x48像素，用于扩展管理页面
- **icon128.png**: 128x128像素，用于Chrome Web Store

## 设计说明

Edge版本的图标在原有设计基础上添加了Edge特色元素：
- 使用Edge品牌色彩 (#0078d4)
- 添加"E"标识区分Chrome版本
- 保持与原版本的视觉一致性

## 文件来源

图标文件需要从chrome-extension/icons/目录复制过来，或者重新设计Edge专用版本。

## 使用方法

这些图标文件会在manifest.json中被引用：

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png", 
  "128": "icons/icon128.png"
}
```
