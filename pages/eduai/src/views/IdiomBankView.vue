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
          />
        </div>
        <div class="filter-field">
          <label class="filter-field__label">学段</label>
          <el-select v-model="searchDraft.gradeLevel" clearable placeholder="全部学段" style="width: 100%">
            <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">年级</label>
          <el-select v-model="searchDraft.grade" clearable placeholder="全部年级" style="width: 100%">
            <el-option v-for="g in searchGradeOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">难度</label>
          <el-select v-model="searchDraft.difficulty" clearable placeholder="全部难度" style="width: 100%">
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
        <el-table :data="pagedRows" stripe class="idiom-table" row-key="idiomId" @row-click="openEdit">
          <template #empty>
            <el-empty :image-size="88" description="暂无成语，点击「新增成语」创建" />
          </template>
          <el-table-column prop="idiomId" label="ID" width="70" />
          <el-table-column prop="idiomContent" label="成语" width="120">
            <template #default="{ row }">
              <span class="idiom-text">{{ row.idiomContent }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="idiomPinyin" label="拼音" width="180" show-overflow-tooltip />
          <el-table-column prop="idiomMeaning" label="释义" min-width="220" show-overflow-tooltip />
          <el-table-column prop="idiomSource" label="出处" width="150" show-overflow-tooltip />
          <el-table-column label="难度" width="90">
            <template #default="{ row }">
              <span class="tag-pill" :class="diffClass(row.idiomDifficulty)">
                {{ diffLabel(row.idiomDifficulty) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="idiomTags" label="标签" width="130" show-overflow-tooltip />
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <button type="button" class="row-edit-btn" title="编辑" @click.stop="openEdit(row)">
                <el-icon><EditPen /></el-icon>
              </button>
              <button type="button" class="row-del-btn" title="删除" @click.stop="remove(row)">
                <el-icon><Delete /></el-icon>
              </button>
            </template>
          </el-table-column>
        </el-table>
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
    <el-dialog v-model="dialogVisible" class="q-dialog" width="880" :show-close="false" align-center>
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
          <button type="button" class="dialog-head__close" aria-label="关闭" @click="dialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
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
    </el-dialog>
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
import { Close, Collection, Delete, EditPen, Plus, RefreshLeft, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { Idiom } from "../api/types";

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
  padding: 16px;
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
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);
  transition: transform 0.15s, box-shadow 0.15s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow);
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
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  flex-shrink: 0;
  align-self: flex-end;
}

/* ---------- 筛选 ---------- */
.filter-card {
  border-radius: 14px;
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
  border-radius: 10px;
  min-width: 88px;
  font-weight: 600;
}

/* ---------- 表格 ---------- */
.table-card {
  border-radius: 14px;
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
  border-radius: 10px;
  font-weight: 600;
}
.table-wrap {
  min-height: 320px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
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
  border-radius: 6px;
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

.row-edit-btn,
.row-del-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.row-edit-btn {
  color: var(--el-color-primary);
}
.row-edit-btn:hover {
  background: var(--el-color-primary-light-8);
}
.row-del-btn {
  color: var(--el-color-danger);
}
.row-del-btn:hover {
  background: var(--el-color-danger-light-9);
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
  border-radius: 12px;
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
.dialog-head__close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dialog-head__close:hover {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
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
  border-radius: 10px;
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
</style>
