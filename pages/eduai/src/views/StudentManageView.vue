<template>
  <div class="page-container">
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">学生管理</h1>
          <p class="page-header__sub">
            维护学生、班级与教师档案；学生首次进「学生端」时用登录账号绑定自己的档案
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

    <el-card shadow="never" class="table-card">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- ============ 学生 ============ -->
        <el-tab-pane label="学生" name="student">
          <!-- 筛选区：与古诗库/成语库同构的 filter-card + filter-grid（带 label 的栅格） -->
          <el-card shadow="never" class="filter-card">
            <div class="filter-grid">
              <div class="filter-field">
                <label class="filter-field__label">关键字</label>
                <el-input
                  v-model="stuKeyword"
                  clearable
                  placeholder="姓名 / 学号 / 绑定账号"
                  :prefix-icon="Search"
                />
              </div>
              <div class="filter-field">
                <label class="filter-field__label">学段</label>
                <el-select v-model="stuLevel" clearable placeholder="全部学段" style="width: 100%">
                  <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </div>
              <div class="filter-field">
                <label class="filter-field__label">班级</label>
                <el-select v-model="stuClassId" clearable placeholder="全部班级" style="width: 100%">
                  <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
                </el-select>
              </div>
              <div class="filter-actions">
                <el-button type="primary" :icon="Plus" @click="openStudent()">新增学生</el-button>
                <el-button :icon="RefreshLeft" :loading="loading" @click="loadAll">刷新</el-button>
              </div>
            </div>
          </el-card>

          <el-table v-loading="loading" :data="filteredStudents" stripe row-key="studentId" @row-click="openStudent">
            <template #empty><el-empty :image-size="80" description="暂无学生，点击「新增学生」创建" /></template>
            <el-table-column prop="studentId" label="ID" width="70" />
            <el-table-column prop="studentNo" label="学号" width="150" show-overflow-tooltip />
            <el-table-column prop="studentName" label="姓名" width="120" />
            <el-table-column label="学段" width="90">
              <template #default="{ row }">{{ levelText(row.studentGradeLevel) }}</template>
            </el-table-column>
            <el-table-column prop="studentGrade" label="年级" width="100" />
            <el-table-column label="班级" min-width="140">
              <template #default="{ row }">{{ className(row.studentClassId) }}</template>
            </el-table-column>
            <el-table-column label="学生端绑定" width="140" align="center">
              <template #default="{ row }">
                <span class="tag-pill" :class="row.studentAccount ? 'is-green' : 'is-grey'">
                  {{ row.studentAccount ? "已绑定" : "未绑定" }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="studentAccount" label="绑定账号" width="140" show-overflow-tooltip />
            <el-table-column label="家长手机号" width="130">
              <template #default="{ row }">
                <span v-if="row.studentParentPhone">{{ row.studentParentPhone }}</span>
                <span v-else class="cell-muted">未填</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <span class="tag-pill" :class="row.studentStatus === 1 ? 'is-blue' : 'is-grey'">
                  {{ row.studentStatus === 1 ? "在读" : "离校" }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <ReButton
                  layout="square"
                  type="success"
                  :icon="View"
                  tip="代入该学生"
                  @click="impersonate(row)"
                />
                <ReButton layout="square" type="primary" :icon="EditPen" tip="编辑" @click="openStudent(row)" />
                <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click="removeStudent(row)" />
              </template>
            </el-table-column>
          </el-table>
          <div class="table-footer"><span class="table-footer__total">共 {{ filteredStudents.length }} 条</span></div>
        </el-tab-pane>

        <!-- ============ 班级 ============ -->
        <el-tab-pane :label="`班级 (${classes.length})`" name="class">
          <div class="filter-row">
            <el-button type="primary" :icon="Plus" @click="openClass()">新增班级</el-button>
            <el-button :icon="RefreshLeft" :loading="loading" @click="loadAll">刷新</el-button>
          </div>
          <el-table v-loading="loading" :data="classes" stripe row-key="classId" @row-click="openClass">
            <template #empty><el-empty :image-size="80" description="暂无班级" /></template>
            <el-table-column prop="classId" label="ID" width="70" />
            <el-table-column prop="classCode" label="班级编码" width="200" show-overflow-tooltip />
            <el-table-column prop="className" label="班级名称" min-width="160" />
            <el-table-column label="学段" width="90">
              <template #default="{ row }">{{ levelText(row.classGradeLevel) }}</template>
            </el-table-column>
            <el-table-column prop="classGrade" label="年级" width="110" />
            <el-table-column label="学生数" width="90" align="center">
              <template #default="{ row }">{{ studentsInClass(row.classId) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <ReButton layout="square" type="primary" :icon="EditPen" tip="编辑" @click="openClass(row)" />
                <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click="removeClass(row)" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ============ 教师 ============ -->
        <el-tab-pane :label="`教师 (${teachers.length})`" name="teacher">
          <div class="filter-row">
            <el-button type="primary" :icon="Plus" @click="openTeacher()">新增教师</el-button>
            <el-button :icon="RefreshLeft" :loading="loading" @click="loadAll">刷新</el-button>
          </div>
          <el-table v-loading="loading" :data="teachers" stripe row-key="teacherId" @row-click="openTeacher">
            <template #empty><el-empty :image-size="80" description="暂无教师" /></template>
            <el-table-column prop="teacherId" label="ID" width="70" />
            <el-table-column prop="teacherNo" label="工号" width="160" show-overflow-tooltip />
            <el-table-column prop="teacherName" label="姓名" width="130" />
            <el-table-column prop="teacherSubjectCode" label="任教学科" width="130" />
            <el-table-column label="老师端绑定" width="140" align="center">
              <template #default="{ row }">
                <span class="tag-pill" :class="row.teacherAccount ? 'is-green' : 'is-grey'">
                  {{ row.teacherAccount ? "已绑定" : "未绑定" }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <span class="tag-pill" :class="row.teacherStatus === 1 ? 'is-blue' : 'is-grey'">
                  {{ row.teacherStatus === 1 ? "在职" : "离职" }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <ReButton layout="square" type="primary" :icon="EditPen" tip="编辑" @click="openTeacher(row)" />
                <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click="removeTeacher(row)" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- ============ 学生对话框 ============ -->
    <el-dialog v-model="stuVisible" class="q-dialog" width="720" :show-close="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon"><el-icon :size="18"><Star /></el-icon></span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ stuForm.studentId ? "编辑学生" : "新增学生" }}</div>
              <div class="dialog-head__sub">学号是学生端绑定的关键字段，一旦启用不要随意修改</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="stuVisible = false" />
        </div>
      </template>
      <el-form :model="stuForm" label-width="96" @submit.prevent>
        <div class="form-grid form-grid--2">
          <el-form-item label="学号" required>
            <el-input v-model="stuForm.studentNo" placeholder="如 20240101" />
          </el-form-item>
          <el-form-item label="姓名" required>
            <el-input v-model="stuForm.studentName" placeholder="如 小明" />
          </el-form-item>
          <el-form-item label="学段">
            <el-select v-model="stuForm.studentGradeLevel" clearable placeholder="选择学段" style="width: 100%">
              <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="stuForm.studentGrade" clearable placeholder="选择年级" style="width: 100%">
              <el-option v-for="g in gradeSource" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
          <el-form-item label="班级">
            <el-select v-model="stuForm.studentClassId" clearable placeholder="选择班级" style="width: 100%">
              <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
            </el-select>
          </el-form-item>
          <el-form-item label="家长手机号">
            <el-input
              v-model="stuForm.studentParentPhone"
              maxlength="11"
              placeholder="学生端可用此号登录，非必填"
            />
          </el-form-item>
          <el-form-item label="登录密码">
            <el-input
              v-model="stuForm.studentPwdInput"
              type="password"
              show-password
              maxlength="32"
              :placeholder="stuForm.studentId ? '留空表示不修改' : '非必填，留空则暂不能登录'"
            />
          </el-form-item>
          <el-form-item label="入学年份">
            <el-input-number v-model="stuForm.studentEnrollYear" :min="2000" :max="2100" controls-position="right" style="width: 100%" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="stuForm.studentStatus">
              <el-radio-button :value="1">在读</el-radio-button>
              <el-radio-button :value="0">离校</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="绑定账号">
            <el-input
              :model-value="stuForm.studentAccount || (stuForm.studentNo ? `将自动设为 ${stuForm.studentNo}` : '（保存后按学号自动生成）')"
              disabled
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-foot">
          <el-button @click="stuVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveStudent">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 班级对话框 ============ -->
    <el-dialog v-model="clsVisible" class="q-dialog" width="560" :show-close="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon"><el-icon :size="18"><Grid /></el-icon></span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ clsForm.classId ? "编辑班级" : "新增班级" }}</div>
              <div class="dialog-head__sub">学生端登记时填的班级名会自动建立，这里可手工维护</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="clsVisible = false" />
        </div>
      </template>
      <el-form :model="clsForm" label-width="96" @submit.prevent>
        <el-form-item label="班级名称" required>
          <el-input v-model="clsForm.className" placeholder="如 三年二班" />
        </el-form-item>
        <el-form-item label="班级编码">
          <el-input v-model="clsForm.classCode" placeholder="留空自动生成" />
        </el-form-item>
        <div class="form-grid form-grid--2">
          <el-form-item label="学段">
            <el-select v-model="clsForm.classGradeLevel" clearable placeholder="选择学段" style="width: 100%">
              <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="clsForm.classGrade" clearable placeholder="选择年级" style="width: 100%">
              <el-option v-for="g in gradeSource" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="状态">
          <el-radio-group v-model="clsForm.classStatus">
            <el-radio-button :value="1">启用</el-radio-button>
            <el-radio-button :value="0">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-foot">
          <el-button @click="clsVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveClass">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 教师对话框 ============ -->
    <el-dialog v-model="teaVisible" class="q-dialog" width="560" :show-close="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon"><el-icon :size="18"><Reading /></el-icon></span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ teaForm.teacherId ? "编辑教师" : "新增教师" }}</div>
              <div class="dialog-head__sub">工号是老师端绑定的关键字段</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="teaVisible = false" />
        </div>
      </template>
      <el-form :model="teaForm" label-width="96" @submit.prevent>
        <el-form-item label="工号" required>
          <el-input v-model="teaForm.teacherNo" placeholder="如 T2024001" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="teaForm.teacherName" placeholder="如 王老师" />
        </el-form-item>
        <el-form-item label="任教学科">
          <el-input v-model="teaForm.teacherSubjectCode" placeholder="如 MATH" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="teaForm.teacherStatus">
            <el-radio-button :value="1">在职</el-radio-button>
            <el-radio-button :value="0">离职</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="绑定账号">
          <el-input :model-value="teaForm.teacherAccount || '（老师首次进老师端时自行绑定）'" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-foot">
          <el-button @click="teaVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveTeacher">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentManageView —— 学生管理（数据配置）
 *
 * 三个标签页：学生 / 班级 / 教师。对应关系是「学生挂班级、教师可带班级」，
 * 缺任何一块都录不进学生（班级是学生的必填归属）。
 *
 * 与「学生端」的分工：
 *   - 这里由**管理员**维护档案（建学生、分班、设学号）；
 *   - 学生本人首次进 /edu/student 时，用学号/姓名自己绑定登录账号
 *     （落到 edu_student.student_account），因此这里的「绑定账号」是只读状态。
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Grid, Plus, Reading, RefreshLeft, Search, Star, View } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { EduClass, EduStudent, EduTeacher } from "../api/types";

