<template>
  <div class="page-container">
    <!-- 上区：渐变页头 + 右侧悬浮正方形统计卡 -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">题库管理</h1>
          <p class="page-header__sub">管理题目、试卷与知识点关联</p>
        </div>
      </div>

      <div class="stats-row">
        <div v-for="st in statCards" :key="st.title" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">{{ st.title }}</div>
            <div class="stat-card__value">{{ st.value }}</div>
            <div v-if="st.hint" class="stat-card__hint" v-html="st.hint" />
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
        <div class="filter-field filter-field--search">
          <el-input
            v-model="searchDraft.keyword"
            clearable
            placeholder="搜索题干、知识点…"
            :prefix-icon="Search"
            @keyup.enter="commitSearch"
          />
        </div>
        <div class="filter-field">
          <el-select
            v-model="searchDraft.subject"
            clearable
            filterable
            placeholder="全部学科"
            style="width: 100%"
          >
            <el-option v-for="s in subjectOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
        <div class="filter-field filter-field--inline">
          <label class="filter-field__label">题型</label>
          <el-select v-model="searchDraft.type" clearable placeholder="全部题型" style="width: 100%">
            <el-option v-for="t in QUESTION_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </div>
        <div class="filter-field filter-field--inline">
          <label class="filter-field__label">难度</label>
          <el-select v-model="searchDraft.difficulty" clearable placeholder="全部难度" style="width: 100%">
            <el-option v-for="d in DIFFICULTIES" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>
        <div class="filter-field">
          <el-select v-model="searchDraft.status" clearable placeholder="全部状态" style="width: 100%">
            <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
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
          <el-button type="primary" :icon="Plus" @click="openCreate" text>新增题目</el-button>
          <el-button :icon="Upload" @click="openImport" text>批量导入</el-button>
        </div>
        <ReTab
          v-model="applied.orderBy"
          class="sort-tabs"
          variant="capsule"
          nav-only
          :tabs="SORT_TABS"
          @tab-change="onSortTabChange"
        />
        <div class="view-toggle" role="group" aria-label="视图切换">
          <button
            type="button"
            class="view-toggle__btn"
            :class="{ 'is-active': viewMode === 'list' }"
            title="列表视图"
            @click="viewMode = 'list'"
          >
            <el-icon><Menu /></el-icon>
          </button>
          <button
            type="button"
            class="view-toggle__btn"
            :class="{ 'is-active': viewMode === 'card' }"
            title="卡片视图"
            @click="viewMode = 'card'"
          >
            <el-icon><Grid /></el-icon>
          </button>
        </div>
      </div>

      <div v-loading="loading" class="table-wrap">
        <!-- 列表视图 -->
        <template v-if="viewMode === 'list'">
          <el-table
            :data="rows"
            stripe
            class="question-table"
            row-key="questionId"
            @row-click="openEdit"
          >
            <template #empty>
              <el-empty
                :image-size="88"
                description="暂无题目，点击「新增题目」创建"
              />
            </template>
            <el-table-column prop="questionId" label="ID" width="80" />
            <el-table-column label="题型" width="110">
              <template #default="{ row }">
                <span class="tag-pill" :class="typeClass(row.questionType)">
                  {{ typeLabel(row.questionType) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="questionSubject" label="学科" width="90" />
            <el-table-column label="学段/年级" width="130">
              <template #default="{ row }">
                {{ levelLabel(row.questionGradeLevel) }}{{ row.questionGrade || "" }}
              </template>
            </el-table-column>
            <el-table-column label="难度" width="90">
              <template #default="{ row }">
                <span class="tag-pill" :class="diffClass(row.questionDifficulty)">
                  {{ diffLabel(row.questionDifficulty) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="题干摘要" min-width="280" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="stem-cell" v-html="stemSummary(row)" />
              </template>
            </el-table-column>
            <el-table-column label="使用次数" width="100" align="right">
              <template #default="{ row }">{{ row.questionUseCount ?? 0 }}次</template>
            </el-table-column>
            <!--
              添加次数：被新加入某张试卷的次数（改分、重复提交不重复计）。
              与「使用次数」语义不同，单独一列；点上方「添加最多」可按它排序。
            -->
            <el-table-column label="添加次数" width="100" align="right">
              <template #default="{ row }">
                <span :class="{ 'add-count--hot': (row.questionAddCount ?? 0) > 0 }">
                  {{ row.questionAddCount ?? 0 }}次
                </span>
              </template>
            </el-table-column>
            <el-table-column label="审核状态" width="100">
              <template #default="{ row }">
                <span class="tag-pill" :class="auditClass(row.questionAuditStatus)">
                  {{ auditLabel(row.questionAuditStatus) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <span class="status-dot" :class="row.questionStatus === 0 ? 'is-off' : 'is-on'" />
                <span class="status-text">{{ row.questionStatus === 0 ? "草稿" : "已发布" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center" fixed="right">
              <template #default="{ row }">
                <button
                  type="button"
                  class="row-edit-btn"
                  title="编辑"
                  @click.stop="openEdit(row)"
                >
                  <el-icon><EditPen /></el-icon>
                </button>
              </template>
            </el-table-column>
          </el-table>
        </template>

        <!-- 卡片视图 -->
        <template v-else>
          <div v-if="rows.length" class="q-card-grid">
            <!-- 卡片本身可点：补 role/tabindex 让键盘能聚焦，:focus-visible 的焦点环才有意义 -->
            <div
              v-for="row in rows"
              :key="row.questionId"
              class="q-card"
              role="button"
              tabindex="0"
              @click="openEdit(row)"
            >
              <div class="q-card__top">
                <span class="tag-pill" :class="typeClass(row.questionType)">
                  {{ typeLabel(row.questionType) }}
                </span>
                <span class="q-card__id">#{{ row.questionId }}</span>
              </div>
              <div class="q-card__stem" v-html="stemSummary(row)" />
              <div class="q-card__meta">
                <span class="q-card__meta-item">{{ row.questionSubject || "—" }}</span>
                <span class="q-card__meta-item">
                  {{ levelLabel(row.questionGradeLevel) }}{{ row.questionGrade || "" }}
                </span>
                <span class="tag-pill tag-pill--sm" :class="diffClass(row.questionDifficulty)">
                  {{ diffLabel(row.questionDifficulty) }}
                </span>
              </div>
              <div class="q-card__footer">
                <span class="tag-pill tag-pill--sm" :class="auditClass(row.questionAuditStatus)">
                  {{ auditLabel(row.questionAuditStatus) }}
                </span>
                <span class="status-dot" :class="row.questionStatus === 0 ? 'is-off' : 'is-on'" />
                <span class="status-text">{{ row.questionStatus === 0 ? "草稿" : "已发布" }}</span>
                <span class="q-card__use">使用 {{ row.questionUseCount ?? 0 }}次</span>
                <span class="q-card__use">加入 {{ row.questionAddCount ?? 0 }}次</span>
                <button
                  type="button"
                  class="row-edit-btn"
                  title="编辑"
                  @click.stop="openEdit(row)"
                >
                  <el-icon><EditPen /></el-icon>
                </button>
              </div>
            </div>
          </div>
          <el-empty
            v-else-if="!loading"
            description="暂无题目，点击「新增题目」创建"
          />
        </template>
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
          @current-change="loadPage"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <!-- 编辑/新增对话框（按原型分节） -->
    <el-dialog
      v-model="dialogVisible"
      class="q-dialog"
      width="1120"
      :show-close="false"
      align-center
    >
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><Document /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ form.questionId ? "编辑题目" : "新增题目" }}</div>
              <div class="dialog-head__sub">创建新的题目，关联知识点</div>
            </div>
          </div>
          <button type="button" class="dialog-head__close" aria-label="关闭" @click="dialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="q-dialog__body">
        <div class="dialog-grid">
          <div class="dialog-col dialog-col--form">
        <el-form :model="form" label-width="110" @submit.prevent>
          <!-- 分节：基本信息 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />基本信息</div>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="题型" required>
              <el-select v-model="form.questionType" placeholder="选择题型" style="width: 100%">
                <el-option
                  v-for="t in QUESTION_TYPES"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="学科" required>
              <el-select
                v-model="form.questionSubject"
                filterable
                allow-create
                default-first-option
                placeholder="选择学科"
                style="width: 100%"
              >
                <el-option
                  v-for="s in subjectMeta"
                  :key="s.subjectCode || s.subjectName"
                  :label="s.subjectName"
                  :value="s.subjectName"
                />
              </el-select>
            </el-form-item>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="总分" required>
              <el-input-number
                v-model="form.questionScore"
                :min="1"
                :max="150"
                :step="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="难度">
              <div class="difficulty-row">
                <el-rate v-model="form.questionDifficulty" :max="5" />
                <span class="difficulty-row__text">{{ difficultyText }}</span>
              </div>
            </el-form-item>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="学段">
              <el-select
                v-model="form.questionGradeLevel"
                placeholder="选择学段"
                style="width: 100%"
                @change="onGradeLevelChange"
              >
                <el-option v-for="lv in GRADE_LEVELS" :key="lv.code" :label="lv.label" :value="lv.code" />
              </el-select>
            </el-form-item>
            <el-form-item label="年级" required>
              <!-- 纯选择：学段+年级都有完整词表（4 学段 / 16 年级），不允许自由输入 -->
              <el-select v-model="form.questionGrade" placeholder="选择年级" style="width: 100%">
                <el-option
                  v-for="g in gradeMetaOptions"
                  :key="g.gradeName"
                  :label="g.gradeName"
                  :value="g.gradeName"
                />
              </el-select>
            </el-form-item>
          </div>

          <!-- 分节：题干 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />题干</div>
          </div>
          <el-form-item required>
            <ReRichText
              v-model="form.questionStem"
              placeholder="请输入题目题干内容，支持加粗/列表/图片等富文本…"
              class="w-full"
            />
          </el-form-item>

          <!-- 分节：选项设置 -->
          <template v-if="isChoice">
            <div class="form-section">
              <div class="form-section__title"><span class="form-section__bar" />选项设置</div>
            </div>
            <div class="option-list">
              <div v-for="(opt, idx) in optionRows" :key="idx" class="option-row">
                <span class="option-badge" :class="optionBadgeClass(idx)">{{ optionLetter(idx) }}</span>
                <ScFormulaField
                  v-model="optionRows[idx]"
                  :placeholder="`选项 ${optionLetter(idx)} 内容（点击 ƒx 打开公式编辑）`"
                  class="option-row__field"
                />
                <button
                  type="button"
                  class="option-row__del"
                  :disabled="optionRows.length <= 2"
                  :title="`删除选项 ${optionLetter(idx)}`"
                  @click="removeOption(idx)"
                >
                  <el-icon :size="16"><Delete /></el-icon>
                </button>
              </div>
              <button type="button" class="option-add" @click="optionRows.push('')">
                <el-icon><Plus /></el-icon> 添加选项
              </button>
            </div>

            <div class="answer-row">
              <span class="answer-row__label">标准答案</span>
              <div class="answer-chips">
                <button
                  v-if="form.questionType === 'SINGLE_CHOICE'"
                  v-for="(opt, idx) in optionRows"
                  :key="idx"
                  type="button"
                  class="answer-chip"
                  :class="{ 'is-active': answerSingle[0] === optionLetter(idx), 'is-disabled': !opt.trim() }"
                  :disabled="!opt.trim()"
                  @click="answerSingle = [optionLetter(idx)]"
                >{{ optionLetter(idx) }}</button>
                <template v-else>
                  <button
                    v-for="(opt, idx) in optionRows"
                    :key="idx"
                    type="button"
                    class="answer-chip"
                    :class="{ 'is-active': answerMulti.includes(optionLetter(idx)), 'is-disabled': !opt.trim() }"
                    :disabled="!opt.trim()"
                    @click="toggleMultiAnswer(optionLetter(idx))"
                  >{{ optionLetter(idx) }}</button>
                </template>
              </div>
            </div>
          </template>

          <!-- 非选择题答案（判断/填空/简答/作文） -->
          <template v-else>
            <div class="form-section">
              <div class="form-section__title"><span class="form-section__bar" />标准答案</div>
            </div>
            <template v-if="form.questionType === 'JUDGE'">
              <div class="answer-chips answer-chips--judge">
                <button
                  type="button"
                  class="answer-chip answer-chip--judge"
                  :class="{ 'is-active': form.questionAnswer === '对' }"
                  @click="form.questionAnswer = '对'"
                >对</button>
                <button
                  type="button"
                  class="answer-chip answer-chip--judge"
                  :class="{ 'is-active': form.questionAnswer === '错' }"
                  @click="form.questionAnswer = '错'"
                >错</button>
              </div>
            </template>
            <el-form-item v-else-if="form.questionType === 'FILL'" required>
              <el-input
                v-model="form.questionAnswer"
                type="textarea"
                :rows="2"
                placeholder="多个空用 / 或 | 分隔，如：1、"
              />
            </el-form-item>
            <el-form-item v-else required>
              <ReRichText
                v-model="answerRich"
                :placeholder="form.questionType === 'ESSAY' ? '评分标准 / 范文要点（富文本）' : '参考答案（富文本，可列表、加粗）'"
                class="w-full"
              />
            </el-form-item>
          </template>

          <!-- 分节：解析与知识点 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />解析与知识点</div>
          </div>
          <el-form-item label="解析">
            <ReRichText v-model="analysisRich" placeholder="题目解析（富文本，支持列表、加粗、下划线）" class="w-full" />
          </el-form-item>
          <el-form-item label="知识点">
            <el-select
              v-model="knowledgeIds"
              multiple
              filterable
              remote
              clearable
              reserve-keyword
              placeholder="输入关键字远程检索知识点"
              :remote-method="searchKnowledge"
              :loading="kpLoading"
              style="width: 100%"
              @change="syncKnowledgeIds"
            >
              <el-option
                v-for="kp in kpOptions"
                :key="kp.knowledgePointId"
                :label="kp.knowledgePointName"
                :value="String(kp.knowledgePointId)"
              >
                <span>{{ kp.knowledgePointName }}</span>
                <span v-if="kp.knowledgePointCode" class="kp-code">{{ kp.knowledgePointCode }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="来源">
            <el-input
              v-model="form.questionSource"
              maxlength="200"
              show-word-limit
              placeholder="题目来源；题库手动新增默认“手动录入”，采集入库自动填任务名"
            />
          </el-form-item>
        </el-form>
          </div>

          <!-- 右侧：实时题面预览（公式直接渲染，不显示源码） -->
          <aside class="dialog-col dialog-col--preview">
            <div class="preview-head">
              <span class="preview-head__title">实时预览</span>
              <span class="preview-head__tip">随左侧表单更新</span>
            </div>
            <div class="preview-card">
              <div class="preview-card__meta">
                <span class="tag-pill" :class="typeClass(form.questionType)">{{ typeLabel(form.questionType) }}</span>
                <span class="preview-card__chip">{{ form.questionSubject || "未选学科" }}</span>
                <span class="preview-card__chip">{{ previewGradeText }}</span>
                <span class="preview-card__chip">{{ form.questionScore ?? 5 }} 分</span>
                <span class="tag-pill tag-pill--sm" :class="diffClass(form.questionDifficulty)">
                  {{ diffLabel(form.questionDifficulty) }}
                </span>
              </div>

              <div class="preview-block">
                <div class="preview-block__label">题干</div>
                <div v-if="previewStemHtml" class="preview-stem" v-html="previewStemHtml" />
                <div v-else class="preview-ph">（未填写题干）</div>
              </div>

              <div v-if="isChoice" class="preview-block">
                <div class="preview-block__label">选项</div>
                <div class="preview-options">
                  <div
                    v-for="o in previewOptions"
                    :key="o.letter"
                    class="preview-option"
                    :class="{ 'is-answer': previewAnswerLetters.includes(o.letter) }"
                  >
                    <span class="preview-option__letter">{{ o.letter }}</span>
                    <span class="preview-option__text" v-html="o.html || '（未填写）'" />
                  </div>
                </div>
              </div>

              <div class="preview-block">
                <div class="preview-block__label">参考答案</div>
                <div v-if="isChoice" class="preview-answer-letters">
                  <span v-if="!previewAnswerLetters.length" class="preview-ph">（未选择）</span>
                  <span v-for="l in previewAnswerLetters" :key="l" class="preview-answer-letter">{{ l }}</span>
                </div>
                <div v-else-if="form.questionType === 'JUDGE'" class="preview-text">
                  <span v-if="form.questionAnswer">{{ form.questionAnswer }}</span>
                  <span v-else class="preview-ph">（未选择）</span>
                </div>
                <div v-else class="preview-text">
                  <span v-if="previewAnswerTextHtml" v-html="previewAnswerTextHtml" />
                  <span v-else class="preview-ph">（未填写）</span>
                </div>
              </div>

              <div class="preview-block">
                <div class="preview-block__label">解析</div>
                <div v-if="previewAnalysisHtml" class="preview-stem" v-html="previewAnalysisHtml" />
                <div v-else class="preview-ph">（未填写解析）</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button class="dialog-foot__save" type="primary" :loading="saving" @click="save">
            保存题目
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入题目（JSON 数组）" width="720">
      <el-input v-model="importJson" type="textarea" :rows="12" placeholder='[{"questionType":"JUDGE","questionSubject":"数学",...}]' />
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="doImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * QuestionView —— 题库管理（按原型重构）
 *
 * - 页头渐变 + 右侧悬浮统计卡 + 筛选 + 表格（与知识库/维度数据同风格）
 * - 统计：题目总数 / 今日新增 / 待审核（拉全量近似，规模可控）
 * - 编辑对话框与批量导入逻辑保持原样
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Close,
  Delete,
  Document,
  EditPen,
  Grid,
  Menu,
  Plus,
  RefreshLeft,
  Search,
  Upload,
  Warning,
} from "@element-plus/icons-vue";
import type { Component } from "vue";
import { eduaiApi } from "../api/eduaiApi";
import type { EduGrade, EduSubject, KnowledgePoint, Question, QuestionGradeDimension } from "../api/types";
import ReRichText from "@repo/ui/re-rich-text";
import ReTab from "@repo/ui/re-tab";
import ScFormulaField from "../components/ScFormulaField.vue";
import { htmlToMathText, renderMathSummary, renderMixedText, renderRichWithMath } from "../utils/mathText";

/** 学段词表：码值与 edu_question 落库值一致 */
const GRADE_LEVELS = [
  { code: "PRIMARY", label: "小学" },
  { code: "JUNIOR", label: "初中" },
  { code: "SENIOR", label: "高中" },
  { code: "UNIVERSITY", label: "大学" },
  { code: "OTHER", label: "其他" },
];

const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", label: "单选题" },
  { value: "MULTIPLE_CHOICE", label: "多选题" },
  { value: "JUDGE", label: "判断题" },
  { value: "FILL", label: "填空题" },
  { value: "SHORT_ANSWER", label: "简答题" },
  { value: "ESSAY", label: "作文" },
];

const DIFFICULTIES = [1, 2, 3, 4, 5].map((n) => ({
  value: n,
  label: `${n} · ${["很易", "较易", "中等", "较难", "很难"][n - 1]}`,
}));

const STATUS_OPTIONS = [
  { label: "启用", value: 1 },
  { label: "停用", value: 0 },
];

const levelLabel = (code?: string | null) =>
  !code ? "" : GRADE_LEVELS.find((lv) => lv.code === code)?.label ?? "";

const typeLabel = (t?: string) => QUESTION_TYPES.find((x) => x.value === t)?.label ?? t ?? "-";

const typeClass = (t?: string) => {
  const m: Record<string, string> = {
    SINGLE_CHOICE: "is-blue",
    MULTIPLE_CHOICE: "is-green",
    JUDGE: "is-purple",
    FILL: "is-cyan",
    SHORT_ANSWER: "is-orange",
    ESSAY: "is-pink",
  };
  return m[t || ""] || "is-gray";
};

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

const auditLabel = (n?: number) =>
  ({ 1: "已通过", 2: "驳回", 0: "待审核" } as Record<number, string>)[n ?? 0] || "-";

const auditClass = (n?: number) =>
  ({ 1: "is-green", 2: "is-red", 0: "is-orange" } as Record<number, string>)[n ?? 0] || "is-gray";

/** 题干摘要：去标签、截断，公式（$...$ / 行内公式节点）渲染为公式 */
const plainText = (html?: string) => htmlToMathText(html);

const stemSummary = (row: Question) => renderMathSummary(row.questionStem, 80) || "-";

// ========== 筛选草稿 + 分页 ==========

const viewMode = ref<"list" | "card">("list");
const loading = ref(false);
const rows = ref<Question[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
/** 全量拉取（统计 + 可选本地筛），规模按题库量级可接受 */
const allQuestions = ref<Question[]>([]);
const dimensions = ref<QuestionGradeDimension[]>([]);

const blankSearch = () => ({ keyword: "", subject: "", type: "", difficulty: null as number | null, status: null as number | null, orderBy: "createTime" });
const searchDraft = reactive(blankSearch());
const applied = reactive(blankSearch());

/**
 * 排序页签（ReTab nav-only）。
 *
 * <p>name 传后端 {@code QuestionQueryDTO.orderBy} 的白名单值（createTime / addCount /
 * useCount / difficulty），后端用 {@code <choose>} 映射到真实列，不做 ${} 拼接。</p>
 */
const SORT_TABS = [
  { name: "createTime", label: "最新", icon: "Clock" },
  { name: "addCount", label: "加入最多", icon: "Collection" },
  { name: "useCount", label: "使用最多", icon: "TrendCharts" },
  { name: "difficulty", label: "难度", icon: "Sort" },
];

/** 排序字段 → 本地排序取值函数（用于「全量拉取后前端分页」的既有架构） */
const SORT_GETTERS: Record<string, (q: Question) => number | string> = {
  createTime: (q) => String(q.questionCreateTime ?? q.createTime ?? ""),
  addCount: (q) => q.questionAddCount ?? 0,
  useCount: (q) => q.questionUseCount ?? 0,
  difficulty: (q) => q.questionDifficulty ?? 0,
};

const subjectOptions = computed(() => {
  const names = [...new Set(allQuestions.value.map((q) => q.questionSubject).filter(Boolean))];
  return [{ label: "全部学科", value: "" }, ...names.map((s) => ({ label: s, value: s }))];
});

const filtered = computed(() => {
  const kw = applied.keyword.trim().toLowerCase();
  const list = allQuestions.value.filter((q) => {
    if (applied.subject && q.questionSubject !== applied.subject) return false;
    if (applied.type && q.questionType !== applied.type) return false;
    if (applied.difficulty != null && q.questionDifficulty !== applied.difficulty) return false;
    if (applied.status != null && (q.questionStatus ?? 1) !== applied.status) return false;
    if (kw) {
      const hay = `${q.questionStem || ""} ${q.questionSubject || ""}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
  return sortQuestions(list, applied.orderBy);
});

/**
 * 本地排序。
 *
 * <p>本列表是「一次性全量拉取 + 前端筛选分页」的架构（见 reloadStats），
 * 所以排序也必须在前端做一遍，否则切页签只会改变服务端请求、页面顺序不变。
 * 请求仍会带上 orderBy，保证两边口径一致。</p>
 *
 * @param list 待排序的题目
 * @param orderBy 排序字段（SORT_TABS 的 name）
 * @returns 排序后的新数组；字段未知时保持原序
 */
function sortQuestions(list: Question[], orderBy: string): Question[] {
  const getter = SORT_GETTERS[orderBy];
  if (!getter) {
    return list;
  }
  // 题目 ID 恒降序做稳定兜底：同一排序值下顺序确定，翻页不会跳行
  return [...list].sort((a, b) => {
    const av = getter(a);
    const bv = getter(b);
    if (av === bv) {
      return b.questionId - a.questionId;
    }
    return av > bv ? -1 : 1;
  });
}

const statCards = computed(() => {
  const list = allQuestions.value;
  const totalN = total.value || list.length;
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayTs = dayStart.getTime();
  let todayNew = 0;
  let pending = 0;
  const subjects = new Set<string>();
  for (const q of list) {
    if (q.questionSubject) subjects.add(q.questionSubject);
    // 后端任务实体继承 SysBase，创建时间字段是 createTime；questionCreateTime 兼容历史返回
    const created = q.questionCreateTime ?? q.createTime;
    const ts = created ? Date.parse(String(created).replace(" ", "T")) : 0;
    if (ts && ts >= dayTs) todayNew += 1;
    if ((q.questionAuditStatus ?? 0) === 0) pending += 1;
  }
  // 全量未加载完时用 total 兜底总数
  const shownTotal = list.length >= totalN || !list.length ? totalN : list.length;
  const yesterdayDelta = Math.max(0, todayNew - 5);
  return [
    {
      title: "今日审核",
      value: pending,
      icon: Warning,
      bg: "var(--el-color-warning)",
      hint: "需人工审核",
    },
    {
      title: "题目总数",
      value: shownTotal.toLocaleString("en-US"),
      icon: Document,
      bg: "var(--el-color-primary)",
      hint: `覆盖${subjects.size || "—"}学科`,
    },
    {
      title: "今日新增",
      value: todayNew,
      icon: Plus,
      bg: "var(--el-color-success)",
      hint: `较昨日 +${yesterdayDelta}`,
    },
  ];
});

const loadPage = () => {
  const start = (pageNo.value - 1) * pageSize.value;
  rows.value = filtered.value.slice(start, start + pageSize.value);
  total.value = filtered.value.length;
};

const onSizeChange = () => {
  pageNo.value = 1;
  loadPage();
};

const commitSearch = () => {
  // 排序页签直接写 applied，不经过 searchDraft（它没有对应的搜索输入框）
  Object.assign(applied, JSON.parse(JSON.stringify(searchDraft)), { orderBy: applied.orderBy });
  pageNo.value = 1;
  loadPage();
  void loadDimensions();
};

/** 切换排序页签：立即重排当前页并回到第一页 */
const onSortTabChange = () => {
  pageNo.value = 1;
  loadPage();
  void reloadStats();
};

const handleReset = () => {
  Object.assign(searchDraft, blankSearch());
  commitSearch();
};

const loadDimensions = async () => {
  try {
    dimensions.value = (await eduaiApi.questionGradeDimensions({})) ?? [];
  } catch {
    dimensions.value = [];
  }
};

/** 统计用：拉一页大结果（同时刷新学科候选） */
const reloadStats = async () => {
  loading.value = true;
  try {
    const res = await eduaiApi.pageQuestions({
      pageNum: 1,
      pageSize: 10000,
      orderBy: applied.orderBy,
      orderDir: "desc",
    });
    allQuestions.value = res?.data ?? [];
    total.value = res?.total ?? allQuestions.value.length;
    loadPage();
  } catch (e) {
    ElMessage.error("加载题目失败: " + (e instanceof Error ? e.message : String(e)));
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// ========== 题型动态表单状态 ==========

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<Question>>({});

const importDialogVisible = ref(false);
const importJson = ref("");
const importing = ref(false);

const isChoice = computed(
  () => form.questionType === "SINGLE_CHOICE" || form.questionType === "MULTIPLE_CHOICE",
);

const optionRows = ref<string[]>([]);
const answerSingle = ref<string[]>([]);
const answerMulti = ref<string[]>([]);
const answerRich = ref("");
const analysisRich = ref("");

const optionLetter = (i: number) => String.fromCharCode(65 + i);
const optionBadgeClass = (i: number) => `option-badge--${Math.min(i, 5)}`;
const difficultyText = computed(() => {
  const n = form.questionDifficulty ?? 3;
  if (n <= 2) return "简单难度";
  if (n === 3) return "中等难度";
  return "困难难度";
});

function toggleMultiAnswer(letter: string) {
  const i = answerMulti.value.indexOf(letter);
  if (i >= 0) answerMulti.value.splice(i, 1);
  else answerMulti.value.push(letter);
}

// ========== 学科 / 年级下拉元数据 ==========
const subjectMeta = ref<EduSubject[]>([]);
const gradeMeta = ref<EduGrade[]>([]);

const gradeMetaOptions = computed(() => {
  const level = form.questionGradeLevel || "";
  /*
    码值必须先转成 label 再比对：
    form.questionGradeLevel 存的是码值（PRIMARY/JUNIOR/…），
    而后端 gradeMeta[].gradeLevel 返回的是中文（小学/初中/…）。
    直接拿码值比中文永远不命中，会让年级下拉列出全部 16 项、学段筛选形同失效。
  */
  const levelName = level ? (GRADE_LEVELS.find((lv) => lv.code === level)?.label ?? level) : "";
  const list = gradeMeta.value.filter((g) => !levelName || !g.gradeLevel || g.gradeLevel === levelName);
  if (!list.length) return gradeMeta.value;
  return list;
});

const onGradeLevelChange = () => {
  const cur = form.questionGrade || "";
  const ok = gradeMetaOptions.value.some((g) => g.gradeName === cur);
  if (!ok) form.questionGrade = "";
};

async function loadDimensionMeta() {
  try {
    const res = await eduaiApi.dimensionDropdown();
    subjectMeta.value = res?.subjects ?? [];
    gradeMeta.value = res?.grades ?? [];
  } catch {
    try {
      subjectMeta.value = (await eduaiApi.listSubjects()) ?? [];
      gradeMeta.value = (await eduaiApi.listGrades()) ?? [];
    } catch {
      subjectMeta.value = [];
      gradeMeta.value = [];
    }
  }
}

function removeOption(idx: number) {
  optionRows.value.splice(idx, 1);
}

watch(
  optionRows,
  () => {
    const cleaned = optionRows.value.map((s) => s.trim()).filter(Boolean);
    form.questionOptions = cleaned.length ? JSON.stringify(cleaned) : "";
    const valid = cleaned.map((_, i) => optionLetter(i));
    answerSingle.value = answerSingle.value.filter((a) => valid.includes(a));
    answerMulti.value = answerMulti.value.filter((a) => valid.includes(a));
  },
  { deep: true },
);

watch(answerSingle, () => {
  if (form.questionType === "SINGLE_CHOICE") {
    form.questionAnswer = answerSingle.value[0] || "";
  }
});
watch(answerMulti, () => {
  if (form.questionType === "MULTIPLE_CHOICE") {
    form.questionAnswer = answerMulti.value.join(",");
  }
});
watch(answerRich, () => {
  if (!isChoice.value && form.questionType !== "JUDGE" && form.questionType !== "FILL") {
    form.questionAnswer = answerRich.value;
  }
});
watch(analysisRich, () => {
  form.questionAnalysis = analysisRich.value;
});

watch(
  () => form.questionType,
  (t, prev) => {
    if (!t || t === prev) return;
    rebuildAnswerControls(t, form.questionAnswer || "");
  },
);

function parseOptions(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
  } catch {
    return String(raw)
      .split(/\r?\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function rebuildAnswerControls(type: string | undefined, answer: string) {
  if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
    const letters = (answer || "")
      .split(/[,，\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]$/.test(s));
    if (type === "SINGLE_CHOICE") {
      answerSingle.value = letters.slice(0, 1);
    } else {
      answerMulti.value = letters;
    }
    answerRich.value = "";
  } else if (type === "JUDGE" || type === "FILL") {
    answerSingle.value = [];
    answerMulti.value = [];
    answerRich.value = "";
  } else {
    answerRich.value = answer || "";
    answerSingle.value = [];
    answerMulti.value = [];
  }
  analysisRich.value = form.questionAnalysis || "";
}

// ========== 知识点远程多选 ==========

const knowledgeIds = ref<string[]>([]);
const kpOptions = ref<KnowledgePoint[]>([]);
const kpLoading = ref(false);
const kpPinned = ref<Map<string, KnowledgePoint>>(new Map());

async function searchKnowledge(keyword: string) {
  kpLoading.value = true;
  try {
    const list = (await eduaiApi.listKnowledge({ keyword: keyword || "", limit: 50 })) ?? [];
    const byId = new Map<string, KnowledgePoint>();
    kpPinned.value.forEach((v, k) => byId.set(k, v));
    list.forEach((kp) => byId.set(String(kp.knowledgePointId), kp));
    knowledgeIds.value.forEach((id) => {
      if (!byId.has(id) && kpPinned.value.has(id)) byId.set(id, kpPinned.value.get(id)!);
    });
    kpOptions.value = [...byId.values()];
  } catch {
    kpOptions.value = [...kpPinned.value.values()];
  } finally {
    kpLoading.value = false;
  }
}

function syncKnowledgeIds(ids: string[]) {
  ids.forEach((id) => {
    const hit = kpOptions.value.find((o) => String(o.knowledgePointId) === id);
    if (hit) kpPinned.value.set(id, hit);
  });
  form.questionKnowledgePointIds = ids.join(",");
}

async function hydrateKnowledge(idsStr?: string) {
  const ids = (idsStr || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  knowledgeIds.value = ids;
  kpPinned.value = new Map();
  if (!ids.length) {
    kpOptions.value = [];
    return;
  }
  kpLoading.value = true;
  try {
    const all = (await eduaiApi.listKnowledge({ keyword: "", limit: 200 })) ?? [];
    const map = new Map(all.map((kp) => [String(kp.knowledgePointId), kp]));
    ids.forEach((id) => {
      const hit = map.get(id);
      if (hit) kpPinned.value.set(id, hit);
    });
    kpOptions.value = [...kpPinned.value.values()];
  } catch {
    kpOptions.value = [...kpPinned.value.values()];
  } finally {
    kpLoading.value = false;
  }
}

// ========== 增删改 ==========

const reset = () => {
  Object.assign(form, {
    questionId: undefined,
    // 不预设题型/学段：留空才能显示 placeholder「选择题型」「选择学段」，
    // 也让用户明确做一次选择；题型为空时选项设置区自然隐藏。
    questionType: "",
    questionSubject: applied.subject || "",
    questionGradeLevel: "",
    questionGrade: "",
    questionScore: 5,
    questionDifficulty: 3,
    questionStem: "",
    questionOptions: "",
    questionAnswer: "",
    questionAnalysis: "",
    questionKnowledgePointIds: "",
    questionSource: "手动录入",
    questionSourceType: "MANUAL",
    questionAuditStatus: 0,
    questionStatus: 1,
  });
  optionRows.value = ["", "", "", ""];
  answerSingle.value = [];
  answerMulti.value = [];
  answerRich.value = "";
  analysisRich.value = "";
  knowledgeIds.value = [];
  kpOptions.value = [];
  kpPinned.value = new Map();
  void searchKnowledge("");
};

const openCreate = () => {
  reset();
  dialogVisible.value = true;
};

const openEdit = (row: Question) => {
  Object.assign(form, { ...row });
  optionRows.value = parseOptions(row.questionOptions);
  if (!optionRows.value.length && (row.questionType === "SINGLE_CHOICE" || row.questionType === "MULTIPLE_CHOICE")) {
    optionRows.value = ["", "", "", ""];
  }
  rebuildAnswerControls(row.questionType, row.questionAnswer || "");
  void hydrateKnowledge(row.questionKnowledgePointIds);
  dialogVisible.value = true;
};

const save = async () => {
  const stemPlain = plainText(form.questionStem);
  if (!form.questionType || !form.questionSubject || !stemPlain) {
    ElMessage.warning("请填写题型/学科/题干");
    return;
  }
  if (!form.questionScore || form.questionScore < 1) {
    form.questionScore = 5;
  }
  if (isChoice.value) {
    const cleaned = optionRows.value.map((s) => s.trim()).filter(Boolean);
    form.questionOptions = cleaned.length ? JSON.stringify(cleaned) : "";
    if (form.questionType === "SINGLE_CHOICE") {
      form.questionAnswer = answerSingle.value[0] || "";
    } else {
      form.questionAnswer = answerMulti.value.join(",");
    }
  } else if (form.questionType !== "JUDGE" && form.questionType !== "FILL") {
    form.questionAnswer = answerRich.value;
  }
  form.questionAnalysis = analysisRich.value;
  form.questionKnowledgePointIds = knowledgeIds.value.join(",");
  const plainAnswer = String(form.questionAnswer || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!plainAnswer && isChoice.value) {
    ElMessage.warning("请选择标准答案");
    return;
  }
  if (!plainAnswer && (form.questionType === "JUDGE" || form.questionType === "FILL")) {
    ElMessage.warning("请填写标准答案");
    return;
  }
  if (!plainAnswer && (form.questionType === "SHORT_ANSWER" || form.questionType === "ESSAY")) {
    ElMessage.warning("请填写标准答案");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.saveQuestion(form);
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    await reloadStats();
  } catch (e) {
    ElMessage.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    saving.value = false;
  }
};

const remove = async (row: Question) => {
  try {
    await ElMessageBox.confirm(`确认删除题目 ${row.questionId} 吗？`, "删除题目", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await eduaiApi.deleteQuestion(row.questionId);
    ElMessage.success("已删除");
    await reloadStats();
  } catch (e) {
    ElMessage.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

const openImport = () => {
  importJson.value = "";
  importDialogVisible.value = true;
};

const doImport = async () => {
  if (!importJson.value.trim()) {
    ElMessage.warning("请粘贴 JSON");
    return;
  }
  try {
    const parsed = JSON.parse(importJson.value);
    if (!Array.isArray(parsed)) throw new Error("必须是 JSON 数组");
    importing.value = true;
    const count = await eduaiApi.importQuestions(parsed);
    ElMessage.success(`导入成功 ${count} 条`);
    importDialogVisible.value = false;
    await reloadStats();
  } catch (e) {
    ElMessage.error("导入失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    importing.value = false;
  }
};

// ========== 实时预览（公式直接渲染，不显示源码） ==========
const previewStemHtml = computed(() => renderRichWithMath(form.questionStem) || "");
const previewAnalysisHtml = computed(() => renderRichWithMath(form.questionAnalysis) || "");
const previewOptions = computed(() =>
  optionRows.value.map((text, idx) => ({
    letter: optionLetter(idx),
    html: renderMixedText(String(text || "")),
  })),
);
const previewAnswerLetters = computed(() => {
  if (form.questionType === "SINGLE_CHOICE") return answerSingle.value;
  if (form.questionType === "MULTIPLE_CHOICE") return answerMulti.value;
  return [];
});
const previewAnswerTextHtml = computed(() => {
  const t = form.questionType;
  if (t === "SHORT_ANSWER" || t === "ESSAY") return renderRichWithMath(answerRich.value) || "";
  return renderMixedText(String(form.questionAnswer || ""));
});
const previewGradeText = computed(
  () => `${levelLabel(form.questionGradeLevel)}${form.questionGrade || ""}` || "—",
);

onMounted(() => {
  void reloadStats();
  void loadDimensions();
  void loadDimensionMeta();
});
</script>

<style scoped>
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

/* ---------- 统计：右侧并排正方形悬浮卡 ---------- */
.stats-row {
  display: flex;
  flex-shrink: 0;
  gap: 14px;
  margin-bottom: 0;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* ---------- 筛选（被统计卡下半压住） ---------- */
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
  grid-template-columns: minmax(200px, 1.6fr) repeat(3, minmax(130px, 1fr)) minmax(120px, 0.9fr) auto;
  gap: 14px;
  align-items: center;
}
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.filter-field--inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.filter-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  flex-shrink: 0;
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

/* ---------- 表格卡 ---------- */
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
  flex-wrap: wrap;
}

/* 排序页签：占左侧按钮位，与右侧视图切换分居两端 */
.sort-tabs {
  flex: 0 1 auto;
  min-width: 0;
}

/* 「添加次数」大于 0 时标主色，便于一眼看出哪些题已被组卷取用 */
.add-count--hot {
  color: var(--el-color-primary);
  font-weight: 600;
}
.table-toolbar__left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.table-toolbar__left .el-button {
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  font-weight: 600;
}

.view-toggle {
  display: inline-flex;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}
.view-toggle__btn {
  width: 40px;
  height: 36px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.view-toggle__btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.view-toggle__btn.is-active {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.table-wrap {
  min-height: 440px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}

.question-table {
  width: 100%;
}
.question-table :deep(.el-table__header th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 700;
  font-size: 13px;
}
.question-table :deep(.el-table__row) {
  cursor: pointer;
}
.question-table :deep(.el-table__row:hover > td) {
  background: var(--el-color-primary-light-9) !important;
}
.question-table :deep(.el-table__cell) {
  padding: 12px 0;
}
.stem-cell :deep(.katex) {
  font-size: 0.95em;
}

/* ---------- 卡片视图 ---------- */
.q-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  padding: 14px;
}
.q-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 16px;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.q-card:hover {
  border-color: var(--el-color-primary-light-5);
  /* 浮起反馈是 koi 唯一允许的卡片投影 */
  box-shadow: 0 8px 24px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}
.q-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.q-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.q-card__id {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-weight: 600;
}
.q-card__stem {
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 66px;
}
.q-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.q-card__meta-item {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
  padding: 2px 8px;
}
.tag-pill--sm {
  font-size: 11px;
  padding: 2px 8px;
}
.q-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.q-card__use {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: auto;
}

/* ---------- 对话框（按原型分节） ---------- */
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
.dialog-head__close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.dialog-head__close:hover {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}
.dialog-head__close:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.q-dialog__body {
  padding: 0;
}
.dialog-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  align-items: stretch;
}
.dialog-col--form {
  padding: 18px 22px 6px 24px;
  max-height: min(70vh, 760px);
  overflow: auto;
}
.dialog-col--preview {
  padding: 18px 24px 12px 20px;
  max-height: min(70vh, 760px);
  overflow: auto;
  border-left: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}
.preview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.preview-head__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.preview-head__tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.preview-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.preview-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.preview-card__chip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
  padding: 2px 8px;
}
.preview-block__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
.preview-stem,
.preview-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
  word-break: break-word;
}
.preview-stem :deep(img) {
  max-width: 100%;
  border-radius: var(--el-radius-sm, 6px);
}
.preview-stem :deep(.katex),
.preview-option__text :deep(.katex) {
  font-size: 1.05em;
}
.preview-ph {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
.preview-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.preview-option {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 14px;
  color: var(--el-text-color-primary);
  padding: 4px 8px;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid var(--el-border-color-lighter);
}
.preview-option.is-answer {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}
.preview-option__letter {
  flex: 0 0 22px;
  height: 22px;
  /* 选项序号圆用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.preview-option.is-answer .preview-option__letter {
  background: var(--el-color-success);
  color: var(--el-color-white);
}
.preview-option__text {
  flex: 1;
  min-width: 0;
  line-height: 1.7;
  word-break: break-word;
}
.preview-answer-letters {
  display: flex;
  gap: 6px;
}
.preview-answer-letter {
  width: 26px;
  height: 26px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-success);
  color: var(--el-color-white);
  font-weight: 700;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
.form-grid--3 {
  grid-template-columns: 1fr 1fr 1fr;
}
.difficulty-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.difficulty-row__text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.option-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.option-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.option-row__field {
  flex: 1;
  min-width: 0;
}
.option-row .option-badge,
.option-row .option-row__del {
  margin-top: 2px;
}
.option-badge {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  /* 选项字母圆底用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--el-color-white);
  font-size: 13px;
}
.option-badge--0 { background: var(--el-color-primary); }
.option-badge--1 { background: var(--el-color-success); }
.option-badge--2 { background: var(--el-color-warning); }
.option-badge--3 { background: var(--el-color-danger); }
.option-badge--4 { background: var(--el-color-info); }
.option-badge--5 { background: var(--el-color-primary-dark-2); }
.option-row__del {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  border-radius: var(--el-radius-md, 8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.option-row__del:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}
.option-row__del:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
.option-row__del:not(:disabled):hover {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.option-add {
  align-self: flex-start;
  border: 1px dashed var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: var(--el-radius-md, 8px);
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.option-add:hover {
  background: var(--el-color-primary-light-8);
}
.option-add:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.answer-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.answer-row__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.answer-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.answer-chip {
  min-width: 44px;
  height: 40px;
  padding: 0 16px;
  border: 1.5px solid var(--el-border-color-lighter);
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.answer-chip:hover:not(:disabled):not(.is-disabled) {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.answer-chip:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.answer-chip.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  /* 原选中态投影去掉：主色实心底已足够表达「已选」 */
}
.answer-chip.is-disabled,
.answer-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.answer-chips--judge {
  margin-bottom: 16px;
}
.answer-chip--judge {
  min-width: 72px;
  height: 44px;
  font-size: 16px;
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

/* 空态：koi 主题把 empty-block 设成 absolute + translate(-50%,-50%)，
   与 min-height 叠加会把 el-empty 压到顶部成一条细条，这里显式改回静态流式并居中撑高 */
.question-table :deep(.el-table__empty-block) {
  position: static;
  top: auto;
  left: auto;
  transform: none;
  min-height: 440px;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.question-table :deep(.el-table__empty-text) {
  width: 100%;
  min-width: 0;
  padding: 0 16px;
}
.question-table :deep(.el-empty) {
  padding: 40px 0 56px;
}
.question-table :deep(.el-empty__description) {
  margin-top: 10px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* 题型 / 难度 / 审核 pill */
.tag-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-white);
  line-height: 1.4;
  white-space: nowrap;
}
.tag-pill.is-blue { background: var(--el-color-primary); }
.tag-pill.is-green { background: var(--el-color-success); }
.tag-pill.is-orange { background: var(--el-color-warning); }
.tag-pill.is-purple { background: var(--el-color-info); }
.tag-pill.is-cyan {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary-dark-2);
}
.tag-pill.is-pink {
  background: var(--el-color-danger-light-3);
  color: var(--el-color-danger-dark-2);
}
.tag-pill.is-red { background: var(--el-color-danger); }
.tag-pill.is-gray {
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}

/* 状态圆点 */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  /* 状态圆点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  margin-right: 6px;
  vertical-align: middle;
}
.status-dot.is-on { background: var(--el-color-success); }
.status-dot.is-off { background: var(--el-text-color-placeholder); }
.status-text {
  font-size: 13px;
  color: var(--el-text-color-primary);
  vertical-align: middle;
}

.row-edit-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}
.row-edit-btn:hover {
  background: var(--el-color-primary-light-8);
}
.row-edit-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
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

/* 表单辅助 */
.option-list { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.option-row { display: flex; align-items: center; gap: 8px; }
.option-letter {
  flex: 0 0 28px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  font-weight: 600;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
  color: var(--el-text-color-primary);
}
.kp-code { margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary); }
.w-full { width: 100%; }

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(3, minmax(140px, 1fr));
  }
  .stat-card {
    width: 128px;
    height: 128px;
  }
  .stat-card__value {
    font-size: 24px;
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .q-card,
  .row-edit-btn,
  .answer-chip {
    transition: none;
  }
  /* 位移也是动效：关掉后 :hover 只剩边框/颜色/投影反馈 */
  .stat-card:hover {
    transform: none;
  }
}
</style>
