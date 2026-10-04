<template>
  <div class="portal" :class="{ 'portal--imp': impersonating }">
    <!-- 管理员代入：必须显著提示，否则管理员会把学生的数据当成自己的 -->
    <div v-if="impersonating" class="portal-imp">
      <ReIcon name="View" :size="16" aria-hidden="true" />
      <span class="portal-imp__text">
        管理员代入查看中 · 本页数据属于该学生，且为只读
      </span>
      <button type="button" class="portal-imp__exit" @click="exitImpersonation">退出代入</button>
    </div>

    <!-- 学生自助改密码：只在本人登录时出现，代入态一律不给改，
         否则管理员代入会被迫（或误操作）改掉学生的真实口令。 -->
    <div v-else class="portal-pwd">
      <!-- 显式无参调用：直接把 openChangePassword 交给 @click 会把 MouseEvent 当 firstTime 传进去 -->
      <button type="button" class="portal-pwd__btn" @click="openChangePassword()">
        <ReIcon name="Key" :size="14" aria-hidden="true" />
        <span>修改密码</span>
      </button>
    </div>
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
        <component :is="activeModule.component" v-bind="embedProps(activeModule.code)" />
      </div>
    </div>

    <!-- 修改密码对话框；首次登录时作为「引导修改初始密码」弹窗，不可点遮罩/ESC 关闭 -->
    <el-dialog
      v-model="pwdVisible"
      :title="pwdFirstTime ? '首次登录：请修改初始密码' : '修改登录密码'"
      width="420"
      append-to-body
      :close-on-click-modal="!pwdFirstTime"
      :close-on-press-escape="!pwdFirstTime"
      :show-close="!pwdFirstTime"
    >
      <p v-if="pwdFirstTime" class="portal-pwd__tip">
        你的账号当前用的是管理员设置的初始密码，为保护自己的学习记录，请先改成只有你知道的密码。
      </p>
      <el-form :model="pwdForm" label-width="76" @submit.prevent>
        <el-form-item label="原密码">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            maxlength="32"
            placeholder="首次设密可留空"
          />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            maxlength="32"
            placeholder="6-32 位，建议字母与数字组合"
          />
        </el-form-item>
        <el-form-item v-if="pwdError" label=" ">
          <span class="portal-bind__err">{{ pwdError }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <!-- 首次引导不给「取消」：初始口令往往是全班同一个，学生必须先改成自己的 -->
        <el-button v-if="!pwdFirstTime" @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSaving" @click="submitChangePassword">
          {{ pwdFirstTime ? "设置我的密码" : "确认修改" }}
        </el-button>
      </template>
    </el-dialog>
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
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { setImpersonateToken, getImpersonateToken, clearImpersonateToken } from "@repo/utils";
import { eduaiApi } from "../../api/eduaiApi";
import type { StudentOverview } from "../../api/types";
import { modulesOf, normalizeStage, type PortalModule, type Stage } from "./modules";
import PrimaryHome from "./PrimaryHome.vue";
import JuniorHome from "./JuniorHome.vue";
import SeniorHome from "./SeniorHome.vue";

const router = useRouter();
const route = useRoute();

/**
 * 已实现、可嵌入学生端的模块
 *
 * key 是后台「模块管理」里的 moduleCode（稳定键，别改名）。
 * 新模块做好后在这里登记一行，学生端点卡片就能打开。
 */
const EMBEDDED: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  "idiom-game": defineAsyncComponent(() => import("../IdiomGameView.vue")),
  // 成语接龙：题目由服务端自动生成（首尾相接）
  "idiom-chain": defineAsyncComponent(() => import("../IdiomChainView.vue")),
  // 汉字识字：消费汉字库的读音/笔顺/字画/释义
  "hanzi-learn": defineAsyncComponent(() => import("../HanziGameView.vue")),
  // 我的试卷：老师布置给本班的试卷，按登录态定位班级（/v2/edu/paper-assign/my-class）
  "my-papers": defineAsyncComponent(() => import("./StudentPapersView.vue")),
  // 我的答题/阅卷记录与错题本：都用后端 /v2/edu/student/* 的「本人视角」接口
  "my-records": defineAsyncComponent(() => import("./StudentRecordsView.vue")),
  wrongbook: defineAsyncComponent(() => import("./StudentWrongbookView.vue")),
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

/**
 * 当前是否处于「管理员代入」状态。
 *
 * 必须让管理员一眼看出自己看的是别人的数据：代入态的读写都算在被代入学生头上，
 * 没有提示的话管理员会把学生的数据当成自己的，进而做出错误判断。
 */
const impersonating = ref(false);

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

/**
 * 当前学段：后端/库里可能是中文（「小学」）或大小写不一，统一归一化后再判分支，
 * 否则 {@code === "PRIMARY"} 判不中会落到其它学段版式（实测小学学生显示高中版式）。
 */
const stage = computed<Stage>(() => normalizeStage(overview.value?.stage ?? form.gradeLevel));
/** 后端按学段配置的模块清单；取不到时回落到内置目录，保证页面不空 */
const remoteModules = ref<PortalModule[] | null>(null);

/**
 * 学生端固定能力：无论后台「模块配置」怎么配，这两个入口都必须存在。
 *
 * <p>它们依赖的是学生本人的数据（我的答题/阅卷记录、我的错题本），
 * 漏配就相当于学生看不到自己的批改与错题；因此在前端兜底追加，而不是只写在
 * {@code modules.ts} 的默认目录里（后台一旦配置了模块，默认目录就不会被采用）。</p>
 */
const STUDENT_FIXED_MODULES: PortalModule[] = [
  { moduleCode: "my-papers", title: "我的试卷", subtitle: "老师布置·班级共享", icon: "📄", color: "#6366f1", colorTo: "#818cf8" },
  { moduleCode: "my-records", title: "我的答题", subtitle: "看批改·查得分", icon: "📝", color: "#0ea5e9", colorTo: "#38bdf8" },
  { moduleCode: "wrongbook", title: "错题本", subtitle: "错题重练·订正", icon: "🗂️", color: "#ef4444", colorTo: "#f87171" },
];

const modules = computed<PortalModule[]>(() => {
  const base = remoteModules.value ?? modulesOf(stage.value);
  const have = new Set(base.map((m) => m.moduleCode));
  return [...base, ...STUDENT_FIXED_MODULES.filter((m) => !have.has(m.moduleCode))];
});

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
    // 首次登录引导改密：管理员设/重置过初始口令、且学生还没自己改过时弹一次引导。
    // 标记由服务端在学生自助改密成功后置 0，所以只有第一次（或每次被重置后）会弹。
    // 用窄类型断言读这个可选字段，不改 types.ts —— 该文件当前有他人未提交改动，按 §4.7 不裹入。
    if ((me as { mustChangePassword?: boolean }).mustChangePassword === true) {
      openChangePassword(true);
    }
    overview.value = await eduaiApi.studentOverview();
    if (overview.value?.stage) {
      await loadModules(stage.value);
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
      await loadModules(stage.value);
    }
  } catch (e) {
    bindError.value = e instanceof Error ? e.message : String(e);
  } finally {
    binding.value = false;
  }
}

