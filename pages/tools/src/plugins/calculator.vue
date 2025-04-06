<template>
  <div class="calculator-container">
    <sc-panel class="calculator-panel" title="科学计算器" theme="primary">
      <div class="calculator">
        <div class="calculator-display">
          <div class="expression-display">{{ displayExpression }}</div>
          <div class="result-display">{{ displayResult }}</div>
        </div>

        <div class="calculator-keypad">
          <div class="keypad-section function-keys">
            <el-button type="info" class="calc-key" @click="clearAll">AC</el-button>
            <el-button type="info" class="calc-key" @click="clearEntry">CE</el-button>
            <el-button type="info" class="calc-key" @click="backspace">
              <IconifyIconOnline icon="ep:delete" />
            </el-button>
            <el-button type="info" class="calc-key" @click="toggleMemory">
              <IconifyIconOnline icon="ep:collection" />
            </el-button>

            <el-button type="warning" class="calc-key" @click="appendOperator('/')">/</el-button>
            <el-button type="warning" class="calc-key" @click="appendOperator('*')">×</el-button>
            <el-button type="warning" class="calc-key" @click="appendOperator('-')">-</el-button>
            <el-button type="warning" class="calc-key" @click="appendOperator('+')">+</el-button>

            <el-button type="default" class="calc-key" @click="appendDigit('7')">7</el-button>
            <el-button type="default" class="calc-key" @click="appendDigit('8')">8</el-button>
            <el-button type="default" class="calc-key" @click="appendDigit('9')">9</el-button>
            <el-button type="success" class="calc-key" @click="calculateResult">=</el-button>

            <el-button type="default" class="calc-key" @click="appendDigit('4')">4</el-button>
            <el-button type="default" class="calc-key" @click="appendDigit('5')">5</el-button>
            <el-button type="default" class="calc-key" @click="appendDigit('6')">6</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('sqrt')">√</el-button>

            <el-button type="default" class="calc-key" @click="appendDigit('1')">1</el-button>
            <el-button type="default" class="calc-key" @click="appendDigit('2')">2</el-button>
            <el-button type="default" class="calc-key" @click="appendDigit('3')">3</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('pow')">x²</el-button>

            <el-button type="default" class="calc-key" @click="toggleSign">±</el-button>
            <el-button type="default" class="calc-key" @click="appendDigit('0')">0</el-button>
            <el-button type="default" class="calc-key" @click="appendDigit('.')">.</el-button>
            <el-button type="primary" class="calc-key" @click="appendConstant('PI')">π</el-button>
          </div>

          <div class="keypad-section scientific-keys" v-if="showScientific">
            <el-button type="primary" class="calc-key" @click="appendFunction('sin')">sin</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('cos')">cos</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('tan')">tan</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('log')">log</el-button>

            <el-button type="primary" class="calc-key" @click="appendFunction('asin')">sin⁻¹</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('acos')">cos⁻¹</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('atan')">tan⁻¹</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('ln')">ln</el-button>

            <el-button type="primary" class="calc-key" @click="appendFunction('pow', 3)">x³</el-button>
            <el-button type="primary" class="calc-key" @click="appendOperator('^')">xʸ</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('cbrt')">∛</el-button>
            <el-button type="primary" class="calc-key" @click="appendFunction('exp')">eˣ</el-button>

            <el-button type="primary" class="calc-key" @click="appendConstant('E')">e</el-button>
            <el-button type="primary" class="calc-key" @click="appendOperator('!')"">!</el-button>
            <el-button type="primary" class="calc-key" @click="appendOperator('%')">%</el-button>
            <el-button type="primary" class="calc-key" @click="appendConstant('1/PI')">1/π</el-button>

            <el-button type="info" class="calc-key" @click="appendParenthesis('(')">(</el-button>
            <el-button type="info" class="calc-key" @click="appendParenthesis(')')">)</el-button>
            <el-button type="info" class="calc-key" @click="convertToRad">DEG</el-button>
            <el-button type="info" class="calc-key" @click="copyResult">
              <IconifyIconOnline icon="ep:document-copy" />
            </el-button>
          </div>
        </div>

        <div class="calculator-controls">
          <el-switch v-model="showScientific" active-text="科学计算" inactive-text="基本计算" />
          <el-button size="small" @click="clearHistory" v-if="calculationHistory.length > 0">
            <IconifyIconOnline icon="ep:delete" />
            清空历史
          </el-button>
        </div>
      </div>

      <el-collapse v-if="calculationHistory.length > 0">
        <el-collapse-item name="history">
          <template #title>
            <span class="history-title">
              <IconifyIconOnline icon="ep:time" />
              计算历史记录
            </span>
          </template>
          <div class="calculation-history">
            <div v-for="(item, index) in calculationHistory" :key="index" class="history-item">
              <div class="history-expression">{{ item.expression }}</div>
              <div class="history-result">= {{ item.result }}</div>
              <div class="history-actions">
                <el-button type="text" @click="recallCalculation(item)" size="small">
                  <IconifyIconOnline icon="ep:refresh" />
                </el-button>
                <el-button type="text" @click="copyHistoryItem(item)" size="small">
                  <IconifyIconOnline icon="ep:document-copy" />
                </el-button>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <template #footer>
        <div class="memory-panel" v-if="showMemory">
          <div class="memory-header">
            <h3>储存的值</h3>
            <el-button size="small" @click="clearMemory" v-if="memory.length > 0">
              <IconifyIconOnline icon="ep:delete" />
              清空记忆
            </el-button>
          </div>
          <div class="memory-list">
            <div v-if="memory.length === 0" class="empty-memory">
              <p>暂无储存的值。使用 M+ 按钮储存当前结果。</p>
            </div>
            <div v-for="(value, index) in memory" :key="index" class="memory-item">
              <div class="memory-value">{{ formatNumber(value) }}</div>
              <div class="memory-actions">
                <el-button type="text" @click="recallMemory(value)" size="small">应用</el-button>
                <el-button type="text" @click="removeFromMemory(index)" size="small">
                  <IconifyIconOnline icon="ep:close" />
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </sc-panel>

    <sc-panel title="使用帮助" theme="info">
      <h3>计算器功能</h3>
      <ul>
        <li><strong>基本计算：</strong> 支持加减乘除等基本运算</li>
        <li><strong>科学计算：</strong> 支持三角函数、对数、幂运算等高级功能</li>
        <li><strong>历史记录：</strong> 自动保存计算历史，随时可以查看或重用</li>
        <li><strong>内存功能：</strong> 可以储存和调用多个数值</li>
      </ul>

      <h3>键盘快捷键</h3>
      <ul>
        <li>数字键 (0-9)：输入相应数字</li>
        <li>运算符 (+, -, *, /)：输入相应运算符</li>
        <li>Enter 键：计算结果</li>
        <li>Backspace 键：删除最后一个字符</li>
        <li>Esc 键：清空所有内容</li>
        <li>左右括号 ( )：输入括号</li>
      </ul>
    </sc-panel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { IconifyIconOnline } from "@packages/components/ReIcon";
