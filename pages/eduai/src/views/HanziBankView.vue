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
            placeholder="字 / 拼音（含无声调）/ 通假字 / 释义"
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
      <div class="table-wrap">
        <ReTable
          ref="tableRef"
          :loader="loadRows"
          :columns="hanziColumns"
          :params="appliedParams"
          :row-key="'hanziId'"
          v-model:page="pageNo"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="table"
          :layout-switch="false"
          :toolbar="false"
          stripe
          :settings="{ border: false }"
          class="hanzi-table"
          @load="onLoad"
          @load-error="pageLoadError"
        >
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增汉字</el-button>
          </template>
          <template #empty>
            <el-empty :image-size="88" description="暂无汉字，点击「新增汉字」创建" />
          </template>
          <template #col-hanziChar="{ row }">
            <span
              class="hanzi-char hanzi-hover-target"
              @mouseenter="startHanziHover($event, row as unknown as EduHanzi)"
              @mouseleave="cancelHanziHover"
            >{{ row.hanziChar }}</span>
          </template>
          <template #col-hanziPinyin="{ row }">
            <div class="pinyin-cell">
              <span
                v-for="p in readings(row as unknown as EduHanzi)"
                :key="p"
                class="pinyin-chip"
              >{{ p }}</span>
              <span v-if="!readings(row as unknown as EduHanzi).length" class="muted">—</span>
            </div>
          </template>
          <template #col-hanziTongjia="{ row }">
            <span v-if="row.hanziTongjia" class="tongjia-pill" :title="`通 ${row.hanziTongjia}`">
              通 {{ row.hanziTongjia }}
            </span>
            <span v-else class="muted">—</span>
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
    </el-card>

    <!-- 新增/编辑对话框 -->
    <ReDialog v-model="dialogVisible" class="q-dialog" width="880" :show-close="false" :show-window-shell="false" align-center>
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
              <ReInputNumber
                :model-value="form.hanziStrokes ?? undefined"
                :min="1"
                :max="64"
                controls-position="right"
                style="width: 100%"
                @update:model-value="(v?: number) => (form.hanziStrokes = v)"
              />
            </el-form-item>
          </div>

          <div class="form-grid form-grid--2">
            <el-form-item label="多音字读音">
              <el-input v-model="form.hanziPinyin" placeholder="逗号分隔，如：xíng,háng" />
              <div class="field-tip">多音字把全部读音都写上（逗号分隔），按任意一个读音都能搜到这个字；敲无声调也能搜到。</div>
            </el-form-item>
            <el-form-item label="通假字">
              <el-input v-model="form.hanziTongjia" placeholder="逗号分隔，如：悦（本字「说」通「悦」）" />
              <div class="field-tip">填借用的字；搜借字也能找到这条记录。</div>
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

    <HanziHoverWrite
      :visible="hanziHover.visible"
      :anchor="hanziHover.anchor"
      :character="hanziHover.row?.hanziChar ?? ''"
    />
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
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Plus, Reading, RefreshLeft, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import { createPageLoader, pageLoadError, strParam } from "../api/pageLoader";
import type { EduHanzi } from "../api/types";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";
import ReInputNumber from "@repo/ui/re-input-number";
import HanziHoverWrite from "../components/HanziHoverWrite.vue";

const GRADE_LEVELS = ["小学", "初中", "高中"] as const;
const STRUCTURES = ["独体", "上下", "左右", "左中右", "上中下", "半包围", "全包围"] as const;

/**
 * 汉字列表的列定义（ReTable 表格模式用）。
 *
 * <p>自定义单元格一律走 {@code #col-<prop>} 插槽；「字 / 字画 / 学段 / 操作」
 * 四列没有可直出的纯文本字段（或字段需包一层），同样挂插槽渲染。</p>
 */
const hanziColumns: ReTableColumn[] = [
  { prop: "hanziChar", label: "字", width: 72, align: "center", slot: "col-hanziChar" },
  { prop: "hanziPinyin", label: "读音", minWidth: 130, slot: "col-hanziPinyin" },
  { prop: "hanziTongjia", label: "通假字", width: 100, align: "center", slot: "col-hanziTongjia" },
  { prop: "hanziStrokes", label: "笔画", width: 66, align: "center" },
  { prop: "hanziRadical", label: "部首", width: 66, align: "center" },
  { prop: "hanziStructure", label: "结构", width: 86, align: "center" },
  {
    prop: "hanziStrokeOrder",
    label: "笔顺",
    width: 140,
    showOverflowTooltip: true,
    slot: "col-hanziStrokeOrder",
  },
  { prop: "hanziMeaning", label: "释义 / 组词", minWidth: 200, showOverflowTooltip: true },
  { prop: "hanziImage", label: "字画", width: 74, align: "center", slot: "col-hanziImage" },
  { prop: "hanziGradeLevel", label: "学段", width: 76, align: "center", slot: "col-hanziGradeLevel" },
  { prop: "actions", label: "操作", width: 120, align: "center", fixed: "right", slot: "col-actions" },
];