/**
 * 内嵌模块的透传属性。
 *
 * 目前只有「汉字识字」需要学段（按学段出题）；其余内嵌模块不接收 props，
 * 这里返回空对象，避免给它们的根元素凭空加一个 level 属性。
 *
 * @param code 模块编码
 * @returns 需要透传给该模块的属性
 */
function embedProps(code: string): Record<string, unknown> {
  // 这三个模块都要按学生学段出题：汉字识字、成语接龙、成语消消乐
  return code === "hanzi-learn" || code === "idiom-chain" || code === "idiom-game"
    ? { level: stage.value }
    : {};
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
  // 学生端首页卡片来自「模块管理」（edu_fun_config）：后台配了 module_path 的模块，
  // 必须按路径跳转；否则会出现「菜单来自模块管理，但点开只弹『建设中』」的死链。
  if (configured?.route) {
    void router.push(configured.route);
    return;
  }
  ElMessage.info("该模块正在建设中，敬请期待");
}

/**
 * 管理员代入：URL 上带 `impersonate=<临时令牌>` 时用它作为本次会话的凭据。
 *
 * 写入的是**本标签页专属**的代入令牌（sessionStorage），不是框架 storage ——
 * 后者全标签共享，写进去会把管理员自己标签页里的登录态覆盖成学生身份。
 * 地址栏上的令牌随后被抹掉，避免被复制走或留在浏览器历史里。
 *
 * @returns 是否成功接管了本次会话
 */
