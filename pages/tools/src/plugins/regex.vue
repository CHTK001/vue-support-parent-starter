<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/components/prism-regex";
import "prismjs/components/prism-javascript";
import "prismjs/plugins/line-numbers/prism-line-numbers";
// 导入常量
import { REGEX_EXAMPLES, COMMON_PATTERNS, REGEX_HELP } from "./regex/constants";
// 响应式数据
const env = reactive({
  // 输入内容
  pattern: "",
  flags: "g",
  testText: "",
  replaceText: "",
  // 操作类型
  operationType: "test", // test, replace, extract, split
  // 结果
  results: {
    matches: [],
    replaced: "",
    extracted: [],
    split: [],
  },
  // 历史记录
  history: [],
  // 加载状态
  loading: false,
  // 示例正则表达式
  examples: REGEX_EXAMPLES,
  // 常用正则表达式
  commonPatterns: COMMON_PATTERNS,
});

// 计算属性：当前正则表达式对象
const currentRegex = computed(() => {
  try {
    if (!env.pattern) return null;
    return new RegExp(env.pattern, env.flags);
  } catch (error) {
    return null;
  }
});

// 计算属性：正则表达式是否有效
const isValidRegex = computed(() => {
  return currentRegex.value !== null;
});

// 测试正则表达式
const testRegex = () => {
  try {
    env.loading = true;

    if (!env.pattern.trim()) {
      throw new Error("请输入正则表达式");
    }

    if (!env.testText.trim()) {
      throw new Error("请输入测试文本");
    }

    const regex = new RegExp(env.pattern, env.flags);
    const matches = [];
    let match;

    // 重置正则表达式的lastIndex
    regex.lastIndex = 0;

    // 查找所有匹配项
    while ((match = regex.exec(env.testText)) !== null) {
      // 避免无限循环
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      const groups = match.slice(1);
      matches.push({
        fullMatch: match[0],
        groups: groups.length > 0 ? groups : null,
        index: match.index,
        input: match.input.substring(Math.max(0, match.index - 20), match.index) + "<mark>" + match[0] + "</mark>" + match.input.substring(match.index + match[0].length, match.index + match[0].length + 20),
      });

      // 如果不是全局模式，手动跳出循环
      if (!env.flags.includes("g")) {
        break;
      }
    }

    env.results.matches = matches;

    // 添加到历史记录
    addToHistory("测试正则表达式", env.pattern, env.flags, env.testText);

    if (matches.length === 0) {
      ElMessage.warning("未找到匹配项");
    } else {
      ElMessage.success(`找到 ${matches.length} 个匹配项`);
    }

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);
  } catch (error) {
    console.error("正则表达式测试错误:", error);
    ElMessage.error(error.message || "正则表达式测试失败");
  } finally {
    env.loading = false;
  }
};

// 替换文本
const replaceText = () => {
  try {
    env.loading = true;

    if (!env.pattern.trim()) {
      throw new Error("请输入正则表达式");
    }

    if (!env.testText.trim()) {
      throw new Error("请输入测试文本");
    }

    const regex = new RegExp(env.pattern, env.flags);
    const replaced = env.testText.replace(regex, env.replaceText);

    env.results.replaced = replaced;

    // 添加到历史记录
    addToHistory("替换文本", env.pattern, env.flags, env.testText, env.replaceText);

    ElMessage.success("文本替换成功");

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);
  } catch (error) {
    console.error("文本替换错误:", error);
    ElMessage.error(error.message || "文本替换失败");
  } finally {
    env.loading = false;
  }
};

// 提取匹配项
const extractMatches = () => {
  try {
    env.loading = true;

    if (!env.pattern.trim()) {
      throw new Error("请输入正则表达式");
    }

    if (!env.testText.trim()) {
      throw new Error("请输入测试文本");
    }

    const regex = new RegExp(env.pattern, env.flags);
    const matches = env.testText.match(regex) || [];

    env.results.extracted = matches;

    // 添加到历史记录
    addToHistory("提取匹配项", env.pattern, env.flags, env.testText);

    if (matches.length === 0) {
      ElMessage.warning("未找到匹配项");
    } else {
      ElMessage.success(`提取了 ${matches.length} 个匹配项`);
    }

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);
  } catch (error) {
    console.error("提取匹配项错误:", error);
    ElMessage.error(error.message || "提取匹配项失败");
  } finally {
    env.loading = false;
  }
};

