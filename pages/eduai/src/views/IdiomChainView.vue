<template>
  <div class="ic">
    <header class="ic-head">
      <h2 class="ic-title">成语接龙</h2>
      <p class="ic-sub">下一个成语的<b>首字</b>要接上当前成语的<b>末字</b>。</p>
    </header>

    <p v-if="scopeAll" class="ic-scope">本学段还没有可接续的成语，已改用全库成语出题。</p>

    <div class="ic-bar">
      <span class="ic-bar__step">已接 <b>{{ chain.length - 1 }}</b> / {{ target }}</span>
      <el-button size="small" @click="start">换一题</el-button>
      <el-button size="small" :disabled="!current || finished" @click="hint">提示</el-button>
    </div>

    <div v-if="!current" class="ic-empty">
      <el-empty description="正在出题…" />
    </div>

    <template v-else>
      <!-- 当前成语 -->
      <div class="ic-current">
        <div class="ic-current__label">当前成语</div>
        <div class="ic-current__word">
          <span v-for="(ch, i) in chars(current.content)" :key="i" :class="{ 'is-anchor': i === current.content.length - 1 }">{{ ch }}</span>
        </div>
        <div class="ic-current__meta">
          <span v-if="current.pinyin">{{ current.pinyin }}</span>
          <span v-if="current.meaning">· {{ current.meaning }}</span>
        </div>
        <div class="ic-current__tip">请用「<b>{{ lastChar }}</b>」开头的成语接龙</div>
      </div>

      <!-- 输入 -->
      <div class="ic-input">
        <el-input
          v-model="answer"
          :disabled="finished"
          placeholder="输入成语后回车"
          size="large"
          maxlength="8"
          @keyup.enter="submit"
        />
        <el-button type="primary" size="large" :disabled="finished" @click="submit">接龙</el-button>
      </div>
      <p v-if="message" class="ic-msg" :class="{ 'is-ok': lastOk }">{{ message }}</p>

      <!-- 链 -->
      <div class="ic-chain">
        <div v-for="(it, i) in chain" :key="i" class="ic-chain__row">
          <span class="ic-chain__idx">{{ i + 1 }}</span>
          <span class="ic-chain__word">{{ it.content }}</span>
          <span v-if="it.meaning" class="ic-chain__mean">{{ it.meaning }}</span>
        </div>
      </div>

      <el-alert v-if="finished" type="success" :closable="false" class="ic-done" title="太棒了，接龙完成！" />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * IdiomChainView —— 成语接龙（内嵌于学生门户；题目由服务端自动生成）。
 *
 * <p>规则：下一个成语的首字 = 当前成语的末字。答案由服务端校验
 * （{@code /v2/edu/idiom/chain/validate}），前端拿不到答案，避免直接通关。</p>
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../api/eduaiApi";

/**
 * 可选学段：父组件（学生端）会传当前学段。
 *
 * 未传时按全库出题；传了但该学段没有可接续的成语时，服务端会回落全库
 * 并把 {@code scope} 置为 {@code all}，界面据此给出说明而不是让学生看到错误页。
 */
const props = defineProps<{ level?: string }>();

interface ChainItem {
  content: string;
  pinyin?: string | null;
  meaning?: string | null;
}

const chain = ref<ChainItem[]>([]);
const target = ref(5);
const answer = ref("");
const message = ref("");
const lastOk = ref(false);
const finished = ref(false);
/** 是否用了「全库回落」（本学段无内容） */
const scopeAll = ref(false);

const current = computed<ChainItem | null>(() => (chain.value.length ? chain.value[chain.value.length - 1] : null));
const lastChar = computed(() => {
  const c = current.value?.content;
  return c ? c.substring(c.length - 1) : "";
});

/** 拆字用于高亮末字 */
function chars(word: string): string[] {
  return Array.from(word ?? "");
}

async function start() {
  chain.value = [];
  answer.value = "";
  message.value = "";
  finished.value = false;
  scopeAll.value = false;
  try {
    const res = await eduaiApi.idiomChainStart({ length: 5, gradeLevel: props.level });
    target.value = Math.max(1, res?.length ?? 5);
    scopeAll.value = res?.scope === "all" && !!props.level;
    if (res?.start?.content) {
      chain.value = [{ content: res.start.content, pinyin: res.start.pinyin, meaning: res.start.meaning }];
    } else {
      ElMessage.warning("成语库不足，暂时无法出题");
    }
  } catch (e) {
    ElMessage.error(`出题失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function submit() {
  const cur = current.value;
  if (!cur) {
    return;
  }
  const text = answer.value.trim();
  if (!text) {
    return;
  }
  try {
    const res = await eduaiApi.idiomChainValidate({ current: cur.content, answer: text });
    lastOk.value = !!res?.ok;
    message.value = res?.ok ? `接上啦：${res.content}` : (res?.message || "接龙不对哦");
    if (res?.ok) {
      chain.value.push({ content: res.content || text, pinyin: res.pinyin, meaning: res.meaning });
      answer.value = "";
      if (chain.value.length - 1 >= target.value) {
        finished.value = true;
      }
    }
  } catch (e) {
    ElMessage.error(`校验失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function hint() {
  const cur = current.value;
  if (!cur) {
    return;
  }
  try {
    const res = await eduaiApi.idiomChainHint(cur.content);
    if (res?.ok && res.content) {
      answer.value = res.content;
      message.value = `提示：${res.content}${res.meaning ? "（" + res.meaning + "）" : ""}`;
      lastOk.value = true;
    } else {
      message.value = "这个字暂时没有可接的成语，换一题吧";
      lastOk.value = false;
    }
  } catch (e) {
    ElMessage.error(`提示失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

onMounted(() => {
  void start();
});
</script>

<style scoped>
.ic {
  padding: 18px 20px 28px;
  max-width: 720px;
  margin: 0 auto;
}
.ic-title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.ic-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ic-scope {
  margin: 12px 0 0;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-radius: var(--el-radius-sm, 6px);
}
.ic-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0 12px;
}
.ic-bar__step {
  margin-right: auto;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.ic-bar__step b {
  color: var(--el-color-primary);
  font-size: 18px;
}
.ic-current {
  padding: 18px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-fill-color-lighter);
  text-align: center;
}
.ic-current__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ic-current__word {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 8px 0 6px;
}
.ic-current__word span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 26px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.ic-current__word span.is-anchor {
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-color: transparent;
}
.ic-current__meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ic-current__tip {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.ic-current__tip b {
  color: var(--el-color-primary);
  font-size: 16px;
}
.ic-input {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.ic-msg {
  margin: 10px 2px 0;
  font-size: 13px;
  color: var(--el-color-danger);
}
.ic-msg.is-ok {
  color: var(--el-color-success);
}
.ic-chain {
  margin-top: 16px;
}
.ic-chain__row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.ic-chain__idx {
  flex: none;
  width: 22px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.ic-chain__word {
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.ic-chain__mean {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ic-done {
  margin-top: 16px;
}
</style>
