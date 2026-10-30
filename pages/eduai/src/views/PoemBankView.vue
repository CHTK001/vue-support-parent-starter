<template>
  <!--
    版式与 IdiomBankView 保持一致（page-container / top-zone / stats-row /
    filter-card / table-card），两页同属"数据配置"，
    视觉与操作习惯统一：页头+悬浮方卡统计、筛选卡、工具条+表格卡。
    新增按钮进 ReTable 工具栏左侧；总条数只保留分页栏里那处，不再另起底部行。

    仍用 ReTable（不另做业务封装）：它提供 table/view 布局切换，
    诗页默认表格且不持久化（:layout-persist="false"），右上角切换器可随时切到视图看整段正文。
  -->
  <div class="page-container">
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">古诗库</h1>
          <p class="page-header__sub">维护古诗内容与适用学段年级，供「古诗文闯关」等趣味游戏取材</p>
        </div>
      </div>

      <div class="stats-row">
        <div v-for="st in statCards" :key="st.title" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">{{ st.title }}</div>
            <div class="stat-card__value">{{ st.value }}</div>
            <div class="stat-card__hint">{{ st.hint }}</div>
          </div>
          <div class="stat-card__icon" :style="{ background: st.bg }">
            <el-icon :size="22"><component :is="st.icon" /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <div class="filter-field">
          <label class="filter-field__label">关键字</label>
          <el-input
            v-model="search.keyword"
            clearable
            placeholder="标题 / 作者"
            :prefix-icon="Search"
            @keyup.enter="commitSearch"
            @change="commitSearch"
            @clear="commitSearch"
          />
        </div>
        <div class="filter-field">
          <label class="filter-field__label">学段</label>
          <el-select v-model="search.gradeLevel" clearable placeholder="全部学段" style="width: 100%" @change="commitSearch">
            <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" :loading="loading" @click="commitSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="resetSearch">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <!--
        直接使用 ReTable，不另做业务封装：
        - layout=table：默认表格（与成语库一致，横向一屏看全字段）
        - layout-switch=true：右上角保留「表格/视图」分段控件，表格看字段、视图看整段正文
        - layout-persist=false：不给上次选择留持久化，避免旧偏好把默认布局顶掉；
          切换在本会话内始终可用
        - #view 插槽接管视图模式单条；列插槽接管表格模式的两列摘要与操作列
      -->
      <div class="table-wrap">
        <ReTable
          ref="tableRef"
          :loader="loadRows"
          :columns="poemColumns"
          :params="appliedParams"
          :row-key="'poemId'"
          layout="table"
          :layout-switch="true"
          :layout-persist="false"
          :layouts="['table', 'view']"
          :layout-labels="LAYOUT_LABELS"
          v-model:page="pageNo"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :toolbar="false"
          border
          stripe
          empty-text="暂无古诗数据：可在「采集管理」启用古诗采集，或点右上角手工新增"
          @load="onLoad"
          @load-error="pageLoadError"
          @row-click="(row: Record<string, unknown>) => openPoem(row as unknown as Poem, 'view')"
        >
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增古诗</el-button>
          </template>
          <template #col-poemContent="{ row }">
            <span class="pb-cell">{{ contentPreview(row.poemContent) }}</span>
          </template>
          <template #col-poemTranslation="{ row }">
            <span v-if="translationPreview(row.poemTranslation)" class="pb-cell">
              {{ translationPreview(row.poemTranslation) }}
            </span>
            <span v-else class="pb-cell pb-cell--none">—</span>
          </template>
          <template #col-actions="{ row }">
            <!-- 必须 .stop：ReTable 绑了 @row-click 打开预览，
                 不阻止冒泡会让「点编辑/删除」也触发一次预览 -->
            <ReButton
              layout="square"
              :icon="View"
              tip="预览"
              @click.stop="openPoem(row as unknown as Poem, 'view')"
            />
            <ReButton
              layout="square"
              type="primary"
              :icon="EditPen"
              tip="编辑"
              @click.stop="openPoem(row as unknown as Poem, 'edit')"
            />
            <ReButton
              layout="square"
              type="danger"
              :icon="Delete"
              tip="删除"
              @click.stop="remove(row as unknown as Poem)"
            />
          </template>
  
          <!-- 视图模式：标题/作者朝代/难度 + 正文与译文并排 + 操作 -->
          <template #view="{ row }">
            <div class="pb-view">
              <div class="pb-view__head">
                <span class="pb-view__title">{{ row.poemTitle }}</span>
                <span class="pb-view__meta">{{ row.poemDynasty }} · {{ row.poemAuthor }}</span>
                <span class="pb-view__level">{{ difficultyLabel(row.poemDifficulty) }}</span>
              </div>
              <div class="pb-view__cols">
                <div>
                  <div class="pb-view__label">正文</div>
                  <p class="pb-view__text">{{ contentPreview(row.poemContent) }}</p>
                </div>
                <div>
                  <div class="pb-view__label">译文</div>
                  <p class="pb-view__text pb-view__text--trans">
                    {{ translationPreview(row.poemTranslation) || "—" }}
                  </p>
                </div>
              </div>
              <div class="pb-view__ops">
                <ReButton
                  layout="square"
                  :icon="View"
                  tip="预览"
                  @click.stop="openPoem(row as unknown as Poem, 'view')"
                />
                <ReButton
                  layout="square"
                  type="primary"
                  :icon="EditPen"
                  tip="编辑"
                  @click.stop="openPoem(row as unknown as Poem, 'edit')"
                />
                <ReButton
                  layout="square"
                  type="danger"
                  :icon="Delete"
                  tip="删除"
                  @click.stop="remove(row as unknown as Poem)"
                />
              </div>
            </div>
          </template>
        </ReTable>
      </div>
    </el-card>

    <ReDialog
      v-model="dialogVisible"
      width="1180px"
      top="5vh"
      destroy-on-close
      class="q-dialog poem-dialog"
      :show-close="false"
      :show-window-shell="false"
    >
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><Reading /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ dialogTitle }}</div>
              <div class="dialog-head__sub">
                {{ dialogMode === "view" ? "只读查看，不提供编辑" : "维护正文译文与适用学段年级" }}
              </div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="dialogVisible = false" />
        </div>
      </template>

      <!--
        编辑态：左右布局（左侧表单，右侧实时预览）。
        查看态：**只渲染预览**，不渲染表单 —— 禁用表单仍是一堆灰框和 label，
        看着像"能改但不能改"，不符合"纯预览、只是看"的诉求。
      -->
      <div
        class="poem-layout"
        :class="{ 'poem-layout--preview': dialogMode === 'view' }"
      >
        <div v-if="dialogMode !== 'view'" class="poem-layout__form">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.poemTitle" placeholder="如：静夜思" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="作者">
              <el-input v-model="form.poemAuthor" placeholder="如：李白" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="朝代">
              <el-select
                v-model="form.poemDynasty"
                filterable
                allow-create
                default-first-option
                clearable
                placeholder="选择或输入朝代"
                style="width: 100%"
              >
                <el-option v-for="d in DYNASTY_OPTIONS" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="正文" required>
          <el-input
            v-model="form.poemContent"
            type="textarea"
            :rows="5"
            placeholder="整首正文，句间可用换行或标点分隔，如：床前明月光，疑是地上霜。举头望明月，低头思故乡。"
          />
        </el-form-item>
        <el-form-item label="译文">
          <el-input v-model="form.poemTranslation" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="赏析">
          <el-input v-model="form.poemAppreciation" type="textarea" :rows="3" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select
                v-model="formTags"
                multiple
                filterable
                allow-create
                default-first-option
                clearable
                placeholder="选择或输入标签"
                style="width: 100%"
              >
                <el-option v-for="t in POEM_TAG_OPTIONS" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度">
              <el-select v-model="form.poemDifficulty" style="width: 100%">
                <el-option :value="1" label="简单" />
                <el-option :value="2" label="中等" />
                <el-option :value="3" label="较难" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="适用学段">
          <el-select v-model="formLevels" multiple placeholder="选择适用学段" style="width: 100%">
            <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用年级">
          <el-select v-model="formGrades" multiple placeholder="不选表示该学段通用" style="width: 100%">
            <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
      </el-form>
        </div>

        <!-- 右侧：正文与译文的美化预览（ScPoemPreview） -->
        <div class="poem-layout__preview">
          <div class="poem-layout__preview-label">
            <span>预览</span>
            <el-switch
              v-model="translationInline"
              
              inline-prompt
              active-text="逐句"
              inactive-text="独立"
              style="--el-switch-on-color: var(--el-color-primary)"
            />
          </div>
          <ScPoemPreview
            :title="form.poemTitle"
            :author="form.poemAuthor"
            :dynasty="form.poemDynasty"
            :content="form.poemContent"
            :translation="form.poemTranslation"
            :appreciation="form.poemAppreciation"
            :difficulty="form.poemDifficulty"
            :tags="formTags"
            :grade-levels="formLevels"
            :translation-mode="translationInline ? 'inline' : 'block'"
          />
        </div>
      </div>

      <template v-if="dialogMode !== 'view'" #footer>
        <div class="dialog-foot">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button class="dialog-foot__save" type="primary" :loading="saving" @click="save">
            保存古诗
          </el-button>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 古诗库管理
 *
 * - 页头 + 三张统计卡 + 筛选 + 表格 + 新增/编辑弹窗
 * - 保存时同步 edu_poem_grade 学段/年级映射（供游戏按学段取数）
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Plus, Reading, RefreshLeft, Search, View } from "@element-plus/icons-vue";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn, ReTableSwitchLayout } from "@repo/ui/components/ReTable/types";
import { eduaiApi } from "../api/eduaiApi";
import { createPageLoader, pageLoadError, strParam } from "../api/pageLoader";
import type { Poem } from "../api/types";
import ScPoemPreview from "../components/ScPoemPreview.vue";
import { DYNASTY_OPTIONS, POEM_TAG_OPTIONS } from "../constants/dimensions";
import { flattenPreview, parseTags } from "../utils/poemText";
import ReDialog from "@repo/ui/re-dialog";

