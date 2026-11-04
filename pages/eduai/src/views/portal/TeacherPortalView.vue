<template>
  <!--
    教师工作台（/edu/teacher）
    独立全屏页面，脱离管理后台外壳。能力：
      1. 我的班级：管理后台配置给我的班级里的学生（增删改 + 重置口令）
      2. 组卷：查看我的试卷、AI 组卷、手动组卷（门户内嵌弹窗）、上传题目、发布/下架/归档
      3. 阅卷：上传答卷（独立弹窗，拖拽 + 点击）→ AI 判分 → 复核确认；并列出我发起过的阅卷任务
    归属取自登录态：只能看到 / 操作配置给我的班级与自己的试卷与阅卷任务。
  -->
  <div class="tp">
    <header class="tp-head">
      <div class="tp-head__left">
        <h1 class="tp-title">教师工作台</h1>
        <p class="tp-sub">
          {{ teacherName }}
          <span class="tp-sep">|</span>
          工号 {{ overview?.teacher?.teacherNo || "—" }}
          <template v-if="overview?.teacher?.subjectCode">
            <span class="tp-sep">|</span>{{ overview?.teacher?.subjectCode }}
          </template>
        </p>
      </div>
      <div v-if="overview" class="tp-stats">
        <div class="tp-stat">
          <div class="tp-stat__val">{{ classCount }}</div>
          <div class="tp-stat__lbl">我的班级</div>
        </div>
        <div class="tp-stat">
          <div class="tp-stat__val">{{ studentCount }}</div>
          <div class="tp-stat__lbl">学生人数</div>
        </div>
        <div class="tp-stat">
          <div class="tp-stat__val is-accent">{{ boundCount }}</div>
          <div class="tp-stat__lbl">已绑定账号</div>
        </div>
      </div>
      <div class="tp-head__act">
        <el-button v-if="overview" text @click="unbind">切换工号</el-button>
        <el-button text @click="logout">退出登录</el-button>
      </div>
    </header>

    <section class="tp-body">
      <!-- 未绑定：先绑定工号 -->
      <div v-if="needBind === true" class="tp-bind">
        <h2 class="tp-bind__title">先绑定教师工号</h2>
        <p class="tp-bind__sub">绑定后才能管理你的班级、组卷与阅卷。</p>
        <el-form :model="bindForm" label-width="70px" @submit.prevent>
          <el-form-item label="工号" required>
            <el-input v-model="bindForm.teacherNo" placeholder="如 T2024001" />
          </el-form-item>
          <el-form-item label="姓名" required>
            <el-input v-model="bindForm.teacherName" placeholder="如 王老师" />
          </el-form-item>
          <el-form-item label="学科">
            <el-input v-model="bindForm.subjectCode" placeholder="如 MATH（可留空）" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="binding" class="tp-bind__btn" @click="doBind">
              进入工作台
            </el-button>
          </el-form-item>
        </el-form>
        <p v-if="bindError" class="tp-bind__err">{{ bindError }}</p>
      </div>

      <el-tabs v-else-if="needBind === false" v-model="tab" class="tp-tabs">
        <!-- ==================== 我的班级 ==================== -->
        <el-tab-pane label="我的班级" name="class">
          <div class="tp-class">
            <aside class="tp-class__side">
              <div class="tp-side__head">
                <span>我的班级</span>
                <!-- 班级由管理员统一维护（后台 学生管理 → 教师 → 配置班级），老师端只读 -->
                <ReTag size="small" type="info">管理员配置</ReTag>
              </div>
              <ul class="tp-class__list">
                <li
                  v-for="c in classes"
                  :key="c.classId"
                  :class="{ active: c.classId === activeClassId }"
                  @click="selectClass(c.classId)"
                >
                  <div class="tp-class__name">{{ c.className }}</div>
                  <div class="tp-class__meta">
                    {{ gradeLevelLabel(c.classGradeLevel) }} · {{ c.classGrade || "—" }}
                  </div>
                </li>
                <li v-if="!classes.length" class="tp-empty">还没有班级，请联系管理员在后台「学生管理 → 教师」配置</li>
              </ul>
            </aside>

            <div class="tp-class__main">
              <div class="tp-main__head">
                <span class="tp-main__title">{{ activeClass?.className || "请选择班级" }}</span>
                <div class="tp-main__act">
                  <!-- 班级由管理员维护：老师端只在配置给自己的班级内增删改学生 -->
                  <el-button size="small" type="primary" :disabled="!activeClass" @click="openStudentDialog()">新增学生</el-button>
                </div>
              </div>

              <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
                   边框样式（border 走 ReTable 默认 true）；分页/工具栏关闭（原表没有）；
                   minHeight:0 关掉 fill 与空态 440px 强撑；v-loading → :loading。下同。 -->
              <ReTable
                :loading="stuLoading"
                :data="students"
                :columns="studentColumns"
                size="small"
                class="tp-table"
                engine="element"
                :layout-table="{ minHeight: 0 }"
                :config="{ toolbar: { enable: false } }"
              >
                <template #col-studentAccount="{ row }">
                  <span v-if="row.studentAccount">{{ row.studentAccount }}</span>
                  <ReTag v-else size="small" type="info">未绑定</ReTag>
                </template>
                <template #col-studentStatus="{ row }">{{ row.studentStatus === 1 ? "在读" : "离校" }}</template>
                <template #col-studentActions="{ row }">
                  <el-button link type="primary" @click.stop="openStudentDialog(row)">编辑</el-button>
                  <el-button link type="warning" @click.stop="openResetDialog(row)">重置口令</el-button>
                  <el-button link type="danger" @click.stop="removeStudent(row)">删除</el-button>
                </template>
              </ReTable>
            </div>
          </div>
        </el-tab-pane>

        <!-- ==================== 组卷 ==================== -->
        <el-tab-pane label="组卷" name="paper">
          <div class="tp-toolbar">
            <el-select v-model="paperFilter.subject" placeholder="学科" clearable size="default" style="width: 140px">
              <el-option v-for="s in dropdown.subjects" :key="s.subjectCode" :label="s.subjectName" :value="s.subjectName" />
            </el-select>
            <el-select v-model="paperFilter.gradeLevel" placeholder="学段" clearable size="default" style="width: 130px">
              <el-option v-for="g in dropdown.gradeLevels" :key="g.value" :label="g.label" :value="g.label" />
            </el-select>
            <el-button @click="loadPapers">查询</el-button>
            <div class="tp-toolbar__spacer" />
            <el-tooltip :disabled="aiAvailable" :content="aiReason" placement="top">
              <span>
                <el-button type="success" :disabled="!aiAvailable" @click="openAiDialog">AI 组卷</el-button>
              </span>
            </el-tooltip>
            <el-button type="primary" @click="goCompose">手动组卷</el-button>
            <el-button @click="qUploadVisible = true">上传题目</el-button>
          </div>

          <ReTable
            :loading="paperLoading"
            :data="papers"
            :columns="paperColumns"
            size="small"
            class="tp-table"
            engine="element"
            :layout-table="{ minHeight: 0 }"
            :config="{ toolbar: { enable: false } }"
          >
            <template #col-paperGradeLevel="{ row }">{{ gradeLevelLabel(row.paperGradeLevel) }}</template>
            <template #col-paperSource="{ row }">
              <ReTag size="small" :type="row.paperSource === 'AI' ? 'success' : 'info'">{{ row.paperSource }}</ReTag>
            </template>
            <!-- 创建人：教师创建的试卷标注「xx老师」，其余按类型展示 -->
            <template #col-paperCreator="{ row }">
              <ReTag size="small" effect="plain" :type="creatorTagType(row)">{{ creatorLabel(row) }}</ReTag>
            </template>
            <template #col-paperStatus="{ row }">
              <ReTag size="small" :type="paperStatusType(row.paperStatus)">{{ paperStatusLabel(row.paperStatus) }}</ReTag>
            </template>
            <template #col-paperActions="{ row }">
              <el-button link type="primary" @click.stop="goCompose(row)">组卷</el-button>
              <!-- 布置：把这张卷发给自己的某个班级，班内学生端「我的试卷」即可看到。
                   未发布的卷点布置会先提示发布（学生端只显示已发布的卷）。
                   类名 tp-assign-open 是稳定钩子：与「发布」同为 success 色，
                   只靠文本/颜色定位在自动化里会点错行。 -->
              <el-button link type="success" class="tp-assign-open" @click.stop="openAssign(row)">布置给班级</el-button>
              <el-button v-if="paperStatusCode(row) === 0" link type="success" @click.stop="publishPaper(row)">发布</el-button>
              <el-button v-else-if="paperStatusCode(row) === 1" link type="warning" @click.stop="unpublishPaper(row)">下架</el-button>
              <el-button v-if="paperStatusCode(row) !== 2" link @click.stop="archivePaper(row)">归档</el-button>
            </template>
          </ReTable>

          <!-- 已布置记录：谁把哪张卷布置到了哪个班，可撤回（撤回后学生端立即看不到） -->
          <div class="tp-assign">
            <div class="tp-assign__head">
              <h3 class="tp-assign__title">我布置的试卷</h3>
              <el-button link type="primary" :loading="assignLoading" @click="loadAssigns">刷新</el-button>
            </div>
            <ReTable
              :loading="assignLoading"
              :data="assigns"
              :columns="assignColumns"
              size="small"
              class="tp-table"
              engine="element"
              :layout-table="{ minHeight: 0 }"
              :config="{ toolbar: { enable: false } }"
            >
              <template #col-assignGradeLevel="{ row }">{{ gradeLevelLabel(row.paperGradeLevel) }}</template>
              <template #col-assignStatus="{ row }">
                <ReTag size="small" :type="row.assignStatus === 1 ? 'success' : 'info'">
                  {{ row.assignStatus === 1 ? "已布置" : "已撤回" }}
                </ReTag>
              </template>
              <template #col-assignActions="{ row }">
                <el-button v-if="row.assignStatus === 1" link type="danger" @click.stop="revokeAssign(row)">撤回</el-button>
              </template>
              <template #empty>
                <span class="tp-empty-text">还没有布置过试卷 —— 在上表点「布置给班级」即可</span>
              </template>
            </ReTable>
          </div>
        </el-tab-pane>

        <!-- ==================== 阅卷 ==================== -->
        <!-- 整套阅卷（工具栏 / 记录列表 / 详情 / 上传 / 分布）收敛到 MarkingWorkbench，
             与管理端共用同一套 UI 与样式；mode=teacher 只保留老师可用的操作 -->
        <el-tab-pane label="阅卷" name="mark">
          <MarkingWorkbench mode="teacher" :students="students" />
        </el-tab-pane>
      </el-tabs>
    </section>

    <!-- 学生弹框 -->
    <ReDialog v-model="stuDialog.visible" :title="stuDialog.id ? '编辑学生' : '新增学生'" width="480px">
      <el-form :model="stuDialog" label-width="90px">
        <el-form-item label="姓名" required>
          <el-input v-model="stuDialog.name" placeholder="学生姓名" />
        </el-form-item>
        <el-form-item label="家长手机号">
          <el-input v-model="stuDialog.phone" placeholder="11 位手机号，可留空" />
        </el-form-item>
        <el-form-item label="入学年份">
          <ReInputNumber
            :model-value="stuDialog.enrollYear ?? undefined"
            :min="2000"
            :max="2100"
            controls-position="right"
            @update:model-value="(v?: number) => (stuDialog.enrollYear = v ?? null)"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="stuDialog.idCard" placeholder="可留空" />
        </el-form-item>
        <el-form-item v-if="!stuDialog.id" label="初始口令">
          <el-input v-model="stuDialog.pwd" type="password" show-password placeholder="留空则用系统默认口令" />
        </el-form-item>
        <p class="tp-tip">学号由系统自动生成，学生用学号登录学生端。</p>
      </el-form>
      <template #footer>
        <el-button @click="stuDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitStudent">保存</el-button>
      </template>
    </ReDialog>

    <!-- 重置口令弹框 -->
    <ReDialog v-model="resetDialog.visible" title="重置学生口令" width="420px">
      <el-form :model="resetDialog" label-width="80px">
        <el-form-item label="学生">
          <span>{{ resetDialog.name }}</span>
        </el-form-item>
        <el-form-item label="新口令" required>
          <el-input v-model="resetDialog.pwd" type="password" show-password placeholder="新登录口令" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitReset">确认重置</el-button>
      </template>
    </ReDialog>

    <!-- AI 组卷弹框 -->
    <ReDialog v-model="aiDialog.visible" title="AI 组卷" width="460px">
      <el-form :model="aiDialog" label-width="90px">
        <el-form-item label="试卷名称" required>
          <el-input v-model="aiDialog.name" placeholder="如 三年级数学期末卷" />
        </el-form-item>
        <el-form-item label="学科" required>
          <el-select v-model="aiDialog.subject" placeholder="选择学科" style="width: 100%">
            <el-option v-for="s in dropdown.subjects" :key="s.subjectCode" :label="s.subjectName" :value="s.subjectName" />
          </el-select>
        </el-form-item>
        <el-form-item label="学段" required>
          <el-select v-model="aiDialog.gradeLevel" placeholder="选择学段" style="width: 100%">
            <el-option v-for="g in dropdown.gradeLevels" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="aiDialog.grade" placeholder="选择年级" style="width: 100%">
            <el-option v-for="g in gradesFor(aiDialog.gradeLevel)" :key="g.gradeName" :label="g.gradeName" :value="g.gradeName" />
          </el-select>
        </el-form-item>
        <el-form-item label="题数">
          <ReInputNumber v-model="aiDialog.questionCount" :min="1" :max="100" controls-position="right" />
        </el-form-item>
        <el-form-item label="每题分值">
          <ReInputNumber v-model="aiDialog.scorePerQuestion" :min="1" :max="100" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="aiDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doGenerate">生成</el-button>
      </template>
    </ReDialog>

    <!-- 布置试卷到班级：只列出「我名下的班级」（后端同样按登录态校验，前端只是提前拦） -->
    <ReDialog v-model="assignDialog.visible" title="布置试卷到班级" width="460px">
      <el-form label-width="72px">
        <el-form-item label="试卷">
          <span class="tp-dialog-static">{{ assignDialog.paperName || "—" }}</span>
        </el-form-item>
        <el-form-item label="班级" required>
          <!-- filterable：班级数会随学期累积，长列表里靠滚动找班很容易点错行；
               支持输入过滤后，直接打班名即可定位。 -->
          <el-select v-model="assignDialog.classId" filterable placeholder="选择我的班级" style="width: 100%">
            <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assignDialog.remark" maxlength="200" show-word-limit placeholder="如：本周五前完成（可不填）" />
        </el-form-item>
        <el-alert
          v-if="!classes.length"
          type="warning"
          :closable="false"
          title="你还没有班级，请先在「我的班级」新建一个"
        />
      </el-form>
      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="assignSaving" :disabled="!assignDialog.classId" @click="submitAssign">
          布置
        </el-button>
      </template>
    </ReDialog>

    <!-- 手动组卷：门户内嵌弹窗（不再 router.push 跳后台路由；
         embedded 下初始值走 props、返回 emit('back') 关闭本弹窗） -->
    <ReDialog v-model="composeVisible" title="手动组卷" fullscreen destroy-on-close>
      <div class="tp-compose-stage">
        <PaperComposeView
          v-if="composeVisible"
          embedded
          :init-paper-id="composePaperId ?? undefined"
          :init-subject="paperFilter.subject || undefined"
          :init-grade-level="paperFilter.gradeLevel || undefined"
          @back="composeVisible = false"
        />
      </div>
    </ReDialog>

    <!-- 老师上传题目：默认进待审核队列，管理员可配自动通过 -->
    <ReDialog v-model="qUploadVisible" title="老师上传题目" width="560px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="题目 JSON" required>
          <el-input
            v-model="qUploadText"
            type="textarea"
            :rows="12"
            placeholder='粘贴题目 JSON 数组，格式与批量导入一致：[{"questionType":"SINGLE_CHOICE","questionSubject":"数学","questionGradeLevel":"PRIMARY","questionStem":"题干…"}]'
          />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          title="上传后默认进入待审核队列，管理员在题库「审核状态」审批；若管理员开启「老师上传自动通过」则直接入库"
        />
      </el-form>
      <template #footer>
        <el-button @click="qUploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="qUploading" :disabled="!qUploadText.trim()" @click="submitTeacherQuestions">
          上传
        </el-button>
      </template>
    </ReDialog>

    <!-- 统一确认弹窗（替代 ElMessageBox.confirm：原生消息框层级独立，会破坏老师端全屏布局） -->
    <ReConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherPortalView —— 教师工作台（/edu/teacher）
 *
 * <p>能力：管理后台配置给我的班级学生、组卷（手动组卷为门户内嵌弹窗，
 * 不跳后台路由）、阅卷（共享组件）、老师上传题目（待审核）。
 * 归属全部取自登录态：班级范围 = 后台 edu_teacher_class 配置，
 * 试卷与阅卷任务由后端按 owner 隔离，前端不传、也传不了别人的 ID 去越权。</p>
 *
 * <p>本页与管理端共用后端接口：组卷走 {@code /v2/edu/paper/**}、阅卷走
 * {@code /v2/edu/marking/**}，只有「班级学生」与「字典下拉」走教师中心专用端点
 * （管理端的维度接口是管理员专属，教师令牌会 403）。</p>
 */
import { message } from "@repo/core";
import { clearAllAuthData } from "@repo/utils";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { eduaiApi } from "../../api/eduaiApi";
import type {
  DimensionDropdown,
  EduClass,
  EduStudent,
  Paper,
  PaperAssignVO,
  TeacherOverview,
} from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";
import ReInputNumber from "@repo/ui/re-input-number";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import PaperComposeView from "../PaperComposeView.vue";
import MarkingWorkbench from "../../components/marking/MarkingWorkbench.vue";
import ReConfirmDialog from "../../components/shared/ReConfirmDialog.vue";

/** 统一确认弹窗实例（删除学生 / 撤回布置 / 归档等二次确认） */
const confirmDialog = ref<InstanceType<typeof ReConfirmDialog> | null>(null);

/** 路由实例：退出登录后回登录页（不整页刷新，避免闪白） */
const router = useRouter();

/** 学段码值 → 中文标签（试卷/班级展示共用） */
const GRADE_LEVEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "PRIMARY", label: "小学" },
  { value: "JUNIOR", label: "初中" },
  { value: "SENIOR", label: "高中" },
  { value: "UNIVERSITY", label: "大学" },
  { value: "OTHER", label: "其他" },
];

