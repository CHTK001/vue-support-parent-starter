<!--
  /**
   * 虚拟桌面 · 文件窗口
   *
   * <p>走既有 SFTP 接口（list / download），不拼任何远端 shell 命令：
   * 文件名的空格、引号、通配符都不需要转义，Windows 主机也照样能用。</p>
   */
  -->
<template>
  <div class="df">
    <div class="df__bar">
      <button type="button" class="df__btn" title="上级目录" :disabled="!current" @click="enterParent">
        <ReIcon name="ArrowUp" :size="12" />
      </button>
      <button type="button" class="df__btn" title="刷新" :disabled="loading" @click="load(current)">
        <ReIcon name="RefreshRight" :size="12" />
      </button>
      <span class="df__path" :title="current || '/'">{{ current || '/' }}</span>
      <span class="df__count">{{ entries.length }} 项</span>
    </div>

    <div v-if="error" class="df__error">
      <ReIcon name="WarningFilled" :size="13" />
      <span>{{ error }}</span>
    </div>

    <div class="df__head">
      <span class="df__c-name">名称</span>
      <span class="df__c-size">大小</span>
    </div>

    <div class="df__list">
      <div v-if="loading" class="df__empty">正在读取目录…</div>
      <div v-else-if="!entries.length" class="df__empty">目录为空</div>
      <button
        v-for="e in sorted"
        :key="e.path"
        type="button"
        class="df__row"
        :class="{ 'is-dir': e.directory, 'is-on': selected === e.path }"
        :title="e.path"
        @click="select(e)"
        @dblclick="enter(e)"
      >
        <span class="df__c-name">
          <ReIcon :name="e.directory ? 'FolderOpened' : 'Document'" :size="13" class="df__ico" />
          <span class="df__name">{{ e.name }}</span>
        </span>
        <span class="df__c-size">{{ e.directory ? '—' : sizeText(e.size) }}</span>
      </button>
    </div>

    <div class="df__foot">
      <span v-if="selectedEntry" class="df__sel" :title="selectedEntry.path">{{ selectedEntry.name }}</span>
      <span v-else class="df__sel is-dim">双击目录进入，双击文件下载</span>
      <span class="df__spacer" />
      <button
        v-if="selectedEntry && !selectedEntry.directory"
        type="button"
        class="df__btn is-primary"
        @click="download(selectedEntry)"
      >
        <ReIcon name="Download" :size="12" /><span>下载</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { sftpDownloadUrl, sftpList } from "../../../api";

interface FsEntry {
  name: string;
  path: string;
  directory: boolean;
  file: boolean;
  size?: number | null;
}

const props = defineProps<{
  /** 主机标识 */
  hostId: number;
  /** 窗口是否激活（父级透传） */
  active?: boolean;
}>();

/** 当前目录，空串表示由后端决定根目录 */
const current = ref("");
const entries = ref<FsEntry[]>([]);
const loading = ref(false);
const error = ref("");
const selected = ref("");

const selectedEntry = computed(() => entries.value.find((e) => e.path === selected.value) ?? null);

/** 目录在前、名称升序——和常见文件管理器一致 */
const sorted = computed(() =>
  [...entries.value].sort((a, b) => {
    if (a.directory !== b.directory) return a.directory ? -1 : 1;
    return a.name.localeCompare(b.name, "zh-CN");
  }),
);

/**
 * 加载目录。
 *
 * @param path 目标目录，空串取后端默认根
 */
async function load(path: string): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const list = await sftpList(props.hostId, path);
    entries.value = (list ?? []) as FsEntry[];
    current.value = path;
    selected.value = "";
  } catch (e) {
    entries.value = [];
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

/**
 * 进入目录（文件则直接下载）。
 *
 * @param e 条目
 */
function enter(e: FsEntry): void {
  if (e.directory) {
    load(e.path);
    return;
  }
  download(e);
}

/**
 * 选中条目。
 *
 * @param e 条目
 */
function select(e: FsEntry): void {
  selected.value = e.path;
}

/**
 * 回上级目录。
 */
function enterParent(): void {
  const s = current.value.replace(/[\\/]+$/, "");
  const i = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\"));
  load(i <= 0 ? "" : s.slice(0, i));
}

/**
 * 下载文件：与文件管理面板同一套下载地址。
 *
 * @param e 文件条目
 */
function download(e: FsEntry): void {
  window.open(sftpDownloadUrl(props.hostId, e.path), "_blank");
}

/**
 * 字节数转可读大小。
 *
 * @param size 字节数
 */
function sizeText(size?: number | null): string {
  if (size == null) return "—";
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = size / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

onMounted(() => load(""));
</script>

<style scoped>
.df {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.df__bar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.df__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 7px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

.df__btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.df__btn:not(:disabled):hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.24);
  border-color: rgba(233, 84, 32, 0.45);
}

.df__btn.is-primary {
  color: #fff;
  background: rgba(233, 84, 32, 0.85);
  border-color: transparent;
}

.df__path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  color: #9d97ab;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__count {
  flex: none;
  font-size: 11px;
  color: #7e7889;
}

.df__error {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 6px 10px;
  font-size: 11.5px;
  color: #ffb4a2;
  background: rgba(255, 86, 48, 0.12);
  border-bottom: 1px solid rgba(255, 86, 48, 0.2);
}

.df__head,
.df__row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 10px;
}

.df__head {
  flex: none;
  height: 24px;
  font-size: 10.5px;
  color: #7e7889;
  background: #191720;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.df__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.df__row {
  height: 26px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.df__row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.df__row.is-on {
  background: rgba(233, 84, 32, 0.18);
}

.df__c-name {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.df__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__c-size {
  flex: none;
  width: 84px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  color: #918b9e;
  text-align: right;
}

.df__ico {
  flex: none;
  color: #8f8a9b;
}

.df__row.is-dir .df__ico {
  color: #e9a13b;
}

.df__empty {
  padding: 18px;
  font-size: 11.5px;
  color: #7e7889;
  text-align: center;
}

.df__foot {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px;
  background: #1b1922;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.df__sel {
  overflow: hidden;
  font-size: 11px;
  color: #cfc9da;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__sel.is-dim {
  color: #7e7889;
}

.df__spacer {
  flex: 1;
}
</style>
