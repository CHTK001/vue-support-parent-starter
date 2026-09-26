<template>
  <div class="page-container">
    <!-- 上区：页头 + 右侧悬浮正方形统计卡（一半压在上区、一半盖住内容区） -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">维度数据</h1>
          <p class="page-header__sub">管理学科、学段、年级等教学基础维度</p>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">学科总数</div>
            <div class="stat-card__value">{{ subjects.length }}</div>
            <div class="stat-card__hint">{{ subjectCoverHint }}</div>
          </div>
          <div class="stat-card__icon" style="background: var(--el-color-primary)">
            <el-icon :size="22"><Grid /></el-icon>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">学段数</div>
            <div class="stat-card__value">{{ gradeLevelOptions.length }}</div>
            <div class="stat-card__hint">小学/初中/高中/大学</div>
          </div>
          <div class="stat-card__icon" style="background: var(--el-color-primary)">
            <el-icon :size="22"><Collection /></el-icon>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">启用率</div>
            <div class="stat-card__value">{{ enableRate }}%</div>
            <div class="stat-card__hint">{{ enableRateHint }}</div>
          </div>
          <div class="stat-card__icon" style="background: var(--el-color-success)">
            <el-icon :size="22"><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="panel-card">
      <div class="dim-toolbar">
        <div class="pill-tabs" role="tablist">
          <button
            v-for="t in tabs"
            :key="t.name"
            type="button"
            class="pill-tabs__btn"
            :class="{ 'is-active': activeTab === t.name }"
            role="tab"
            :aria-selected="activeTab === t.name"
            @click="activeTab = t.name"
          >
            {{ t.label }}
          </button>
        </div>
    
      </div>

      <!-- ==================== 学科管理 ==================== -->
      <section v-show="activeTab === 'subject'" class="tab-panel">
        <div class="subject-actions">
          <el-input
            v-model="subjectKeyword"
            class="subject-search"
            clearable
            placeholder="搜索学科..."
            :prefix-icon="Search"
          />
          <div class="subject-actions__right">
            <el-button class="ghost-btn" :icon="Upload" @click="onImport">批量导入</el-button>
            <el-button type="primary" :icon="Plus" @click="openSubjectCreate">新增学科</el-button>
          </div>
        </div>

        <div v-loading="subjectLoading" class="subject-grid">
          <article
            v-for="s in filteredSubjects"
            :key="s.subjectId"
            class="subject-card"
          >
            <div class="subject-card__head">
              <div class="subject-card__icon" :style="{ background: subjectTheme(s).bg }">
                <el-icon :size="24"><component :is="subjectTheme(s).icon" /></el-icon>
              </div>
              <div class="subject-card__meta">
                <div class="subject-card__name">{{ s.subjectName }}</div>
                <div class="subject-card__code">{{ s.subjectCode }}</div>
              </div>
              <el-dropdown trigger="click" @command="(cmd: string) => onSubjectMenu(cmd, s)">
                <button type="button" class="subject-card__more" aria-label="更多操作">
                  <el-icon><MoreFilled /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="toggle">
                      {{ s.subjectStatus === 1 ? "停用" : "启用" }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="subject-card__tags">
              <span v-for="lv in splitLevels(s.subjectGradeLevels)" :key="lv" class="level-chip">
                {{ levelLabel(lv) }}
              </span>
              <span v-if="!splitLevels(s.subjectGradeLevels).length" class="level-chip level-chip--muted">未配置</span>
            </div>

            <div class="subject-card__footer">
              <span class="status-pill" :class="s.subjectStatus === 1 ? 'is-on' : 'is-off'">
                <i class="status-dot" />
                {{ s.subjectStatus === 1 ? "启用中" : "已停用" }}
              </span>
              <div class="subject-card__ops">
                <button type="button" class="icon-btn" title="编辑" @click="openSubjectEdit(s)">
                  <el-icon><EditPen /></el-icon>
                </button>
                <el-popconfirm :title="`确认删除学科「${s.subjectName}」?`" @confirm="removeSubject(s)">
                  <template #reference>
                    <button type="button" class="icon-btn is-danger" title="删除">
                      <el-icon><Delete /></el-icon>
                    </button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </article>

          <div v-if="!subjectLoading && !filteredSubjects.length" class="empty-panel">
            暂无学科，点击「新增学科」创建
          </div>
        </div>
      </section>

      <!-- ==================== 学段管理（只读） ==================== -->
      <section v-show="activeTab === 'level'" class="tab-panel">
        <div class="hint-row">
          学段为系统内置枚举（PRIMARY / JUNIOR / SENIOR / UNIVERSITY），不落库、不提供增删改，此处只读展示。
        </div>
        <div class="level-grid">
          <div v-for="opt in gradeLevelOptions" :key="opt.value" class="level-card">
            <div class="level-card__head">
              <div class="level-card__icon" :style="{ background: levelTheme(opt.value).bg }">
                <span>{{ opt.label.slice(0, 1) }}</span>
              </div>
              <div>
                <div class="level-card__title">{{ opt.label }}</div>
                <div class="level-card__code">{{ opt.value }}</div>
              </div>
            </div>
            <div class="level-card__count">
              <span class="num">{{ gradeCount(opt.value) }}</span>
              <span class="unit">个年级</span>
            </div>
            <div class="level-card__grades">
              <span v-for="g in gradesOfLevel(opt.value)" :key="g.gradeId" class="level-chip level-chip--soft">
                {{ g.gradeName }}
              </span>
              <span v-if="!gradesOfLevel(opt.value).length" class="text-muted">暂无年级</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== 年级管理 ==================== -->
      <section v-show="activeTab === 'grade'" class="tab-panel">
        <div class="subject-actions">
          <el-select
            v-model="gradeLevelFilter"
            clearable
            placeholder="全部学段"
            style="width: 160px"
            @change="loadGrades"
          >
            <el-option
              v-for="opt in gradeLevelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div class="subject-actions__right">
            <el-button type="primary" :icon="Plus" @click="openGradeCreate">新增年级</el-button>
          </div>
        </div>

        <div v-loading="gradeLoading" class="grade-list">
          <div
            v-for="g in grades"
            :key="g.gradeId"
            class="grade-row"
          >
            <span class="level-chip">{{ levelLabel(g.gradeLevel) }}</span>
            <span class="grade-row__name">{{ g.gradeName }}</span>
            <span class="grade-row__order">顺序 {{ g.gradeOrder ?? 0 }}</span>
            <span class="grade-row__time">{{ g.createTime || "—" }}</span>
            <div class="subject-card__ops">
              <button type="button" class="icon-btn" title="编辑" @click="openGradeEdit(g)">
                <el-icon><EditPen /></el-icon>
              </button>
              <el-popconfirm :title="`确认删除年级「${g.gradeName}」?`" @confirm="removeGrade(g)">
                <template #reference>
                  <button type="button" class="icon-btn is-danger" title="删除">
                    <el-icon><Delete /></el-icon>
                  </button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div v-if="!gradeLoading && !grades.length" class="empty-panel">暂无年级，点击「新增年级」创建</div>
        </div>
      </section>
    </el-card>

    <!-- 新增/编辑学科（对齐原型） -->
    <el-dialog
      v-model="subjectDialogVisible"
      width="560px"
      class="card-dialog subject-dialog"
      align-center
      :show-close="false"
    >
      <template #header>
        <div class="dlg-header">
          <div class="dlg-header__text">
            <div class="dlg-header__title">{{ subjectForm.subjectId ? "编辑学科" : "新增学科" }}</div>
            <div class="dlg-header__sub">{{ subjectForm.subjectId ? "更新学科分类信息" : "创建新的学科分类" }}</div>
          </div>
          <button type="button" class="dlg-close" aria-label="关闭" @click="subjectDialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="dlg-body">
        <!-- 选择图标 -->
        <div class="pick-section">
          <div class="pick-section__label">选择图标</div>
          <div class="icon-picker">
            <button
              v-for="ic in ICON_OPTIONS"
              :key="ic.key"
              type="button"
              class="icon-opt"
              :class="{ 'is-active': (subjectForm.subjectIcon || 'book') === ic.key }"
              :style="{ '--opt-bg': ic.bg, '--opt-fg': ic.fg }"
              :title="ic.label"
              @click="subjectForm.subjectIcon = ic.key"
            >
              <el-icon :size="26"><component :is="ic.icon" /></el-icon>
            </button>
          </div>
        </div>

        <div class="dlg-divider" />

        <!-- 选择颜色 -->
        <div class="pick-section">
          <div class="pick-section__label">选择颜色</div>
          <div class="color-picker">
            <button
              v-for="c in COLOR_OPTIONS"
              :key="c"
              type="button"
              class="color-dot"
              :class="{ 'is-active': (subjectForm.subjectColor || '#3b82f6') === c }"
              :style="{ background: c }"
              :title="c"
              @click="subjectForm.subjectColor = c"
            />
          </div>
        </div>

        <div class="dlg-divider" />

        <!-- 基本信息 -->
        <div class="block-title">基本信息</div>
        <el-form :model="subjectForm" label-width="96px" label-position="left" class="card-form subject-form">
          <el-form-item label="学科名称" required>
            <el-input v-model="subjectForm.subjectName" placeholder="输入学科名称，如 语文" />
          </el-form-item>
          <el-form-item label="学科编码" required>
            <el-input v-model="subjectForm.subjectCode" placeholder="自动生成，如 chinese" />
          </el-form-item>
        </el-form>

        <!-- 适用学段 -->
        <div class="block-title">适用学段</div>
        <div class="level-pills">
          <button
            v-for="opt in gradeLevelOptions"
            :key="opt.value"
            type="button"
            class="level-pill"
            :class="{ 'is-on': subjectLevels.includes(opt.value) }"
            @click="toggleSubjectLevel(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="dlg-divider" />

        <!-- 其他设置 -->
        <div class="block-title">其他设置</div>
        <el-form :model="subjectForm" label-width="96px" label-position="left" class="card-form subject-form">
          <el-form-item label="排序">
            <el-input-number
              v-model="subjectForm.subjectSortOrder"
              :min="0"
              :max="999"
              :controls="false"
              class="num-input is-center"
            />
          </el-form-item>
          <el-form-item label="状态" class="status-item">
            <ReSwitch
              layout="square"
              :model-value="(subjectForm.subjectStatus ?? 1) === 1"
              active-icon="ep:circle-check"
              inactive-icon="ep:circle-close"
              @update:model-value="(v: boolean) => (subjectForm.subjectStatus = v ? 1 : 0)"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="dialog-btn" @click="subjectDialogVisible = false">取消</el-button>
          <el-button class="dialog-btn is-primary" type="primary" :loading="subjectSaving" @click="saveSubject">
            保存学科
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新增/编辑年级（对齐原型） -->
    <el-dialog
      v-model="gradeDialogVisible"
      width="560px"
      class="card-dialog subject-dialog grade-dialog"
      align-center
      :show-close="false"
    >
      <template #header>
        <div class="dlg-header">
          <div class="dlg-header__icon" aria-hidden="true">
            <el-icon :size="26"><Calendar /></el-icon>
          </div>
          <div class="dlg-header__text">
            <div class="dlg-header__title">{{ gradeForm.gradeId ? "编辑年级" : "新增年级" }}</div>
            <div class="dlg-header__sub">{{ gradeForm.gradeId ? "更新年级分类信息" : "创建新的年级分类" }}</div>
          </div>
          <button type="button" class="dlg-close" aria-label="关闭" @click="gradeDialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="dlg-body">
        <!-- 选择学段 -->
        <div class="block-title">选择学段</div>
        <div class="level-pills">
          <button
            v-for="opt in gradeLevelOptions"
            :key="opt.value"
            type="button"
            class="level-pill"
            :class="{ 'is-on': (gradeForm.gradeLevel || 'PRIMARY') === opt.value }"
            @click="onGradeLevelPick(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="dlg-divider" />

        <!-- 基本信息 -->
        <div class="block-title">基本信息</div>
        <el-form :model="gradeForm" label-position="top" class="card-form grade-form">
          <el-form-item label="年级名称" required>
            <el-input v-model="gradeForm.gradeName" placeholder="输入年级名称，如 一年级 / 大一" />
            <div class="field-hint">学段选择后可快速选择常用年级</div>
          </el-form-item>
        </el-form>

        <!-- 快捷选择 -->
        <div class="block-title">快捷选择</div>
        <div class="quick-grid">
          <button
            v-for="name in gradeQuickNames"
            :key="name"
            type="button"
            class="level-pill quick-pill"
            :class="{ 'is-on': gradeForm.gradeName === name }"
            @click="gradeForm.gradeName = name"
          >
            {{ name }}
          </button>
        </div>

        <div class="dlg-divider" />

        <!-- 顺序设置 -->
        <div class="block-title">顺序设置</div>
        <el-form :model="gradeForm" label-width="72px" label-position="left" class="card-form grade-form">
          <el-form-item label="排序">
            <el-input-number
              v-model="gradeForm.gradeOrder"
              :min="0"
              :max="999"
              :controls="false"
              class="num-input is-center"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="dialog-btn" @click="gradeDialogVisible = false">取消</el-button>
          <el-button class="dialog-btn is-primary" type="primary" :loading="gradeSaving" @click="saveGrade">
            保存年级
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 维度数据 —— 按原型重构：
 * - 渐变页头 + 玻璃统计卡（学科总数 / 学段数 / 启用率）
 * - 胶囊 Tab：学科管理 / 学段管理 / 年级管理
 * - 学科：搜索 + 卡片网格（图标/编码/学段标签/启停状态/编辑删除）
 * - 学段：只读卡片；年级：列表 CRUD
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Aim,
  MagicStick,
  Calendar,
  CircleCheckFilled,
  Close,
  Collection,
  DataLine,
  Delete,
  Edit,
  EditPen,
  Files,
  Flag,
  Grid,
  Lightning,
  Monitor,
  MoreFilled,
  Plus,
  Reading,
  Search,
  Upload,
} from "@element-plus/icons-vue";
import type { Component } from "vue";
import { eduaiApi } from "../api/eduaiApi";
import type { EduGrade, EduSubject, GradeLevelOption } from "../api/types";