const tab = ref<"class" | "paper" | "mark">("class");

/* ==================== 绑定 / 概览 ==================== */
const binding = ref(false);
const bindError = ref("");
/** null = 绑定态未知（/teacher/me 尚未返回），此期间不挂载 Tabs，避免抢发只对已绑定教师开放的接口 */
const needBind = ref<boolean | null>(null);
const overview = ref<TeacherOverview | null>(null);
const bindForm = reactive({ teacherNo: "", teacherName: "", subjectCode: "" });
const dropdown = ref<DimensionDropdown>({ gradeLevels: [], subjects: [], grades: [] });

const teacherName = computed(() => overview.value?.teacher?.teacherName || "老师");
const classCount = computed(() => classes.value.length);
const studentCount = computed(() => overview.value?.studentCount ?? 0);
const boundCount = computed(() =>
  (overview.value?.classes ?? []).reduce((acc, c) => acc + (c.boundCount ?? 0), 0)
);

/* ==================== 班级 / 学生 ==================== */
const classes = ref<EduClass[]>([]);
const activeClassId = ref<number | null>(null);
const students = ref<EduStudent[]>([]);
const stuLoading = ref(false);
const saving = ref(false);
const activeClass = computed(() => classes.value.find((c) => c.classId === activeClassId.value) ?? null);