import useClipboard from "../../composables/useClipboard";

// 复制功能
const { copyText } = useClipboard();

// 计算器状态
const currentExpression = ref("");
const currentResult = ref("");
const calculationHistory = ref([]);
const isInRadianMode = ref(false);
const showScientific = ref(true);
const memory = ref([]);
const showMemory = ref(false);

// 显示表达式和结果
const displayExpression = computed(() => {
  if (!currentExpression.value) return "0";
  // 美化显示表达式
  return currentExpression.value
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/\^/g, "^")
    .replace(/sqrt/g, "√")
    .replace(/sin/g, "sin")
    .replace(/cos/g, "cos")
    .replace(/tan/g, "tan")
    .replace(/log/g, "log")
    .replace(/ln/g, "ln")
    .replace(/PI/g, "π")
    .replace(/E/g, "e");
});

const displayResult = computed(() => {
  if (!currentResult.value) return "";
  return formatNumber(currentResult.value);
});

// 格式化数字
const formatNumber = (value) => {
  if (typeof value !== "number") return value;

  // 处理特殊情况
  if (isNaN(value)) return "错误";
  if (!isFinite(value)) return value > 0 ? "∞" : "-∞";

  // 如果是整数
  if (Number.isInteger(value)) return value.toString();

  // 如果是小数，限制小数位数
  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: 10,
    useGrouping: true,
  });
};

