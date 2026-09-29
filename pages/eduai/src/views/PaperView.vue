<template>
  <div class="page-container">
      <ReTable
        ref="tableRef"
        :loader="loadPapers"
        :params="queryParams"
        :search="searchConfig"
        v-model:search-model="searchModel"
        row-key="paperId"
        show-selection
        v-model:page="pageNo"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        border
        stripe
        @search="commitSearch"
        @search-reset="resetSearch"
        @load-error="pageLoadError"
        @selection-change="onPrintSelectionChange"
        @load="onTableLoad"
      >
        <template #toolbar>
          <!-- 组卷只有一个入口：AI 组卷是它的功能之一（弹框内切换组卷方式） -->
          <ReButton type="primary" icon="MagicStick" @click="openCompose">组卷</ReButton>
          <!--
            打印只对勾选的行生效：没勾选时禁用，避免误打印整页/整库。
            禁用态的 el-tooltip 不会触发（disabled 元素收不到 hover），所以外面包一层
            带原生 title 的 span —— 否则用户只看到一个灰按钮，不知道要先勾选。
          -->
          <span :title="printSelection.length
            ? `打印已勾选的 ${printSelection.length} 份试卷`
            : '打印：请先在左侧勾选要打印的试卷'">
            <ReButton
              icon="Printer"
              :disabled="!printSelection.length"
              :tip="printSelection.length
                ? `打印已勾选的 ${printSelection.length} 份试卷`
                : '打印：请先在左侧勾选要打印的试卷'"
              @click="openPrint"
            >
              打印{{ printSelection.length ? `（${printSelection.length}）` : "" }}
            </ReButton>
          </span>
        </template>
        <ReTableColumn prop="paperId" label="ID" width="80" />
        <ReTableColumn prop="paperName" label="试卷名" min-width="200" />
        <ReTableColumn prop="paperSubject" label="学科" width="100" />
        <ReTableColumn prop="paperGradeLevel" label="学段" width="100" />
        <ReTableColumn prop="paperGrade" label="年级" width="100" />
        <ReTableColumn prop="paperTotalScore" label="总分" width="80" />
        <ReTableColumn prop="paperQuestionCount" label="题数" width="80" />
        <ReTableColumn prop="paperDuration" label="时长(分)" width="100" />
        <ReTableColumn label="来源" width="80">
          <template #default="{ row }">
            <el-tag  :type="row.paperSource === 'AI' ? 'success' : 'info'">{{ row.paperSource }}</el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="状态" width="100">
          <template #default="{ row }">
            <el-tag  :type="paperStatusType(row.paperStatus)">{{ paperStatusLabel(row.paperStatus) }}</el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="360" fixed="right" align="center">
          <template #default="{ row }">
            <!-- 详情：任何状态都可看 -->
            <ReButton icon="View" :show-text="false" type="primary" @click="openDetail(row)">详情</ReButton>
            <!--
              业务口径「发布=冻结」：
                草稿(0)   → 编辑 / 组卷 / 题库 / 发布 / 归档
                已发布(1) → 下架 / 归档
                已归档(2) → 只读，仅详情
            -->
            <template v-if="paperStatusCode(row) === 0">
              <ReButton icon="Edit" :show-text="false" type="warning" @click="openEdit(row)">编辑</ReButton>
              <ReButton icon="EditPen" :show-text="false" type="info" @click="goCompose(row)">组卷</ReButton>
              <ReButton icon="Collection" :show-text="false" type="success" @click="openMarket(row)">题库</ReButton>
              <ReButton icon="Upload" :show-text="false" type="success" @click="onPublishRow(row)">发布</ReButton>
              <ReButton icon="FolderChecked" :show-text="false" type="info" @click="onArchiveRow(row)">归档</ReButton>
            </template>
            <template v-else-if="paperStatusCode(row) === 1">
              <ReButton icon="Download" :show-text="false" type="warning" @click="onUnpublishRow(row)">下架</ReButton>
              <ReButton icon="FolderChecked" :show-text="false" type="info" @click="onArchiveRow(row)">归档</ReButton>
            </template>
            <span v-else class="paper-row__readonly">已归档（只读）</span>
          </template>
        </ReTableColumn>
      </ReTable>

    <!-- 组卷对话框：手动 / AI 共用一套卷头配置，AI 方式多出题量与分值 -->
    <el-dialog v-model="createDialogVisible" title="组卷" width="560">
      <el-form :model="createForm" label-width="100">
        <el-form-item label="组卷方式">
          <el-radio-group v-model="composeMode">
            <el-radio value="MANUAL">手动组卷</el-radio>
            <el-radio value="AI">AI 组卷</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="试卷名称" required>
          <el-input v-model="createForm.name" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="学科" required>
          <el-input v-model="createForm.subject" placeholder="请输入学科，如 数学" />
        </el-form-item>
        <!--
          学段/年级在 edu_paper 上是 NOT NULL 且无默认值，后端会前置校验。
          这里同步标 required，避免用户以为可留空却拿到建卷失败。
        -->
        <el-form-item label="学段" required>
          <el-select
            v-model="createForm.gradeLevel"
            placeholder="请选择学段"
            style="width: 100%"
            @change="onCreateGradeLevelChange"
          >
            <el-option v-for="opt in GRADE_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" required>
          <el-select
            v-model="createForm.grade"
            placeholder="请先选择学段"
            :disabled="!createForm.gradeLevel"
            clearable
            style="width: 100%"
          >
            <el-option v-for="g in createGradeOptions" :key="g.gradeId" :label="gradeDisplayName(g.gradeName)" :value="g.gradeName" />
          </el-select>
        </el-form-item>
        <el-form-item label="总分">
          <el-input-number v-model="createForm.totalScore" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="难度">
          <el-rate v-model="createForm.difficulty" :max="5" />
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="createForm.duration" :min="1" :max="600" /> 分钟
        </el-form-item>
        <el-form-item label="组卷模板">
          <el-select v-model="createForm.templateId" placeholder="不使用模板" clearable style="width: 100%">
            <el-option v-for="t in templateOptions" :key="t.templateId" :label="t.templateName" :value="t.templateId" />
          </el-select>
        </el-form-item>
        <template v-if="composeMode === 'AI'">
          <el-form-item label="题目数量">
            <el-input-number v-model="aiQuestionCount" :min="1" :max="200" />
          </el-form-item>
          <el-form-item label="每题分值">
            <el-input-number v-model="aiScorePerQuestion" :min="1" :max="100" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button v-if="composeMode === 'MANUAL'" type="primary" :loading="creating" @click="doCreate">
          创建并组卷
        </el-button>
        <el-button v-else type="primary" :loading="generating" @click="doGenerate">
          生成试卷
        </el-button>
      </template>
    </el-dialog>

    <!-- 题库市场：勾选题目后加入该试卷的购物车 -->
    <QuestionMarketDialog v-model="marketVisible" :paper-id="currentPaperId" @picked="onMarketPicked" />

    <!-- 详情：直接渲染纸张预览，与组卷页中栏同一套排版 -->
    <el-dialog v-model="detailVisible" :title="detail?.paperName" width="900">
      <div v-if="detail" class="detail-preview">
        <div class="detail-preview__meta">
          <span>{{ detail.paperSubject }}</span>
          <span>{{ detail.paperGradeLevel }}{{ detail.paperGrade }}</span>
          <span>{{ detail.paperQuestionCount }} 题</span>
          <span>满分 {{ detail.paperTotalScore }} 分</span>
          <span>时长 {{ detail.paperDuration }} 分</span>
        </div>
        <PaperPreview
          :header="detailHeader"
          :questions="detailQuestions"
          :fit-width="DETAIL_PREVIEW_WIDTH"
          empty-text="该试卷没有题目，请确认题库中已有匹配学科与年级的题目后重新组卷"
        />
      </div>
    </el-dialog>

    <!-- 编辑：改卷头属性（组卷页只管题目与纸张，卷头属性在这里维护） -->
    <el-dialog v-model="editVisible" title="编辑试卷" width="560">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="试卷名称" required>
          <el-input v-model="editForm.name" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="学科" required>
          <el-input v-model="editForm.subject" placeholder="请输入学科，如 数学" />
        </el-form-item>
        <el-form-item label="学段" required>
          <el-select v-model="editForm.gradeLevel" placeholder="请选择学段" style="width: 100%"
            @change="onEditGradeLevelChange">
            <el-option v-for="opt in GRADE_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" required>
          <el-select
            v-model="editForm.grade"
            placeholder="请先选择学段"
            :disabled="!editForm.gradeLevel"
            clearable
            style="width: 100%"
          >
            <el-option v-for="g in editGradeOptions" :key="g.gradeId" :label="gradeDisplayName(g.gradeName)" :value="g.gradeName" />
          </el-select>
        </el-form-item>
        <el-form-item label="总分">
          <el-input-number v-model="editForm.totalScore" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="难度">
          <el-rate v-model="editForm.difficulty" :max="5" />
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="editForm.duration" :min="1" :max="600" /> 分钟
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="doEdit">保存</el-button>
      </template>
    </el-dialog>

    <!--
      打印预览：弹层内看到的 A4 版面就是实际打印出去的内容（同一份 DOM，不做两份渲染）。
      屏幕上把 .print-sheet 移到可视区外，打印时再用 @media print 把它移回页面原点。
    -->
    <el-dialog
      v-model="printVisible"
      title="打印预览"
      width="860px"
      top="4vh"
      append-to-body
      class="paper-print-dialog"
      destroy-on-close
      @closed="stopPrintMode"
    >
      <div class="print-hint">
        <span>打印范围：<b>列表里勾选的试卷</b></span>
        <el-tag size="small" effect="plain">共 {{ printRows.length }} 份</el-tag>
        <span class="print-hint__tip">在打印对话框里可选择目标打印机、纸张与份数；要改范围请关掉本弹层重新勾选</span>
      </div>

      <!-- 打印视图本体：仅这一块会进入打印输出 -->
      <div class="print-sheet">
        <header class="print-sheet__head">
          <h2 class="print-sheet__title">试卷清单</h2>
          <div class="print-sheet__meta">
            <span>组卷管理</span>
            <span>生成时间：{{ printTime }}</span>
            <span>共 {{ printRows.length }} 份</span>
          </div>
          <div v-if="printFilterText" class="print-sheet__filter">筛选：{{ printFilterText }}</div>
        </header>

        <table class="print-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th>试卷名</th>
              <th>学科</th>
              <th>学段</th>
              <th>年级</th>
              <th class="col-num">总分</th>
              <th class="col-num">题数</th>
              <th class="col-num">时长</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in printRows" :key="p.paperId">
              <td class="col-id">{{ p.paperId }}</td>
              <td class="col-name">{{ p.paperName }}</td>
              <td>{{ p.paperSubject || '—' }}</td>
              <td>{{ p.paperGradeLevel || '—' }}</td>
              <td>{{ p.paperGrade || '—' }}</td>
              <td class="col-num">{{ p.paperTotalScore ?? '—' }}</td>
              <td class="col-num">{{ p.paperQuestionCount ?? '—' }}</td>
              <td class="col-num">{{ p.paperDuration ?? '—' }}</td>
              <td>{{ paperStatusLabel(p.paperStatus) }}</td>
              <td class="col-time">{{ formatDateTime(p.paperCreateTime) }}</td>
            </tr>
            <tr v-if="!printRows.length">
              <td class="print-table__empty" colspan="10">当前检索结果为空，没有可打印的内容</td>
            </tr>
          </tbody>
        </table>

        <footer class="print-sheet__foot">
          <span>合计 {{ printRows.length }} 份 · 满分总和 {{ printTotalScore }} 分 · 题目总数 {{ printTotalQuestions }} 道</span>
        </footer>
      </div>

      <template #footer>
        <el-button @click="printVisible = false">关闭</el-button>
        <el-button type="primary" :icon="Printer" :disabled="!printRows.length" @click="doPrint">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Printer } from '@element-plus/icons-vue';