/** 学生表列配置（原模板里的 el-table-column 收敛到数组；带 #default 的列配 slot + #col-<slot>） */
const studentColumns: ReTableColumn[] = [
  { prop: "studentNo", label: "学号", width: 150 },
  { prop: "studentName", label: "姓名", width: 110 },
  { prop: "studentParentPhone", label: "家长手机号", width: 130 },
  { prop: "studentAccount", label: "登录账号", width: 150, slot: "studentAccount" },
  { prop: "studentStatus", label: "状态", width: 80, slot: "studentStatus" },
  { prop: "studentActions", label: "操作", minWidth: 210, slot: "studentActions" },
];

const stuDialog = reactive({
  visible: false,
  id: null as number | null,
  name: "",
  phone: "",
  enrollYear: new Date().getFullYear() as number | null,
  idCard: "",
  pwd: "",
});
const resetDialog = reactive({ visible: false, studentId: 0, name: "", pwd: "" });

/** 按学段过滤年级下拉 */
function gradesFor(level: string) {
  if (!level) {
    return dropdown.value.grades;
  }
  return dropdown.value.grades.filter((g) => g.gradeLevel === level);
}

function gradeLevelLabel(code?: string | null): string {
  const s = code == null ? "" : String(code);
  if (!s) {
    return "—";
  }
  return GRADE_LEVEL_OPTIONS.find((o) => o.value === s || o.label === s)?.label ?? s;
}