// 输入数字
const appendDigit = (digit) => {
  currentExpression.value += digit;
  calculateLive();
};

// 输入操作符
const appendOperator = (operator) => {
  // 避免连续的操作符
  const lastChar = currentExpression.value.slice(-1);
  if (["+", "-", "*", "/", "^", "%"].includes(lastChar) && operator !== "!") {
    currentExpression.value = currentExpression.value.slice(0, -1) + operator;
  } else {
    currentExpression.value += operator;
  }
  calculateLive();
};

// 输入函数
const appendFunction = (func, arg) => {
  if (arg !== undefined) {
    // 如果提供了参数 (例如 x²)
    currentExpression.value += `Math.${func}(${currentExpression.value || "0"}, ${arg})`;
  } else {
    // 标准数学函数
    currentExpression.value += `Math.${func}(`;
  }
  calculateLive();
};

// 输入常量
const appendConstant = (constant) => {
  currentExpression.value += `Math.${constant}`;
  calculateLive();
};

// 输入括号
const appendParenthesis = (parenthesis) => {
  currentExpression.value += parenthesis;
  calculateLive();
};

// 切换正负号
const toggleSign = () => {
  if (!currentExpression.value) return;

  // 检查最后一个数字
  const regex = /(\d+(\.\d+)?)$/;
  const match = currentExpression.value.match(regex);

  if (match) {
    // 找到一个数字，切换它的符号
    const number = match[0];
    const numberIndex = currentExpression.value.lastIndexOf(number);
    const prefix = currentExpression.value.substring(0, numberIndex);

    // 检查数字前面的字符
    const charBeforeNumber = prefix.charAt(prefix.length - 1);

    if (charBeforeNumber === "-") {
      // 如果前面是减号，删除它
      currentExpression.value = prefix.substring(0, prefix.length - 1) + number;
    } else if (charBeforeNumber === "+" || charBeforeNumber === "" || charBeforeNumber === "(" || ["+", "-", "*", "/", "^"].includes(charBeforeNumber)) {
      // 如果前面是加号或开始位置或左括号或操作符，添加减号
      currentExpression.value = prefix + "-" + number;
    } else {
      // 否则，可能是函数名等，加上减号和括号
      currentExpression.value = prefix + "-(" + number + ")";
    }
  } else {
    // 没有找到数字，可能整个表达式就是结果，对整体取反
    if (currentResult.value) {
      currentExpression.value = -parseFloat(currentResult.value);
    }
  }

  calculateLive();
};

// 实时计算
const calculateLive = () => {
  if (!currentExpression.value) {
    currentResult.value = "";
    return;
  }

  try {
    // 处理阶乘
    let expr = currentExpression.value.replace(/(\d+)!/g, (match, number) => {
      return `factorial(${number})`;
    });

    // 处理百分比
    expr = expr.replace(/(\d+(\.\d+)?)%/g, (match, number) => {
      return `(${number}/100)`;
    });

    // 处理幂运算
    expr = expr.replace(/(\d+(\.\d+)?)\s*\^\s*(\d+(\.\d+)?)/g, (match, base, _, exponent) => {
      return `Math.pow(${base}, ${exponent})`;
    });

    // 计算结果
    // eslint-disable-next-line no-new-func
    const result = new Function("factorial", `
      try {
        return ${expr};
      } catch (e) {
        return "";
      }
    `)(factorial);

    currentResult.value = result;
  } catch (error) {
    console.error("计算错误:", error);
    currentResult.value = "";
  }
};

// 计算结果
const calculateResult = () => {
  if (!currentExpression.value) return;

  try {
    calculateLive();

    if (currentResult.value !== "") {
      // 添加到历史记录
      calculationHistory.value.unshift({
        expression: displayExpression.value,
        result: currentResult.value
      });

      // 限制历史记录条数
      if (calculationHistory.value.length > 50) {
        calculationHistory.value = calculationHistory.value.slice(0, 50);
      }

      // 设置表达式为结果，以便继续计算
      currentExpression.value = currentResult.value.toString();
    }
  } catch (error) {
    ElMessage.error("计算错误: " + error.message);
  }
};

// 清空所有
const clearAll = () => {
  currentExpression.value = "";
  currentResult.value = "";
};

