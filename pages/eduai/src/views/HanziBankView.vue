<template>
  <div class="page-container">
    <!-- 上区：页头 + 右侧悬浮正方形统计卡 -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">汉字库</h1>
          <p class="page-header__sub">维护汉字的读音、笔顺（顺序）、字画与释义，供识字 / 写字类模块取材</p>
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
            placeholder="字 / 拼音 / 释义"
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
          <el-button type="primary" :icon="Plus" @click="openCreate">新增汉字</el-button>
        </div>
      </div>

      <div v-loading="loading" class="table-wrap">
        <ReTable
          :data="hanziRows"
          :columns="hanziColumns"
          :row-key="'hanziId'"
          layout="table"
          :layout-switch="false"
          :pagination="false"
          :toolbar="false"
          stripe
          :settings="{ border: false }"
          class="hanzi-table"
        >
          <template #empty>
            <el-empty :image-size="88" description="暂无汉字，点击「新增汉字」创建" />
          </template>
          <template #col-hanziChar="{ row }">
            <span class="hanzi-char">{{ row.hanziChar }}</span>
          </template>
          <template #col-hanziStrokeOrder="{ row }">
            <span class="stroke-order">{{ row.hanziStrokeOrder || "—" }}</span>
          </template>
          <template #col-hanziImage="{ row }">
            <el-image
              v-if="row.hanziImage"
              :src="row.hanziImage"
              :preview-src-list="[row.hanziImage]"
              preview-teleported
              fit="contain"
              class="hanzi-thumb"
            />
            <span v-else class="muted">—</span>
          </template>
          <template #col-hanziGradeLevel="{ row }">
            <span class="tag-pill">{{ row.hanziGradeLevel || "不限" }}</span>
          </template>
          <template #col-actions="{ row }">
            <ReButton
              layout="square"
              type="primary"
              :icon="EditPen"
              tip="编辑"
              @click.stop="openEdit(row as unknown as EduHanzi)"
            />
            <ReButton
              layout="square"
              type="danger"
              :icon="Delete"
              tip="删除"
              @click.stop="remove(row as unknown as EduHanzi)"
            />
          </template>
        </ReTable>
      </div>

      <div class="table-footer">
        <span class="table-footer__total">共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @current-change="loadList"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <ReDialog v-model="dialogVisible" class="q-dialog" width="880" :show-close="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><Reading /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ form.hanziId ? "编辑汉字" : "新增汉字" }}</div>
              <div class="dialog-head__sub">一个字一条（按字自动去重，重复提交同一字会更新）</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="dialogVisible = false" />
        </div>
      </template>

      <div class="q-dialog__body">
        <el-form :model="form" label-width="110" @submit.prevent>
          <div class="form-section">
            <div class="form-section__title">读音与字形</div>
          </div>
          <div class="form-grid form-grid--4">
            <el-form-item label="汉字" required>
              <el-input v-model="form.hanziChar" placeholder="只能一个字，如：人" class="char-input" />
            <div v-if="charCount > 1" class="char-input__err">一个字一条，当前 {{ charCount }} 个字，请删到只剩一个</div>
            </el-form-item>
            <el-form-item label="读音">
              <el-input v-model="form.hanziPinyin" placeholder="如：rén" />
            </el-form-item>
            <el-form-item label="部首">
              <el-input v-model="form.hanziRadical" maxlength="2" placeholder="如：人" />
            </el-form-item>
            <el-form-item label="笔画数">
              <el-input-number v-model="form.hanziStrokes" :min="1" :max="64" controls-position="right" style="width: 100%" />
            </el-form-item>
          </div>

          <div class="form-section">
            <div class="form-section__title">笔顺与结构</div>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="结构">
              <el-select v-model="form.hanziStructure" clearable placeholder="选择结构" style="width: 100%">
                <el-option v-for="s in STRUCTURES" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
            <el-form-item label="适用学段">
              <el-select v-model="form.hanziGradeLevel" clearable placeholder="不选表示不限" style="width: 100%">
                <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="笔顺">
            <el-input v-model="form.hanziStrokeOrder" placeholder="按书写顺序排列的笔画名，如：丿㇏" />
            <div class="field-tip">示例：大 → 一丿㇏；小 → 亅丿丶</div>
          </el-form-item>

          <div class="form-section">
            <div class="form-section__title">释义与字画</div>
          </div>
          <el-form-item label="释义 / 组词">
            <el-input v-model="form.hanziMeaning" type="textarea" :rows="2" placeholder="如：人类；组词：大人、人们" />
          </el-form-item>
          <el-form-item label="字画">
            <el-input v-model="form.hanziImage" placeholder="图片地址，如 https://…/ren.png" clearable />
            <div class="field-tip">可填图片 URL；列表会以缩略图展示，点击可放大。</div>
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="formStatus" active-text="启用" inactive-text="停用" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button class="dialog-foot__save" type="primary" :loading="saving" @click="save">保存汉字</el-button>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * HanziBankView —— 汉字库（基础数据维护）
 *
 * 一个字一条：维护读音（拼音）、笔顺（顺序）、笔画数、部首、结构、字画与释义。
 * 唯一键是汉字本身，后端「按字查重后更新」，因此重复提交同一个字不会报错。
 * 分页为服务端分页（GET /v2/edu/hanzi/page）。
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Plus, Reading, RefreshLeft, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { EduHanzi } from "../api/types";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";