const loading = ref(false);
const saving = ref(false);
const activeTab = ref("student");

const students = ref<EduStudent[]>([]);
const classes = ref<EduClass[]>([]);
const teachers = ref<EduTeacher[]>([]);

/** 学段下拉：后端内置枚举 */
const levelOptions = ref<{ value: string; label: string }[]>([]);

// ---------- 学生筛选 ----------
const stuKeyword = ref("");
const stuLevel = ref("");
const stuClassId = ref<number | null>(null);

const filteredStudents = computed(() => {
  const kw = stuKeyword.value.trim().toLowerCase();
  return students.value.filter((s) => {
    if (stuLevel.value && s.studentGradeLevel !== stuLevel.value) return false;
    if (stuClassId.value && s.studentClassId !== stuClassId.value) return false;
    if (kw) {
      const hay = `${s.studentName ?? ""} ${s.studentNo ?? ""} ${s.studentAccount ?? ""}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
});

const statCards = computed(() => {
  const bound = students.value.filter((s) => !!s.studentAccount).length;
  return [
    { title: "学生总数", value: students.value.length, hint: `已绑定 ${bound} 人`, icon: "Star", bg: "var(--el-color-primary-light-9)" },
    { title: "班级数", value: classes.value.length, hint: `教师 ${teachers.value.length} 人`, icon: "Grid", bg: "var(--el-color-success-light-9)" },
    { title: "未绑定学生", value: students.value.length - bound, hint: "尚未登录学生端", icon: "Warning", bg: "var(--el-color-warning-light-9)" },
  ];
});

/**
 * 学段码转中文
 *
 * @param v 学段码
 * @returns 中文名
 */
function levelText(v?: string | null): string {
  if (!v) return "—";
  const hit = levelOptions.value.find((o) => o.value === v);
  return hit?.label ?? v;
}

/**
 * 班级 ID 转名称
 *
 * @param id 班级 ID
 * @returns 班级名，找不到时为 —
 */
function className(id?: number | null): string {
  if (!id) return "—";
  return classes.value.find((c) => c.classId === id)?.className ?? "—";
}

/**
 * 某班级下的学生数
 *
 * @param classId 班级 ID
 * @returns 人数
 */
function studentsInClass(classId: number): number {
  return students.value.filter((s) => s.studentClassId === classId).length;
}

// ==================== 加载 ====================
async function loadAll() {
  loading.value = true;
  try {
    const [stu, cls, tea] = await Promise.all([
      eduaiApi.listStudents(),
      eduaiApi.listClasses(),
      eduaiApi.listTeachers(),
    ]);
    students.value = stu ?? [];
    classes.value = cls ?? [];
    teachers.value = tea ?? [];
  } catch (e) {
    ElMessage.error(`加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    loading.value = false;
  }
}

async function loadLevels() {
  try {
    const drop = await eduaiApi.dimensionDropdown();
    levelOptions.value = drop?.gradeLevels ?? [];
  } catch {
    // 学段枚举拿不到不该让页面打不开：用一个最小兜底
    levelOptions.value = [
      { value: "PRIMARY", label: "小学" },
      { value: "JUNIOR", label: "初中" },
      { value: "SENIOR", label: "高中" },
    ];
  }
  syncGradeSource();
}

/**
 * 学段 → 年级 的对应表
 *
 * 后端 edu_grade 也存了年级，但那是「可选的运营维度」，拉一次要多一个请求；
 * 这里前端内置一份，理由是年级取值就是这 14 个固定值，且表单需要**随学段联动**
 * ——联动要求在用户改学段的瞬间就刷新下拉，走接口做不到这个时延。
 * 与 StudentPortalView.GRADES 保持同一份口径。
 */
const GRADES_BY_LEVEL: Record<string, string[]> = {
  PRIMARY: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  JUNIOR: ["初一", "初二", "初三"],
  SENIOR: ["高一", "高二", "高三"],
};

/**
 * 年级下拉的数据源：学段为空时给全集（避免用户必须先选学段才能填年级）
 *
 * 只在这里声明，不在此处注册 watch：stuForm / clsForm 在下面才 const 出来，
 * watch 的 getter 会立即执行，提前注册会撞 TDZ（Cannot access before initialization），
 * setup 直接抛错导致整个页面空白。注册动作见文件末尾。
 */
const gradeSource = ref<string[]>([]);
function syncGradeSource() {
  const level = stuForm.studentGradeLevel || clsForm.classGradeLevel;
  gradeSource.value = level ? (GRADES_BY_LEVEL[level] ?? []) : Object.values(GRADES_BY_LEVEL).flat();
}

function onTabChange() {
  // 三个表一次拉全，切标签不需要重新请求；这里只在数据为空时补拉
  if (!students.value.length && !classes.value.length && !teachers.value.length) {
    void loadAll();
  }
}

// ==================== 学生 ====================
const stuVisible = ref(false);
const stuForm = reactive<Partial<EduStudent>>({});

function openStudent(row?: EduStudent) {
  Object.keys(stuForm).forEach((k) => delete (stuForm as Record<string, unknown>)[k]);
  if (row) {
    Object.assign(stuForm, row);
  } else {
    Object.assign(stuForm, { studentStatus: 1, studentEnrollYear: new Date().getFullYear() });
  }
  // 编辑态不回填口令：后端只返回是否已设置，从不回显明文，
  // 这里显式清空以免把上一条记录的输入残留到下一条。
  stuForm.studentPwdInput = "";
  stuVisible.value = true;
}

/**
 * 代入指定学生：向管理员展示该学生看到的学生端页面。
 *
 * 走 oauth 的临时令牌能力 —— 令牌短期、只读、且被限制在学生端路径内，
 * 所以管理员能排查问题但既不会污染学生的学习记录，也碰不到管理端接口。
 * 令牌只在本次跳转的窗口里用一次，因此不写入本地存储（刷新即失效）。
 */
async function impersonate(row: EduStudent) {
  if (!row.studentId) return ElMessage.warning("该学生缺少标识，无法代入");
  try {
    const res = await eduaiApi.impersonateStudent({ studentId: row.studentId, expireSeconds: 300 });
    if (!res?.accessToken) {
      return ElMessage.error("签发临时令牌失败");
    }
    const url = `/edu/student?impersonate=${encodeURIComponent(res.accessToken)}`;
    const win = window.open(url, "_blank", "noopener");
    if (!win) {
      ElMessage.warning("浏览器拦截了新窗口，请允许弹窗后重试");
      return;
    }
    ElMessage.success(`已代入 ${row.studentName || row.studentNo}（5 分钟内有效）`);
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "代入失败");
  }
}

async function saveStudent() {
  if (!stuForm.studentNo?.trim()) return ElMessage.warning("请填写学号");
  if (!stuForm.studentName?.trim()) return ElMessage.warning("请填写姓名");
  // 家长手机号非必填，但填了就必须是 11 位手机号 —— 它将来是登录凭据，
  // 格式错的号会让家长永远登不进来且查不出原因，故在提交前就拦。
  const phone = stuForm.studentParentPhone?.trim() ?? "";
  if (phone && !/^1\d{10}$/.test(phone)) {
    return ElMessage.warning("家长手机号格式不对，应为 11 位手机号");
  }
  // 口令非必填（留空表示本次不改），但填了就要够长 —— 后端只存加盐摘要，
  // 填得太短等于给学生留一个一猜就中的账号，故在提交前就拦。
  const pwd = stuForm.studentPwdInput?.trim() ?? "";
  if (pwd && (pwd.length < 6 || pwd.length > 32)) {
    return ElMessage.warning("登录密码长度需为 6 到 32 位");
  }
  saving.value = true;
  try {
    await eduaiApi.saveStudent({
      ...stuForm,
      studentNo: stuForm.studentNo.trim(),
      studentName: stuForm.studentName.trim(),
      // 留空时传 undefined 而非空串：后端据此判定「本次不改口令」，
      // 传空串会被当成「设置成空口令」。
      studentPwdInput: pwd || undefined,
    });
    ElMessage.success("已保存");
    stuVisible.value = false;
    await loadAll();
  } catch (e) {
    ElMessage.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeStudent(row: EduStudent) {
  try {
    await ElMessageBox.confirm(
      `确定删除学生「${row.studentName ?? row.studentNo}」？其学习进度与每日汇总会一并清除，且不可恢复。`,
      "删除学生",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  try {
    const ok = await eduaiApi.deleteStudent(row.studentId);
    ElMessage[ok ? "success" : "warning"](ok ? "已删除" : "该记录已不存在");
    await loadAll();
  } catch (e) {
    ElMessage.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

// ==================== 班级 ====================
const clsVisible = ref(false);
const clsForm = reactive<Partial<EduClass>>({});

function openClass(row?: EduClass) {
  Object.keys(clsForm).forEach((k) => delete (clsForm as Record<string, unknown>)[k]);
  if (row) {
    Object.assign(clsForm, row);
  } else {
    Object.assign(clsForm, { classStatus: 1 });
  }
  clsVisible.value = true;
}

async function saveClass() {
  const name = clsForm.className?.trim() ?? "";
  if (!name) return ElMessage.warning("请填写班级名称");
  // 班名是业务唯一（后端有唯一索引兜底）。先在已加载列表里查一次重名，
  // 目的是把"唯一索引冲突"变成一句人话，而不是等请求失败才报。
  const dup = classes.value.find((c) => c.className === name && c.classId !== clsForm.classId);
  if (dup) return ElMessage.warning(`班级名称「${name}」已存在，请换一个名称`);
  saving.value = true;
  try {
    await eduaiApi.saveClass({
      ...clsForm,
      className: name,
      classCode: clsForm.classCode?.trim() || undefined,
    });
    ElMessage.success("已保存");
    clsVisible.value = false;
    await loadAll();
  } catch (e) {
    ElMessage.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeClass(row: EduClass) {
  const inClass = studentsInClass(row.classId);
  if (inClass > 0) {
    ElMessage.warning(`该班级下还有 ${inClass} 名学生，请先转班或删学生`);
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除班级「${row.className}」？`, "删除班级", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    const ok = await eduaiApi.deleteClass(row.classId);
    ElMessage[ok ? "success" : "warning"](ok ? "已删除" : "该记录已不存在");
    await loadAll();
  } catch (e) {
    ElMessage.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

// ==================== 教师 ====================
const teaVisible = ref(false);
const teaForm = reactive<Partial<EduTeacher>>({});

function openTeacher(row?: EduTeacher) {
  Object.keys(teaForm).forEach((k) => delete (teaForm as Record<string, unknown>)[k]);
  if (row) {
    Object.assign(teaForm, row);
  } else {
    Object.assign(teaForm, { teacherStatus: 1 });
  }
  teaVisible.value = true;
}

async function saveTeacher() {
  if (!teaForm.teacherNo?.trim()) return ElMessage.warning("请填写工号");
  if (!teaForm.teacherName?.trim()) return ElMessage.warning("请填写姓名");
  saving.value = true;
  try {
    await eduaiApi.saveTeacher({
      ...teaForm,
      teacherNo: teaForm.teacherNo.trim(),
      teacherName: teaForm.teacherName.trim(),
    });
    ElMessage.success("已保存");
    teaVisible.value = false;
    await loadAll();
  } catch (e) {
    ElMessage.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeTeacher(row: EduTeacher) {
  try {
    await ElMessageBox.confirm(`确定删除教师「${row.teacherName ?? row.teacherNo}」？`, "删除教师", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    const ok = await eduaiApi.deleteTeacher(row.teacherId);
    ElMessage[ok ? "success" : "warning"](ok ? "已删除" : "该记录已不存在");
    await loadAll();
  } catch (e) {
    ElMessage.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

// 学段一变，年级立刻跟着收窄：原来选中的年级若不在新学段里会被清空，
// 否则会存下「初中 + 一年级」这种自相矛盾的组合。
// 必须放在 stuForm / clsForm 声明之后 —— watch 的 getter 会立即求值，
// 声明之前注册会读到尚未初始化的 const（TDZ），setup 抛错、整页空白。
watch(() => stuForm.studentGradeLevel, syncGradeSource);
watch(() => clsForm.classGradeLevel, syncGradeSource);

onMounted(() => {
  // 首次也要同步一次：新建学生时表单是空的，年级下拉得有全集可选
  syncGradeSource();
  void loadLevels();
  void loadAll();
});
</script>

<style scoped>
/*
 * 版式基线对齐 PoemBankView / IdiomBankView：
 * page-container（整页滚动）→ top-zone（页头 + 悬浮方卡统计）→ filter-card → table-card。
 * 统计卡是 148×148 的正方形，卡内纵向排布，图标块落在右下角。
 */
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
.page-header__left {
  min-width: 0;
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

.stats-row {
  display: flex;
  flex-shrink: 0;
  gap: 14px;
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
.table-card {
  border-radius: var(--el-radius-lg, 12px);
  border: 0;
  position: relative;
  z-index: 1;
}
.table-card :deep(.el-card__body) {
  padding: 16px 20px 18px;
}

/*
 * 空态兜底下限：保证「暂无数据」有可读高度，不会退化成一条细缝。
 * Element Plus 默认只有 60px。
 */
.table-card :deep(.el-table__empty-block) {
  min-height: 180px;
}
/* ---------- 筛选卡（与古诗库/成语库同构） ---------- */
.filter-card {
  border-radius: var(--el-radius-lg, 12px);
  margin-bottom: 14px;
  border: 0;
  position: relative;
  z-index: 1;
}
.filter-card :deep(.el-card__body) {
  padding: 18px 20px;
}
.filter-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1.4fr) minmax(130px, 1fr) minmax(150px, 1fr) auto;
  gap: 14px;
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
  white-space: nowrap;
}
.filter-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.filter-actions .el-button {
  border-radius: var(--el-radius-lg, 12px);
  min-width: 88px;
  font-weight: 600;
}
/* 班级 / 教师页签没有筛选条件，只放操作键 */
.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.filter-row .el-button {
  border-radius: var(--el-radius-lg, 12px);
  font-weight: 600;
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
}
/* 空值占位：与「—」同类语义，但中文更直白 */
.cell-muted {
  color: var(--el-text-color-placeholder);
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
/* ---------- 弹窗：与古诗库/成语库同构 ---------- */
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
.form-grid {
  display: grid;
  gap: 0 14px;
}
.form-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
@media (max-width: 900px) {
  .form-grid--2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============
   统计卡有 transition / transform（ReButton 的动效由组件自身负责）。 */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  .stat-card:hover {
    transform: none;
  }
}
</style>
