<template>
  <div class="css-beautify-container">
    <sc-panel class="editor-panel" title="CSS 美化工具" theme="primary">
      <div class="option-bar">
        <el-radio-group v-model="indentType" size="small">
          <el-radio-button label="space">空格缩进</el-radio-button>
          <el-radio-button label="tab">Tab 缩进</el-radio-button>
        </el-radio-group>

        <el-input-number
          v-model="indentSize"
          :min="1"
          :max="8"
          size="small"
          controls-position="right"
          @change="formatCss"
        />

        <el-button-group class="action-buttons">
          <el-button type="primary" @click="formatCss">
            <IconifyIconOnline icon="ep:refresh" />
            格式化
          </el-button>
          <el-button type="success" @click="copyCode">
            <IconifyIconOnline icon="ep:document-copy" />
            复制
          </el-button>
          <el-button @click="clearCode">
            <IconifyIconOnline icon="ep:delete" />
            清空
          </el-button>
        </el-button-group>
      </div>

      <div class="editor-container">
        <div class="editor-wrapper">
          <div class="editor-header">输入 CSS 代码</div>
          <div class="editor-body">
            <el-input
              v-model="inputCss"
              type="textarea"
              :rows="15"
              resize="none"
              placeholder="请输入需要格式化的 CSS 代码..."
              @input="autoFormat"
            />
          </div>
        </div>
        <div class="editor-divider">
          <IconifyIconOnline icon="ep:d-arrow-right" />
        </div>
        <div class="editor-wrapper">
          <div class="editor-header">格式化结果</div>
          <div class="editor-body">
            <pre class="css-result" ref="codeResult">{{ formattedCss }}</pre>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="tips">
          <p>
            提示：点击格式化按钮或在输入框中输入代码后自动格式化。可调整缩进类型和缩进大小。
          </p>
          <p>支持压缩后的 CSS 代码美化。</p>
        </div>
      </template>
    </sc-panel>

    <el-divider>格式化选项</el-divider>

    <el-row :gutter="20">
      <el-col :span="12">
        <sc-panel title="基本设置" theme="info">
          <el-form label-position="top">
            <el-form-item label="换行规则">
              <el-select
                v-model="newLineOption"
                @change="formatCss"
                style="width: 100%"
              >
                <el-option label="系统默认 (LF/CRLF)" value="auto" />
                <el-option label="Unix 风格 (LF)" value="lf" />
                <el-option label="Windows 风格 (CRLF)" value="crlf" />
              </el-select>
            </el-form-item>

            <el-form-item label="每个属性单独一行">
              <ScSwitch
                v-model="onePropertyPerLine"
                layout="modern"
                @change="formatCss"
              />
            </el-form-item>

            <el-form-item label="选择器之后换行">
              <ScSwitch
                v-model="newLineAfterSelector"
                layout="modern"
                @change="formatCss"
              />
            </el-form-item>
          </el-form>
        </sc-panel>
      </el-col>

      <el-col :span="12">
        <sc-panel title="高级设置" theme="info">
          <el-form label-position="top">
            <el-form-item label="自动修复简单错误">
              <ScSwitch v-model="autoFix" layout="modern" @change="formatCss" />
            </el-form-item>

            <el-form-item label="属性排序">
              <el-select
                v-model="sortProperties"
                @change="formatCss"
                style="width: 100%"
              >
                <el-option label="不排序" value="none" />
                <el-option label="按字母排序" value="alphabetical" />
                <el-option label="按类型分组" value="grouped" />
              </el-select>
            </el-form-item>

            <el-form-item label="颜色格式">
              <el-select
                v-model="colorFormat"
                @change="formatCss"
                style="width: 100%"
              >
                <el-option label="保持不变" value="preserve" />
                <el-option label="HEX 格式" value="hex" />
                <el-option label="RGB 格式" value="rgb" />
                <el-option label="HSL 格式" value="hsl" />
              </el-select>
            </el-form-item>
          </el-form>
        </sc-panel>
      </el-col>
    </el-row>

    <sc-panel title="使用帮助" theme="warning">
      <h3>如何使用</h3>
      <ol>
        <li>在左侧输入框中粘贴您需要格式化的 CSS 代码。</li>
        <li>根据需要调整格式化选项（缩进类型、缩进大小等）。</li>
        <li>点击"格式化"按钮或自动格式化。</li>
        <li>
          格式化后的代码将显示在右侧，可以点击"复制"按钮复制格式化后的代码。
        </li>
      </ol>

      <h3>格式化选项说明</h3>
      <ul>
        <li><strong>缩进类型：</strong> 选择使用空格或制表符进行缩进。</li>
        <li>
          <strong>缩进大小：</strong>
          设置缩进的空格数量（仅当使用空格缩进时有效）。
        </li>
        <li><strong>换行规则：</strong> 选择文件中使用的换行符类型。</li>
        <li>
          <strong>每个属性单独一行：</strong> 启用后，每个 CSS
          属性将单独占一行。
        </li>
        <li>
          <strong>选择器之后换行：</strong>
          启用后，在选择器和左大括号之间添加换行。
        </li>
        <li>
          <strong>自动修复简单错误：</strong>
          尝试修复缺失的分号、括号等简单错误。
        </li>
        <li><strong>属性排序：</strong> 按字母顺序或类型对属性进行排序。</li>
        <li><strong>颜色格式：</strong> 统一颜色值的表示方式。</li>
      </ul>
    </sc-panel>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { message } from "@repo/utils";
