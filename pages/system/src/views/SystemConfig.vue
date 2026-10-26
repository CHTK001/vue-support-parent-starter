<script setup lang="ts">
/**
 * 产品级「系统配置」—— Settings Console（信息架构重设计）
 *
 *  IA：
 *   常驻模块导航栏（左）  +  顶部（全局搜索 / 就绪度）  +  主区（模块英雄区 + 分区 Bento）
 *
 *  与「配置管理」(/manage/setting) 的区别：
 *   - 本页面向业务，仅 default/smtp/sms/config/userAgreement，过滤 startup-*；
 *   - 配置按语义分区（品牌/文案/登录方式…），而非一张扁平表；
 *   - 每个模块有英雄区 + 紧凑实时预览；支持全局搜索、就绪度概览；
 *   - 分区内拖拽 = 交换两条配置的 sort 值并批量更新。
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
import {
  Cellphone,
  Connection,
  Document,
  Rank,
  EditPen,
  Brush,
  Lock,
  Files,
  DataLine,
  SwitchButton,
  Tools,
  Search,
  CircleCheck,
  CircleClose,
} from "@element-plus/icons-vue";

import {
  pageForSetting,
  updateBatchSetting,
  checkEmailConnectivity,
  syncMessageTemplate,
} from "../api/systemApi";
import type { SysSetting } from "../api/types";
import { normType, typeLabel } from "../settingUtils";
import { settingLabel } from "../settingLabels";
import SettingValueEditor from "./components/SettingValueEditor.vue";

/* ================== 模块元信息 ================== */

interface ModuleMeta {
  name: string;
  desc: string;
  icon: unknown;
  envelope?: boolean;
}
const MODULE_ORDER = ["default", "smtp", "sms", "config", "userAgreement"];
const moduleMeta: Record<string, ModuleMeta> = {
  default: {
    name: "界面与登录",
    desc: "品牌名称、Logo、欢迎语、备案号及登录相关开关",
    icon: Brush,
  },
  smtp: {
    name: "邮件服务",
    desc: "SMTP 发信 / IMAP 收信，用于系统通知与验证码投递",
    icon: null,
    envelope: true,
  },
  sms: {
    name: "短信服务",
    desc: "短信通道，用于通知与短信验证码投递",
    icon: Cellphone,
  },
  config: {
    name: "连接配置",
    desc: "WebSocket / Socket 连接参数",
    icon: Connection,
  },
  userAgreement: {
    name: "用户协议",
    desc: "用户协议内容与相关条款",
    icon: Document,
  },
};

const settingIconMap: Record<string, unknown> = {
  COLOR: Brush,
  PASSWORD: Lock,
  JSON: Files,
  ARRAY: Files,
  NUMBER: DataLine,
  BOOLEAN: SwitchButton,
  STRING: EditPen,
  TEXTAREA: Document,
};
function settingIcon(row: SysSetting): unknown {
  return settingIconMap[normType(row.sysSettingValueType)] ?? Tools;
}

/* ================== 数据加载 ================== */

const allSettings = ref<SysSetting[]>([]);
const originalMap = new Map<number, string>();
const loading = ref(false);

async function loadAll() {
  loading.value = true;
  try {
    const res = await pageForSetting({ page: 1, pageSize: 1000 });
    allSettings.value = unwrapPage(res).rows as SysSetting[];
    originalMap.clear();
    allSettings.value.forEach((s) => {
      if (s.sysSettingId != null) originalMap.set(s.sysSettingId, s.sysSettingValue ?? "");
    });
  } catch {
    allSettings.value = [];
  } finally {
    loading.value = false;
  }
}
function unwrapPage(res: any): { rows: Record<string, unknown>[] } {
  const maybe = res?.data as Record<string, unknown> | undefined;
  let pageObj = maybe;
  const inner = maybe?.data;
  if (
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    Array.isArray((inner as Record<string, unknown>).data)
  ) {
    pageObj = inner as Record<string, unknown>;
  }
  const rows = (Array.isArray(pageObj?.data) ? pageObj.data : []) as Record<string, unknown>[];
  return { rows };
}

function moduleRows(group: string): SysSetting[] {
  return allSettings.value
    .filter((s) => (s.sysSettingGroup || "default") === group)
    .sort((a, b) => (a.sysSettingSort ?? 0) - (b.sysSettingSort ?? 0));
}
const modules = computed(() =>
  MODULE_ORDER.map((g) => ({ group: g, rows: moduleRows(g) })).filter((m) => m.rows.length),
);

/* ================== 模块就绪状态 ================== */

