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

    <!-- 学生自助改密码 + 退出登录：只在登录态确认完（loading 结束）后出现。
         代入态整块被 v-if 链挡掉，管理员代入不会被误改学生口令。
         「修改密码」要求已绑定；「退出登录」不需要 —— 未绑定的学生
         也必须能回到登录页换个账号，否则界面只有「进入学习」一条路。
         早于 loading 那一帧渲染就是一个没有任何样式的原生按钮（实测确实裸露在加载态里）。 -->
    <div v-else-if="!loading" class="portal-pwd">
      <!-- 显式无参调用：直接把 openChangePassword 交给 @click 会把 MouseEvent 当 firstTime 传进去 -->
      <button v-if="!needBind" type="button" class="portal-pwd__btn" @click="openChangePassword()">
        <ReIcon name="Key" :size="14" aria-hidden="true" />
        <span>修改密码</span>
      </button>
      <button type="button" class="portal-pwd__btn is-ghost" @click="logout">
        <ReIcon name="SwitchButton" :size="14" aria-hidden="true" />
        <span>退出登录</span>
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
      「查看更多功能」：就地列出本学段全部模块。
      原实现是 router.push("/edu/fun")，那是管理后台外壳 —— 学生点进去
      看到后台导航且没有任何返回出口（用户实测反馈）。这里改成同层覆盖面板。
    -->
    <div v-if="showAllModules" class="portal-allmods">
      <div class="portal-allmods__head">
        <h2 class="portal-allmods__title">全部功能</h2>
        <button
          type="button"
          class="portal-allmods__close"
          aria-label="关闭全部功能面板"
          @click="showAllModules = false"
        >
          <ReIcon name="Close" :size="16" aria-hidden="true" />
        </button>
      </div>
      <div class="portal-allmods__grid">
        <button
          v-for="m in allModules"
          :key="m.moduleCode"
          type="button"
          class="portal-allmods__item"
          :class="{ 'is-ready': !!EMBEDDED[m.moduleCode] }"
          @click="openModule(m.moduleCode)"
        >
          <span
            class="portal-allmods__ic"
            :style="{ background: `linear-gradient(135deg, ${m.color}, ${m.colorTo})` }"
            aria-hidden="true"
            >{{ m.icon }}</span
          >
          <span class="portal-allmods__name">{{ m.title }}</span>
          <span class="portal-allmods__desc">{{ m.subtitle }}</span>
        </button>
      </div>
    </div>

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
    <ReDialog
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
    </ReDialog>
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
import { message } from "@repo/core";
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  clearAllAuthData,
  clearImpersonateToken,
  getImpersonateToken,
  setImpersonateToken,
} from "@repo/utils";
import { eduaiApi } from "../../api/eduaiApi";
import type { StudentOverview } from "../../api/types";
import { modulesOf, normalizeStage, type PortalModule, type Stage } from "./modules";
import { providePortalModuleHost } from "./portalHost";
import PrimaryHome from "./PrimaryHome.vue";
import JuniorHome from "./JuniorHome.vue";
import SeniorHome from "./SeniorHome.vue";
import ReDialog from "@repo/ui/re-dialog";

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
  // 下面三个原先漏登记，导致学生点卡片时走 configured.route 跳到 /edu/fun/*，
  // 而那些路由注册在管理后台 layout 之下 —— 学生直接看到后台侧边栏与标签栏，
  // 且页面上没有任何返回学生端的出口（实测：诗词大会落点 poem-challenge，后台菜单文字全在）。
  // 诗词大会：七种玩法合一（诗句排序 / 飞花令 / 看句猜题 / 诗归其主 / 朝代溯源 / 题材归类 / 炼字填空）
  poetry: defineAsyncComponent(() => import("../PoemChallengeView.vue")),
  // 古诗补全：给一句诗选下一句
  poem: defineAsyncComponent(() => import("../PoemGameView.vue")),
  // 昆虫识图：看图认虫 + 配对玩法
  insect: defineAsyncComponent(() => import("../InsectView.vue")),
};

