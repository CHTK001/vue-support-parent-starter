<script setup lang="ts">
/**
 * 策略控制台 —— 热更新 / 限流 / 黑白名单 / 灰度等运行时策略的统一入口
 *
 * 三个工作区：
 *   1. 热更新配置：运行时 setting 的独立维护入口；
 *   2. 限流配置：全局参数 + 接口/IP/账号三维规则；
 *   3. 黑白名单：IP 网段与账号访问名单。
 *
 * 页面采用“主导航 + 当前工作区 + 单一操作区”的控制台结构，避免卡片嵌套。
 */
import { computed, onMounted, provide, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import {
  deletePolicyConfig,
  getRateLimitGlobal,
  listHotReload,
  listRateLimit,
  pageForAccountBw,
  pageForIp,
  pagePolicyConfig,
  savePolicyConfig,
  togglePolicyConfig,
  updatePolicyConfig,
} from "../../api/systemApi";
import type { PolicyConfig } from "../../api/types";
import type {
  RePageResult,
  ReTableColumn,
  ReTableLoadParams,
} from "@repo/ui/re-table";
import ReTab from "@repo/ui/re-tab";
import PolicyHitDialog from "./policy/components/PolicyHitDialog.vue";
import PolicyHitCell from "./policy/components/PolicyHitCell.vue";
import PolicyGrayTab from "./policy/tabs/PolicyGrayTab.vue";
import PolicyHeaderTab from "./policy/tabs/PolicyHeaderTab.vue";
import PolicyRouteTab from "./policy/tabs/PolicyRouteTab.vue";
import PolicyHotReloadTab from "./policy/tabs/PolicyHotReloadTab.vue";
import PolicyRateLimitTab from "./policy/tabs/PolicyRateLimitTab.vue";
import PolicyBlackWhiteTab from "./policy/tabs/PolicyBlackWhiteTab.vue";
import PolicyOverviewTab from "./policy/tabs/PolicyOverviewTab.vue";
import { usePolicyHit } from "./policy/composables/usePolicyHit";
import { POLICY_HIT_KEY } from "./policy/composables/policyHitContext";
import { TABLE_TOOLBAR, rowKeyOf } from "./policy/shared/policyTable";

/**
 * 页面文案全部走 i18n，key 命名空间 policy.*
 *
 * <p>列定义、页签这类「构造时求值一次」的文案要包 {@link computed}，否则切换语言
 * 后不会重算；模板与事件处理函数里的 {@code t()} 本身在渲染期/调用期求值，
 * 无需额外处理。</p>
 */
const { t } = useI18n();

/**
 * 命中统计由 5 个页签共用，通过 provide/inject 共享同一个实例，
 * 避免把 hitCountOf / openHitDetail 等逐个透传。
 *
 * <p><b>本组件自己不能走 inject</b>：Vue 的 {@code inject} 只沿父链向上查找，
 * 找不到同一个组件里 provide 出去的值。所以这里直接持有返回值再 provide，
 * 子组件（命中弹窗、各页签）才用 {@code usePolicyHitContext} 注入。</p>
 */
const policyHit = usePolicyHit();
provide(POLICY_HIT_KEY, policyHit);
/**
 * 父模板里只剩 openHitDetail 与 loadHitCounts 需要直接调用。
 *
 * <p>ipHitType / accHitType / rateHitKey / hitCountOf 曾经也在这份解构里，
 * 分别给访问名单、限流、消息头三个页签的行内求策略键与命中数用；
 * 那三个页签拆成独立组件后改由它们自己注入，这里不再需要。
 * 留着会让人误以为父模板还要用。</p>
 *
 * <p><b>教训</b>：当时漏了 {@code hitCountOf}，渲染消息头表格的行时抛 ReferenceError ——
 * 而 Vue 的 patch 是同步的，nav 在 {@code <main>} 之前已经打好高亮，
 * {@code <main>} 的 patch 一旦抛错就被放弃，结果是「侧栏切了、内容没换」，
 * 浏览器里看不到任何报错。解构出来的名字用 {@code rg} 查得到、编译器也不报，
 * 只能靠单测（必须喂真实数据行）和浏览器双保险。</p>
 */
const { openHitDetail, loadHitCounts } = policyHit;

type MainTabName = "overview" | "hotreload" | "ratelimit" | "blackwhite" | "header" | "gray" | "route";

interface TableReloadRef {
  reload: () => Promise<void> | void;
}

/**
 * 已拆成独立组件的页签，表格都在各自组件内部。
 *
 * <p>这里只拿它们的 {@code reload}（组件已 defineExpose），供顶部「刷新」按钮
 * 统一调度 —— 刷新必须打到组件自己的 loader 上，直接调父组件的函数已经不存在了。</p>
 */
const grayTabRef = ref<TableReloadRef>();
const headerTabRef = ref<TableReloadRef>();
const routeTabRef = ref<TableReloadRef>();
/** 热更新页签也是独立组件，表格在它自己内部 */
const hotReloadTabRef = ref<TableReloadRef>();
/** 限流页签同样独立；它自己 setup 里已 load()，这里只备着重载入口 */
const rateLimitTabRef = ref<TableReloadRef>();
/** 访问名单页签独立，内部有 ip / account 两张子表，由它自己判断刷哪张 */
const blackWhiteTabRef = ref<TableReloadRef>();
/** 顶部刷新按钮的转圈标记：给已拆出去的页签用（父级读不到它们的 loading ref） */
const refreshing = ref(false);

/** 包一层 loading 标记再执行刷新动作 */
async function refreshSection(fn: () => Promise<void> | void): Promise<void> {
  refreshing.value = true;
  try {
    await fn();
  } finally {
    refreshing.value = false;
  }
}




const activeMainTab = ref<MainTabName>("overview");
const loadedMainTabs = ref<Record<MainTabName, boolean>>({
  overview: true,
  hotreload: false,
  ratelimit: false,
  blackwhite: false,
  gray: false,
  header: false,
  route: false,
});

const mainTabs = computed(() => [
  { name: "overview", label: t("policy.nav.overview.label"), caption: t("policy.nav.overview.caption"), icon: "DataBoard" },
  { name: "hotreload", label: t("policy.nav.hotreload.label"), caption: t("policy.nav.hotreload.caption"), icon: "Setting" },
  { name: "ratelimit", label: t("policy.nav.ratelimit.label"), caption: t("policy.nav.ratelimit.caption"), icon: "Stopwatch" },
  { name: "blackwhite", label: t("policy.nav.blackwhite.label"), caption: t("policy.nav.blackwhite.caption"), icon: "User" },
  { name: "gray", label: t("policy.nav.gray.label"), caption: t("policy.nav.gray.caption"), icon: "DataAnalysis" },
  { name: "header", label: t("policy.nav.header.label"), caption: t("policy.nav.header.caption"), icon: "Filter" },
  { name: "route", label: t("policy.nav.route.label"), caption: t("policy.nav.route.caption"), icon: "Link" },
]);
const activeMainMeta = computed(() => mainTabs.value.find((item) => item.name === activeMainTab.value) ?? mainTabs.value[0]);

const currentSectionLoading = computed(() => {
  if (activeMainTab.value === "overview") return overviewLoading.value;
  // 六个页签（热更新 / 限流 / 访问名单 / 灰度 / 消息头 / 接口管控）都已拆成独立组件，
  // 表格与请求都在组件内部，父级拿不到它们的 loading ref；
  // 统一用这个「刷新中」标记驱动顶部按钮的转圈。
  return refreshing.value;
});




const overviewLoading = ref(false);
const overview = ref({
  hotReloadTotal: 0,
  rateTotal: 0,
  rateEnabled: 0,
  /** 全局限流闸门：关着时下面所有规则（含 enabled=1 的）都不生效 */
  rateGlobalOn: false,
  ipTotal: 0,
  accountTotal: 0,
});

/** 总览只读统计：不改变当前工作区数据，加载失败按 0 展示。 */
async function loadOverview(): Promise<void> {
  overviewLoading.value = true;
  const [hot, interfaceRules, ipRules, accountRules, ipPage, accountPage, rateGlobal] = await Promise.allSettled([
    listHotReload(),
    listRateLimit("interface"),
    listRateLimit("ip"),
    listRateLimit("account"),
    pageForIp({ page: 1, pageSize: 1 }),
    pageForAccountBw({ page: 1, pageSize: 1 }),
    getRateLimitGlobal(),
  ]);
  const rules = [interfaceRules, ipRules, accountRules]
    .filter((item) => item.status === "fulfilled")
    .flatMap((item) => (item.status === "fulfilled" ? item.value.data ?? [] : []));
  overview.value = {
    hotReloadTotal: hot.status === "fulfilled" ? hot.value.data?.length ?? 0 : 0,
    rateTotal: rules.length,
    rateEnabled: rules.filter((rule) => rule.enabled === 1).length,
    // 取不到就按「关」处理：宁可说「都不生效」提醒用户去看，也不谎报限流在跑。
    rateGlobalOn: rateGlobal.status === "fulfilled" ? rateGlobal.value.data?.enabled === true : false,
    // 读 data.total 即可：http 响应拦截器已展平 ReturnPageResult 的内层
    ipTotal: ipPage.status === "fulfilled" ? ipPage.value.data?.total ?? 0 : 0,
    accountTotal: accountPage.status === "fulfilled" ? accountPage.value.data?.total ?? 0 : 0,
  };
  overviewLoading.value = false;
}

const overviewMetrics = computed(() => [
  { key: "hotreload", label: t("policy.overview.cards.hotreload.label"), value: overview.value.hotReloadTotal, unit: t("policy.overview.cards.hotreload.unit"), tone: "primary" },
  { key: "ratelimit", label: t("policy.overview.cards.ratelimit.label"), value: overview.value.rateTotal, unit: t("policy.overview.cards.ratelimit.unit"), tone: "warning" },
  { key: "blackwhite", label: t("policy.overview.cards.blackwhite.label"), value: overview.value.ipTotal + overview.value.accountTotal, unit: t("policy.overview.cards.blackwhite.unit"), tone: "success" },
  { key: "overview", label: t("policy.overview.cards.overview.label"), value: 4, unit: t("policy.overview.cards.overview.unit"), tone: "info" },
]);

async function refreshCurrentSection(): Promise<void> {
  if (activeMainTab.value === "overview") {
    await loadOverview();
    return;
  }
  if (activeMainTab.value === "hotreload") {
    await refreshSection(() => hotReloadTabRef.value?.reload());
    return;
  }
  if (activeMainTab.value === "ratelimit") {
    await refreshSection(() => rateLimitTabRef.value?.reload());
    void loadHitCounts();
    return;
  }
  if (activeMainTab.value === "gray") {
    await refreshSection(() => grayTabRef.value?.reload());
    return;
  }
  if (activeMainTab.value === "header") {
    await refreshSection(() => headerTabRef.value?.reload());
    void loadHitCounts();
    return;
  }
  if (activeMainTab.value === "route") {
    await refreshSection(() => routeTabRef.value?.reload());
    void loadHitCounts();
    return;
  }
  // 剩下只有「访问名单」，它内部还有 ip / account 两个子表，由组件自己判断刷哪张
  await refreshSection(() => blackWhiteTabRef.value?.reload());
}

async function handleMainTabChange(name: string): Promise<void> {
  const tab = name as MainTabName;
  activeMainTab.value = tab;
  if (tab === "overview") {
    await loadOverview();
    return;
  }
  if (tab === "ratelimit" && !loadedMainTabs.value.ratelimit) {
    // 限流页签已拆成独立组件，它自己在 setup 里 load()（全局配置 + 当前维度规则）。
    // 这里只在切到时补一次命中统计：规则键随维度变，挂载时那一次可能还没拿到。
    void loadHitCounts();
  }
  // 四个带「命中次数」列的页签都要取一次统计映射
  if (tab === "ratelimit" || tab === "blackwhite" || tab === "header" || tab === "route") {
    void loadHitCounts();
  }
  // gray / header / route 三个页签的表格由 ReTable 自己挂载时调 loader，这里只标记已加载；
  // 再显式调一次 loadX() 会多打一遍接口（日志里每个动作出现两条同秒请求就是这个原因）。
  if (tab === "gray") {
    loadedMainTabs.value.gray = true;
  }
  if (tab === "header") {
    loadedMainTabs.value.header = true;
  }
  if (tab === "route") {
    loadedMainTabs.value.route = true;
  }
}


onMounted(() => {
  // 只预加载总览。热更新页签已拆成独立组件，它自己在 setup 里 load()，
  // 这里再调一次会多打一遍接口（页签没打开时那份数据根本用不上）。
  void loadOverview();
});
</script>

<template>
  <div class="system-page policy-console koi-flex">
    <section class="policy-hero">
      <div class="policy-hero__copy">
        <div class="policy-hero__title">{{ t("policy.hero.title") }}</div>
        <div class="policy-hero__subtitle">{{ t("policy.hero.subtitle") }}</div>
      </div>
      <div class="policy-hero__actions">
        <span class="policy-hero__sync"><i />{{ t("policy.hero.chainOk") }}</span>
        <ReButton
          layout="square"
          icon="Refresh"
          :loading="currentSectionLoading"
          @click="refreshCurrentSection"
        >
          {{ t("policy.hero.refresh") }}
        </ReButton>
      </div>
    </section>

    <div class="policy-metrics">
      <button
        v-for="metric in overviewMetrics"
        :key="metric.key"
        type="button"
        class="policy-metric"
        :class="`is-${metric.tone}`"
        @click="handleMainTabChange(metric.key)"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong>
        <em>{{ t("policy.hero.enterConfig") }}</em>
      </button>
    </div>

    <div class="policy-shell">
      <nav class="policy-nav" :aria-label="t('policy.nav.aria')">
        <span class="policy-nav__label">{{ t("policy.nav.workspace") }}</span>
        <button
          v-for="(item, index) in mainTabs"
          :key="item.name"
          type="button"
          class="policy-nav__item"
          :class="{ 'is-active': activeMainTab === item.name }"
          @click="handleMainTabChange(item.name)"
        >
          <span class="policy-nav__index">0{{ index + 1 }}</span>
          <span class="policy-nav__body">
            <b>{{ item.label }}</b>
            <small>{{ item.caption }}</small>
          </span>
          <ReIcon :name="item.icon" size="18" class="policy-nav__icon" />
        </button>
        <div class="policy-nav__foot">
          <span>{{ t("policy.common.current") }}</span>
          <b>{{ activeMainMeta.label }}</b>
        </div>
      </nav>

      <main class="policy-content">
        <!-- 总览 -->
        <PolicyOverviewTab
          v-if="activeMainTab === 'overview'"
          :loading="overviewLoading"
          :hot-reload-total="overview.hotReloadTotal"
          :rate-total="overview.rateTotal"
          :rate-enabled="overview.rateEnabled"
          :rate-global-on="overview.rateGlobalOn"
          :black-white-total="overview.ipTotal + overview.accountTotal"
          @refresh="loadOverview"
          @navigate="handleMainTabChange"
        />

        <!-- 热更新 -->
        <PolicyHotReloadTab v-else-if="activeMainTab === 'hotreload'" ref="hotReloadTabRef" />

        <!-- 限流 -->
        <PolicyRateLimitTab v-else-if="activeMainTab === 'ratelimit'" ref="rateLimitTabRef" />

        <!-- 访问名单 -->
        <PolicyBlackWhiteTab v-else-if="activeMainTab === 'blackwhite'" ref="blackWhiteTabRef" />

        <!-- 灰度配置 -->
        <PolicyGrayTab v-else-if="activeMainTab === 'gray'" ref="grayTabRef" />

        <!-- 消息头拦截 -->
        <PolicyHeaderTab v-else-if="activeMainTab === 'header'" ref="headerTabRef" />

        <!-- 接口管控 -->
        <PolicyRouteTab v-else-if="activeMainTab === 'route'" ref="routeTabRef" />
      </main>
    </div>


    <!-- 命中明细弹窗：五个页签共用，状态由 usePolicyHit provide -->
    <PolicyHitDialog />


  </div>
</template>

<style scoped lang="scss">
/*
 * 「内核 Core」版式 —— 高密度主控台
 *
 * 设计取舍（相对上一版卡片化外壳）：
 *   1. 标题条不再是卡片，只留一条与内容同宽的分隔线：它只是「这是哪一页」，
 *      不需要和下面的工作区争夺视觉重量；
 *   2. 指标卡压到 10px/12px 的内边距、20px 的数字，四张并排一屏读得完；
 *   3. 侧栏收窄到 180px，当前页签用**实心主色**填充而不是描边浅底 ——
 *      侧栏项足够矮（36px）时，实心块比浅色块更容易一眼定位；
 *   4. 内容区不再叠第二层边框，交给 .policy-view 自己表达层级（见 policyShared.scss）。
 *
 * 结构与类名完全保留：模板、i18n、页签调度、刷新入口都没动，
 * 单测里 .policy-nav__item / .policy-hero__actions [data-icon="Refresh"] 照常命中。
 */

.policy-console {
  --policy-surface: var(--theme-color-bg-container, var(--el-bg-color));
  --policy-line: var(--el-border-color-lighter);
  /* 密集版式专用：侧栏底、选中态前景，集中在这里便于换肤时一起改 */
  --policy-nav-bg: var(--el-fill-color-light);
  --policy-nav-on-bg: var(--el-color-primary);
  --policy-nav-on-fg: var(--el-color-white);
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 8px 14px 12px;
  overflow: auto;
  box-sizing: border-box;
}

/* ==================== 标题条 ==================== */
/* 无边框、无阴影、无圆角：一条底线 + 紧排的三行字。
   视觉层级靠字号差（15 / 11 / 10）而不是靠容器边界。 */
.policy-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  flex: none;
  padding: 2px 0 10px;
  border-bottom: 1px solid var(--policy-line);
}