// 分割文本
const splitText = () => {
  try {
    env.loading = true;

    if (!env.pattern.trim()) {
      throw new Error("请输入正则表达式");
    }

    if (!env.testText.trim()) {
      throw new Error("请输入测试文本");
    }

    const regex = new RegExp(env.pattern, env.flags);
    const parts = env.testText.split(regex).filter((part) => part !== "");

    env.results.split = parts;

    // 添加到历史记录
    addToHistory("分割文本", env.pattern, env.flags, env.testText);

    if (parts.length <= 1) {
      ElMessage.warning("文本未被分割");
    } else {
      ElMessage.success(`文本被分割为 ${parts.length} 部分`);
    }

    // 高亮显示
    setTimeout(() => {
      Prism.highlightAll();
    }, 0);
  } catch (error) {
    console.error("分割文本错误:", error);
    ElMessage.error(error.message || "分割文本失败");
  } finally {
    env.loading = false;
  }
};

// 执行操作
const executeOperation = () => {
  switch (env.operationType) {
    case "test":
      testRegex();
      break;
    case "replace":
      replaceText();
      break;
    case "extract":
      extractMatches();
      break;
    case "split":
      splitText();
      break;
    default:
      ElMessage.warning("请选择操作类型");
  }
};

// 应用示例
const applyExample = (example) => {
  env.pattern = example.pattern;
  env.flags = example.flags;
  env.testText = example.testText;
  env.operationType = "test";

  // 高亮显示
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);

  ElMessage.success("已应用示例");
};

// 应用常用正则表达式
const applyCommonPattern = (pattern) => {
  env.pattern = pattern.pattern;

  // 高亮显示
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);

  ElMessage.success(`已应用"${pattern.name}"正则表达式`);
};

// 添加到历史记录
const addToHistory = (operation, pattern, flags, testText, replaceText = "") => {
  const now = new Date();
  const historyItem = {
    id: now.getTime(),
    date: now.toLocaleString(),
    operation,
    pattern,
    flags,
    testText,
    replaceText,
  };

  env.history.unshift(historyItem);

  // 限制历史记录数量
  if (env.history.length > 10) {
    env.history.pop();
  }

  // 保存到本地存储
  try {
    localStorage.setItem("regex-tool-history", JSON.stringify(env.history));
  } catch (e) {
    console.error("保存历史记录失败:", e);
  }
};

// 从历史记录加载
const loadFromHistory = (item) => {
  env.pattern = item.pattern;
  env.flags = item.flags;
  env.testText = item.testText;
  env.replaceText = item.replaceText;
  env.operationType = item.operation === "替换文本" ? "replace" : item.operation === "提取匹配项" ? "extract" : item.operation === "分割文本" ? "split" : "test";

  // 高亮显示
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);

  ElMessage.success("已从历史记录加载");
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success("复制成功");
    })
    .catch(() => {
      ElMessage.error("复制失败");
    });
};

// 清空表单
const clearForm = () => {
  env.pattern = "";
  env.testText = "";
  env.replaceText = "";
  env.results.matches = [];
  env.results.replaced = "";
  env.results.extracted = [];
  env.results.split = [];

  ElMessage.success("已清空");
};

// 获取正则表达式语法说明
// 获取正则表达式语法说明
const getRegexHelp = (type) => {
  return REGEX_HELP[type] || [];
};

// 组件挂载时初始化
onMounted(() => {
  // 从本地存储加载历史记录
  try {
    const savedHistory = localStorage.getItem("regex-tool-history");
    if (savedHistory) {
      env.history = JSON.parse(savedHistory);
    }
  } catch (e) {
    console.error("加载历史记录失败:", e);
  }

  // 初始化语法高亮
  setTimeout(() => {
    Prism.highlightAll();
  }, 0);
});
</script>