function raw(group: string, code: string): string {
  const r = allSettings.value.find(
    (x) => (x.sysSettingGroup || "default") === group && x.sysSettingCode === code,
  );
  return r?.sysSettingValue ?? "";
}
function moduleReady(group: string): boolean {
  switch (group) {
    case "smtp":
      return !!(raw("smtp", "smtp.host") && raw("smtp", "smtp.from") && raw("smtp", "smtp.password"));
    case "sms":
      return !!(raw("sms", "sms.appId") && raw("sms", "sms.appSecret") && raw("sms", "sms.appSign"));
    case "config":
      return !!raw("config", "socket.urls");
    case "userAgreement":
      return moduleRows("userAgreement").some((s) => (s.sysSettingValue?.length ?? 0) > 30);
    default:
      return true;
  }
}
const readyCount = computed(() => modules.value.filter((m) => moduleReady(m.group)).length);

/* ================== 当前模块 / 分区 ================== */

const activeGroup = ref<string>("default");

interface SectionDef {
  key: string;
  title: string;
  order: number;
}
/* token（code 或 name 的最后一段） → 分区 */
const SECTION_RULES: Record<string, Record<string, SectionDef>> = {
  default: {
    brandName: { key: "brand", title: "品牌形象", order: 1 },
    logoUrl: { key: "brand", title: "品牌形象", order: 1 },
    imageUrl: { key: "brand", title: "品牌形象", order: 1 },
    avatarUrl: { key: "brand", title: "品牌形象", order: 1 },
    welcome: { key: "copy", title: "文案内容", order: 2 },
    description: { key: "copy", title: "文案内容", order: 2 },
    featureTags: { key: "copy", title: "文案内容", order: 2 },
    captcha: { key: "methods", title: "登录与验证", order: 3 },
    SlidingBlockOpen: { key: "methods", title: "登录与验证", order: 3 },
    OpenSmsLogin: { key: "methods", title: "登录与验证", order: 3 },
    otp: { key: "methods", title: "登录与验证", order: 3 },
    beiAnHao: { key: "filing", title: "备案信息", order: 4 },
    enable: { key: "personal", title: "个性化", order: 5 },
  },
  smtp: {
    host: { key: "server", title: "服务器", order: 1 },
    port: { key: "server", title: "服务器", order: 1 },
    sslEnable: { key: "server", title: "服务器", order: 1 },
    starttls: { key: "server", title: "服务器", order: 1 },
    auth: { key: "auth", title: "认证", order: 2 },
    username: { key: "auth", title: "认证", order: 2 },
    password: { key: "auth", title: "认证", order: 2 },
    from: { key: "auth", title: "认证", order: 2 },
    imapHost: { key: "imap", title: "IMAP 收信", order: 3 },
    imapPort: { key: "imap", title: "IMAP 收信", order: 3 },
  },
  sms: {
    appType: { key: "channel", title: "通道", order: 1 },
    appId: { key: "credential", title: "凭证", order: 2 },
    appSecret: { key: "credential", title: "凭证", order: 2 },
    appSign: { key: "credential", title: "凭证", order: 2 },
  },
  config: {
    enable: { key: "socket", title: "Socket 连接", order: 1 },
    urls: { key: "socket", title: "Socket 连接", order: 1 },
    context: { key: "socket", title: "Socket 连接", order: 1 },
    protocol: { key: "socket", title: "Socket 连接", order: 1 },
  },
  userAgreement: {
    title: { key: "version", title: "版本信息", order: 1 },
    label: { key: "version", title: "版本信息", order: 1 },
    headline: { key: "version", title: "版本信息", order: 1 },
    description: { key: "version", title: "版本信息", order: 1 },
    version: { key: "version", title: "版本信息", order: 1 },
    updatedAt: { key: "version", title: "版本信息", order: 1 },
    scope: { key: "clauses", title: "条款内容", order: 2 },
    account: { key: "clauses", title: "条款内容", order: 2 },
    data: { key: "clauses", title: "条款内容", order: 2 },
    feedback: { key: "clauses", title: "条款内容", order: 2 },
  },
};
function tokenOf(row: SysSetting): string {
  return String(row.sysSettingCode || row.sysSettingName || "").split(".").pop() || "";
}
function sectionOf(row: SysSetting): SectionDef {
  const rules = SECTION_RULES[activeGroup.value];
  return rules?.[tokenOf(row)] ?? { key: "other", title: "其他", order: 99 };
}

interface SectionView extends SectionDef {
  rows: SysSetting[];
}
const sections = computed<SectionView[]>(() => {
  const map = new Map<string, SectionView>();
  moduleRows(activeGroup.value).forEach((r) => {
    const def = sectionOf(r);
    if (!map.has(def.key)) map.set(def.key, { ...def, rows: [] });
    map.get(def.key)!.rows.push(r);
  });
  return [...map.values()].sort((a, b) => a.order - b.order);
});