/** 学段与对应年级（与后端入库值保持一致） */
const GRADE_LEVELS = ["小学", "初中", "高中", "大学"] as const;
const GRADES_BY_LEVEL: Record<string, string[]> = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["初一", "初二", "初三"],
  高中: ["高一", "高二", "高三"],
  大学: ["大一", "大二", "大三", "大四"],
};

const loading = ref(false);
const saving = ref(false);
const rows = ref<Poem[]>([]);
const tableRef = ref();
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const search = reactive({ gradeLevel: "", keyword: "" });

/** 筛选参数：提交后交给后端 pageQuery */
const appliedParams = computed(() => ({
  gradeLevel: strParam(search.gradeLevel),
  keyword: strParam(search.keyword),
}));

/** 古诗分页 loader（后端筛选） */
const loadRows = createPageLoader((page, size, params) =>
  eduaiApi.pagePoems({
    ...params,
    pageNum: page,
    pageSize: size,
  }),
);

/** ReTable 每页加载完成后同步当前页行与总数 */
function onLoad(r: { data: unknown[]; total?: number }) {
  rows.value = (r.data ?? []) as Poem[];
  total.value = r?.total ?? rows.value.length;
}

const dialogVisible = ref(false);

/** 布局切换器文案（Re 组件通用，文案由业务侧给） */
const LAYOUT_LABELS: Partial<Record<ReTableSwitchLayout, string>> = {
  view: "视图",
  table: "表格",
};

