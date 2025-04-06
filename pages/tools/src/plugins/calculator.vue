<template>
  <div class="calculator-container">
    <sc-panel class="calculator-panel" title="科学计算器" theme="primary">
      <div class="calculator">
        <div class="display">
          <div class="expression">{{ expression || "0" }}</div>
          <div class="result">{{ result }}</div>
        </div>

        <div class="keyboard">
          <div class="function-keys">
            <el-button-group>
              <el-button @click="handleDegRad" :type="isDegree ? 'primary' : 'default'">DEG</el-button>
              <el-button @click="handleDegRad" :type="!isDegree ? 'primary' : 'default'">RAD</el-button>
            </el-button-group>

            <el-button-group>
              <el-button @click="toggleMode" :type="isScientific ? 'warning' : 'default'"> 科学 </el-button>
              <el-button @click="toggleMode" :type="!isScientific ? 'warning' : 'default'"> 标准 </el-button>
            </el-button-group>
          </div>

          <div class="history-toggle">
            <el-button @click="toggleHistory" :icon="historyVisible ? 'Close' : 'List'">
              {{ historyVisible ? "隐藏历史" : "显示历史" }}
            </el-button>
          </div>

          <div class="keys-container">
            <div class="main-keys">
              <div class="key-row">
                <el-button class="calc-key function" @click="clearAll">AC</el-button>
                <el-button class="calc-key function" @click="clearEntry">CE</el-button>
                <el-button class="calc-key function" @click="backspace">⌫</el-button>
                <el-button class="calc-key operator" @click="appendOperator('/')" title="除法">÷</el-button>
              </div>

              <div class="key-row">
                <el-button class="calc-key number" @click="appendDigit('7')">7</el-button>
                <el-button class="calc-key number" @click="appendDigit('8')">8</el-button>
                <el-button class="calc-key number" @click="appendDigit('9')">9</el-button>
                <el-button class="calc-key operator" @click="appendOperator('*')" title="乘法">×</el-button>
              </div>

              <div class="key-row">
                <el-button class="calc-key number" @click="appendDigit('4')">4</el-button>
                <el-button class="calc-key number" @click="appendDigit('5')">5</el-button>
                <el-button class="calc-key number" @click="appendDigit('6')">6</el-button>
                <el-button class="calc-key operator" @click="appendOperator('-')" title="减法">−</el-button>
              </div>

              <div class="key-row">
                <el-button class="calc-key number" @click="appendDigit('1')">1</el-button>
                <el-button class="calc-key number" @click="appendDigit('2')">2</el-button>
                <el-button class="calc-key number" @click="appendDigit('3')">3</el-button>
                <el-button class="calc-key operator" @click="appendOperator('+')" title="加法">+</el-button>
              </div>

              <div class="key-row">
                <el-button class="calc-key function" @click="toggleSign" title="正负号">±</el-button>
                <el-button class="calc-key number" @click="appendDigit('0')">0</el-button>
                <el-button class="calc-key number" @click="appendDecimal">.</el-button>
                <el-button class="calc-key equals" @click="calculate" title="等于">=</el-button>
              </div>
            </div>

            <div v-if="isScientific" class="scientific-keys">
              <div class="key-row">
                <el-button class="calc-key function" @click="calculateFunction('square')" title="平方">x²</el-button>
                <el-button class="calc-key function" @click="calculateFunction('cube')" title="立方">x³</el-button>
                <el-button class="calc-key function" @click="calculateFunction('power')" title="幂">xʸ</el-button>
                <el-button class="calc-key function" @click="calculateFunction('root')" title="开方">√</el-button>
              </div>

              <div class="key-row">
                <el-button class="calc-key function" @click="calculateFunction('sin')" title="正弦">sin</el-button>
                <el-button class="calc-key function" @click="calculateFunction('cos')" title="余弦">cos</el-button>
                <el-button class="calc-key function" @click="calculateFunction('tan')" title="正切">tan</el-button>
                <el-button class="calc-key function" @click="appendConstant('pi')" title="圆周率">π</el-button>
              </div>

              <div class="key-row">
                <el-button class="calc-key function" @click="calculateFunction('asin')" title="反正弦">sin⁻¹</el-button>
                <el-button class="calc-key function" @click="calculateFunction('acos')" title="反余弦">cos⁻¹</el-button>
                <el-button class="calc-key function" @click="calculateFunction('atan')" title="反正切">tan⁻¹</el-button>
                <el-button class="calc-key function" @click="appendConstant('e')" title="自然对数的底">e</el-button>
              </div>

              <div class="key-row">
                <el-button class="calc-key function" @click="calculateFunction('log')" title="常用对数">log</el-button>
                <el-button class="calc-key function" @click="calculateFunction('ln')" title="自然对数">ln</el-button>
                <el-button class="calc-key function" @click="appendOperator('%')" title="百分比">%</el-button>
                <el-button class="calc-key function" @click="calculateFunction('factorial')" title="阶乘">n!</el-button>
              </div>

              <div class="key-row">
                <el-button class="calc-key function" @click="appendParenthesis('(')" title="左括号">(</el-button>
                <el-button class="calc-key function" @click="appendParenthesis(')')" title="右括号">)</el-button>
                <el-button class="calc-key function" @click="appendOperator('mod')" title="取模">mod</el-button>
                <el-button class="calc-key function" @click="copyResult" title="复制结果">
                  <i class="el-icon-document-copy"></i>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="historyVisible" class="history-panel">
        <div class="history-header">
          <h3>计算历史</h3>
          <el-button size="small" @click="clearHistory" title="清空历史">清空</el-button>
        </div>

        <div class="history-list">
          <div v-for="(item, index) in historyItems" :key="index" class="history-item" @click="useHistoryItem(item)">
            <div class="history-expression">{{ item.expression }}</div>
            <div class="history-result">= {{ item.result }}</div>
          </div>

          <div v-if="historyItems.length === 0" class="empty-history">暂无计算历史</div>
        </div>
      </div>
    </sc-panel>

    <sc-panel title="使用帮助" theme="info">
      <div class="usage-guide">
        <h3>基本操作：</h3>
        <ul>
          <li><strong>AC</strong>：清除所有输入和结果</li>
          <li><strong>CE</strong>：清除当前输入</li>
          <li><strong>⌫</strong>：删除最后一个字符</li>
          <li><strong>DEG/RAD</strong>：切换角度与弧度模式</li>
          <li><strong>科学/标准</strong>：切换科学计算器和标准计算器</li>
        </ul>

        <h3>科学计算功能：</h3>
        <ul>
          <li><strong>x²</strong>：计算平方</li>
          <li><strong>x³</strong>：计算立方</li>
          <li><strong>xʸ</strong>：计算幂</li>
          <li><strong>√</strong>：计算平方根</li>
          <li><strong>sin, cos, tan</strong>：三角函数</li>
          <li><strong>sin⁻¹, cos⁻¹, tan⁻¹</strong>：反三角函数</li>
          <li><strong>log</strong>：以10为底的对数</li>
          <li><strong>ln</strong>：自然对数</li>
          <li><strong>π</strong>：圆周率常数 (3.14159...)</li>
          <li><strong>e</strong>：自然对数的底 (2.71828...)</li>
          <li><strong>n!</strong>：阶乘</li>
          <li><strong>mod</strong>：取模运算</li>
        </ul>

        <h3>计算历史：</h3>
        <p>点击"显示历史"按钮可以查看之前的计算记录。点击历史记录可以重新使用该表达式。</p>

        <h3>键盘快捷键：</h3>
        <ul>
          <li><strong>数字键 0-9</strong>：输入数字</li>
          <li><strong>+, -, *, /</strong>：基本运算符</li>
          <li><strong>Enter 或 =</strong>：计算结果</li>
          <li><strong>Backspace</strong>：删除最后一个字符</li>
          <li><strong>Esc</strong>：清除当前输入</li>
          <li><strong>Delete</strong>：清除所有</li>
        </ul>
      </div>
    </sc-panel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import useClipboard from "../../composables/useClipboard";

