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
      <div class="table-toolbar">
        <div class="table-toolbar__left">
          <el-button type="primary" :icon="Plus" @click="openCreate">新增成语</el-button>
        </div>
      </div>

      <div v-loading="loading" class="table-wrap">
        <ReTable
          :data="idiomRows"
          :columns="idiomColumns"
          :row-key="'idiomId'"
          layout="table"
          :layout-switch="false"
          :pagination="false"
          :toolbar="false"
          stripe
          :settings="{ border: false }"
          class="idiom-table"
          @row-click="(row: Record<string, unknown>) => openEdit(row as unknown as Idiom)"
        >
          <template #empty>
            <el-empty :image-size="88" description="暂无成语，点击「新增成语」创建" />
          </template>
          <template #col-idiomContent="{ row }">
            <span class="idiom-text">{{ row.idiomContent }}</span>
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

      <div class="table-footer">
        <span class="table-footer__total">共 {{ filtered.length }} 条</span>
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="filtered.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <ReDialog v-model="dialogVisible" class="q-dialog" width="880" :show-close="false" align-center>
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

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="previewVisible = false">关闭</el-button>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * IdiomBankView —— 成语库（数据配置）
 *
 * 成语内容 CRUD + 适用学段/年级绑定（保存时同步 edu_idiom_grade，供消消乐按学段取材）。
 * 样式统一使用 koi / Element Plus 变量（--el-*）。
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Close, Collection, Delete, EditPen, Plus, RefreshLeft, Search, View } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { Idiom } from "../api/types";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";

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

const searchGradeOptions = computed(() =>
  applied.gradeLevel ? GRADES_BY_LEVEL[applied.gradeLevel] ?? [] : Object.values(GRADES_BY_LEVEL).flat(),
);

const filtered = computed(() => {
  const kw = applied.keyword.trim().toLowerCase();
  return rows.value.filter((r) => {
    if (applied.difficulty != null && r.idiomDifficulty !== applied.difficulty) return false;
    if (kw) {
      const hay = `${r.idiomContent || ""} ${r.idiomPinyin || ""} ${r.idiomMeaning || ""}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
});

const pagedRows = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

/** ReTable 的 data 只收 Record 结构，此处仅做渲染层类型适配，不改数据本身 */
const idiomRows = computed(() => pagedRows.value as unknown as Record<string, unknown>[]);

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
  { prop: "actions", label: "操作", width: 150, align: "center", fixed: "right", slot: "col-actions" },
];

const statCards = computed(() => {
  const list = rows.value;
  const easy = list.filter((r) => (r.idiomDifficulty ?? 3) <= 2).length;
  const hard = list.filter((r) => (r.idiomDifficulty ?? 3) >= 4).length;
  return [
    { title: "成语总数", value: list.length, icon: Collection, bg: "var(--el-color-primary)", hint: "全部成语" },
    { title: "简单成语", value: easy, icon: Plus, bg: "var(--el-color-success)", hint: "难度 ≤ 2" },
    { title: "困难成语", value: hard, icon: Delete, bg: "var(--el-color-warning)", hint: "难度 ≥ 4" },
  ];
});

async function loadList() {
  loading.value = true;
  try {
    rows.value = (await eduaiApi.listIdioms({ gradeLevel: applied.gradeLevel || undefined, grade: applied.grade || undefined, count: 5000 })) ?? [];
  } catch {
    rows.value = [];
    ElMessage.error("加载成语失败");
  } finally {
    loading.value = false;
  }
}

function commitSearch() {
  Object.assign(applied, { ...searchDraft });
  pageNo.value = 1;
  void loadList();
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
    ElMessage.warning("请填写成语/拼音/释义");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.saveIdiom({
      ...form,
      gradeLevels: formLevels.value,
      grades: formGrades.value,
    });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    await loadList();
  } catch (e) {
    ElMessage.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
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
    ElMessage.success("已删除");
    await loadList();
  } catch (e) {
    ElMessage.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

onMounted(() => {
  void loadList();
});
</script>

<style scoped>
.page-container {
  height: 100%;
  overflow: auto;
  background: var(--el-bg-color-page);
}

/* ---------- 上区 ---------- */
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
  /* 原 14px，最近档 12px（lg） */
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
  grid-template-columns: minmax(200px, 1.4fr) repeat(3, minmax(130px, 1fr)) auto;
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
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  min-width: 88px;
  font-weight: 600;
}

/* ---------- 表格 ---------- */
.table-card {
  /* 原 14px，最近档 12px（lg） */
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
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  font-weight: 600;
}
.table-wrap {
  min-height: 320px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
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
  font-weight: 600;
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

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============
   统计卡有 transition / transform（ReButton 的动效由组件自身负责）。 */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  /* 位移也是动效：关掉后 :hover 只剩投影反馈 */
  .stat-card:hover {
    transform: none;
  }
}
</style>
