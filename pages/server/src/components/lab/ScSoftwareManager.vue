<script setup lang="ts">
/**
 * 软件管理 —— 双栏商店版式（已选定）
 *
 * <p>左侧常驻「已安装清单」，右侧独立的「软件商店」面板（搜索 → 安装），
 * 两边各干一件事互不推挤：已装区只管「升级 / 卸载」，商店区只管「找新包」。</p>
 *
 * <p>全部走目标主机的系统包管理器（apt / yum / dnf / winget / choco，由后端 SPI 按
 * 主机平台路由）。安装 / 卸载 / 升级为异步任务（返回 taskId），实时进度经 socket
 * 推送到右下角任务浮层（trackTask 跟踪）。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, ref, watch } from "vue";
import { message } from "@repo/core";
import {
  installSoftwarePkg,
  listInstalledSoftware,
  searchSoftware,
  uninstallSoftwarePkg,
  upgradeSoftwarePkg,
} from "../../api";
import { trackTask } from "../../utils/processTasks";

const props = defineProps<{
  /** 当前上下文主机 id（软件接口路径参数） */
  hostId: number;
  /** 当前上下文主机名（展示用） */
  hostName: string;
  /** 主机平台标识（LINUX / WINDOWS） */
  platform?: string;
}>();

/* ==================== 已安装清单（左栏） ==================== */

interface SoftwarePkg {
  name: string;
  summary?: string;
  version?: string;
}

const installed = ref<SoftwarePkg[]>([]);
const installedLoading = ref(false);
const installedError = ref("");
/** 是否已同步过（首帧不闪空态） */
const installedLoaded = ref(false);

const noHost = computed(() => !props.hostId);

async function loadInstalled(): Promise<void> {
  if (noHost.value) {
    installed.value = [];
    installedLoaded.value = true;
    return;
  }
  installedLoading.value = true;
  installedError.value = "";
  try {
    const list = (await listInstalledSoftware(props.hostId)) as SoftwarePkg[];
    installed.value = Array.isArray(list) ? list : [];
    installedLoaded.value = true;
  } catch (e: any) {
    installedError.value = (e?.message ?? e) || "读取已安装软件失败";
    installedLoaded.value = true;
  } finally {
    installedLoading.value = false;
  }
}

/** 已安装筛选关键词 */
const instQuery = ref("");
const shownInstalled = computed(() => {
  const q = instQuery.value.trim().toLowerCase();
  if (!q) return installed.value;
  return installed.value.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.summary || "").toLowerCase().includes(q),
  );
});

/** 操作中的包（防连点）：key = 包名 */
const busy = ref<Record<string, string>>({});

function isBusy(name: string): boolean {
  return !!busy.value[name];
}

/** 异步发一个任务并交给任务浮层跟踪 */
function launchTask(taskId: string, title: string, op: string): void {
  if (taskId) trackTask(taskId, title, op);
}

async function doUpgrade(p: SoftwarePkg): Promise<void> {
  busy.value[p.name] = "upgrade";
  try {
    const taskId = await upgradeSoftwarePkg(props.hostId, p.name);
    launchTask(taskId, `升级 ${p.name}`, "upgrade");
    // 异步任务由浮层推进；这里先刷新一次已装列表让版本号更新
    setTimeout(loadInstalled, 6000);
  } catch (e: any) {
    message.error((e?.message ?? e) || "升级触发失败");
  } finally {
    delete busy.value[p.name];
  }
}

async function doUninstall(p: SoftwarePkg): Promise<void> {
  busy.value[p.name] = "uninstall";
  try {
    const taskId = await uninstallSoftwarePkg(props.hostId, p.name);
    launchTask(taskId, `卸载 ${p.name}`, "uninstall");
    setTimeout(loadInstalled, 6000);
  } catch (e: any) {
    message.error((e?.message ?? e) || "卸载触发失败");
  } finally {
    delete busy.value[p.name];
  }
}

/* ==================== 软件商店（右栏） ==================== */

const kw = ref("");
const results = ref<SoftwarePkg[]>([]);
const searching = ref(false);
const searched = ref(false);
const searchError = ref("");

async function doSearch(): Promise<void> {
  const q = kw.value.trim();
  if (!q) {
    message.warning("请输入软件名称");
    return;
  }
  if (noHost.value) return;
  searching.value = true;
  searchError.value = "";
  results.value = [];
  try {
    const list = (await searchSoftware(props.hostId, q)) as SoftwarePkg[];
    results.value = Array.isArray(list) ? list : [];
    searched.value = true;
  } catch (e: any) {
    searchError.value = (e?.message ?? e) || "搜索失败，请检查主机连接";
    searched.value = true;
  } finally {
    searching.value = false;
  }
}

