<template>
  <div class="page-container">
    <!-- 上区：页头 + 统计卡 -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">昆虫库</h1>
          <p class="page-header__sub">
            维护昆虫图鉴数据：名称分类、形态特征、3D 标注点与生活史，供「昆虫识图」取材
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
            placeholder="中文名 / 学名 / 雅称 / slug"
            :prefix-icon="Search"
            @keyup.enter="commitSearch"
            @change="commitSearch"
            @clear="commitSearch"
          />
        </div>
        <div class="filter-field">
          <label class="filter-field__label">目</label>
          <el-select v-model="searchDraft.order" clearable placeholder="全部目" style="width: 100%" @change="commitSearch">
            <el-option v-for="o in orderOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">变态类型</label>
          <el-select v-model="searchDraft.metamorphosis" clearable placeholder="全部" style="width: 100%" @change="commitSearch">
            <el-option label="完全变态" value="complete" />
            <el-option label="不完全变态" value="incomplete" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">建模状态</label>
          <el-select v-model="searchDraft.modelState" clearable placeholder="全部" style="width: 100%" @change="commitSearch">
            <el-option label="已建模" value="built" />
            <el-option label="未建模" value="missing" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">讲解状态</label>
          <el-select v-model="searchDraft.guideState" clearable placeholder="全部" style="width: 100%" @change="commitSearch">
            <el-option label="已配讲解" value="guided" />
            <el-option label="未配讲解" value="missing" />
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
          :data="filtered"
          :columns="insectColumns"
          :row-key="'insectId'"
          layout="table"
          :layout-switch="false"
          stripe
          :settings="{ border: false }"
          class="insect-table"
          @row-click="(row: Record<string, unknown>) => openEdit(row as unknown as InsectLibraryItem)"
          :config="{ toolbar: { enable: false } }"
        >
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增昆虫</el-button>
            <span class="model-hint">
              建模文件放在 <code>pages/eduai/src/insect/three/builders/&lt;slug&gt;.ts</code>；
              未建模的物种只在此处可见，不会出现在「昆虫识图」名录里
            </span>
          </template>
          <template #empty>
            <el-empty :image-size="88" description="暂无昆虫，点击「新增昆虫」创建" />
          </template>
          <template #col-insectName="{ row }">
            <span class="cell-name">
              <span class="cell-name__dot" :style="{ background: row.insectAccent || 'var(--el-color-primary)' }" />
              {{ row.insectName }}
            </span>
          </template>
          <template #col-insectOrder="{ row }">{{ orderLabel(row.insectOrder) }}</template>
          <template #col-insectMetamorphosis="{ row }">
            <span class="tag-pill" :class="row.insectMetamorphosis === 'complete' ? 'is-blue' : 'is-green'">
              {{ metaLabel(row.insectMetamorphosis) }}
            </span>
          </template>
          <template #col-insectDifficulty="{ row }">
            <span class="tag-pill" :class="diffClass(row.insectDifficulty)">
              {{ diffLabel(row.insectDifficulty) }}
            </span>
          </template>
          <template #col-modelState="{ row }">
            <span class="tag-pill" :class="modelOf(row as unknown as InsectLibraryItem) ? 'is-green' : 'is-grey'">
              {{ modelOf(row as unknown as InsectLibraryItem) ? "已建模" : "未建模" }}
            </span>
          </template>
          <template #col-hasGuide="{ row }">
            <span class="tag-pill" :class="row.hasGuide ? 'is-green' : 'is-grey'">
              {{ row.hasGuide ? "已配" : "未配" }}
            </span>
          </template>
          <template #col-actions="{ row }">
            <button
              type="button"
              class="row-edit-btn"
              title="编辑"
              @click.stop="openEdit(row as unknown as InsectLibraryItem)"
            >
              <el-icon><EditPen /></el-icon>
            </button>
            <button
              type="button"
              class="row-del-btn"
              title="删除"
              @click.stop="remove(row as unknown as InsectLibraryItem)"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </template>
        </ReTable>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <ReDialog v-model="dialogVisible" class="q-dialog" width="920" :show-close="false" :show-window-shell="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><Search /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ form.insectId ? "编辑昆虫" : "新增昆虫" }}</div>
              <div class="dialog-head__sub">维护图鉴数据与 3D 展台取材</div>
            </div>
          </div>
          <button type="button" class="dialog-head__close" aria-label="关闭" @click="dialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="q-dialog__body">
        <el-tabs v-model="activeTab" class="q-tabs">
          <!-- ① 物种信息 -->
          <el-tab-pane label="物种信息" name="info">
        <el-form :model="form" label-width="112" @submit.prevent>
          <!-- 基本信息 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />基本信息</div>
          </div>
          <div class="form-grid form-grid--3">
            <el-form-item label="中文名" required>
              <el-input v-model="form.insectName" maxlength="30" placeholder="如：双叉犀金龟" />
            </el-form-item>
            <el-form-item label="学名">
              <el-input v-model="form.insectLatin" maxlength="60" placeholder="如：Trypoxylus dichotomus" />
            </el-form-item>
            <el-form-item label="标识 slug" required>
              <el-input v-model="form.insectCode" placeholder="如：rhinoceros-beetle" :disabled="!!form.insectId" />
            </el-form-item>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="雅称">
              <el-input v-model="form.insectEpithet" maxlength="60" placeholder="如：腐叶堆里长大的角斗士" />
            </el-form-item>
            <el-form-item label="主题色">
              <el-color-picker v-model="form.insectAccent" />
            </el-form-item>
          </div>
          <el-form-item label="简介">
            <el-input v-model="form.insectSummary" type="textarea" :rows="2" placeholder="2~3 句总述" />
          </el-form-item>

          <!-- 分类与状态 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />分类与状态</div>
          </div>
          <div class="form-grid form-grid--3">
            <el-form-item label="目" required>
              <el-select v-model="form.insectOrder" placeholder="选择目" style="width: 100%">
                <el-option v-for="o in orderOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="变态类型">
              <el-select v-model="form.insectMetamorphosis" placeholder="选择类型" style="width: 100%">
                <el-option label="完全变态" value="complete" />
                <el-option label="不完全变态" value="incomplete" />
              </el-select>
            </el-form-item>
            <el-form-item label="难度">
              <el-rate v-model="form.insectDifficulty" :max="5" />
            </el-form-item>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="分布">
              <el-input v-model="form.insectRange" placeholder="如：中国、朝鲜半岛、日本" />
            </el-form-item>
            <el-form-item label="保护状态">
              <el-input v-model="form.insectStatus" placeholder="如：常见 / 濒危" />
            </el-form-item>
          </div>
          <el-form-item label="生态角色">
            <el-input v-model="form.insectEcology" type="textarea" :rows="2" placeholder="它在生态系统里做什么" />
          </el-form-item>
          <el-form-item label="你知道吗">
            <el-input v-model="form.insectTrivia" type="textarea" :rows="2" placeholder="一条反直觉的冷知识" />
          </el-form-item>

          <!-- 形态特征 -->
          <div class="form-section">
            <div class="form-section__title">
              <span class="form-section__bar" />形态特征
              <span class="form-section__hint">展台右栏「关键数据」，建议 6 条</span>
            </div>
          </div>
          <div v-for="(f, i) in formFacts" :key="'f' + i" class="repeat-row">
            <el-input v-model="f.key" class="repeat-row__key" placeholder="字段名，如 体长" />
            <el-input v-model="f.value" class="repeat-row__value" placeholder="字段值" />
            <el-select v-model="f.icon" class="repeat-row__sel" placeholder="图标">
              <el-option v-for="ic in FACT_ICONS" :key="ic" :label="ic" :value="ic" />
            </el-select>
            <button type="button" class="repeat-row__del" title="删除" @click="formFacts.splice(i, 1)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
          <el-button class="repeat-add" :icon="Plus" @click="formFacts.push({ key: '', value: '', icon: 'size' })">
            添加特征
          </el-button>

          <!-- 3D 标注点 -->
          <div class="form-section">
            <div class="form-section__title">
              <span class="form-section__bar" />3D 标注点
              <span class="form-section__hint">
                anchor 必须是模型里真实存在的锚点，否则该标注点不会显示（不报错，静默不出现）
              </span>
            </div>
          </div>
          <div v-for="(h, i) in formHotspots" :key="'h' + i" class="repeat-row repeat-row--wide">
            <el-input v-model="h.label" class="repeat-row__key" placeholder="部位名，如 头角" />
            <el-input v-model="h.anchor" class="repeat-row__key" placeholder="锚点，如 horn" />
            <el-select v-model="h.tone" class="repeat-row__sel" placeholder="配色">
              <el-option v-for="t in HOTSPOT_TONES" :key="t" :label="t" :value="t" />
            </el-select>
            <el-input v-model="h.note" class="repeat-row__value" placeholder="一句话说明" />
            <button type="button" class="repeat-row__del" title="删除" @click="formHotspots.splice(i, 1)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
          <el-button
            class="repeat-add"
            :icon="Plus"
            @click="formHotspots.push({ id: '', label: '', note: '', anchor: '', tone: 'coral' })"
          >
            添加标注点
          </el-button>

          <!-- 生活史与近缘 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />生活史与近缘种</div>
          </div>
          <el-form-item label="生活史">
            <el-input v-model="formLifecycle" placeholder="逗号分隔，如：卵,幼虫,蛹,成虫" />
          </el-form-item>
          <el-form-item label="近缘种">
            <el-input v-model="formRelatives" placeholder="逗号分隔，如：长戟大兜虫,日本锹甲" />
          </el-form-item>

          <!-- 建模 -->
          <div class="form-section">
            <div class="form-section__title">
              <span class="form-section__bar" />3D 建模
              <span class="form-section__hint">留空则用自身 slug 的建模文件；也可借用形态相近物种的模型</span>
            </div>
          </div>
          <el-form-item label="复用模型">
            <el-select
              v-model="form.insectModelCode"
              clearable
              filterable
              placeholder="留空 = 用自身 slug 的建模"
              style="width: 100%"
            >
              <el-option
                v-for="s in builtSpecies"
                :key="s.value"
                :label="`${s.label}（${s.value}）`"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
          </el-tab-pane>

          <!-- ② 讲解与测验：对应识图页的「分步讲解 / 小测验 / 动态演示 / 栖境」 -->
          <el-tab-pane name="guide">
            <template #label>
              <span class="tab-label">
                讲解与测验
                <span v-if="formGuideDirty" class="tab-label__dot" title="有未保存的改动" />
              </span>
            </template>

            <el-alert
              v-if="!form.insectId"
              class="guide-tip"
              type="info"
              :closable="false"
              show-icon
              title="讲解随物种一起保存"
              description="新建物种时这里填的内容会与物种信息一并提交；物种保存后本页会按 slug 建立关联。"
            />

            <div class="form-section">
              <div class="form-section__title"><span class="form-section__bar" />动态演示</div>
            </div>
            <el-form label-width="112" @submit.prevent>
              <div class="form-grid form-grid--2">
                <el-form-item label="标题">
                  <el-input v-model="guideMotion.title" placeholder="如：角斗的一击" />
                </el-form-item>
              </div>
              <el-form-item label="正文">
                <el-input v-model="guideMotion.body" type="textarea" :rows="2" placeholder="这段演示讲的是什么动作" />
              </el-form-item>

              <div class="form-section">
                <div class="form-section__title"><span class="form-section__bar" />栖境（它在哪里）</div>
              </div>
              <div class="form-grid form-grid--2">
                <el-form-item label="标题">
                  <el-input v-model="guideHabitat.title" placeholder="如：腐殖土与树液" />
                </el-form-item>
              </div>
              <el-form-item label="正文">
                <el-input v-model="guideHabitat.body" type="textarea" :rows="3" placeholder="栖境与在生态系统中的位置" />
              </el-form-item>

              <div class="form-section">
                <div class="form-section__title">
                  <span class="form-section__bar" />分步讲解
                  <span class="form-section__hint">
                    每步的 anchor 与「3D 标注点」里的锚点一致时，切换步骤会把镜头对到该部位
                  </span>
                </div>
              </div>
              <div v-for="(s, i) in guideLesson" :key="'ls' + i" class="lesson-row">
                <div class="lesson-row__head">
                  <span class="lesson-row__no">第 {{ i + 1 }} 步</span>
                  <el-input v-model="s.anchor" class="lesson-row__anchor" placeholder="anchor（可空）" />
                  <button type="button" class="repeat-row__del" title="删除" @click="guideLesson.splice(i, 1)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </div>
                <el-input v-model="s.title" placeholder="步骤标题" />
                <el-input v-model="s.body" type="textarea" :rows="3" placeholder="步骤正文" />
              </div>
              <el-button class="repeat-add" :icon="Plus" @click="guideLesson.push({ title: '', body: '', anchor: '' })">
                添加讲解步骤
              </el-button>

              <div class="form-section">
                <div class="form-section__title">
                  <span class="form-section__bar" />单选题
                  <span class="form-section__hint">选项固定 3 个，与现有数据一致</span>
                </div>
              </div>
              <div v-for="(q, i) in guideQuiz" :key="'qz' + i" class="quiz-row">
                <div class="lesson-row__head">
                  <span class="lesson-row__no">第 {{ i + 1 }} 题</span>
                  <span class="lesson-row__answer">
                    正确选项
                    <ReRadioGroup v-model="q.answer">
                      <ReRadioButton :value="0">A</ReRadioButton>
                      <ReRadioButton :value="1">B</ReRadioButton>
                      <ReRadioButton :value="2">C</ReRadioButton>
                    </ReRadioGroup>
                  </span>
                  <button type="button" class="repeat-row__del" title="删除" @click="guideQuiz.splice(i, 1)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </div>
                <el-input v-model="q.question" placeholder="题干" />
                <div class="quiz-row__opts">
                  <el-input
                    v-for="oi in 3"
                    :key="oi"
                    v-model="q.options[oi - 1]"
                    :placeholder="`选项 ${'ABC'[oi - 1]}`"
                  />
                </div>
                <el-input v-model="q.explain" type="textarea" :rows="2" placeholder="作答后的解释" />
              </div>
              <el-button class="repeat-add" :icon="Plus" @click="addQuiz">
                添加单选题
              </el-button>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button class="dialog-foot__save" type="primary" :loading="saving" @click="save">
            保存昆虫
          </el-button>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * InsectBankView —— 昆虫库（维护页）
 *
 * 对应「数据配置」分组，职责与「成语库」一致：维护图鉴数据本身。
 * 与「昆虫识图」的分工：
 *   - 识图页只读，且**只列建模文件存在的物种**（isKnownSpecies 过滤）；
 *   - 本页可读写，并**把未建模的物种也列出来** —— 数据与建模本来就是两条腿，
 *     新加的物种往往先有数据、后有模型，维护页看不见它就等于没法录。
 *
 * 落库格式：insect_facts / insect_hotspots / insect_lifecycle / insect_relatives
 * 在库里是 JSON 文本。/detail 已经把前两者解析成对象数组、后两者解析成字符串数组，
 * 编辑时直接用；保存前再序列化回 JSON 文本（后端实体收的就是文本）。
 */
