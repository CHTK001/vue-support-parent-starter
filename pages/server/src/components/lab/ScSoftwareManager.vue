<script setup lang="ts">
/**
 * 软件管理 —— 双栏商店 + 右侧详情（可关闭）
 *
 * <p>左侧常驻「已安装清单」，中间「软件商店」（搜索 → 安装），右侧「软件详情」
 * 点击任一条目后展开，显示版本、描述与包管理器给出的依赖关系；关闭按钮收起，
 * 不改变左右两栏的浏览位置。</p>
 *
 * <p>升级按钮只在包管理器自己的可升级清单（apt list --upgradable / dnf check-update /
 * winget upgrade / choco outdated）里存在该包时出现，并直接标出目标版本——
 * 「仓库里有这个包」不等于「本机可升级」。</p>
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
  getSoftwareDependencies,
  installSoftwarePkg,
  listInstalledSoftware,
  listUpgradableSoftware,
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

/** 可升级清单：包名（小写）→ 目标版本 */
const upgradable = ref<Record<string, string>>({});

async function loadUpgradable(): Promise<void> {
  if (noHost.value) {
    upgradable.value = {};
    return;
  }
  try {
    const list = (await listUpgradableSoftware(props.hostId)) as any[];
    const map: Record<string, string> = {};
    for (const item of Array.isArray(list) ? list : []) {
      const key = String(item?.name ?? "").toLowerCase();
      if (key) map[key] = String(item?.candidateVersion ?? "") || "新版本";
    }
    upgradable.value = map;
  } catch {
    // 拿不到可升级清单时宁可不显示升级按钮，也不误导用户
    upgradable.value = {};
  }
}

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
    const rawMsg = (e?.message ?? e) || "读取已安装软件失败";
    // SSH 凭据缺失时后端返回明确错误，引导用户绑定身份
    if (rawMsg.includes("未绑定登录身份")) {
      installedError.value = `${rawMsg}。请在主机详情中绑定 SSH 登录身份后再使用软件管理。`;
    } else {
      installedError.value = rawMsg;
    }
    installedLoaded.value = true;
  } finally {
    installedLoading.value = false;
  }
  void loadUpgradable();
}

/** 刷新已装清单 + 可升级清单 */
function reloadAll(): void {
  void loadInstalled();
}

/** 已安装筛选关键词（左栏搜索） */
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

/**
 * 该包的可升级目标版本；无真实升级时返回空串。
 * @param p 包
 */
function upgradeOf(p: SoftwarePkg): string {
  return upgradable.value[(p.name || "").toLowerCase()] || "";
}

const upgradeCount = computed(() => Object.keys(upgradable.value).length);