/** 当前内嵌打开的模块；null 表示停留在学生端首页 */
const activeModule = ref<{
  code: string;
  title: string;
  component: ReturnType<typeof defineAsyncComponent>;
} | null>(null);

/** 「查看更多功能」面板是否展开（就地覆盖在首页之上，不跳路由） */
const showAllModules = ref(false);

/**
 * 把当前内嵌模块同步到地址栏 `?m=<moduleCode>`。
 *
 * <p>原实现把打开的模块只放在 ref 里，地址栏永远是 /edu/student。两个后果：</p>
 * <ul>
 *   <li>浏览器**后退键会直接退出学生端**（回到登录页/上一个站点），而不是退回模块列表
 *       —— 内嵌层看着像「打开了一个页面」，但历史里根本没有这一层；</li>
 *   <li>模块链接没法分享、刷新就丢。</li>
 * </ul>
 * <p>提到 query 后后退键正常、链接可分享，回归脚本也能直接深链到某个模块。</p>
 */
watch(activeModule, (m) => {
  const code = m?.code;
  void router.replace({
    path: "/edu/student",
    query: code ? { ...route.query, m: code } : { ...route.query, m: undefined },
  });
});

/**
 * 向内嵌模块提供宿主能力。
 *
 * <p>模块自己不知道它被内嵌着：成语消消乐结算页的「返回首页」原本
 * `router.push("/edu/fun")`，那是管理后台路由 —— 学生点一下就被甩进后台。
 * 提供 close 后，模块优先就地收起，只有脱离宿主时才走自己的退路。</p>
 */
providePortalModuleHost({
  close: () => {
    activeModule.value = null;
    showAllModules.value = false;
  },
});

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
 * 「查看更多功能」要展示的模块全集。
 *
 * <p>后台「模块管理」按学段配了哪些卡，首页就只显示哪些；但学生点
 * 「查看更多功能」是期待看到**这个学段能玩的所有东西**，而不是被甩到管理后台
 * （原实现 `router.push("/edu/fun")`，那里是后台外壳且无返回出口）。
 * 这里就地列出内置目录的全集，与后台配置取并集，后台没配的也可见。</p>
 */
const allModules = computed<PortalModule[]>(() => {
  const builtin = modulesOf(stage.value);
  const seen = new Set(builtin.map((m) => m.moduleCode));
  for (const m of modules.value) {
    if (!seen.has(m.moduleCode)) {
      builtin.push(m);
      seen.add(m.moduleCode);
    }
  }
  return builtin;
});

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
 * 地址栏上的 `?m=` 变了（后退键 / 手改地址栏 / 深链）就切到对应模块。
 *
 * <p>这个 watcher 必须声明在 {@link modules} 之后。它带 `immediate: true`，会在
 * setup 期间同步执行并读 `modules.value`；写在 `modules` 前面就是 TDZ
 * （`Cannot access 'modules' before initialization`）。Vue 侧的
 * `callWithAsyncErrorHandling` 会把 setup 期的异常吞成一条 console 日志继续往下走，
 * 于是页面照常渲染、只是深链永远开不出模块 —— 故障表现为「功能不灵」而不是「白屏」，
 * 极难定位。首页因为 `?m` 为空提前 return，碰不到 `modules`，所以只有深链才复现。</p>
 */
