import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/anthropic';
const DEEPSEEK_MODEL = 'deepseek-v4-pro';
const SECRET_KEY = 'calculator-ai.deepseekApiKey';

/**
 * DeepSeek API 客户端 —— 直接 HTTP 请求，不依赖 SDK
 */
export class DeepSeekClient {
    private apiKey: string | undefined;
    private context: vscode.ExtensionContext | null = null;

    setContext(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * 初始化：自动获取 API Key
     */
    async initialize(): Promise<boolean> {
        if (this.apiKey) return true;

        this.apiKey = await this.getApiKey();

        if (!this.apiKey) {
            this.apiKey = await vscode.window.showInputBox({
                prompt: '请输入 DeepSeek API Key',
                placeHolder: 'sk-...',
                password: true,
                ignoreFocusOut: true
            });

            if (!this.apiKey) {
                vscode.window.showErrorMessage('需要 API Key 才能使用 AI 计算功能');
                return false;
            }

            await this.storeApiKey(this.apiKey);
        }

        return true;
    }

    async resetApiKey(): Promise<void> {
        if (this.context) {
            await this.context.secrets.delete(SECRET_KEY);
        }
        this.apiKey = undefined;
    }

    /**
     * 多渠道获取 API Key
     */
    private async getApiKey(): Promise<string | undefined> {
        // 1. SecretStorage
        if (this.context) {
            const stored = await this.context.secrets.get(SECRET_KEY);
            if (stored) return stored;
        }

        // 2. 环境变量
        const envKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
        if (envKey) {
            await this.storeApiKey(envKey);
            return envKey;
        }

        // 3. Claude Code 配置文件
        const claudeKey = this.readFromClaudeConfig();
        if (claudeKey) {
            await this.storeApiKey(claudeKey);
            return claudeKey;
        }

        return undefined;
    }

    private readFromClaudeConfig(): string | undefined {
        try {
            const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
            if (fs.existsSync(settingsPath)) {
                const raw = fs.readFileSync(settingsPath, 'utf-8');
                const settings = JSON.parse(raw);
                const token = settings?.env?.ANTHROPIC_AUTH_TOKEN;
                if (token && typeof token === 'string' && token.length > 0) {
                    console.log('Calculator AI: 已从 Claude Code 配置自动加载 API Key');
                    return token;
                }
            }
        } catch (e) {
            console.log('Calculator AI: 无法读取 Claude Code 配置', e);
        }
        return undefined;
    }

    private async storeApiKey(key: string): Promise<void> {
        if (this.context) {
            await this.context.secrets.store(SECRET_KEY, key);
        }
    }

    /**
     * 发送计算请求到 DeepSeek —— 直接用 fetch 请求
     */
    async calculate(query: string): Promise<{ result: string; steps: string }> {
        const initialized = await this.initialize();
        if (!initialized) {
            return { result: '错误', steps: 'API Key 未配置。' };
        }

        try {
            console.log('Calculator AI: 发送请求到 DeepSeek...');

            const response = await fetch(`${DEEPSEEK_BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey!,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: DEEPSEEK_MODEL,
                    max_tokens: 1024,
                    system: `你是一个数学计算助手。用户会用自然语言描述计算问题。
请按以下格式回复：
1. 先列出计算步骤（每步一行，用数字编号）
2. 最后给出最终结果，格式为 "结果：XXX"

注意：
- 如果用户输入的是简单算术表达式，直接计算
- 如果用户输入的是自然语言，先提取数学问题再计算
- 保持回复简洁清晰`,
                    messages: [
                        { role: 'user', content: query }
                    ]
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('DeepSeek API HTTP error:', response.status, errorBody);
                return {
                    result: '错误',
                    steps: `API 请求失败 (${response.status})：${errorBody.substring(0, 200)}`
                };
            }

            const data: any = await response.json();
            console.log('DeepSeek raw response:', JSON.stringify(data).substring(0, 300));

            // 提取文本内容 —— 只取 text 类型，过滤掉 thinking 等推理块
            const content = data?.content;
            let text = '';

            if (Array.isArray(content) && content.length > 0) {
                // 找到所有 text 类型的块，拼接起来（跳过 thinking 块）
                const textBlocks = content
                    .filter((b: any) => b?.type === 'text')
                    .map((b: any) => b?.text || '')
                    .filter(Boolean);

                text = textBlocks.join('\n');

                if (!text) {
                    // 如果没有 text 类型块，打印原始结构用于调试
                    console.error('No text blocks found. Content types:',
                        content.map((b: any) => b?.type).join(', '));
                    console.error('Raw blocks:', JSON.stringify(content).substring(0, 500));
                }
            } else if (typeof content === 'string') {
                text = content;
            } else if (data?.text) {
                text = data.text;
            } else if (data?.choices?.[0]?.message?.content) {
                // OpenAI 兼容格式
                text = data.choices[0].message.content;
            } else {
                text = JSON.stringify(data);
            }

            if (!text || text.trim().length === 0) {
                console.error('Empty text. Full response:', JSON.stringify(data));
                return { result: '错误', steps: 'AI 返回了空内容' };
            }

            console.log('Parsed text:', text.substring(0, 200));

            // 分离步骤和结果
            const stepsEnd = text.lastIndexOf('结果：');
            if (stepsEnd >= 0) {
                return {
                    steps: text.substring(0, stepsEnd).trim(),
                    result: text.substring(stepsEnd).trim()
                };
            }

            const lines = text.split('\n').filter(l => l.trim());
            const lastLine = lines[lines.length - 1] || '';
            const steps = lines.slice(0, -1).join('\n');

            return {
                steps: steps || text,
                result: lastLine || text
            };

        } catch (error: any) {
            console.error('DeepSeek API error:', error);
            return {
                result: '错误',
                steps: `API 调用异常：${error.message || '未知错误'}`
            };
        }
    }
}
