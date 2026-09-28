<template>
  <div class="portal">
    <!-- 未绑定：先弹绑定表单，绑完才放行 —— 进入系统就必须绑定信息 -->
    <div v-if="needBind" class="portal-bind">
      <div class="portal-bind__card">
        <!-- 书包 emoji 会被读屏念成「背包」这类冗余文本，改走 ReIcon -->
        <div class="portal-bind__icon"><ReIcon name="Notebook" :size="46" aria-hidden="true" /></div>
        <h2 class="portal-bind__title">先登记一下你的信息</h2>
        <p class="portal-bind__sub">
          学生端需要知道你是哪个学段、哪个班，才能给你看对的内容。
          学号或姓名填一次即可，之后自动记住。
        </p>

        <el-form :model="form" label-width="76" class="portal-bind__form" @submit.prevent>
          <el-form-item label="学号">
            <el-input v-model="form.studentNo" placeholder="如 20240101（没有可留空）" />
          </el-form-item>
          <el-form-item label="姓名" required>
            <el-input v-model="form.studentName" placeholder="如 小明" />
          </el-form-item>
          <el-form-item label="学段" required>
            <el-radio-group v-model="form.gradeLevel">
              <el-radio-button value="PRIMARY">小学</el-radio-button>
              <el-radio-button value="JUNIOR">初中</el-radio-button>
              <el-radio-button value="SENIOR">高中</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="form.grade" clearable placeholder="选择年级" style="width: 100%">
              <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
          <el-form-item label="班级">
            <el-input v-model="form.className" placeholder="如 三年二班（可留空）" />
          </el-form-item>
        </el-form>

        <button type="button" class="portal-bind__btn" :disabled="binding" @click="doBind">
          {{ binding ? "提交中…" : "进入学习" }}
        </button>
        <p v-if="bindError" class="portal-bind__err">{{ bindError }}</p>
      </div>
    </div>

    <!-- 已绑定：按学段渲染对应首页 -->
    <template v-else-if="overview?.bound">
      <PrimaryHome
        v-if="stage === 'PRIMARY'"
        :overview="overview"
        :modules="modules"
        @open="openModule"
      />
      <JuniorHome
        v-else-if="stage === 'JUNIOR'"
        :overview="overview"
        :modules="modules"
        @open="openModule"
      />
      <SeniorHome v-else :overview="overview" :modules="modules" @open="openModule" />
    </template>

    <div v-else class="portal-loading">加载中…</div>

    <!--
      模块内嵌层：学生点开模块时**不跳去管理后台**，直接在本层全屏渲染。
      若按模块路径跳路由，学生端（fixed 全屏）会卸载，露出管理后台的侧边栏与标签栏 ——
      学生会看到不该看的后台导航。这里改为就地挂载模块组件。
    -->
    <div v-if="activeModule" class="portal-embed">
      <button type="button" class="portal-embed__back" @click="activeModule = null">
        ← 返回{{ activeModule.title }}
      </button>
      <div class="portal-embed__body">
        <component :is="activeModule.component" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentPortalView —— 学生端入口（/edu/student）
 *
 * 两个职责：
 *   1. **进入即绑定**：未绑定时先弹登记表单，绑定成功后同一页直接进入学习首页，
 *      不需要再跳一次。绑定信息写在 edu_student.student_account（登录账号），
 *      一个账号只能绑一个学生。
 *   2. **按学段分流**：小学 / 初中 / 高中三套完全不同的首页，由档案里的
 *      student_grade_level 决定渲染哪一个，学生看不到也改不了。
 *
 * 页面用 position:fixed 铺满视口，脱离管理后台的侧边栏与标签栏 ——
 * 学生不该看到管理员那套导航。
 */
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../../api/eduaiApi";
import type { StudentOverview } from "../../api/types";
import { modulesOf, type PortalModule } from "./modules";
import PrimaryHome from "./PrimaryHome.vue";
import JuniorHome from "./JuniorHome.vue";
import SeniorHome from "./SeniorHome.vue";

const router = useRouter();

