<template>
  <div class="page-container">
    <!-- 上区：页头 + 右侧悬浮统计卡 -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">词语库</h1>
          <p class="page-header__sub">
            维护词语的读音、释义、造句与近义 / 反义 / 同音词；在表格行上点右键可速查六类关联
          </p>
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
            placeholder="词语 / 拼音（含无声调）/ 释义 / 近义 / 反义 / 同音"
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
          <label class="filter-field__label">语料类型</label>
          <el-select v-model="searchDraft.kind" clearable placeholder="全部类型" style="width: 100%" @change="commitSearch">
            <el-option v-for="k in KINDS" :key="k.value" :label="k.label" :value="k.value" />
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
          :columns="wordColumns"
          :params="appliedParams"
          :row-key="'wordId'"
          v-model:page="pageNo"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="table"
          :layout-switch="false"
          :toolbar="false"
          stripe
          :settings="{ border: false }"
          class="word-table"
          :context-menu="ctxMenuProvider"
          @load="onLoad"
          @load-error="pageLoadError"
          @context-menu-select="onCtxSelect"
          @row-click="(row: Record<string, unknown>) => openEdit(row as unknown as EduWord)"
        >
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增词语</el-button>
            <el-button :icon="Collection" @click="openRelatedPanel()">关联速查</el-button>
          </template>
          <template #empty>
            <el-empty :image-size="88" description="暂无词语，点击「新增词语」创建" />
          </template>
          <template #col-wordContent="{ row }">
            <div class="word-cell">
              <span class="word-text">{{ row.wordContent }}</span>
              <span v-if="row.wordKind && row.wordKind !== 'WORD'" class="kind-pill">
                {{ kindLabel(row.wordKind) }}
              </span>
            </div>
          </template>
          <template #col-wordPinyin="{ row }">
            <span class="pinyin-text">{{ row.wordPinyin || "—" }}</span>
          </template>
          <template #col-wordSynonyms="{ row }">
            <div class="chip-list">
              <span v-for="s in splitField(row.wordSynonyms)" :key="s" class="mini-chip">{{ s }}</span>
              <span v-if="!splitField(row.wordSynonyms).length" class="muted">—</span>
            </div>
          </template>
          <template #col-wordAntonyms="{ row }">
            <div class="chip-list">
              <span v-for="s in splitField(row.wordAntonyms)" :key="s" class="mini-chip is-anti">{{ s }}</span>
              <span v-if="!splitField(row.wordAntonyms).length" class="muted">—</span>
            </div>
          </template>
          <template #col-actions="{ row }">
            <!--
              必须 .stop：本表格绑了 @row-click="openEdit"，
              不阻止冒泡会让「点右键预览/删除」也触发一次「打开编辑弹窗」
            -->
            <ReButton layout="square" :icon="More" tip="关联速查" @click.stop="openRelatedFor(row as unknown as EduWord)" />
            <ReButton layout="square" type="primary" :icon="EditPen" tip="编辑" @click.stop="openEdit(row as unknown as EduWord)" />
            <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click.stop="remove(row as unknown as EduWord)" />
          </template>
        </ReTable>
      </div>
      <div class="table-tip">在任意行上点<strong>右键</strong>，可速查相似词语 / 反向词语 / 同音词 / 同音字词 / 造句 / 含相同字</div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <ReDialog v-model="dialogVisible" class="q-dialog word-dialog" width="880" :show-close="false" :show-window-shell="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><Collection /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ form.wordId ? "编辑词语" : "新增词语" }}</div>
              <div class="dialog-head__sub">一个词一条（按词自动去重，重复提交同一个词会更新）</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="dialogVisible = false" />
        </div>
      </template>

      <div class="q-dialog__body">
        <el-form :model="form" label-width="110" @submit.prevent>
          <div class="form-section">
            <div class="form-section__title">基本信息</div>
          </div>
          <div class="form-grid form-grid--3">
            <el-form-item label="词语" required>
              <el-input v-model="form.wordContent" placeholder="如：美丽" />
            </el-form-item>
            <el-form-item label="读音">
              <el-input v-model="form.wordPinyin" placeholder="如：měi lì" />
            </el-form-item>
            <el-form-item label="语料类型">
              <el-select v-model="form.wordKind" style="width: 100%">
                <el-option v-for="k in KINDS" :key="k.value" :label="k.label" :value="k.value" />
              </el-select>
            </el-form-item>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="适用学段">
              <el-select v-model="form.wordGradeLevel" clearable placeholder="不选表示不限" style="width: 100%">
                <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
              </el-select>
            </el-form-item>
            <el-form-item label="结构 / 词性">
              <el-input v-model="form.wordStructure" placeholder="如：偏正式、动宾式、名词" />
            </el-form-item>
          </div>

          <div class="form-section">
            <div class="form-section__title">释义与造句</div>
          </div>
          <el-form-item label="释义">
            <el-input v-model="form.wordMeaning" type="textarea" :rows="2" placeholder="词语的意思" />
          </el-form-item>
          <el-form-item label="例句 / 造句">
            <el-input v-model="form.wordExample" type="textarea" :rows="2" placeholder="如：春天的花园真美丽。" />
          </el-form-item>

          <div class="form-section">
            <div class="form-section__title">关联词（右键速查取材于此）</div>
          </div>
          <el-form-item label="相似词语">
            <el-input v-model="form.wordSynonyms" placeholder="逗号分隔，如：漂亮,俊美" />
          </el-form-item>
          <el-form-item label="反向词语">
            <el-input v-model="form.wordAntonyms" placeholder="逗号分隔，如：丑陋,难看" />
          </el-form-item>
          <el-form-item label="同音词">
            <el-input v-model="form.wordHomophones" placeholder="逗号分隔，如：水力（与「水利」同音）" />
          </el-form-item>

          <el-form-item label="状态">
            <el-switch v-model="formStatus" active-text="启用" inactive-text="停用" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button class="dialog-foot__save" type="primary" :loading="saving" @click="save">保存词语</el-button>
        </div>
      </template>
    </ReDialog>

    <!-- 右键关联速查结果 -->
    <ReDialog v-model="relatedVisible" class="q-dialog related-dialog" width="760" :show-close="false" :show-window-shell="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><Connection /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">
                {{ relatedTitle }}
              </div>
              <div class="dialog-head__sub">{{ relatedSubtitle }}</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="relatedVisible = false" />
        </div>
      </template>

      <div class="q-dialog__body related-body">
        <div class="related-tabs">
          <button
            v-for="m in RELATED_MODES"
            :key="m.mode"
            type="button"
            class="related-tab"
            :class="{ 'is-active': currentMode === m.mode }"
            @click="runRelated(m.mode)"
          >{{ m.label }}</button>
        </div>

        <div v-if="relatedLoading" class="related-empty">正在检索…</div>
        <template v-else>
          <div v-if="relatedSource" class="related-source">{{ relatedSource }}</div>
          <div v-if="!relatedItems.length" class="related-empty">
            这个词没有可用的{{ relatedLabel }}数据，可在「编辑」里补充后再查。
          </div>
          <ul v-else class="related-list">
            <li v-for="(it, i) in relatedItems" :key="i" class="related-item">
              <div class="related-item__main">
                <span class="related-item__content">{{ it.content }}</span>
                <span v-if="it.pinyin" class="related-item__pinyin">{{ it.pinyin }}</span>
                <span v-if="it.inBank === false" class="related-item__miss">未入库</span>
              </div>
              <div v-if="it.detail || it.meaning" class="related-item__sub">
                <span v-if="it.detail" class="related-item__detail">{{ it.detail }}</span>
                <span v-if="it.meaning" class="related-item__meaning">{{ it.meaning }}</span>
              </div>
            </li>
          </ul>
        </template>
      </div>

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="relatedVisible = false">关闭</el-button>
        </div>
      </template>
    </ReDialog>

    <!-- 右键菜单由 ReTable 自带（:context-menu + @context-menu-select），无需另挂组件 -->
  </div>
