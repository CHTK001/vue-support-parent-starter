<script setup lang="ts">
/**
 * ScriptSourceField —— 代码片段正文字段：只读 code 预览，点击弹出编辑器
 *
 * 预览保持紧凑（超长内部滚动），点击预览（或回车）打开编辑器弹层，
 * 保存后回写 v-model；供 ReForm 自定义字段使用（modelValue / update:modelValue / change）。
 *
 * lang 是脚本引擎名（java / groovy），mode 决定正文形态，两者共同决定弹层标题、占位提示、
 * 插入模板与底部说明：
 *   - mode=file：完整文件（完整 Java 类 / 完整 Groovy 脚本），原样交 ScriptProvider 预编译；
 *   - mode=fragment：只写 @Job 方法的**方法体**，类名、包名、入口签名、import 由后端
 *     GlueScriptSynthesizer 生成后再交同一引擎编译。
 *
 * lang 允许任意引擎名（SPI 运行时枚举可能有第三个引擎），未知引擎按 groovy 的文案兜底。
 */
import { computed, ref, watch } from "vue";
import ReDialog from "@repo/ui/re-dialog";

/** 片段语言：与后端 sys_job_glue_type 一一对应（保留旧名以兼容既有调用） */
export type GlueLang = "groovy" | "java" | "python";