watch(
  () => route.query.m,
  (code) => {
    const want = typeof code === "string" ? code : "";
    if (!EMBEDDED[want]) {
      if (want) {
        // 深链到没有页面的模块：回首页而不是留一个空层
        activeModule.value = null;
      }
      return;
    }
    if (activeModule.value?.code === want) return;
    activeModule.value = {
      code: want,
      title: modules.value.find((m) => m.moduleCode === want)?.title ?? "",
      component: EMBEDDED[want],
    };
  },
  { immediate: true },
);

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
    //
    // 管理员代入（impersonating）时不弹：这个引导弹窗故意做成不可取消/不可关闭
    // （学生必须先改掉全班同一个的初始口令），但代入视角下管理员不该、也不能去改
    // 学生的口令——不拦住就会把管理员死锁在学生端，连「退出代入」都点不到。
    // 学生本人未代入时的引导改密行为保持不变。
    if (
      (me as { mustChangePassword?: boolean }).mustChangePassword === true &&
      !impersonating.value
    ) {
      openChangePassword(true);
    }
    overview.value = await eduaiApi.studentOverview();
    if (overview.value?.stage) {
      await loadModules(stage.value);
    }
  } catch (e) {
    message.error(`学生端数据加载失败：${e instanceof Error ? e.message : String(e)}`);
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
    message.success("登记完成，开始学习吧！");
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
    // 「查看更多功能」就地展开本学段全部模块，绝不跳 /edu/fun（那是管理后台外壳，
    // 且页面上没有返回学生端的出口，学生进去就是死路 —— 用户实测反馈）
    showAllModules.value = !showAllModules.value;
    return;
  }
  const configured = modules.value.find((m) => m.moduleCode === moduleCode);
  const view = EMBEDDED[moduleCode];
  if (view) {
    showAllModules.value = false;
    activeModule.value = { code: moduleCode, title: configured?.title ?? "", component: view };
    return;
  }
  // 学生端首页卡片来自「模块管理」（edu_fun_config）。后台配了 module_path 的模块
  // 若不在 EMBEDDED 里就跳该路径 —— 但**这里不再跳**：
  // 学生端所有页面都已就地登记（EMBEDDED 9 项），未登记的模块点开只会落到
  // /edu/fun/* 之类的**管理后台路由**，学生会看到侧边栏/标签栏/面包屑
  // 且无返回出口（用户实测：诗词大会落点 poem-challenge，后台菜单文字全在）。
  // 管理员代入看到的也是同一套学生端外壳 —— 本来就该看学生看到的东西。
  message.info("该模块正在建设中，敬请期待");
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

/**
 * 学生主动退出登录：清掉本标签页的令牌与缓存后回登录页。
 *
 * <p>原页面只有「修改密码」，没有退出入口：学生在一台共用电脑上登录后
 * 除了关标签页没有别的办法换人，下一个打开浏览器的人会直接进入上一个学生的
 * 首页（含姓名、班级、错题）。登录态是持久化的，关标签页并不等于退出。</p>
 */
function logout() {
  clearImpersonateToken();
  clearAllAuthData();
  overview.value = null;
  activeModule.value = null;
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
    message.success("密码已修改，下次登录请使用新密码");
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
  /* dvh 而非 100%：手机上浏览器地址栏收放会改变 vh，100% 在嵌入态下拿不到确定高度，
     原先写 height:100% 在 .portal--imp 之外就是塌的 */
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: var(--el-text-color-secondary);
}

/*
 * 「修改密码」入口（右下角浮动胶囊）。
 *
 * <p>原放在右上角（absolute top:0 right:0）：但舞台首页 `.pp` 是整屏
 * `position:fixed; z-index:2000` 的层（用于盖住管理后台外壳），它连同页头
 * 的统计药丸（本周学习/星星奖励/连续打卡）整层绘制在本按钮之上——
 * 实测 elementFromPoint 命中的是 pp-pill，Playwright 真实点击 5s 超时，
 * 用户同样看不到、点不到（r39 全站点击扫描发现，截图取证）。</p>
 *
 * <p>修复：① z-index 提到舞台首页之上（2010>2000）；② 挪到右下角，
 * 与页头药丸/标题区彻底错开，移动端药丸换行也不会再撞上；
 * 底部留 safe-area，iOS 圆角屏不贴边。</p>
 */