const FALLBACK_GRADE_LEVELS: GradeLevelOption[] = [
  { value: "PRIMARY", label: "小学" },
  { value: "JUNIOR", label: "初中" },
  { value: "SENIOR", label: "高中" },
  { value: "UNIVERSITY", label: "大学" },
];

/** 学段下拉：优先 dimensionDropdown.gradeLevels，回退内置枚举 */
const gradeLevelMeta = ref<GradeLevelOption[]>([]);
const gradeLevelOptions = computed<GradeLevelOption[]>(() =>
  gradeLevelMeta.value.length ? gradeLevelMeta.value : FALLBACK_GRADE_LEVELS,
);

/** 对话框图标选项（对齐原型 8 枚） */
const ICON_OPTIONS: { key: string; label: string; icon: Component; bg: string; fg: string }[] = [
  { key: "book", label: "书本", icon: Files, bg: "var(--el-color-primary-light-9)", fg: "var(--el-color-primary)" },
  { key: "calculator", label: "计算器", icon: DataLine, bg: "var(--el-color-info-light-9)", fg: "var(--el-color-info)" },
  { key: "letter", label: "字母", icon: Aim, bg: "var(--el-color-success-light-9)", fg: "var(--el-color-success)" },
  { key: "atom", label: "原子", icon: MagicStick, bg: "var(--el-color-warning-light-9)", fg: "var(--el-color-warning)" },
  { key: "flask", label: "实验", icon: Collection, bg: "var(--el-color-success-light-8)", fg: "var(--el-color-success-dark-2)" },
  { key: "leaf", label: "自然", icon: Grid, bg: "var(--el-color-danger-light-9)", fg: "var(--el-color-danger)" },
  { key: "clock", label: "历史", icon: Reading, bg: "var(--el-color-warning-light-8)", fg: "var(--el-color-warning-dark-2)" },
  { key: "globe", label: "地理", icon: Monitor, bg: "var(--el-color-primary-light-8)", fg: "var(--el-color-primary-dark-2)" },
];

