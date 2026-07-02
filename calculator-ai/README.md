# 🧮 Calculator AI — VS Code 大模型智能计算器

> **适用场景**：课程作业 / 大模型接入实践 / VS Code 扩展开发学习
>
> **核心功能**：将 DeepSeek V4 Pro 大模型接入 VS Code，实现自然语言数学计算
>
> **难度**：⭐⭐☆☆☆（适合有基础编程经验的同学）

---

## 📖 目录

- [1. 前置知识](#1-前置知识)
- [2. 项目概览](#2-项目概览)
- [3. 环境准备](#3-环境准备)
- [4. 项目结构](#4-项目结构)
- [5. 架构设计](#5-架构设计)
- [6. 从零搭建教程](#6-从零搭建教程)
- [7. 接入大模型详解](#7-接入大模型详解)
- [8. 部署到其他电脑](#8-部署到其他电脑)
- [9. 使用指南](#9-使用指南)
- [10. 常见问题](#10-常见问题)

---

## 1. 前置知识

在开始之前，你需要了解以下概念：

| 知识点 | 说明 | 需要掌握的程度 |
|--------|------|--------------|
| **Node.js** | JavaScript 运行环境 | 知道是什么，会装就行 |
| **npm** | Node.js 的包管理器 | 会用 `npm install` |
| **TypeScript** | JavaScript 的超集，加了类型 | 能看懂基本语法 |
| **VS Code Extension** | VS Code 的插件系统 | 理解扩展 = 给 VS Code 加功能 |
| **Webview** | VS Code 内嵌的网页 | 理解扩展的 UI 是用 HTML/CSS/JS 做的 |
| **REST API** | HTTP 请求调用远程服务 | 知道 GET/POST，请求/响应 |
| **API Key** | 调用大模型的"密码" | 知道是身份凭证 |
| **LLM** | 大语言模型（Large Language Model） | 理解"输入文字 → AI 处理 → 输出文字" |

> **一句话总结**：VS Code 扩展 = TypeScript 写的插件 + HTML 做的界面，通过 HTTP 请求调用云端大模型 API。

---

## 2. 项目概览

### 2.1 这是什么？

一个 VS Code 扩展，在编辑器内打开一个**计算器面板**：

```
┌──────────────────────────────────────────────────────┐
│                    Calculator AI                      │
├─────────────────────┬────────────────────────────────┤
│                     │  🤖 AI 助手 (DeepSeek)          │
│     ┌───────────┐   │                                │
│     │    156    │   │  你：156 乘以 23 再加 789       │
│     └───────────┘   │                                │
│                     │  AI：                           │
│  [C] [⌫] [%] [÷]   │  1. 先算 156 × 23 = 3588       │
│  [7] [8] [9] [×]   │  2. 再算 3588 + 789 = 4377     │
│  [4] [5] [6] [−]   │  结果：4377                      │
│  [1] [2] [3] [+]   │                                │
│  [0] [.]    [=]    │  [输入计算问题...] [发送]      │
│                     │                                │
│   ← 标准计算器 →    │  ← AI 自然语言对话 →           │
└─────────────────────┴────────────────────────────────┘
```

### 2.2 两种计算模式

| 模式 | 如何操作 | 处理方式 |
|------|----------|----------|
| **按钮计算** | 点击数字/运算符按钮 | 前端 JavaScript 本地计算，不联网 |
| **AI 计算** | 右侧对话框输入自然语言 | 发送到 DeepSeek 云端大模型处理 |

---

## 3. 环境准备

### 3.1 必须安装的软件

| 软件 | 版本要求 | 下载地址 | 作用 |
|------|----------|----------|------|
| **Node.js** | ≥ 22.x LTS | https://nodejs.org | 运行 TypeScript、打包扩展 |
| **VS Code** | ≥ 1.96 | https://code.visualstudio.com | 扩展运行的宿主 |
| **Git Bash** | 任意版本 | https://git-scm.com | Windows 下的命令行（可选） |

### 3.2 验证安装

打开终端（CMD / PowerShell / Git Bash），依次运行：

```bash
# 检查 Node.js
node --version    # 应输出 v22.x.x 或 v24.x.x

# 检查 npm
npm --version     # 应输出 11.x.x

# 检查 VS Code
code --version    # 应输出版本号
```

### 3.3 获取 DeepSeek API Key

1. 访问 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册/登录账号
3. 进入「API Keys」页面，点击「创建 API Key」
4. 复制保存（格式：`sk-xxxxxxxxxxxxxxxx`）

> 💡 **如果你是同组同学**：可以从已有的 `~/.claude/settings.json` 文件中读取 API Key，无需重新申请。详见[第 7 章](#7-接入大模型详解)。

---

## 4. 项目结构

```
calculator-ai/
│
├── 📄 package.json              # 扩展的"身份证"：名称、版本、依赖
├── 📄 tsconfig.json             # TypeScript 编译配置
├── 📄 .vscodeignore             # 打包时忽略哪些文件
├── 📄 .gitignore                # Git 忽略规则
│
├── 📁 .vscode/
│   ├── launch.json              # F5 调试启动配置
│   └── tasks.json               # 编译任务配置
│
├── 📁 src/                      # ← TypeScript 源代码（核心逻辑）
│   ├── extension.ts             #    扩展入口：注册命令、管理 Webview
│   └── deepseekClient.ts        #    DeepSeek API 客户端：发 HTTP 请求
│
├── 📁 webview/                  # ← 前端界面（HTML/CSS/JS）
│   ├── calculator.css           #    暗色主题样式
│   └── calculator.js            #    计算器逻辑 + AI 对话
│
├── 📁 out/                      # ← 编译产物（tsc 自动生成）
│   ├── extension.js
│   └── deepseekClient.js
│
└── 📦 calculator-ai-1.0.0.vsix # ← 打包好的扩展安装包
```

### 4.1 核心文件职责

| 文件 | 行数 | 核心职责 |
|------|------|----------|
| `src/extension.ts` | ~100 | ① 注册命令 `calculator-ai.open` ② 创建 Webview Panel ③ 消息中转（Webview ↔ API） |
| `src/deepseekClient.ts` | ~200 | ① 多源获取 API Key ② 构造 HTTP 请求 ③ 解析 AI 返回内容 |
| `webview/calculator.js` | ~220 | ① 计算器按钮逻辑 ② 键盘输入处理 ③ AI 对话收发 |
| `webview/calculator.css` | ~300 | ① 暗色主题 ② 按钮网格布局 ③ 聊天气泡动画 |

---

## 5. 架构设计

### 5.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    你的电脑                              │
│                                                         │
│  ┌──────────┐     postMessage      ┌────────────────┐   │
│  │ extension │◄──────────────────►│   Webview      │   │
│  │   .ts    │                      │  (HTML/CSS/JS) │   │
│  │          │                      │                │   │
│  │ ① 注册   │                      │ 按钮计算 → 本地 │   │
│  │   命令   │                      │ 自然语言 → 远程 │   │
│  │          │                      │                │   │
│  │ ② 创建   │                      │ ┌────────────┐ │   │
│  │   Webview│                      │ │ 计算器面板  │ │   │
│  │          │                      │ │            │ │   │
│  │ ③ 中转   │                      │ │ [1][2][3]  │ │   │
│  │   消息   │                      │ │ [+] [-]    │ │   │
│  │          │                      │ │ ...        │ │   │
│  │          │                      │ └────────────┘ │   │
│  │          │                      │ ┌────────────┐ │   │
│  │          │                      │ │ AI 对话区   │ │   │
│  │          │                      │ │ 💬 → 🤖    │ │   │
│  │          │                      │ └────────────┘ │   │
│  └────┬─────┘                      └────────────────┘   │
│       │                                                 │
│       │ HTTP POST /anthropic/messages                   │
│       │ { model: "deepseek-v4-pro", messages: [...] }   │
│       ▼                                                 │
└─────────────────────────────────────────────────────────┘
        │
        │  互联网
        ▼
┌───────────────────┐
│  api.deepseek.com │
│  (DeepSeek 云端)  │
│                   │
│  大模型处理        │
│  返回文本结果      │
└───────────────────┘
```

### 5.2 数据流（以自然语言计算为例）

```
用户输入 "156×23+789"
        │
        ▼
┌─ Webview (calculator.js) ──────────────────────────┐
│  1. 监听输入框回车事件                               │
│  2. 显示用户消息气泡                                 │
│  3. vscode.postMessage({ command: 'calculate',       │
│        query: '156×23+789' })                       │
└────────────────────┬────────────────────────────────┘
                     │ postMessage
                     ▼
┌─ Extension (extension.ts) ─────────────────────────┐
│  4. webview.onDidReceiveMessage 收到消息             │
│  5. 调用 deepseekClient.calculate(query)            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─ DeepSeekClient (deepseekClient.ts) ───────────────┐
│  6. 初始化 API Key（自动读取配置）                    │
│  7. fetch('https://api.deepseek.com/anthropic/      │
│           messages', { body: JSON.stringify(...) })  │
└────────────────────┬────────────────────────────────┘
                     │ HTTP POST
                     ▼
┌─ DeepSeek 云端 ────────────────────────────────────┐
│  8. 模型推理                                         │
│  9. 返回: { content: [{ type: 'text',                │
│        text: '1. 156×23=3588\n2. ...' }] }          │
└────────────────────┬────────────────────────────────┘
                     │ 响应 JSON
                     ▼
┌─ DeepSeekClient ───────────────────────────────────┐
│  10. 解析响应，过滤 thinking 块，提取纯文本           │
│  11. 分离「计算步骤」和「最终结果」                    │
│  12. 返回 { steps: '...', result: '...' }          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─ Extension ────────────────────────────────────────┐
│  13. webview.postMessage({ command: 'aiResponse',   │
│        result, steps })                             │
└────────────────────┬────────────────────────────────┘
                     │ postMessage
                     ▼
┌─ Webview ──────────────────────────────────────────┐
│  14. 收到 aiResponse 消息                            │
│  15. 渲染 AI 回复气泡（步骤 + 高亮结果）              │
│  16. 恢复发送按钮状态                                │
└────────────────────────────────────────────────────┘
```

### 5.3 关键技术决策

| 决策 | 方案 | 原因 |
|------|------|------|
| HTTP 请求方式 | 原生 `fetch` | 不依赖第三方 SDK，代码可控，兼容性强 |
| API 兼容协议 | Anthropic Messages API | DeepSeek 提供 `/anthropic` 兼容端点 |
| UI 框架 | 原生 HTML/CSS/JS | 轻量，无框架依赖，加载快 |
| API Key 存储 | VS Code SecretStorage | 安全加密存储，不暴露在代码中 |
| API Key 自动获取 | 读 `~/.claude/settings.json` | 复用已有配置，用户免输入 |

---

## 6. 从零搭建教程

> 📸 **图片说明**：受限于文档格式，本文使用 ASCII 示意图替代截图。实际操作中每个关键步骤都有关键界面可对照。

### 步骤 1：安装 Node.js

访问 https://nodejs.org → 下载 LTS 版本 → 双击安装 → 一路 Next

验证：
```bash
node --version   # → v24.x.x
npm --version    # → 11.x.x
```

<details>
<summary>🖼️ 示意图：Node.js 安装界面</summary>

```
┌──────────────────────────────────────┐
│         Node.js Setup                │
│                                      │
│   Welcome to the Node.js             │
│   Setup Wizard.                      │
│                                      │
│   Version: 24.18.0 LTS               │
│                                      │
│   [✓] I accept the license           │
│                                      │
│         [ Next >]  [ Cancel ]        │
└──────────────────────────────────────┘
```
点击 Next → Install → Finish 即可
</details>

### 步骤 2：创建项目文件夹

```bash
# 在桌面创建项目
mkdir ~/Desktop/calculator-ai
cd ~/Desktop/calculator-ai

# 创建子目录
mkdir src webview .vscode media
```

### 步骤 3：初始化 npm 项目

创建 `package.json`（这是扩展的配置文件）：

```json
{
  "name": "calculator-ai",
  "displayName": "Calculator AI",
  "description": "智能计算器 - VS Code 接入 DeepSeek 大模型",
  "version": "1.0.0",
  "engines": { "vscode": "^1.96.0" },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [{
      "command": "calculator-ai.open",
      "title": "Calculator AI: Open Calculator"
    }]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/node": "^26.1.0",
    "@types/vscode": "^1.96.0",
    "typescript": "^5.5.0"
  },
  "dependencies": {}
}
```

> **关键字段解释**：
> - `"main": "./out/extension.js"` — 扩展入口文件（编译后）
> - `"contributes.commands"` — 注册的命令，用户按 `Ctrl+Shift+P` 可以搜到
> - `"engines.vscode"` — 要求 VS Code 最低版本

### 步骤 4：配置 TypeScript

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "outDir": "out",
    "lib": ["ES2022"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 步骤 5：安装依赖

```bash
npm install
```

这会安装 `typescript` 和 `@types/vscode`，它们让你能调用 VS Code 的 API。

### 步骤 6：编写扩展入口 — `src/extension.ts`

这是扩展的"大脑"，负责：

1. **`activate()`** — 扩展被激活时调用
2. **注册命令** — 告诉 VS Code "Calculator AI: Open Calculator" 这个命令执行什么
3. **创建 Webview** — 打开计算器面板
4. **消息中转** — 接收 UI 发来的计算请求，转发给 DeepSeek，把结果传回去

<details>
<summary>📝 完整代码（点击展开）</summary>

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { DeepSeekClient } from './deepseekClient';

export function activate(context: vscode.ExtensionContext) {
    const deepseekClient = new DeepSeekClient();
    deepseekClient.setContext(context);

    // 注册命令
    const openCalculator = vscode.commands.registerCommand('calculator-ai.open', () => {
        // 创建 Webview 面板
        const panel = vscode.window.createWebviewPanel(
            'calculatorAI',
            'Calculator AI',
            vscode.ViewColumn.Two,  // 在第二列打开
            {
                enableScripts: true,          // 允许运行 JS
                retainContextWhenHidden: true // 切走不销毁
            }
        );

        // 设置 HTML 内容（内联生成，包含 CSS/JS 引用）
        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);

        // 处理来自 UI 的消息
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'calculate':
                    const response = await deepseekClient.calculate(message.query);
                    panel.webview.postMessage({
                        command: 'aiResponse',
                        result: response.result,
                        steps: response.steps
                    });
                    break;
            }
        });
    });

    context.subscriptions.push(openCalculator);
}
```

</details>

### 步骤 7：编写 API 客户端 — `src/deepseekClient.ts`

这是连接大模型的核心，负责：

1. **获取 API Key** — 自动从 Claude Code 配置 / 环境变量 / 用户输入 获取
2. **构造 HTTP 请求** — 对标 Anthropic Messages API 格式
3. **发送请求** — 用原生 `fetch` 发到 `api.deepseek.com`
4. **解析响应** — 过滤 thinking 块，提取纯文本

<details>
<summary>📝 核心代码（点击展开）</summary>

```typescript
// 发送计算请求
async calculate(query: string): Promise<{ result: string; steps: string }> {
    // 1. 确保有 API Key
    await this.initialize();

    // 2. 发送 HTTP POST 请求
    const response = await fetch('https://api.deepseek.com/anthropic/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey!,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'deepseek-v4-pro',
            max_tokens: 1024,
            system: '你是一个数学计算助手...',
            messages: [{ role: 'user', content: query }]
        })
    });

    // 3. 解析响应
    const data = await response.json();

    // 4. 只取 text 类型的块（跳过 thinking 推理块）
    const textBlocks = data.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');

    // 5. 分离步骤和结果
    const stepsEnd = textBlocks.lastIndexOf('结果：');
    // ...
}
```

</details>

### 步骤 8：编写前端界面

#### `webview/calculator.css` — 暗色主题样式

关键设计点：
- CSS 变量定义颜色系统（`--bg-primary: #1e1e1e` 等）
- 按钮用 CSS Grid 布局：`grid-template-columns: repeat(4, 1fr)`
- 聊天气泡用 flexbox + border-radius 实现
- 思考动画用 `@keyframes bounce`

#### `webview/calculator.js` — 计算器逻辑 + AI 对话

关键逻辑：

```javascript
// 计算器状态管理
const calculatorState = {
    currentInput: '0',
    previousInput: '',
    operator: null,
    shouldResetInput: false,
};

// 按钮点击 → 本地计算
function performEquals() {
    const result = calculate(prev, current, operator);
    calculatorState.currentInput = formatResult(result);
}

// 自然语言输入 → 发到扩展 → 调 DeepSeek
function sendAIQuery() {
    vscode.postMessage({ command: 'calculate', query: inputText });
}

// 接收 AI 回复 → 渲染聊天气泡
window.addEventListener('message', (event) => {
    if (event.data.command === 'aiResponse') {
        addAIResponse(event.data.result, event.data.steps);
    }
});
```

### 步骤 9：编译

```bash
npx tsc -p ./
```

TypeScript → JavaScript，输出到 `out/` 目录。

### 步骤 10：打包安装

```bash
# 安装打包工具（只需一次）
npm install -g @vscode/vsce

# 打包成 .vsix
npx @vscode/vsce package --allow-missing-repository

# 安装到 VS Code
code --install-extension calculator-ai-1.0.0.vsix --force
```

### 步骤 11：使用

1. 打开 VS Code（普通窗口即可）
2. `Ctrl+Shift+P` → 输入 `Calculator AI` → 回车
3. 面板打开，左边按钮计算，右边 AI 对话

---

## 7. 接入大模型详解

### 7.1 为什么选择 DeepSeek？

| 对比维度 | DeepSeek | OpenAI | 本地模型 (Ollama) |
|----------|----------|--------|-------------------|
| 部署难度 | 无需部署，纯 API 调用 | 无需部署 | 需下载模型（几GB） |
| 费用 | 便宜 | 较贵 | 免费 |
| 中文能力 | 强 | 中 | 看模型 |
| API 兼容 | 兼容 Anthropic 协议 | 自有协议 | 兼容 OpenAI 协议 |
| 速度 | 快 | 快 | 取决于电脑配置 |

### 7.2 DeepSeek API 协议说明

DeepSeek 提供了 **Anthropic Messages API 兼容端点**：

```
POST https://api.deepseek.com/anthropic/messages
```

请求头：
```
Content-Type: application/json
x-api-key: sk-你的API密钥
anthropic-version: 2023-06-01
```

请求体（JSON）：
```json
{
  "model": "deepseek-v4-pro",
  "max_tokens": 1024,
  "system": "你是一个数学计算助手...",
  "messages": [
    { "role": "user", "content": "156乘以23再加789" }
  ]
}
```

响应体（JSON）：
```json
{
  "id": "msg_xxx",
  "model": "deepseek-v4-pro",
  "content": [
    {
      "type": "thinking",     // ← 推理过程（我们过滤掉）
      "thinking": "..."
    },
    {
      "type": "text",         // ← 真正的回复（我们取这个）
      "text": "1. 先算 156 × 23 = 3588\n2. 再算 3588 + 789 = 4377\n\n结果：4377"
    }
  ]
}
```

### 7.3 API Key 获取优先级

扩展按以下顺序查找 API Key：

```
① VS Code SecretStorage  ← 用户之前手动输入的
② 环境变量 DEEPSEEK_API_KEY
③ 环境变量 ANTHROPIC_AUTH_TOKEN
④ ~/.claude/settings.json → env.ANTHROPIC_AUTH_TOKEN  ← 复用 Claude Code 配置
⑤ 弹出输入框让用户输入
```

### 7.4 思考块（thinking blocks）处理

DeepSeek V4 Pro 是推理模型，返回时会包含 `type: "thinking"` 的块。这些是模型的内部推理过程，对用户没有意义且显示为乱码。

我们的处理方式：
```typescript
// 只取 text 类型，跳过 thinking
const textBlocks = data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');
```

---

## 8. 部署到其他电脑

### 8.1 方法一：安装 .vsix 文件（推荐，最简单）

这是最简单的方式，对方不需要装任何开发工具：

```
1. 把 calculator-ai-1.0.0.vsix 发给对方
2. 对方打开 VS Code
3. 按 Ctrl+Shift+P → 输入 "Install from VSIX"
4. 选择 .vsix 文件 → 确定
5. Ctrl+Shift+P → Calculator AI: Open Calculator
```

<details>
<summary>🖼️ 示意图：安装 VSIX</summary>

```
┌─────────────────────────────────────────────┐
│  VS Code                                     │
│                                              │
│  Ctrl+Shift+P 后输入:                        │
│  ┌─────────────────────────────────────┐     │
│  │ > Extensions: Install from VSIX...  │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  然后选择 calculator-ai-1.0.0.vsix 文件       │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │ ✅ 扩展安装成功！                    │     │
│  └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```
</details>

> ⚠️ 对方需要有自己的 DeepSeek API Key。如果没有，首次使用时会弹出输入框。

### 8.2 方法二：从源码构建

```bash
# 1. 安装 Node.js
# 访问 https://nodejs.org 下载安装

# 2. 打开终端，进入项目目录
cd calculator-ai

# 3. 安装依赖
npm install

# 4. 编译
npx tsc -p ./

# 5. 打包
npm install -g @vscode/vsce
npx @vscode/vsce package --allow-missing-repository

# 6. 安装
code --install-extension calculator-ai-1.0.0.vsix --force
```

### 8.3 Windows / Mac / Linux 通用

项目完全跨平台：
- **Windows**：推荐 Git Bash 或 PowerShell
- **macOS**：直接用终端
- **Linux**：直接用终端

唯一的区别是 VS Code 命令行工具的名称：
- Windows/macOS: `code`
- Linux: `code` 或 `code-oss`

---

## 9. 使用指南

### 9.1 打开计算器

```
Ctrl+Shift+P → 输入 Calculator AI → 回车
```

### 9.2 按钮计算（本地）

| 操作 | 方式 |
|------|------|
| 输入数字 | 点击按钮 或 键盘按数字键 |
| 运算符 | 点击 + - × ÷ 或键盘按 + - * / |
| 计算 | 点击 = 或按 Enter |
| 清除 | 点击 C 或按 Esc |
| 退格 | 点击 ⌫ 或按 Backspace |
| 百分比 | 点击 % 或按 % |

### 9.3 AI 计算（远程）

在右侧对话框输入自然语言，例如：

| 输入 | AI 会做什么 |
|------|-----------|
| `156 乘以 23 再加 789` | 提取数学表达式并分步计算 |
| `100 的 20% 是多少` | 百分比计算 |
| `根号 144 等于多少` | 平方根 |
| `2 的 10 次方` | 幂运算 |
| `把 1000 元按 3:5:2 分配` | 比例分配 |
| `15% 的消费税，原价 200 的东西总价多少` | 复合计算 |

### 9.4 清空对话

点击对话区右上角的「清空对话」按钮。

---

## 10. 常见问题

### Q1：打开后 AI 不能用，显示"API 请求失败"

**原因**：API Key 不正确或网络问题

**解决**：
1. 检查是否能访问 https://api.deepseek.com（不要翻墙，直连即可）
2. 检查 API Key 是否有效，在 https://platform.deepseek.com 查看余额
3. 手动输入 Key：`Ctrl+Shift+P` → 搜 `Calculator AI` 重新打开，会弹出输入框

### Q2：AI 回复显示乱码

**原因**：旧版本没有过滤 thinking 推理块

**解决**：确保使用的是最新版（`deepseekClient.ts` 中有 `.filter(b => b.type === 'text')` 逻辑）

### Q3：按钮能算，AI 不能算

**原因**：AI 功能走的是远程 API，需要网络 + API Key

**解决**：检查网络 + 验证 API Key 可用

### Q4：如何在别人电脑上部署？

**解决**：见[第 8 章](#8-部署到其他电脑)，把 `.vsix` 文件发过去安装即可。

### Q5：TypeScript 编译报错

**原因**：可能没装依赖

**解决**：
```bash
npm install
npx tsc -p ./
```

### Q6：VS Code 里 `code` 命令找不到

**解决**：
- Windows：VS Code 安装时会自动加 PATH。如果没有，手动加 `C:\Program Files\Microsoft VS Code\bin`
- Mac：打开 VS Code → `Cmd+Shift+P` → `Shell Command: Install 'code' command in PATH`

---

## 📎 附录

### A. 技术栈一览

| 层级 | 技术 | 用途 |
|------|------|------|
| 扩展框架 | VS Code Extension API | 注册命令、管理面板 |
| 后端语言 | TypeScript | 类型安全的 JavaScript |
| 前端 UI | HTML + CSS + JavaScript | Webview 界面 |
| HTTP 请求 | 原生 `fetch` (Node.js 24) | 调用 DeepSeek API |
| API 协议 | Anthropic Messages API 兼容 | 大模型交互 |
| 包管理 | npm | 依赖管理 |
| 打包 | @vscode/vsce | 生成 .vsix 安装包 |
| 安全存储 | VS Code SecretStorage | 加密存储 API Key |

### B. 关键概念速查

| 概念 | 一句话解释 |
|------|-----------|
| **Extension** | VS Code 的插件，TypeScript 写的 |
| **Webview** | VS Code 内嵌的网页，可以运行 HTML/CSS/JS |
| **postMessage** | Webview 和 Extension 之间的通信机制 |
| **Activation Event** | 什么时候激活扩展（如执行某命令时） |
| **Contribution** | 扩展向 VS Code 注册了什么（命令、菜单等） |
| **VSIX** | VS Code 扩展的安装包格式 |
| **Anthropic API** | Anthropic 公司定义的 LLM 调用协议 |

### C. 参考资料

- [VS Code Extension API 官方文档](https://code.visualstudio.com/api)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs)
- [Anthropic Messages API 规范](https://docs.anthropic.com/en/api/messages)
- [Node.js 官方文档](https://nodejs.org/docs/latest)

---

> 📅 最后更新：2026-07-02
>
> 👨‍💻 本项目为课程作业，免费开源使用