<template>
  <div class="regex-tool">
    <div class="regex-tool__content">
      <!-- 头部信息 -->
      <div class="regex-tool__header-container">
        <div class="regex-tool__header">
          <div class="regex-tool__header-inner">
            <h1 class="regex-tool__header-title">正则表达式工具</h1>
            <p class="regex-tool__header-subtitle">测试、替换、提取和分割文本，支持常用正则表达式模板</p>
          </div>
          <div class="regex-tool__header-decoration">
            <div class="regex-tool__header-circle"></div>
            <div class="regex-tool__header-circle"></div>
            <div class="regex-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="regex-tool__input-card" shadow="hover">
            <template #header>
              <div class="regex-tool__card-header">
                <IconifyIconOnline icon="ri:code-box-line" class="regex-tool__card-icon" />
                <span>正则表达式</span>
              </div>
            </template>

            <el-form label-position="top">
              <!-- 操作类型选择 -->
              <el-form-item label="操作类型">
                <el-radio-group v-model="env.operationType" class="regex-tool__radio-group">
                  <el-radio label="test">
                    <div class="regex-tool__radio-content">
                      <IconifyIconOnline icon="ri:search-line" />
                      <span>测试匹配</span>
                    </div>
                  </el-radio>
                  <el-radio label="replace">
                    <div class="regex-tool__radio-content">
                      <IconifyIconOnline icon="ri:replace-line" />
                      <span>替换文本</span>
                    </div>
                  </el-radio>
                  <el-radio label="extract">
                    <div class="regex-tool__radio-content">
                      <IconifyIconOnline icon="ri:scissors-cut-line" />
                      <span>提取匹配项</span>
                    </div>
                  </el-radio>
                  <el-radio label="split">
                    <div class="regex-tool__radio-content">
                      <IconifyIconOnline icon="ri:separator" />
                      <span>分割文本</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 正则表达式输入 -->
              <el-form-item label="正则表达式">
                <div class="regex-tool__pattern-input">
                  <el-input v-model="env.pattern" placeholder="输入正则表达式，如：\d+" :class="{ 'is-invalid': !isValidRegex && env.pattern }" class="regex-tool__input">
                    <template #prefix>
                      <span class="regex-tool__pattern-delimiter">/</span>
                    </template>
                    <template #suffix>
                      <span class="regex-tool__pattern-delimiter">/</span>
                    </template>
                  </el-input>
                  <el-input v-model="env.flags" placeholder="标志" class="regex-tool__flags-input" />
                </div>
                <div v-if="!isValidRegex && env.pattern" class="regex-tool__error-message">
                  <IconifyIconOnline icon="ri:error-warning-line" />
                  <span>正则表达式语法错误</span>
                </div>
              </el-form-item>

              <!-- 测试文本 -->
              <el-form-item label="测试文本">
                <el-input v-model="env.testText" type="textarea" :rows="6" placeholder="输入要测试的文本" resize="vertical" class="regex-tool__input" />
              </el-form-item>

              <!-- 替换文本 (仅替换模式) -->
              <el-form-item v-if="env.operationType === 'replace'" label="替换为">
                <el-input v-model="env.replaceText" placeholder="输入替换文本，可使用$1, $2等引用捕获组" class="regex-tool__input">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:replace-line" />
                  </template>
                </el-input>
              </el-form-item>

              <!-- 示例选择 -->
              <el-form-item label="示例">
                <div class="regex-tool__examples">
                  <el-button v-for="example in env.examples" :key="example.name" size="small" @click="applyExample(example)">
                    {{ example.name }}
                  </el-button>
                </div>
              </el-form-item>

              <!-- 操作按钮 -->
              <div class="regex-tool__actions">
                <el-button type="primary" :loading="env.loading" :disabled="!isValidRegex && env.pattern" class="regex-tool__execute-btn" @click="executeOperation">
                  <IconifyIconOnline icon="ri:play-line" />
                  <span>执行操作</span>
                </el-button>

                <el-button class="regex-tool__clear-btn" @click="clearForm">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  <span>清空</span>
                </el-button>
              </div>
            </el-form>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <!-- 结果卡片 -->
          <el-card class="regex-tool__result-card" shadow="hover">
            <template #header>
              <div class="regex-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="regex-tool__card-icon" />
                <span>匹配结果</span>
              </div>
            </template>

            <el-empty
              v-if="(env.operationType === 'test' && !env.results.matches.length) || (env.operationType === 'replace' && !env.results.replaced) || (env.operationType === 'extract' && !env.results.extracted.length) || (env.operationType === 'split' && !env.results.split.length)"
              description="请先执行操作"
              class="regex-tool__empty"
            >
              <template #image>
                <IconifyIconOnline icon="ri:search-line" class="regex-tool__empty-icon" />
              </template>
            </el-empty>

            <!-- 测试匹配结果 -->
            <div v-if="env.operationType === 'test' && env.results.matches.length > 0" class="regex-tool__result-content">
              <div class="regex-tool__result-header">
                <span>找到 {{ env.results.matches.length }} 个匹配项</span>
              </div>
              <div v-for="(match, index) in env.results.matches" :key="index" class="regex-tool__match-item">
                <div class="regex-tool__match-header">
                  <span>匹配 #{{ index + 1 }} (位置: {{ match.index }})</span>
                  <el-button type="primary" link size="small" @click="copyToClipboard(match.fullMatch)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
                <div class="regex-tool__match-full">
                  <div class="regex-tool__match-label">完整匹配:</div>
                  <div class="regex-tool__match-value">{{ match.fullMatch }}</div>
                </div>
                <div v-if="match.groups && match.groups.length > 0" class="regex-tool__match-groups">
                  <div class="regex-tool__match-label">捕获组:</div>
                  <div v-for="(group, groupIndex) in match.groups" :key="groupIndex" class="regex-tool__match-group">
                    <span class="regex-tool__match-group-index">${{ groupIndex + 1 }}:</span>
                    <span class="regex-tool__match-group-value">{{ group }}</span>
                  </div>
                </div>
                <div class="regex-tool__match-context">
                  <div class="regex-tool__match-label">上下文:</div>
                  <div class="regex-tool__match-context-value" v-html="match.input"></div>
                </div>
              </div>
            </div>

            <!-- 替换结果 -->
            <div v-if="env.operationType === 'replace' && env.results.replaced" class="regex-tool__result-content">
              <div class="regex-tool__result-header">
                <span>替换结果</span>
                <el-button type="primary" link size="small" @click="copyToClipboard(env.results.replaced)">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </el-button>
              </div>
              <pre class="language-plaintext"><code>{{ env.results.replaced }}</code></pre>
            </div>

            <!-- 提取结果 -->
            <div v-if="env.operationType === 'extract' && env.results.extracted.length > 0" class="regex-tool__result-content">
              <div class="regex-tool__result-header">
                <span>提取了 {{ env.results.extracted.length }} 个匹配项</span>
                <el-button type="primary" link size="small" @click="copyToClipboard(env.results.extracted.join('\n'))">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </el-button>
              </div>
              <div class="regex-tool__extracted-list">
                <div v-for="(item, index) in env.results.extracted" :key="index" class="regex-tool__extracted-item">
                  <span>{{ index + 1 }}. </span>
                  <span>{{ item }}</span>
                  <el-button type="primary" link size="small" @click="copyToClipboard(item)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 分割结果 -->
            <div v-if="env.operationType === 'split' && env.results.split.length > 0" class="regex-tool__result-content">
              <div class="regex-tool__result-header">
                <span>文本被分割为 {{ env.results.split.length }} 部分</span>
                <el-button type="primary" link size="small" @click="copyToClipboard(env.results.split.join('\n'))">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </el-button>
              </div>
              <div class="regex-tool__split-list">
                <div v-for="(item, index) in env.results.split" :key="index" class="regex-tool__split-item">
                  <div class="regex-tool__split-item-header">
                    <span>片段 #{{ index + 1 }}</span>
                    <el-button type="primary" link size="small" @click="copyToClipboard(item)">
                      <IconifyIconOnline icon="ri:file-copy-line" />
                    </el-button>
                  </div>
                  <pre class="language-plaintext"><code>{{ item }}</code></pre>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 常用正则表达式卡片 -->
          <el-card class="regex-tool__common-card" shadow="hover">
            <template #header>
              <div class="regex-tool__card-header">
                <IconifyIconOnline icon="ri:bookmark-line" class="regex-tool__card-icon" />
                <span>常用正则表达式</span>
              </div>
            </template>

            <el-collapse accordion>
              <el-collapse-item v-for="(pattern, index) in env.commonPatterns.slice(0, 8)" :key="index" :name="index">
                <template #title>
                  <div class="regex-tool__common-pattern-title">
                    <span>{{ pattern.name }}</span>
                  </div>
                </template>
                <div class="regex-tool__common-pattern-content">
                  <div class="regex-tool__common-pattern-description">{{ pattern.description }}</div>
                  <div class="regex-tool__common-pattern-code">
                    <pre class="language-regex"><code>{{ pattern.pattern }}</code></pre>
                  </div>
                  <el-button type="primary" size="small" @click="applyCommonPattern(pattern)">
                    <IconifyIconOnline icon="ri:arrow-right-line" />
                    <span>应用</span>
                  </el-button>
                </div>
              </el-collapse-item>
            </el-collapse>

            <el-divider>
              <IconifyIconOnline icon="ri:more-line" />
            </el-divider>

            <el-popover placement="bottom" :width="400" trigger="click">
              <template #reference>
                <el-button class="regex-tool__more-patterns-btn">
                  <IconifyIconOnline icon="ri:list-check" />
                  <span>更多正则表达式</span>
                </el-button>
              </template>
              <div class="regex-tool__more-patterns">
                <el-table :data="env.commonPatterns" height="300" style="width: 100%">
                  <el-table-column prop="name" label="名称" width="100" />
                  <el-table-column prop="description" label="描述" width="180" />
                  <el-table-column label="操作" width="80">
                    <template #default="scope">
                      <el-button type="primary" link @click="applyCommonPattern(scope.row)"> 应用 </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-popover>
          </el-card>

          <!-- 正则表达式语法帮助卡片 -->
          <el-card class="regex-tool__help-card" shadow="hover">
            <template #header>
              <div class="regex-tool__card-header">
                <IconifyIconOnline icon="ri:question-line" class="regex-tool__card-icon" />
                <span>正则表达式语法帮助</span>
              </div>
            </template>

            <el-tabs>
              <el-tab-pane label="字符" name="character">
                <div class="regex-tool__help-content">
                  <div v-for="(item, index) in getRegexHelp('character')" :key="index" class="regex-tool__help-item">
                    <div class="regex-tool__help-symbol">{{ item.symbol }}</div>
                    <div class="regex-tool__help-description">{{ item.description }}</div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="锚点" name="anchor">
                <div class="regex-tool__help-content">
                  <div v-for="(item, index) in getRegexHelp('anchor')" :key="index" class="regex-tool__help-item">
                    <div class="regex-tool__help-symbol">{{ item.symbol }}</div>
                    <div class="regex-tool__help-description">{{ item.description }}</div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="量词" name="quantifier">
                <div class="regex-tool__help-content">
                  <div v-for="(item, index) in getRegexHelp('quantifier')" :key="index" class="regex-tool__help-item">
                    <div class="regex-tool__help-symbol">{{ item.symbol }}</div>
                    <div class="regex-tool__help-description">{{ item.description }}</div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="分组" name="group">
                <div class="regex-tool__help-content">
                  <div v-for="(item, index) in getRegexHelp('group')" :key="index" class="regex-tool__help-item">
                    <div class="regex-tool__help-symbol">{{ item.symbol }}</div>
                    <div class="regex-tool__help-description">{{ item.description }}</div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="标志" name="flag">
                <div class="regex-tool__help-content">
                  <div v-for="(item, index) in getRegexHelp('flag')" :key="index" class="regex-tool__help-item">
                    <div class="regex-tool__help-symbol">{{ item.symbol }}</div>
                    <div class="regex-tool__help-description">{{ item.description }}</div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>

      <!-- 历史记录 -->
      <el-card class="regex-tool__history-card" shadow="hover">
        <template #header>
          <div class="regex-tool__card-header">
            <IconifyIconOnline icon="ri:history-line" class="regex-tool__card-icon" />
            <span>历史记录</span>
          </div>
        </template>

        <el-empty v-if="!env.history.length" description="暂无历史记录" class="regex-tool__empty">
          <template #image>
            <IconifyIconOnline icon="ri:history-line" class="regex-tool__empty-icon" />
          </template>
        </el-empty>

        <el-table v-else :data="env.history" style="width: 100%">
          <el-table-column prop="date" label="日期" width="180" />
          <el-table-column prop="operation" label="操作" width="120" />
          <el-table-column prop="pattern" label="正则表达式" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="primary" link @click="loadFromHistory(scope.row)"> 加载 </el-button>
              <el-button type="danger" link @click="env.history.splice(env.history.indexOf(scope.row), 1)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.regex-tool {
  padding: 20px;
}
.regex-tool__header {
  /* 正则表达式工具专属渐变色 - 绿色调 */
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 8px;
  padding: 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}