import { useClipboard } from "@vueuse/core";
import ScSwitch from "@repo/components/ScSwitch/index.vue";

// 复制功能
const { copyText } = useClipboard();

// CSS 代码
const inputCss = ref("");
const formattedCss = ref("");
const codeResult = ref(null);

// 格式化选项
const indentType = ref("space");
const indentSize = ref(2);
const newLineOption = ref("auto");
const onePropertyPerLine = ref(true);
const newLineAfterSelector = ref(true);
const autoFix = ref(true);
const sortProperties = ref("none");
const colorFormat = ref("preserve");

// 自动格式化延迟
let formatDebounce = null;

// 格式化 CSS 代码
const formatCss = () => {
  if (!inputCss.value.trim()) {
    formattedCss.value = "";
    return;
  }

  try {
    // 简单的 CSS 格式化逻辑
    let css = inputCss.value;

    // 1. 预处理：去除多余空格、注释保留
    css = css
      .replace(/\/\*[\s\S]*?\*\//g, (match) => {
        // 保留注释但标记它们
        return `\n/* COMMENT_PLACEHOLDER_${Math.random().toString(36).substring(2, 15)} ${match} */\n`;
      })
      .replace(/([{}:;,])\s+/g, "$1 ")
      .replace(/\s+([{}:;,])/g, " $1")
      .replace(/;\s*}/g, ";}")
      .replace(/\s+/g, " ")
      .trim();

    // 2. 将压缩的 CSS 分解成规则块
    css = css.replace(/}/g, "}\n\n").replace(/{/g, " {\n").replace(/;/g, ";\n");

    // 3. 处理新行和缩进
    const indent =
      indentType.value === "space" ? " ".repeat(indentSize.value) : "\t";

    // 4. 处理规则内部的属性
    let formattedLines = [];
    let lines = css.split("\n");
    let inBlock = false;
    let selectorLine = "";

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      if (!line) continue;

      // 处理选择器和开始大括号
      if (line.includes("{")) {
        selectorLine = line.slice(0, -1).trim();
        if (newLineAfterSelector.value) {
          formattedLines.push(selectorLine);
          formattedLines.push("{");
          inBlock = true;
        } else {
          formattedLines.push(`${selectorLine} {`);
          inBlock = true;
        }
      }
      // 处理结束大括号
      else if (line === "}") {
        formattedLines.push("}");
        inBlock = false;
      }
      // 处理属性
      else if (inBlock) {
        if (line.startsWith("/* COMMENT_PLACEHOLDER_")) {
          formattedLines.push(
            `${indent}${line.replace(/\/\* COMMENT_PLACEHOLDER_[a-z0-9]+ /, "").replace(/ \*\/$/, " */")}`
          );
        } else {
          // 属性行，添加缩进
          formattedLines.push(`${indent}${line}`);
        }
      }
      // 处理顶级行（如媒体查询）
      else {
        formattedLines.push(line);
      }
    }

    // 属性排序
    if (sortProperties.value !== "none") {
      // 使用临时的格式化结果
      let tmpResult = formattedLines.join("\n");

      // 找到所有 CSS 规则块
      const rulePattern = /([^{]+)\s*{([^}]*)}/g;
      tmpResult = tmpResult.replace(
        rulePattern,
        (match, selector, properties) => {
          const propertyLines = properties
            .split("\n")
            .filter((line) => line.trim());

          if (sortProperties.value === "alphabetical") {
            // 按字母顺序排序
            propertyLines.sort((a, b) => {
              const propA = a.split(":")[0] || "";
              const propB = b.split(":")[0] || "";
              return propA.localeCompare(propB);
            });
          } else if (sortProperties.value === "grouped") {
            // 这里只是一个简单的分组实现，可以根据需要扩展
            const groups = {
              position: [
                "position",
                "top",
                "right",
                "bottom",
                "left",
                "z-index",
              ],
              display: [
                "display",
                "flex",
                "grid",
                "align",
                "justify",
                "order",
                "float",
                "clear",
              ],
              box: [
                "width",
                "height",
                "margin",
                "padding",
                "border",
                "box-sizing",
              ],
              visual: [
                "background",
                "color",
                "font",
                "text",
                "line-height",
                "letter-spacing",
              ],
              animation: ["transition", "animation", "transform"],
            };

            // 按组排序
            const getGroupIndex = (propName) => {
              for (const [groupIndex, [groupName, props]] of Object.entries(
                Object.entries(groups)
              )) {
                if (props.some((prop) => propName.includes(prop))) {
                  return parseInt(groupIndex);
                }
              }
              return 999; // 未分类的属性放到最后
            };

            propertyLines.sort((a, b) => {
              const propA = a.split(":")[0]?.trim() || "";
              const propB = b.split(":")[0]?.trim() || "";
              const groupIndexA = getGroupIndex(propA);
              const groupIndexB = getGroupIndex(propB);
              return groupIndexA - groupIndexB || propA.localeCompare(propB);
            });
          }

          return `${selector} {\n${propertyLines.join("\n")}\n}`;
        }
      );

      formattedLines = tmpResult.split("\n");
    }

    // 处理颜色格式（简单实现）
    if (colorFormat.value !== "preserve") {
      formattedLines = formattedLines.map((line) => {
        // 颜色处理逻辑，这里仅为示例
        if (colorFormat.value === "hex") {
          // 简单的 RGB 到 HEX 转换
          line = line.replace(
            /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g,
            (match, r, g, b) => {
              return `#${Number(r).toString(16).padStart(2, "0")}${Number(g).toString(16).padStart(2, "0")}${Number(b).toString(16).padStart(2, "0")}`;
            }
          );
        }
        return line;
      });
    }

    // 根据选择的换行规则设置换行符
    const newLine = newLineOption.value === "crlf" ? "\r\n" : "\n";
    formattedCss.value = formattedLines.join(newLine);

    // 自动修复简单错误
    if (autoFix.value) {
      // 确保所有属性都有分号结尾
      formattedCss.value = formattedCss.value.replace(
        /([^;}])\s*\n\s*}/g,
        "$1;\n}"
      );
      // 确保选择器后面有空格
      formattedCss.value = formattedCss.value.replace(/([^\s]){/g, "$1 {");
    }
  } catch (error) {
    console.error("CSS 格式化失败:", error);
    message("CSS 格式化失败，请检查代码是否有语法错误", { type: "error" });
  }
};

