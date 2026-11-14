<template>
  <div class="page-container scroll-bank">
    <!-- 卷头：标题 / 统计 / 工具 -->
    <div class="scroll-bank__head">
      <div class="scroll-bank__heading">
        <div class="scroll-bank__title-row">
          <h1 class="scroll-bank__title k">汉字卷</h1>
          <span class="scroll-bank__seal" aria-hidden="true">卷</span>
        </div>
        <p class="scroll-bank__sub">按部首分行 · 共 {{ total }} 字 · 当前卷 {{ rows.length }} 字</p>
      </div>

      <div class="stats-row scroll-bank__stats">
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

      <div class="scroll-bank__toolbar">
        <el-input
          v-model="searchDraft.keyword"
          clearable
          class="scroll-bank__kw"
          placeholder="搜 字 / 拼音 / 释义"
          :prefix-icon="Search"
          @keyup.enter="commitSearch"
          @change="commitSearch"
          @clear="commitSearch"
        />
        <el-select
          v-model="searchDraft.gradeLevel"
          clearable
          placeholder="全部学段"
          class="scroll-bank__grade"
          @change="commitSearch"
        >
          <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
        </el-select>
        <el-button type="primary" :icon="Search" :loading="loading" @click="commitSearch">搜索</el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        <span class="scroll-bank__spacer" />
        <el-button type="primary" :icon="Plus" @click="openCreate">＋ 新增汉字</el-button>
      </div>
    </div>

    <!-- 卷轴主区：左右卷杆 + 纸面字流 -->
    <div class="scroll-bank__stage">
      <span class="scroll-rod scroll-rod--l" aria-hidden="true" />
      <span class="scroll-rod scroll-rod--r" aria-hidden="true" />

      <div ref="paperRef" class="scroll-bank__paper">
        <div v-if="loading" class="scroll-bank__loading" role="status" aria-label="加载中">
          <span class="scroll-bank__spinner" />
        </div>
        <p class="scroll-bank__hint">{{ scrollHint }}</p>

        <template v-if="rows.length">
          <div v-for="g in radicalGroups" :key="g.key" class="scroll-radical">
            <span class="scroll-radical__side k">{{ g.radical }}</span>
            <div class="scroll-radical__cells">
              <button
                v-for="h in g.items"
                :key="h.hanziId"
                type="button"
                class="scroll-cell k"
                :class="{ 'is-cur': selectedHanzi?.hanziId === h.hanziId }"
                :title="`${h.hanziChar} · ${(h.hanziPinyin ?? '').split(/[,，;；/|\s]+/).filter(Boolean).join(' / ') || '—'} · ${h.hanziStrokes ?? '—'} 画`"
                @mouseenter="startHanziHover($event, h)"
                @mouseleave="cancelHanziHover"
                @click="selectHanzi(h)"
              >{{ h.hanziChar }}</button>
            </div>
          </div>
        </template>
        <el-empty v-else-if="!loading" :image-size="88" description="暂无汉字，点击「＋ 新增汉字」创建" />
      </div>
    </div>

    <!-- 卷底导航：翻卷 + 每卷字数 -->
    <div class="scroll-bank__nav">
      <button
        type="button"
        class="scroll-nav-btn"
        :disabled="pageNo <= 1"
        aria-label="上一卷"
        @click="prevScroll"
      >‹</button>
      <span class="scroll-nav__text">卷 {{ pageNo }} / {{ scrollPages }} · 每卷约 {{ pageSize }} 字</span>
      <button
        type="button"
        class="scroll-nav-btn"
        :disabled="pageNo >= scrollPages"
        aria-label="下一卷"
        @click="nextScroll"
      >›</button>
      <span class="scroll-nav__size">
        每卷
        <el-select v-model="pageSize" size="small" style="width: 84px" @change="onScrollSizeChange">
          <el-option v-for="s in [10, 20, 50]" :key="s" :label="`${s} 字`" :value="s" />
        </el-select>
      </span>
    </div>

    <!-- 选中字详情（卷侧注）：编辑 / 删除入口在这里 -->
    <section v-if="selectedHanzi" class="scroll-detail">
      <div class="scroll-detail__art">
        <el-image
          v-if="selectedHanzi.hanziImage"
          :src="selectedHanzi.hanziImage"
          :preview-src-list="[selectedHanzi.hanziImage]"
          preview-teleported
          fit="contain"
          class="scroll-detail__img"
        />
        <span v-else class="scroll-detail__char k">{{ selectedHanzi.hanziChar }}</span>
      </div>
      <div class="scroll-detail__main">
        <div class="scroll-detail__title">
          <span class="scroll-detail__char scroll-detail__char--sm k">{{ selectedHanzi.hanziChar }}</span>
          <span class="pinyin-group">
            <span v-for="p in readings(selectedHanzi)" :key="p" class="pinyin-chip">{{ p }}</span>
            <span v-if="!readings(selectedHanzi).length" class="muted">—</span>
          </span>
        </div>
        <dl class="scroll-detail__grid">
          <div><dt>部首</dt><dd>{{ selectedHanzi.hanziRadical || "—" }}</dd></div>
          <div><dt>笔画</dt><dd>{{ selectedHanzi.hanziStrokes ?? "—" }}</dd></div>
          <div><dt>结构</dt><dd>{{ selectedHanzi.hanziStructure || "—" }}</dd></div>
          <div><dt>学段</dt><dd>{{ selectedHanzi.hanziGradeLevel || "不限" }}</dd></div>
          <div class="scroll-detail__full">
            <dt>笔顺</dt>
            <dd class="scroll-detail__strokes k">{{ selectedHanzi.hanziStrokeOrder || "—" }}</dd>
          </div>
          <div class="scroll-detail__full"><dt>释义 / 组词</dt><dd>{{ selectedHanzi.hanziMeaning || "—" }}</dd></div>
        </dl>
      </div>
      <div class="scroll-detail__ops">
        <ReButton
          layout="square"
          type="primary"
          :icon="EditPen"
          tip="编辑"
          @click="openEdit(selectedHanzi)"
        />
        <ReButton
          layout="square"
          type="danger"
          :icon="Delete"
          tip="删除"
          @click="remove(selectedHanzi)"
        />
        <el-button class="scroll-detail__close" :icon="Close" circle @click="selectedHanzi = null" />
      </div>
    </section>

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
                @update:model-value="(v: number | null | undefined) => (form.hanziStrokes = v)"
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
 *
 * 展示形态：卷轴（05 卷轴方案）——「卷」即一页（pageSize 个字），
 * 每卷内按部首前端分组横排成字格流，悬停字格出笔顺浮层、点字出详情侧注。
 * 数据流与接口契约（搜索 / 学段 / 分页 / 新增 / 编辑 / 删除）与表格形态完全一致。
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Plus, Reading, RefreshLeft, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import { strParam } from "../api/pageLoader";
import type { EduHanzi } from "../api/types";
import ReDialog from "@repo/ui/re-dialog";
import ReInputNumber from "@repo/ui/re-input-number";
import HanziHoverWrite from "../components/HanziHoverWrite.vue";