import { message } from "@repo/core";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Plus, RefreshLeft, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type {
  Insect,
  InsectFact,
  InsectHotspot,
  InsectLibraryItem,
  InsectLessonStep,
  InsectQuizItem,
} from "../api/types";
import { ORDER_LABELS, metamorphosisLabel } from "../components/insect/orderLabels";
import { modelSlugOf } from "../components/insect/modelSlug";
import { knownSpecies } from "../insect/three/registry";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";

const FACT_ICONS = ["size", "weight", "time", "place", "food", "ability"];
const HOTSPOT_TONES = ["coral", "sage", "amber", "lavender"];
const MEDIA_LABEL: Record<string, string> = { complete: "完全变态", incomplete: "不完全变态" };

// ==================== 列表 ====================
const loading = ref(false);
const rows = ref<InsectLibraryItem[]>([]);
const tableRef = ref();

const blankSearch = () => ({ keyword: "", order: "", metamorphosis: "", modelState: "", guideState: "" });
const searchDraft = reactive(blankSearch());
const applied = reactive(blankSearch());

const orderOptions = computed(() => {
  const used = new Set(rows.value.map((r) => r.insectOrder));
  return Object.entries(ORDER_LABELS)
    .filter(([k]) => used.has(k))
    .map(([value, label]) => ({ value, label }));
});