.policy-hero__copy { min-width: 0; }

.policy-hero__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.policy-hero__subtitle {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.45;
}

.policy-hero__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

/* 运行状态点：11px 文字，点缩到 6px，外圈光晕收窄，不抢标题的注意力。 */
.policy-hero__sync {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  white-space: nowrap;
}

.policy-hero__sync i {
  width: 6px;
  height: 6px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent);
}

/* ==================== 指标条 ==================== */
/* 四列一格不变，只压密度：数字从 24px 收到 20px，
   标签 11px、说明 9px，行高收紧后四条并排正好落在一条水平线上。 */
.policy-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  flex: none;
}

.policy-metric {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 2px 10px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--policy-line);
  border-radius: 6px;
  background: var(--el-bg-color);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

/* 悬停只提边框与底色，不加阴影：密集列表里逐格阴影会让整条看上去在抖。 */
.policy-metric:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

.policy-metric span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.3;
}

.policy-metric strong {
  grid-row: 1 / 3;
  grid-column: 2;
  align-self: center;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.policy-metric strong small {
  margin-left: 2px;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 500;
}

.policy-metric em {
  color: var(--el-text-color-placeholder);
  font-size: 9px;
  font-style: normal;
  line-height: 1.3;
}

.policy-metric.is-primary strong { color: var(--el-color-primary); }
.policy-metric.is-warning strong { color: var(--el-color-warning); }
.policy-metric.is-success strong { color: var(--el-color-success); }
.policy-metric.is-info strong { color: var(--el-color-info); }

/* ==================== 侧栏 + 内容 ==================== */
.policy-shell {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--policy-line);
  border-radius: 10px;
  background: var(--policy-surface);
}