const GRADE_LEVELS = ["小学", "初中", "高中"] as const;
const STRUCTURES = ["独体", "上下", "左右", "左中右", "上中下", "半包围", "全包围"] as const;

// ==================== 卷（分页）态 ====================
const loading = ref(false);
const rows = ref<EduHanzi[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const paperRef = ref<HTMLElement | null>(null);

const blankSearch = () => ({ keyword: "", gradeLevel: "" });
const searchDraft = reactive(blankSearch());
const applied = reactive(blankSearch());

/** 总卷数（最少 1 卷，空库也是 1 卷的空卷） */
const scrollPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

/** 本卷内按部首分组：无部首的字归「—」组；组按字数多的靠前（卷首重笔） */
const radicalGroups = computed(() => {
  const map = new Map<string, EduHanzi[]>();
  for (const r of rows.value) {
    const key = (r.hanziRadical ?? "").trim() || "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return [...map.entries()]
    .map(([radical, items]) => ({ key: radical, radical, items }))
    .sort((a, b) => b.items.length - a.items.length);
});

const scrollHint = computed(() => {
  const first = radicalGroups.value[0]?.radical ?? "—";
  return `卷 ${pageNo.value} · 从「${first}」部首起 —— 每格一字，点字看详情 / 悬停出笔顺`;
});

/** 拉取当前卷（服务端分页，接口与表格形态一致） */
async function fetchScroll(): Promise<void> {
  loading.value = true;
  try {
    for (;;) {
      const res = await eduaiApi.pageHanzi({
        keyword: strParam(applied.keyword),
        gradeLevel: strParam(applied.gradeLevel),
        pageNum: pageNo.value,
        pageSize: pageSize.value,
      });
      rows.value = (res?.data ?? []) as EduHanzi[];
      total.value = res?.total ?? rows.value.length;
      const pages = Math.max(1, Math.ceil(total.value / pageSize.value));
      if (pageNo.value <= pages || pageNo.value <= 1) break;
      // 尾卷被删空后页码超出总卷数：自动回退到最后一卷再取一次
      pageNo.value = pages;
    }
    if (selectedHanzi.value) {
      const still = rows.value.find((r) => r.hanziId === selectedHanzi.value?.hanziId);
      if (!still) selectedHanzi.value = null;
    }
    nextTickScrollTop();
  } catch (e) {
    message.error("加载失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
}

function nextTickScrollTop(): void {
  const el = paperRef.value;
  if (el) el.scrollTop = 0;
}

function onScrollSizeChange(): void {
  if (pageNo.value !== 1) pageNo.value = 1;
  void fetchScroll();
}

function prevScroll(): void {
  if (pageNo.value <= 1) return;
  pageNo.value -= 1;
  void fetchScroll();
}

function nextScroll(): void {
  if (pageNo.value >= scrollPages.value) return;
  pageNo.value += 1;
  void fetchScroll();
}

// ==================== 选中字详情 ====================
const selectedHanzi = ref<EduHanzi | null>(null);

function selectHanzi(h: EduHanzi): void {
  cancelHanziHover();
  selectedHanzi.value = h;
}

// ==================== 悬停笔顺 ====================
/** 行悬停书写动画的锚点与当前行（字格） */
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
    { title: "本卷汉字", value: list.length, icon: Reading, bg: "var(--el-color-primary-light-9)", hint: `共 ${total.value} 条` },
    { title: "已配笔顺", value: withOrder, icon: Plus, bg: "var(--el-color-success-light-9)", hint: "本卷已填笔顺" },
    { title: "已配字画", value: withImage, icon: EditPen, bg: "var(--el-color-warning-light-9)", hint: "本卷已填字画" },
  ];
});

function commitSearch() {
  Object.assign(applied, { ...searchDraft });
  pageNo.value = 1;
  void fetchScroll();
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
    void fetchScroll();
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
    void fetchScroll();
  } catch (e) {
    message.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
}

onMounted(() => {
  void fetchScroll();
});

onBeforeUnmount(cancelHanziHover);
</script>

<style scoped>
/* ===== 卷轴基础 ===== */
.scroll-bank {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--el-bg-color-page);
}