async function doInstall(p: SoftwarePkg): Promise<void> {
  busy.value[p.name] = "install";
  try {
    const taskId = await installSoftwarePkg(props.hostId, p.name);
    launchTask(taskId, `安装 ${p.name}`, "install");
    setTimeout(loadInstalled, 6000);
  } catch (e: any) {
    message.error((e?.message ?? e) || "安装触发失败");
  } finally {
    delete busy.value[p.name];
  }
}

/** 已安装包名集合（商店结果里标出「已安装」） */
const installedNames = computed(() => new Set(installed.value.map((p) => p.name.toLowerCase())));

function isInstalled(p: SoftwarePkg): boolean {
  return installedNames.value.has((p.name || "").toLowerCase());
}

/* ==================== 生命周期 ==================== */

onMounted(loadInstalled);
watch(() => props.hostId, loadInstalled);
</script>

<template>
  <div class="sw">
    <!-- 页头 -->
    <div class="sw-head">
      <span class="sw-title">软件管理</span>
      <span class="lb-pill lb-pill--plain">{{ hostName }}</span>
      <span v-if="platform" class="lb-pill" :class="platform === 'WINDOWS' ? 'lb-info' : 'lb-ok'">
        {{ platform }}
      </span>
      <span class="lb-spacer" />
      <span class="lb-dim" style="font-size: 11px">系统包管理器：安装 / 卸载 / 升级 / 检索</span>
    </div>

    <!-- 双栏：左已安装 · 右商店 -->
    <div class="sw-body">
      <!-- ==================== 左栏：已安装清单 ==================== -->
      <section class="lb-pane sw-pane">
        <div class="lb-pane__head">
          <ReIcon name="Box" :size="12" />已安装（{{ installed.length }}）
          <span class="lb-spacer" />
          <button
            type="button"
            class="lb-btn"
            :disabled="noHost || installedLoading"
            title="刷新已安装列表"
            @click="loadInstalled"
          >
            <ReIcon name="RefreshRight" :size="11" />{{ installedLoading ? "读取中…" : "刷新" }}
          </button>
        </div>
        <div class="lb-pane__body" style="padding: 0">
          <div v-if="installedLoading && !installed.length" v-loading="true" class="sw-loading" />
          <template v-else-if="installedError">
            <div class="lb-empty">
              <b>读取失败</b>
              <span>{{ installedError }}</span>
              <button type="button" class="lb-btn" @click="loadInstalled">重试</button>
            </div>
          </template>
          <template v-else-if="installedLoaded && !installed.length">
            <div class="lb-empty">
              <ReIcon name="Box" :size="22" />
              <b>尚未安装任何软件</b>
              <span>到右侧商店搜索并安装，例如 nginx / git</span>
            </div>
          </template>
          <template v-else>
            <!-- 已安装筛选 -->
            <div class="sw-filter">
              <input
                v-model="instQuery"
                class="sw-input"
                placeholder="筛选已安装…"
              />
            </div>
            <div class="sw-list">
              <div v-for="p in shownInstalled" :key="p.name" class="sw-item">
                <i class="lb-dot lb-ok" />
                <div class="sw-item__info">
                  <b>{{ p.name }}</b>
                  <span class="lb-mono lb-dim">{{ p.version || "—" }}</span>
                </div>
                <s v-if="p.summary" class="sw-item__sum">{{ p.summary }}</s>
                <span class="lb-spacer" />
                <button
                  v-if="!isBusy(p.name)"
                  type="button"
                  class="lb-btn is-primary"
                  title="升级到仓库最新版"
                  @click="doUpgrade(p)"
                >
                  <ReIcon name="Top" :size="11" />升级
                </button>
                <button
                  v-if="!isBusy(p.name)"
                  type="button"
                  class="lb-btn is-bad"
                  title="卸载该软件"
                  @click="doUninstall(p)"
                >
                  <ReIcon name="Delete" :size="11" />卸载
                </button>
                <span v-else class="lb-pill">{{ busy[p.name] === 'upgrade' ? '升级中…' : '卸载中…' }}</span>
              </div>
              <div v-if="instQuery && !shownInstalled.length" class="lb-empty">
                <span>没有匹配「{{ instQuery }}」的已安装软件</span>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ==================== 右栏：软件商店 ==================== -->
      <section class="lb-pane sw-pane">
        <div class="lb-pane__head">
          <ReIcon name="Shop" :size="12" />软件商店
          <span class="lb-spacer" />
          <span class="lb-dim" style="font-size: 10.5px">回车即搜</span>
        </div>
        <div class="lb-pane__body">
          <!-- 搜索框 -->
          <div class="sw-search">
            <input
              v-model="kw"
              class="sw-input sw-search__input"
              placeholder="输入软件名称，如 nginx、git…"
              @keyup.enter="doSearch"
            />
            <button
              type="button"
              class="lb-btn is-primary"
              :disabled="noHost || searching"
              @click="doSearch"
            >
              <ReIcon name="Search" :size="11" />{{ searching ? "搜索中…" : "搜索" }}
            </button>
          </div>

          <!-- 搜索结果 -->
          <div v-if="searchError" class="lb-empty">
            <b>搜索失败</b>
            <span>{{ searchError }}</span>
          </div>
          <div v-else-if="searching" v-loading="true" class="sw-loading" />
          <div v-else-if="results.length" class="sw-results">
            <div class="lb-dim sw-results__count">{{ results.length }} 个结果 · 全部来自 {{ hostName }} 的包仓库</div>
            <div v-for="p in results" :key="p.name" class="sw-item sw-item--store">
              <i class="lb-dot" :class="isInstalled(p) ? 'lb-ok' : 'lb-brand'" />
              <div class="sw-item__info">
                <b>{{ p.name }}</b>
                <span v-if="p.version" class="lb-mono lb-dim">{{ p.version }}</span>
              </div>
              <s v-if="p.summary" class="sw-item__sum">{{ p.summary }}</s>
              <span class="lb-spacer" />
              <span
                v-if="isInstalled(p)"
                class="lb-pill lb-ok"
                title="该软件已安装，可在左侧清单中升级/卸载"
              >已安装</span>
              <button
                v-else
                type="button"
                class="lb-btn is-primary"
                :disabled="isBusy(p.name)"
                @click="doInstall(p)"
              >
                <ReIcon name="Download" :size="11" />{{ isBusy(p.name) ? "安装中…" : "安装" }}
              </button>
            </div>
          </div>
          <div v-else-if="searched" class="lb-empty">
            <ReIcon name="Search" :size="22" />
            <b>没有找到结果</b>
            <span>换个关键词试试，或到左侧确认是否已安装</span>
          </div>
          <div v-else class="lb-empty">
            <ReIcon name="Shop" :size="22" />
            <b>从仓库搜索软件</b>
            <span>例如 nginx / git / openssl，回车搜索后点击「安装」</span>
          </div>
        </div>
      </section>
    </div>

    <!-- 底部说明 -->
    <div class="sw-foot lb-dim">
      <ReIcon name="InfoFilled" :size="11" />
      安装 / 卸载 / 升级通过 {{ hostName }} 的系统包管理器执行（root 或可 sudo 账户）；
      长任务在右下角任务浮层实时看进度。已安装清单按包管理器快照，搜索结果为仓库实时查询。
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/lab/_lab-kit.scss";