// 自动格式化
const autoFormat = () => {
  if (formatDebounce) clearTimeout(formatDebounce);
  formatDebounce = setTimeout(() => {
    formatCss();
  }, 300);
};

// 复制代码
const copyCode = async () => {
  if (!formattedCss.value) {
    message("没有可复制的内容", { type: "warning" });
    return;
  }

  try {
    await copyText(formattedCss.value);
    message("已成功复制到剪贴板", { type: "success" });
  } catch (error) {
    console.error("复制失败:", error);
    message("复制失败", { type: "error" });
  }
};

// 清空代码
const clearCode = () => {
  inputCss.value = "";
  formattedCss.value = "";
};

// 监听输入变化
watch([indentType, indentSize], () => {
  formatCss();
});

// 示例 CSS
const exampleCss = `.header{color:#333;font-size:16px;margin:0;padding:10px}.container{display:flex;flex-direction:column;background-color:#f5f5f5;width:100%;height:auto;}.button{background:linear-gradient(to right,#4d7cff,#5e91fa);color:white;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;transition:all 0.3s ease;}.button:hover{background:linear-gradient(to right,#3d6cef,#4e81ea);transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,0.1);}`;

// 设置默认值
onMounted(() => {
  inputCss.value = exampleCss;
  nextTick(() => {
    formatCss();
  });
});
</script>

<style scoped>
.css-beautify-container {
  padding: 0;
}

.editor-panel {
  margin-bottom: 20px;
}

.option-bar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 12px;
}

.action-buttons {
  margin-left: auto;
}

.editor-container {
  display: flex;
  flex-direction: row;
  gap: 16px;
  height: 350px;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
}

.editor-header {
  padding: 8px 12px;
  background-color: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-border-color-light);
  font-weight: bold;
  color: var(--el-color-primary);
}

.editor-body {
  flex: 1;
  overflow: auto;
  background-color: var(--el-bg-color-page);
}

.editor-body :deep(.el-textarea__inner) {
  height: 100%;
  font-family: "Monaco", "Menlo", "Courier New", monospace;
  padding: 12px;
  border: none;
  border-radius: 0;
  resize: none;
  line-height: 1.5;
  font-size: 14px;
  background-color: var(--el-bg-color-page);
}

.css-result {
  height: 100%;
  margin: 0;
  padding: 12px;
  overflow: auto;
  font-family: "Monaco", "Menlo", "Courier New", monospace;
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.editor-divider {
  display: flex;
  align-items: center;
  color: var(--el-color-info);
}

.tips {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.tips p {
  margin: 4px 0;
}
</style>