/** 已建模的 slug 集合（由 registry 在构建期扫 builders 目录得出） */
const builtSet = computed(() => new Set(knownSpecies()));

/**
 * 该条实际使用的建模 slug 与其是否存在
 *
 * @param row 名录行
 * @returns 建模 slug（复用优先）
 */
const modelOfSlug = (row: InsectLibraryItem) => modelSlugOf(row);

/**
 * 该条是否已建模
 *
 * @param row 名录行
 * @returns 建模文件是否存在
 */
const modelOf = (row: InsectLibraryItem) => builtSet.value.has(modelOfSlug(row));

const builtSpecies = computed(() =>
  rows.value
    .filter((r) => builtSet.value.has(r.insectCode))
    .map((r) => ({ value: r.insectCode, label: r.insectName }))
    .sort((a, b) => a.label.localeCompare(b.label, "zh")),
);

const filtered = computed(() => {
  const kw = applied.keyword.trim().toLowerCase();
  return rows.value.filter((r) => {
    if (applied.order && r.insectOrder !== applied.order) return false;
    if (applied.metamorphosis && r.insectMetamorphosis !== applied.metamorphosis) return false;
    if (applied.modelState === "built" && !modelOf(r)) return false;
    if (applied.modelState === "missing" && modelOf(r)) return false;
    if (applied.guideState === "guided" && !r.hasGuide) return false;
    if (applied.guideState === "missing" && r.hasGuide) return false;
    if (kw) {
      const hay = `${r.insectName} ${r.insectLatin} ${r.insectEpithet ?? ""} ${r.insectCode}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
});

/**
 * 昆虫列表的列定义（ReTable 表格模式用）。
 *
 * <p>自定义单元格一律走 {@code #col-<prop>} 插槽；「中文名 / 目 / 变态 /
 * 难度 / 建模 / 讲解 / 操作」需要包一层渲染，同样挂插槽（其中「建模」
 * 无真实字段，{@code modelState} 仅为插槽载体）。</p>
 */
const insectColumns: ReTableColumn[] = [
  { prop: "insectId", label: "ID", width: 70 },
  { prop: "insectName", label: "中文名", minWidth: 170, slot: "col-insectName" },
  { prop: "insectLatin", label: "学名", minWidth: 200, showOverflowTooltip: true },
  { prop: "insectOrder", label: "目", width: 100, slot: "col-insectOrder" },
  { prop: "insectMetamorphosis", label: "变态", width: 110, slot: "col-insectMetamorphosis" },
  { prop: "insectDifficulty", label: "难度", width: 90, slot: "col-insectDifficulty" },
  { prop: "modelState", label: "建模", width: 110, align: "center", slot: "col-modelState" },
  { prop: "hasGuide", label: "讲解", width: 90, align: "center", slot: "col-hasGuide" },
  { prop: "actions", label: "操作", width: 140, align: "center", fixed: "right", slot: "col-actions" },
];

const statCards = computed(() => {
  const all = rows.value.length;
  const built = rows.value.filter(modelOf).length;
  const guided = rows.value.filter((r) => r.hasGuide).length;
  return [
    { title: "物种总数", value: all, hint: `覆盖 ${orderOptions.value.length} 个目`, icon: "Search", bg: "var(--el-color-primary-light-9)" },
    { title: "已建模", value: built, hint: "可在识图页展示", icon: "Star", bg: "var(--el-color-success-light-9)" },
    { title: "未建模", value: all - built, hint: "仅本页可见", icon: "Warning", bg: "var(--el-color-warning-light-9)" },
    { title: "已配讲解", value: guided, hint: `未配 ${all - guided} 个`, icon: "Reading", bg: "var(--el-color-info-light-9)" },
  ];
});

const orderLabel = (v?: string) => (v ? (ORDER_LABELS[v] ?? v) : "—");
const metaLabel = (v?: string) => (v ? (MEDIA_LABEL[v] ?? v) : "—");
const diffLabel = (n?: number) => `L${n ?? 1}`;
const diffClass = (n?: number) => `is-diff-${Math.min(5, Math.max(1, n ?? 1))}`;

async function loadList() {
  loading.value = true;
  try {
    rows.value = (await eduaiApi.insectLibrary()) ?? [];
  } catch (e) {
    message.error(`昆虫库加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    loading.value = false;
  }
}

function commitSearch() {
  Object.assign(applied, searchDraft);
  void tableRef.value?.goto(1);
}

function handleReset() {
  Object.assign(searchDraft, blankSearch());
  Object.assign(applied, blankSearch());
  void tableRef.value?.goto(1);
}

// ==================== 表单 ====================
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<Insect>>({});
const formFacts = ref<InsectFact[]>([]);
const formHotspots = ref<InsectHotspot[]>([]);
const formLifecycle = ref("");
const formRelatives = ref("");

// ==================== 讲解与测验（对话框第二个标签页） ====================
const activeTab = ref<"info" | "guide">("info");
const guideLesson = ref<InsectLessonStep[]>([]);
const guideQuiz = ref<InsectQuizItem[]>([]);
const guideMotion = ref({ title: "", body: "" });
const guideHabitat = ref({ title: "", body: "" });
/** 讲解表单是否被改过（用于标签页上的未保存提示） */
const guideTouched = ref(false);
const formGuideDirty = computed(() => guideTouched.value);

watch([guideLesson, guideQuiz, guideMotion, guideHabitat], () => {
  guideTouched.value = true;
}, { deep: true });

/**
 * 新增一道单选题
 *
 * 选项固定 3 个：现有数据（insects-world 的 quiz）全是 3 选 1，
 * 保持一致可以让前端小测的 A/B/C 编号与判分逻辑无需分叉。
 */
function addQuiz() {
  guideQuiz.value.push({ question: "", options: ["", "", ""], answer: 0, explain: "" });
}

/**
 * 把讲解表单复位成空
 */
function resetGuideForm() {
  guideLesson.value = [];
  guideQuiz.value = [];
  guideMotion.value = { title: "", body: "" };
  guideHabitat.value = { title: "", body: "" };
  // watch 是 deep 的，赋值本身会把它置 true，这里再显式压回 false
  nextTick(() => {
    guideTouched.value = false;
  });
}

/** 逗号 / 顿号 / 换行都当分隔符，避免录入习惯不同导致整串变成一个词 */
const splitList = (s: string) =>
  s
    .split(/[,，、\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

function resetForm() {
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  Object.assign(form, {
    insectCode: "",
    insectName: "",
    insectLatin: "",
    insectEpithet: "",
    insectOrder: "coleoptera",
    insectSummary: "",
    insectEcology: "",
    insectTrivia: "",
    insectMetamorphosis: "complete",
    insectRange: "",
    insectStatus: "",
    insectAccent: "#9c5a34",
    insectModelCode: "",
    insectDifficulty: 3,
  });
  formFacts.value = [
    { key: "体长", value: "", icon: "size" },
    { key: "", value: "", icon: "weight" },
    { key: "", value: "", icon: "time" },
    { key: "", value: "", icon: "place" },
    { key: "", value: "", icon: "food" },
    { key: "", value: "", icon: "ability" },
  ];
  formHotspots.value = [];
  formLifecycle.value = "";
  formRelatives.value = "";
  resetGuideForm();
  activeTab.value = "info";
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

/**
 * 打开编辑：列表只有轻量字段，需再取一次详情拿 facts/hotspots 等
 *
 * @param row 列表行
 */
async function openEdit(row: InsectLibraryItem) {
  resetForm();
  Object.assign(form, { ...row });
  dialogVisible.value = true;
  try {
    const detail = await eduaiApi.getInsectDetail(row.insectId);
    if (!detail) return;
    Object.assign(form, detail);
    formFacts.value = Array.isArray(detail.insectFacts) ? detail.insectFacts.map((f) => ({ ...f })) : [];
    formHotspots.value = Array.isArray(detail.insectHotspots)
      ? detail.insectHotspots.map((h) => ({ ...h }))
      : [];
    formLifecycle.value = (detail.insectLifecycle ?? []).join(",");
    formRelatives.value = (detail.insectRelatives ?? []).join(",");
    // 讲解是另一张表，按 slug 取；没有则保持空白（新物种就是这种情况）
    try {
      const g = await eduaiApi.insectGuide(row.insectCode);
      guideLesson.value = (g?.lesson ?? []).map((s) => ({ title: s.title ?? "", body: s.body ?? "", anchor: s.anchor ?? "" }));
      guideQuiz.value = (g?.quiz ?? []).map((q) => ({
        question: q.question ?? "",
        options: [0, 1, 2].map((i) => q.options?.[i] ?? ""),
        answer: typeof q.answer === "number" ? q.answer : 0,
        explain: q.explain ?? "",
      }));
      guideMotion.value = { title: g?.motion?.title ?? "", body: g?.motion?.body ?? "" };
      guideHabitat.value = { title: g?.habitat?.title ?? "", body: g?.habitat?.body ?? "" };
    } catch {
      // 没有讲解不是错误：新物种本来就可能还没配
      resetGuideForm();
    }
    nextTick(() => {
      guideTouched.value = false;
    });
  } catch (e) {
    message.error(`详情加载失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 保存讲解（仅在讲解表单有内容或被改过时才发请求）
 *
 * 允许空讲解：四个字段全空且本来就没有讲解时不打扰后端。
 *
 * @param insectCode 物种 slug
 * @return true 成功 / false 失败 / null 无需保存
 */
async function saveGuideIfNeeded(insectCode: string): Promise<boolean | null> {
  if (!insectCode) {
    return null;
  }
  const lesson = guideLesson.value.filter((s) => s.title?.trim() || s.body?.trim());
  const quiz = guideQuiz.value.filter((q) => q.question?.trim());
  const motionTitle = guideMotion.value.title?.trim() ?? "";
  const motionBody = guideMotion.value.body?.trim() ?? "";
  const habitatTitle = guideHabitat.value.title?.trim() ?? "";
  const habitatBody = guideHabitat.value.body?.trim() ?? "";
  const empty = !lesson.length && !quiz.length && !motionTitle && !motionBody && !habitatTitle && !habitatBody;
  // 本来就没讲解、现在也还是空的 → 不必建一条空记录
  if (empty && !guideTouched.value) {
    return null;
  }
  try {
    const ok = await eduaiApi.saveInsectGuide({
      insectCode,
      lesson: lesson.map((s) => ({ title: s.title ?? "", body: s.body ?? "", anchor: s.anchor || undefined })),
      motion: { title: motionTitle, body: motionBody },
      quiz: quiz.map((q) => ({
        question: q.question ?? "",
        options: [0, 1, 2].map((i) => q.options?.[i] ?? ""),
        answer: typeof q.answer === "number" ? q.answer : 0,
        explain: q.explain ?? "",
      })),
      habitat: { title: habitatTitle, body: habitatBody },
    });
    return ok === true;
  } catch {
    return false;
  }
}

const save = async () => {
  if (!form.insectName?.trim()) return message.warning("请填写中文名");
  if (!form.insectCode?.trim()) return message.warning("请填写标识 slug");
  if (!form.insectOrder) return message.warning("请选择所属目");

  saving.value = true;
  try {
    const payload: Partial<Insect> = {
      ...form,
      insectCode: form.insectCode.trim(),
      insectName: form.insectName.trim(),
      // 四个 JSON 列按实体契约回传文本；空数组也写 '[]'，便于前端统一按数组解析
      insectFacts: JSON.stringify(formFacts.value.filter((f) => f.key?.trim() && f.value?.trim())),
      insectHotspots: JSON.stringify(
        formHotspots.value
          .filter((h) => h.label?.trim() && h.anchor?.trim())
          .map((h) => ({ ...h, id: h.id?.trim() || `${form.insectCode}-${h.anchor}` })),
      ),
      insectLifecycle: JSON.stringify(splitList(formLifecycle.value)),
      insectRelatives: JSON.stringify(splitList(formRelatives.value)),
      insectModelCode: form.insectModelCode?.trim() || null,
    };
    const ok = await eduaiApi.saveInsect(payload);
    if (!ok) {
      message.error("保存失败");
      return;
    }
    // 讲解按 slug 关联，必须在物种落库之后再存，否则新建时 slug 还不存在
    const saved = await saveGuideIfNeeded(payload.insectCode ?? "");
    if (saved === false) {
      message.warning("物种已保存，但讲解保存失败，请重试");
      await loadList();
      return;
    }
    message.success(form.insectId ? "已保存" : "已新增");
    dialogVisible.value = false;
    // 保存后自动按名称筛选并定位到第一页：列表按「目 + ID」排序，
    // 新记录很可能落在第 2 页之后，不筛的话用户会以为没保存成功。
    searchDraft.keyword = payload.insectName ?? "";
    Object.assign(applied, searchDraft);
    void tableRef.value?.goto(1);
    nextTick(() => {
      guideTouched.value = false;
    });
    await loadList();
  } catch (e) {
    message.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
};

async function remove(row: InsectLibraryItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.insectName}」？其详情与标注点将一并移除，且不可恢复。`,
      "删除昆虫",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  try {
    const ok = await eduaiApi.deleteInsect(row.insectId);
    message[ok ? "success" : "warning"](ok ? "已删除" : "该记录已不存在");
    await loadList();
  } catch (e) {
    message.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

onMounted(() => {
  void loadList();
});
</script>

<style scoped>
.page-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--el-bg-color-page);
}
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
  /* 原 14px，最近档 12px（lg） */
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
}

.filter-card,
.table-card {
  /* 原 14px，最近档 12px（lg） */
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

.model-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 620px;
  line-height: 1.6;
}
.model-hint code {
  font-size: 11px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-xs, 4px);
  padding: 1px 5px;
}
.table-wrap {
  /* 固定容器高度：消除滚动条液面高度随滚动反复重算的抖动。
     493 = 1440x980 实测 wrap.top 464 + el-main 底部留白 8 + 卡片 body
     底部内边距 21；此时表格卡正好贴到页面容器底边，不再留底空。
     min-height 取 300：更小视口下改走页面滚动，不把固定高度顶破。
     contain: layout size 让 ReTable 走 height:100%。 */
  height: calc(100vh - 493px);
  min-height: 300px;
  contain: layout size;
  overflow: hidden;
}
.insect-table :deep(.el-table__row) {
  cursor: pointer;
}
.cell-name {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.cell-name__dot {
  width: 9px;
  height: 9px;
  /* 分类色点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  flex-shrink: 0;
}
.tag-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  border-radius: var(--el-radius-sm, 6px);
  padding: 1px 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.tag-pill.is-blue {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.tag-pill.is-green {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.tag-pill.is-grey {
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
}
.tag-pill.is-diff-1,
.tag-pill.is-diff-2 {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.tag-pill.is-diff-3 {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}
.tag-pill.is-diff-4,
.tag-pill.is-diff-5 {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.row-edit-btn,
.row-del-btn {
  width: 28px;
  height: 28px;
  margin: 0 3px;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.row-edit-btn:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.row-edit-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.row-del-btn:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
/* 删除键的焦点环用危险色，和它的 hover 底色保持同一语义 */
.row-del-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dialog-head__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dialog-head__icon {
  width: 34px;
  height: 34px;
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-head__title {
  font-size: 17px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.dialog-head__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.dialog-head__close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.dialog-head__close:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.q-dialog__body {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 6px;
}
.form-section {
  margin: 4px 0 12px;
}
.form-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.form-section__bar {
  width: 3px;
  height: 14px;
  /* 原 2px 圆头竖条，最小档 4px 会把 3px 宽的竖条糊成胶囊，
     这里保留 2px —— 它是纯装饰色条，不是可交互控件的圆角 */
  border-radius: 2px;
  background: var(--el-color-primary);
}
.form-section__hint {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}
.form-grid {
  display: grid;
  gap: 0 14px;
}
.form-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.form-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.repeat-row {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) 110px 34px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.repeat-row--wide {
  grid-template-columns: 120px 130px 110px minmax(0, 1fr) 34px;
}
.repeat-row__del {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.repeat-row__del:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.repeat-row__del:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}
.repeat-add {
  margin-bottom: 6px;
}

/* 讲解与测验标签页 */
.q-tabs :deep(.el-tabs__header) {
  margin-bottom: 14px;
}
.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tab-label__dot {
  width: 7px;
  height: 7px;
  /* 标签小圆点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-warning);
}
.guide-tip {
  margin-bottom: 14px;
}
.lesson-row,
.quiz-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
}
.lesson-row__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lesson-row__no {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 900;
  color: var(--el-color-primary);
}
.lesson-row__anchor {
  max-width: 220px;
}
.lesson-row__answer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}
.lesson-row__head .repeat-row__del {
  margin-left: 0;
}
.quiz-row__opts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.dialog-foot__save {
  min-width: 110px;
}
@media (max-width: 1100px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .form-grid--3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .row-edit-btn,
  .row-del-btn {
    transition: none;
  }
}
</style>
