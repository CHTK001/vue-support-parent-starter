<template>
  <div class="ic">
    <div class="ic-inner">
      <header class="ic-head">
        <h1 class="ic-title">
          成语接龙
          <span class="ic-title__dot" />
        </h1>
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
/*
 * 视觉基准：成语消消乐（IdiomGameView.vue 的 .ig-page / .ig-title / .ig-card）。
 *
 * 本视图原先是「720px 窄栏 + 落宿主灰底 + 22px 黑标题」，实测计算样式
 * （bg-image=none、标题 22px、卡片是灰块无边框），与其余四个内嵌模块
 * 差了一个色系 —— 学生看到的是「后台表单」而不是「游戏」。这里整体对齐：
 *   地面  linear-gradient(160deg, primary, primary-dark-2)，满幅不收窄
 *   标题  白字 / 40px / 900 / letter-spacing 3px + 白圆点
 *   卡片  --el-bg-color 底 + 1px --el-border-color-lighter 边 + 不加投影
 *
 * 地面要满幅、内容要限宽，所以多一层 .ic-inner：渐变归 .ic，宽度约束归 .ic-inner。
 * （若把 max-width 留在 .ic 上，渐变只铺中间 760px，两侧会露出宿主灰底。）
 */
.ic {
  min-height: 100%;
  padding: 4px 0 28px;
  background: linear-gradient(160deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
}
.ic-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 标题：与基准 .ig-title 同一套（白字压在主色带上，靠描边阴影保证可读性） */
.ic-head {
  margin-bottom: 4px;
}
.ic-title {
  margin: 0;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.ic-title__dot {
  width: 14px;
  height: 14px;
  /* 纯圆点用圆形令牌，不占 --el-radius-* 六档（那六档是圆角矩形语义） */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-white);
  /* 装饰性光环（0 偏移 0 模糊），不是卡片投影：只描一圈主色，压在主色底上略深 */
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}
/* 副标题压在主色带上：白字降一档透明度，深色模式下主色更深、白字仍可读 */
.ic-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-color-white);
  opacity: 0.86;
}
.ic-sub b {
  opacity: 1;
}

/* 回落提示：浅色警示块本身自带底，白底上直接放即可 */
.ic-scope {
  margin: 12px 0 0;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-radius: var(--el-radius-sm, 6px);
}

/* 进度条 / 按钮行：升格成白卡（原为透明，压在渐变上按钮会糊） */
.ic-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 12px;
  padding: 12px 18px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
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
/* 基准的胶囊控件高 36px；el-button--small 默认 24px（刚好卡 AA 底线），这里抬到同一手感 */
.ic-bar :deep(.el-button) {
  min-height: 36px;
  padding: 0 16px;
  border-radius: var(--el-radius-full, 9999px);
  font-weight: 600;
}

/* 空态：el-empty 自带浅灰插图与灰字，直接压主色底会看不清，整块给白卡 */
.ic-empty {
  padding: 30px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}

/* 当前成语：白卡 + 边框（原为 --el-fill-color-lighter 灰块） */
.ic-current {
  padding: 20px 22px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  border: 1px solid var(--el-border-color-lighter);
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
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
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
/* 回显消息：做成白卡 + 左侧色条，色条取文字自身颜色（对错两态自动跟随） */
.ic-msg {
  margin: 12px 0 0;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 4px solid currentColor;
  border-radius: var(--el-radius-lg, 12px);
}
.ic-msg.is-ok {
  color: var(--el-color-success);
}

/* 已接链：整块一张白卡，行间用虚线分隔 */
.ic-chain {
  margin-top: 16px;
  padding: 6px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}
.ic-chain__row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.ic-chain__row:last-child {
  border-bottom: 0;
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

/*
 * 窄屏（≤640px）：
 *  - 标题收到 28px（40px 在 390px 宽下 5 个字 + 3px 字距会顶到边）
 *  - 输入行竖排：横排时 el-input 被挤到 ~180px，按钮跟着变窄
 *  - 释义换行显示，不再单行省略号截断（接龙链的释义是学生要读的正文）
 */
@media (max-width: 640px) {
  .ic-title {
    font-size: 28px;
    letter-spacing: 2px;
  }
  .ic-inner {
    padding: 0 14px;
  }
  .ic-bar {
    padding: 12px 14px;
    flex-wrap: wrap;
  }
  .ic-bar__step {
    flex: 1 1 100%;
  }
  .ic-input {
    flex-direction: column;
  }
  .ic-input :deep(.el-input),
  .ic-input :deep(.el-button) {
    width: 100%;
  }
  .ic-chain {
    padding: 6px 12px;
  }
  .ic-chain__row {
    flex-wrap: wrap;
  }
  .ic-chain__mean {
    flex: 1 1 100%;
    white-space: normal;
  }
}

/*
 * 触摸设备：可点控件抬到 44px。
 * WCAG 2.2 的 2.5.8（AA）底线是 24×24，上面已满足；这里做 2.5.5（AAA）的加分档，
 * 与基准 .ig-chip 的 36px 桌面档区分开。
 */
@media (pointer: coarse) {
  .ic-bar :deep(.el-button),
  .ic-input :deep(.el-button) {
    min-height: 44px;
  }
  .ic-input :deep(.el-input__wrapper) {
    min-height: 44px;
  }
}
</style>