const props = withDefaults(
  defineProps<{
    /** 片段正文 */
    modelValue?: string;
    /** 空态占位文案 */
    placeholder?: string;
    /** 预览下方说明 */
    description?: string;
    /** 片段语言（引擎名）；未知引擎按 groovy 兜底 */
    lang?: GlueLang | string;
    /** 正文形态：file=完整文件（默认），fragment=只写方法体 */
    mode?: "file" | "fragment";
  }>(),
  { modelValue: "", placeholder: "", description: "", lang: "groovy", mode: "file" },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

/** 编辑器弹层显隐 */
const visible = ref(false);
/** 编辑草稿：确认后才回写，取消不影响原值 */
const draft = ref("");

/** 是否 Java 引擎（未知引擎按 groovy 兜底，这里只认权威值 java） */
const isJava = computed(() => props.lang === "java");
/** 是否片段形态：只写方法体 */
const isFragment = computed(() => props.mode === "fragment");

/** 弹层标题：形态 + 语言共同决定 */
const dialogTitle = computed(() => {
  const label = isJava.value ? "Java" : "Groovy";
  const shape = isFragment.value
    ? (isJava.value ? "方法体" : "片段")
    : (isJava.value ? "完整类" : "完整文件");
  return `编辑代码片段（${label} · ${shape}）`;
});

/** 编辑器占位提示（含换行，模板属性里用绑定传入） */
const editorPlaceholder = computed(() => {
  if (props.lang === "python") {
    return isFragment.value
      ? "只写 Python 语句：不要写 if __name__ 入口块。\n上下文里的键都已成为全局变量，也可用 ctx / context 取整个字典；定义 execute(ctx) 或 main(ctx) 作为入口，返回值即结果。"
      : "写完整 Python 脚本：可 import / 定义函数与类。\n上下文键已成为全局变量，也可用 ctx / context；定义 execute(ctx) 或 main(ctx) 作为入口，或用全局变量 result 作为返回值。";
  }
  if (isFragment.value) {
    return isJava.value
      ? "只写方法体：不要写 package / class / import / @Job。\n类名、包名、入口方法与 import 由后端合成；可直接用 objectContext 与 environment。"
      : "只写 @Job 方法的方法体（Groovy 裸语句）：不要写 class / @Job。\n入口与类名由后端合成；可用变量 jobName / objectContext / executeParam，最后一条表达式即返回值";
  }
  return isJava.value
    ? "写完整 Java 类源码：package / import / class / @Job 入口方法都要自己写，保存时由 java 引擎预编译校验。"
    : "写完整 Groovy 脚本文件：保存时由 groovy 引擎预编译校验；可用变量 jobName / objectContext / executeParam";
});

/** 弹层底部说明：脚本与片段两条链路的运行前提不同，必须说清 */
const editorTip = computed(() => {
  if (props.lang === "python") {
    return isFragment.value
      ? "执行器需在 PATH 中装有 Python 3；片段正文按 Python 裸语句执行，入口为 execute(ctx) 或 main(ctx)，返回值即结果。"
      : "执行器需在 PATH 中装有 Python 3；整份脚本以子进程运行，可 import 本机已装的三方库，入口为 execute(ctx) 或 main(ctx)，返回值即结果。";
  }
  if (isFragment.value) {
    return isJava.value
      ? "执行器需在 JDK 下运行（后端把方法体合成完整类后交 java 引擎编译）；字段上的 @Autowired 已自动装配，取 bean 也可写 objectContext.getBean(Xxx.class)。"
      : "执行器需安装脚本引擎（utils-support-groovy-starter）；脚本类上的 @Autowired 已自动装配，脚本里 new 出来的对象要显式 objectContext.inject(对象)，取 bean 也可写 objectContext.getBean(Xxx.class)。";
  }
  return isJava.value
    ? "执行器需在 JDK 下运行（java 引擎编译整个类）；入口方法加 @Job 注解、命名为 execute，或保证类里只有一个 public 方法。字段 @Autowired 已自动装配。"
    : "执行器需安装脚本引擎（utils-support-groovy-starter）；整份脚本原样编译执行。脚本类字段 @Autowired 已自动装配，脚本里 new 的对象要显式 objectContext.inject(对象)。";
});

/**
 * Java 片段模板：**只写方法体**。
 *
 * 后端 GlueScriptSynthesizer 会把这段正文包进
 * `public class Glue<hash> { @Job(...) public void execute(JobObjectContext objectContext) { ... } }`，
 * 并预置 import 与一个已装配的 environment 字段，所以这里
 *   - 不能写 package / class / import / @Job 注解（写了就会被包进方法体里 → 必然编译失败）
 *   - objectContext（JobObjectContext）与 environment（Environment）可直接用
 */
const JAVA_FRAGMENT_SAMPLE = `// 只写方法体：类名 / 入口方法 / import 由后端合成
// 可用变量：objectContext（JobObjectContext）；字段加 @Autowired 可注入 Bean
objectContext.log("开始执行 job={}", objectContext.getJobKey());
`;

/**
 * Java 完整文件模板：包名 / 类名 / @Job 入口方法都要自己写，整类交 java 引擎预编译。
 */
const JAVA_FILE_SAMPLE = `package com.example.job;

import com.chua.starter.job.support.annotation.Job;
import com.chua.starter.job.support.glue.JobObjectContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

public class MyGlueJob {

    @Autowired
    private Environment environment;

    @Job("my-glue-job")
    public void execute(JobObjectContext objectContext) {
        objectContext.log("开始执行 job={}", objectContext.getJobKey());
        String app = environment.getProperty("spring.application.name", "unknown");
        objectContext.log("应用={} 处理完成", app);
    }
}
`;

/** Groovy 片段模板：Groovy 允许裸语句，直接写 @Job 方法体 */
const GROOVY_FRAGMENT_SAMPLE = `// 只写 @Job 方法的方法体（Groovy 裸语句），入口与类名由后端合成
// 可用变量：jobName / objectContext / executeParam；最后一条表达式即返回值
objectContext.log("开始执行 job={}", jobName)
return "ok " + jobName
`;

/** Groovy 完整文件模板：整份脚本原样交 groovy 引擎预编译 */
const GROOVY_FILE_SAMPLE = `// 完整 Groovy 脚本文件：可写 import / 类 / 方法，保存时整份预编译
// 可用变量：jobName / objectContext / executeParam
import java.time.LocalDateTime

objectContext.log("开始执行 {} at {}", jobName, LocalDateTime.now())
return "ok " + jobName
`;

/**
 * Python 片段模板：Python 允许裸语句，正文原样作为脚本执行。
 *
 * 与 Groovy 片段同一口径：上下文里的键都成了全局变量，入口优先取 execute(ctx) / main(ctx)。
 */
const PYTHON_FRAGMENT_SAMPLE = `# 只写语句：入口为 execute(ctx) 或 main(ctx)，返回值即结果
# 上下文键已成为全局变量，也可用 ctx 取整个字典
def execute(ctx):
    ctx_log = "开始执行 " + str(ctx.get("jobName", ""))
    return {"ok": True, "message": ctx_log}
`;

/** Python 完整文件模板：可 import 本机三方库，整份脚本以子进程运行 */
const PYTHON_FILE_SAMPLE = `# 完整 Python 脚本：可 import 本机已安装的三方库
# 上下文键已成为全局变量，也可用 ctx 取整个字典
import json


def execute(ctx):
    job = ctx.get("jobName", "unknown")
    payload = {"job": job, "ok": True}
    return json.dumps(payload, ensure_ascii=False)
`;

/** 当前形态 + 语言对应的插入模板 */
const sampleText = computed(() => {
  if (props.lang === "python") {
    return isFragment.value ? PYTHON_FRAGMENT_SAMPLE : PYTHON_FILE_SAMPLE;
  }
  if (isFragment.value) {
    return isJava.value ? JAVA_FRAGMENT_SAMPLE : GROOVY_FRAGMENT_SAMPLE;
  }
  return isJava.value ? JAVA_FILE_SAMPLE : GROOVY_FILE_SAMPLE;
});

/** 草稿为空时才给「插入模板」，避免盖掉已写内容 */
const canInsertSample = computed(() => !draft.value.trim());

/** 把模板写进草稿（仍在弹层内，取消不会回写） */
function insertSample(): void {
  draft.value = sampleText.value;
}

/** 高亮片段：cls 为空表示普通文本 */
interface CodeToken {
  text: string;
  cls: string;
}

/** Groovy/Java 常用关键字（够脚本预览用，不引三方高亮库） */
const KEYWORDS =
  "def|class|interface|enum|new|return|if|else|for|while|do|switch|case|default|break|continue|throw|throws|try|catch|finally|import|package|static|final|void|int|long|double|float|boolean|char|byte|short|in|as|instanceof|assert|true|false|null|this|super|extends|implements|synchronized|volatile|transient";

/** 高亮规则顺序：注释 → 字符串 → 注解 → 关键字 → 数字 → 标识符 */
const TOKEN_RE = new RegExp(
  `(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|('(?:\\\\.|[^'\\\\])*'|"(?:\\\\.|[^"\\\\])*")|(@[A-Za-z_][\\w.]*)|\\b(${KEYWORDS})\\b|\\b\\d+(?:\\.\\d+)?\\b|[A-Za-z_$][\\w$]*`,
  "g",
);

/**
 * 把脚本源码切为高亮片段。
 *
 * @param source 源码
 * @return 片段列表
 */
function tokenize(source: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let last = 0;
  let matched: RegExpExecArray | null;
  while ((matched = re.exec(source)) !== null) {
    if (matched.index > last) {
      tokens.push({ text: source.slice(last, matched.index), cls: "" });
    }
    const [full, comment, str, annotation, keyword] = matched;
    let cls = "";
    if (comment) {
      cls = "tok-comment";
    } else if (str) {
      cls = "tok-string";
    } else if (annotation) {
      cls = "tok-annotation";
    } else if (keyword) {
      cls = "tok-keyword";
    } else if (/^\d/.test(full)) {
      cls = "tok-number";
    }
    tokens.push({ text: full, cls });
    last = matched.index + full.length;
  }
  if (last < source.length) {
    tokens.push({ text: source.slice(last), cls: "" });
  }
  return tokens;
}

/** 预览高亮片段（空源码时给空数组） */
const tokens = computed<CodeToken[]>(() => (props.modelValue ? tokenize(props.modelValue) : []));

/** 打开编辑器：以当前值为草稿 */
function open(): void {
  draft.value = props.modelValue ?? "";
  visible.value = true;
}

/** 保存草稿并回写 */
function confirm(): void {
  const value = draft.value;
  emit("update:modelValue", value);
  emit("change", value);
  visible.value = false;
}

watch(
  () => props.modelValue,
  (value) => {
    if (!visible.value) {
      draft.value = value ?? "";
    }
  },
);
</script>

<template>
  <div class="script-source">
    <div
      class="script-source__preview"
      :class="{ 'is-empty': !modelValue }"
      role="button"
      tabindex="0"
      @click="open"
      @keydown.enter.prevent="open"
    >
      <pre v-if="modelValue" class="script-source__code"><span
        v-for="(token, index) in tokens"
        :key="index"
        :class="token.cls"
      >{{ token.text }}</span></pre>
      <span v-else class="script-source__placeholder">{{ placeholder || "点击编辑脚本正文" }}</span>
      <span class="script-source__hint">点击编辑</span>
    </div>
    <div v-if="description" class="script-source__desc">{{ description }}</div>

    <ReDialog v-model="visible" :title="dialogTitle" width="880px" top="6vh" :footer-hidden="false" @ok="confirm">
      <textarea
        v-model="draft"
        class="script-source__editor"
        rows="20"
        spellcheck="false"
        :placeholder="editorPlaceholder"
      />
      <div class="script-source__editor-tip">
        <button v-if="canInsertSample" type="button" class="script-source__sample-btn" @click="insertSample">
          插入模板
        </button>
        <span>{{ editorTip }}</span>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
.script-source {
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* 占满整行（不做随内容变化的自适应宽度） */
  width: 100%;
}

/* 预览卡片：代码块整行铺满，长正文内部滚动 */
.script-source__preview {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--rm-border, var(--el-border-color-light));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  cursor: text;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.script-source__preview:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color-light));
  background: var(--el-bg-color);
}