.sw {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
  /* 与工作台各面板一致：页签内四周留白，避免内容顶到边框 */
  padding: 12px 14px;
  box-sizing: border-box;
}
.sw-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.sw-title {
  font-size: 13px;
  font-weight: 700;
}
.sw-foot {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  line-height: 1.6;
}

/* ---------- 双栏 ---------- */
.sw-body {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 8px;
  flex: 1;
  min-height: 0;
}
.sw-pane { min-height: 0; }
.sw-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
}

/* ---------- 通用输入 ---------- */
.sw-input {
  height: 30px;
  padding: 0 9px;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 7px;
  outline: none;
}
.sw-input:focus {
  border-color: var(--el-color-primary, #6d5dfc);
  background: var(--el-bg-color, #fff);
}

/* ---------- 已安装清单 ---------- */
.sw-filter {
  padding: 7px 9px 4px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.sw-filter .sw-input { width: 100%; }

.sw-list {
  display: flex;
  flex-direction: column;
  padding: 3px 0;
}

/* ---------- 通用条目 ---------- */
.sw-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 4px 11px;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
.sw-item:hover { background: var(--el-fill-color-lighter, #fafbfd); }
.sw-item__info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.sw-item__info b {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sw-item__info span {
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
}
.sw-item__sum {
  min-width: 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
}
.sw-item--store { min-height: 46px; }

/* ---------- 商店 ---------- */
.sw-search {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.sw-search__input { flex: 1; }
.sw-results {
  display: flex;
  flex-direction: column;
}
.sw-results__count {
  padding: 2px 2px 6px;
  font-size: 10.5px;
}
</style>