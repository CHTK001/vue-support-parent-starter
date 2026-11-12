<template>
  <div class="page-container">
    <!-- 上区：页头 + 右侧悬浮正方形统计卡 -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">成语库</h1>
          <p class="page-header__sub">维护成语及其学段年级归属，供「成语消消乐」取材</p>
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
            v-model="searchDraft.keyword"
            clearable
            placeholder="成语 / 拼音 / 释义"
            :prefix-icon="Search"
            @keyup.enter="commitSearch"
            @change="commitSearch"
            @clear="commitSearch"
          />
        </div>
        <div class="filter-field">
          <label class="filter-field__label">学段</label>
          <el-select v-model="searchDraft.gradeLevel" clearable placeholder="全部学段" style="width: 100%" @change="commitSearch">
            <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">年级</label>
          <el-select v-model="searchDraft.grade" clearable placeholder="全部年级" style="width: 100%" @change="commitSearch">
            <el-option v-for="g in searchGradeOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">难度</label>
          <el-select v-model="searchDraft.difficulty" clearable placeholder="全部难度" style="width: 100%" @change="commitSearch">
            <el-option v-for="d in DIFFICULTIES" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" :loading="loading" @click="commitSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 工具条 + 表格 -->
    <el-card shadow="never" class="table-card">
      <div v-loading="loading" class="table-wrap">
        <ReTable
            ref="tableRef"
            :loader="loadRows"
            :columns="idiomColumns"
            :params="appliedParams"
            :row-key="'idiomId'"
            v-model:page="pageNo"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="table"
            :layout-switch="false"
            :toolbar="false"
            stripe
            :settings="{ border: false }"
            class="idiom-table"
            @load="onLoad"
            @load-error="pageLoadError"
            @row-click="(row: Record<string, unknown>) => openEdit(row as unknown as Idiom)"
          >
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增成语</el-button>
          </template>
          <template #empty>
            <el-empty :image-size="88" description="暂无成语，点击「新增成语」创建" />
          </template>
          <template #col-idiomContent="{ row }">
            <span
              class="idiom-text idiom-hover-target"
              @mouseenter="startIdiomHover($event, row as unknown as Idiom)"
              @mouseleave="cancelIdiomHover"
            >{{ row.idiomContent }}</span>
          </template>
          <template #col-idiomDifficulty="{ row }">
            <span class="tag-pill" :class="diffClass(row.idiomDifficulty)">
              {{ diffLabel(row.idiomDifficulty) }}
            </span>
          </template>
          <template #col-actions="{ row }">
            <!-- 必须 .stop：本表格绑了 @row-click="openEdit"，
                 不阻止冒泡会让「点预览/删除」也触发一次「打开编辑弹窗」 -->
            <ReButton layout="square" :icon="View" tip="预览" @click.stop="openPreview(row as unknown as Idiom)" />
            <ReButton
              layout="square"
              type="primary"
              :icon="EditPen"
              tip="编辑"
              @click.stop="openEdit(row as unknown as Idiom)"
            />
            <ReButton
              layout="square"
              type="danger"
              :icon="Delete"
              tip="删除"
              @click.stop="remove(row as unknown as Idiom)"
            />
          </template>
        </ReTable>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <ReDialog v-model="dialogVisible" class="q-dialog" width="880" :show-close="false" :show-window-shell="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><Collection /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ form.idiomId ? "编辑成语" : "新增成语" }}</div>
              <div class="dialog-head__sub">维护成语释义与适用学段年级</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="dialogVisible = false" />
        </div>
      </template>

      <div class="q-dialog__body">
        <el-form :model="form" label-width="110" @submit.prevent>
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />基本信息</div>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="成语" required>
              <el-input v-model="form.idiomContent" maxlength="20" placeholder="如：守株待兔" />
            </el-form-item>
            <el-form-item label="拼音" required>
              <el-input v-model="form.idiomPinyin" placeholder="如：shǒu zhū dài tù" />
            </el-form-item>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="难度">
              <el-rate v-model="form.idiomDifficulty" :max="5" />
            </el-form-item>
            <el-form-item label="标签">
              <el-input v-model="form.idiomTags" placeholder="逗号分隔，如：寓言,动物" />
            </el-form-item>
          </div>

          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />释义与出处</div>
          </div>
          <el-form-item label="释义" required>
            <el-input v-model="form.idiomMeaning" type="textarea" :rows="2" placeholder="成语释义" />
          </el-form-item>
          <div class="form-grid form-grid--2">
            <el-form-item label="出处">
              <el-input v-model="form.idiomSource" placeholder="如：《韩非子·五蠹》" />
            </el-form-item>
            <el-form-item label="例句">
              <el-input v-model="form.idiomExample" placeholder="例句" />
            </el-form-item>
          </div>

          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />适用学段年级</div>
          </div>
          <el-form-item label="学段">
            <el-select v-model="formLevels" multiple placeholder="选择适用学段" style="width: 100%">
              <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
            </el-select>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="formGrades" multiple placeholder="不选表示该学段通用" style="width: 100%">
              <el-option v-for="g in formGradeOptions" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button class="dialog-foot__save" type="primary" :loading="saving" @click="save">
            保存成语
          </el-button>
        </div>
      </template>
    </ReDialog>

    <!--
      纯预览弹窗：只读，刻意不放任何输入框 / 保存按钮。
      与上方编辑弹窗并存，编辑入口仍在列表操作列。
    -->
    <ReDialog
      v-model="previewVisible"
      class="q-dialog pv-dialog"
      width="720"
      :show-close="false"
      :show-window-shell="false"
      align-center
    >
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><View /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">成语预览</div>
              <div class="dialog-head__sub">只读查看，不提供编辑</div>
            </div>
          </div>
          <ReButton
            layout="square"
            :icon="Close"
            tip="关闭"
            @click="previewVisible = false"
          />
        </div>
      </template>

      <div v-if="previewRow" class="pv">
        <div class="pv__head">
          <div class="pv__word">{{ previewRow.idiomContent }}</div>
          <div class="pv__pinyin">{{ previewRow.idiomPinyin || "—" }}</div>
          <div class="pv__meta">
            <span class="tag-pill" :class="diffClass(previewRow.idiomDifficulty)">
              {{ diffLabel(previewRow.idiomDifficulty) }}
            </span>
            <span v-for="lv in previewRow.gradeLevels ?? []" :key="lv" class="pv__chip">{{ lv }}</span>
            <span v-for="g in previewRow.grades ?? []" :key="g" class="pv__chip">{{ g }}</span>
            <span v-for="t in previewTags" :key="t" class="pv__chip pv__chip--tag">{{ t }}</span>
          </div>
        </div>

        <div class="pv__block">
          <div class="pv__block-title">释义</div>
          <div class="pv__block-text">{{ previewRow.idiomMeaning || "—" }}</div>
        </div>

        <div v-if="previewRow.idiomSource" class="pv__block">
          <div class="pv__block-title">出处</div>
          <div class="pv__block-text">{{ previewRow.idiomSource }}</div>
        </div>

        <div v-if="previewRow.idiomExample" class="pv__block">
          <div class="pv__block-title">例句</div>
          <div class="pv__block-text">{{ previewRow.idiomExample }}</div>
        </div>

        <div v-if="previewRow.idiomSynonyms || previewRow.idiomAntonyms" class="pv__grid">
          <div v-if="previewRow.idiomSynonyms" class="pv__block">
            <div class="pv__block-title">近义词</div>
            <div class="pv__block-text">{{ previewRow.idiomSynonyms }}</div>
          </div>
          <div v-if="previewRow.idiomAntonyms" class="pv__block">
            <div class="pv__block-title">反义词</div>
            <div class="pv__block-text">{{ previewRow.idiomAntonyms }}</div>
          </div>
        </div>
      </div>
    </ReDialog>

    <IdiomHoverPreview
      :visible="idiomHover.visible"
      :anchor="idiomHover.anchor"
      :row="idiomHover.row"
      :diff-text="idiomHover.row ? diffLabel(idiomHover.row.idiomDifficulty) : '-'"
      :diff-class="idiomHover.row ? diffClass(idiomHover.row.idiomDifficulty) : 'is-gray'"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * IdiomBankView —— 成语库（数据配置）
 *
 * 成语内容 CRUD + 适用学段/年级绑定（保存时同步 edu_idiom_grade，供消消乐按学段取材）。
 * 样式统一使用 koi / Element Plus 变量（--el-*）。
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { Close, Collection, Delete, EditPen, Plus, RefreshLeft, Search, View } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import { createPageLoader, pageLoadError, strParam } from "../api/pageLoader";
import type { Idiom } from "../api/types";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";
import IdiomHoverPreview from "../components/IdiomHoverPreview.vue";

