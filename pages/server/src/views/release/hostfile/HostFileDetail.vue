<script setup lang="ts">
/**
 * 主机文件详情面板（右侧）。
 *
 * <p>回答「这个文件是什么、能不能直接用」：类型、大小、时间、存储内 key、
 * 主机绝对路径可复制、MD5 按需计算、文本可预览、图片可看原图。
 * 能力按存储后端如实显示 —— 对象存储上不出现「算 MD5」这种点了会失败的按钮。</p>
 *
 * <p>信息架构（2026-11-14 改版）：头部归档卡（类型色 + 徽标 + 路径）→
 * 概览 KPI 区（两列网格）→ 位置复制卡（等宽代码风格）→ 指纹 → 预览 →
 * 底部操作条（主操作下载 + 重命名 + 删除）。全部沿用 koi 令牌，
 * 深色模式自然跟随，不新增自造皮肤。</p>
 *
 * @author CH
 * @since 4.0.0.62
 */
import { computed, ref, watch } from "vue";
import { message } from "@repo/core";
import ReIcon from "@repo/ui/re-icon";
import type { ReleaseHostFileItem } from "../../../api/releaseHostFile";
import {
  downloadReleaseHostFile,
  getReleaseHostFileMd5,
  readReleaseHostFileText,
} from "../../../api/releaseHostFile";
import { toastError } from "../../../utils/errors";
import {
  absoluteOf,
  badgeOf,
  formatDateTime,
  formatSize,
  kindIcon,
  kindLabel,
  kindTone,
} from "../../../utils/hostFileUi";

const props = withDefaults(
  defineProps<{
    /** 当前条目；为空时面板不显示内容 */
    item: ReleaseHostFileItem | null;
    /** 存储根（展示主机绝对路径用） */
    root?: string;
    /** 存储提供者名 */
    bucket?: string;
    /** 是否本地存储（MD5 仅在本地可用） */
    local?: boolean;
  }>(),
  { root: "", bucket: "", local: true },
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "rename", item: ReleaseHostFileItem): void;
  (e: "remove", item: ReleaseHostFileItem): void;
}>();

/** MD5 结果缓存：同一个文件重复点没意义 */
const md5 = ref("");
const md5Loading = ref(false);

/** 文本预览内容 */
const text = ref("");
const textLoading = ref(false);
const textError = ref("");

/** 图片预览地址（objectURL，关闭时释放） */
const imageUrl = ref("");
const imageLoading = ref(false);

/** 当前条目的展示信息 */
const kind = computed(() => props.item?.kind ?? "other");
const isImage = computed(() => kind.value === "image");
const isText = computed(() => kind.value === "text" || kind.value === "code");
const absolute = computed(() => (props.item ? absoluteOf(props.root, props.item.key) : ""));

/**
 * 复制到剪贴板（非安全上下文回退）。
 *
 * @param text 待复制文本
 * @param label 提示里的对象名
 */
async function copy(text: string, label: string): Promise<void> {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success(`已复制${label}`);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    if (ok) {
      message.success(`已复制${label}`);
    } else {
      message.warning("浏览器不允许自动复制，请手动选中");
    }
  }
}

/** 计算 MD5 */
async function computeMd5(): Promise<void> {
  if (!props.item || md5Loading.value) {
    return;
  }
  md5Loading.value = true;
  try {
    const data = await getReleaseHostFileMd5(props.item.key, props.bucket);
    md5.value = data?.md5 || "";
  } catch (e) {
    toastError(e, "计算 MD5 失败");
  } finally {
    md5Loading.value = false;
  }
}

/** 下载文件 */
async function download(): Promise<void> {
  if (!props.item) {
    return;
  }
  try {
    const blob = await downloadReleaseHostFile(props.item.key, props.bucket);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = props.item.name;
    link.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    toastError(e, "下载失败");
  }
}

/** 载入文本预览 */
async function loadText(): Promise<void> {
  if (!props.item || textLoading.value) {
    return;
  }
  textLoading.value = true;
  textError.value = "";
  try {
    text.value = (await readReleaseHostFileText(props.item.key, props.bucket)) ?? "";
  } catch (e) {
    textError.value = (e as Error)?.message || "读取失败";
  } finally {
    textLoading.value = false;
  }
}

/** 载入图片预览 */
async function loadImage(): Promise<void> {
  if (!props.item || imageLoading.value) {
    return;
  }
  imageLoading.value = true;
  try {
    const blob = await downloadReleaseHostFile(props.item.key, props.bucket, true);
    imageUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    toastError(e, "预览失败");
  } finally {
    imageLoading.value = false;
  }
}

/** 释放 objectURL */
function releaseImage(): void {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = "";
  }
}