// ==================== 列表 ====================
const loading = ref(false);
const rows = ref<EduHanzi[]>([]);
const tableRef = ref();
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const blankSearch = () => ({ keyword: "", gradeLevel: "" });
const searchDraft = reactive(blankSearch());
const applied = reactive(blankSearch());

/** 筛选参数：提交后交给后端 pageQuery */
const appliedParams = computed(() => ({
  keyword: strParam(applied.keyword),
  gradeLevel: strParam(applied.gradeLevel),
}));

/** 汉字分页 loader（后端筛选） */
const loadRows = createPageLoader((page, size, params) =>
  eduaiApi.pageHanzi({
    ...params,
    pageNum: page,
    pageSize: size,
  }),
);

/** ReTable 每页加载完成后同步当前页行与总数 */
function onLoad(r: { data: unknown[]; total?: number }) {
  rows.value = (r.data ?? []) as EduHanzi[];
  total.value = r?.total ?? rows.value.length;
}

/** 行悬停书写动画的锚点与当前行（字单元格） */
const hanziHover = reactive<{
  visible: boolean;
  anchor: HTMLElement | null;
  row: EduHanzi | null;
}>({
  visible: false,
  anchor: null,
  row: null,
});
let hanziHoverTimer: ReturnType<typeof setTimeout> | null = null;

function startHanziHover(e: MouseEvent, row: EduHanzi) {
  if (hanziHoverTimer) clearTimeout(hanziHoverTimer);
  hanziHover.row = row;
  hanziHover.anchor = e.currentTarget as HTMLElement;
  hanziHoverTimer = setTimeout(() => {
    hanziHover.visible = true;
  }, 120);
}

function cancelHanziHover() {
  if (hanziHoverTimer) {
    clearTimeout(hanziHoverTimer);
    hanziHoverTimer = null;
  }
  hanziHover.visible = false;
}

const statCards = computed(() => {
  const list = rows.value;
  const withOrder = list.filter((r) => (r.hanziStrokeOrder ?? "").length > 0).length;
  const withImage = list.filter((r) => (r.hanziImage ?? "").length > 0).length;
  return [
    { title: "本页汉字", value: list.length, icon: Reading, bg: "var(--el-color-primary-light-9)", hint: `共 ${total.value} 条` },
    { title: "已配笔顺", value: withOrder, icon: Plus, bg: "var(--el-color-success-light-9)", hint: "本页已填笔顺" },
    { title: "已配字画", value: withImage, icon: EditPen, bg: "var(--el-color-warning-light-9)", hint: "本页已填字画" },
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
const form = reactive<Partial<EduHanzi>>({});
const formStatus = ref(true);
const STATUS_ON = 1;
const STATUS_OFF = 0;

function resetForm() {
  Object.assign(form, {
    hanziId: undefined,
    hanziChar: "",
    hanziPinyin: "",
    hanziTongjia: "",
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

/**
 * 读音拆成多个标签展示。
 *
 * <p>{@code hanzi_pinyin} 允许逗号分隔多读音（如 {@code xíng,háng}）。
 * 逐项渲染成 chip，老师一眼能看出这是多音字；单读音只有一个 chip，不额外占位。</p>
 *
 * @param row 汉字行
 * @return 读音列表；无读音返回空数组
 */
function readings(row: EduHanzi): string[] {
  const raw = row.hanziPinyin ?? "";
  return raw
    .split(/[,，;；/|\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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
    void tableRef.value?.reload();
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
    void tableRef.value?.reload();
  } catch (e) {
    message.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
}

onMounted(() => {
  // 表格 loader 自动加载首屏，无需手动触发
});

onBeforeUnmount(cancelHanziHover);
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
.table-wrap {
  /* 固定容器高度（同三库口径）：消除滚动条液面高度随滚动反复重算的抖动。
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
.hanzi-hover-target {
  cursor: help;
  border-bottom: 1px dashed var(--el-border-color);
  transition: border-color 0.2s, color 0.2s;
}
.hanzi-hover-target:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.stroke-order {
  font-size: 16px;
  letter-spacing: 2px;
  color: var(--el-text-color-primary);
}
.pinyin-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1.4;
}
.pinyin-chip {
  font-size: 12px;
  padding: 1px 7px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.tongjia-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  white-space: nowrap;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .form-grid--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
</style>