.regex-tool__content {
  margin: 0 auto;
}

.regex-tool__header-container {
  margin-bottom: 24px;
}

.regex-tool__header {
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  border-radius: 8px;
  padding: 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.regex-tool__header-title {
  font-size: 28px;
  margin: 0 0 8px 0;
}

.regex-tool__header-subtitle {
  font-size: 16px;
  opacity: 0.8;
  margin: 0;
}

.regex-tool__header-decoration {
  display: flex;
  gap: 8px;
}

.regex-tool__header-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
}

.regex-tool__card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.regex-tool__card-icon {
  font-size: 20px;
}

.regex-tool__input-card,
.regex-tool__result-card,
.regex-tool__common-card,
.regex-tool__help-card,
.regex-tool__history-card {
  margin-bottom: 24px;
}

.regex-tool__radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.regex-tool__radio-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.regex-tool__pattern-input {
  display: flex;
  gap: 8px;
}

.regex-tool__input {
  width: 100%;
}

.regex-tool__flags-input {
  width: 80px;
}

.regex-tool__pattern-delimiter {
  color: #909399;
  font-weight: bold;
}

.regex-tool__error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.regex-tool__examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.regex-tool__actions {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.regex-tool__execute-btn,
.regex-tool__clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.regex-tool__empty {
  padding: 40px 0;
}

.regex-tool__empty-icon {
  font-size: 48px;
  color: #909399;
}

.regex-tool__result-content {
  padding: 16px;
}

.regex-tool__result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: bold;
}