.script-source__preview:focus-visible {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.script-source__preview.is-empty {
  cursor: pointer;
}

.script-source__code {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  max-height: 220px;
  overflow: auto;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
  tab-size: 4;
}

/* 轻量语法高亮（Groovy/Java 常用形态） */
.script-source__code .tok-comment {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.script-source__code .tok-string {
  color: var(--el-color-success);
}

.script-source__code .tok-keyword {
  color: var(--el-color-primary);
  font-weight: 600;
}

.script-source__code .tok-number {
  color: var(--el-color-warning);
}

.script-source__code .tok-annotation {
  color: var(--el-color-info);
}

.script-source__placeholder {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  line-height: 1.6;
}

.script-source__hint {
  position: absolute;
  right: 10px;
  bottom: 6px;
  padding: 0 6px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  line-height: 18px;
  pointer-events: none;
}

.script-source__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

/* 编辑器：大号等宽输入区 */
.script-source__editor {
  width: 100%;
  min-height: 420px;
  box-sizing: border-box;
  resize: vertical;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.7;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.script-source__editor:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color-light));
}

.script-source__editor:focus {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.script-source__editor-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

/* 插入模板：与提示同排的轻量动作，不抢正文的视觉权重 */
.script-source__sample-btn {
  flex: none;
  padding: 0 10px;
  height: 26px;
  line-height: 24px;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.script-source__sample-btn:hover {
  background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-color: var(--el-color-primary);
}
</style>