const GRADE_LEVELS = ["小学", "初中", "高中", "大学"] as const;
const GRADES_BY_LEVEL: Record<string, string[]> = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["初一", "初二", "初三"],
  高中: ["高一", "高二", "高三"],
  大学: ["大一", "大二", "大三", "大四"],
};

const DIFFICULTIES = [1, 2, 3, 4, 5].map((n) => ({
  value: n,
  label: `${n} · ${["很易", "较易", "中等", "较难", "很难"][n - 1]}`,
}));

const diffLabel = (n?: number) => {
  if (n == null) return "-";
  if (n <= 2) return "简单";
  if (n === 3) return "中等";
  return "困难";
};
const diffClass = (n?: number) => {
  if (n == null) return "is-gray";
  if (n <= 2) return "is-green";
  if (n === 3) return "is-orange";
  return "is-red";
};

// ==================== 列表 ====================
const loading = ref(false);
const rows = ref<Idiom[]>([]);
const tableRef = ref();
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const blankSearch = () => ({
  keyword: "",
  gradeLevel: "",
  grade: "",
  difficulty: null as number | null,
});
const searchDraft = reactive(blankSearch());
const applied = reactive(blankSearch());

/** 筛选参数：提交后交给后端 pageQuery */
const appliedParams = computed(() => ({
  keyword: strParam(applied.keyword),
  gradeLevel: strParam(applied.gradeLevel),
  grade: strParam(applied.grade),
  difficulty: applied.difficulty ?? undefined,
}));

