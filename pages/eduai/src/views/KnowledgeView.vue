<template>
  <div class="page-container">
    <!-- 上区：页头 + 右侧悬浮正方形统计卡（一半压上区、一半盖内容区） -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">知识库</h1>
          <p class="page-header__sub">按学科、学段、年级组织的结构化知识点管理</p>
        </div>
      </div>

      <div class="stats-row">
        <div v-for="st in statCards" :key="st.title" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">{{ st.title }}</div>
            <div class="stat-card__value">{{ st.value }}</div>
            <div v-if="st.hint" class="stat-card__hint">{{ st.hint }}</div>
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
            placeholder="搜索知识点名称/编码"
            :prefix-icon="Search"
            @keyup.enter="reload"
          />
        </div>
        <div class="filter-field">
          <label class="filter-field__label">学科</label>
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
        <div class="filter-field">
          <label class="filter-field__label">学段</label>
          <el-select
            v-model="searchDraft.gradeLevel"
            clearable
            placeholder="全部学段"
            style="width: 100%"
            @change="onFilterGradeLevelChange"
          >
            <el-option v-for="lv in gradeLevelOptions" :key="lv.value" :label="lv.label" :value="lv.value" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">年级</label>
          <el-select
            v-model="searchDraft.grade"
            clearable
            filterable
            placeholder="全部年级"
            style="width: 100%"
          >
            <el-option v-for="g in gradeOptions" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Plus" :loading="loading" @click="reload">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          <div class="view-toggle" role="group" aria-label="视图切换">
            <button
              type="button"
              class="view-toggle__btn"
              :class="{ 'is-active': viewMode === 'grid' }"
              title="网格视图"
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
            </button>
            <button
              type="button"
              class="view-toggle__btn"
              :class="{ 'is-active': viewMode === 'list' }"
              title="列表视图"
              @click="viewMode = 'list'"
            >
              <el-icon><Menu /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 卡片网格 / 列表 -->
    <div v-loading="loading" class="card-grid-wrap">
      <div v-if="viewMode === 'grid'" class="card-grid">
        <div
          v-for="card in sortedCards"
          :key="card.knowledgePointId"
          class="kp-card"
          :class="{ 'is-selected': detailCard?.knowledgePointId === card.knowledgePointId }"
          @click="openDetail(card)"
        >
          <div class="kp-card__top">
            <div class="kp-card__title" :title="card.knowledgePointName">{{ card.knowledgePointName }}</div>
            <div class="kp-card__actions" @click.stop>
              <el-button link type="primary" size="small" @click.stop="openEdit(card)">编辑</el-button>
              <el-popconfirm :title="`确认删除 ${card.knowledgePointName}?`" @confirm="removeCard(card)">
                <template #reference>
                  <el-button link type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div class="kp-card__desc">{{ card.knowledgePointDescription || '暂无描述' }}</div>
          <div class="kp-card__tags">
            <span v-if="card.knowledgePointSubject" class="pill subject" :class="subjectClass(card.knowledgePointSubject)">
              {{ card.knowledgePointSubject }}
            </span>
            <span v-if="card.knowledgePointGradeLevel" class="pill level" :class="levelClass(card.knowledgePointGradeLevel)">
              {{ gradeLevelLabel(card.knowledgePointGradeLevel) }}
            </span>
            <span v-if="card.knowledgePointGrade" class="pill grade">{{ card.knowledgePointGrade }}</span>
          </div>
          <div class="kp-card__badges">
            <span
              class="badge"
              :class="card.hasContent ? 'badge--text' : 'badge--empty'"
              :title="card.hasContent ? '已有正文' : '暂无正文'"
            >
              <el-icon><Document /></el-icon>
              {{ card.hasContent ? "正文" : "无正文" }}
            </span>
            <span class="badge badge--file" :title="`${card.fileCount ?? 0} 个附件`">
              <el-icon><FolderOpened /></el-icon>
              {{ card.fileCount ?? 0 }} 附件
            </span>
          </div>
          <div class="kp-card__footer">
            <span class="kp-card__hint">点击进入编辑正文 / 附件引用</span>
            <span class="kp-card__time">
              <el-icon><Clock /></el-icon>
              {{ relativeTime(card) }}
            </span>
          </div>
        </div>

        <div class="kp-card kp-card--add" @click="openCreate">
          <el-icon :size="28"><Plus /></el-icon>
          <span>新增卡片</span>
        </div>
      </div>

      <!-- 列表视图 -->
      <el-table v-else :data="sortedCards" border stripe @row-click="openDetail">
        <el-table-column prop="knowledgePointId" label="ID" width="70" />
        <el-table-column prop="knowledgePointName" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="knowledgePointDescription" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="学科" width="90">
          <template #default="{ row }">
            <span v-if="row.knowledgePointSubject" class="pill subject" :class="subjectClass(row.knowledgePointSubject)">
              {{ row.knowledgePointSubject }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="学段" width="80">
          <template #default="{ row }">
            <span v-if="row.knowledgePointGradeLevel" class="pill level" :class="levelClass(row.knowledgePointGradeLevel)">
              {{ gradeLevelLabel(row.knowledgePointGradeLevel) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="knowledgePointGrade" label="年级" width="70" />
        <el-table-column label="正文" width="70">
          <template #default="{ row }">{{ row.hasContent ? "有" : "无" }}</template>
        </el-table-column>
        <el-table-column label="附件" width="70">
          <template #default="{ row }">{{ row.fileCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="时间" width="130">
          <template #default="{ row }">{{ relativeTime(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="openEdit(row)">编辑</el-button>
            <el-popconfirm :title="`确认删除 ${row.knowledgePointName}?`" @confirm="removeCard(row)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && !sortedCards.length"
        :description="viewMode === 'grid' ? '暂无知识卡片，点击「新增卡片」创建' : '暂无知识卡片'"
      />
    </div>

    <!-- 卡片编辑对话框：左表单 + 右实时预览 -->
    <el-dialog
      v-model="cardDialogVisible"
      width="980"
      class="card-dialog card-dialog--preview"
      align-center
      :show-close="false"
    >
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__icon" aria-hidden="true">
            <el-icon :size="22"><MagicStick /></el-icon>
          </div>
          <div class="dialog-head__text">
            <div class="dialog-head__title">{{ cardForm.knowledgePointId ? '编辑卡片' : '新增卡片' }}</div>
            <div class="dialog-head__sub">填写基础信息后，右侧实时预览卡片效果</div>
          </div>
          <button type="button" class="dialog-head__close" aria-label="关闭" @click="cardDialogVisible = false">
            <el-icon :size="20"><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="dialog-body">
        <div class="dialog-form">
          <el-form :model="cardForm" label-width="72px" label-position="left" class="card-form">
            <div class="form-group">
              <div class="form-group__label"><span class="req">★</span> 基本信息</div>
              <el-form-item label="名称" required>
                <el-input v-model="cardForm.knowledgePointName" placeholder="名称" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input
                  v-model="cardForm.knowledgePointDescription"
                  type="textarea"
                  :rows="3"
                  placeholder="选填，知识点说明"
                />
              </el-form-item>
            </div>

            <div class="form-group">
              <div class="form-group__label"><span class="req">★</span> 分类设置</div>
              <el-form-item label="编码">
                <el-input v-model="cardForm.knowledgePointCode" placeholder="卡片名称，如 一元二次方程" />
              </el-form-item>
              <el-form-item label="学科">
                <el-select
                  v-model="cardForm.knowledgePointSubject"
                  filterable
                  allow-create
                  default-first-option
                  clearable
                  placeholder="选择或输入学科"
                  style="width: 100%"
                >
                  <el-option v-for="s in formSubjectOptions" :key="'f-' + s.value" :label="s.label" :value="s.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="学段">
                <el-select
                  v-model="cardForm.knowledgePointGradeLevel"
                  style="width: 100%"
                  clearable
                  placeholder="选择学段"
                  @change="onFormGradeLevelChange"
                >
                  <el-option
                    v-for="lv in gradeLevelOptions"
                    :key="'f-' + lv.value"
                    :label="lv.label"
                    :value="lv.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="年级">
                <el-select
                  v-model="cardForm.knowledgePointGrade"
                  filterable
                  allow-create
                  default-first-option
                  clearable
                  placeholder="选择或输入年级"
                  style="width: 100%"
                >
                  <el-option
                    v-for="g in formGradeOptions"
                    :key="'f-' + g.value"
                    :label="g.label"
                    :value="g.value"
                  />
                </el-select>
              </el-form-item>
            </div>

            <div class="form-group">
              <div class="form-group__label">其他设置</div>
              <el-form-item label="父节点">
                <el-input-number v-model="cardForm.knowledgePointParentId" :min="0" :controls="true" />
              </el-form-item>
              <el-form-item label="排序">
                <el-input-number v-model="cardForm.knowledgePointSortOrder" :min="0" :controls="true" />
              </el-form-item>
              <el-form-item label="状态">
                <div class="status-toggle">
                  <span class="status-toggle__text" :class="{ 'is-active': cardForm.knowledgePointStatus !== 1 }">停用</span>
                  <el-switch
                    v-model="cardForm.knowledgePointStatus"
                    :active-value="1"
                    :inactive-value="0"
                    class="status-toggle__switch"
                  />
                  <span class="status-toggle__text" :class="{ 'is-active': cardForm.knowledgePointStatus === 1 }">启用</span>
                </div>
              </el-form-item>
            </div>
          </el-form>
        </div>

        <aside class="dialog-preview">
          <div class="dialog-preview__title">卡片预览</div>
          <div class="preview-card">
            <div class="preview-card__head">
              <div class="preview-card__icon">
                <el-icon :size="18"><MagicStick /></el-icon>
              </div>
              <div class="preview-card__titles">
                <div class="preview-card__name">{{ cardForm.knowledgePointName || '未命名卡片' }}</div>
                <div class="preview-card__code">{{ cardForm.knowledgePointCode || 'kp-xxx' }}</div>
              </div>
            </div>
            <div class="preview-card__tags">
              <span
                v-if="cardForm.knowledgePointSubject"
                class="pill subject"
                :class="subjectClass(cardForm.knowledgePointSubject)"
              >{{ cardForm.knowledgePointSubject }}</span>
              <span
                v-if="cardForm.knowledgePointGradeLevel"
                class="pill level"
                :class="levelClass(cardForm.knowledgePointGradeLevel)"
              >{{ gradeLevelLabel(cardForm.knowledgePointGradeLevel) }}</span>
              <span v-if="cardForm.knowledgePointGrade" class="pill grade">{{ cardForm.knowledgePointGrade }}</span>
            </div>
            <div class="preview-card__row">
              <span class="preview-card__row-label">学科</span>
              <span class="preview-card__row-val">{{ cardForm.knowledgePointSubject || '—' }}</span>
            </div>
            <div class="preview-card__desc">
              <span class="preview-card__row-label">描述</span>
              <span class="preview-card__row-val">{{ cardForm.knowledgePointDescription || '选填，知识点说明' }}</span>
            </div>
          </div>
          <div class="preview-status" :class="cardForm.knowledgePointStatus === 1 ? 'is-on' : 'is-off'">
            <div class="preview-status__top">
              <el-icon :size="16"><CircleCheck v-if="cardForm.knowledgePointStatus === 1" /><Close v-else /></el-icon>
              <span>{{ cardForm.knowledgePointName || '未命名卡片' }}</span>
            </div>
            <div class="preview-status__label">{{ cardForm.knowledgePointStatus === 1 ? '已启用' : '已停用' }}</div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button class="dialog-footer__btn" @click="cardDialogVisible = false">取消</el-button>
        <el-button class="dialog-footer__btn dialog-footer__btn--primary" type="primary" :loading="cardSaving" @click="saveCard">保存</el-button>
      </template>
    </el-dialog>

    <!-- 卡片详情抽屉：富文本正文（渲染主体）+ 附件（可被正文引用） -->
    <el-drawer
      v-model="detailVisible"
      size="min(960px, 96vw)"
      :with-header="false"
      destroy-on-close
      class="detail-drawer"
    >
      <div v-if="detailCard" class="detail">
        <div class="detail__header">
          <h2 class="detail__title">{{ detailCard.knowledgePointName }}</h2>
          <button type="button" class="detail__close" aria-label="关闭" @click="detailVisible = false">
            <el-icon :size="22"><Close /></el-icon>
          </button>
        </div>

        <div class="detail__meta">
          <span v-if="detailCard.knowledgePointSubject" class="pill subject" :class="subjectClass(detailCard.knowledgePointSubject)">
            {{ detailCard.knowledgePointSubject }}
          </span>
          <span v-if="detailCard.knowledgePointGradeLevel" class="pill level" :class="levelClass(detailCard.knowledgePointGradeLevel)">
            {{ gradeLevelLabel(detailCard.knowledgePointGradeLevel) }}
          </span>
          <span v-if="detailCard.knowledgePointGrade" class="pill grade">{{ detailCard.knowledgePointGrade }}</span>
          <span class="badge badge--file">
            <el-icon><FolderOpened /></el-icon>
            {{ files.length }} 附件
          </span>
        </div>
        <div v-if="detailCard.knowledgePointDescription" class="detail__desc">{{ detailCard.knowledgePointDescription }}</div>

        <div class="detail__body">
          <section class="detail__section">
            <div class="section-head">
              <span class="section-head__title">正文</span>
              <el-button type="primary" :loading="contentSaving" :icon="CircleCheck" @click="saveContent">保存正文</el-button>
            </div>
            <ReRichText
              ref="richRef"
              v-model="detailContent"
              placeholder="编写知识点正文，可在下方附件区上传文件后插入到正文…"
              class="body-editor"
            />
          </section>

          <section class="detail__section">
            <div class="section-head">
              <span class="section-head__title">附件（{{ files.length }}）</span>
              <div class="section-head__ops">
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,.pdf,.docx,.doc"
                  class="hidden-file"
                  @change="onUploadFile"
                />
                <el-button type="primary" :loading="uploading" :icon="Upload" @click="fileInputRef?.click()">上传附件</el-button>
              </div>
            </div>
            <div class="section-tip">支持 png/jpg/gif/webp/bmp、pdf、docx，单文件 ≤ 20MB；图片可插入正文，其它类型以链接引用</div>
            <div v-if="files.length" class="file-list">
              <div v-for="item in files" :key="item.knowledgeFileId" class="file-item">
                <span class="file-item__type">{{ (item.knowledgeFileType || '').toUpperCase() || 'FILE' }}</span>
                <div class="file-item__main">
                  <div class="file-item__name" :title="item.knowledgeFileName">{{ item.knowledgeFileName }}</div>
                  <div class="file-item__sub">
                    <span v-if="item.knowledgeFileSize">{{ formatSize(item.knowledgeFileSize) }}</span>
                    <span class="dot">·</span>
                    <span>{{ item.createTime }}</span>
                  </div>
                </div>
                <div class="file-item__ops">
                  <el-button link type="primary" @click="insertIntoBody(item)">插入正文</el-button>
                  <el-button link type="primary" @click="openFilePreview(item)">预览</el-button>
                  <el-popconfirm :title="`确认删除「${item.knowledgeFileName}」?`" @confirm="removeFile(item)">
                    <template #reference>
                      <el-button link type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </div>
            <div
              class="upload-drop"
              role="button"
              tabindex="0"
              @click="fileInputRef?.click()"
              @keydown.enter="fileInputRef?.click()"
            >
              <el-icon :size="28"><UploadFilled /></el-icon>
              <span>点击或拖拽文件到此处上传</span>
            </div>
          </section>
        </div>
      </div>
    </el-drawer>

    <!-- 附件预览 -->
    <KnowledgeFilePreview
      v-model="previewVisible"
      :path="previewFile?.knowledgeFilePath"
      :file-name="previewFile?.knowledgeFileName"
      :file-type="previewFile?.knowledgeFileType"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * KnowledgeView —— 知识库卡片式（富文本正文 + 附件引用）
 *
 * - 页头 / 筛选 / 统计 / 卡片网格（图示布局）
 * - 详情抽屉：富文本正文为渲染主体；附件可上传并插入正文（图片内联、其它为链接）
 * - 元数据与正文走 knowledge-point/save；附件走 upload/file 子端点
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  ChatDotRound,
  CircleCheck,
  Clock,
  Close,
  Document,
  FolderOpened,
  Grid,
  MagicStick,
  Menu,
  Notebook,
  Plus,
  Reading,
  RefreshLeft,
  Search,
  Upload,
  UploadFilled,
} from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { Component } from "vue";
import type { EduGrade, EduSubject, KnowledgeCard, KnowledgeFileItem, KnowledgePoint } from "../api/types";
import ReRichText from "@repo/ui/re-rich-text";
import KnowledgeFilePreview from "../components/KnowledgeFilePreview.vue";

const GRADE_LEVELS = [
  { label: "小学", value: "PRIMARY" },
  { label: "初中", value: "JUNIOR" },
  { label: "高中", value: "SENIOR" },
  { label: "大学", value: "UNIVERSITY" },
] as const;

/** 已提交的过滤条件（openCreate 预填用） */
const filter = reactive({ keyword: "", subject: "", gradeLevel: "", grade: "" });
/** 筛选草稿（点「搜索」时提交到 filter） */
const searchDraft = reactive({ keyword: "", subject: "", gradeLevel: "", grade: "" });

const cards = ref<KnowledgeCard[]>([]);
const allCards = ref<KnowledgeCard[]>([]);
const loading = ref(false);

const viewMode = ref<"grid" | "list">("grid");
const sortMode = ref<"updated" | "created" | "name">("updated");

const subjectMeta = ref<EduSubject[]>([]);
const gradeMeta = ref<EduGrade[]>([]);

const cardDialogVisible = ref(false);
const cardSaving = ref(false);
const cardForm = reactive<Partial<KnowledgePoint>>({});

const detailVisible = ref(false);
const detailCard = ref<KnowledgeCard | null>(null);
const detailContent = ref("");
const contentSaving = ref(false);
const richRef = ref<InstanceType<typeof ReRichText> | null>(null);
const files = ref<KnowledgeFileItem[]>([]);

const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const previewVisible = ref(false);
const previewFile = ref<KnowledgeFileItem | null>(null);

const gradeLevelLabel = (v?: string) =>
  gradeLevelOptions.value.find((lv) => lv.value === v)?.label || v || "";

/** 学段下拉：优先维度数据 dropdown，回退内置枚举 */
const gradeLevelMeta = ref<Array<{ label: string; value: string }>>([]);
const gradeLevelOptions = computed(() =>
  gradeLevelMeta.value.length ? gradeLevelMeta.value : GRADE_LEVELS.map((lv) => ({ ...lv })),
);

/** 学段已选时学科随维度收敛（listSubjects 支持 gradeLevel） */
const subjectOptions = computed(() => {
  const level = String(searchDraft.gradeLevel || "");
  const list = subjectMeta.value
    .filter((s) => {
      if (!level) return true;
      const levels = (s.subjectGradeLevels || "").split(",").map((x) => x.trim()).filter(Boolean);
      return !levels.length || levels.includes(level);
    })
    .map((s) => ({ label: s.subjectName, value: s.subjectName }));
  return [{ label: "全部学科", value: "" }, ...list];
});

/** 年级下拉：维度 grades，按所选学段过滤 */
const gradeOptions = computed(() => {
  const level = String(searchDraft.gradeLevel || "");
  const list = gradeMeta.value
    .filter((g) => !level || g.gradeLevel === level)
    .map((g) => ({ label: g.gradeName, value: g.gradeName }));
  return [{ label: "全部年级", value: "" }, ...list];
});

/** 切换学段时，清掉不匹配的年级草稿 */
const onFilterGradeLevelChange = () => {
  const level = String(searchDraft.gradeLevel || "");
  const g = String(searchDraft.grade || "");
  if (g && level) {
    const ok = gradeMeta.value.some((x) => x.gradeLevel === level && x.gradeName === g);
    if (!ok) searchDraft.grade = "";
  }
};

/** 编辑对话框里的年级候选（按表单学段过滤，可手输） */
const formGradeOptions = computed(() => {
  const level = String(cardForm.knowledgePointGradeLevel || "");
  const list = gradeMeta.value
    .filter((g) => !level || g.gradeLevel === level)
    .map((g) => ({ label: g.gradeName, value: g.gradeName }));
  return list;
});

/** 编辑对话框里的学科候选（按表单学段过滤，无「全部」占位，可手输） */
const formSubjectOptions = computed(() => {
  const level = String(cardForm.knowledgePointGradeLevel || "");
  return subjectMeta.value
    .filter((s) => {
      if (!level) return true;
      const levels = (s.subjectGradeLevels || "").split(",").map((x) => x.trim()).filter(Boolean);
      return !levels.length || levels.includes(level);
    })
    .map((s) => ({ label: s.subjectName, value: s.subjectName }));
});

/** 表单切换学段时清掉不匹配的年级/学科草稿 */
const onFormGradeLevelChange = () => {
  const level = String(cardForm.knowledgePointGradeLevel || "");
  const g = String(cardForm.knowledgePointGrade || "");
  if (g && level && !gradeMeta.value.some((x) => x.gradeLevel === level && x.gradeName === g)) {
    cardForm.knowledgePointGrade = "";
  }
  const sub = String(cardForm.knowledgePointSubject || "");
  if (sub && level) {
    const s = subjectMeta.value.find((x) => x.subjectName === sub);
    if (s) {
      const levels = (s.subjectGradeLevels || "").split(",").map((x) => x.trim()).filter(Boolean);
      if (levels.length && !levels.includes(level)) cardForm.knowledgePointSubject = "";
    }
  }
};

const sortedCards = computed(() => {
  const list = [...cards.value];
  if (sortMode.value === "name") {
    list.sort((a, b) => (a.knowledgePointName || "").localeCompare(b.knowledgePointName || "", "zh-CN"));
    return list;
  }
  const t = (c: KnowledgeCard) => (c.createTime ? Date.parse(c.createTime.replace(" ", "T")) || 0 : 0);
  if (sortMode.value === "created") return list.sort((a, b) => t(a) - t(b));
  return list.sort((a, b) => t(b) - t(a));
});

/** 相对时间：刚刚 / X分钟前 / X小时前 / 昨天 / N天前 / N周前 */
const relativeTime = (card: KnowledgeCard) => {
  const raw = card.createTime;
  if (!raw) return "刚刚";
  const ts = Date.parse(String(raw).replace(" ", "T"));
  if (Number.isNaN(ts)) return "刚刚";
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;
  const day = Math.floor(hour / 24);
  if (day === 1) return "昨天";
  if (day < 7) return `${day}天前`;
  if (day < 30) return `${Math.floor(day / 7)}周前`;
  return raw.slice(0, 10);
};

/** 统计：总数 / 学科 Top2 / 本周新增（基于全量 allCards） */
const statCards = computed(() => {
  const total = allCards.value.length;
  const bySubject = new Map<string, number>();
  let weekNew = 0;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  for (const c of allCards.value) {
    const s = (c.knowledgePointSubject || "").trim();
    if (s) bySubject.set(s, (bySubject.get(s) || 0) + 1);
    const ts = c.createTime ? Date.parse(String(c.createTime).replace(" ", "T")) : 0;
    if (ts && ts >= weekAgo) weekNew += 1;
  }
  const top = [...bySubject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  const iconFor = (name: string): Component => {
    if (name.includes("数")) return Grid;
    if (name.includes("物")) return MagicStick;
    if (name.includes("语")) return Document;
    if (name.includes("英")) return ChatDotRound;
    if (name.includes("化") || name.includes("生")) return MagicStick;
    if (name.includes("历") || name.includes("地") || name.includes("政")) return Reading;
    return Notebook;
  };
  const stats = [
    { title: "知识点总数", value: total, icon: Document, bg: "var(--el-color-primary)", hint: "全部学科汇总" },
    top[0]
      ? { title: top[0][0], value: top[0][1], icon: iconFor(top[0][0]), bg: "var(--el-color-primary)", hint: "学科 Top1" }
      : { title: "数学", value: 0, icon: Grid, bg: "var(--el-color-primary)", hint: "学科 Top1" },
    top[1]
      ? { title: top[1][0], value: top[1][1], icon: iconFor(top[1][0]), bg: "var(--el-color-success)", hint: "学科 Top2" }
      : { title: "物理", value: 0, icon: MagicStick, bg: "var(--el-color-success)", hint: "学科 Top2" },
    { title: "新增本周", value: weekNew, icon: Plus, bg: "var(--el-color-warning)", hint: "近 7 天创建" },
  ];
  return stats;
});

const formatSize = (n?: number) => {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

/** 学科 pill 配色（图示：数/语/物偏蓝，化/生绿，史橙，英/政紫，地青） */
const subjectClass = (subject: string) => {
  const s = subject.trim();
  if (["数学", "语文", "物理"].includes(s)) return "is-blue";
  if (["化学", "生物"].includes(s)) return "is-green";
  if (["历史"].includes(s)) return "is-orange";
  if (["英语", "政治", "道德与法治"].includes(s)) return "is-purple";
  if (["地理"].includes(s)) return "is-cyan";
  if (["体育", "音乐", "美术"].includes(s)) return "is-pink";
  return "is-blue";
};

/** 学段 pill：小学青、初中绿、高中紫、大学蓝 */
const levelClass = (lv?: string) => {
  const m: Record<string, string> = {
    PRIMARY: "is-cyan",
    JUNIOR: "is-green",
    SENIOR: "is-purple",
    UNIVERSITY: "is-blue",
  };
  return m[lv || ""] || "is-gray";
};

const loadDims = async () => {
  try {
    const drop = await eduaiApi.dimensionDropdown();
    subjectMeta.value = Array.isArray(drop?.subjects) ? drop.subjects : [];
    gradeMeta.value = Array.isArray(drop?.grades) ? drop.grades : [];
    gradeLevelMeta.value = Array.isArray(drop?.gradeLevels)
      ? drop.gradeLevels.map((lv) => ({ label: lv.label, value: lv.value }))
      : [];
  } catch {
    try {
      const [subs, grades] = await Promise.all([eduaiApi.listSubjects(), eduaiApi.listGrades()]);
      subjectMeta.value = Array.isArray(subs) ? subs : [];
      gradeMeta.value = Array.isArray(grades) ? grades : [];
    } catch {
      /* 维度失败不阻断主列表 */
    }
  }
};

/** 拉取全量卡片（统计用），再按当前 filter 过滤展示 */
const reload = async () => {
  filter.keyword = searchDraft.keyword;
  filter.subject = searchDraft.subject;
  filter.gradeLevel = searchDraft.gradeLevel;
  filter.grade = searchDraft.grade;
  loading.value = true;
  try {
    const res = await eduaiApi.listKnowledgeCards({});
    allCards.value = Array.isArray(res) ? res : [];
    const kw = filter.keyword.trim().toLowerCase();
    cards.value = allCards.value.filter((c) => {
      if (filter.subject && (c.knowledgePointSubject || "") !== filter.subject) return false;
      if (filter.gradeLevel && (c.knowledgePointGradeLevel || "") !== filter.gradeLevel) return false;
      if (filter.grade && (c.knowledgePointGrade || "") !== filter.grade) return false;
      if (kw) {
        const hay = `${c.knowledgePointName || ""} ${c.knowledgePointCode || ""}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  } catch (e) {
    ElMessage.error("加载知识卡片失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  searchDraft.keyword = "";
  searchDraft.subject = "";
  searchDraft.gradeLevel = "";
  searchDraft.grade = "";
  void reload();
};

// ---------- 卡片元数据增删改 ----------
const openCreate = () => {
  Object.assign(cardForm, {
    knowledgePointId: undefined,
    knowledgePointName: "",
    knowledgePointCode: "",
    knowledgePointParentId: 0,
    knowledgePointSubject: filter.subject || "",
    knowledgePointGradeLevel: filter.gradeLevel || "",
    knowledgePointGrade: filter.grade || "",
    knowledgePointDescription: "",
    knowledgePointSortOrder: 0,
    knowledgePointStatus: 1,
  });
  cardDialogVisible.value = true;
};

const openEdit = (row: KnowledgeCard) => {
  Object.assign(cardForm, { ...row });
  cardDialogVisible.value = true;
};

const saveCard = async () => {
  if (!cardForm.knowledgePointName) {
    ElMessage.warning("请填写卡片名称");
    return;
  }
  cardSaving.value = true;
  try {
    await eduaiApi.saveKnowledgePoint(cardForm);
    ElMessage.success("已保存");
    cardDialogVisible.value = false;
    await reload();
    if (detailCard.value && detailCard.value.knowledgePointId === cardForm.knowledgePointId) {
      detailCard.value = { ...detailCard.value, ...cardForm } as KnowledgeCard;
    }
  } catch (e) {
    ElMessage.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    cardSaving.value = false;
  }
};

const removeCard = async (row: KnowledgeCard) => {
  try {
    await eduaiApi.deleteKnowledgePoint(row.knowledgePointId);
    ElMessage.success("已删除");
    if (detailCard.value?.knowledgePointId === row.knowledgePointId) {
      detailVisible.value = false;
    }
    await reload();
  } catch (e) {
    ElMessage.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

// ---------- 详情：富文本正文 + 附件 ----------
const openDetail = async (card: KnowledgeCard) => {
  detailCard.value = card;
  detailContent.value = "";
  detailVisible.value = true;
  await loadDetailContent(card.knowledgePointId);
};

const loadDetailContent = async (id: number) => {
  try {
    const [detail, f] = await Promise.all([
      eduaiApi.getKnowledgePoint(id),
      eduaiApi.listKnowledgeFiles(id),
    ]);
    detailContent.value = detail?.knowledgePointContent || "";
    files.value = Array.isArray(f) ? f : [];
    if (detailCard.value) {
      detailCard.value = {
        ...detailCard.value,
        hasContent: Boolean(detailContent.value && detailContent.value.replace(/<[^>]*>/g, "").trim()),
        fileCount: files.value.length,
      };
    }
    const apply = (list: KnowledgeCard[]) => {
      const idx = list.findIndex((c) => c.knowledgePointId === id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          hasContent: detailCard.value?.hasContent ?? false,
          fileCount: files.value.length,
        };
      }
    };
    apply(cards.value);
    apply(allCards.value);
  } catch (e) {
    ElMessage.error("加载卡片内容失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

const saveContent = async () => {
  if (!detailCard.value) return;
  contentSaving.value = true;
  try {
    await eduaiApi.saveKnowledgePoint({
      knowledgePointId: detailCard.value.knowledgePointId,
      knowledgePointName: detailCard.value.knowledgePointName,
      knowledgePointCode: detailCard.value.knowledgePointCode,
      knowledgePointParentId: detailCard.value.knowledgePointParentId,
      knowledgePointSubject: detailCard.value.knowledgePointSubject,
      knowledgePointGradeLevel: detailCard.value.knowledgePointGradeLevel,
      knowledgePointGrade: detailCard.value.knowledgePointGrade,
      knowledgePointDescription: detailCard.value.knowledgePointDescription,
      knowledgePointSortOrder: detailCard.value.knowledgePointSortOrder,
      knowledgePointStatus: detailCard.value.knowledgePointStatus,
      knowledgePointContentType: "TEXT",
      knowledgePointContent: detailContent.value,
    });
    ElMessage.success("正文已保存");
    const has = Boolean(detailContent.value && detailContent.value.replace(/<[^>]*>/g, "").trim());
    detailCard.value = { ...detailCard.value, hasContent: has };
    const id = detailCard.value.knowledgePointId;
    for (const list of [cards.value, allCards.value]) {
      const idx = list.findIndex((c) => c.knowledgePointId === id);
      if (idx >= 0) list[idx] = { ...list[idx], hasContent: has };
    }
  } catch (e) {
    ElMessage.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    contentSaving.value = false;
  }
};

/** 把附件插入正文光标处：图片内联，其它类型为链接 */
const insertIntoBody = (item: KnowledgeFileItem) => {
  const url = eduaiApi.knowledgeFileUrl(item.knowledgeFilePath);
  const type = (item.knowledgeFileType || "").toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(type);
  const name = item.knowledgeFileName || "附件";
  const html = isImage
    ? `<img src="${url}" alt="${name}" />`
    : `<a href="${url}" target="_blank" rel="noopener">${name}</a>`;
  richRef.value?.insertHtml(html);
  ElMessage.success(isImage ? "图片已插入正文" : "链接已插入正文");
};

// 文件
const onUploadFile = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !detailCard.value) return;
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.warning("文件不能超过 20MB");
    return;
  }
  uploading.value = true;
  try {
    const r = await eduaiApi.uploadKnowledgeFile(file);
    await eduaiApi.bindKnowledgeFile({
      knowledgePointId: detailCard.value.knowledgePointId,
      knowledgeFileName: r.fileName,
      knowledgeFilePath: r.filePath,
      knowledgeFileType: r.fileType,
      knowledgeFileSize: r.fileSize,
    });
    ElMessage.success("附件已上传，可在列表中「插入正文」");
    await loadDetailContent(detailCard.value.knowledgePointId);
  } catch (err) {
    ElMessage.error("上传失败: " + (err instanceof Error ? err.message : String(err)));
  } finally {
    uploading.value = false;
  }
};

const removeFile = async (item: KnowledgeFileItem) => {
  try {
    await eduaiApi.deleteKnowledgeFile(item.knowledgeFileId);
    ElMessage.success("已删除");
    if (detailCard.value) await loadDetailContent(detailCard.value.knowledgePointId);
  } catch (e) {
    ElMessage.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

const openFilePreview = (item: KnowledgeFileItem) => {
  previewFile.value = item;
  previewVisible.value = true;
};

onMounted(() => {
  void loadDims();
  void reload();
});
</script>

<style scoped>
.page-container {
  padding: 16px;
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
.view-toggle {
  display: inline-flex;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
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
}
.view-toggle__btn.is-active {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

/* ---------- 筛选（被统计卡下半压住） ---------- */
.filter-card {
  border-radius: 14px;
  margin-bottom: 14px;
  border: 0;
  position: relative;
  z-index: 1;
}
.filter-card :deep(.el-card__body) {
  /* 上半被统计卡盖住约 74px，顶部多留白避免筛选栏被压 */
  padding: 92px 20px 18px;
}
.filter-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1.4fr) repeat(3, minmax(140px, 1fr)) auto;
  gap: 16px;
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
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  box-shadow:
    0 10px 28px rgb(15 23 42 / 8%),
    0 2px 6px rgb(15 23 42 / 4%);
  border: 1px solid rgb(255 255 255 / 80%);
  transition: transform 0.15s, box-shadow 0.15s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 36px rgb(15 23 42 / 12%),
    0 4px 10px rgb(15 23 42 / 6%);
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
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  flex-shrink: 0;
  align-self: flex-end;
}

/* ---------- 卡片网格 ---------- */
.card-grid-wrap {
  min-height: 200px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.kp-card {
  background: var(--el-bg-color);
  border: 1.5px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 16px 18px 12px;
  cursor: pointer;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
}
.kp-card:hover,
.kp-card.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.12);
  transform: translateY(-2px);
}
.kp-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.kp-card__title {
  font-weight: 700;
  font-size: 16px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.kp-card__actions {
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
.kp-card:hover .kp-card__actions,
.kp-card.is-selected .kp-card__actions {
  opacity: 1;
  pointer-events: auto;
}
.kp-card__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 20px;
}
.kp-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  color: var(--el-color-white);
  line-height: 1.4;
}
.pill.is-blue { background: var(--el-color-primary); }
.pill.is-green { background: var(--el-color-success); }
.pill.is-orange { background: var(--el-color-warning); }
.pill.is-purple { background: var(--el-color-info); }
.pill.is-cyan {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary-dark-2);
}
.pill.is-pink {
  background: var(--el-color-danger-light-3);
  color: var(--el-color-danger-dark-2);
}
.pill.is-gray {
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}
.pill.grade {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.kp-card__badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}
.badge--text {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}
.badge--empty {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
}
.badge--file {
  background: var(--el-color-warning-light-8);
  color: var(--el-color-warning);
}
.kp-card__footer {
  margin-top: auto;
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
}
.kp-card__hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  opacity: 0;
  transition: opacity 0.15s ease;
}
.kp-card:hover .kp-card__hint,
.kp-card.is-selected .kp-card__hint {
  opacity: 1;
}
.kp-card__time {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.kp-card--add {
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  border: 1.5px dashed var(--el-text-color-disabled);
  background: transparent;
  gap: 6px;
  font-size: 14px;
}
.kp-card--add:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-bg-color);
}

/* ---------- 详情抽屉 ---------- */
.detail {
  min-height: 100%;
  padding: 20px 24px 32px;
  background: var(--el-bg-color-page);
}
.detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.detail__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}
.detail__close {
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  line-height: 1;
  flex-shrink: 0;
}
.detail__close:hover {
  background: var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
}
.detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.detail__meta .pill {
  border-radius: 8px;
  font-size: 14px;
  padding: 6px 14px;
}
.detail__meta .badge {
  border-radius: 8px;
  font-size: 14px;
  padding: 6px 14px;
}
.detail__desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
}
.detail__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.detail__section {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 18px 20px 20px;
  box-shadow: var(--el-box-shadow-lighter);
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}
.section-head__title {
  font-weight: 700;
  font-size: 18px;
  color: var(--el-text-color-primary);
}
.section-head__ops {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-head .el-button--primary {
  border-radius: 10px;
  font-weight: 600;
  padding: 8px 16px;
}
.section-tip {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}
.body-editor {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
}
.body-editor :deep(.re-rich-text__toolbar) {
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 10px 12px;
  gap: 6px;
  flex-wrap: wrap;
}
.body-editor :deep(.re-rich-text__toolbar .el-button-group) {
  margin-left: 0;
}
.body-editor :deep(.re-rich-text__toolbar .el-button) {
  border-radius: 8px !important;
  min-width: 36px;
  height: 34px;
  font-weight: 600;
}
.body-editor :deep(.re-rich-text__content .ProseMirror),
.body-editor :deep(.rich-text-area__body) {
  min-height: 240px;
  max-height: 480px;
  padding: 16px 18px;
  outline: none;
  font-size: 15px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
}
.body-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--el-text-color-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
.body-editor :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}
.hidden-file {
  display: none;
}
.file-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}
.file-item__type {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 6px 8px;
  letter-spacing: 0.02em;
  min-width: 44px;
  text-align: center;
}
.file-item__main {
  flex: 1;
  min-width: 0;
}
.file-item__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-item__sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.file-item__sub .dot {
  color: var(--el-text-color-disabled);
}
.file-item__ops {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.file-item__ops .el-button {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
}
.upload-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  border: 1.5px dashed var(--el-text-color-disabled);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.upload-drop:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* ---------- 新增/编辑卡片对话框（左表单 + 右预览） ---------- */
.card-dialog--preview :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  padding: 0;
  box-shadow: var(--el-box-shadow);
}
.card-dialog--preview :deep(.el-dialog__header) {
  margin: 0;
  padding: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.card-dialog--preview :deep(.el-dialog__body) {
  padding: 0;
}
.card-dialog--preview :deep(.el-dialog__footer) {
  padding: 14px 28px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.dialog-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 28px 20px;
  background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
}
.dialog-head__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  background: var(--el-color-primary);
  box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.35);
  flex-shrink: 0;
}
.dialog-head__text {
  flex: 1;
  min-width: 0;
}
.dialog-head__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}
.dialog-head__sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.dialog-head__close {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dialog-head__close:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.dialog-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 0;
  min-height: 460px;
}
.dialog-form {
  padding: 20px 24px 8px 28px;
  max-height: min(62vh, 560px);
  overflow: auto;
}
.form-group {
  margin-bottom: 8px;
}
.form-group__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-group__label .req {
  color: var(--el-color-danger);
  font-size: 12px;
}
.card-form .el-form-item {
  margin-bottom: 16px;
}
.card-form .el-form-item__label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}
.card-form .el-input,
.card-form .el-select,
.card-form .el-textarea__inner,
.card-form .el-input-number {
  border-radius: 10px;
}
.card-form .el-input-number {
  width: 160px;
}
.card-form .el-textarea__inner {
  min-height: 72px;
  border-radius: 10px;
}
.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.status-toggle__text {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  font-weight: 500;
}
.status-toggle__text.is-active {
  color: var(--el-color-primary);
}
.status-toggle__switch {
  --el-switch-on-color: var(--el-color-primary);
}
.dialog-preview {
  background: var(--el-fill-color-light);
  border-left: 1px solid var(--el-border-color-lighter);
  padding: 20px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: min(62vh, 560px);
  overflow: auto;
}
.dialog-preview__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.preview-card {
  background: var(--el-bg-color);
  border: 1.5px solid var(--el-color-primary-light-7);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 28px rgba(var(--el-color-primary-rgb), 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.preview-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.preview-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  background: var(--el-color-primary);
  box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
  flex-shrink: 0;
}
.preview-card__titles {
  min-width: 0;
}
.preview-card__name {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-card__code {
  margin-top: 2px;
  font-size: 13px;
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.preview-card__row,
.preview-card__desc {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 10px 12px;
}
.preview-card__row-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-weight: 600;
}
.preview-card__row-val {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  word-break: break-word;
}
.preview-status {
  background: var(--el-bg-color);
  border: 1.5px solid var(--el-border-color-lighter);
  border-radius: 14px;
  overflow: hidden;
}
.preview-status.is-on {
  border-color: var(--el-color-primary-light-8);
  box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.08);
}
.preview-status.is-off {
  border-color: var(--el-fill-color-light);
}
.preview-status__top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.preview-status.is-on .preview-status__top .el-icon {
  color: var(--el-color-success);
}
.preview-status.is-off .preview-status__top .el-icon {
  color: var(--el-text-color-placeholder);
}
.preview-status__label {
  text-align: center;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  border-top: 1px solid var(--el-border-color-lighter);
}
.preview-status.is-on .preview-status__label {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
}
.preview-status.is-off .preview-status__label {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
.dialog-footer__btn {
  border-radius: 10px;
  min-width: 96px;
  height: 40px;
}
.dialog-footer__btn--primary {
  background: var(--el-color-primary);
  border: 0;
  box-shadow: 0 8px 18px rgba(var(--el-color-primary-rgb), 0.28);
}
.dialog-footer__btn--primary:hover {
  background: var(--el-color-primary-dark-2);
  border: 0;
}

@media (max-width: 1100px) {
  .top-zone {
    flex-direction: column;
    margin-bottom: 0;
  }
  .stats-row {
    flex-wrap: wrap;
    width: 100%;
  }
  .filter-card :deep(.el-card__body) {
    padding: 18px 20px;
  }
  .filter-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .filter-actions {
    grid-column: 1 / -1;
  }
  .page-header {
    flex-direction: column;
    width: 100%;
  }
}
</style>