/**
 * 已实现、可嵌入学生端的模块
 *
 * key 是后台「模块管理」里的 moduleCode（稳定键，别改名）。
 * 新模块做好后在这里登记一行，学生端点卡片就能打开。
 */
const EMBEDDED: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  "idiom-game": defineAsyncComponent(() => import("../IdiomGameView.vue")),
};

/** 当前内嵌打开的模块；null 表示停留在学生端首页 */
const activeModule = ref<{
  code: string;
  title: string;
  component: ReturnType<typeof defineAsyncComponent>;
} | null>(null);

const GRADES: Record<string, string[]> = {
  PRIMARY: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  JUNIOR: ["初一", "初二", "初三"],
  SENIOR: ["高一", "高二", "高三"],
};

const loading = ref(true);
const binding = ref(false);
const bindError = ref("");
const needBind = ref(false);
const overview = ref<StudentOverview | null>(null);

const form = reactive({
  studentNo: "",
  studentName: "",
  gradeLevel: "PRIMARY",
  grade: "一年级",
  className: "",
});

const gradeOptions = computed(() => GRADES[form.gradeLevel] ?? []);
// 换学段时把年级拉回该学段的第一项，避免出现「高中 + 一年级」这种组合
watch(
  () => form.gradeLevel,
  (lv) => {
    const list = GRADES[lv] ?? [];
    if (!list.includes(form.grade)) {
      form.grade = list[0] ?? "";
    }
  },
);

const stage = computed(() => overview.value?.stage ?? form.gradeLevel);
/** 后端按学段配置的模块清单；取不到时回落到内置目录，保证页面不空 */
const remoteModules = ref<PortalModule[] | null>(null);
const modules = computed<PortalModule[]>(() => remoteModules.value ?? modulesOf(stage.value));

/**
 * 拉取该学段的模块清单（后台「模块配置」维护）
 *
 * @param level 学段
 */
async function loadModules(level: string) {
  try {
    const rows = await eduaiApi.funModules(level);
    if (!rows?.length) {
      remoteModules.value = null;
      return;
    }
    remoteModules.value = rows.map((r) => ({
      moduleCode: r.moduleCode,
      title: r.moduleName,
      subtitle: r.funConfigSubtitle || r.moduleDesc || "",
      icon: r.moduleIcon || "📘",
      color: r.funConfigColor || "#3b82f6",
      colorTo: r.funConfigColorTo || r.funConfigColor || "#60a5fa",
      badgeFromIncomplete: r.funConfigShowBadge === 1,
      route: r.modulePath || undefined,
    }));
  } catch {
    // 配置拉不到不该让学生端白屏：回落到内置目录
    remoteModules.value = null;
  }
}

/**
 * 拉取绑定状态与首页数据
 *
 * 未绑定时只调 /me，不去调 /overview（后端会直接返回 bound=false，省一次请求）
 */