/** 成语分页 loader（后端筛选） */
const loadRows = createPageLoader((page, size, params) =>
  eduaiApi.pageIdioms({
    ...params,
    pageNum: page,
    pageSize: size,
  }),
);

/** ReTable 每页加载完成后同步当前页行与总数 */
function onLoad(r: { data: unknown[]; total?: number }) {
  rows.value = (r.data ?? []) as Idiom[];
  total.value = r?.total ?? rows.value.length;
}

const searchGradeOptions = computed(() =>
  applied.gradeLevel ? GRADES_BY_LEVEL[applied.gradeLevel] ?? [] : Object.values(GRADES_BY_LEVEL).flat(),
);

/**
 * 成语列表的列定义（ReTable 表格模式用）。
 *
 * <p>自定义单元格一律走 {@code #col-<prop>} 插槽；「难度 / 操作」两列
 * 需要包一层渲染，同样挂插槽。</p>
 */
const idiomColumns: ReTableColumn[] = [
  { prop: "idiomId", label: "ID", width: 70 },
  { prop: "idiomContent", label: "成语", width: 120, slot: "col-idiomContent" },
  { prop: "idiomPinyin", label: "拼音", width: 180, showOverflowTooltip: true },
  { prop: "idiomMeaning", label: "释义", minWidth: 220, showOverflowTooltip: true },
  { prop: "idiomSource", label: "出处", width: 150, showOverflowTooltip: true },
  { prop: "idiomDifficulty", label: "难度", width: 90, slot: "col-idiomDifficulty" },
  { prop: "idiomTags", label: "标签", width: 130, showOverflowTooltip: true },
  { prop: "actions", label: "操作", width: 160, align: "center", fixed: "right", slot: "col-actions" },
];