/** 拉取绑定状态、概览、班级与字典 */
async function load() {
  try {
    const me = await eduaiApi.teacherMe();
    if (!me?.bound) {
      needBind.value = true;
      return;
    }
    needBind.value = false;
    overview.value = await eduaiApi.teacherOverview();
    classes.value = await eduaiApi.teacherClasses();
    if (!dropdown.value.gradeLevels.length) {
      void loadDropdown();
    }
    if (classes.value.length && activeClassId.value == null) {
      selectClass(classes.value[0].classId);
    }
  } catch (e) {
    message.error(`教师端数据加载失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/** 字典下拉（失败不阻断班级列表展示） */
async function loadDropdown() {
  try {
    dropdown.value = await eduaiApi.teacherDropdown();
  } catch {
    dropdown.value = { gradeLevels: [], subjects: [], grades: [] };
  }
}

async function doBind() {
  bindError.value = "";
  if (!bindForm.teacherNo.trim() || !bindForm.teacherName.trim()) {
    bindError.value = "请填写工号与姓名";
    return;
  }
  binding.value = true;
  try {
    await eduaiApi.teacherBind({
      teacherNo: bindForm.teacherNo.trim(),
      teacherName: bindForm.teacherName.trim(),
      subjectCode: bindForm.subjectCode.trim() || undefined,
    });
    message.success("绑定完成");
    await load();
    if (needBind.value === false) {
      void loadPapers();
      void loadAssigns();
      void loadAiCapability();
    }
  } catch (e) {
    bindError.value = e instanceof Error ? e.message : String(e);
  } finally {
    binding.value = false;
  }
}

/** 切换工号：清空绑定表单，回绑定界面 */
function unbind() {
  needBind.value = true;
  overview.value = null;
  classes.value = [];
  students.value = [];
  activeClassId.value = null;
  bindForm.teacherNo = "";
  bindForm.teacherName = "";
  bindForm.subjectCode = "";
}

/**
 * 退出登录：清掉本标签页的教师令牌与缓存后回登录页。
 *
 * <p>「切换工号」只是回到绑定表单、并不清登录态 —— 换人时上一个工号的
 * 令牌还留着，改回「切换工号」再绑另一个工号也仍带着旧令牌。
 * 共用的教师机上换人必须是真退出，所以补这个入口。</p>
 */
function logout() {
  clearAllAuthData();
  overview.value = null;
  classes.value = [];
  students.value = [];
  activeClassId.value = null;
  void router.replace("/edu/student-login");
}

function selectClass(classId: number) {
  activeClassId.value = classId;
  void loadStudents();
}

async function loadStudents() {
  if (activeClassId.value == null) {
    students.value = [];
    return;
  }
  stuLoading.value = true;
  try {
    students.value = await eduaiApi.teacherClassStudents(activeClassId.value);
  } catch (e) {
    message.error(`学生加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    stuLoading.value = false;
  }
}

function openStudentDialog(row?: EduStudent) {
  stuDialog.id = row?.studentId ?? null;
  stuDialog.name = row?.studentName ?? "";
  stuDialog.phone = row?.studentParentPhone ?? "";
  stuDialog.enrollYear = row?.studentEnrollYear ?? new Date().getFullYear();
  stuDialog.idCard = row?.studentIdCard ?? "";
  stuDialog.pwd = "";
  stuDialog.visible = true;
}

async function submitStudent() {
  if (activeClassId.value == null) {
    message.warning("请先选择班级");
    return;
  }
  if (!stuDialog.name.trim()) {
    message.warning("请填写学生姓名");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.saveTeacherStudent(activeClassId.value, {
      studentId: stuDialog.id ?? undefined,
      studentName: stuDialog.name.trim(),
      studentParentPhone: stuDialog.phone.trim() || undefined,
      studentEnrollYear: stuDialog.enrollYear ?? undefined,
      studentIdCard: stuDialog.idCard.trim() || undefined,
      studentPwdInput: stuDialog.id ? undefined : stuDialog.pwd || undefined,
    });
    message.success("已保存");
    stuDialog.visible = false;
    await Promise.all([loadStudents(), load()]);
  } catch (e) {
    message.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

function openResetDialog(row: EduStudent) {
  resetDialog.studentId = row.studentId;
  resetDialog.name = row.studentName || row.studentNo;
  resetDialog.pwd = "";
  resetDialog.visible = true;
}

async function submitReset() {
  if (!resetDialog.pwd) {
    message.warning("请输入新口令");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.resetTeacherStudentPassword(resetDialog.studentId, resetDialog.pwd);
    message.success("口令已重置");
    resetDialog.visible = false;
  } catch (e) {
    message.error(`重置失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeStudent(row: EduStudent) {
  // 统一确认弹窗（ReDialog 实现）：原生 ElMessageBox 的层级与老师端全屏层冲突
  const ok = await confirmDialog.value?.open(
    `确定删除学生「${row.studentName || row.studentNo}」吗？`,
    { title: "删除确认", danger: true },
  );
  if (!ok) {
    return;
  }
  try {
    await eduaiApi.deleteTeacherStudent(row.studentId);
    message.success("已删除");
    await Promise.all([loadStudents(), load()]);
  } catch (e) {
    message.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/* ==================== 组卷 ==================== */
const papers = ref<Paper[]>([]);
const paperLoading = ref(false);
const paperFilter = reactive({ subject: "", gradeLevel: "" });
const aiAvailable = ref(false);
const aiReason = ref("");
const aiDialog = reactive({
  visible: false,
  name: "",
  subject: "",
  gradeLevel: "",
  grade: "",
  questionCount: 10,
  scorePerQuestion: 10,
});

/** 试卷表列配置 */
const paperColumns: ReTableColumn[] = [
  { prop: "paperName", label: "试卷名称", minWidth: 200 },
  { prop: "paperSubject", label: "学科", width: 100 },
  { prop: "paperGradeLevel", label: "学段", width: 90, slot: "paperGradeLevel" },
  { prop: "paperQuestionCount", label: "题数", width: 70 },
  { prop: "paperTotalScore", label: "总分", width: 70 },
  { prop: "paperSource", label: "来源", width: 80, slot: "paperSource" },
  { prop: "paperCreator", label: "创建人", width: 130, slot: "paperCreator" },
  { prop: "paperStatus", label: "状态", width: 90, slot: "paperStatus" },
  { prop: "paperActions", label: "操作", minWidth: 300, slot: "paperActions" },
];

async function loadPapers() {
  paperLoading.value = true;
  try {
    const res = await eduaiApi.pagePapers({
      pageNum: 1,
      pageSize: 100,
      subject: paperFilter.subject || undefined,
      gradeLevel: paperFilter.gradeLevel || undefined,
    });
    papers.value = (res?.data ?? res?.records ?? []) as Paper[];
  } catch (e) {
    message.error(`试卷加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    paperLoading.value = false;
  }
}

/* ==================== 班级试卷布置 ==================== */

/** 我布置过的试卷（含已撤回的历史行，方便回看） */
const assigns = ref<PaperAssignVO[]>([]);
const assignLoading = ref(false);
const assignSaving = ref(false);
const assignDialog = reactive<{
  visible: boolean;
  paperId: number | null;
  paperName: string;
  classId: number | null;
  remark: string;
}>({
  visible: false,
  paperId: null,
  paperName: "",
  classId: null,
  remark: "",
});

/** 「我布置的试卷」表列配置 */
const assignColumns: ReTableColumn[] = [
  { prop: "paperName", label: "试卷", minWidth: 200, showOverflowTooltip: true },
  { prop: "className", label: "班级", width: 150, showOverflowTooltip: true },
  { prop: "assignGradeLevel", label: "学段", width: 90, slot: "assignGradeLevel" },
  { prop: "assignStatus", label: "状态", width: 90, slot: "assignStatus" },
  { prop: "assignTime", label: "布置时间", width: 180 },
  { prop: "assignActions", label: "操作", width: 100, slot: "assignActions" },
];

/**
 * 打开「布置到班级」对话框。
 *
 * <p>未发布的试卷先提示发布：后端的学生端查询只返回「已布置 + 试卷已发布」，
 * 现在布置了学生也看不到，不如当场说清楚，省得以为功能没生效。</p>
 *
 * @param row 试卷行
 */
function openAssign(row: Paper) {
  if (paperStatusCode(row) !== 1) {
    message.warning("请先把试卷「发布」，再布置给班级（未发布的试卷学生端看不到）");
    return;
  }
  assignDialog.paperId = row.paperId;
  assignDialog.paperName = row.paperName;
  assignDialog.classId = classes.value[0]?.classId ?? null;
  assignDialog.remark = "";
  assignDialog.visible = true;
}

/** 提交布置：同一班同一卷重复布置由后端「复活」已有行，不会堆出重复记录 */
async function submitAssign() {
  if (!assignDialog.paperId || !assignDialog.classId) {
    return message.warning("请选择班级");
  }
  assignSaving.value = true;
  try {
    await eduaiApi.assignPaperToClass({
      paperId: assignDialog.paperId,
      classId: assignDialog.classId,
      remark: assignDialog.remark.trim() || undefined,
    });
    message.success("已布置，班内学生现在能在学生端看到这份试卷");
    assignDialog.visible = false;
    await loadAssigns();
  } catch (e) {
    message.error(`布置失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    assignSaving.value = false;
  }
}

/** 我布置过的试卷 */
async function loadAssigns() {
  assignLoading.value = true;
  try {
    assigns.value = (await eduaiApi.myPaperAssigns()) || [];
  } catch (e) {
    message.error(`布置记录加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    assignLoading.value = false;
  }
}

/**
 * 撤回布置：软删（后端把状态置 0），学生端立即看不到。
 *
 * @param row 布置记录
 */
async function revokeAssign(row: PaperAssignVO) {
  const ok = await confirmDialog.value?.open(
    `撤回后「${row.className || "该班级"}」的学生将看不到《${row.paperName}》，确定吗？`,
    { title: "撤回布置", danger: true },
  );
  if (!ok) {
    return; // 用户取消
  }
  try {
    await eduaiApi.revokePaperAssign(row.assignId);
    message.success("已撤回");
    await loadAssigns();
  } catch (e) {
    message.error(`撤回失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/** AI 能力探测：不可用则禁用入口并展示原因 */
async function loadAiCapability() {
  try {
    const cap = await eduaiApi.aiCapability();
    aiAvailable.value = Boolean(cap?.available);
    aiReason.value = cap?.reason || "AI 组卷不可用";
  } catch {
    aiAvailable.value = false;
    aiReason.value = "AI 能力探测失败";
  }
}

function openAiDialog() {
  aiDialog.name = "";
  aiDialog.subject = paperFilter.subject || "";
  aiDialog.gradeLevel = "";
  aiDialog.grade = "";
  aiDialog.visible = true;
}

async function doGenerate() {
  if (!aiDialog.name.trim() || !aiDialog.subject || !aiDialog.gradeLevel) {
    message.warning("请填写试卷名称 / 学科 / 学段");
    return;
  }
  saving.value = true;
  try {
    const paperId = await eduaiApi.generatePaper({
      name: aiDialog.name.trim(),
      subject: aiDialog.subject,
      gradeLevel: aiDialog.gradeLevel,
      grade: aiDialog.grade,
      questionCount: aiDialog.questionCount,
      scorePerQuestion: aiDialog.scorePerQuestion,
      knowledgePointIds: [],
      typeConfigs: [],
    });
    message.success(`生成成功（试卷 ID ${paperId}）`);
    aiDialog.visible = false;
    await loadPapers();
  } catch (e) {
    message.error(`AI 组卷失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

/* ==================== 手动组卷（门户内嵌弹窗） ==================== */
/** 组卷弹窗可见性：老师端组卷收敛在门户内，不再 router.push 跳后台路由 */
const composeVisible = ref(false);
/** 组卷弹窗回读的试卷 ID（点「组卷」编辑已有卷时传入） */
const composePaperId = ref<number | null>(null);

/**
 * 打开手动组卷：不带 row = 空白新建；带 row = 回读该卷编辑。
 * PaperComposeView 以 embedded 挂载，返回时 emit('back') 关闭弹窗。
 *
 * @param row 试卷行（可选）
 */
function goCompose(row?: Paper) {
  composePaperId.value = row ? row.paperId : null;
  composeVisible.value = true;
}

const paperStatusCode = (row: Paper): number => Number(row.paperStatus ?? 0);
const paperStatusLabel = (n?: number) =>
  ({ 0: "草稿", 1: "已发布", 2: "已归档" })[Number(n ?? 0)] ?? "草稿";
const paperStatusType = (n?: number) => {
  const code = Number(n ?? 0);
  return code === 1 ? "success" : code === 2 ? "info" : "warning";
};

/* ==================== 创建人（教师 / 管理员 / 系统 / AI）====================
   与 PaperView 同一口径：后端返回 paperCreatorName + paperCreatorType，
   教师创建的试卷标注「xx老师」。Paper 类型未声明这两个新字段，按行结构读取。 */
const CREATOR_TYPE_LABELS: Record<string, string> = {
  TEACHER: "老师",
  ADMIN: "管理员",
  SYSTEM: "系统",
  AI: "AI 组卷",
};

const creatorLabel = (row: Paper): string => {
  const r = row as unknown as Record<string, unknown>;
  const type = String(r.paperCreatorType ?? "SYSTEM");
  const name = typeof r.paperCreatorName === "string" ? r.paperCreatorName.trim() : "";
  if (type === "TEACHER") {
    // 教师名可能自带「老师」后缀（如「验收老师」），再拼一次会变成「验收老师老师」
    if (!name) return "老师";
    return name.endsWith("老师") ? name : `${name}老师`;
  }
  const label = CREATOR_TYPE_LABELS[type] ?? CREATOR_TYPE_LABELS.SYSTEM;
  return name && name !== "系统" ? `${name}（${label}）` : label;
};

const creatorTagType = (row: Paper): string => {
  const r = row as unknown as Record<string, unknown>;
  const type = String(r.paperCreatorType ?? "SYSTEM");
  return (
    { TEACHER: "warning", ADMIN: "info", SYSTEM: "info", AI: "success" } as Record<string, string>
  )[type] ?? "info";
};

async function publishPaper(row: Paper) {
  try {
    await eduaiApi.publishPaper(row.paperId);
    message.success("已发布");
    await loadPapers();
  } catch (e) {
    message.error(`发布失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function unpublishPaper(row: Paper) {
  try {
    await eduaiApi.unpublishPaper(row.paperId);
    message.success("已下架");
    await loadPapers();
  } catch (e) {
    message.error(`下架失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function archivePaper(row: Paper) {
  const ok = await confirmDialog.value?.open(
    `确定归档「${row.paperName}」吗？归档后只读。`,
    { title: "归档确认", danger: true },
  );
  if (!ok) {
    return;
  }
  try {
    await eduaiApi.archivePaper(row.paperId);
    message.success("已归档");
    await loadPapers();
  } catch (e) {
    message.error(`归档失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/* ==================== 老师上传题目（待审核） ==================== */
/** 老师上传题目弹窗可见性 */
const qUploadVisible = ref(false);
/** 粘贴的题目 JSON 文本 */
const qUploadText = ref("");
const qUploading = ref(false);

/**
 * 提交老师上传的题目：JSON 数组解析后走教师专用端点。
 * 来源与审核态由服务端决定（来源=老师上传；审核态按
 * 「老师上传自动通过」配置），客户端传值一律不采信。
 */
async function submitTeacherQuestions() {
  const text = qUploadText.value.trim();
  if (!text) {
    message.warning("请粘贴题目 JSON");
    return;
  }
  let list: unknown;
  try {
    list = JSON.parse(text);
  } catch {
    message.warning("JSON 格式不正确，请检查后重试");
    return;
  }
  if (!Array.isArray(list) || !list.length) {
    message.warning("请粘贴非空的 JSON 数组");
    return;
  }
  qUploading.value = true;
  try {
    const res = await eduaiApi.teacherQuestionUpload(list);
    if (res.failedCount > 0) {
      message.error(
        `上传完成：成功 ${res.successCount} 条，失败 ${res.failedCount} 条（${res.errors.slice(0, 3).join("；")}）`,
      );
    } else if (res.autoApproved) {
      message.success(`上传成功 ${res.successCount} 条（管理员已配自动通过，直接入库）`);
    } else {
      message.success(`上传成功 ${res.successCount} 条，已进入待审核队列`);
    }
    qUploadVisible.value = false;
    qUploadText.value = "";
  } catch (e) {
    message.error(`上传失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    qUploading.value = false;
  }
}

onMounted(async () => {
  await load();
  if (needBind.value === false) {
    void loadPapers();
    void loadAssigns();
    void loadAiCapability();
  }
});
</script>

<style scoped>
/*
 * koi 令牌口径（与 PrimaryHome / StudentPortalView 一致）：
 *   品牌色带 = --el-color-primary → --el-color-primary-light-3
 *   页面底 = --el-bg-color-page，卡片面 = --el-bg-color
 *   圆角只走 --el-radius-* 六档，动画只走 --el-transition-duration
 * 卡片类容器不加投影；投影只用于「悬浮浮起」与「键盘焦点环」。
 */
.tp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  background: var(--el-bg-color-page);
}
.tp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 26px;
  flex-wrap: wrap;
  padding: 26px 34px 18px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
}
.tp-title {
  margin: 0;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
}
.tp-sub {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: color-mix(in srgb, var(--el-color-white) 92%, transparent);
}
.tp-sep {
  margin: 0 8px;
  opacity: 0.7;
}
.tp-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  min-width: min(420px, 100%);
}
.tp-stat__val {
  font-size: 34px;
  font-weight: 900;
  color: var(--el-color-white);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
.tp-stat__val.is-accent {
  color: color-mix(in srgb, var(--el-color-success) 30%, var(--el-color-white));
}
.tp-stat__lbl {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--el-color-white) 82%, transparent);
}
.tp-head__act {
  padding-top: 4px;
}
.tp-head__act :deep(.el-button) {
  color: var(--el-color-white);
}

.tp-body {
  margin: 18px 22px 22px;
  padding: 18px 22px 24px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  min-height: 50vh;
}
.tp-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

/* ----- 班级 ----- */
.tp-class {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 18px;
}
.tp-class__side {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  overflow: hidden;
}
.tp-side__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}
.tp-class__list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 62vh;
  overflow: auto;
}
.tp-class__list li {
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}
.tp-class__list li:hover {
  background: var(--el-fill-color-lighter);
}
.tp-class__list li.active {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-left: 3px solid var(--el-color-primary);
}
.tp-class__name {
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.tp-class__meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.tp-class__main {
  min-width: 0;
}
.tp-main__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.tp-main__title {
  font-size: 18px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.tp-main__act {
  display: flex;
  gap: 6px;
}
.tp-empty {
  cursor: default;
  padding: 30px 14px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 已布置记录区：与上方试卷表拉开距离，标题行右侧放「刷新」 */
.tp-assign {
  margin-top: 22px;
}

.tp-assign__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tp-assign__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 表格空态文案（el-table 的 #empty 插槽里） */
.tp-empty-text {
  display: inline-block;
  padding: 18px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 对话框里只读展示的试卷名 */
.tp-dialog-static {
  color: var(--el-text-color-regular);
}

/* ----- 工具条 ----- */
.tp-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.tp-toolbar__spacer {
  flex: 1;
}
.tp-table {
  width: 100%;
}

/* ----- 绑定 ----- */
.tp-bind {
  width: min(420px, 100%);
  margin: 20px auto;
  text-align: center;
}
.tp-bind__title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.tp-bind__sub {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.tp-bind :deep(.el-form-item) {
  text-align: left;
}
.tp-bind__btn {
  width: 100%;
}
.tp-bind__err {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-danger);
}

.tp-tip {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 900px) {
  .tp-class {
    grid-template-columns: minmax(0, 1fr);
  }
  .tp-head {
    padding: 18px 16px 14px;
  }
  .tp-title {
    font-size: 26px;
  }
  .tp-body {
    margin: 12px 10px 16px;
    padding: 14px 12px 18px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tp-class__list li {
    transition: none;
  }
}

/* 组卷弹窗舞台：全屏弹窗里给画布一个近似视口的可用高度
   （.compose-page 是 height:100% 的 flex 容器，需要定高父级才能铺满；
   弹窗头约 54px + 弹窗体上下内边距约 40px） */
.tp-compose-stage {
  height: calc(100vh - 100px);
}
</style>