/* ================== 英雄区取值（实时） ================== */

function v(code: string): string {
  const r = moduleRows(activeGroup.value).find((x) => x.sysSettingCode === code);
  return r ? r.sysSettingValue ?? "" : "";
}
function isOn(code: string): boolean {
  return v(code) === "true";
}
function toLabel(x: unknown): string {
  if (x === null || x === undefined) return "";
  if (typeof x === "object") {
    const o = x as Record<string, unknown>;
    return String(o.name ?? o.label ?? o.title ?? o.value ?? o.text ?? "");
  }
  return String(x);
}
const featureTags = computed(() => {
  const r = v("login.featureTags");
  if (!r) return [];
  try {
    const p = JSON.parse(r);
    if (Array.isArray(p)) return p.map(toLabel).filter(Boolean);
  } catch {
    /* ignore */
  }
  return [];
});
const socketUrls = computed(() =>
  v("socket.urls")
    .split(/[|,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean),
);
const agreementBody = computed(() => {
  const cand = moduleRows("userAgreement")
    .filter((r) => (r.sysSettingValue?.length ?? 0) > 30)
    .sort((a, b) => (b.sysSettingValue?.length ?? 0) - (a.sysSettingValue?.length ?? 0));
  return cand[0]?.sysSettingValue ?? "";
});

/* ================== 全局搜索 ================== */

const keyword = ref("");
const searchResults = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return [];
  return allSettings.value
    .filter((r) => (r.sysSettingGroup ? MODULE_ORDER.includes(r.sysSettingGroup) : true))
    .filter((r) =>
      [r.sysSettingName, r.sysSettingCode, r.sysSettingRemark]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(kw)),
    )
    .slice(0, 50);
});
function jumpResult(r: SysSetting) {
  activeGroup.value = r.sysSettingGroup || "default";
  keyword.value = "";
}

/* ================== 分区内拖拽（交换 sort） ================== */

const sectionEls = ref<HTMLElement[]>([]);
function setSectionEl(el: unknown, idx: number) {
  if (el instanceof HTMLElement) sectionEls.value[idx] = el;
}
let sortables: { destroy?: () => void }[] = [];

async function initSortables() {
  destroySortables();
  await nextTick();
  const Sortable = (await import("sortablejs")).default;
  sectionEls.value.forEach((container) => {
    if (!container) return;
    sortables.push(
      Sortable.create(container, {
        handle: ".srow__drag",
        draggable: ".srow",
        animation: 160,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        forceFallback: true,
        fallbackTolerance: 3,
        fallbackOnBody: true,
        swapThreshold: 0.7,
        chosenClass: "srow--chosen",
        ghostClass: "srow--ghost",
        fallbackClass: "srow--fallback",
        onChoose: () => {
          document.body.style.userSelect = "none";
        },
        onUnchoose: () => {
          document.body.style.userSelect = "";
        },
        onEnd: async (evt: any) => {
          document.body.style.userSelect = "";
          const oi = evt.oldIndex,
            ni = evt.newIndex;
          if (typeof oi !== "number" || typeof ni !== "number" || oi === ni) {
            await nextTick();
            return;
          }
          const secKey = container.dataset.sec || "";
          const sec = sections.value.find((s) => s.key === secKey);
          if (!sec) return;
          const ordered = [...sec.rows].sort(
            (a, b) => (a.sysSettingSort ?? 0) - (b.sysSettingSort ?? 0),
          );
          const a = ordered[oi],
            b = ordered[ni];
          if (!a || !b) return;
          const sa = a.sysSettingSort ?? 0;
          a.sysSettingSort = b.sysSettingSort ?? 0;
          b.sysSettingSort = sa;
          try {
            await updateBatchSetting([{ ...a }, { ...b }] as SysSetting[]);
            [a, b].forEach((r) => {
              const t = allSettings.value.find((s) => s.sysSettingId === r.sysSettingId);
              if (t) t.sysSettingSort = r.sysSettingSort;
            });
            message.success("排序已更新");
          } catch (e) {
            message.error((e as Error)?.message ?? "排序更新失败");
          }
        },
      }),
    );
  });
}
function destroySortables() {
  sortables.forEach((s) => s.destroy && s.destroy());
  sortables = [];
  sectionEls.value = [];
}
watch([activeGroup, sections], () => initSortables(), { flush: "post" });

/* ================== 就地保存 / 敏感值 / 邮件测试 ================== */