/* 侧栏底色比内容板深一档，靠色差说明「这块是导航、那块是工作区」，
   避免再套一层描边。 */
.policy-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 8px;
  border-right: 1px solid var(--policy-line);
  background: var(--policy-nav-bg);
}

/* 分组标签在密集版里删掉：七个页签的先后顺序已经由编号 01…07 表达，
   再加一行大写字母只会多占 16px 高度。保留 DOM，只隐藏。 */
.policy-nav__label { display: none; }

.policy-nav__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.policy-nav__item:hover:not(.is-active) {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

/* 实心选中态：白字 + 主色底。
   用 :not(.is-active) 保护上面那条 hover，否则鼠标停在当前项上会把它洗白。 */
.policy-nav__item.is-active {
  border-color: var(--policy-nav-on-bg);
  background: var(--policy-nav-on-bg);
  color: var(--policy-nav-on-fg);
}

.policy-nav__index {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
}

.policy-nav__item.is-active .policy-nav__index {
  color: color-mix(in srgb, var(--policy-nav-on-fg) 70%, transparent);
}

.policy-nav__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.policy-nav__body b {
  overflow: hidden;
  color: inherit;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.policy-nav__body small {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.policy-nav__item.is-active .policy-nav__body small {
  color: color-mix(in srgb, var(--policy-nav-on-fg) 82%, transparent);
}

.policy-nav__icon { color: inherit; opacity: 0.85; }

/* 底部「当前工作区」在密集版里也隐藏：当前项已经实心高亮，重复一次是噪声。 */
.policy-nav__foot { display: none; }

.policy-content {
  min-width: 0;
  min-height: 0;
  padding: 10px;
  overflow: auto;
}

/* .policy-pipeline / .policy-node / .policy-overview-card* / .policy-global-* 都已
   随各自的页签组件搬走（总览 → PolicyOverviewTab、限流 → PolicyRateLimitTab），
   父组件只剩页面外框（hero / 指标卡 / 左侧导航 / 内容区）。 */

@media screen and (max-width: 1280px) {
  .policy-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .policy-shell { grid-template-columns: 168px minmax(0, 1fr); }
}

@media screen and (max-width: 768px) {
  .policy-console { overflow: auto; padding: 6px 10px 10px; }
  .policy-hero { flex-direction: column; align-items: stretch; }
  .policy-hero__actions { width: 100%; justify-content: space-between; }
  .policy-metrics { grid-template-columns: 1fr; }
  .policy-shell { grid-template-columns: 1fr; overflow: visible; }
  /* 窄屏回到横向滚动条：竖排七项会把首屏内容全推到折叠线以下。 */
  .policy-nav {
    flex-direction: row;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid var(--policy-line);
  }
  .policy-nav__item { min-width: 118px; flex: none; }
  .policy-content { padding: 8px 0 0; }
}

@media (prefers-reduced-motion: reduce) {
  .policy-metric,
  .policy-nav__item { transition: none; }
}
</style>

<!--
  非 scoped：引入页签骨架的共享规则。

  上面的 <style scoped> 只对 PolicyTask.vue 自己模板里渲染的元素生效，拆到
  policy/tabs/*.vue、policy/components/*.vue 里的页签模板一条都匹配不上。
  共用规则因此放在 policy/policyShared.scss（全局），由各组件用非 scoped 的
  style 块引进来；本文件自己也要引，因为它自己也在渲染 .policy-view 等。
  归属与边界见 policyShared.scss 头部说明。
-->
<style lang="scss">
@use "./policy/policyShared.scss";
</style>