// 复制功能
const { copyText } = useClipboard();

// 计算器状态
const expression = ref("");
const result = ref("");
const isScientific = ref(true);
const isDegree = ref(true);
const historyVisible = ref(false);
const historyItems = ref([]);

// 计算表达式
const calculate = () => {
  if (!expression.value) return;

  try {
    // 预处理表达式，替换数学符号为JavaScript能识别的形式
    let processedExpr = expression.value.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/mod/g, "%").replace(/π/g, "Math.PI").replace(/e/g, "Math.E");

    // 处理百分比
    processedExpr = processedExpr.replace(/(\d+(\.\d+)?)%/g, (match, number) => {
      return number + "/100";
    });

    // 处理三角函数，考虑角度模式
    if (isDegree.value) {
      processedExpr = processedExpr
        .replace(/sin\s*\(/g, "Math.sin(Math.PI/180*")
        .replace(/cos\s*\(/g, "Math.cos(Math.PI/180*")
        .replace(/tan\s*\(/g, "Math.tan(Math.PI/180*");
    } else {
      processedExpr = processedExpr
        .replace(/sin\s*\(/g, "Math.sin(")
        .replace(/cos\s*\(/g, "Math.cos(")
        .replace(/tan\s*\(/g, "Math.tan(");
    }

    // 处理其他数学函数
    processedExpr = processedExpr
      .replace(/log\s*\(/g, "Math.log10(")
      .replace(/ln\s*\(/g, "Math.log(")
      .replace(/√\s*\(/g, "Math.sqrt(")
      .replace(/√(\d+(\.\d+)?)/g, "Math.sqrt($1)");

    // 计算结果
    const calculatedResult = eval(processedExpr);

    // 处理不同类型的结果
    if (typeof calculatedResult === "undefined") {
      result.value = "错误";
    } else if (isNaN(calculatedResult)) {
      result.value = "不是数字";
    } else if (!isFinite(calculatedResult)) {
      result.value = calculatedResult > 0 ? "无穷大" : "负无穷大";
    } else {
      // 格式化数字，避免过长的小数
      result.value = formatNumber(calculatedResult);
    }

    // 添加到历史记录
    addToHistory(expression.value, result.value);
  } catch (error) {
    console.error("计算错误:", error);
    result.value = "错误";
  }
};

// 格式化数字，避免过长小数
const formatNumber = (num) => {
  // 如果数非常大或非常小，使用科学计数法
  if (Math.abs(num) < 1e-10 || Math.abs(num) > 1e10) {
    return num.toExponential(10);
  }

  // 对小数进行有效处理
  if (Number.isInteger(num)) {
    return num.toString();
  } else {
    // 限制小数位数为10位
    return parseFloat(num.toFixed(10)).toString();
  }
};

// 添加到历史记录
const addToHistory = (expr, res) => {
  if (expr && res && res !== "错误" && res !== "不是数字") {
    historyItems.value.unshift({
      expression: expr,
      result: res,
    });

    // 限制历史记录数量
    if (historyItems.value.length > 20) {
      historyItems.value.pop();
    }

    // 保存到本地存储
    try {
      localStorage.setItem("calculator-history", JSON.stringify(historyItems.value));
    } catch (e) {
      console.error("保存历史记录失败:", e);
    }
  }
};

// 使用历史记录项
const useHistoryItem = (item) => {
  expression.value = item.expression;
  result.value = item.result;
};

// 清空历史记录
const clearHistory = () => {
  historyItems.value = [];
  localStorage.removeItem("calculator-history");
};

// 添加数字
const appendDigit = (digit) => {
  expression.value += digit;
};

// 添加小数点
const appendDecimal = () => {
  // 检查最后一个数字是否已经有小数点
  const lastNumber = expression.value.split(/[+\-×÷()\s]/).pop();
  if (!lastNumber.includes(".")) {
    expression.value += ".";
  }
};

// 添加运算符
const appendOperator = (operator) => {
  // 美化显示
  let displayOperator = operator;
  if (operator === "*") displayOperator = "×";
  else if (operator === "/") displayOperator = "÷";
  else if (operator === "-") displayOperator = "−";

  if (expression.value === "" && (operator === "+" || operator === "-" || operator === "−")) {
    expression.value = displayOperator;
  } else if (expression.value !== "") {
    // 检查是否需要替换最后一个运算符
    const lastChar = expression.value.slice(-1);
    if (["+", "−", "×", "÷"].includes(lastChar)) {
      expression.value = expression.value.slice(0, -1) + displayOperator;
    } else {
      expression.value += displayOperator;
    }
  }
};

// 添加括号
const appendParenthesis = (paren) => {
  expression.value += paren;
};

// 添加常量
const appendConstant = (constant) => {
  let value = "";
  if (constant === "pi") value = "π";
  else if (constant === "e") value = "e";

  expression.value += value;
};

// 计算函数
const calculateFunction = (func) => {
  switch (func) {
    case "square":
      if (result.value) {
        expression.value = `(${result.value})²`;
        calculate();
      } else if (expression.value) {
        expression.value = `(${expression.value})²`;
        calculate();
      }
      break;

    case "cube":
      if (result.value) {
        expression.value = `(${result.value})³`;
        calculate();
      } else if (expression.value) {
        expression.value = `(${expression.value})³`;
        calculate();
      }
      break;

    case "power":
      if (expression.value) {
        expression.value += "^";
      }
      break;

    case "root":
      expression.value = `√(${expression.value || "0"})`;
      calculate();
      break;

    case "sin":
    case "cos":
    case "tan":
    case "asin":
    case "acos":
    case "atan":
    case "log":
    case "ln":
      expression.value = `${func}(${expression.value || "0"})`;
      calculate();
      break;

    case "factorial":
      if (result.value) {
        const num = parseFloat(result.value);
        if (Number.isInteger(num) && num >= 0 && num <= 170) {
          let fact = 1;
          for (let i = 2; i <= num; i++) {
            fact *= i;
          }
          result.value = formatNumber(fact);
          addToHistory(`${num}!`, result.value);
        } else {
          result.value = "错误";
        }
      } else if (expression.value) {
        try {
          const processedExpr = expression.value.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
          const num = eval(processedExpr);

          if (Number.isInteger(num) && num >= 0 && num <= 170) {
            let fact = 1;
            for (let i = 2; i <= num; i++) {
              fact *= i;
            }
            result.value = formatNumber(fact);
            addToHistory(`${expression.value}!`, result.value);
          } else {
            result.value = "错误";
          }
        } catch (e) {
          result.value = "错误";
        }
      }
      break;
  }
};

// 切换正负号
const toggleSign = () => {
  if (expression.value.startsWith("-") || expression.value.startsWith("−")) {
    expression.value = expression.value.substring(1);
  } else if (expression.value !== "") {
    expression.value = "−" + expression.value;
  }
};

// 清除所有
const clearAll = () => {
  expression.value = "";
  result.value = "";
};

// 清除当前输入
const clearEntry = () => {
  expression.value = "";
};

// 退格
const backspace = () => {
  expression.value = expression.value.slice(0, -1);
};

// 切换科学/标准模式
const toggleMode = () => {
  isScientific.value = !isScientific.value;
};

// 切换角度/弧度
const handleDegRad = () => {
  isDegree.value = !isDegree.value;
};

// 切换历史面板
const toggleHistory = () => {
  historyVisible.value = !historyVisible.value;
};

// 复制结果
const copyResult = async () => {
  if (!result.value) {
    ElMessage.warning("没有可复制的结果");
    return;
  }

  try {
    await copyText(result.value);
    ElMessage.success("结果已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败");
  }
};

// 键盘事件
const handleKeydown = (event) => {
  event.preventDefault();

  const key = event.key;

  // 数字键
  if (/^[0-9]$/.test(key)) {
    appendDigit(key);
  }
  // 运算符
  else if (["+", "-", "*", "/"].includes(key)) {
    appendOperator(key);
  }
  // 小数点
  else if (key === ".") {
    appendDecimal();
  }
  // 括号
  else if (key === "(" || key === ")") {
    appendParenthesis(key);
  }
  // 计算结果
  else if (key === "Enter" || key === "=") {
    calculate();
  }
  // 退格
  else if (key === "Backspace") {
    backspace();
  }
  // 清除当前输入
  else if (key === "Escape") {
    clearEntry();
  }
  // 清除所有
  else if (key === "Delete") {
    clearAll();
  }
  // 百分号
  else if (key === "%") {
    appendOperator("%");
  }
};

// 加载历史记录
const loadHistory = () => {
  try {
    const savedHistory = localStorage.getItem("calculator-history");
    if (savedHistory) {
      historyItems.value = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error("加载历史记录失败:", e);
  }
};

onMounted(() => {
  // 加载历史记录
  loadHistory();

  // 添加键盘事件
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  // 移除键盘事件
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.calculator-container {
  padding: 0;
}

.calculator-panel {
  margin-bottom: 20px;
}

.calculator {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.display {
  background-color: var(--el-color-primary-light-9);
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 10px;
  text-align: right;
  border: 1px solid var(--el-border-color-light);
}

.expression {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  min-height: 20px;
  margin-bottom: 5px;
  word-break: break-all;
}

.result {
  font-size: 28px;
  font-weight: bold;
  color: var(--el-color-primary);
  min-height: 35px;
  word-break: break-all;
}

.keyboard {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.function-keys {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.keys-container {
  display: flex;
  gap: 15px;
}

.main-keys {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scientific-keys {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-row {
  display: flex;
  gap: 10px;
}

.calc-key {
  flex: 1;
  height: 45px;
  font-size: 16px;
  border-radius: 4px;
}

.number {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.operator {
  background-color: var(--el-color-info-light-8);
  color: var(--el-color-primary);
  font-weight: bold;
}

.function {
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info-dark-2);
}

.equals {
  background-color: var(--el-color-primary);
  color: white;
  font-weight: bold;
}

.history-panel {
  margin-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
  padding-top: 15px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--el-color-primary);
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 10px;
}

.history-item {
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background-color: var(--el-color-primary-light-9);
}

.history-expression {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.history-result {
  font-size: 16px;
  color: var(--el-color-primary);
  font-weight: bold;
}

.empty-history {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
}

.history-toggle {
  margin-bottom: 10px;
}

.usage-guide h3 {
  color: var(--el-color-primary);
  margin-top: 20px;
  margin-bottom: 10px;
}

.usage-guide ul {
  padding-left: 20px;
}

.usage-guide li {
  margin-bottom: 5px;
}

@media (max-width: 768px) {
  .keys-container {
    flex-direction: column;
  }
}
</style>