/* ================== 脏标记 / 批量保存 ================== */
const dirtyRows = computed(() =>
  allSettings.value.filter(
    (s) => s.sysSettingId != null && (s.sysSettingValue ?? "") !== (originalMap.get(s.sysSettingId) ?? ""),
  ),
);
const dirtyCount = computed(() => dirtyRows.value.length);
const savingAll = ref(false);
/** 放弃全部未保存更改，还原为加载时原值 */
function discardAll() {
  dirtyRows.value.forEach((s) => {
    if (s.sysSettingId != null) s.sysSettingValue = originalMap.get(s.sysSettingId) ?? "";
  });
}
/** 批量保存全部脏行（updateBatch），成功后重拉以同步版本号 */
async function saveAll() {
  if (!dirtyRows.value.length || savingAll.value) return;
  savingAll.value = true;
  try {
    await updateBatchSetting(dirtyRows.value);
    message.success(`已保存 ${dirtyRows.value.length} 项配置`);
    await loadAll();
  } catch (e) {
    message.error((e as Error)?.message ?? "批量保存失败");
  } finally {
    savingAll.value = false;
  }
}
function isSensitive(row: SysSetting): boolean {
  return Number((row as unknown as Record<string, unknown>).sysSettingIsSensitive) === 1;
}
const sensitiveVisible = ref(false);
const sensitiveRow = ref<SysSetting | null>(null);
const sensitiveValue = ref("");
function openSensitive(row: SysSetting) {
  sensitiveRow.value = row;
  sensitiveValue.value = "";
  sensitiveVisible.value = true;
}
async function submitSensitive() {
  if (!sensitiveRow.value) return;
  // 仅写回当前行（变为脏），由底部保存条统一批量保存
  sensitiveRow.value.sysSettingValue = sensitiveValue.value;
  sensitiveVisible.value = false;
}

/* 长文本（TEXTAREA）：点击弹出大编辑框 */
const textVisible = ref(false);
const textRow = ref<SysSetting | null>(null);
const textValue = ref("");
function isTextarea(row: SysSetting): boolean {
  return normType(row.sysSettingValueType) === "TEXTAREA";
}
function openText(row: SysSetting) {
  textRow.value = row;
  textValue.value = row.sysSettingValue ?? "";
  textVisible.value = true;
}
async function submitText() {
  if (!textRow.value) return;
  // 仅写回当前行（变为脏），由底部保存条统一批量保存
  textRow.value.sysSettingValue = textValue.value;
  textVisible.value = false;
}
const emailTesting = ref(false);
async function testEmail() {
  emailTesting.value = true;
  try {
    await checkEmailConnectivity();
    message.success("邮件连接正常");
  } catch (e) {
    message.error((e as Error)?.message ?? "邮件连接失败");
  } finally {
    emailTesting.value = false;
  }
}

const syncLoading = ref(false);
async function handleSyncTemplate(channel: string) {
  syncLoading.value = true;
  try {
    const res = await syncMessageTemplate(channel);
    message.success("同步完成");
  } catch (e) {
    message.error((e as Error)?.message ?? "同步失败");
  } finally {
    syncLoading.value = false;
  }
}

onMounted(async () => {
  await loadAll();
  if (modules.value.length && !modules.value.some((m) => m.group === activeGroup.value)) {
    activeGroup.value = modules.value[0].group;
  }
});
onBeforeUnmount(destroySortables);
</script>

