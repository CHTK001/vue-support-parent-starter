<template>
  <div class="tp">
    <header class="tp-head">
      <div>
        <h1 class="tp-title">教师工作台</h1>
        <p class="tp-sub">
          {{ teacherName }}
          <span class="tp-sep">|</span>
          工号 {{ overview?.teacher?.teacherNo || "—" }}
        </p>
      </div>
      <div class="tp-stats">
        <div class="tp-stat">
          <div class="tp-stat__val">{{ overview?.classCount ?? 0 }}</div>
          <div class="tp-stat__lbl">我的班级</div>
        </div>
        <div class="tp-stat">
          <div class="tp-stat__val">{{ overview?.studentCount ?? 0 }}</div>
          <div class="tp-stat__lbl">学生人数</div>
        </div>
        <div class="tp-stat">
          <div class="tp-stat__val is-accent">{{ totalBound }}</div>
          <div class="tp-stat__lbl">已绑定账号</div>
        </div>
      </div>
    </header>

    <section class="tp-body">
      <template v-if="needBind">
        <div class="tp-bind">
          <h2 class="tp-bind__title">先绑定教师工号</h2>
          <p class="tp-bind__sub">绑定后才能看到你带的班级与学生。</p>
          <el-form :model="form" label-width="70" @submit.prevent>
            <el-form-item label="工号" required>
              <el-input v-model="form.teacherNo" placeholder="如 T2024001" />
            </el-form-item>
            <el-form-item label="姓名" required>
              <el-input v-model="form.teacherName" placeholder="如 王老师" />
            </el-form-item>
            <el-form-item label="学科">
              <el-input v-model="form.subjectCode" placeholder="如 MATH（可留空）" />
            </el-form-item>
          </el-form>
          <button type="button" class="tp-bind__btn" :disabled="binding" @click="doBind">
            {{ binding ? "提交中…" : "进入工作台" }}
          </button>
          <p v-if="bindError" class="tp-bind__err">{{ bindError }}</p>
        </div>
      </template>

      <template v-else>
        <div v-if="!classes.length" class="tp-empty">
          还没有班级。学生登记时填写的班级会自动学到这里。
        </div>
        <div v-else class="tp-grid">
          <div v-for="c in classes" :key="c.classId" class="tp-card">
            <div class="tp-card__head">
              <span class="tp-card__name">{{ c.className }}</span>
              <span class="tp-card__tag">{{ c.gradeLevel || "—" }}</span>
            </div>
            <div class="tp-card__rows">
              <div class="tp-card__row">
                <span>学生人数</span><b>{{ c.studentCount }}</b>
              </div>
              <div class="tp-card__row">
                <span>已绑定账号</span><b>{{ c.boundCount }}</b>
              </div>
            </div>
            <div class="tp-bar">
              <span
                class="tp-bar__fill"
                :style="{ width: c.studentCount ? Math.round((c.boundCount / c.studentCount) * 100) + '%' : '0%' }"
              />
            </div>
            <div class="tp-card__hint">绑定率 {{ c.studentCount ? Math.round((c.boundCount / c.studentCount) * 100) : 0 }}%</div>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * TeacherPortalView —— 老师端入口（/edu/teacher）
 *
 * 与管理端的区别：管理端维护全校的班级/学生/教师档案；
 * 老师端只看「我带的班级 + 每班人数与账号绑定率」，归属取自登录态。
 *
 * 同样用 position:fixed 铺满视口，脱离管理后台外壳。
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../../api/eduaiApi";
import type { TeacherClassRow, TeacherOverview } from "../../api/types";

const binding = ref(false);
const bindError = ref("");
const needBind = ref(false);
const overview = ref<TeacherOverview | null>(null);

const form = reactive({ teacherNo: "", teacherName: "", subjectCode: "" });

const classes = computed<TeacherClassRow[]>(() => overview.value?.classes ?? []);
const teacherName = computed(() => overview.value?.teacher?.teacherName || "老师");
const totalBound = computed(() => classes.value.reduce((acc, c) => acc + (c.boundCount ?? 0), 0));

/**
 * 拉取绑定状态与工作台数据
 */
async function load() {
  try {
    const me = await eduaiApi.teacherMe();
    if (!me?.bound) {
      needBind.value = true;
      return;
    }
    needBind.value = false;
    overview.value = await eduaiApi.teacherOverview();
  } catch (e) {
    ElMessage.error(`教师端数据加载失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 提交教师绑定
 */
async function doBind() {
  bindError.value = "";
  if (!form.teacherNo.trim() || !form.teacherName.trim()) {
    bindError.value = "请填写工号与姓名";
    return;
  }
  binding.value = true;
  try {
    await eduaiApi.teacherBind({
      teacherNo: form.teacherNo.trim(),
      teacherName: form.teacherName.trim(),
      subjectCode: form.subjectCode.trim() || undefined,
    });
    ElMessage.success("绑定完成");
    needBind.value = false;
    overview.value = await eduaiApi.teacherOverview();
  } catch (e) {
    bindError.value = e instanceof Error ? e.message : String(e);
  } finally {
    binding.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.tp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  background: linear-gradient(176deg, #0f766e 0%, #14b8a6 30%, #f0fdfa 30.1%, #f8fafc 100%);
}
.tp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 26px;
  flex-wrap: wrap;
  padding: 30px 44px 0;
}
.tp-title {
  margin: 0;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
}
.tp-sub {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}
.tp-sep {
  margin: 0 8px;
  opacity: 0.7;
}
.tp-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  min-width: min(460px, 100%);
  padding-top: 4px;
}
.tp-stat__val {
  font-size: 42px;
  font-weight: 900;
  color: #fff;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
.tp-stat__val.is-accent { color: #bbf7d0; }
.tp-stat__lbl {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

.tp-body {
  margin: 26px 26px 0;
  padding: 30px 30px 26px;
  border-radius: 28px 28px 0 0;
  background: #fff;
  min-height: 50vh;
}
.tp-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.tp-card {
  padding: 20px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}
.tp-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.tp-card__name {
  font-size: 19px;
  font-weight: 900;
  color: #0f172a;
}
.tp-card__tag {
  font-size: 11px;
  font-weight: 700;
  color: #0f766e;
  background: #ccfbf1;
  border-radius: 6px;
  padding: 1px 8px;
}
.tp-card__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.tp-card__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 13px;
  color: #64748b;
}
.tp-card__row b {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.tp-bar {
  height: 8px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.tp-bar__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #14b8a6 0%, #5eead4 100%);
}
.tp-card__hint {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}
.tp-empty {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.tp-bind {
  width: min(420px, 100%);
  margin: 10px auto;
  text-align: center;
}
.tp-bind__title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
}
.tp-bind__sub {
  margin: 0 0 16px;
  font-size: 13px;
  color: #64748b;
}
.tp-bind :deep(.el-form-item) {
  text-align: left;
}
.tp-bind__btn {
  width: 100%;
  height: 46px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #fff;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  box-shadow: 0 10px 22px rgba(20, 184, 166, 0.35);
}
.tp-bind__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.tp-bind__err {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-danger);
}
@media (max-width: 1100px) {
  .tp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 800px) {
  .tp-grid { grid-template-columns: minmax(0, 1fr); }
  .tp-head { padding: 20px 20px 0; }
  .tp-title { font-size: 30px; }
  .tp-body { margin: 18px 12px 0; padding: 20px 16px; }
}
</style>