/** 对话框颜色选项（对齐原型 8 色） */
const COLOR_OPTIONS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#14b8a6", "#facc15", "#ec4899", "#ef4444"];

const levelLabel = (v?: string) =>
  gradeLevelOptions.value.find((o) => o.value === v)?.label || v || "";

const tabs = [
  { name: "subject", label: "学科管理" },
  { name: "level", label: "学段管理" },
  { name: "grade", label: "年级管理" },
] as const;

const activeTab = ref<"subject" | "level" | "grade">("subject");

// ==================== 统计 ====================
const subjectCoverHint = computed(() => {
  const n = subjects.value.length;
  if (!n) return "暂无学科";
  const levels = gradeLevelOptions.value;
  return `覆盖${levels[0]?.label || ""}至${levels[levels.length - 1]?.label || ""}`;
});

const enableRate = computed(() => {
  const total = subjects.value.length;
  if (!total) return 0;
  const on = subjects.value.filter((s) => s.subjectStatus === 1).length;
  return Math.round((on / total) * 100);
});

const enableRateHint = computed(() =>
  enableRate.value === 100 ? "全部正常启用" : `${subjects.value.filter((s) => s.subjectStatus === 1).length}/${subjects.value.length} 正常启用`,
);

// ==================== 学科 ====================
const subjects = ref<EduSubject[]>([]);
const subjectLoading = ref(false);
const subjectSaving = ref(false);
const subjectDialogVisible = ref(false);
const subjectForm = reactive<Partial<EduSubject>>({});
const subjectLevels = ref<string[]>([]);
const subjectKeyword = ref("");