<template>
  <div class="system-page console" v-loading="loading">
    <!-- 顶部条 -->
    <header class="console__top">
      <div class="console__search">
        <el-icon class="console__search-icon"><Search /></el-icon>
        <input v-model="keyword" class="console__search-input" placeholder="搜索配置项，如品牌、端口、OTP…" />
      </div>
      <div class="console__ready" :class="{ 'is-all': readyCount === modules.length }">
        <span class="console__ready-dots">
          <i
            v-for="m in modules"
            :key="m.group"
            :class="{ 'is-on': moduleReady(m.group) }"
            :title="moduleMeta[m.group]?.name"
          />
        </span>
        <span class="console__ready-text">就绪 {{ readyCount }}/{{ modules.length }}</span>
      </div>
    </header>

    <div class="console__body">
      <!-- 常驻模块导航 -->
      <nav class="rail">
        <button
          v-for="m in modules"
          :key="m.group"
          class="rail__item"
          :class="{ 'is-active': m.group === activeGroup && !keyword }"
          @click="activeGroup = m.group; keyword = ''"
        >
          <span class="rail__icon">
            <svg
              v-if="moduleMeta[m.group]?.envelope"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <el-icon v-else :size="19">
              <component :is="moduleMeta[m.group]?.icon" />
            </el-icon>
          </span>
          <span class="rail__text">
            <span class="rail__name">{{ moduleMeta[m.group]?.name }}</span>
            <span class="rail__state" :class="moduleReady(m.group) ? 'is-ready' : 'is-empty'">
              {{ moduleReady(m.group) ? "已配置" : "未配置" }}
            </span>
          </span>
        </button>
      </nav>

      <!-- 主区 -->
      <main class="main">
        <!-- 搜索结果 -->
        <section v-if="keyword" class="search-view">
          <div class="search-view__head">“{{ keyword }}” 的搜索结果（{{ searchResults.length }}）</div>
          <el-empty v-if="!searchResults.length" description="未找到匹配的配置项" />
          <div
            v-for="r in searchResults"
            :key="r.sysSettingId"
            class="search-row"
            @click="jumpResult(r)"
          >
            <el-icon class="search-row__icon"><component :is="settingIcon(r)" /></el-icon>
            <div class="search-row__text">
              <div class="search-row__name">
                {{ settingLabel(r) }}
                <code>{{ r.sysSettingCode || r.sysSettingName }}</code>
              </div>
              <div class="search-row__desc">{{ r.sysSettingRemark || moduleMeta[r.sysSettingGroup || 'default']?.name }}</div>
            </div>
            <el-icon class="search-row__go"><EditPen /></el-icon>
          </div>
        </section>

        <!-- 模块内容 -->
        <template v-else>
          <!-- 英雄区 -->
          <section class="hero">
            <div class="hero__info">
              <span class="hero__chip">
                <svg
                  v-if="moduleMeta[activeGroup]?.envelope"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <el-icon v-else :size="26">
                  <component :is="moduleMeta[activeGroup]?.icon" />
                </el-icon>
              </span>
              <h1 class="hero__title">{{ moduleMeta[activeGroup]?.name }}</h1>
              <p class="hero__desc">{{ moduleMeta[activeGroup]?.desc }}</p>
              <span class="hero__state" :class="moduleReady(activeGroup) ? 'is-ready' : 'is-empty'">
                <span class="hero__dot" />
                {{ moduleReady(activeGroup) ? "已配置" : "尚未配置完成" }}
              </span>
            </div>

            <div class="hero__preview">
              <!-- 登录迷你预览 -->
              <div v-if="activeGroup === 'default'" class="h-login">
                <div class="h-browser">
                  <span class="h-browser__dots"><i /><i /><i /></span>
                  <span class="h-browser__url">登录页</span>
                </div>
                <div class="h-login__screen">
                  <div class="h-login__initial">
                    {{ (v("login.brandName") || "系").slice(0, 1) }}
                  </div>
                  <div class="h-login__name">{{ v("login.brandName") || "后台管理系统" }}</div>
                  <div class="h-login__sub">{{ v("login.welcome") || "欢迎登录" }}</div>
                  <div v-if="featureTags.length" class="h-login__tags">
                    <i v-for="(t, i) in featureTags" :key="i">{{ t }}</i>
                  </div>
                  <div class="h-login__methods">
                    <i :class="{ on: isOn('login.captcha') }">图形</i>
                    <i :class="{ on: isOn('SlidingBlockOpen') }">滑动</i>
                    <i :class="{ on: isOn('OpenSmsLogin') }">短信</i>
                  </div>
                </div>
              </div>

              <!-- 邮件迷你预览 -->
              <div v-else-if="activeGroup === 'smtp'" class="h-mail">
                <div class="h-mail__card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  <div class="h-mail__lines">
                    <div><span>主机</span><b>{{ v("smtp.host") || "未配置" }}</b></div>
                    <div><span>端口</span><b>{{ v("smtp.port") || "—" }}</b></div>
                    <div><span>发件</span><b>{{ v("smtp.from") || "未配置" }}</b></div>
                  </div>
                </div>
                <div class="h-mail__chips">
                  <i :class="{ on: isOn('smtp.sslEnable') }">SSL</i>
                  <i :class="{ on: isOn('smtp.starttls') }">STARTTLS</i>
                  <i :class="{ on: isOn('smtp.auth') }">认证</i>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                  <ReButton
                    type="primary"
                    plain
                    icon="Promotion"
                    :loading="emailTesting"
                    style="flex: 1"
                    @click="testEmail"
                  >发送测试邮件</ReButton>
                  <ReButton
                    type="primary"
                    plain
                    icon="Refresh"
                    :loading="syncLoading"
                    style="flex: 1"
                    @click="handleSyncTemplate('EMAIL')"
                  >同步模板</ReButton>
                </div>
              </div>

              <!-- 短信迷你手机 -->
              <div v-else-if="activeGroup === 'sms'" class="h-sms">
                <div class="h-phone">
                  <span class="h-phone__notch" />
                  <div class="h-phone__screen">
                    <div class="h-sms__bubble">
                      <b>【{{ v("sms.appSign") || "签名" }}】</b>
                      您的验证码为 358162
                    </div>
                  </div>
                </div>
                <div class="h-sms__meta">
                  <i class="on">{{ v("sms.appType") || "通道" }}</i>
                  <i>{{ v("sms.appId") ? "AppID 已配置" : "AppID 未配置" }}</i>
                </div>
                <ReButton
                  type="primary"
                  plain
                  icon="Refresh"
                  :loading="syncLoading"
                  style="width: 100%; margin-top: 10px"
                  @click="handleSyncTemplate('SMS')"
                >同步模板</ReButton>
              </div>

              <!-- 连接迷你预览 -->
              <div v-else-if="activeGroup === 'config'" class="h-conn">
                <div class="h-conn__ring" :class="{ on: isOn('socket.enable') }">
                  <el-icon :size="26"><Connection /></el-icon>
                </div>
                <div class="h-conn__status">
                  {{ isOn("socket.enable") ? "已启用" : "未启用" }}
                </div>
                <div class="h-conn__line">{{ v("socket.protocol") || "socketio" }} · {{ v("socket.context") || "/socket.io" }}</div>
                <div v-for="(u, i) in socketUrls.slice(0, 2)" :key="i" class="h-conn__url">{{ u }}</div>
              </div>

              <!-- 协议迷你预览 -->
              <div v-else class="h-doc">
                <el-icon :size="26"><Document /></el-icon>
                <div class="h-doc__title">用户协议</div>
                <div class="h-doc__body">{{ agreementBody.slice(0, 120) || "暂无正文" }}…</div>
              </div>
            </div>
          </section>

          <!-- 分区 Bento -->
          <section class="bento">
            <div v-for="(s, i) in sections" :key="s.key" class="sec-card">
              <header class="sec-card__head">
                <span class="sec-card__title">{{ s.title }}</span>
                <span class="sec-card__count">{{ s.rows.length }}</span>
              </header>
              <div
                class="sec-card__rows"
                :data-sec="s.key"
                :ref="(el) => setSectionEl(el, i)"
              >
                <div v-for="row in s.rows" :key="row.sysSettingId" class="srow">
                  <span class="srow__drag" title="拖动交换顺序" tabindex="0" aria-label="拖动交换顺序">
                    <el-icon :size="15"><Rank /></el-icon>
                  </span>
                  <span class="srow__icon">
                    <el-icon :size="16"><component :is="settingIcon(row)" /></el-icon>
                  </span>
                  <div class="srow__text">
                    <div class="srow__name">
                      {{ settingLabel(row) }}
                      <code>{{ row.sysSettingCode || row.sysSettingName }}</code>
                    </div>
                    <div class="srow__desc">{{ row.sysSettingRemark || typeLabel(row.sysSettingValueType) }}</div>
                  </div>
                  <div class="srow__value">
                    <div v-if="isSensitive(row)" class="srow__secret">
                      <code>••••••••</code>
                      <ReButton layout="square" type="primary" icon="EditPen" @click="openSensitive(row)" />
                    </div>
                    <button v-else-if="isTextarea(row)" class="srow__longtext" @click="openText(row)">
                      <span>{{ row.sysSettingValue || "点击编辑…" }}</span>
                      <el-icon><EditPen /></el-icon>
                    </button>
                    <SettingValueEditor v-else :row="row" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>
      </main>
    </div>

    <!-- 底部统一保存条：仅有未保存更改时出现 -->
    <Transition name="foot">
      <footer v-if="dirtyCount > 0" class="console__foot">
        <span class="batch-bar__dot" />
        <span class="batch-bar__info">有 {{ dirtyCount }} 项未保存</span>
        <div class="batch-bar__actions">
          <ReButton @click="discardAll">放弃更改</ReButton>
          <ReButton type="primary" :loading="savingAll" @click="saveAll">
            保存全部（{{ dirtyCount }}）
          </ReButton>
        </div>
      </footer>
    </Transition>

    <ReDialog
      v-model="sensitiveVisible"
      title="修改敏感配置"
      width="440"
      layout="modern"
      compact
      :footer-hidden="false" @ok="submitSensitive"
    >
      <ReInput
        layout="modern"
        v-model="sensitiveValue"
        type="password"
        placeholder="请输入新值"
        show-password
      />
    </ReDialog>

    <ReDialog
      v-model="textVisible"
      :title="textRow ? settingLabel(textRow) : '编辑'"
      width="680"
      layout="modern"
      :footer-hidden="false" @ok="submitText"
    >
      <el-input
        v-model="textValue"
        type="textarea"
        :rows="12"
        resize="vertical"
        :placeholder="'请输入' + (textRow ? settingLabel(textRow) : '内容')"
        class="console__text-area"
      />
    </ReDialog>

  </div>