</template>

<script setup lang="ts">
/**
 * WordBankView —— 词语库（数据配置）
 *
 * 词语内容 CRUD + 读音 / 释义 / 造句 / 近义 / 反义 / 同音词维护。
 * 列表行右键弹出 ReContextMenu，六种口径（相似 / 反向 / 同音词 / 同音字词 / 造句 / 含相同字）
 * 由后端 `/v2/edu/word/related` 现算，结果在弹框里可继续切换口径。
 *
 * 样式统一使用 koi / Element Plus 变量（--el-*）。
 */
import { message } from "@repo/core";
import { computed, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { Close, Collection, Connection, Delete, EditPen, More, Plus, RefreshLeft, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import { createPageLoader, pageLoadError, strParam } from "../api/pageLoader";
import type { EduWord, WordRelatedItem } from "../api/types";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn, ReTableContextMenuItem, ReTableContextMenuContext } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";
import ReButton from "@repo/ui/re-button";

const GRADE_LEVELS = ["小学", "初中", "高中", "大学"] as const;

/** 语料类型：与后端 word_kind 取值一致 */
const KINDS = [
  { value: "WORD", label: "词语" },
  { value: "PHRASE", label: "短语" },
  { value: "XIEHOUYU", label: "歇后语" },
] as const;

/** 右键菜单的六种检索口径（与后端 IEduWordService#related 的 mode 一一对应） */
const RELATED_MODES = [
  { mode: "similar", label: "相似词语" },
  { mode: "antonym", label: "反向词语" },
  { mode: "homophone", label: "同音词" },
  { mode: "pinyin", label: "同音字词" },
  { mode: "sentence", label: "造句" },
  { mode: "char", label: "含相同字" },
] as const;

const kindLabel = (kind?: string | null) => KINDS.find((k) => k.value === kind)?.label ?? "词语";

/** 逗号分隔字段 → 数组（去空） */
function splitField(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,，;；、/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const wordColumns: ReTableColumn[] = [
  { prop: "wordContent", label: "词语", minWidth: 150, slot: "col-wordContent" },
  { prop: "wordPinyin", label: "读音", minWidth: 130, slot: "col-wordPinyin" },
  { prop: "wordSynonyms", label: "相似词语", minWidth: 150, slot: "col-wordSynonyms" },
  { prop: "wordAntonyms", label: "反向词语", minWidth: 150, slot: "col-wordAntonyms" },
  { prop: "wordMeaning", label: "释义", minWidth: 220, showOverflowTooltip: true },
  { prop: "wordStructure", label: "结构", width: 90, align: "center" },
  { prop: "wordGradeLevel", label: "学段", width: 76, align: "center" },
  { prop: "actions", label: "操作", width: 150, align: "center", fixed: "right", slot: "col-actions" },
];

// ==================== 列表 ====================
const loading = ref(false);
const rows = ref<EduWord[]>([]);
const tableRef = ref();
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const blankSearch = () => ({ keyword: "", gradeLevel: "", kind: "" });
const searchDraft = reactive(blankSearch());
const applied = reactive(blankSearch());

/** 筛选参数：提交后交给后端 pageQuery */
const appliedParams = computed(() => ({
  keyword: strParam(applied.keyword),
  gradeLevel: strParam(applied.gradeLevel),
  kind: strParam(applied.kind),
}));

/** 词语分页 loader（后端筛选） */
const loadRows = createPageLoader((page, size, params) =>
  eduaiApi.pageWords({
    ...params,
    pageNum: page,
    pageSize: size,
  }),
);

/** ReTable 每页加载完成后同步当前页行与总数 */
function onLoad(r: { data: unknown[]; total?: number }) {
  rows.value = (r.data ?? []) as EduWord[];
  total.value = r?.total ?? rows.value.length;
}

const statCards = computed(() => {
  const list = rows.value;
  const withSyn = list.filter((r) => splitField(r.wordSynonyms).length > 0).length;
  const withAnti = list.filter((r) => splitField(r.wordAntonyms).length > 0).length;
  return [
    { title: "本页词语", value: list.length, icon: Collection, bg: "var(--el-color-primary-light-9)", hint: `共 ${total.value} 条` },
    { title: "已配相似", value: withSyn, icon: Connection, bg: "var(--el-color-success-light-9)", hint: "本页已填近义词" },
    { title: "已配反向", value: withAnti, icon: EditPen, bg: "var(--el-color-warning-light-9)", hint: "本页已填反义词" },
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
const form = reactive<Partial<EduWord>>({});
const formStatus = ref(true);
const STATUS_ON = 1;
const STATUS_OFF = 0;

function resetForm() {
  Object.assign(form, {
    wordId: undefined,
    wordContent: "",
    wordPinyin: "",
    wordMeaning: "",
    wordExample: "",
    wordSynonyms: "",
    wordAntonyms: "",
    wordHomophones: "",
    wordStructure: "",
    wordKind: "WORD",
    wordGradeLevel: "",
  });
  formStatus.value = true;
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: EduWord) {
  resetForm();
  Object.assign(form, { ...row });
  formStatus.value = (row.wordStatus ?? STATUS_ON) === STATUS_ON;
  dialogVisible.value = true;
}

async function save() {
  const word = (form.wordContent ?? "").trim();
  if (!word) {
    message.warning("请填写词语");
    return;
  }
  if ([...word].length < 2) {
    message.warning(`「${word}」只有一个字，汉字请到「汉字库」维护，本页存整词`);
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.saveWord({
      ...form,
      wordContent: word,
      wordStatus: formStatus.value ? STATUS_ON : STATUS_OFF,
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

async function remove(row: EduWord) {
  try {
    await ElMessageBox.confirm(`确认删除词语「${row.wordContent}」吗？`, "删除词语", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await eduaiApi.deleteWord(row.wordId as number);
    message.success("已删除");
    void tableRef.value?.reload();
  } catch (e) {
    message.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
}

// ==================== 右键菜单 + 关联速查 ====================
const ctxWord = ref<EduWord | null>(null);

/**
 * 右键菜单项（交给 ReTable 渲染与定位）。
 *
 * <p>六种口径与后端 {@code /v2/edu/word/related} 的 mode 一一对应，
 * 菜单项的 key 就是 mode，select 回抛后直接拿去查。</p>
 *
 * @param ctx 右键上下文（这里只用得到行数据）
 * @return 菜单项
 */
function ctxMenuProvider(ctx: ReTableContextMenuContext): ReTableContextMenuItem[] {
  ctxWord.value = ctx.row as unknown as EduWord;
  return RELATED_MODES.map((m) => ({ key: m.mode, label: m.label }));
}

function onCtxSelect(item: ReTableContextMenuItem) {
  void runRelated(item.key);
}

/**
 * 行内「关联速查」按钮：不经右键，直接按当前行打开相似词语。
 *
 * @param row 词语行
 */
function openRelatedFor(row: EduWord) {
  ctxWord.value = row;
  void runRelated("similar");
}

const relatedVisible = ref(false);
const relatedLoading = ref(false);
const relatedItems = ref<WordRelatedItem[]>([]);
const relatedSource = ref("");
const relatedLabel = ref("相似词语");
const currentMode = ref("similar");

const relatedTitle = computed(() =>
  ctxWord.value ? `${ctxWord.value.wordContent} · ${relatedLabel.value}` : relatedLabel.value,
);
const relatedSubtitle = computed(() =>
  relatedSource.value ? `来源：${relatedSource.value}` : "按词条维护字段与库内数据现算",
);

/**
 * 执行一次关联检索。结果直接覆盖到弹框，切换口径不关弹框。
 *
 * @param mode 检索口径
 */
async function runRelated(mode: string) {
  const word = ctxWord.value;
  if (!word?.wordId) return;
  currentMode.value = mode;
  relatedLabel.value = RELATED_MODES.find((m) => m.mode === mode)?.label ?? "关联检索";
  relatedVisible.value = true;
  relatedLoading.value = true;
  relatedItems.value = [];
  relatedSource.value = "";
  try {
    const res = await eduaiApi.relatedWords({ wordId: word.wordId, mode });
    relatedItems.value = res?.items ?? [];
    relatedSource.value = res?.source ?? "";
    relatedLabel.value = res?.label ?? relatedLabel.value;
  } catch (e) {
    message.error("检索失败: " + (e instanceof Error ? e.message : String(e)));
    relatedItems.value = [];
  } finally {
    relatedLoading.value = false;
  }
}

/** 工具条上的「关联速查」：没有选中行时给第一条，空库给提示 */
function openRelatedPanel() {
  const first = rows.value[0];
  if (!first) {
    message.warning("当前列表没有词语，请先新增或采集词语");
    return;
  }
  ctxWord.value = first;
  void runRelated("similar");
}
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
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto;
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
  height: calc(100vh - 412px);
  min-height: 300px;
  contain: layout size;
  overflow: hidden;
}
.word-table {
  width: 100%;
}
.word-table :deep(.el-table__header th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 700;
  font-size: 13px;
}
.word-table :deep(.el-table__row) {
  cursor: context-menu;
}
.word-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.word-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.pinyin-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.kind-pill {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.mini-chip {
  font-size: 12px;
  padding: 1px 7px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-success-light-9);
  color: var(--el-color-success-dark-2);
}
.mini-chip.is-anti {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger-dark-2);
}
.muted {
  color: var(--el-text-color-placeholder);
}
.table-tip {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.table-tip strong {
  color: var(--el-color-primary);
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
.form-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

/* ---------- 关联速查 ---------- */
.related-body {
  padding-top: 14px;
}
.related-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.related-tab {
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s;
}
.related-tab:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.related-tab.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-weight: 600;
}
.related-source {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}
.related-empty {
  padding: 28px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
.related-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.related-item {
  padding: 10px 12px;
  border-radius: var(--el-radius-sm, 8px);
  background: var(--el-fill-color-lighter);
}
.related-item__main {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.related-item__content {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.related-item__pinyin {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.related-item__miss {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
}
.related-item__sub {
  margin-top: 4px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.related-item__detail {
  color: var(--el-color-primary);
}
.related-item__meaning {
  color: var(--el-text-color-regular);
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .form-grid--3 {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