const filteredSubjects = computed(() => {
  const kw = subjectKeyword.value.trim().toLowerCase();
  if (!kw) return subjects.value;
  return subjects.value.filter(
    (s) =>
      String(s.subjectName ?? "").toLowerCase().includes(kw) ||
      String(s.subjectCode ?? "").toLowerCase().includes(kw),
  );
});

const splitLevels = (v?: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

/** 学科卡片配色与图标（优先用存储的 subjectColor/subjectIcon） */
const subjectTheme = (s: EduSubject): { bg: string; icon: Component } => {
  const iconKey = String(s.subjectIcon || "");
  const fromIcon = ICON_OPTIONS.find((o) => o.key === iconKey);
  if (fromIcon && s.subjectColor) return { bg: s.subjectColor, icon: fromIcon.icon };
  if (s.subjectColor) {
    const fallbackIcon = fromIcon?.icon
      || (() => {
        const code = String(s.subjectCode || "").toLowerCase();
        const name = String(s.subjectName || "");
        if (code.includes("chinese") || name.includes("语")) return Files;
        if (code.includes("math") || name.includes("数")) return DataLine;
        if (code.includes("english") || name.includes("英")) return Aim;
        if (code.includes("physics") || name.includes("物")) return Lightning;
        if (code.includes("chemistry") || name.includes("化")) return Collection;
        if (code.includes("history") || name.includes("历")) return Reading;
        if (code.includes("geography") || name.includes("地")) return Monitor;
        if (code.includes("politic") || name.includes("政")) return Flag;
        return Grid;
      })();
    return { bg: s.subjectColor, icon: fallbackIcon };
  }
  if (fromIcon) return { bg: fromIcon.fg, icon: fromIcon.icon };
  const code = String(s.subjectCode || "").toLowerCase();
  const name = String(s.subjectName || "");
  if (code.includes("chinese") || name.includes("语")) return { bg: "var(--el-color-primary)", icon: Files };
  if (code.includes("math") || name.includes("数")) return { bg: "var(--el-color-primary-dark-2)", icon: DataLine };
  if (code.includes("english") || name.includes("英")) return { bg: "var(--el-color-success)", icon: Aim };
  if (code.includes("physics") || name.includes("物")) return { bg: "var(--el-color-warning)", icon: Lightning };
  if (code.includes("chemistry") || name.includes("化")) return { bg: "var(--el-color-success-dark-2)", icon: Collection };
  if (code.includes("biology") || name.includes("生")) return { bg: "var(--el-color-info)", icon: Grid };
  if (code.includes("history") || name.includes("历")) return { bg: "var(--el-color-warning-dark-2)", icon: Reading };
  if (code.includes("geography") || name.includes("地")) return { bg: "var(--el-color-danger)", icon: Monitor };
  if (code.includes("politic") || name.includes("政") || name.includes("道")) return { bg: "var(--el-color-danger-dark-2)", icon: Flag };
  if (name.includes("科")) return { bg: "var(--el-color-info-dark-2)", icon: Edit };
  return { bg: "var(--el-color-primary)", icon: Grid };
};

const levelTheme = (v: string) => {
  if (v === "PRIMARY") return { bg: "var(--el-color-primary)" };
  if (v === "JUNIOR") return { bg: "var(--el-color-primary-dark-2)" };
  if (v === "SENIOR") return { bg: "var(--el-color-warning)" };
  return { bg: "var(--el-color-info)" };
};

const loadGradeLevels = async () => {
  try {
    const drop = await eduaiApi.dimensionDropdown();
    gradeLevelMeta.value = Array.isArray(drop?.gradeLevels) ? drop.gradeLevels : [];
  } catch {
    gradeLevelMeta.value = [];
  }
};

const loadSubjects = async () => {
  subjectLoading.value = true;
  try {
    const res = await eduaiApi.listSubjects();
    subjects.value = Array.isArray(res) ? res : [];
  } catch {
    ElMessage.error("加载学科失败");
  } finally {
    subjectLoading.value = false;
  }
};

const openSubjectCreate = () => {
  Object.assign(subjectForm, {
    subjectId: undefined,
    subjectCode: "",
    subjectName: "",
    subjectSortOrder: subjects.value.length,
    subjectStatus: 1,
    subjectIcon: "book",
    subjectColor: "#3b82f6",
  });
  subjectLevels.value = [];
  subjectDialogVisible.value = true;
};

const openSubjectEdit = (row: EduSubject) => {
  Object.assign(subjectForm, {
    ...row,
    subjectIcon: row.subjectIcon || "book",
    subjectColor: row.subjectColor || "#3b82f6",
  });
  subjectLevels.value = splitLevels(row.subjectGradeLevels);
  subjectDialogVisible.value = true;
};

const toggleSubjectLevel = (value: string) => {
  const i = subjectLevels.value.indexOf(value);
  if (i >= 0) subjectLevels.value.splice(i, 1);
  else subjectLevels.value.push(value);
};

const onSubjectMenu = (cmd: string, row: EduSubject) => {
  if (cmd === "edit") openSubjectEdit(row);
  else if (cmd === "toggle") void toggleSubject(row);
  else if (cmd === "delete") void confirmDeleteSubject(row);
};

const saveSubject = async () => {
  if (!subjectForm.subjectName?.trim()) {
    ElMessage.warning("学科名称必填");
    return;
  }
  if (!subjectForm.subjectCode?.trim()) {
    ElMessage.warning("学科编码必填");
    return;
  }
  if (!subjectLevels.value.length) {
    ElMessage.warning("请至少选择一个适用学段");
    return;
  }
  subjectSaving.value = true;
  try {
    await eduaiApi.saveSubject({
      ...subjectForm,
      subjectGradeLevels: subjectLevels.value.join(","),
      subjectIcon: subjectForm.subjectIcon || "book",
      subjectColor: subjectForm.subjectColor || "#3b82f6",
    });
    ElMessage.success("保存成功");
    subjectDialogVisible.value = false;
    void loadSubjects();
  } catch {
    ElMessage.error("保存失败");
  } finally {
    subjectSaving.value = false;
  }
};

const toggleSubject = async (row: EduSubject) => {
  try {
    await eduaiApi.saveSubject({
      ...row,
      subjectStatus: row.subjectStatus === 1 ? 0 : 1,
    });
    ElMessage.success(row.subjectStatus === 1 ? "已停用" : "已启用");
    void loadSubjects();
  } catch {
    ElMessage.error("操作失败");
  }
};

const confirmDeleteSubject = async (row: EduSubject) => {
  try {
    await ElMessageBox.confirm(`确认删除学科「${row.subjectName}」?`, "提示", { type: "warning" });
    await removeSubject(row);
  } catch {
    /* cancel */
  }
};

const removeSubject = async (row: EduSubject) => {
  try {
    await eduaiApi.deleteSubject(row.subjectId as number);
    ElMessage.success("删除成功");
    void loadSubjects();
  } catch {
    ElMessage.error("删除失败");
  }
};

const onImport = () => {
  ElMessage.info("批量导入开发中，可先逐条新增");
};

// ==================== 年级 ====================
const grades = ref<EduGrade[]>([]);
const gradeLoading = ref(false);
const gradeSaving = ref(false);
const gradeDialogVisible = ref(false);
const gradeForm = reactive<Partial<EduGrade>>({});
const gradeLevelFilter = ref("");

const loadGrades = async () => {
  gradeLoading.value = true;
  try {
    const res = await eduaiApi.listGrades(gradeLevelFilter.value || undefined);
    grades.value = Array.isArray(res) ? res : [];
  } catch {
    ElMessage.error("加载年级失败");
  } finally {
    gradeLoading.value = false;
  }
};

const gradesOfLevel = (level: string) => grades.value.filter((g) => g.gradeLevel === level);
const gradeCount = (level: string) => gradesOfLevel(level).length;

/** 各学段快捷年级名（对齐原型） */
const GRADE_QUICK_NAMES: Record<string, string[]> = {
  PRIMARY: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  JUNIOR: ["七年级", "八年级", "九年级"],
  SENIOR: ["高一", "高二", "高三"],
  UNIVERSITY: ["大一", "大二", "大三", "大四"],
};

const gradeQuickNames = computed(() => GRADE_QUICK_NAMES[gradeForm.gradeLevel || "PRIMARY"] || []);

const onGradeLevelPick = (value: string) => {
  gradeForm.gradeLevel = value;
};

const openGradeCreate = () => {
  Object.assign(gradeForm, {
    gradeId: undefined,
    gradeLevel: gradeLevelFilter.value || "PRIMARY",
    gradeName: "",
    gradeOrder: grades.value.length || 10,
  });
  gradeDialogVisible.value = true;
};

const openGradeEdit = (row: EduGrade) => {
  Object.assign(gradeForm, { ...row, gradeLevel: row.gradeLevel || "PRIMARY" });
  gradeDialogVisible.value = true;
};

const saveGrade = async () => {
  if (!gradeForm.gradeLevel || !gradeForm.gradeName?.trim()) {
    ElMessage.warning("学段与年级名称必填");
    return;
  }
  gradeSaving.value = true;
  try {
    await eduaiApi.saveGrade(gradeForm);
    ElMessage.success("保存成功");
    gradeDialogVisible.value = false;
    void loadGrades();
  } catch {
    ElMessage.error("保存失败");
  } finally {
    gradeSaving.value = false;
  }
};

const removeGrade = async (row: EduGrade) => {
  try {
    await eduaiApi.deleteGrade(row.gradeId as number);
    ElMessage.success("删除成功");
    void loadGrades();
  } catch {
    ElMessage.error("删除失败");
  }
};

onMounted(() => {
  void loadGradeLevels();
  void loadSubjects();
  void loadGrades();
});
</script>

<style scoped>
/* ---------- 页头 / 统计（对齐知识库） ---------- */
.page-container {
  padding: 16px;
  height: 100%;
  overflow: auto;
  background: var(--el-bg-color-page);
}

.page-container {
  padding: 16px;
  height: 100%;
  overflow: auto;
  background: var(--el-bg-color-page);
}

/* 上区：页头 + 右侧悬浮统计卡 */
.top-zone {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  /* 负 margin 让下半张卡压进 panel-card */
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

/* 正方形统计卡：右侧并排，浮在页头/内容分界 */
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

.panel-card {
  border-radius: 14px;
  border: 0;
  /* 让内容区顶部被统计卡下半压住，同时自身仍从上区下沿开始 */
  position: relative;
  z-index: 1;
  margin-top: 0;
}
.panel-card :deep(.el-card__body) {
  /* 上半被统计卡盖住约 74px，顶部多留白避免工具栏被压 */
  padding: 92px 20px 22px;
}

.dim-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 6px;
}

.pill-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 5px;
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.pill-tabs__btn {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 10px 26px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.pill-tabs__btn:hover {
  color: var(--el-color-primary);
}

.pill-tabs__btn.is-active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgb(15 23 42 / 8%);
}

.quick-add {
  appearance: none;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  cursor: pointer;
  padding: 6px 4px;
}

.quick-add__plus {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 6px 14px rgba(var(--el-color-primary-rgb), 0.35);
}

.quick-add:hover .quick-add__plus {
  background: var(--el-color-primary-dark-2);
}

/* ---------- 学科工具条 ---------- */
.subject-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.subject-search {
  width: min(360px, 100%);
}

.subject-search :deep(.el-input__wrapper) {
  border-radius: 999px;
  padding: 2px 14px 2px 8px;
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
}

.subject-actions__right {
  display: inline-flex;
  gap: 10px;
}

.ghost-btn {
  border-radius: 10px;
  font-weight: 600;
}

/* ---------- 学科卡片网格 ---------- */
.subject-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  min-height: 160px;
}

