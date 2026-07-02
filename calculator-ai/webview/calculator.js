// ============================================
// Calculator AI - Webview Logic
// 标准计算器 + AI 对话
// ============================================

// 获取 VS Code API
const vscode = acquireVsCodeApi();

// ===== 计算器状态 =====
const calculatorState = {
    currentInput: '0',
    previousInput: '',
    operator: null,
    shouldResetInput: false,
    expression: ''
};

// ===== 计算器逻辑 =====
function updateDisplay() {
    document.getElementById('expression').textContent =
        calculatorState.expression || '';
    document.getElementById('result').textContent =
        calculatorState.currentInput;
}

function clearCalculator() {
    calculatorState.currentInput = '0';
    calculatorState.previousInput = '';
    calculatorState.operator = null;
    calculatorState.shouldResetInput = false;
    calculatorState.expression = '';
    updateDisplay();
}

function backspace() {
    if (calculatorState.shouldResetInput) return;
    if (calculatorState.currentInput.length > 1) {
        calculatorState.currentInput = calculatorState.currentInput.slice(0, -1);
    } else {
        calculatorState.currentInput = '0';
    }
    updateDisplay();
}

function appendNumber(num) {
    if (calculatorState.shouldResetInput) {
        calculatorState.currentInput = num;
        calculatorState.shouldResetInput = false;
    } else {
        if (calculatorState.currentInput === '0' && num !== '0') {
            calculatorState.currentInput = num;
        } else if (calculatorState.currentInput === '0' && num === '0') {
            // 不允许连续输入 0
        } else {
            calculatorState.currentInput += num;
        }
    }
    // 限制长度
    if (calculatorState.currentInput.length > 15) {
        calculatorState.currentInput = calculatorState.currentInput.slice(0, 15);
    }
    updateDisplay();
}

function appendDecimal() {
    if (calculatorState.shouldResetInput) {
        calculatorState.currentInput = '0.';
        calculatorState.shouldResetInput = false;
        updateDisplay();
        return;
    }
    if (!calculatorState.currentInput.includes('.')) {
        calculatorState.currentInput += '.';
    }
    updateDisplay();
}

function handlePercent() {
    const value = parseFloat(calculatorState.currentInput);
    if (!isNaN(value)) {
        calculatorState.currentInput = (value / 100).toString();
    }
    updateDisplay();
}

function setOperator(op) {
    const current = parseFloat(calculatorState.currentInput);

    if (calculatorState.operator && !calculatorState.shouldResetInput) {
        // 连续运算
        const prev = parseFloat(calculatorState.previousInput);
        const result = calculate(prev, current, calculatorState.operator);
        calculatorState.currentInput = formatResult(result);
        calculatorState.previousInput = calculatorState.currentInput;
    } else {
        calculatorState.previousInput = calculatorState.currentInput;
    }

    calculatorState.operator = op;
    calculatorState.shouldResetInput = true;

    // 更新表达式
    const opSymbol = getOperatorSymbol(op);
    calculatorState.expression = `${calculatorState.previousInput} ${opSymbol}`;
    updateDisplay();
}

function performEquals() {
    if (!calculatorState.operator) return;

    const prev = parseFloat(calculatorState.previousInput);
    const current = parseFloat(calculatorState.currentInput);

    const result = calculate(prev, current, calculatorState.operator);

    // 构建完整表达式
    const opSymbol = getOperatorSymbol(calculatorState.operator);
    calculatorState.expression = `${calculatorState.previousInput} ${opSymbol} ${calculatorState.currentInput} =`;

    calculatorState.currentInput = formatResult(result);
    calculatorState.previousInput = '';
    calculatorState.operator = null;
    calculatorState.shouldResetInput = true;
    updateDisplay();
}

function calculate(a, b, op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            if (b === 0) return 'Error';
            return a / b;
        default: return b;
    }
}

function formatResult(value) {
    if (value === 'Error') return 'Error';
    if (typeof value === 'string') return value;
    // 处理浮点数精度
    const fixed = parseFloat(value.toPrecision(12));
    // 如果超出显示范围，使用科学计数法
    if (Math.abs(fixed) > 999999999999999) {
        return fixed.toExponential(6);
    }
    return fixed.toString();
}

function getOperatorSymbol(op) {
    switch (op) {
        case '+': return '+';
        case '-': return '−';
        case '*': return '×';
        case '/': return '÷';
        default: return op;
    }
}

// ===== 按钮事件绑定 =====
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;

        switch (action) {
            case 'number':
                appendNumber(button.dataset.value);
                break;
            case 'decimal':
                appendDecimal();
                break;
            case 'operator':
                setOperator(button.dataset.value);
                break;
            case 'equals':
                performEquals();
                break;
            case 'clear':
                clearCalculator();
                break;
            case 'backspace':
                backspace();
                break;
            case 'percent':
                handlePercent();
                break;
        }
    });
});