/** 列定义（表格模式用；视图模式由 #view 插槽接管） */
const poemColumns: ReTableColumn[] = [
  { prop: "poemId", label: "ID", width: 70, align: "center" },
  { prop: "poemTitle", label: "标题", minWidth: 150, showOverflowTooltip: true },
  { prop: "poemAuthor", label: "作者", width: 100, showOverflowTooltip: true },
  { prop: "poemDynasty", label: "朝代", width: 80, align: "center" },
  { prop: "poemContent", label: "正文", minWidth: 260, slot: "col-poemContent" },
  { prop: "poemTranslation", label: "译文", minWidth: 240, slot: "col-poemTranslation" },
  {
    prop: "poemDifficulty",
    label: "难度",
    width: 76,
    align: "center",
    formatter: (_row, _col, value) => difficultyLabel(value),
  },
  { prop: "actions", label: "操作", width: 160, align: "center", fixed: "right", slot: "col-actions" },
];

/**
 * 正文列摘要（采集入库是 JSON 数组字符串，需归一化后再截断）。
 *
 * @param content 原始正文
 * @returns 单行摘要
 */
function contentPreview(content: unknown) {
  return flattenPreview(content as string | undefined, 60);
}

/**
 * 译文列摘要。
 *
 * @param translation 原始译文
 * @returns 单行摘要
 */
function translationPreview(translation: unknown) {
  return flattenPreview(translation as string | undefined, 56);
}

/**
 * 难度文案。
 *
 * @param value 难度值 1/2/3
 * @returns 中文文案
 */
function difficultyLabel(value: unknown) {
  const map: Record<number, string> = { 1: "简单", 2: "中等", 3: "较难" };
  return map[Number(value) || 1] ?? "简单";
}