.k {
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "SimSun", serif;
}

/* ---------- 卷头 ---------- */
.scroll-bank__head {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px 18px;
}
.scroll-bank__heading {
  margin-right: auto;
}
.scroll-bank__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.scroll-bank__title {
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 3px;
  line-height: 1.2;
}
/* 卷头朱文印：主色圆角块 + 白「卷」字 */
.scroll-bank__seal {
  width: 30px;
  height: 30px;
  border-radius: var(--el-radius-sm, 6px);
  background: color-mix(in srgb, var(--el-color-primary) 88%, #000);
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}
.scroll-bank__sub {
  margin: 5px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.scroll-bank__stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 156px;
  padding: 10px 14px;
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
  font-size: 22px;
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
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-lg, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.scroll-bank__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}
.scroll-bank__kw {
  width: 230px;
}
.scroll-bank__grade {
  width: 130px;
}
.scroll-bank__spacer {
  flex: 1;
}

/* ---------- 卷轴主区 ---------- */
.scroll-bank__stage {
  position: relative;
  flex: 1;
  min-height: 320px;
}
/* 左右卷杆：primary 压深一档，模拟木轴 */
.scroll-rod {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  border-radius: 6px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 62%, #000) 0%, color-mix(in srgb, var(--el-color-primary) 45%, #000) 45%, color-mix(in srgb, var(--el-color-primary) 30%, #000) 100%);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 20%, transparent);
  z-index: 3;
}
.scroll-rod--l {
  left: 14px;
}
.scroll-rod--r {
  right: 14px;
}
/* 纸面：koi 白 + 主色轻染出宣纸感 */
.scroll-bank__paper {
  position: absolute;
  inset: 0 34px;
  background: color-mix(in srgb, var(--el-bg-color) 95%, var(--el-color-primary-light-5));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  overflow: auto;
  padding: 14px 16px 18px;
}
.scroll-bank__hint {
  margin: 0 0 10px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
.scroll-bank__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--el-bg-color) 55%, transparent);
  z-index: 2;
}
.scroll-bank__spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-color-primary);
  animation: scroll-bank-spin 0.8s linear infinite;
}
@keyframes scroll-bank-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 部首行 */
.scroll-radical {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}
.scroll-radical__side {
  width: 34px;
  height: 34px;
  border-radius: var(--el-radius-sm, 6px);
  background: color-mix(in srgb, var(--el-color-primary-light-9) 65%, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 900;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
.scroll-radical__cells {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 字格：每格一字，悬停上浮出笔顺、点选即高亮详情 */
.scroll-cell {
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light);
  display: grid;
  place-items: center;
  font-size: 21px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}
.scroll-cell:hover {
  transform: translateY(-2px);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}
.scroll-cell.is-cur {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
  box-shadow: 0 4px 10px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

/* ---------- 卷底导航 ---------- */
.scroll-bank__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 2px 0;
}
.scroll-nav-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.scroll-nav-btn:hover:not(:disabled) {
  border-color: var(--el-color-primary);
}
.scroll-nav-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.scroll-nav__text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.scroll-nav__size {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------- 详情侧注（选中字） ---------- */
.scroll-detail {
  display: flex;
  gap: 18px;
  padding: 14px 18px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 4px solid var(--el-color-primary);
}
.scroll-detail__art {
  width: 96px;
  height: 96px;
  border-radius: var(--el-radius-md, 8px);
  background: color-mix(in srgb, var(--el-color-primary-light-9) 55%, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.scroll-detail__img {
  width: 100%;
  height: 100%;
  border-radius: var(--el-radius-md, 8px);
}
.scroll-detail__char {
  font-size: 62px;
  font-weight: 900;
  line-height: 1;
  color: var(--el-text-color-primary);
}
.scroll-detail__char--sm {
  font-size: 30px;
}
.scroll-detail__main {
  flex: 1;
  min-width: 0;
}
.scroll-detail__title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}
.pinyin-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}
.pinyin-chip {
  font-size: 12px;
  padding: 1px 7px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.scroll-detail__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px 14px;
  margin: 0;
}
.scroll-detail__grid > div {
  min-width: 0;
}
.scroll-detail__grid dt {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.scroll-detail__grid dd {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}
.scroll-detail__full {
  grid-column: 1 / -1;
}
.scroll-detail__strokes {
  font-size: 20px !important;
  letter-spacing: 4px;
}
.scroll-detail__ops {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
}
.scroll-detail__close {
  margin-left: 4px;
}
.muted {
  color: var(--el-text-color-placeholder);
}

/* ---------- 对话框（保留表格形态原样） ---------- */
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
  .scroll-bank__kw {
    width: 180px;
  }
  .scroll-detail__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .form-grid--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .scroll-cell {
    transition: none;
  }
  .scroll-nav-btn {
    transition: none;
  }
  .scroll-bank__spinner {
    animation-duration: 1.6s;
  }
}
</style>