const statCards = computed(() => {
  const list = rows.value;
  const easy = list.filter((r) => (r.idiomDifficulty ?? 3) <= 2).length;
  const hard = list.filter((r) => (r.idiomDifficulty ?? 3) >= 4).length;
  return [
    // total 是服务端按筛选条件算的，写「全部成语」会在筛选后自相矛盾
    { title: "成语总数", value: total.value, icon: Collection, bg: "var(--el-color-primary-light-9)", hint: "按筛选条件" },
    { title: "本页简单", value: easy, icon: Plus, bg: "var(--el-color-success-light-9)", hint: "难度 ≤ 2" },
    { title: "本页困难", value: hard, icon: Delete, bg: "var(--el-color-warning-light-9)", hint: "难度 ≥ 4" },
  ];
});

function commitSearch() {
  Object.assign(applied, { ...searchDraft });
  void tableRef.value?.goto(1);
}

function handleReset() {
  Object.assign(searchDraft, blankSearch());
  commitSearch();
}

// ==================== 表单 ====================
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<Idiom>>({});
const formLevels = ref<string[]>([]);
const formGrades = ref<string[]>([]);

const formGradeOptions = computed(() => {
  const levels = formLevels.value;
  if (!levels.length) return [];
  const set = new Set<string>();
  levels.forEach((lv) => (GRADES_BY_LEVEL[lv] ?? []).forEach((g) => set.add(g)));
  return [...set];
});

function resetForm() {
  Object.assign(form, {
    idiomId: undefined,
    idiomContent: "",
    idiomPinyin: "",
    idiomMeaning: "",
    idiomSource: "",
    idiomExample: "",
    idiomSynonyms: "",
    idiomAntonyms: "",
    idiomDifficulty: 3,
    idiomTags: "",
  });
  formLevels.value = [];
  formGrades.value = [];
}

const openCreate = () => {
  resetForm();
  dialogVisible.value = true;
};

// ==================== 纯预览（只读，无任何编辑控件） ====================
/** 预览弹窗是否打开 */
const previewVisible = ref(false);
/** 预览中的成语（已补齐详情字段） */
const previewRow = ref<Idiom | null>(null);

/** 行悬停预览的锚点与当前行（成语单元格） */
const idiomHover = reactive<{
  visible: boolean;
  anchor: HTMLElement | null;
  row: Idiom | null;
}>({
  visible: false,
  anchor: null,
  row: null,
});
let idiomHoverTimer: ReturnType<typeof setTimeout> | null = null;

function startIdiomHover(e: MouseEvent, row: Idiom) {
  if (idiomHoverTimer) clearTimeout(idiomHoverTimer);
  idiomHover.row = row;
  idiomHover.anchor = e.currentTarget as HTMLElement;
  idiomHoverTimer = setTimeout(() => {
    idiomHover.visible = true;
  }, 120);
}

function cancelIdiomHover() {
  if (idiomHoverTimer) {
    clearTimeout(idiomHoverTimer);
    idiomHoverTimer = null;
  }
  idiomHover.visible = false;
}

/** 预览用的标签列表（idiomTags 为逗号分隔的字符串） */
const previewTags = computed(() =>
  (previewRow.value?.idiomTags ?? "")
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
);

/**
 * 打开只读预览。
 *
 * 与编辑弹窗刻意分开：这里不渲染任何 el-form / 输入框，只有排版好的内容，
 * 供"只是看看"的场景（投屏讲解、核对释义）使用。
 *
 * @param row 列表行数据
 */
async function openPreview(row: Idiom) {
  previewRow.value = { ...row };
  previewVisible.value = true;
  try {
    const detail = await eduaiApi.getIdiomDetail(row.idiomId);
    if (detail) {
      previewRow.value = detail;
    }
  } catch {
    /* 详情拉不到就用列表已有字段，不打断预览 */
  }
}

