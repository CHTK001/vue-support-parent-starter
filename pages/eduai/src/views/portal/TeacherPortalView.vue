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
/*
 * koi 令牌口径（与 JuniorHome / PrimaryHome / SeniorHome / StudentPortalView 完全一致）：
 *   品牌色带 = --el-color-primary → --el-color-primary-light-3
 *   页面底   = --el-bg-color-page，卡片面 = --el-bg-color
 *   文字三级 = --el-text-color-primary / -regular / -secondary / -placeholder
 *   圆角只走 --el-radius-* 六档，动画只走 --el-transition-duration
 * 卡片类容器一律不加投影，投影只留给「悬浮浮起」与「键盘焦点环」两种反馈。
 */
.tp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  /* 顶部色带走主色令牌、底部页面底走页面令牌，换主题/切暗色时整页自动跟随 */
  background: linear-gradient(
    176deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 30%,
    var(--el-bg-color-page) 30.1%,
    var(--el-fill-color-lighter) 100%
  );
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
  color: var(--el-color-white);
  /* 白字压在主色带上的可读性靠描边阴影，暗色模式下色带更深，描边同样跟随 */
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.tp-sub {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 600;
  /* 色带上的白字不能换成 --el-text-color-primary（暗色下会变浅色失去对比），
     用 --el-color-white + color-mix 保留原来的 95% 透明度 */
  color: color-mix(in srgb, var(--el-color-white) 95%, transparent);
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
  color: var(--el-color-white);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
/* 深色带上的极浅绿强调：主色带会随主题变亮，纯 success 在浅色带上会读不出来，
   所以按「success 向白混 30%」派生，保证任何主题下都是浅色 */
.tp-stat__val.is-accent { color: color-mix(in srgb, var(--el-color-success) 30%, var(--el-color-white)); }
.tp-stat__lbl {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--el-color-white) 80%, transparent);
}

.tp-body {
  margin: 26px 26px 0;
  padding: 30px 30px 26px;
  /* 原 28px，最近档 16px（xl）；底部两角贴边所以保留 0 */
  border-radius: var(--el-radius-xl, 16px) var(--el-radius-xl, 16px) 0 0;
  background: var(--el-bg-color);
  min-height: 50vh;
}
.tp-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.tp-card {
  padding: 20px;
  /* 原 18px，最近档 16px（xl）；原 box-shadow 换成边框（koi 卡片不加投影） */
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
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
  color: var(--el-text-color-primary);
}
.tp-card__tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-radius: var(--el-radius-sm, 6px);
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
  color: var(--el-text-color-secondary);
}
.tp-card__row b {
  font-size: 18px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.tp-bar {
  height: 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.tp-bar__fill {
  display: block;
  height: 100%;
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  transition: width var(--el-transition-duration-fast, 0.2s) ease;
}
.tp-card__hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
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
  height: 46px;
  border: 0;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  /* 原来的常驻彩色投影属装饰性投影，koi 规约只留浮起与焦点环：
     静止态改平，把浮起反馈挪到 hover */
  transition: box-shadow var(--el-transition-duration-fast, 0.2s) ease;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.tp-bind__btn:hover:not(:disabled) {
  box-shadow: 0 10px 22px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}
.tp-bind__btn:focus-visible {
  /* 按钮本身就是主色渐变，纯 primary 12% 的焦点环会「糊」在同色背景上，
     补一圈白描边保证任何主题下都看得见（仍是 koi 焦点环，只是加一层对比环） */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent),
    0 0 0 5px var(--el-color-white);
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
/* 尊重系统「减少动态效果」偏好：关掉本页全部 transition */
@media (prefers-reduced-motion: reduce) {
  .tp-bind__btn,
  .tp-bar__fill {
    transition: none;
  }
}
</style>