async function doUpgrade(p: SoftwarePkg): Promise<void> {
  busy.value[p.name] = "upgrade";
  try {
    const taskId = await upgradeSoftwarePkg(props.hostId, p.name);
    launchTask(taskId, `升级 ${p.name}`, "upgrade");
    // 异步任务由浮层推进；这里先刷新一次已装列表让版本号更新
    setTimeout(reloadAll, 6000);
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
    setTimeout(reloadAll, 6000);
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
    setTimeout(reloadAll, 6000);
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

/* ==================== 软件详情（右侧可关闭面板） ==================== */

interface DetailState {
  pkg: SoftwarePkg;
  kind: "installed" | "store";
  deps: string[];
  depsLoading: boolean;
}

const detail = ref<DetailState | null>(null);
/** 详情请求序号：连续点击时只认最后一次 */
let detailSeq = 0;

async function openDetail(p: SoftwarePkg, kind: "installed" | "store"): Promise<void> {
  const seq = ++detailSeq;
  detail.value = { pkg: p, kind, deps: [], depsLoading: true };
  try {
    const deps = (await getSoftwareDependencies(props.hostId, p.name)) as string[];
    if (seq !== detailSeq || !detail.value) return;
    detail.value.deps = Array.isArray(deps) ? deps.filter(Boolean) : [];
  } catch {
    if (seq !== detailSeq || !detail.value) return;
    detail.value.deps = [];
  } finally {
    if (seq === detailSeq && detail.value) {
      detail.value.depsLoading = false;
    }
  }
}

function closeDetail(): void {
  detailSeq++;
  detail.value = null;
}

/* ==================== 生命周期 ==================== */

onMounted(loadInstalled);
watch(() => props.hostId, () => {
  closeDetail();
  void loadInstalled();
});
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
      <span v-if="upgradeCount" class="lb-pill lb-warn" :title="`${upgradeCount} 个软件存在可用更新`">
        可升级 {{ upgradeCount }}
      </span>
      <span class="lb-spacer" />
      <span class="lb-dim" style="font-size: 11px">系统包管理器：安装 / 卸载 / 升级 / 检索</span>
    </div>

    <!-- 双栏：左已安装 · 中商店 · 右详情（点击条目展开） -->
    <div class="sw-body" :class="{ 'sw-body--detail': !!detail }">
      <!-- ==================== 左栏：已安装清单 ==================== -->
      <section class="lb-pane sw-pane">
        <div class="lb-pane__head">
          <ReIcon name="Box" :size="12" />已安装（{{ installed.length }}）
          <span class="lb-spacer" />
          <ReButton
            layout="square"
            link
            icon="RefreshRight"
            :loading="installedLoading"
            tip="刷新已安装与可升级清单"
            @click="reloadAll"
          />
        </div>
        <div class="lb-pane__body" style="padding: 0">
          <div v-if="installedLoading && !installed.length" v-loading="true" class="sw-loading" />
          <template v-else-if="installedError">
            <div class="lb-empty">
              <b>读取失败</b>
              <span>{{ installedError }}</span>
              <button type="button" class="lb-btn" @click="reloadAll">重试</button>
            </div>
          </template>
          <template v-else-if="installedLoaded && !installed.length">
            <div class="lb-empty">
              <ReIcon name="Box" :size="22" />
              <b>尚未安装任何软件</b>
              <span>到中间商店搜索并安装，例如 nginx / git</span>
            </div>
          </template>
          <template v-else>
            <!-- 已安装搜索 -->
            <div class="sw-filter">
              <input
                v-model="instQuery"
                class="sw-input"
                placeholder="搜索已安装软件…"
                aria-label="搜索已安装软件"
              />
            </div>
            <div class="sw-list">
              <div
                v-for="p in shownInstalled"
                :key="p.name"
                class="sw-item is-clickable"
                :class="{ 'is-active': detail?.pkg.name === p.name }"
                @click="openDetail(p, 'installed')"
              >
                <i class="lb-dot lb-ok" />
                <div class="sw-item__info">
                  <b>{{ p.name }}</b>
                  <span class="lb-mono lb-dim">{{ p.version || "—" }}</span>
                </div>
                <span v-if="upgradeOf(p)" class="lb-pill lb-warn" :title="`可升级到 ${upgradeOf(p)}`">
                  ↑ {{ upgradeOf(p) }}
                </span>
                <s v-else-if="p.summary" class="sw-item__sum">{{ p.summary }}</s>
                <span class="lb-spacer" />
                <template v-if="!isBusy(p.name)">
                  <ReButton
                    v-if="upgradeOf(p)"
                    layout="square"
                    link
                    type="primary"
                    icon="Top"
                    :tip="`升级到 ${upgradeOf(p)}`"
                    @click.stop="doUpgrade(p)"
                  />
                  <ReButton
                    layout="square"
                    link
                    type="danger"
                    icon="Delete"
                    tip="卸载该软件"
                    @click.stop="doUninstall(p)"
                  />
                </template>
                <span v-else class="lb-pill">{{ busy[p.name] === 'upgrade' ? '升级中…' : '卸载中…' }}</span>
              </div>
              <div v-if="instQuery && !shownInstalled.length" class="lb-empty">
                <span>没有匹配「{{ instQuery }}」的已安装软件</span>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ==================== 中栏：软件商店 ==================== -->
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
              aria-label="搜索软件仓库"
              @keyup.enter="doSearch"
            />
            <ReButton
              layout="square"
              type="primary"
              icon="Search"
              :loading="searching"
              tip="搜索软件仓库"
              @click="doSearch"
            />
          </div>

          <!-- 搜索结果 -->
          <div v-if="searchError" class="lb-empty">
            <b>搜索失败</b>
            <span>{{ searchError }}</span>
          </div>
          <div v-else-if="searching" v-loading="true" class="sw-loading" />
          <div v-else-if="results.length" class="sw-results">
            <div class="lb-dim sw-results__count">{{ results.length }} 个结果 · 全部来自 {{ hostName }} 的包仓库</div>
            <div
              v-for="p in results"
              :key="p.name"
              class="sw-item sw-item--store is-clickable"
              :class="{ 'is-active': detail?.pkg.name === p.name }"
              @click="openDetail(p, 'store')"
            >
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
              <ReButton
                v-else
                layout="square"
                link
                type="primary"
                icon="Download"
                :loading="isBusy(p.name)"
                :tip="`安装 ${p.name}`"
                @click.stop="doInstall(p)"
              />
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
            <span>例如 nginx / git / openssl，回车搜索后点击安装</span>
          </div>
        </div>
      </section>

      <!-- ==================== 右栏：软件详情（可关闭） ==================== -->
      <aside v-if="detail" class="lb-pane sw-pane sw-detail">
        <div class="lb-pane__head">
          <ReIcon name="Box" :size="12" />软件详情
          <span class="lb-spacer" />
          <ReButton layout="square" link icon="Close" tip="关闭详情" @click="closeDetail" />
        </div>
        <div class="lb-pane__body sw-detail__body">
          <div class="sw-detail__title">{{ detail.pkg.name }}</div>
          <div class="sw-detail__meta">
            <span class="lb-pill" :class="detail.kind === 'installed' ? 'lb-ok' : 'lb-info'">
              {{ detail.kind === 'installed' ? '已安装' : '仓库' }}
            </span>
            <span class="lb-mono lb-dim">{{ detail.pkg.version || "未提供版本" }}</span>
          </div>
          <p class="sw-detail__sum">{{ detail.pkg.summary || "该软件未提供描述信息。" }}</p>

          <div v-if="upgradeOf(detail.pkg)" class="sw-detail__upgrade">
            <ReIcon name="Top" :size="12" />
            可升级至 <b>{{ upgradeOf(detail.pkg) }}</b>
          </div>

          <div class="sw-detail__section">依赖关系</div>
          <div v-if="detail.depsLoading" class="lb-dim sw-detail__hint">读取依赖中…</div>
          <div v-else-if="detail.deps.length" class="sw-deps">
            <span v-for="d in detail.deps" :key="d" class="lb-pill lb-mono">{{ d }}</span>
          </div>
          <div v-else class="lb-dim sw-detail__hint">无额外依赖，或该包管理器未提供依赖清单。</div>

          <div class="sw-detail__actions">
            <ReButton
              v-if="detail.kind === 'store' && !isInstalled(detail.pkg)"
              show-text
              layout="square"
              type="primary"
              icon="Download"
              tip="安装该软件"
              :loading="isBusy(detail.pkg.name)"
              @click="doInstall(detail.pkg)"
            ></ReButton>
            <ReButton
              v-if="upgradeOf(detail.pkg)"
              show-text
              layout="square"
              type="primary"
              icon="Top"
              tip="升级到最新版"
              :loading="isBusy(detail.pkg.name)"
              @click="doUpgrade(detail.pkg)"
            ></ReButton>
            <ReButton
              v-if="detail.kind === 'installed'"
              show-text
              layout="square"
              type="danger"
              icon="Delete"
              tip="卸载该软件"
              :loading="isBusy(detail.pkg.name)"
              @click="doUninstall(detail.pkg)"
            ></ReButton>
          </div>
        </div>
      </aside>
    </div>

    <!-- 底部说明 -->
    <div class="sw-foot lb-dim">
      <ReIcon name="InfoFilled" :size="11" />
      安装 / 卸载 / 升级通过 {{ hostName }} 的系统包管理器执行（root 或可 sudo 账户）；
      长任务在右下角任务浮层实时看进度。升级按钮只在包管理器确认有可用更新时出现。
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

/* ---------- 双栏 / 三栏 ---------- */
.sw-body {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 8px;
  flex: 1;
  min-height: 0;
}
.sw-body--detail {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) 268px;
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
.sw-item.is-clickable { cursor: pointer; }
.sw-item.is-active {
  background: color-mix(in srgb, var(--el-color-primary, #6d5dfc) 8%, transparent);
  box-shadow: inset 2px 0 0 var(--el-color-primary, #6d5dfc);
}
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

/* ---------- 详情面板 ---------- */
.sw-detail__body {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 12px;
}
.sw-detail__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  word-break: break-all;
}
.sw-detail__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
}
.sw-detail__sum {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--el-text-color-regular, #606266);
}
.sw-detail__upgrade {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 9px;
  font-size: 11.5px;
  border-radius: 7px;
  color: var(--el-color-warning-dark-2, #b88230);
  background: var(--el-color-warning-light-9, #fdf6ec);
}
.sw-detail__section {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary, #909399);
  text-transform: uppercase;
  letter-spacing: .04em;
}
.sw-detail__hint { font-size: 11px; line-height: 1.6; }
.sw-deps {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 220px;
  overflow: auto;
}
.sw-deps .lb-pill {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sw-detail__actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
</style>