/** 换条目 / 关面板时清空上一次的预览与指纹 */
watch(
  () => props.item?.key,
  () => {
    // 列表条目已带台账 md5 时直接使用，不再重复调用服务端计算
    md5.value = props.item?.md5 || "";
    text.value = "";
    textError.value = "";
    releaseImage();
    if (!props.item) {
      return;
    }
    if (isText.value) {
      void loadText();
    }
  },
);

/** 图片类型点击「看原图」 */
function previewImage(): void {
  if (!imageUrl.value) {
    void loadImage();
    return;
  }
  window.open(imageUrl.value, "_blank");
}
</script>

<template>
  <aside v-if="item" class="hfd">
    <!-- ============ 归档卡头部 ============ -->
    <header class="hfd-head">
      <div class="hfd-head-top">
        <span class="hfd-tile" :class="`hfd-tile--${kindTone(kind)}`">
          <ReIcon :name="kindIcon(kind)" :size="20" />
        </span>
        <div class="hfd-title">
          <b class="hfd-name" :title="item.name">{{ item.name }}</b>
          <div class="hfd-sub">
            <b class="hfd-badge" :class="`hfd-badge--${kindTone(kind)}`">{{ badgeOf(item) }}</b>
            <span class="hfd-subtext">{{ kindLabel(kind) }}<template v-if="item.ext"> · {{ item.ext }}</template></span>
          </div>
        </div>
        <button type="button" class="hfd-x" title="关闭" @click="emit('close')">
          <ReIcon name="Close" :size="14" />
        </button>
      </div>
      <!-- 存储内路径：一条可复制的等宽行，粘在头部下方 -->
      <button type="button" class="hfd-key mono" :title="`${item.key}（点击复制）`" @click="copy(item.key, '存储路径')">
        <ReIcon name="FolderOpened" :size="11" />
        <span class="hfd-key-text">{{ item.key || "/（存储根）" }}</span>
        <ReIcon name="CopyDocument" :size="12" class="hfd-key-copy" />
      </button>
    </header>

    <!-- ============ 正文 ============ -->
    <div class="hfd-body">
      <!-- 概览 KPI：两列网格，一眼读完大小 / 时间 / 类型 -->
      <section class="hfd-overview">
        <div class="hfd-kpi">
          <span class="hfd-kpi-label">大小</span>
          <b class="hfd-kpi-value">{{ item.directory ? "—" : formatSize(item.size) }}</b>
        </div>
        <div class="hfd-kpi">
          <span class="hfd-kpi-label">修改时间</span>
          <b class="hfd-kpi-value hfd-kpi-value--sm">{{ formatDateTime(item.lastModified) }}</b>
        </div>
        <div class="hfd-kpi">
          <span class="hfd-kpi-label">类型</span>
          <b class="hfd-kpi-value">{{ kindLabel(kind) }}</b>
        </div>
        <div class="hfd-kpi">
          <span class="hfd-kpi-label">存储位置</span>
          <b class="hfd-kpi-value hfd-kpi-value--sm">{{ item.directory ? "目录" : "文件" }}</b>
        </div>
      </section>

      <!-- 位置：主机绝对路径（仅本地存储且非目录） -->
      <section v-if="!item.directory && absolute" class="hfd-sec">
        <header class="hfd-sec-head">
          <span class="hfd-sec-title">主机绝对路径</span>
          <span class="hfd-hint-inline">发布投放用</span>
        </header>
        <button
          type="button"
          class="hfd-copyrow mono"
          :title="`${absolute}（点击复制）`"
          @click="copy(absolute, '主机路径')"
        >
          <span class="hfd-copyrow-text">{{ absolute }}</span>
          <ReIcon name="CopyDocument" :size="12" class="hfd-copyrow-ico" />
        </button>
      </section>

      <!-- 指纹 -->
      <section v-if="!item.directory" class="hfd-sec">
        <header class="hfd-sec-head">
          <span class="hfd-sec-title">指纹</span>
          <button
            v-if="local"
            type="button"
            class="hfd-mini"
            :disabled="md5Loading"
            @click="computeMd5"
          >
            <ReIcon :name="md5Loading ? 'Loading' : 'Key'" :size="11" />
            {{ md5Loading ? "计算中…" : md5 ? "重新计算" : "计算 MD5" }}
          </button>
        </header>
        <button v-if="md5" type="button" class="hfd-md5 mono" :title="`${md5}（点击复制）`" @click="copy(md5, ' MD5')">
          <span class="hfd-md5-text">{{ md5 }}</span>
          <ReIcon name="CopyDocument" :size="12" class="hfd-md5-ico" />
        </button>
        <p v-else-if="!local" class="hfd-hint">
          当前存储是对象存储，<b>不支持在服务端按路径计算 MD5</b>。需要指纹时请下载后本地校验。
        </p>
        <p v-else class="hfd-hint">按需计算：大包会读满整个文件一次，别人正在下载时请错开。</p>
      </section>

      <!-- 文本预览 -->
      <section v-if="isText" class="hfd-sec">
        <header class="hfd-sec-head">
          <span class="hfd-sec-title">内容预览</span>
          <span class="hfd-hint-inline">最多 256 KB</span>
        </header>
        <pre v-if="textLoading" class="hfd-pre">读取中…</pre>
        <pre v-else-if="textError" class="hfd-pre hfd-pre--error">{{ textError }}</pre>
        <pre v-else class="hfd-pre">{{ text || "（空文件）" }}</pre>
      </section>

      <!-- 图片预览 -->
      <section v-if="isImage" class="hfd-sec">
        <header class="hfd-sec-head">
          <span class="hfd-sec-title">预览</span>
          <button type="button" class="hfd-mini" :disabled="imageLoading" @click="previewImage">
            <ReIcon :name="imageLoading ? 'Loading' : 'View'" :size="11" />
            {{ imageUrl ? "看原图" : imageLoading ? "加载中…" : "加载预览" }}
          </button>
        </header>
        <img v-if="imageUrl" :src="imageUrl" :alt="item.name" class="hfd-img" />
        <p v-else class="hfd-hint">点击「加载预览」再取图，避免只点开面板就把整个文件拉下来。</p>
      </section>
    </div>

    <!-- ============ 操作条 ============ -->
    <footer class="hfd-foot">
      <template v-if="!item.directory">
        <button type="button" class="hfd-btn hfd-btn--primary" @click="download">
          <ReIcon name="Download" :size="13" />
          下载
        </button>
      </template>
      <button type="button" class="hfd-btn" @click="emit('rename', item)">
        <ReIcon name="EditPen" :size="13" />
        重命名
      </button>
      <span class="hfd-grow" />
      <button type="button" class="hfd-btn hfd-btn--danger" @click="emit('remove', item)">
        <ReIcon name="Delete" :size="13" />
        删除
      </button>
    </footer>
  </aside>
