import * as vscode from 'vscode';
import * as path from 'path';
import { DeepSeekClient } from './deepseekClient';

/**
 * Calculator AI 扩展入口
 * 注册命令并管理 Webview 面板
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Calculator AI extension activated');

    const deepseekClient = new DeepSeekClient();
    deepseekClient.setContext(context);

    const openCalculator = vscode.commands.registerCommand('calculator-ai.open', () => {
        // 检查是否已有打开的 Calculator 面板
        const existingPanel = vscode.window.activeTextEditor;

        // 创建新的 Webview 面板
        const panel = vscode.window.createWebviewPanel(
            'calculatorAI',
            'Calculator AI',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'webview'))
                ]
            }
        );

        // 设置 Webview HTML 内容
        panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);

        // 处理来自 Webview 的消息
        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'calculate':
                        // 自然语言计算请求 → 调用 DeepSeek
                        const response = await deepseekClient.calculate(message.query);
                        panel.webview.postMessage({
                            command: 'aiResponse',
                            query: message.query,
                            result: response.result,
                            steps: response.steps
                        });
                        break;

                    case 'getApiStatus':
                        // 返回 API 配置状态
                        const initialized = await deepseekClient.initialize();
                        panel.webview.postMessage({
                            command: 'apiStatus',
                            ready: initialized
                        });
                        break;

                    case 'resetApiKey':
                        // 重置 API Key
                        await deepseekClient.resetApiKey();
                        panel.webview.postMessage({
                            command: 'apiStatus',
                            ready: false,
                            message: 'API Key 已清除，请重新输入'
                        });
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(openCalculator);
}

export function deactivate() {}

/**
 * 生成 Webview HTML 内容
 */
function getWebviewContent(webview: vscode.Webview, extensionPath: string): string {
    const htmlPath = path.join(extensionPath, 'webview', 'calculator.html');
    const cssPath = path.join(extensionPath, 'webview', 'calculator.css');
    const jsPath = path.join(extensionPath, 'webview', 'calculator.js');

    const htmlUri = webview.asWebviewUri(vscode.Uri.file(htmlPath));
    const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
    const jsUri = webview.asWebviewUri(vscode.Uri.file(jsPath));

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   style-src ${webview.cspSource} 'unsafe-inline';
                   script-src ${webview.cspSource} 'unsafe-inline';
                   img-src ${webview.cspSource} data:;">
    <link rel="stylesheet" href="${cssUri}">
    <title>Calculator AI</title>
</head>
<body>
    <div id="app">
        <!-- 计算器主体 -->
        <div class="calculator-container">
            <!-- 显示区 -->
            <div class="display">
                <div class="display-expression" id="expression"></div>
                <div class="display-result" id="result">0</div>
            </div>

            <!-- 按钮区 -->
            <div class="buttons">
                <button class="btn btn-function" data-action="clear">C</button>
                <button class="btn btn-function" data-action="backspace">⌫</button>
                <button class="btn btn-function" data-action="percent">%</button>
                <button class="btn btn-operator" data-action="operator" data-value="/">÷</button>

                <button class="btn btn-number" data-action="number" data-value="7">7</button>
                <button class="btn btn-number" data-action="number" data-value="8">8</button>
                <button class="btn btn-number" data-action="number" data-value="9">9</button>
                <button class="btn btn-operator" data-action="operator" data-value="*">×</button>

                <button class="btn btn-number" data-action="number" data-value="4">4</button>
                <button class="btn btn-number" data-action="number" data-value="5">5</button>
                <button class="btn btn-number" data-action="number" data-value="6">6</button>
                <button class="btn btn-operator" data-action="operator" data-value="-">−</button>

                <button class="btn btn-number" data-action="number" data-value="1">1</button>
                <button class="btn btn-number" data-action="number" data-value="2">2</button>
                <button class="btn btn-number" data-action="number" data-value="3">3</button>
                <button class="btn btn-operator" data-action="operator" data-value="+">+</button>

                <button class="btn btn-number btn-zero" data-action="number" data-value="0">0</button>
                <button class="btn btn-number" data-action="decimal" data-value=".">.</button>
                <button class="btn btn-equals" data-action="equals">=</button>
            </div>
        </div>

        <!-- AI 对话区 -->
        <div class="ai-panel">
            <div class="ai-header">
                <span class="ai-title">🤖 AI 助手 (DeepSeek)</span>
                <button class="ai-clear-btn" id="clearChat">清空对话</button>
            </div>
            <div class="ai-chat" id="aiChat">
                <div class="chat-message ai-message">
                    <div class="chat-bubble">
                        你好！我是 AI 计算助手。<br>
                        你可以用自然语言问我计算问题，例如：<br>
                        • "156 乘以 23 再加 789"<br>
                        • "100 的 20% 是多少"<br>
                        • "根号 144 等于多少"
                    </div>
                </div>
            </div>
            <div class="ai-input-area">
                <input type="text"
                       id="aiInput"
                       class="ai-input"
                       placeholder="输入计算问题，如：100 除以 3 等于多少？"
                       autocomplete="off">
                <button class="ai-send-btn" id="aiSend">发送</button>
            </div>
        </div>
    </div>
    <script src="${jsUri}"></script>
</body>
</html>`;
}