async function openEdit(row: Idiom) {
  resetForm();
  Object.assign(form, { ...row });
  dialogVisible.value = true;
  try {
    const detail = await eduaiApi.getIdiomDetail(row.idiomId);
    if (detail) {
      Object.assign(form, detail);
      formLevels.value = detail.gradeLevels ?? [];
      formGrades.value = detail.grades ?? [];
    }
  } catch {
    /* 详情失败时保留列表值 */
  }
}

const save = async () => {
  if (!form.idiomContent || !form.idiomPinyin || !form.idiomMeaning) {
    message.warning("请填写成语/拼音/释义");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.saveIdiom({
      ...form,
      gradeLevels: formLevels.value,
      grades: formGrades.value,
    });
    message.success("保存成功");
    dialogVisible.value = false;
    void tableRef.value?.reload();
  } catch (e) {
    message.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    saving.value = false;
  }
};

async function remove(row: Idiom) {
  try {
    await ElMessageBox.confirm(`确认删除成语「${row.idiomContent}」吗？`, "删除成语", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await eduaiApi.deleteIdiom(row.idiomId);
    message.success("已删除");
    void tableRef.value?.reload();
  } catch (e) {
    message.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

onMounted(() => {
  // 表格 loader 自动加载首屏，无需手动触发
});

onBeforeUnmount(cancelIdiomHover);
</script>

<style scoped>
.page-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--el-bg-color-page);
}

/* ---------- 上区 ---------- */
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
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
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
.table-card :deep(.el-card__body) {
  padding: 20px;
}
.table-wrap {
  /* 固定容器高度：消除滚动条液面高度随滚动反复重算的抖动。
     374 = 本页实测 wrap.top 344.8 + el-main 底部留白 8 + 卡片 body
     底部内边距 21；此时表格卡正好贴到页面容器底边，不再留底空。
     本页统计卡单行、筛选二行，上方区域与昆虫库不同，故基准取其
     同分布的 FunConfig 的 374 而非昆虫库的 493。
     min-height 取 300：更小视口下改走页面滚动，不把固定高度顶破。
     contain: layout size 让 ReTable 走 height:100%。 */
  height: calc(100vh - 374px);
  min-height: 300px;
  contain: layout size;
  overflow: hidden;
}
.idiom-table {
  width: 100%;
}
.idiom-table :deep(.el-table__header th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 700;
  font-size: 13px;
}
.idiom-table :deep(.el-table__row) {
  cursor: pointer;
}
.idiom-table :deep(.el-table__row:hover > td) {
  background: var(--el-color-primary-light-9) !important;
}
.idiom-table :deep(.el-table__cell) {
  padding: 12px 0;
}
.idiom-text {
  font-weight: 700;
  letter-spacing: 1px;
}
.idiom-hover-target {
  cursor: help;
  border-bottom: 1px dashed var(--el-border-color);
  transition: border-color 0.2s, color 0.2s;
}
.idiom-hover-target:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-white);
  white-space: nowrap;
}
.tag-pill.is-green { background: var(--el-color-success); }
.tag-pill.is-orange { background: var(--el-color-warning); }
.tag-pill.is-red { background: var(--el-color-danger); }
.tag-pill.is-gray {
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}


/* ---------- 对话框 ---------- */
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
.q-dialog__body {
  padding: 18px 24px 6px;
  max-height: min(68vh, 720px);
  overflow: auto;
}
.form-section {
  display: flex;
  align-items: center;
  margin: 4px 0 14px;
}
.form-section__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--el-color-primary);
}
.form-section__bar {
  display: none;
}
.form-grid {
  display: grid;
  gap: 0 16px;
}
.form-grid--2 {
  grid-template-columns: 1fr 1fr;
}
.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.dialog-foot .el-button {
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  min-width: 96px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ============ 纯预览（只读） ============ */
.pv__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.pv__word {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--el-text-color-primary);
}
.pv__pinyin {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.pv__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.pv__chip {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
}
.pv__chip--tag {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pv__block {
  margin-top: 14px;
}
.pv__block-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
.pv__block-text {
  font-size: 14px;
  line-height: 1.75;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
.pv__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}
@media (max-width: 720px) {
  .pv__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
</style>