import { eduaiApi } from '../api/eduaiApi';
import type { EduGrade, MarketQuestion, Paper, PaperComposePayload, PaperTemplate } from '../api/types';
import { createPageLoader, numParam, pageLoadError, strParam, useSnapshotSearch } from '../api/pageLoader';
import type { ReTableSearchConfig } from '@repo/ui/re-table';
import QuestionMarketDialog from '../components/paper/QuestionMarketDialog.vue';
import PaperPreview from '../components/paper/PaperPreview.vue';
import { usePaperCart, toCartItem, type CartItem } from '../composables/usePaperCart';

const pageNo = ref(1);
const pageSize = ref(20);
const tableRef = ref();
const router = useRouter();

function blankSearch(): Record<string, unknown> {
  return { subject: '', gradeLevel: '', status: null };
}

const { searchModel, applied, queryParams, commit, reset: resetDraft } =
  useSnapshotSearch<Record<string, unknown>>(blankSearch);

/** 三项筛选均为服务端 PaperQueryDTO 的等值条件 */
const searchConfig: ReTableSearchConfig = {
  title: '试卷检索',
  filters: [
    { key: 'subject', label: '学科', placeholder: '如 计算机' },
    {
      key: 'gradeLevel',
      label: '学段',
      type: 'select',
      options: [
        { label: '小学', value: 'PRIMARY' },
        { label: '初中', value: 'JUNIOR' },
        { label: '高中', value: 'SENIOR' },
        { label: '大学', value: 'UNIVERSITY' },
      ],
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '草稿', value: 0 },
        { label: '已发布', value: 1 },
        { label: '已归档', value: 2 },
      ],
    },
  ],
};