/** 弹窗模式：view=只读查看，edit=编辑/新增 */
const dialogMode = ref<"view" | "edit">("view");
/** 弹窗标题：新增 / 查看 / 编辑 三态 */
const dialogTitle = computed(() => {
  if (!form.poemId) {
    return "新增古诗";
  }
  return dialogMode.value === "view" ? "查看古诗" : "编辑古诗";
});
const formLevels = ref<string[]>([]);
const formGrades = ref<string[]>([]);
/** 标签在表单里用数组（el-select multiple），落库时再拼成逗号分隔字符串 */
const formTags = ref<string[]>([]);
/** 预览的译文显示模式：true=逐句对照（副标题），false=正文后单独成块 */
const translationInline = ref(true);
const form = reactive<Partial<Poem>>(emptyForm());

/** 收录作者数：按当前页去重（服务端分页后前端不再持有全量，卡片为本页口径） */
const authorCount = computed(() => new Set(rows.value.map((r) => r.poemAuthor).filter(Boolean)).size);
/** 可游戏篇目：当前页正文含两句及以上的诗 */
const playableCount = computed(() => rows.value.filter((r) => splitCount(r.poemContent) >= 2).length);
/** 已补译文的篇数：当前页口径 */
const translatedCount = computed(() => rows.value.filter((r) => Boolean(r.poemTranslation?.trim())).length);

/**
 * 统计卡（与成语页同构：标题 / 数值 / 提示 + 右上角图标底色）。
 * 「古诗总数」取服务端全库 total（按筛选条件）；其余三张为**本页**口径 ——
 * 服务端分页后前端只持有当前页，不再有全量数据可算。
 */
const statCards = computed(() => [
  { title: "古诗总数", value: total.value, icon: Reading, bg: "var(--el-color-primary-light-9)", hint: "全库，按筛选条件" },
  {
    title: "可游戏篇目",
    value: playableCount.value,
    icon: Plus,
    bg: "var(--el-color-success-light-9)",
    hint: "本页正文含两句及以上",
  },
  {
    title: "收录作者",
    value: authorCount.value,
    icon: EditPen,
    bg: "var(--el-color-warning-light-9)",
    hint: "本页去重数量",
  },
  {
    title: "已有译文",
    value: translatedCount.value,
    icon: View,
    bg: "var(--el-color-success-light-9)",
    hint: "本页可对照学习",
  },
]);
const gradeOptions = computed(() => {
  const set = new Set<string>();
  (formLevels.value.length ? formLevels.value : GRADE_LEVELS).forEach((lv) =>
    (GRADES_BY_LEVEL[lv] ?? []).forEach((g) => set.add(g))
  );
  return [...set];
});

function emptyForm(): Partial<Poem> {
  return {
    poemTitle: "",
    poemAuthor: "",
    poemDynasty: "",
    poemContent: "",
    poemTranslation: "",
    poemAppreciation: "",
    poemTags: "",
    poemDifficulty: 1,
  };
}

/** 正文句数（按句末标点粗略统计） */
function splitCount(content?: string) {
  if (!content) {
    return 0;
  }
  return content.split(/[。！？!?；;]/).map((s) => s.trim()).filter(Boolean).length;
}

/** 提交筛选：回到第 1 页并按当前条件重新取数 */
function commitSearch() {
  void tableRef.value?.goto(1);
}

function resetSearch() {
  search.gradeLevel = "";
  search.keyword = "";
  commitSearch();
}

function openCreate() {
  Object.assign(form, emptyForm());
  form.poemId = undefined;
  formLevels.value = [];
  formGrades.value = [];
  formTags.value = [];
  dialogMode.value = "edit";
  dialogVisible.value = true;
}

/**
 * 按指定模式打开某首古诗（表格行点击与操作列共用入口）。
 *
 * @param row  行数据
 * @param mode view=只读查看，edit=编辑
 */
async function openPoem(row: Poem, mode: "view" | "edit" = "view") {
  dialogMode.value = mode;
  await openEdit(row);
}

async function openEdit(row: Poem) {
  try {
    const detail = await eduaiApi.getPoemDetail(row.poemId);
    Object.assign(form, detail ?? row);
    formLevels.value = detail?.gradeLevels ?? [];
    formGrades.value = detail?.grades ?? [];
    formTags.value = parseTags(detail?.poemTags ?? row.poemTags);
  } catch {
    Object.assign(form, row);
    formLevels.value = [];
    formGrades.value = [];
    formTags.value = parseTags(row.poemTags);
  }
  dialogVisible.value = true;
}