</template>

<style scoped lang="scss">
/* ============ 底部统一保存条（仅有脏项时出现） ============ */
.console__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 14px;
  padding: 11px 16px;
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-lighter);
}
.foot-enter-active,
.foot-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.foot-enter-from,
.foot-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.batch-bar__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-warning);
  box-shadow: 0 0 0 3px var(--el-color-warning-light-9);
}
.batch-bar__info {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.batch-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.console {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0;
}

/* ============ 顶部 ============ */
.console__top {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  padding: 10px 10px;
  background: var(--el-bg-color);
  border-radius: 14px;
}
.console__search {
  position: relative;
  flex: 1;
  max-width: 460px;
  display: flex;
  align-items: center;
}
.console__search-icon {
  position: absolute;
  left: 13px;
  color: var(--el-text-color-placeholder);
  z-index: 1;
}
.console__search-input {
  width: 100%;
  height: 40px;
  padding: 0 16px 0 38px;
  font-size: 13.5px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.console__search-input::placeholder {
  color: var(--el-text-color-placeholder);
}
.console__search-input:hover {
  background: var(--el-fill-color);
}
.console__search-input:focus {
  outline: none;
  background: var(--el-bg-color);
  border-color: var(--el-color-primary-light-6);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
.console__ready {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.console__ready-dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.console__ready-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-border-color);
  transition: background 0.2s, box-shadow 0.2s;
}
.console__ready-dots i.is-on {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px var(--el-color-success-light-9);
}
.console__ready-text {
  font-size: 12.5px;
  font-weight: 600;
}
.console__ready.is-all {
  color: var(--el-color-success);
}
.console__text-area :deep(textarea) {
  font-size: 13.5px;
  line-height: 1.8;
}

.console__body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 16px;
}

/* ============ 模块导航 ============ */
.rail {
  flex: 0 0 208px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 15px;
  background: var(--el-bg-color);
}
.rail__item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px;
  border: none;
  border-radius: 11px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}