// 清空当前输入
const clearEntry = () => {
  currentExpression.value = "";
  calculateLive();
};

// 退格
const backspace = () => {
  currentExpression.value = currentExpression.value.slice(0, -1);
  calculateLive();
};

// 复制结果
const copyResult = async () => {
  if (!currentResult.value) {
    ElMessage.warning("没有可复制的结果");
    return;
  }

  try {
    await copyText(currentResult.value.toString());
    ElMessage.success("结果已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败");
  }
};

// 复制历史项
const copyHistoryItem = async (item) => {
  try {
    await copyText(`${item.expression} = ${item.result}`);
    ElMessage.success("已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败");
  }
};

// 从历史记录调用计算
const recallCalculation = (item) => {
  currentExpression.value = item.result.toString();
  currentResult.value = item.result;
};

// 清空历史记录
const clearHistory = () => {
  calculationHistory.value = [];
};

// 切换弧度/角度模式
const convertToRad = () => {
  isInRadianMode.value = !isInRadianMode.value;
  ElMessage.info(`已切换到${isInRadianMode.value ? "弧度" : "角度"}模式`);
};

// 切换内存面板
const toggleMemory = () => {
  showMemory.value = !showMemory.value;
};

// 添加到内存
const addToMemory = () => {
  if (currentResult.value !== "" && !isNaN(currentResult.value)) {
    memory.value.push(parseFloat(currentResult.value));
    ElMessage.success("已添加到内存");
  } else {
    ElMessage.warning("没有有效的结果可添加");
  }
};

// 从内存调用数值
const recallMemory = (value) => {
  currentExpression.value += value;
  calculateLive();
};

// 从内存中移除
const removeFromMemory = (index) => {
  memory.value.splice(index, 1);
  ElMessage.success("已从内存移除");
};

// 清空内存
const clearMemory = () => {
  memory.value = [];
  ElMessage.success("内存已清空");
};

// 键盘事件处理
const handleKeyDown = (event) => {
  event.preventDefault();

  const key = event.key;

  // 数字键和小数点
  if (/^[0-9.]$/.test(key)) {
    appendDigit(key);
  }
  // 运算符
  else if (["+", "-", "*", "/", "^", "%"].includes(key)) {
    appendOperator(key);
  }
  // 括号
  else if (["(", ")"].includes(key)) {
    appendParenthesis(key);
  }
  // 等号和回车键计算结果
  else if (key === "=" || key === "Enter") {
    calculateResult();
  }
  // 退格键
  else if (key === "Backspace") {
    backspace();
  }
  // Esc键清空
  else if (key === "Escape") {
    clearAll();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
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

.calculator-display {
  padding: 20px;
  background-color: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-border-color-light);
  text-align: right;
}

.expression-display {
  font-size: 16px;
  margin-bottom: 8px;
  min-height: 24px;
  color: var(--el-text-color-secondary);
  overflow-x: auto;
  white-space: nowrap;
}

.result-display {
  font-size: 32px;
  font-weight: bold;
  min-height: 40px;
  color: var(--el-text-color-primary);
}

.calculator-keypad {
  display: flex;
  padding: 15px;
  gap: 15px;
}

.keypad-section {
  display: grid;
  gap: 8px;
}

.function-keys {
  grid-template-columns: repeat(4, 1fr);
}

.scientific-keys {
  grid-template-columns: repeat(4, 1fr);
}

.calc-key {
  min-height: 45px;
  font-weight: bold;
}

.calculator-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-top: 1px solid var(--el-border-color-light);
}

.calculation-history {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.history-item:last-child {
  border-bottom: none;
}

.history-expression {
  flex: 1;
  color: var(--el-text-color-secondary);
}

.history-result {
  font-weight: bold;
  margin: 0 15px;
}

.history-actions {
  white-space: nowrap;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 5px;
}

.memory-panel {
  border-top: 1px solid var(--el-border-color-light);
  padding-top: 15px;
}

.memory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.memory-header h3 {
  margin: 0;
  font-size: 16px;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.memory-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.memory-value {
  font-weight: bold;
}

.memory-actions {
  display: flex;
  gap: 5px;
}

.empty-memory {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 15px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
}
</style>