.portal-pwd {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 2010;
  display: flex;
  gap: 8px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
}
.portal-pwd__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  /* 触摸目标不小于 44px（iOS HIG / Material）。原来 padding 7px + 13px 字号
     只做出 32px 高，实测 101x32 —— 视觉上确实是小胶囊，但热区不够。 */
  min-height: 44px;
  padding: 7px clamp(12px, 1.2vw, 16px);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-color-primary);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: var(--el-radius-full, 9999px);
  transition:
    background-color var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease;
}
.portal-pwd__btn:hover {
  background: var(--el-color-primary-light-9);
}
.portal-pwd__btn:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}
/* 「退出登录」用弱化样式：破坏性低于改密，不该和主操作抢视觉权重 */
.portal-pwd__btn.is-ghost {
  color: var(--el-text-color-regular);
  border-color: var(--el-border-color);
}
.portal-pwd__btn.is-ghost:hover {
  background: var(--el-fill-color-light);
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

/*
 * 「全部功能」面板：同层覆盖，不跳路由。
 * auto-fit + minmax 让卡片按可用宽度自动换列，无需为每个断点写死列数 ——
 * 这也是成语消消乐用过的写法，保持同一套手感。
 */
.portal-allmods {
  position: fixed;
  inset: 0;
  z-index: 2050;
  display: flex;
  flex-direction: column;
  /* 滚动交给面板本身，__grid 不再同时是「被 flex 限高的盒子」和「滚动容器」。
     两者集在一身时，390px 手机上容器比内容少 5px，滚出来只有下内边距 ——
     末项其实完整可见（实测末项底边距容器底 10px），滚 5px 什么新东西都看不到。 */
  overflow-y: auto;
  background: var(--el-bg-color-page);
}
.portal-allmods__head {
  flex: none;
  /* 面板可滚了，表头必须 sticky，否则一滚就丢标题 */
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px clamp(16px, 4vw, 28px);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
}
.portal-allmods__title {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 1px;
  color: var(--el-color-white);
}
.portal-allmods__close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 触摸目标 44px。32px 的圆钮是「收起面板」唯一的出口，小屏上难点。 */
  width: 44px;
  height: 44px;
  color: var(--el-color-white);
  cursor: pointer;
  background: color-mix(in srgb, var(--el-color-white) 18%, transparent);
  border: 0;
  border-radius: var(--el-radius-full, 9999px);
}
.portal-allmods__close:hover {
  background: color-mix(in srgb, var(--el-color-white) 30%, transparent);
}
.portal-allmods__close:focus-visible {
  outline: 2px solid var(--el-color-white);
  outline-offset: 1px;
}
.portal-allmods__grid {
  /* 自然高度，不再 flex:1 限高 + overflow:auto 自滚 */
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 40vw, 190px), 1fr));
  gap: clamp(10px, 2.5vw, 16px);
  padding: clamp(14px, 4vw, 24px);
  align-content: start;
}
.portal-allmods__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  /* 高度交给内容（min-height 而非 height），副标题长一行也不会裁字 */
  min-height: 116px;
  padding: 14px 12px;
  text-align: left;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition: box-shadow var(--el-transition-duration, 0.2s) ease;
}
.portal-allmods__item:hover {
  box-shadow: 0 8px 18px color-mix(in srgb, var(--el-color-primary) 16%, transparent);
}
.portal-allmods__item:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}
/* 没有内嵌页面的模块明确示弱，避免学生以为点了没反应是自己按错了 */
.portal-allmods__item.is-ready {
  cursor: pointer;
}
.portal-allmods__item:not(.is-ready) {
  cursor: not-allowed;
  opacity: 0.55;
}
.portal-allmods__ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 21px;
  line-height: 1;
  border-radius: var(--el-radius-lg, 12px);
}
.portal-allmods__name {
  font-size: 15px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.portal-allmods__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 窄屏：返回栏文案容易挤，改成更小的内边距并允许换行 */
@media (max-width: 640px) {
  .portal-pwd {
    padding: 10px 12px;
  }
  .portal-embed__back {
    height: auto;
    min-height: 44px;
    padding: 10px 14px;
    font-size: 13px;
    white-space: normal;
  }
  .portal-bind__card {
    padding: 22px 18px 20px;
  }
}

/* 尊重系统「减少动态效果」偏好：关掉本页全部 transition */
@media (prefers-reduced-motion: reduce) {
  .portal-bind__btn,
  .portal-pwd__btn,
  .portal-allmods__item {
    transition: none;
  }
}
</style>