.rail__item:hover {
  background: var(--el-fill-color-light);
}
.rail__item.is-active {
  background: var(--el-color-primary-light-9);
}
.rail__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}
.rail__item.is-active .rail__icon {
  color: var(--el-color-primary);
  background: var(--el-color-white);
}
.rail__icon svg {
  width: 19px;
  height: 19px;
}
.rail__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.rail__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rail__state {
  font-size: 11px;
}
.rail__state.is-ready {
  color: var(--el-color-success);
}
.rail__state.is-empty {
  color: var(--el-text-color-placeholder);
}

/* ============ 主区 ============ */
.main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-right: 2px;
}

/* 英雄区 */
.hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: linear-gradient(150deg, var(--el-color-primary-light-9), var(--el-bg-color) 65%);
}
.hero__info {
  flex: 1;
  min-width: 0;
}
.hero__chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: var(--el-color-white);
  background: linear-gradient(140deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 8px 16px var(--el-color-primary-light-7);
}
.hero__chip svg {
  width: 26px;
  height: 26px;
}
.hero__title {
  margin: 14px 0 6px;
  font-size: 21px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.hero__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  max-width: 430px;
}
.hero__state {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 14px;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
}
.hero__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.hero__state.is-ready {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.hero__state.is-ready .hero__dot {
  background: var(--el-color-success);
}
.hero__state.is-empty {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.hero__state.is-empty .hero__dot {
  background: var(--el-text-color-placeholder);
}
.hero__preview {
  flex: 0 0 232px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 登录迷你 */
.h-browser {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  background: var(--el-fill-color-light);
}
.h-browser__dots i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 3px;
  border-radius: 50%;
  background: var(--el-border-color);
}
.h-browser__url {
  margin-left: auto;
  font-size: 10px;
  color: var(--el-text-color-secondary);
}
.h-login__screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 0 0 10px 10px;
  background: var(--el-bg-color);
}
.h-login__initial {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.h-login__name {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.h-login__sub {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}
.h-login__tags {
  display: flex;
  gap: 4px;
  margin: 2px 0;
}
.h-login__tags i {
  font-style: normal;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
.h-login__methods,
.h-mail__chips,
.h-sms__meta {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}
.h-login__methods i,
.h-mail__chips i,
.h-sms__meta i {
  font-style: normal;
  font-size: 9.5px;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
}
.h-login__methods i.on,
.h-mail__chips i.on,
.h-sms__meta i.on {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

/* 邮件迷你 */
.h-mail__card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 11px;
  background: var(--el-bg-color);
  color: var(--el-color-primary);
}
.h-mail__card svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
.h-mail__lines {
  flex: 1;
}
.h-mail__lines div {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  padding: 1px 0;
}
.h-mail__lines b {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

/* 短信迷你手机 */
.h-phone {
  position: relative;
  width: 118px;
  height: 178px;
  margin: 0 auto;
  border: 3px solid var(--el-border-color);
  border-radius: 18px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.h-phone__notch {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 34px;
  height: 6px;
  border-radius: 999px;
  background: var(--el-border-color);
  z-index: 2;
}
.h-phone__screen {
  padding: 15px 8px;
}
.h-sms__bubble {
  margin-top: 12px;
  padding: 8px;
  border-radius: 9px;
  background: var(--el-color-primary-light-9);
  font-size: 9.5px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}
.h-sms__bubble b {
  display: block;
  color: var(--el-color-primary);
}

/* 连接迷你 */
.h-conn {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.h-conn__ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color);
}
.h-conn__ring.on {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.h-conn__status {
  margin-top: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.h-conn__line {
  margin-top: 2px;
  font-size: 10px;
  color: var(--el-text-color-secondary);
}
.h-conn__url {
  margin-top: 5px;
  font-size: 9.5px;
  padding: 4px 7px;
  border-radius: 7px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  max-width: 100%;
}

/* 协议迷你 */
.h-doc {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--el-color-primary);
}
.h-doc__title {
  margin: 6px 0;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.h-doc__body {
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* ============ 分区 Bento ============ */
.bento {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 15px;
  margin-top: 16px;
}
.sec-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 15px;
  background: var(--el-bg-color);
  overflow: hidden;
}
.sec-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.sec-card__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.sec-card__count {
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 999px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}
.sec-card__rows {
  padding: 6px 10px;
}
.srow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 7px;
  border-radius: 10px;
  transition: background 0.2s;
}
.srow:hover {
  background: var(--el-fill-color-light);
}
.srow__drag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 6px;
  color: var(--el-text-color-placeholder);
  cursor: grab;
}
.srow__drag:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.srow__drag:active {
  cursor: grabbing;
}
.srow__drag:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}
.srow__icon {
  display: flex;
  flex-shrink: 0;
  color: var(--el-color-primary);
}
.srow__text {
  flex: 1;
  min-width: 0;
}
.srow__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.srow__name code {
  margin-left: 6px;
  font-size: 10.5px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.srow__desc {
  margin-top: 1px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.srow__value {
  flex-shrink: 0;
  min-width: 150px;
  max-width: 240px;
  display: flex;
  justify-content: flex-end;
}
.srow__secret {
  display: flex;
  align-items: center;
  gap: 7px;
}
.srow__secret code {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.srow__longtext {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 230px;
  max-width: 100%;
  padding: 8px 11px;
  border: 1px solid var(--el-border-color);
  border-radius: 9px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.srow__longtext:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
.srow__longtext span {
  flex: 1;
  min-width: 0;
  text-align: left;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.srow__longtext .el-icon {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}
.srow--ghost {
  opacity: 0.4;
}
.srow--chosen,
.srow--chosen * {
  user-select: none !important;
}

/* ============ 搜索结果 ============ */
.search-view__head {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}
.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
  margin-bottom: 9px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-row:hover {
  border-color: var(--el-color-primary-light-6);
  box-shadow: var(--el-box-shadow-lighter);
}
.search-row__icon {
  color: var(--el-color-primary);
}
.search-row__text {
  flex: 1;
  min-width: 0;
}
.search-row__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.search-row__name code {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.search-row__desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.search-row__go {
  color: var(--el-text-color-placeholder);
}

/* ============ 响应式 ============ */
@media (max-width: 880px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }
  .hero__preview {
    flex: none;
    width: 100%;
    max-width: 300px;
    align-self: center;
  }
}
@media (max-width: 760px) {
  .console__body {
    flex-direction: column;
  }
  .rail {
    flex: none;
    flex-direction: row;
    overflow-x: auto;
  }
  .rail__text {
    display: none;
  }
  .bento {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .srow,
  .rail__item,
  .search-row {
    transition-duration: 0.01ms !important;
  }
}
</style>