</template>

<style scoped>
/* ==================== 骨架 ==================== */
.hfd {
  display: flex;
  flex-direction: column;
  width: 360px;
  flex: none;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--bg-container);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* ==================== 头部：归档卡 ==================== */
.hfd-head {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid var(--border-subtle);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--brand-500) 5%, transparent), transparent 72%),
    var(--bg-container);
}
.hfd-head-top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.hfd-tile {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: #fff;
  background: var(--text-tertiary);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}
.hfd-tile--folder { background: linear-gradient(135deg, #f5b04c, #e8890c); }
.hfd-tile--package { background: linear-gradient(135deg, #7a89f8, #4a5ce0); }
.hfd-tile--archive { background: linear-gradient(135deg, #a47cf5, #7c4ddb); }
.hfd-tile--image { background: linear-gradient(135deg, #2ad3bd, #0f9e8c); }
.hfd-tile--text { background: linear-gradient(135deg, #8491a8, #5c6b84); }
.hfd-tile--code { background: linear-gradient(135deg, #38bdf8, #0d8ad9); }
.hfd-tile--media { background: linear-gradient(135deg, #f075b3, #db2f82); }
.hfd-tile--other { background: linear-gradient(135deg, #9aa3b2, #75808f); }

.hfd-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.hfd-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.1px;
  color: var(--text-primary);
}
.hfd-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.hfd-badge {
  flex: none;
  display: inline-block;
  padding: 0 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
}
.hfd-badge--folder { color: #b06a00; background: #fff6e5; border-color: #ffe0a8; }
.hfd-badge--package { color: #3846c9; background: #eceefe; border-color: #cfd4fb; }
.hfd-badge--archive { color: #6d28d9; background: #f3ecff; border-color: #ddccfb; }
.hfd-badge--image { color: #0f766e; background: #e6fbf7; border-color: #bfeee7; }
.hfd-badge--code { color: #0369a1; background: #e8f6ff; border-color: #c2e6fa; }
.hfd-badge--media { color: #9d174d; background: #fdecf4; border-color: #facfdf; }
.hfd-subtext {
  font-size: 11.5px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfd-x {
  flex: none;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: background 0.15s var(--ease-out), color 0.15s var(--ease-out);
}
.hfd-x:hover { background: var(--bg-fill); color: var(--text-primary); }

/* 存储内路径：头部下方一条可复制的等宽行 */
.hfd-key {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--border-subtle) 85%, transparent);
  border-radius: 8px;
  background: var(--bg-fill);
  color: var(--text-secondary);
  padding: 5px 8px;
  font-size: 11px;
  cursor: copy;
  text-align: left;
  transition: border-color 0.15s var(--ease-out), background 0.15s var(--ease-out);
}
.hfd-key:hover { border-color: var(--brand-400); background: var(--bg-container); }
.hfd-key-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfd-key-copy { flex: none; color: var(--text-tertiary); }
.hfd-key:hover .hfd-key-copy { color: var(--brand-500); }

/* ==================== 正文 ==================== */
.hfd-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 13px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 概览 KPI：两列网格 */
.hfd-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.hfd-kpi {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-elevated);
  min-width: 0;
}
.hfd-kpi-label {
  font-size: 11px;
  color: var(--text-tertiary);
}
.hfd-kpi-value {
  font-size: 13.5px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfd-kpi-value--sm { font-size: 12px; font-weight: 600; }

/* 区块 */
.hfd-sec {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.hfd-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.hfd-sec-title {
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.2px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
}
.hfd-hint-inline { font-weight: 400; color: var(--text-tertiary); font-size: 11px; }
.hfd-hint { margin: 0; font-size: 12px; color: var(--text-tertiary); line-height: 1.6; }
.hfd-hint b { color: var(--text-secondary); font-weight: 600; }

/* 路径 / MD5 复制行：等宽代码风格，hover 露出复制图标 */
.hfd-copyrow {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-fill);
  padding: 7px 9px;
  font-size: 11px;
  color: var(--text-primary);
  cursor: copy;
  text-align: left;
  transition: border-color 0.15s var(--ease-out), background 0.15s var(--ease-out);
}
.hfd-copyrow:hover { border-color: var(--brand-400); background: var(--bg-container); }
.hfd-copyrow-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfd-copyrow-ico { flex: none; color: var(--text-tertiary); opacity: 0; transition: opacity 0.15s var(--ease-out); }
.hfd-copyrow:hover .hfd-copyrow-ico { opacity: 1; color: var(--brand-500); }

.hfd-md5 {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 1px dashed var(--border-secondary);
  border-radius: 8px;
  background: var(--bg-elevated);
  padding: 8px 10px;
  font-size: 11.5px;
  color: var(--text-primary);
  cursor: copy;
  text-align: left;
  transition: border-color 0.15s var(--ease-out), background 0.15s var(--ease-out);
}
.hfd-md5:hover { border-color: var(--brand-400); border-style: solid; background: var(--bg-container); }
.hfd-md5-text { flex: 1; min-width: 0; word-break: break-all; }
.hfd-md5-ico { flex: none; color: var(--text-tertiary); opacity: 0; transition: opacity 0.15s var(--ease-out); }
.hfd-md5:hover .hfd-md5-ico { opacity: 1; color: var(--brand-500); }

.hfd-mini {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-container);
  color: var(--text-secondary);
  border-radius: 7px;
  padding: 2px 9px;
  font-size: 11.5px;
  cursor: pointer;
  transition: border-color 0.15s var(--ease-out), color 0.15s var(--ease-out), background 0.15s var(--ease-out);
}
.hfd-mini:hover:not(:disabled) { border-color: var(--brand-500); color: var(--brand-500); background: color-mix(in srgb, var(--brand-500) 5%, var(--bg-container)); }
.hfd-mini:disabled { opacity: 0.6; cursor: not-allowed; }

/* 预览 */
.hfd-pre {
  margin: 0;
  max-height: 260px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--code-background, #0f1117);
  color: var(--code-foreground, #d7dce5);
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 11.5px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}
.hfd-pre--error { color: #ffb4b4; }
.hfd-img {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-fill);
}

/* ==================== 操作条 ==================== */
.hfd-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 11px 14px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
}
.hfd-grow { flex: 1; }
.hfd-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-container);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 550;
  cursor: pointer;
  transition: border-color 0.15s var(--ease-out), color 0.15s var(--ease-out),
    background 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out), transform 0.15s var(--ease-out);
}
.hfd-btn:hover { border-color: var(--brand-400); color: var(--brand-500); background: var(--bg-container); }
.hfd-btn:active { transform: translateY(0.5px); }
.hfd-btn--primary {
  border-color: transparent;
  background: var(--brand-gradient, linear-gradient(135deg, var(--brand-500), var(--brand-600)));
  color: #fff;
  box-shadow: var(--shadow-brand, 0 2px 8px rgba(109, 93, 252, 0.35));
}
.hfd-btn--primary:hover {
  border-color: transparent;
  color: #fff;
  background: var(--brand-gradient, linear-gradient(135deg, var(--brand-500), var(--brand-600)));
  box-shadow: var(--shadow-brand-hover, 0 4px 14px rgba(109, 93, 252, 0.45));
  filter: brightness(1.05);
}
.hfd-btn--danger:hover {
  border-color: var(--status-error, #ff4c4c);
  color: var(--status-error, #ff4c4c);
  background: color-mix(in srgb, var(--status-error, #ff4c4c) 6%, var(--bg-container));
}

@media (max-width: 1080px) {
  .hfd { width: 100%; }
}
</style>