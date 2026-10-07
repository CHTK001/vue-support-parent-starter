<template>
  <!--
    版式与 IdiomBankView 保持一致（page-container / top-zone / stats-row /
    filter-card / table-card / table-toolbar / table-footer），两页同属"数据配置"，
    视觉与操作习惯统一：页头+悬浮方卡统计、筛选卡、工具条+表格卡、底部"共 N 条"。

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
      <div class="table-toolbar">
        <div class="table-toolbar__left">
          <el-button type="primary" :icon="Plus" @click="openCreate">新增古诗</el-button>
        </div>
      </div>

      <!--
        直接使用 ReTable，不另做业务封装：
        - layout=table：默认表格（与成语库一致，横向一屏看全字段）
        - layout-switch=true：右上角保留「表格/视图」分段控件，表格看字段、视图看整段正文
        - layout-persist=false：不给上次选择留持久化，避免旧偏好把默认布局顶掉；
          切换在本会话内始终可用
        - #view 插槽接管视图模式单条；列插槽接管表格模式的两列摘要与操作列
      -->
      <ReTable
        :data="poemRows"
        :columns="poemColumns"
        :loading="loading"
        :row-key="'poemId'"
        layout="table"
        :layout-switch="true"
        :layout-persist="false"
        :layouts="['table', 'view']"
        :layout-labels="LAYOUT_LABELS"
        :pagination="false"
        :toolbar="false"
        border
        stripe
        empty-text="暂无古诗数据：可在「采集管理」启用古诗采集，或点右上角手工新增"
        @row-click="(row: Record<string, unknown>) => openPoem(row as unknown as Poem, 'view')"
      >
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

      <div class="table-footer">
        <span class="table-footer__total">共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @current-change="load"
          @size-change="load"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      width="1180px"
      top="5vh"
      destroy-on-close
      class="q-dialog poem-dialog"
      :show-close="false"
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

      <template #footer>
        <div class="dialog-foot">
          <template v-if="dialogMode === 'view'">
            <!-- 纯预览：只留关闭，不放编辑入口（编辑在列表每行的操作列里） -->
            <el-button @click="dialogVisible = false">关闭</el-button>
          </template>
          <template v-else>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button class="dialog-foot__save" type="primary" :loading="saving" @click="save">
              保存古诗
            </el-button>
          </template>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 古诗库管理
 *
 * - 页头 + 三张统计卡 + 筛选 + 表格 + 新增/编辑弹窗
 * - 保存时同步 edu_poem_grade 学段/年级映射（供游戏按学段取数）
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Plus, Reading, RefreshLeft, Search, View } from "@element-plus/icons-vue";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn, ReTableSwitchLayout } from "@repo/ui/components/ReTable/types";
import { eduaiApi } from "../api/eduaiApi";
import type { Poem } from "../api/types";
import ScPoemPreview from "../components/ScPoemPreview.vue";
import { DYNASTY_OPTIONS, POEM_TAG_OPTIONS } from "../constants/dimensions";
import { flattenPreview, parseTags } from "../utils/poemText";

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
/** 筛选后的全量结果（不只是当前页），统计卡按它算，否则分页后卡片会跟着页码变 */
const matched = ref<Poem[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const search = reactive({ gradeLevel: "", keyword: "" });

const dialogVisible = ref(false);
/** 列表数据（ReTable 的 data 期望索引签名类型，Poem 是具名接口，这里显式收窄） */
const poemRows = computed(() => rows.value as unknown as Record<string, unknown>[]);

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
  { prop: "actions", label: "操作", width: 110, align: "center", fixed: "right", slot: "col-actions" },
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

/** 收录作者数：按筛选后的全量去重，不是当前页 */
const authorCount = computed(() => new Set(matched.value.map((r) => r.poemAuthor).filter(Boolean)).size);
/** 可游戏篇目：按筛选后的全量统计正文含两句及以上的诗，不是当前页 */
const playableCount = computed(() => matched.value.filter((r) => splitCount(r.poemContent) >= 2).length);
/** 已补译文的篇数：按筛选后的全量统计 */
const translatedCount = computed(() => matched.value.filter((r) => Boolean(r.poemTranslation?.trim())).length);

/**
 * 统计卡（与成语页同构：标题 / 数值 / 提示 + 右上角图标底色）。
 * 数值一律取 matched（筛选后全量），不是当前页。
 */
const statCards = computed(() => [
  { title: "古诗总数", value: total.value, icon: Reading, bg: "var(--el-color-primary)", hint: "按筛选条件" },
  {
    title: "可游戏篇目",
    value: playableCount.value,
    icon: Plus,
    bg: "var(--el-color-success)",
    hint: "正文含两句及以上",
  },
  {
    title: "收录作者",
    value: authorCount.value,
    icon: EditPen,
    bg: "var(--el-color-warning)",
    hint: "去重后数量",
  },
  {
    title: "已有译文",
    value: translatedCount.value,
    icon: View,
    bg: "var(--el-color-success)",
    hint: "可对照学习",
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

async function load() {
  loading.value = true;
  try {
    // 取较大数量后在本地做分页与关键字过滤，避免后端额外加接口
    const list = (await eduaiApi.listPoems({ gradeLevel: search.gradeLevel || undefined, count: 5000 })) ?? [];
    const kw = search.keyword.trim();
    const filtered = kw
      ? list.filter((p) => (p.poemTitle ?? "").includes(kw) || (p.poemAuthor ?? "").includes(kw))
      : list;
    total.value = filtered.length;
    matched.value = filtered;
    const start = (pageNo.value - 1) * pageSize.value;
    rows.value = filtered.slice(start, start + pageSize.value);
  } catch {
    rows.value = [];
    matched.value = [];
    total.value = 0;
    ElMessage.error("加载古诗失败");
  } finally {
    loading.value = false;
  }
}

/** 提交筛选：回到第 1 页并按当前条件重新取数 */
function commitSearch() {
  pageNo.value = 1;
  void load();
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
    ElMessage.warning("请填写标题");
    return;
  }
  if (!form.poemContent?.trim()) {
    ElMessage.warning("请填写正文");
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
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    await load();
  } catch {
    ElMessage.error("保存失败");
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
    ElMessage.success("已删除");
    await load();
  } catch {
    ElMessage.error("删除失败");
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
/*
 * 版式基线与 IdiomBankView 逐条对齐（页头 + 悬浮方卡统计 + 筛选卡 + 表格卡 + 底部共 N 条）。
 * 只保留古诗特有的类（pb-view 视图行、pb-cell 单元格摘要、poem-layout 弹窗左右布局）。
 */

/* ---------- 页面容器 ---------- */
.page-container {
  height: 100%;
  overflow: auto;
  background: var(--el-bg-color-page);
}

/* ---------- 上区：页头 + 右侧悬浮正方形统计卡 ---------- */
.top-zone {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: -74px;
  position: relative;
  z-index: 2;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
  padding-top: 4px;
  min-width: 0;
  flex: 1;
}
.page-header__left {
  min-width: 0;
}
.page-header__title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.25;
}
.page-header__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.stats-row {
  display: flex;
  flex-shrink: 0;
  gap: 14px;
}
.stat-card {
  width: 148px;
  height: 148px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  /* koi 卡片不加投影：已有一条边框承载边界，边界色再提浅一档（-light → -lighter） */
  border: 1px solid var(--el-border-color-lighter);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  /* 浮起反馈是 koi 唯一允许的卡片投影 */
  box-shadow: 0 12px 28px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}
.stat-card__body {
  min-width: 0;
  width: 100%;
}
.stat-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.stat-card__value {
  font-size: 30px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.1;
}
.stat-card__hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
.stat-card__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-lg, 12px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  flex-shrink: 0;
  align-self: flex-end;
}

/* ---------- 筛选 ---------- */
.filter-card {
  border-radius: var(--el-radius-lg, 12px);
  margin-bottom: 14px;
  border: 0;
  position: relative;
  z-index: 1;
}
.filter-card :deep(.el-card__body) {
  padding: 92px 20px 18px;
}
.filter-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1.4fr) minmax(130px, 1fr) auto;
  gap: 14px;
  align-items: end;
}
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.filter-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.filter-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.filter-actions .el-button {
  border-radius: var(--el-radius-lg, 12px);
  min-width: 88px;
  font-weight: 600;
}

/* ---------- 表格 ---------- */
.table-card {
  border-radius: var(--el-radius-lg, 12px);
  border: 0;
  position: relative;
  z-index: 1;
}
.table-card :deep(.el-card__body) {
  padding: 16px 20px 18px;
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.table-toolbar__left .el-button {
  border-radius: var(--el-radius-lg, 12px);
  font-weight: 600;
}
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.table-footer__total {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
  .stat-card {
    width: 128px;
    height: 128px;
  }
  .stat-card__value {
    font-size: 24px;
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

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============
   统计卡与关闭键有 transition（与成语页同一口径），关掉后 :hover 只剩边框/投影反馈。 */
/* 统计卡有 transition / transform（ReButton 的动效由组件自身负责）；
   这里关掉统计卡的位移，避免与组件内已有的 reduced-motion 处理重复。 */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  .stat-card:hover {
    transform: none;
  }
}
</style>