async function save() {
  if (!form.poemTitle?.trim()) {
    message.warning("请填写标题");
    return;
  }
  if (!form.poemContent?.trim()) {
    message.warning("请填写正文");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.savePoem({
      ...form,
      // 标签以逗号分隔字符串落库（与采集器写入形态一致）
      poemTags: formTags.value.join(","),
      gradeLevels: formLevels.value,
      grades: formGrades.value,
    });
    message.success("保存成功");
    dialogVisible.value = false;
    void tableRef.value?.reload();
  } catch {
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
}

async function remove(row: Poem) {
  try {
    await ElMessageBox.confirm(`确认删除《${row.poemTitle}》？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await eduaiApi.deletePoem(row.poemId);
    message.success("已删除");
    void tableRef.value?.reload();
  } catch {
    message.error("删除失败");
  }
}

onMounted(() => {
  // 表格 loader 自动加载首屏，无需手动触发
});
</script>

<style scoped>
/*
 * 版式基线与 InsectBankView 对齐（页头 + 横向统计卡 + 筛选卡 + 表格卡）。
 * 只保留古诗特有的类（pb-view 视图行、pb-cell 单元格摘要、poem-layout 弹窗左右布局）。
 */

/* ---------- 页面容器 ---------- */
.page-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--el-bg-color-page);
}

/* ---------- 上区：页头 + 右侧横向统计卡 ---------- */
.top-zone {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}
.page-header__title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.page-header__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 170px;
  padding: 12px 16px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}
.stat-card__body {
  min-width: 0;
}
.stat-card__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}
.stat-card__value {
  font-size: 24px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat-card__hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
.stat-card__icon {
  width: 42px;
  height: 42px;
  border-radius: var(--el-radius-lg, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

/* ---------- 筛选 ---------- */
.filter-card {
  border-radius: var(--el-radius-lg, 12px);
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: 12px 16px;
  align-items: end;
}
.filter-field__label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.filter-actions {
  display: flex;
  gap: 8px;
}

/* ---------- 表格 ---------- */
.table-card {
  border-radius: var(--el-radius-lg, 12px);
}
.table-wrap {  /* 固定容器高度：消除滚动条液面高度随滚动反复重算的抖动。
     374 = 本页实测 wrap.top 344.8 + el-main 底部留白 8 + 卡片 body
     底部内边距 21；此时表格卡正好贴到页面容器底边，不再留底空。
     本页统计卡单行、筛选单行，上方区域与昆虫库不同，故基准取
     同分布的 FunConfig 的 374 而非昆虫库的 493。
     min-height 取 300：更小视口下改走页面滚动，不把固定高度顶破。
     contain: layout size 让 ReTable 走 height:100%。 */
  height: calc(100vh - 374px);
  min-height: 300px;
  contain: layout size;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
/* ---------- ReTable 单元格与视图块 ---------- */
.pb-cell {
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.pb-cell--none {
  color: var(--el-text-color-placeholder);
}
.pb-view {
  position: relative;
  width: 100%;
  padding-right: 110px;
}
.pb-view__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.pb-view__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.pb-view__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pb-view__level {
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pb-view__cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}
.pb-view__label {
  margin-bottom: 2px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.pb-view__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}
.pb-view__text--trans {
  color: var(--el-text-color-secondary);
}
.pb-view__ops {
  position: absolute;
  top: 0;
  right: 0;
  white-space: nowrap;
}
@media (max-width: 900px) {
  .pb-view {
    padding-right: 0;
  }
  .pb-view__cols {
    grid-template-columns: minmax(0, 1fr);
  }
  .pb-view__ops {
    position: static;
    margin-top: 8px;
  }
}

/* ---------- 弹窗：与成语页同构的头部 / 主体 / 页脚 ---------- */
.q-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin-right: 0;
}
.q-dialog :deep(.el-dialog__body) {
  padding: 0;
}
.q-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
}
.dialog-head__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.dialog-head__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dialog-head__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}
.dialog-head__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.dialog-foot .el-button {
  border-radius: var(--el-radius-lg, 12px);
  min-width: 96px;
  font-weight: 600;
}

/* ---------- 弹窗内容：左表单 / 右预览 ---------- */
.poem-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  /* 与成语页 .q-dialog__body 同一内边距口径 */
  padding: 18px 24px;
  max-height: min(68vh, 720px);
  overflow: auto;
}
.poem-layout__form {
  min-width: 0;
}
/* 查看态：单列铺满，只放预览（去掉左侧表单后不再需要 1:1 分栏） */
.poem-layout--preview {
  grid-template-columns: minmax(0, 1fr);
}
.poem-layout__preview {
  min-width: 0;
  position: sticky;
  top: 0;
}
.poem-layout__preview-label {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
/* 窄屏（弹窗被压缩）时上下堆叠，避免左右都挤成一条 */
@media (max-width: 1100px) {
  .poem-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
</style>
