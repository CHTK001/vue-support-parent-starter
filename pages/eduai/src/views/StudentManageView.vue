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
          <div class="filter-row">
            <el-input v-model="stuKeyword" clearable placeholder="姓名 / 学号 / 绑定账号" :prefix-icon="Search" style="width: 260px" />
            <el-select v-model="stuLevel" clearable placeholder="全部学段" style="width: 140px">
              <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-select v-model="stuClassId" clearable placeholder="全部班级" style="width: 180px">
              <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="openStudent()">新增学生</el-button>
            <el-button :icon="RefreshLeft" :loading="loading" @click="loadAll">刷新</el-button>
          </div>

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
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <span class="tag-pill" :class="row.studentStatus === 1 ? 'is-blue' : 'is-grey'">
                  {{ row.studentStatus === 1 ? "在读" : "离校" }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <button type="button" class="row-edit-btn" title="编辑" @click.stop="openStudent(row)">
                  <el-icon><EditPen /></el-icon>
                </button>
                <button type="button" class="row-del-btn" title="删除" @click.stop="removeStudent(row)">
                  <el-icon><Delete /></el-icon>
                </button>
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
                <button type="button" class="row-edit-btn" title="编辑" @click.stop="openClass(row)"><el-icon><EditPen /></el-icon></button>
                <button type="button" class="row-del-btn" title="删除" @click.stop="removeClass(row)"><el-icon><Delete /></el-icon></button>
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
                <button type="button" class="row-edit-btn" title="编辑" @click.stop="openTeacher(row)"><el-icon><EditPen /></el-icon></button>
                <button type="button" class="row-del-btn" title="删除" @click.stop="removeTeacher(row)"><el-icon><Delete /></el-icon></button>
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
          <button type="button" class="dialog-head__close" @click="stuVisible = false"><el-icon><Close /></el-icon></button>
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
            <el-input v-model="stuForm.studentGrade" placeholder="如 三年级" />
          </el-form-item>
          <el-form-item label="班级">
            <el-select v-model="stuForm.studentClassId" clearable placeholder="选择班级" style="width: 100%">
              <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
            </el-select>
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
            <el-input :model-value="stuForm.studentAccount || '（学生首次进学生端时自行绑定）'" disabled />
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
          <button type="button" class="dialog-head__close" @click="clsVisible = false"><el-icon><Close /></el-icon></button>
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
            <el-input v-model="clsForm.classGrade" placeholder="如 三年级" />
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
          <button type="button" class="dialog-head__close" @click="teaVisible = false"><el-icon><Close /></el-icon></button>
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
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Grid, Plus, Reading, RefreshLeft, Search, Star } from "@element-plus/icons-vue";
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
  stuVisible.value = true;
}

async function saveStudent() {
  if (!stuForm.studentNo?.trim()) return ElMessage.warning("请填写学号");
  if (!stuForm.studentName?.trim()) return ElMessage.warning("请填写姓名");
  saving.value = true;
  try {
    await eduaiApi.saveStudent({ ...stuForm, studentNo: stuForm.studentNo.trim(), studentName: stuForm.studentName.trim() });
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
  if (!clsForm.className?.trim()) return ElMessage.warning("请填写班级名称");
  saving.value = true;
  try {
    await eduaiApi.saveClass({
      ...clsForm,
      className: clsForm.className.trim(),
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

onMounted(() => {
  void loadLevels();
  void loadAll();
});
</script>

<style scoped>
.page-container {
  min-height: 100%;
  padding: 16px 18px 24px;
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
  border-radius: 14px;
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
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
}
.table-card {
  border-radius: 14px;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.table-footer {
  margin-top: 10px;
}
.table-footer__total {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.tag-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
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
.row-edit-btn,
.row-del-btn {
  width: 28px;
  height: 28px;
  margin: 0 3px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  transition: all 0.15s;
}
.row-edit-btn:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.row-del-btn:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
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
  border-radius: 10px;
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
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
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
@media (max-width: 900px) {
  .form-grid--2 {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