async function load() {
  loading.value = true;
  try {
    const me = await eduaiApi.studentMe();
    if (!me?.bound) {
      needBind.value = true;
      // 已绑定教师档案的账号进学生端时给个提示，避免以为是系统坏了
      if (me?.teacherBound) {
        bindError.value = "当前账号绑定的是教师档案，学生端请用学生账号登录。";
      }
      return;
    }
    needBind.value = false;
    overview.value = await eduaiApi.studentOverview();
    if (overview.value?.stage) {
      await loadModules(overview.value.stage);
    }
  } catch (e) {
    ElMessage.error(`学生端数据加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    loading.value = false;
  }
}

/**
 * 提交绑定：成功后直接拉首页数据，停留在同一页
 */
async function doBind() {
  bindError.value = "";
  if (!form.studentName.trim()) {
    bindError.value = "请填写姓名";
    return;
  }
  binding.value = true;
  try {
    await eduaiApi.studentBind({
      studentNo: form.studentNo.trim() || undefined,
      studentName: form.studentName.trim(),
      gradeLevel: form.gradeLevel,
      grade: form.grade,
      className: form.className.trim() || undefined,
    });
    ElMessage.success("登记完成，开始学习吧！");
    needBind.value = false;
    overview.value = await eduaiApi.studentOverview();
    if (overview.value?.stage) {
      await loadModules(overview.value.stage);
    }
  } catch (e) {
    bindError.value = e instanceof Error ? e.message : String(e);
  } finally {
    binding.value = false;
  }
}

/**
 * 打开功能模块
 *
 * 有真实页面的模块（目前是成语消消乐）**在学生端内部全屏渲染**，不跳管理后台路由；
 * 以后新做的模块，只要在 EMBEDDED 里登记一次即可。
 * 没做内容的模块给出明确提示，不做成点了没反应的死链。
 *
 * @param moduleCode 模块编码；空串表示「查看更多功能」
 */
function openModule(moduleCode: string) {
  if (moduleCode === "") {
    void router.push("/edu/fun");
    return;
  }
  const configured = modules.value.find((m) => m.moduleCode === moduleCode);
  const view = EMBEDDED[moduleCode];
  if (view) {
    activeModule.value = { code: moduleCode, title: configured?.title ?? "", component: view };
    return;
  }
  ElMessage.info("该模块正在建设中，敬请期待");
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
/*
 * koi 令牌口径（与 JuniorHome / PrimaryHome / SeniorHome / TeacherPortalView 完全一致）：
 *   品牌色带 = --el-color-primary → --el-color-primary-light-3
 *   页面底   = --el-bg-color-page，卡片面 = --el-bg-color
 *   文字三级 = --el-text-color-primary / -regular / -secondary / -placeholder
 *   圆角只走 --el-radius-* 六档，动画只走 --el-transition-duration
 * 卡片类容器一律不加投影，投影只留给「悬浮浮起」与「键盘焦点环」两种反馈。
 */
.portal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: var(--el-bg-color-page);
}
.portal-loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: var(--el-text-color-secondary);
}

.portal-bind {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  /* 登记页整屏是主色底衬一张卡片：走主色渐变，末站收在页面底令牌上 */
  background: linear-gradient(
    160deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 55%,
    var(--el-bg-color-page) 100%
  );
}
.portal-bind__card {
  width: min(460px, 100%);
  padding: 28px 30px 26px;
  /* 原 24px，最近档 16px（xl）；原 box-shadow 换成边框（koi 卡片不加投影） */
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  text-align: center;
}
.portal-bind__icon {
  font-size: 46px;
  line-height: 1;
  color: var(--el-color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.portal-bind__title {
  margin: 10px 0 8px;
  font-size: 23px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.portal-bind__sub {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
}
.portal-bind__form {
  text-align: left;
}
.portal-bind__btn {
  width: 100%;
  height: 48px;
  margin-top: 6px;
  border: 0;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  font-size: 17px;
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
.portal-bind__btn:hover:not(:disabled) {
  box-shadow: 0 10px 22px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}
.portal-bind__btn:focus-visible {
  /* 按钮本身就是主色渐变，纯 primary 12% 的焦点环会「糊」在同色背景上，
     补一圈白描边保证任何主题下都看得见（仍是 koi 焦点环，只是加一层对比环） */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent),
    0 0 0 5px var(--el-color-white);
}
.portal-bind__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.portal-bind__err {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-danger);
}

/* 模块内嵌层：铺满学生端，顶部一条返回栏 */
.portal-embed {
  position: fixed;
  inset: 0;
  z-index: 2100;
  background: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
}
.portal-embed__back {
  flex-shrink: 0;
  height: 46px;
  border: 0;
  cursor: pointer;
  text-align: left;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 800;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.portal-embed__back:focus-visible {
  /* 返回栏本身是主色渐变，补一圈白描边保证焦点环在同色背景上看得见 */
  box-shadow: inset 0 0 0 3px var(--el-color-white);
}
.portal-embed__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
/* 尊重系统「减少动态效果」偏好：关掉本页全部 transition */
@media (prefers-reduced-motion: reduce) {
  .portal-bind__btn {
    transition: none;
  }
}
</style>