const loadPapers = createPageLoader((page, size) =>
  eduaiApi.pagePapers({
    pageNum: page,
    pageSize: size,
    subject: strParam(applied.value.subject),
    gradeLevel: strParam(applied.value.gradeLevel),
    status: numParam(applied.value.status),
  }),
);

/** 查询：提交草稿并回到第一页 */
const commitSearch = () => {
  commit();
  void tableRef.value?.goto(1);
};

/** 重置：清空草稿与快照后回第一页 */
const resetSearch = () => {
  resetDraft();
  void tableRef.value?.goto(1);
};

/** 增删改后留在当前页重拉 */
const reload = () => {
  void tableRef.value?.reload();
};

const generating = ref(false);

const detailVisible = ref(false);
const detail = ref<Paper | null>(null);

const QUESTION_TYPE_LABEL: Record<string, string> = {
  SINGLE_CHOICE: '单选题',
  MULTI_CHOICE: '多选题',
  JUDGE: '判断题',
  FILL: '填空题',
  SHORT_ANSWER: '解答题',
};

const questionTypeLabel = (type?: string) => QUESTION_TYPE_LABEL[type || ''] || type || '-';

/** 详情弹框内纸张预览的可用宽度（px），用于等比缩放纸张 */
const DETAIL_PREVIEW_WIDTH = 620;

/**
 * 详情弹框的卷头取值。
 *
 * <p>列表接口返回的是 paper* 前缀字段，详情接口还带 titleStyle / pageSize 等纸张字段，
 * 这里直接透传给 PaperPreview，缺省值由组件内部兜底（A4 纵向 / classic 标题）。</p>
 */
const detailHeader = computed(() => ({
  name: detail.value?.paperName ?? '',
  subject: detail.value?.paperSubject ?? '',
  gradeLevel: detail.value?.paperGradeLevel ?? '',
  grade: detail.value?.paperGrade ?? '',
  pageSize: detail.value?.paperPageSize ?? 'A4',
  pageOrientation: detail.value?.paperPageOrientation ?? 'PORTRAIT',
  titleStyle: detail.value?.paperTitleStyle ?? 'classic',
  header: detail.value?.paperHeader ?? '',
  footer: detail.value?.paperFooter ?? '',
}));