const GRADE_LEVELS = ["小学", "初中", "高中"] as const;
const STRUCTURES = ["独体", "上下", "左右", "左中右", "上中下", "半包围", "全包围"] as const;

/**
 * 汉字列表的列定义（ReTable 表格模式用）。
 *
 * <p>自定义单元格一律走 {@code #col-<prop>} 插槽；「字 / 字画 / 学段 / 操作」
 * 四列没有可直出的纯文本字段（或字段需包一层），同样挂插槽渲染。</p>
 */
const hanziColumns: ReTableColumn[] = [
  { prop: "hanziChar", label: "字", width: 80, align: "center", slot: "col-hanziChar" },
  { prop: "hanziPinyin", label: "读音", width: 120, showOverflowTooltip: true },
  { prop: "hanziStrokes", label: "笔画", width: 70, align: "center" },
  { prop: "hanziRadical", label: "部首", width: 70, align: "center" },
  { prop: "hanziStructure", label: "结构", width: 90, align: "center" },
  {
    prop: "hanziStrokeOrder",
    label: "笔顺",
    width: 150,
    showOverflowTooltip: true,
    slot: "col-hanziStrokeOrder",
  },
  { prop: "hanziMeaning", label: "释义 / 组词", minWidth: 200, showOverflowTooltip: true },
  { prop: "hanziImage", label: "字画", width: 80, align: "center", slot: "col-hanziImage" },
  { prop: "hanziGradeLevel", label: "学段", width: 80, align: "center", slot: "col-hanziGradeLevel" },
  { prop: "actions", label: "操作", width: 120, align: "center", fixed: "right", slot: "col-actions" },
];