// ===== 键盘支持 =====
document.addEventListener('keydown', (e) => {
    // 如果焦点在输入框，不处理计算器按键
    if (document.activeElement === aiInput) return;

    const key = e.key;
    if (key >= '0' && key <= '9') {
        appendNumber(key);
    } else if (key === '.') {
        appendDecimal();
    } else if (key === '+') {
        setOperator('+');
    } else if (key === '-') {
        setOperator('-');
    } else if (key === '*') {
        setOperator('*');
    } else if (key === '/') {
        e.preventDefault();
        setOperator('/');
    } else if (key === 'Enter' || key === '=') {
        performEquals();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearCalculator();
    } else if (key === 'Backspace') {
        backspace();
    } else if (key === '%') {
        handlePercent();
    }
});

// ===== AI 对话逻辑 =====
const aiChat = document.getElementById('aiChat');
const aiInput = document.getElementById('aiInput');
const aiSend = document.getElementById('aiSend');
const clearChatBtn = document.getElementById('clearChat');

// 添加消息到聊天区
function addChatMessage(role, text, query) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;

    if (role === 'user') {
        const label = document.createElement('div');
        label.className = 'chat-label';
        label.textContent = '你';
        messageDiv.appendChild(label);
    }

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    messageDiv.appendChild(bubble);

    aiChat.appendChild(messageDiv);
    aiChat.scrollTop = aiChat.scrollHeight;
}

// 添加 AI 回复（结构化：步骤 + 结果）
function addAIResponse(query, result, steps) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ai-message';

    const label = document.createElement('div');
    label.className = 'chat-label';
    label.textContent = '🤖 AI';
    messageDiv.appendChild(label);

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    if (steps && steps.trim()) {
        bubble.innerHTML = `${escapeHtml(steps)}<br><br><span class="result-highlight">${escapeHtml(result)}</span>`;
    } else {
        bubble.innerHTML = `<span class="result-highlight">${escapeHtml(result)}</span>`;
    }

    messageDiv.appendChild(bubble);
    aiChat.appendChild(messageDiv);
    aiChat.scrollTop = aiChat.scrollHeight;
}

// 显示 AI 正在思考
function showTyping() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ai-message';
    messageDiv.id = 'typingIndicator';

    const label = document.createElement('div');
    label.className = 'chat-label';
    label.textContent = '🤖 AI';
    messageDiv.appendChild(label);

    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';

    messageDiv.appendChild(typing);
    aiChat.appendChild(messageDiv);
    aiChat.scrollTop = aiChat.scrollHeight;
}

function hideTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 发送 AI 计算请求
async function sendAIQuery() {
    const query = aiInput.value.trim();
    if (!query) return;

    // 显示用户消息
    addChatMessage('user', query);

    // 清空输入框
    aiInput.value = '';

    // 禁用发送按钮
    aiSend.disabled = true;
    aiSend.textContent = '思考中...';
    aiSend.classList.add('loading');

    // 显示思考动画
    showTyping();

    // 发送到 VS Code 扩展 → DeepSeek API
    vscode.postMessage({
        command: 'calculate',
        query: query
    });
}

// 发送按钮点击
aiSend.addEventListener('click', sendAIQuery);

// 回车发送
aiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAIQuery();
    }
});

// 清空对话
clearChatBtn.addEventListener('click', () => {
    // 保留欢迎消息
    const welcomeMsg = aiChat.querySelector('.ai-message:first-child');
    aiChat.innerHTML = '';
    if (welcomeMsg) {
        aiChat.appendChild(welcomeMsg);
    } else {
        // 重新添加欢迎消息
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai-message';
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerHTML = '你好！我是 AI 计算助手。<br>你可以用自然语言问我计算问题。';
        messageDiv.appendChild(bubble);
        aiChat.appendChild(messageDiv);
    }
});

// ===== 接收来自扩展的消息 =====
window.addEventListener('message', (event) => {
    const message = event.data;

    switch (message.command) {
        case 'aiResponse':
            hideTyping();
            addAIResponse(message.query, message.result, message.steps);

            // 恢复发送按钮
            aiSend.disabled = false;
            aiSend.textContent = '发送';
            aiSend.classList.remove('loading');

            // 尝试将结果填入计算器显示
            const numMatch = message.result.match(/([\d.e+\-]+)/);
            if (numMatch && calculatorState.shouldResetInput === undefined) {
                // 不自动覆盖计算器当前输入
            }
            break;

        case 'apiStatus':
            if (message.ready) {
                addChatMessage('ai', '✅ API 已就绪，可以开始计算！');
            } else if (message.message) {
                addChatMessage('ai', '⚠️ ' + message.message);
            }
            break;
    }
});

// ===== 初始状态 =====
updateDisplay();

// 启动时检查 API 状态
vscode.postMessage({ command: 'getApiStatus' });

// 自动聚焦输入框
aiInput.focus();