/** 详情弹框的题目列表：按 order 升序，与组卷页画布顺序一致 */
const detailQuestions = computed(() =>
  [...(detail.value?.questions ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((q) => ({
      questionId: q.id,
      type: q.type,
      stem: q.stem,
      options: q.options,
      score: q.score,
      paperQuestionNo: q.questionNo,
    })),
);

/* ---------- 编辑试卷 ---------- */

const editVisible = ref(false);
const editing = ref(false);
const editTargetId = ref<number | null>(null);

/** 编辑弹框表单；打开时按行数据回填 */
const editForm = reactive({
  name: '',
  subject: '',
  gradeLevel: '',
  grade: '',
  totalScore: 100,
  difficulty: 3,
  duration: 60,
});

/**
 * 年级下拉：按所选学段的中文标签过滤。
 *
 * <p>数据取自 {@code editGrades} 而不是新建弹框的 {@code createGrades}：
 * 后者只在打开「组卷」弹框时才被填充，直接点「编辑」时它是空数组，
 * el-select 找不到对应 option 就会把绑定值（库里存的 "3"）原样显示出来，
 * 看起来像「下拉里是一串数字」。这里独立取一次，两处互不依赖。</p>
 */
/**
 * 年级展示名：把 edu_grade.grade_name 的数字写法转成中文。
 *
 * <p>{@code edu_grade.grade_name} 存的是 "1"/"2"/…，而 {@code edu_paper.paper_grade}
 * 与 {@code edu_question.question_grade} 用的是「三年级」这类中文名，三处口径不一致。
 * 下拉直接把 gradeName 当标签渲染就会显示成一串数字，这里只修展示层，
 * 绑定值仍用 grade_name 原值，避免动到库里已有的两种写法。</p>
 *
 * @param name edu_grade.grade_name 原值
 * @returns 中文展示名；非纯数字时原样返回
 */
const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

function gradeDisplayName(name?: string): string {
  const s = (name ?? '').trim();
  if (!s) {
    return '';
  }
  if (/^\d{1,2}$/.test(s)) {
    const n = Number(s);
    return CN_NUM[n] ? `${CN_NUM[n]}年级` : s;
  }
  // 已经是中文名，但要补全「年级」后缀（有的存「三」没存「三年级」）
  return /年级$/.test(s) ? s : `${s}年级`;
}

/**
 * 把库里存的年级写法归一到当前下拉 option 的 value。
 *
 * <p>库里混着 "3"（AI 组卷写进来的）与 "三年级"（历史数据）两种；
 * 下拉的 value 用的是 edu_grade.grade_name，直接绑定会出现「有值但无对应 option」
 * 从而原样显示的问题。这里双向匹配一次，匹配不上才退回原值。</p>
 *
 * @param stored 库里存的年级值
 * @param options 当前学段下的年级候选
 * @returns 能与某个 option 对应的 value
 */
function matchGradeValue(stored: string | undefined, options: EduGrade[]): string {
  const s = (stored ?? '').trim();
  if (!s || !options.length) {
    return s;
  }
  if (options.some((g) => g.gradeName === s)) {
    return s;
  }
  // "3" -> 展示名 "三年级" -> 找到 gradeName 为 "3" 的项
  const byLabel = options.find((g) => gradeDisplayName(g.gradeName) === s);
  if (byLabel) {
    return byLabel.gradeName;
  }
  // "三年级" -> 去掉后缀 "三" -> 找到展示名匹配（覆盖存了 "三" 的情况）
  const short = s.replace(/年级$/, '');
  const byShort = options.find((g) => g.gradeName === short || gradeDisplayName(g.gradeName) === s);
  return byShort ? byShort.gradeName : s;
}

const editGradeOptions = computed(() => {
  const label = GRADE_LEVEL_OPTIONS.find((o) => o.value === editForm.gradeLevel)?.label;
  if (!label) {
    return [];
  }
  return editGrades.value.filter((g) => g.gradeLevel === label);
});

/** 编辑弹框自用的年级维度数据（与新建弹框各自持有，互不依赖） */
const editGrades = ref<EduGrade[]>([]);

/** 为编辑弹框加载年级候选；已有数据则直接复用，避免重复请求 */
const loadEditGrades = async () => {
  if (editGrades.value.length) {
    return;
  }
  try {
    const drop = await eduaiApi.dimensionDropdown();
    editGrades.value = Array.isArray(drop?.grades) ? drop.grades : [];
  } catch (e) {
    editGrades.value = [];
    ElMessage.error('加载年级候选失败: ' + errorText(e));
  }
};

/** 切换学段后原年级可能不属于新学段，先清空 */
const onEditGradeLevelChange = () => {
  editForm.grade = '';
};

/** 打开编辑弹框：用列表行已有值回填，并确保年级候选已就位 */
const openEdit = async (row: Paper) => {
  editTargetId.value = row.paperId;
  editForm.name = row.paperName ?? '';
  editForm.subject = row.paperSubject ?? '';
  editForm.gradeLevel = gradeLevelToCode(row.paperGradeLevel);
  editForm.grade = matchGradeValue(row.paperGrade, editGrades.value.filter(
    (g) => g.gradeLevel === GRADE_LEVEL_OPTIONS.find((o) => o.value === editForm.gradeLevel)?.label,
  ));
  editForm.totalScore = row.paperTotalScore ?? 100;
  editForm.difficulty = row.paperDifficulty ?? 3;
  editForm.duration = row.paperDuration ?? 60;
  // 先把候选拉到，再开弹框：否则 el-select 首次渲染时没有 option，会闪一下原始值
  await loadEditGrades();
  editVisible.value = true;
};

/** 提交编辑：字段名与后端 PaperComposeUpdateDTO 逐字一致，不能写成 paper* 前缀 */
const doEdit = async () => {
  if (editTargetId.value == null) {
    return;
  }
  if (!editForm.name.trim()) {
    ElMessage.warning('请填写试卷名称');
    return;
  }
  if (!editForm.subject.trim()) {
    ElMessage.warning('请填写学科');
    return;
  }
  if (!editForm.gradeLevel) {
    ElMessage.warning('请选择学段');
    return;
  }
  if (!editForm.grade) {
    ElMessage.warning('请选择年级');
    return;
  }
  editing.value = true;
  try {
    const payload: PaperComposePayload = {
      name: editForm.name.trim(),
      subject: editForm.subject.trim(),
      gradeLevel: editForm.gradeLevel,
      grade: editForm.grade,
      totalScore: editForm.totalScore,
      difficulty: editForm.difficulty,
      duration: editForm.duration,
    };
    await eduaiApi.updatePaper(editTargetId.value, payload);
    ElMessage.success('保存成功');
    editVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    editing.value = false;
  }
};

/** 组卷：跳到组卷页并带上该试卷 ID */
const goCompose = (row: Paper) => {
  void router.push({
    path: '/eduai/paper-compose',
    query: { paperId: String(row.paperId) },
  });
};

/** 打开组卷弹框（手动/AI 共用）；手动沿用 openCreate 的默认值填充 */
const openCompose = () => {
  composeMode.value = 'MANUAL';
  openCreate();
};

const doGenerate = async () => {
  if (!createForm.name || !createForm.subject || !createForm.grade) {
    ElMessage.warning('请填写试卷名称/学科/年级');
    return;
  }
  generating.value = true;
  try {
    const paperId = await eduaiApi.generatePaper({
      name: createForm.name,
      subject: createForm.subject,
      gradeLevel: createForm.gradeLevel,
      grade: createForm.grade,
      questionCount: aiQuestionCount.value,
      scorePerQuestion: aiScorePerQuestion.value,
      duration: createForm.duration,
      knowledgePointIds: [],
      typeConfigs: [],
    });
    ElMessage.success(`生成成功，试卷 ID: ${paperId}`);
    createDialogVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('AI 组卷失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    generating.value = false;
  }
};

/* ==================== 新建试卷 ==================== */

/** 学段码值与中文标签；后端 gradeLevel 落库为中文，筛选年级前必须先码值转 label */
const GRADE_LEVEL_OPTIONS = [
  { value: 'PRIMARY', label: '小学' },
  { value: 'JUNIOR', label: '初中' },
  { value: 'SENIOR', label: '高中' },
  { value: 'UNIVERSITY', label: '大学' },
  { value: 'OTHER', label: '其他' },
];

/**
 * 学段码值（PRIMARY/JUNIOR/…）→ 中文标签，用于打印抬头这类面向人的文案。
 *
 * @param code 码值；也接受中文名，认不出时原样返回
 * @returns 中文标签
 */
const gradeLevelLabel = (code: unknown): string => {
  const s = code == null ? '' : String(code);
  if (!s) return '';
  return GRADE_LEVEL_OPTIONS.find((o) => o.value === s || o.label === s)?.label ?? s;
};

/**
 * 库里存的学段中文名 → 接口/下拉用的码值。
 *
 * <p>列表行的 paperGradeLevel 是后端落库的中文名，回填到以码值绑定的下拉前必须转换；
 * 认不出的值原样返回，避免把历史脏数据清空。</p>
 *
 * @param label 库里的学段值（中文名或已经是码值）
 * @returns 对应码值；无法识别时返回入参本身
 */
const gradeLevelToCode = (label?: string): string => {
  if (!label) {
    return '';
  }
  return GRADE_LEVEL_OPTIONS.find((o) => o.value === label || o.label === label)?.value ?? label;
};

const createDialogVisible = ref(false);
const creating = ref(false);
/** 组卷方式：AI 组卷是「组卷」按钮的一个功能分支，与手动共用卷头配置 */
const composeMode = ref<'MANUAL' | 'AI'>('MANUAL');
const aiQuestionCount = ref(20);
const aiScorePerQuestion = ref(5);
const createGrades = ref<EduGrade[]>([]);
const templateOptions = ref<PaperTemplate[]>([]);
const createForm = reactive({
  name: '',
  subject: '',
  gradeLevel: '',
  grade: '',
  totalScore: 100,
  difficulty: 3,
  duration: 60,
  templateId: undefined as number | undefined,
});

/** 年级下拉：按所选学段的中文标签过滤（后端 gradeLevel 是中文，不是码值） */
const createGradeOptions = computed(() => {
  const label = GRADE_LEVEL_OPTIONS.find((o) => o.value === createForm.gradeLevel)?.label;
  if (!label) {
    return [];
  }
  return createGrades.value.filter((g) => g.gradeLevel === label);
});

/** 切换学段后原年级可能不属于新学段，先清空 */
const onCreateGradeLevelChange = () => {
  createForm.grade = '';
};

/** 打开新建弹框时拉取年级与启用中的模板 */
const loadCreateOptions = async () => {
  try {
    const drop = await eduaiApi.dimensionDropdown();
    createGrades.value = Array.isArray(drop?.grades) ? drop.grades : [];
  } catch {
    createGrades.value = [];
  }
  try {
    const res = await eduaiApi.getPaperTemplatePage({ pageNum: 1, pageSize: 100 });
    const list = (res?.data ?? []) as PaperTemplate[];
    templateOptions.value = list.filter((t) => Number(t.templateStatus ?? 1) === 1);
  } catch {
    templateOptions.value = [];
  }
};

const openCreate = () => {
  Object.assign(createForm, {
    name: '',
    subject: '',
    gradeLevel: '',
    grade: '',
    totalScore: 100,
    difficulty: 3,
    duration: 60,
    templateId: undefined,
  });
  createDialogVisible.value = true;
  void loadCreateOptions();
};

/** 建卷：POST /v2/edu/paper（PaperComposeUpdateDTO 短字段），成功后跳组卷页 */
const doCreate = async () => {
  if (!createForm.name.trim()) {
    ElMessage.warning('请填写试卷名称');
    return;
  }
  if (!createForm.subject.trim()) {
    ElMessage.warning('请填写学科');
    return;
  }
  // 学段/年级为后端必填（edu_paper 对应列 NOT NULL 无默认值）
  if (!createForm.gradeLevel) {
    ElMessage.warning('请选择学段');
    return;
  }
  if (!createForm.grade) {
    ElMessage.warning('请选择年级');
    return;
  }
  creating.value = true;
  try {
    const payload: PaperComposePayload = {
      name: createForm.name.trim(),
      subject: createForm.subject.trim(),
      gradeLevel: createForm.gradeLevel || undefined,
      grade: createForm.grade || undefined,
      totalScore: createForm.totalScore,
      difficulty: createForm.difficulty,
      duration: createForm.duration,
      templateId: createForm.templateId ?? undefined,
    };
    const newId = await eduaiApi.createPaper(payload);
    ElMessage.success('创建成功，正在进入组卷页');
    createDialogVisible.value = false;
    void router.push({ path: '/eduai/paper-compose', query: { paperId: String(newId) } });
  } catch (e) {
    ElMessage.error('创建失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    creating.value = false;
  }
};

/* ==================== 题库市场（加入购物车） ==================== */

const marketVisible = ref(false);
const currentPaperId = ref<number | null>(null);
/** 购物车按试卷维度：currentPaperId 变化即切换目标试卷 */
const { addMany } = usePaperCart(currentPaperId);

const openMarket = (row: Paper) => {
  currentPaperId.value = row.paperId;
  marketVisible.value = true;
};

/**
 * QuestionMarketDialog 的勾选结果：题库市场字段名与购物车条目不同，
 * 这里显式映射后写入购物车。
 */
const onMarketPicked = (list: MarketQuestion[]) => {
  // 统一走共享映射（含分值兜底），避免各处各写一遍、并防止缺分值落成 0 分
  const items: CartItem[] = list.map((q) => toCartItem(q));
  const added = addMany(items);
  ElMessage.success(`已加入购物车 ${added} 题`);
};

const openDetail = async (row: Paper) => {
  try {
    detail.value = await eduaiApi.getPaper(row.paperId);
    detailVisible.value = true;
  } catch (e) {
    ElMessage.error('加载详情失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const paperStatusType = (n?: number) =>
  ({ 1: 'success', 2: 'info', 0: 'warning' } as Record<number, string>)[n ?? 0] || 'info';
const paperStatusLabel = (n?: number) =>
  ({ 1: '已发布', 2: '已归档', 0: '草稿' } as Record<number, string>)[n ?? 0] || '-';

/* ==================== 状态流转（发布 / 下架 / 归档）====================
   业务口径「发布=冻结」：
     草稿   → 可编辑；学生端不可见
     已发布 → 学生端可见；要改动必须先下架
     已归档 → 只读留档；不可修改、不可再发布
   三个动作都改变学生端可见性，因此都做二次确认。 */

/** 试卷状态码；空值按草稿处理 */
const paperStatusCode = (row: Paper): number => Number(row.paperStatus ?? 0);

/** 二次确认：取消返回 false，不抛异常 */
const confirmStatusChange = async (title: string, message: string): Promise<boolean> => {
  try {
    await ElMessageBox.confirm(message, title, {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    return true;
  } catch {
    return false;
  }
};

/** 发布：题分合计必须等于满分（后端闸门），发布后不可再改 */
const onPublishRow = async (row: Paper) => {
  const ok = await confirmStatusChange(
    '发布试卷',
    `发布后学生端即可见，且不能再改动；要修改需先下架。确定发布「${row.paperName}」？`,
  );
  if (!ok) {
    return;
  }
  try {
    await eduaiApi.publishPaper(row.paperId);
    ElMessage.success('发布成功');
    reload();
  } catch (e) {
    ElMessage.error('发布失败: ' + errorText(e));
  }
};

/** 下架：回到草稿，学生端不再可见，可继续编辑 */
const onUnpublishRow = async (row: Paper) => {
  const ok = await confirmStatusChange(
    '下架试卷',
    `下架后学生端不再可见，试卷回到草稿态、可以继续编辑。确定下架「${row.paperName}」？`,
  );
  if (!ok) {
    return;
  }
  try {
    await eduaiApi.unpublishPaper(row.paperId);
    ElMessage.success('已下架，试卷回到草稿态');
    reload();
  } catch (e) {
    ElMessage.error('下架失败: ' + errorText(e));
  }
};

/** 归档：只读留档，且不可再发布 */
const onArchiveRow = async (row: Paper) => {
  const ok = await confirmStatusChange(
    '归档试卷',
    `归档后只读留档：不能再修改，也不能再发布，学生端也不可见。确定归档「${row.paperName}」？`,
  );
  if (!ok) {
    return;
  }
  try {
    await eduaiApi.archivePaper(row.paperId);
    ElMessage.success('已归档');
    reload();
  } catch (e) {
    ElMessage.error('归档失败: ' + errorText(e));
  }
};

/* ==================== 打印 ==================== */

/** 打开打印时挂在 body 上的类名，@media print 据此把整页隐藏、只留打印视图 */
const PRINT_BODY_CLASS = 'printing-paper-list';

const printVisible = ref(false);
const printRows = ref<Paper[]>([]);
const printTime = ref('');

/**
 * 当前勾选的行（ReTable 的 selection-change 给出）。
 *
 * <p>打印只对勾选项生效：不再按检索条件取全量 —— 那会打出一整库的卷，
 * 也没法只打其中几张。没勾选时打印按钮禁用。</p>
 */
const printSelection = ref<Paper[]>([]);

/**
 * 把打印用的勾选集同步为「ReTable 当前勾选的 ∩ 当前页确实加载出来的」。
 *
 * <p>为什么取交集：筛选或翻页后 el-table 的勾选态可能没有同步回调，
 * 勾选集里会留着已不在列表中的旧行，点打印就会把看不见的卷也打出去
 * （实测：筛选到 2 行，预览仍出 5 行）。以 ReTable 自身的
 * {@code getSelectedRows()} 为准、再按当前 data 收敛，就不会出现陈旧勾选。</p>
 */
const syncPrintSelection = () => {
  const ref = tableRef.value;
  const checked = (ref?.getSelectedRows?.() ?? []) as unknown as Paper[];
  if (!checked.length) {
    printSelection.value = [];
    return;
  }
  const visible = (ref?.data ?? []) as unknown as Paper[];
  const visibleIds = new Set(visible.map((r) => r.paperId));
  printSelection.value = checked.filter((r) => visibleIds.has(r.paperId));
};

/** 表格勾选变化 */
const onPrintSelectionChange = () => {
  syncPrintSelection();
};

/** 表格数据加载完成：勾选集需要跟着当前数据收敛 */
const onTableLoad = () => {
  syncPrintSelection();
};

/** 打开打印预览：只渲染当前勾选的试卷 */
const openPrint = () => {
  // 以 ReTable 的权威勾选集重算一次，避免用到过期数据
  syncPrintSelection();
  if (!printSelection.value.length) {
    ElMessage.warning('请先勾选要打印的试卷');
    return;
  }
  printRows.value = [...printSelection.value];
  printTime.value = formatDateTime(new Date().toISOString());
  printVisible.value = true;
  document.body.classList.add(PRINT_BODY_CLASS);
};

/** 关闭弹层后摘掉 body 类，否则残留会让后续任何打印都只剩打印视图 */
const stopPrintMode = () => {
  document.body.classList.remove(PRINT_BODY_CLASS);
};

/** 调起浏览器/系统打印对话框；打印输出由 @media print 规则决定 */
const doPrint = () => {
  window.print();
};

/** 打印抬头里的筛选条件描述；全空时不显示这一行 */
const printFilterText = computed(() => {
  const parts: string[] = [];
  if (applied.value.subject) parts.push(`学科=${applied.value.subject}`);
  if (applied.value.gradeLevel) parts.push(`学段=${gradeLevelLabel(applied.value.gradeLevel)}`);
  if (applied.value.status != null) parts.push(`状态=${paperStatusLabel(Number(applied.value.status))}`);
  return parts.join('　');
});

const printTotalScore = computed(() =>
  printRows.value.reduce((sum, p) => sum + (Number(p.paperTotalScore) || 0), 0),
);
const printTotalQuestions = computed(() =>
  printRows.value.reduce((sum, p) => sum + (Number(p.paperQuestionCount) || 0), 0),
);

/**
 * 从异常里取出「对用户有用」的文案。
 *
 * <p>后端业务错误把原因放在响应体的 msg 里（如「试卷存在重复或缺失的题项编号」），
 * 直接用 axios 的 message 只会得到 Request failed with status code 400。</p>
 *
 * @param e 捕获到的异常
 * @returns 可展示的错误文案
 */
function errorText(e: unknown): string {
  const resp = (e as { response?: { data?: { msg?: string; message?: string } } } | null)?.response;
  const bizMsg = resp?.data?.msg || resp?.data?.message;
  if (typeof bizMsg === 'string' && bizMsg.trim()) {
    return bizMsg.trim();
  }
  return e instanceof Error ? e.message : String(e);
}

/**
 * 归一化时间字符串为「YYYY-MM-DD HH:mm」。
 *
 * @param value 后端返回的时间，可能是 ISO 串或已是「YYYY-MM-DD HH:mm:ss」
 * @returns 便于排版的本地时间串；无法解析时原样返回
 */
function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const raw = String(value);
  const ts = Date.parse(raw.replace(' ', 'T'));
  if (Number.isNaN(ts)) {
    return raw.slice(0, 16);
  }
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

onBeforeUnmount(stopPrintMode);


</script>

<style scoped>
.page-container { height: 100%; display: flex; flex-direction: column; }

/* 操作列里「已归档（只读）」的文字占位：归档后没有任何可点的动作 */
.paper-row__readonly {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* ---------- 打印预览 ---------- */
.print-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.print-hint__tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/*
 * 打印视图（.print-sheet）就是实际打印输出的内容，弹层里看到的即所得。
 * 屏幕上把它移到可视区外，避免撑出滚动条；打印时由下方 @media print 移回页面原点。
 * 宽度按 A4 内容区（210mm - 两侧各 12mm 页边距）设定，页边距交给浏览器默认设置。
 */
.print-sheet {
  position: fixed;
  left: -10000px;
  top: 0;
  width: 186mm;
  padding: 10mm 8mm;
  background: #ffffff;
  color: #1f2329;
  font-size: 12px;
}

.print-sheet__head {
  text-align: center;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 2px solid #1f2329;
}

.print-sheet__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 4px;
}

.print-sheet__meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px 18px;
  font-size: 11px;
  color: #4b5563;
}

.print-sheet__filter {
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.print-table th,
.print-table td {
  border: 1px solid #9ca3af;
  padding: 4px 6px;
  text-align: left;
  word-break: break-all;
}

.print-table th {
  background: #f3f4f6;
  font-weight: 600;
  text-align: center;
}

.print-table .col-id { width: 34px; text-align: center; }
.print-table .col-num { width: 44px; text-align: center; }
.print-table .col-time { width: 92px; }
.print-table .col-name { width: auto; }

.print-table__empty {
  text-align: center;
  color: #9ca3af;
  padding: 18px 0;
}

.print-sheet__foot {
  margin-top: 10px;
  padding-top: 6px;
  border-top: 1px solid #d1d5db;
  text-align: right;
  font-size: 11px;
  color: #4b5563;
}

/*
 * 打印隔离：输出里只保留 .print-sheet。
 *
 * 不用「visibility: hidden 刷一遍 body *」那种写法 —— visibility 会被后代自己声明的
 * visible 覆盖掉（布局组件里就有），实测会漏出侧边栏。这里改成：
 *   1) body 直属子节点里只留弹层（append-to-body 的 .el-overlay），应用外壳整体 display:none
 *   2) 弹层内显式隐藏标题栏/底部按钮/提示条/遮罩，只留打印视图
 * 3) 再用 visibility 兜一层，防止将来新增的包裹层漏出去
 * 开关是 body 上的类名，只在本页打开打印预览期间生效，不影响其它页面的打印样式。
 */
@media print {
  :global(body.printing-paper-list > *:not(.el-overlay)) {
    display: none !important;
  }

  :global(body.printing-paper-list .el-dialog__header),
  :global(body.printing-paper-list .el-dialog__footer),
  :global(body.printing-paper-list .el-overlay__mask),
  :global(body.printing-paper-list .print-hint) {
    display: none !important;
  }

  :global(body.printing-paper-list .el-dialog) {
    overflow: visible !important;
    position: static !important;
    inset: auto !important;
    transform: none !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    max-height: none !important;
    height: auto !important;
    /* 弹层自带内边距会在纸面上留一圈缩进，打印时一并清掉 */
    padding: 0 !important;
  }

  :global(body.printing-paper-list .el-overlay),
  :global(body.printing-paper-list .el-overlay-dialog) {
    overflow: visible !important;
    position: static !important;
    inset: auto !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  :global(body.printing-paper-list .el-dialog__body) {
    padding: 0 !important;
    overflow: visible !important;
    height: auto !important;
  }

  :global(body.printing-paper-list .print-sheet) {
    position: static !important;
    left: auto !important;
    top: auto !important;
    width: 100% !important;
    padding: 0 !important;
  }

  :global(body.printing-paper-list *) {
    visibility: hidden !important;
  }

  :global(body.printing-paper-list .print-sheet),
  :global(body.printing-paper-list .print-sheet *) {
    visibility: visible !important;
  }

  /* 表头在跨页时重复，便于多页清单阅读；单行不被分页切断 */
  .print-table thead {
    display: table-header-group;
  }

  .print-table tr {
    break-inside: avoid;
  }
}

/* 详情：纸张预览 + 顶部元信息行 */
.detail-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 68vh;
  overflow-y: auto;
}

.detail-preview__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
  width: 100%;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>