// ==================== 列表 ====================
const loading = ref(false);
const rows = ref<EduHanzi[]>([]);
/** ReTable 的 data 只收 Record 结构，此处仅做渲染层类型适配，不改数据本身 */
const hanziRows = computed(() => rows.value as unknown as Record<string, unknown>[]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const blankSearch = () => ({ keyword: "", gradeLevel: "" });
const searchDraft = reactive(blankSearch());
const applied = reactive(blankSearch());

const statCards = computed(() => {
  const list = rows.value;
  const withOrder = list.filter((r) => (r.hanziStrokeOrder ?? "").length > 0).length;
  const withImage = list.filter((r) => (r.hanziImage ?? "").length > 0).length;
  return [
    { title: "本页汉字", value: list.length, icon: Reading, bg: "var(--el-color-primary)", hint: `共 ${total.value} 条` },
    { title: "已配笔顺", value: withOrder, icon: Plus, bg: "var(--el-color-success)", hint: "本页已填笔顺" },
    { title: "已配字画", value: withImage, icon: EditPen, bg: "var(--el-color-warning)", hint: "本页已填字画" },
  ];
});

async function loadList() {
  loading.value = true;
  try {
    const res = await eduaiApi.pageHanzi({
      keyword: applied.keyword || undefined,
      gradeLevel: applied.gradeLevel || undefined,
      pageNum: pageNo.value,
      pageSize: pageSize.value,
    });
    rows.value = res?.data ?? res?.records ?? [];
    total.value = res?.total ?? rows.value.length;
  } catch {
    rows.value = [];
    total.value = 0;
    message.error("加载汉字失败");
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

function onSizeChange() {
  pageNo.value = 1;
  void loadList();
}

// ==================== 表单 ====================
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<EduHanzi>>({});
const formStatus = ref(true);
const STATUS_ON = 1;
const STATUS_OFF = 0;

function resetForm() {
  Object.assign(form, {
    hanziId: undefined,
    hanziChar: "",
    hanziPinyin: "",
    hanziStrokes: undefined,
    hanziRadical: "",
    hanziStructure: "",
    hanziStrokeOrder: "",
    hanziMeaning: "",
    hanziImage: "",
    hanziGradeLevel: "",
  });
  formStatus.value = true;
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: EduHanzi) {
  resetForm();
  Object.assign(form, { ...row });
  formStatus.value = (row.hanziStatus ?? STATUS_ON) === STATUS_ON;
  dialogVisible.value = true;
}

/** 汉字输入的字数（按 Unicode 码点算，避免生僻字/带变音符的字被算成两个） */
const charCount = computed(() => [...(form.hanziChar ?? "").trim()].length);

async function save() {
  const char = (form.hanziChar ?? "").trim();
  if (!char) {
    message.warning("请填写汉字");
    return;
  }
  // maxlength="1" 会**静默吞掉**用户敲的第 2 个字（输入框看着像坏了，且没有任何提示），
  // 这里放开输入、改为提交前显式校验，把「为什么没保存」说清楚。
  if ([...char].length > 1) {
    message.warning(`「${char}」是 ${[...char].length} 个字，本页一个字一条，请只填一个字`);
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.saveHanzi({
      ...form,
      hanziChar: char,
      hanziStatus: formStatus.value ? STATUS_ON : STATUS_OFF,
    });
    message.success("保存成功");
    dialogVisible.value = false;
    await loadList();
  } catch (e) {
    message.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    saving.value = false;
  }
}

async function remove(row: EduHanzi) {
  try {
    await ElMessageBox.confirm(`确认删除汉字「${row.hanziChar}」吗？`, "删除汉字", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await eduaiApi.deleteHanzi(row.hanziId as number);
    message.success("已删除");
    await loadList();
  } catch (e) {
    message.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
}

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
  border: 1px solid var(--el-border-color-lighter);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.stat-card:hover {
  transform: translateY(-2px);
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
  grid-template-columns: minmax(220px, 1.6fr) minmax(140px, 1fr) auto;
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
.table-wrap {
  /* 固定容器高度：表格自身高度不再随页面滚动位置重算（那是滚动抖动的根因）。
     503 为 1440×900 实测值：wrap.top 427 + 分页条与其间距 50 + 卡片 body 底部
     内边距 18 + 余量 8；表格 + 分页正好落在 page-container 可视区内，
     页面不再纵向滚动，只保留表格内部滚动（消掉残留的 23px 小滚动条）。
     contain: layout size 声明「本盒尺寸与内容无关」，配合 ReTable 内的
     fill 逻辑走 height:100%，彻底断开 ResizeObserver 的高度反馈回路。 */
  height: calc(100vh - 503px);
  min-height: 320px;
  contain: layout size;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.hanzi-table {
  width: 100%;
}
.hanzi-table :deep(.el-table__header th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 700;
  font-size: 13px;
}
.hanzi-table :deep(.el-table__cell) {
  padding: 10px 0;
}
.hanzi-char {
  font-size: 22px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.stroke-order {
  font-size: 16px;
  letter-spacing: 2px;
  color: var(--el-text-color-primary);
}
.hanzi-thumb {
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-sm, 6px);
  border: 1px solid var(--el-border-color-lighter);
}
.muted {
  color: var(--el-text-color-placeholder);
}
.tag-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  white-space: nowrap;
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
  padding-bottom: 6px;
  border-bottom: 2px solid var(--el-color-primary);
}
.form-grid {
  display: grid;
  gap: 0 16px;
}
.form-grid--2 {
  grid-template-columns: 1fr 1fr;
}
.form-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.char-input :deep(.el-input__inner) {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}
.char-input__err {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-color-danger);
}
.field-tip {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.5;
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

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
  .form-grid--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stat-card {
    width: 128px;
    height: 128px;
  }
  .stat-card__value {
    font-size: 24px;
  }
}

/* 无障碍：尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  .stat-card:hover {
    transform: none;
  }
}
</style>