function adoptImpersonationToken(): boolean {
  // 抹掉地址栏上的令牌会让本路由重新挂载一次（keepAlive: false + query 变化），
  // 第二次 onMounted 时 URL 里已没有 impersonate 参数。若只认 URL 参数，
  // 提示条会在抹掉令牌的同时消失。因此先认「本标签页已有代入令牌」这一事实。
  if (getImpersonateToken()) {
    impersonating.value = true;
    return true;
  }
  const token = route.query.impersonate;
  if (typeof token !== "string" || !token) {
    return false;
  }
  setImpersonateToken(token);
  impersonating.value = true;
  void router.replace({ path: route.path, query: { ...route.query, impersonate: undefined } });
  return true;
}

/**
 * 退出代入：清掉本标签页的代入令牌并回到登录页。
 *
 * 只清代入令牌、不动管理员自己的登录态，因此管理员原标签页完全不受影响。
 */
function exitImpersonation() {
  clearImpersonateToken();
  impersonating.value = false;
  void router.replace("/edu/student-login");
}

// ==================== 修改密码 ====================
const pwdVisible = ref(false);
const pwdSaving = ref(false);
const pwdError = ref("");
const pwdForm = reactive({ oldPassword: "", newPassword: "" });
/** 是否处于「首次登录引导改密」：为真时弹窗不可取消，且隐藏「取消」按钮 */
const pwdFirstTime = ref(false);

/** 打开改密对话框：每次都清空上一次的输入与错误，避免残留旧口令。 */
function openChangePassword(firstTime = false) {
  pwdForm.oldPassword = "";
  pwdForm.newPassword = "";
  pwdError.value = "";
  pwdFirstTime.value = firstTime;
  pwdVisible.value = true;
}

/**
 * 提交改密。
 *
 * <p>原密码允许留空：学生首次设密、或管理员重置后学生自己设密时本来就没有原口令。
 * 是否要求校验旧口令由后端按「库中是否已有口令」判断，前端不重复这层规则。</p>
 */
async function submitChangePassword() {
  const newPassword = pwdForm.newPassword.trim();
  if (newPassword.length < 6) {
    pwdError.value = "新密码至少 6 位";
    return;
  }
  pwdSaving.value = true;
  pwdError.value = "";
  try {
    await eduaiApi.changeOwnPassword({
      oldPassword: pwdForm.oldPassword.trim() || undefined,
      newPassword,
    });
    ElMessage.success("密码已修改，下次登录请使用新密码");
    pwdVisible.value = false;
    // 改完就退出「首次引导」态，避免后续再打开改密框时仍被当成强制
    pwdFirstTime.value = false;
  } catch (e) {
    pwdError.value = e instanceof Error ? e.message : String(e);
  } finally {
    pwdSaving.value = false;
  }
}

onMounted(() => {
  adoptImpersonationToken();
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

/*
 * 代入提示条改为「流内首子元素」而非 fixed 覆盖：
 * 学生端首页（PrimaryHome/JuniorHome/SeniorHome）的根是 .pp { position: fixed; inset: 0 }，
 * fixed 会脱离父级流，父级的 padding / transform 都影响不到它 ——
 * 提示条一旦 fixed 就会压在标题上。改成流内布局后，页面自然被挤到提示条下方，
 * 不必再逐个子页面加偏移。
 */
.portal--imp {
  display: flex;
  flex-direction: column;
}
.portal--imp .portal-imp {
  position: static;
  flex: none;
}
/* 其余内容吃掉剩余高度；.pp 的 position 由下面的规则改回 static */
.portal--imp > *:not(.portal-imp) {
  flex: 1 1 auto;
  min-height: 0;
}
.portal--imp .pp,
.portal--imp .portal-bind,
.portal--imp .portal-loading {
  position: static;
  inset: auto;
  height: 100%;
}

/*
 * 代入提示条：压在页面顶部，用 warning 色区分于学生自己的界面。
 * 不写死色值，一律走 Element Plus 语义令牌，暗色模式下自动跟随。
 */
.portal-imp {
  position: relative;
  z-index: 2001;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
  border-bottom: 1px solid var(--el-color-warning-light-7);
}
.portal-imp__text {
  flex: 1;
  min-width: 0;
}
.portal-imp__exit {
  flex: none;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--el-color-warning-dark-2);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: var(--el-radius-small, 4px);
  transition: background-color var(--el-transition-duration, 0.2s) ease;
}
.portal-imp__exit:hover {
  background: var(--el-color-warning-light-7);
}
.portal-imp__exit:focus-visible {
  outline: 2px solid var(--el-color-warning);
  outline-offset: 1px;
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

/* 首次登录改密引导的说明文案 */
.portal-pwd__tip {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2, var(--el-text-color-primary));
  font-size: 13px;
  line-height: 1.6;
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