.regex-tool__match-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.regex-tool__match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: bold;
}

.regex-tool__match-full,
.regex-tool__match-groups,
.regex-tool__match-context {
  margin-bottom: 8px;
}

.regex-tool__match-label {
  font-weight: bold;
  margin-bottom: 4px;
  color: #606266;
}

.regex-tool__match-value {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

.regex-tool__match-group {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.regex-tool__match-group-index {
  font-weight: bold;
  color: #409eff;
}

.regex-tool__match-context-value {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

.regex-tool__match-context-value mark {
  background-color: #ffeaa7;
  color: #2c3e50;
  padding: 0 2px;
  border-radius: 2px;
}

.regex-tool__extracted-list,
.regex-tool__split-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.regex-tool__extracted-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
}

.regex-tool__split-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.regex-tool__split-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.regex-tool__common-pattern-title {
  font-weight: bold;
}

.regex-tool__common-pattern-content {
  padding: 16px;
}

.regex-tool__common-pattern-description {
  margin-bottom: 8px;
  color: #606266;
}

.regex-tool__common-pattern-code {
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-family: monospace;
}

.regex-tool__more-patterns-btn {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.regex-tool__help-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.regex-tool__help-item {
  display: flex;
  gap: 16px;
  padding: 8px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.regex-tool__help-symbol {
  font-family: monospace;
  font-weight: bold;
  color: #409eff;
  min-width: 80px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .regex-tool__radio-group {
    flex-direction: column;
    gap: 8px;
  }

  .regex-tool__pattern-input {
    flex-direction: column;
  }

  .regex-tool__flags-input {
    width: 100%;
  }

  .regex-tool__actions {
    flex-direction: column;
  }
}
</style>
