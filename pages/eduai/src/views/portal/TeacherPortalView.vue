<template>
  <!--
    教师工作台（/edu/teacher）
    独立全屏页面，脱离管理后台外壳。三大能力：
      1. 我的班级：新建/编辑班级，管理本班学生（增删改 + 重置口令）
      2. 组卷：查看我的试卷、AI 组卷、手动组卷、发布/下架/归档
      3. 阅卷：上传答卷 → AI 判分 → 复核确认；并列出我发起过的阅卷任务
    归属取自登录态：只能看到 / 操作自己创建的班级与自己的试卷与阅卷任务。
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
      </div>
    </header>

    <section class="tp-body">
      <!-- 未绑定：先绑定工号 -->
      <div v-if="needBind" class="tp-bind">
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

      <el-tabs v-else v-model="tab" class="tp-tabs">
        <!-- ==================== 我的班级 ==================== -->
        <el-tab-pane label="我的班级" name="class">
          <div class="tp-class">
            <aside class="tp-class__side">
              <div class="tp-side__head">
                <span>我的班级</span>
                <el-button size="small" type="primary" @click="openClassDialog()">新增</el-button>
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
                <li v-if="!classes.length" class="tp-empty">还没有班级，先新增一个</li>
              </ul>
            </aside>

            <div class="tp-class__main">
              <div class="tp-main__head">
                <span class="tp-main__title">{{ activeClass?.className || "请选择班级" }}</span>
                <div class="tp-main__act">
                  <el-button size="small" :disabled="!activeClass" @click="openClassDialog(activeClass)">编辑班级</el-button>
                  <el-button size="small" type="danger" plain :disabled="!activeClass" @click="removeClass">删除班级</el-button>
                  <el-button size="small" type="primary" :disabled="!activeClass" @click="openStudentDialog()">新增学生</el-button>
                </div>
              </div>

              <el-table v-loading="stuLoading" :data="students" size="small" border class="tp-table">
                <el-table-column prop="studentNo" label="学号" width="150" />
                <el-table-column prop="studentName" label="姓名" width="110" />
                <el-table-column prop="studentParentPhone" label="家长手机号" width="130" />
                <el-table-column label="登录账号" width="150">
                  <template #default="{ row }">
                    <span v-if="row.studentAccount">{{ row.studentAccount }}</span>
                    <el-tag v-else size="small" type="info">未绑定</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="80">
                  <template #default="{ row }">{{ row.studentStatus === 1 ? "在读" : "离校" }}</template>
                </el-table-column>
                <el-table-column label="操作" min-width="210">
                  <template #default="{ row }">
                    <el-button link type="primary" @click.stop="openStudentDialog(row)">编辑</el-button>
                    <el-button link type="warning" @click.stop="openResetDialog(row)">重置口令</el-button>
                    <el-button link type="danger" @click.stop="removeStudent(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
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
          </div>

          <el-table v-loading="paperLoading" :data="papers" size="small" border class="tp-table">
            <el-table-column prop="paperName" label="试卷名称" min-width="200" />
            <el-table-column prop="paperSubject" label="学科" width="100" />
            <el-table-column label="学段" width="90">
              <template #default="{ row }">{{ gradeLevelLabel(row.paperGradeLevel) }}</template>
            </el-table-column>
            <el-table-column prop="paperQuestionCount" label="题数" width="70" />
            <el-table-column prop="paperTotalScore" label="总分" width="70" />
            <el-table-column label="来源" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.paperSource === 'AI' ? 'success' : 'info'">{{ row.paperSource }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="paperStatusType(row.paperStatus)">{{ paperStatusLabel(row.paperStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="300">
              <template #default="{ row }">
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
            </el-table-column>
          </el-table>

          <!-- 已布置记录：谁把哪张卷布置到了哪个班，可撤回（撤回后学生端立即看不到） -->
          <div class="tp-assign">
            <div class="tp-assign__head">
              <h3 class="tp-assign__title">我布置的试卷</h3>
              <el-button link type="primary" :loading="assignLoading" @click="loadAssigns">刷新</el-button>
            </div>
            <el-table v-loading="assignLoading" :data="assigns" size="small" border class="tp-table">
              <el-table-column prop="paperName" label="试卷" min-width="200" show-overflow-tooltip />
              <el-table-column prop="className" label="班级" width="150" show-overflow-tooltip />
              <el-table-column label="学段" width="90">
                <template #default="{ row }">{{ gradeLevelLabel(row.paperGradeLevel) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.assignStatus === 1 ? 'success' : 'info'">
                    {{ row.assignStatus === 1 ? "已布置" : "已撤回" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="assignTime" label="布置时间" width="180" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button v-if="row.assignStatus === 1" link type="danger" @click.stop="revokeAssign(row)">撤回</el-button>
                </template>
              </el-table-column>
              <template #empty>
                <span class="tp-empty-text">还没有布置过试卷 —— 在上表点「布置给班级」即可</span>
              </template>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- ==================== 阅卷 ==================== -->
        <el-tab-pane label="阅卷" name="mark">
          <div class="tp-mark">
            <div class="tp-mark__form">
              <div class="tp-mark__row">
                <span class="tp-label">试卷</span>
                <el-select v-model="markForm.paperId" placeholder="任意卷可不选" clearable size="default" style="width: 260px">
                  <el-option v-for="p in papers" :key="p.paperId" :label="p.paperName" :value="p.paperId" />
                </el-select>
                <span class="tp-label">学生</span>
                <el-select v-model="markForm.studentId" placeholder="可留空" clearable filterable size="default" style="width: 200px">
                  <el-option v-for="s in students" :key="s.studentId" :label="`${s.studentName || ''} ${s.studentNo}`" :value="s.studentNo" />
                </el-select>
                <span class="tp-label">类型</span>
                <el-radio-group v-model="markForm.mode" size="default">
                  <el-radio-button value="SELF">自有卷</el-radio-button>
                  <el-radio-button value="ANY">任意卷</el-radio-button>
                </el-radio-group>
              </div>
              <div class="tp-mark__row">
                <span class="tp-label">答卷图片</span>
                <input ref="fileInput" type="file" accept="image/*" multiple @change="onPickFiles" />
                <span class="tp-mark__hint">已选 {{ markFiles.length }} 张（可多页）</span>
                <div class="tp-toolbar__spacer" />
                <el-button type="primary" :loading="marking" @click="startMarking">开始阅卷</el-button>
              </div>
            </div>

            <!-- 试卷详情：原始试卷 / 版面解析一体（组件内置切换）；改分在版面解析面板，AI 分保留 -->
            <div v-if="markResult" class="tp-mark__result">
              <div class="tp-mark__sum">
                试卷记录 · 任务 {{ markResult.taskId }} ·
                状态 {{ markResult.finished ? "已判分" : "判分中" }} ·
                AI 总分 <b>{{ markAiTotal }}</b> ·
                老师总分 <b>{{ markFinalTotal }}</b>
                <el-tag size="small" type="success" class="tp-mark__tag">老师为主</el-tag>
              </div>
              <div class="tp-mark__sheet">
                <SheetStructureView
                  :key="`${markResult.taskId}:${markSheetKey}`"
                  :task-id="markResult.taskId"
                  @saved="onMarkSaved"
                />
              </div>
            </div>

            <div class="tp-mark__tasks">
              <div class="tp-side__head">
                <span>我的阅卷记录（试卷）</span>
                <el-button size="small" @click="loadMarkTasks">刷新</el-button>
              </div>
              <el-table :data="markTasks" size="small" border class="tp-table">
                <el-table-column prop="markingTaskTaskId" label="任务号" min-width="190" show-overflow-tooltip />
                <el-table-column label="类型" width="80">
                  <template #default="{ row }">{{ row.markingTaskMode === "ANY" ? "任意卷" : "自有卷" }}</template>
                </el-table-column>
                <el-table-column label="试卷" min-width="140" show-overflow-tooltip>
                  <template #default="{ row }">{{ paperNameOf(row) }}</template>
                </el-table-column>
                <el-table-column label="学生" width="90" show-overflow-tooltip>
                  <template #default="{ row }">{{ row.markingTaskStudentId || "匿名" }}</template>
                </el-table-column>
                <el-table-column label="状态" width="90">
                  <template #default="{ row }">
                    <el-tag size="small" :type="taskStatusType(row.markingTaskStatus)">{{ taskStatusLabel(row.markingTaskStatus) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="AI 总分" width="80">
                  <template #default="{ row }">{{ taskScoreOf(row)?.ai ?? "—" }}</template>
                </el-table-column>
                <el-table-column label="老师总分" width="90">
                  <template #default="{ row }"><b class="tp-mark__td-final">{{ taskScoreOf(row)?.final ?? "—" }}</b></template>
                </el-table-column>
                <el-table-column prop="markingTaskStartTime" label="创建时间" min-width="150" />
                <el-table-column label="操作" width="90">
                  <template #default="{ row }">
                    <el-button link type="primary" @click.stop="loadTaskResult(row)">查看</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <!-- 班级弹框 -->
    <ReDialog v-model="classDialog.visible" :title="classDialog.id ? '编辑班级' : '新增班级'" width="420px">
      <el-form :model="classDialog" label-width="80px">
        <el-form-item label="班级名称" required>
          <el-input v-model="classDialog.className" placeholder="如 高一(3)班" />
        </el-form-item>
        <el-form-item label="学段">
          <el-select v-model="classDialog.gradeLevel" placeholder="选择学段" clearable style="width: 100%">
            <el-option v-for="g in dropdown.gradeLevels" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="classDialog.grade" placeholder="选择年级" clearable style="width: 100%">
            <el-option v-for="g in gradesFor(classDialog.gradeLevel)" :key="g.gradeName" :label="g.gradeName" :value="g.gradeName" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="classDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitClass">保存</el-button>
      </template>
    </ReDialog>

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
          <el-input-number v-model="stuDialog.enrollYear" :min="2000" :max="2100" controls-position="right" />
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
          <el-input-number v-model="aiDialog.questionCount" :min="1" :max="100" controls-position="right" />
        </el-form-item>
        <el-form-item label="每题分值">
          <el-input-number v-model="aiDialog.scorePerQuestion" :min="1" :max="100" controls-position="right" />
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
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherPortalView —— 教师工作台（/edu/teacher）
 *
 * <p>三大能力：管理我自己的班级学生、组卷、阅卷。归属全部取自登录态：
 * 班级按 {@code class_owner_user_id} 过滤，试卷与阅卷任务由后端按 owner 隔离，
 * 前端不传、也传不了别人的 ID 去越权。</p>
 *
 * <p>本页与管理端共用后端接口：组卷走 {@code /v2/edu/paper/**}、阅卷走
 * {@code /v2/edu/marking/**}，只有「班级学生」与「字典下拉」走教师中心专用端点
 * （管理端的维度接口是管理员专属，教师令牌会 403）。</p>
 */
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { eduaiApi } from "../../api/eduaiApi";
import type {
  DimensionDropdown,
  EduClass,
  EduStudent,
  MarkingResultVO,
  Paper,
  PaperAssignVO,
  TeacherMarkingTask,
  TeacherOverview,
} from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";
import SheetStructureView from "../../components/marking/SheetStructureView.vue";

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
const needBind = ref(false);
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

const classDialog = reactive({ visible: false, id: null as number | null, className: "", gradeLevel: "", grade: "" });
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
    ElMessage.error(`教师端数据加载失败：${e instanceof Error ? e.message : String(e)}`);
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
    ElMessage.success("绑定完成");
    await load();
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
    ElMessage.error(`学生加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    stuLoading.value = false;
  }
}

function openClassDialog(clazz?: EduClass | null) {
  classDialog.id = clazz?.classId ?? null;
  classDialog.className = clazz?.className ?? "";
  classDialog.gradeLevel = (clazz?.classGradeLevel as string) ?? "";
  classDialog.grade = (clazz?.classGrade as string) ?? "";
  classDialog.visible = true;
}

async function submitClass() {
  if (!classDialog.className.trim()) {
    ElMessage.warning("请填写班级名称");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.saveTeacherClass({
      classId: classDialog.id ?? undefined,
      className: classDialog.className.trim(),
      classGradeLevel: classDialog.gradeLevel || undefined,
      classGrade: classDialog.grade || undefined,
    });
    ElMessage.success("已保存");
    classDialog.visible = false;
    await load();
  } catch (e) {
    ElMessage.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeClass() {
  if (!activeClass.value) {
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除班级「${activeClass.value.className}」吗？`, "删除确认", {
      type: "warning",
    });
    await eduaiApi.deleteTeacherClass(activeClass.value.classId);
    ElMessage.success("已删除");
    activeClassId.value = null;
    await load();
  } catch (e) {
    if (e !== "cancel" && e !== "close") {
      ElMessage.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
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
    ElMessage.warning("请先选择班级");
    return;
  }
  if (!stuDialog.name.trim()) {
    ElMessage.warning("请填写学生姓名");
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
    ElMessage.success("已保存");
    stuDialog.visible = false;
    await Promise.all([loadStudents(), load()]);
  } catch (e) {
    ElMessage.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
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
    ElMessage.warning("请输入新口令");
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.resetTeacherStudentPassword(resetDialog.studentId, resetDialog.pwd);
    ElMessage.success("口令已重置");
    resetDialog.visible = false;
  } catch (e) {
    ElMessage.error(`重置失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeStudent(row: EduStudent) {
  try {
    await ElMessageBox.confirm(`确定删除学生「${row.studentName || row.studentNo}」吗？`, "删除确认", {
      type: "warning",
    });
    await eduaiApi.deleteTeacherStudent(row.studentId);
    ElMessage.success("已删除");
    await Promise.all([loadStudents(), load()]);
  } catch (e) {
    if (e !== "cancel" && e !== "close") {
      ElMessage.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
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
    ElMessage.error(`试卷加载失败：${e instanceof Error ? e.message : String(e)}`);
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
    ElMessage.warning("请先把试卷「发布」，再布置给班级（未发布的试卷学生端看不到）");
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
    return ElMessage.warning("请选择班级");
  }
  assignSaving.value = true;
  try {
    await eduaiApi.assignPaperToClass({
      paperId: assignDialog.paperId,
      classId: assignDialog.classId,
      remark: assignDialog.remark.trim() || undefined,
    });
    ElMessage.success("已布置，班内学生现在能在学生端看到这份试卷");
    assignDialog.visible = false;
    await loadAssigns();
  } catch (e) {
    ElMessage.error(`布置失败：${e instanceof Error ? e.message : String(e)}`);
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
    ElMessage.error(`布置记录加载失败：${e instanceof Error ? e.message : String(e)}`);
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
  try {
    await ElMessageBox.confirm(
      `撤回后「${row.className || "该班级"}」的学生将看不到《${row.paperName}》，确定吗？`,
      "撤回布置",
      { type: "warning" },
    );
  } catch {
    return; // 用户取消
  }
  try {
    await eduaiApi.revokePaperAssign(row.assignId);
    ElMessage.success("已撤回");
    await loadAssigns();
  } catch (e) {
    ElMessage.error(`撤回失败：${e instanceof Error ? e.message : String(e)}`);
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
    ElMessage.warning("请填写试卷名称 / 学科 / 学段");
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
    ElMessage.success(`生成成功（试卷 ID ${paperId}）`);
    aiDialog.visible = false;
    await loadPapers();
  } catch (e) {
    ElMessage.error(`AI 组卷失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

function goCompose(row?: Paper) {
  void router.push({
    path: "/eduai/paper-compose",
    query: row ? { paperId: String(row.paperId) } : {},
  });
}

const paperStatusCode = (row: Paper): number => Number(row.paperStatus ?? 0);
const paperStatusLabel = (n?: number) =>
  ({ 0: "草稿", 1: "已发布", 2: "已归档" })[Number(n ?? 0)] ?? "草稿";
const paperStatusType = (n?: number) => {
  const code = Number(n ?? 0);
  return code === 1 ? "success" : code === 2 ? "info" : "warning";
};

async function publishPaper(row: Paper) {
  try {
    await eduaiApi.publishPaper(row.paperId);
    ElMessage.success("已发布");
    await loadPapers();
  } catch (e) {
    ElMessage.error(`发布失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function unpublishPaper(row: Paper) {
  try {
    await eduaiApi.unpublishPaper(row.paperId);
    ElMessage.success("已下架");
    await loadPapers();
  } catch (e) {
    ElMessage.error(`下架失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function archivePaper(row: Paper) {
  try {
    await ElMessageBox.confirm(`确定归档「${row.paperName}」吗？归档后只读。`, "归档确认", { type: "warning" });
    await eduaiApi.archivePaper(row.paperId);
    ElMessage.success("已归档");
    await loadPapers();
  } catch (e) {
    if (e !== "cancel" && e !== "close") {
      ElMessage.error(`归档失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

/* ==================== 阅卷 ==================== */
const fileInput = ref<HTMLInputElement | null>(null);
const markFiles = ref<File[]>([]);
const marking = ref(false);
const markResult = ref<MarkingResultVO | null>(null);
const markTasks = ref<TeacherMarkingTask[]>([]);
/** 任务号 → 总分快照（列表展示用，已完成的任务后台补齐） */
const markTaskScores = ref<Record<string, { ai: number; final: number }>>({});
/** 结构视图刷新令牌：每次点「查看」或判分完成时递增，强制重挂载拿最新结构 */
const markSheetKey = ref(0);
const markForm = reactive({ paperId: null as number | null, studentId: "", mode: "SELF", maxScore: 100 });

/** AI 总分 / 老师总分：老师总分 = Σ(老师分 ?? AI 分)，老师为主（与后端 totalScore 同口径） */
const markAiTotal = computed(() => scoreOf(markResult.value).ai);
const markFinalTotal = computed(() => scoreOf(markResult.value).final);

function scoreOf(res: MarkingResultVO | null) {
  let ai = 0;
  let final = 0;
  for (const r of res?.results ?? []) {
    ai += Number(r.score ?? 0);
    final += Number(r.teacherScore ?? r.score ?? 0);
  }
  return { ai, final };
}

/** 记录列表里的试卷名：SELF 卷按 paperId 反查，ANY 卷标「任意卷」 */
function paperNameOf(row: TeacherMarkingTask) {
  if (row.markingTaskPaperId) {
    const hit = papers.value.find((p) => p.paperId === row.markingTaskPaperId);
    return hit?.paperName ?? `试卷#${row.markingTaskPaperId}`;
  }
  return row.markingTaskMode === "ANY" ? "任意卷" : "—";
}

const taskScoreOf = (row: TeacherMarkingTask) =>
  row.markingTaskTaskId ? markTaskScores.value[row.markingTaskTaskId] || null : null;

function onPickFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  markFiles.value = input.files ? Array.from(input.files) : [];
}

async function startMarking() {
  if (!markFiles.value.length) {
    ElMessage.warning("请选择答卷图片");
    return;
  }
  const form = new FormData();
  markFiles.value.forEach((f) => form.append("file", f));
  form.append("mode", markForm.mode);
  if (markForm.paperId != null) {
    form.append("paperId", String(markForm.paperId));
  }
  if (markForm.studentId) {
    form.append("studentId", markForm.studentId);
  }
  form.append("maxScore", String(markForm.maxScore));
  marking.value = true;
  try {
    const taskId = await eduaiApi.scanMarking(form);
    ElMessage.success("已提交，正在阅卷…");
    await pollResult(taskId);
    await loadMarkTasks();
  } catch (e) {
    ElMessage.error(`阅卷失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    marking.value = false;
  }
}

/** 轮询阅卷结果（最长约 2 分钟） */
async function pollResult(taskId: string) {
  for (let i = 0; i < 60; i++) {
    const res = await eduaiApi.getMarkingResult(taskId);
    markResult.value = res;
    if (res?.finished) {
      // 判分终态：重挂结构视图，把判分期间新增的题目/分数刷出来
      markSheetKey.value += 1;
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function loadTaskResult(row: TeacherMarkingTask) {
  try {
    // 每次点「查看」都重挂结构视图：避免复用旧缓存，看到别次改动前的分数
    markSheetKey.value += 1;
    markResult.value = await eduaiApi.getMarkingResult(row.markingTaskTaskId);
  } catch (e) {
    ElMessage.error(`结果加载失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/** 老师分保存成功：刷新汇总与记录列表（结构视图自身已重载） */
async function onMarkSaved() {
  if (!markResult.value) return;
  try {
    markResult.value = await eduaiApi.getMarkingResult(markResult.value.taskId);
  } catch {
    // 刷新失败保留旧值，保存动作本身已成功
  }
  void loadMarkTasks();
}

async function loadMarkTasks() {
  try {
    const rows = await eduaiApi.teacherMarkingTasks(30);
    markTasks.value = [...rows].sort((a, b) => (b.markingTaskId ?? 0) - (a.markingTaskId ?? 0));
  } catch {
    markTasks.value = [];
  }
  // 已完成的任务后台补齐 AI / 老师总分，不阻塞列表首屏
  void Promise.all(
    markTasks.value
      .filter((t) => Number(t.markingTaskStatus) === 2 && t.markingTaskTaskId && !markTaskScores.value[t.markingTaskTaskId])
      .map(async (t) => {
        try {
          const res = await eduaiApi.getMarkingResult(t.markingTaskTaskId);
          markTaskScores.value[t.markingTaskTaskId] = scoreOf(res);
        } catch {
          // 单条失败不影响列表其余行
        }
      })
  );
}

const taskStatusLabel = (n?: number) =>
  ({ 0: "待处理", 1: "处理中", 2: "已完成", 3: "失败" })[Number(n ?? 0)] ?? "待处理";
const taskStatusType = (n?: number) => {
  const code = Number(n ?? 0);
  return code === 2 ? "success" : code === 3 ? "danger" : code === 1 ? "warning" : "info";
};

onMounted(() => {
  void load();
  void loadPapers();
  void loadAssigns();
  void loadAiCapability();
  void loadMarkTasks();
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

/* ----- 阅卷 ----- */
.tp-mark__form {
  padding: 14px 16px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}
.tp-mark__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.tp-mark__row:last-child {
  margin-bottom: 0;
}
.tp-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-regular);
}
.tp-mark__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.tp-mark__sum {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.tp-mark__sum b {
  color: var(--el-color-primary);
  font-size: 18px;
}
.tp-mark__tag {
  margin-left: 8px;
}
.tp-mark__td-final {
  color: var(--el-color-success);
  font-weight: 700;
}
.tp-mark__sheet {
  height: 560px;
  padding: 4px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  overflow: hidden;
}
.tp-mark__tasks {
  margin-top: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  overflow: hidden;
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
</style>
