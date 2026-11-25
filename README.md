# Gemini Agent Platform — 桌面版

把公司托管在 Vertex AI 上的 Gemini Enterprise Agent Platform 网页封装成 Windows / macOS 桌面应用（Electron）。

## 本地开发

```bash
npm install
npm start          # 直接运行调试
```

首次打开后在窗口内完成 Google SSO 登录，登录态会持久化（存在 `persist:main` 分区里），之后打开免登录。

## 打包

```bash
npm run dist:mac   # 在 macOS 上出 .dmg（arm64 + x64）
npm run dist:win   # 出 Windows NSIS 安装包（在 mac 上交叉构建通常也可行）
```

产物在 `dist/` 目录。最稳妥的方式是推到 GitHub 后用自带的 Actions 工作流（`.github/workflows/build.yml`），在 macOS / Windows 原生 runner 上各出一份安装包。

## 常见问题

- **Google 登录报"此浏览器或应用可能不安全"**：`main.js` 已通过清理 User-Agent 解决；如果仍出现，检查是否有新的 Electron 版本改变了 UA 格式。
- **公司用 Okta / Azure AD 等 IdP**：把 IdP 域名加入 `main.js` 的 `IN_APP_HOSTS`，保证登录弹窗留在应用内。
- **macOS 提示"无法打开，来自身份不明的开发者"**：未签名应用的正常现象。右键 → 打开，或由 IT 用公司 Developer ID 证书签名 + 公证（electron-builder 配 `CSC_LINK` / notarize 即可）。
- **Windows SmartScreen 警告**：同理，需要代码签名证书消除。
- **换图标**：放一张 ≥1024×1024 的 `build/icon.png`，electron-builder 会自动生成 .icns / .ico。
- **换目标网址**：改 `main.js` 顶部的 `APP_URL`。