.subject-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  padding: 18px 18px 14px;
  box-shadow: var(--el-box-shadow-lighter);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 0.15s, box-shadow 0.15s;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow);
}

.subject-card__head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
}

.subject-card__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--el-box-shadow-light);
}

.subject-card__name {
  font-size: 20px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.subject-card__code {
  margin-top: 2px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.subject-card__more {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.subject-card__more:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

.subject-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.level-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--el-color-primary-light-5);
}

.level-chip--muted {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  border-color: var(--el-border-color-lighter);
}

.level-chip--soft {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  border-color: var(--el-border-color-lighter);
}

.subject-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
}

.status-pill.is-on {
  color: var(--el-color-success);
}

.status-pill.is-off {
  color: var(--el-text-color-placeholder);
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
}

.subject-card__ops {
  display: inline-flex;
  gap: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.icon-btn.is-danger:hover {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.empty-panel {
  grid-column: 1 / -1;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  background: var(--el-bg-color);
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 16px;
}

/* ---------- 学段 ---------- */
.hint-row {
  margin-bottom: 14px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.level-card {
  padding: 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--el-color-white);
  font-weight: 800;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.level-card__title {
  font-size: 18px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.level-card__code {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.level-card__count .num {
  font-size: 28px;
  font-weight: 800;
  color: var(--el-color-primary);
}

.level-card__count .unit {
  margin-left: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.level-card__grades {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.text-muted {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* ---------- 年级列表 ---------- */
.grade-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 120px;
}

.grade-row {
  display: grid;
  grid-template-columns: 90px 1fr 110px 170px auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.grade-row__name {
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.grade-row__order,
.grade-row__time {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* ---------- 对话框（严格对齐「新增学科」原型） ---------- */
.card-dialog {
  border-radius: 16px;
}

.card-dialog :deep(.el-dialog) {
  border-radius: 16px;
  padding: 0;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow);
}

.card-dialog :deep(.el-overlay) {
  background: var(--el-overlay-color-lighter);
}

.card-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 4px;
  margin-right: 0;
  border-bottom: 0;
  padding-right: 48px;
  background: var(--el-bg-color);
}

.card-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.card-dialog :deep(.el-dialog__body) {
  padding: 16px 24px 8px;
  background: var(--el-bg-color);
}

.card-dialog :deep(.el-dialog__footer) {
  padding: 8px 24px 20px;
  border-top: 0;
  background: var(--el-bg-color);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.card-form :deep(.el-form-item) {
  margin-bottom: 18px;
  align-items: flex-start;
}

.card-form :deep(.el-form-item__label) {
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 36px;
  height: auto;
  justify-content: flex-start;
  text-align: left;
  white-space: nowrap;
  word-break: keep-all;
}

.card-form :deep(.el-form-item.is-required .el-form-item__label::before) {
  color: var(--el-color-danger);
  margin-right: 4px;
  align-self: center;
}

.card-form :deep(.el-input__wrapper),
.card-form :deep(.el-select__wrapper) {
  border-radius: 8px;
  min-height: 36px;
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.card-form :deep(.el-input__wrapper:hover),
.card-form :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
}

.card-form :deep(.el-input__wrapper.is-focus),
.card-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1.5px var(--el-color-primary) inset;
}

.card-form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
  line-height: normal;
}

.num-input {
  width: 220px;
}

.num-input.is-center :deep(.el-input__wrapper) {
  text-align: center;
}

.num-input.is-center :deep(.el-input__inner) {
  text-align: center;
  font-weight: 600;
}

.status-item :deep(.el-form-item__content) {
  line-height: normal;
}

.dialog-btn {
  min-width: 96px;
  height: 36px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.dialog-btn.is-primary {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.dialog-btn.is-primary:hover {
  background: var(--el-color-primary-dark-2);
  border-color: var(--el-color-primary-dark-2);
}

/* ---------- 新增学科对话框（对齐详细原型） ---------- */
.subject-dialog :deep(.el-dialog) {
  max-height: min(90vh, 860px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.subject-dialog :deep(.el-dialog__header) {
  flex-shrink: 0;
  padding: 20px 24px 12px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-fill-color-light);
  background: var(--el-bg-color);
}

.subject-dialog :deep(.el-dialog__body) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 24px 8px;
  background: var(--el-bg-color);
}

.subject-dialog :deep(.el-dialog__footer) {
  flex-shrink: 0;
  padding: 12px 24px 20px;
  border-top: 1px solid var(--el-fill-color-light);
  background: var(--el-bg-color);
}

.dlg-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  position: relative;
}

.dlg-header__icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.35);
}

.dlg-header__text {
  min-width: 0;
  flex: 1;
}

.dlg-header__title {
  font-size: 18px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.dlg-header__sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.dlg-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-left: auto;
  border: 0;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.dlg-close:hover {
  background: var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
}

.dlg-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dlg-divider {
  height: 1px;
  background: var(--el-fill-color-light);
  margin: 2px 0;
}

.pick-section__label,
.block-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.block-title {
  margin-top: 2px;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.icon-opt {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  border: 2px solid var(--el-border-color-lighter);
  background: var(--opt-bg, var(--el-fill-color-light));
  color: var(--opt-fg, var(--el-color-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.icon-opt:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
}

.icon-opt.is-active {
  border-color: var(--opt-fg, var(--el-color-primary));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--opt-fg, var(--el-color-primary)) 22%, transparent);
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 0;
  padding: 0;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 8%);
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;
}

.color-dot:hover {
  transform: scale(1.08);
}

.color-dot.is-active {
  box-shadow:
    0 0 0 2px var(--el-color-white),
    0 0 0 4px var(--el-color-primary);
}

.level-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.level-pill {
  appearance: none;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 22px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.level-pill:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.level-pill.is-on {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
}

.subject-form {
  margin-bottom: 0;
}

.grade-form {
  margin-bottom: 0;
}

.grade-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.grade-form :deep(.el-form-item__label) {
  font-weight: 700;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  margin-bottom: 8px;
  padding-bottom: 0;
}

.field-hint {
  width: 100%;
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-color-primary);
  line-height: 1.4;
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-pill {
  min-width: 96px;
  justify-content: center;
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
}

.grade-form .num-input {
  width: 220px;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1200px) {
  .subject-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grade-row {
    grid-template-columns: 80px 1fr auto;
  }

  .grade-row__order,
  .grade-row__time {
    display: none;
  }
}

@media (max-width: 768px) {
  .top-zone {
    flex-direction: column;
    margin-bottom: 0;
    z-index: auto;
  }

  .stats-row {
    width: 100%;
  }

  .stat-card {
    flex: 1;
    width: auto;
    min-width: 0;
    height: auto;
    min-height: 120px;
  }

  .subject-grid {
    grid-template-columns: 1fr;
  }

  .pill-tabs__btn {
    padding: 8px 14px;
    font-size: 14px;
  }
}
</style>
