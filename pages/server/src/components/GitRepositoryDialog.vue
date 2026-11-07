<!--
  项目 Git 仓库面板（参考 Gitee 的仓库视图：分支 / 提交 / 工作区改动）。

  为什么要有这一页：项目里配了 Git 地址之后，用户只能看到一行 URL 和一个「从 Git 更新」按钮，
  不知道本地到底拉没拉过、在哪个分支、和远端差多少、工作区干不干净。排障时「代码是不是最新」
  恰恰是最先要确认的一件事。

  数据全部来自后端 /project/{id}/git/repository（后端用 utils-support-git-starter 的 GitClient），
  前端不解析 refs、不跑任何 Git 逻辑。

  拉取用 ReProgressDialog（不可关闭）：clone/pull 可能跑几十秒，中途被关掉会留下半个工作区；
  跑完才允许关闭，失败时把原因留在弹窗里。
-->
<template>
  <ReDialog
    v-model="visible"
    :title="active || project ? `Git 仓库 - ${(active ?? project)!.projectName}` : 'Git 仓库'"
    width="1000px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="reset"
  >
    <div v-loading="loading" class="git-repo">
      <!-- 未配置：直接告诉人去哪配，不要显示一片空 -->
      <div v-if="loadError" class="git-repo__error">
        <span class="git-repo__error-title">读不到 Git 仓库</span>
        <p class="git-repo__error-msg">{{ loadError }}</p>
        <div class="git-repo__error-actions">
          <ReButton icon="Refresh" :show-text="true" @click="load">重试</ReButton>
          <ReButton v-if="project" icon="EditPen" :show-text="true" @click="emit('edit', project)">去配置</ReButton>
        </div>
      </div>

      <template v-else-if="repo">
        <!-- 顶部：地址 / 分支 / 落后提示（Gitee 的仓库头） -->
        <header class="git-head">
          <div class="git-head__main">
            <ReIcon name="GitBranch" :size="18" class="git-head__ic" />
            <span class="git-head__url mono" :title="repo.gitUrl">{{ repo.gitUrl }}</span>
            <ReTag v-if="repo.cloned" type="primary" round>{{ repo.branch || "未知分支" }}</ReTag>
            <ReTag v-else type="info" round>未克隆</ReTag>
            <ReTag v-if="repo.behind" type="warning" round>远端有新提交</ReTag>
            <ReTag v-if="repo.cloned && repo.clean === false" type="info" round>有未提交改动</ReTag>
          </div>
          <div class="git-head__ops">
            <ReButton icon="Refresh" :show-text="true" :loading="loading" @click="load">刷新</ReButton>
            <ReButton
              icon="Download"
              :show-text="true"
              type="primary"
              :loading="pulling"
              @click="pull()"
            >
              {{ repo.cloned ? "拉取" : "克隆" }}
            </ReButton>
            <ReButton
              v-if="repo.cloned"
              icon="Upload"
              :show-text="true"
              :loading="deploying"
              tip="拉取最新代码 → Maven 构建 → 上传并重启（完整发布）"
              @click="deploy()"
            >
              拉取并发布
            </ReButton>
          </div>
        </header>

        <div v-if="repo.cloned === false" class="git-empty">
          <ReIcon name="FolderOpened" :size="26" />
          <div class="git-empty__title">本地还没有这个仓库</div>
          <p class="git-empty__desc">{{ repo.message || "点「克隆」把代码拉下来；克隆只同步工作区，不会构建或发布。" }}</p>
          <p class="git-empty__path mono">{{ repo.workspace }}</p>
        </div>

        <template v-else>
          <!-- 关键读数：当前提交 / 远端提交 / 落后 -->
          <div class="git-kv">
            <div class="git-kv__row">
              <span class="git-kv__k">当前提交</span>
              <span class="mono">{{ repo.shortCommit || "—" }}</span>
              <span class="git-kv__sub">{{ repo.commit ? repo.commit.slice(0, 16) : "" }}</span>
            </div>
            <div class="git-kv__row">
              <span class="git-kv__k">远端提交</span>
              <span class="mono">{{ repo.remoteCommit ? repo.remoteCommit.slice(0, 8) : "未 fetch" }}</span>
              <span class="git-kv__sub">{{ repo.behind ? "需要拉取" : "已同步" }}</span>
            </div>
            <div class="git-kv__row">
              <span class="git-kv__k">工作区</span>
              <span>{{ repo.clean ? "干净" : `${repo.changeCount ?? 0} 处改动` }}</span>
              <span class="git-kv__sub">{{ repo.clean ? "可以安全拉取" : "有改动时禁止拉取" }}</span>
            </div>
            <div class="git-kv__row">
              <span class="git-kv__k">本地目录</span>
              <span class="mono git-kv__path" :title="repo.workspace">{{ repo.workspace }}</span>
            </div>
          </div>

          <el-tabs v-model="tab" class="git-tabs">
            <el-tab-pane name="commits" :label="`提交 (${(repo.commits ?? []).length})`">
              <div v-if="!(repo.commits ?? []).length" class="git-empty git-empty--inline">没有提交记录</div>
              <ul v-else class="git-commits">
                <li v-for="c in repo.commits" :key="c.sha" class="git-commit">
                  <span class="git-commit__sha mono" :title="c.sha">{{ c.shortSha }}</span>
                  <span class="git-commit__msg" :title="c.message">{{ firstLine(c.message) }}</span>
                  <span class="git-commit__meta">{{ c.author }} · {{ fmtTime(c.time) }}</span>
                </li>
              </ul>
            </el-tab-pane>

            <el-tab-pane name="branches" :label="`分支 (${(repo.branches ?? []).length})`">
              <div v-if="!(repo.branches ?? []).length" class="git-empty git-empty--inline">没有分支信息</div>
              <ul v-else class="git-branches">
                <li v-for="b in repo.branches" :key="`${b.remote}-${b.name}`" class="git-branch">
                  <ReIcon name="GitBranch" :size="14" />
                  <span class="git-branch__name mono">{{ b.name }}</span>
                  <ReTag v-if="b.current" type="primary" round>当前</ReTag>
                  <ReTag v-else-if="b.remote" type="info" round>远程</ReTag>
                  <ReButton
                    v-if="!b.current"
                    size="small"
                    :disabled="!repo.clean || pulling"
                    :tip="repo.clean ? '' : '工作区有改动，先处理后才能切换'"
                    @click="pull(b.name)"
                  >
                    切换并拉取
                  </ReButton>
                </li>
              </ul>
            </el-tab-pane>

            <el-tab-pane name="changes" :label="`改动 (${repo.changeCount ?? 0})`">
              <div v-if="repo.clean" class="git-empty git-empty--inline">工作区干净，没有未提交的改动</div>
              <ul v-else class="git-changes">
                <li v-for="(line, i) in repo.changes ?? []" :key="i" class="git-change mono">{{ line }}</li>
              </ul>
            </el-tab-pane>
          </el-tabs>
        </template>
      </template>
    </div>

    <template #footer>
      <ReButton @click="visible = false">关闭</ReButton>
    </template>
  </ReDialog>

  <!-- 拉取进度：不可关闭（中途关掉会留下半个工作区），跑完才出现「关闭」 -->
  <ReProgressDialog
    v-model="progressVisible"
    :title="progressTitle"
    :snapshot="progressSnapshot"
    :steps="progressSteps"
    @close="progressVisible = false"
  />
</template>

<script setup lang="ts">
/**
 * 项目 Git 仓库面板。
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReTag from "@repo/ui/re-tag";
import ReIcon from "@repo/ui/re-icon";
import ReProgressDialog from "@repo/ui/re-progress-dialog";
import type { ProgressSnapshot, ProgressStep } from "@repo/ui/re-progress-dialog";
import { errorText } from "../utils/errors";
import { getGitRepository, pullGitRepository, deployGitRepository } from "../api/releaseGit";
import type { GitRepository } from "../api/releaseGit";
import { trackTask, type ProcessTask } from "../utils/processTasks";

/** 只需要项目标识与名称，不依赖 ProjectsView 的完整 Project 类型 */
interface GitProjectRef {
  id: number;
  projectName: string;
}

const props = defineProps<{
  /** 项目（为空时不发请求） */
  project?: GitProjectRef | null;
}>();

const emit = defineEmits<{
  /** 仓库读不到时，让父级直接打开项目的编辑弹框 */
  (e: "edit", project: GitProjectRef): void;
}>();

const visible = ref(false);
/**
 * 本次打开的项目。
 *
 * <p>不能只靠 props：父级是「先改 ref、紧接着调 open()」，Vue 的 props 更新要到下一次
 * 刷新才落到子组件，open() 里立刻读 props.project 会拿到上一个值（首次打开是 null）——
 * 表现为弹框打开后一片空白。故由 open() 自己收下这份项目引用。</p>
 */
const active = ref<GitProjectRef | null>(null);
const loading = ref(false);
const pulling = ref(false);
const deploying = ref(false);
const loadError = ref("");
const repo = ref<GitRepository | null>(null);
const tab = ref<"commits" | "branches" | "changes">("commits");

/* ---------------- 拉取进度（ReProgressDialog：不可关闭） ---------------- */

const progressVisible = ref(false);
const progressSnapshot = ref<ProgressSnapshot | null>(null);
const progressTargetBranch = ref("");
/** 「拉取并发布」跟踪的任务（有值时进度来自任务帧，而不是本地推算） */
const deployTask = ref<ProcessTask | null>(null);
let stopDeployWatch: (() => void) | null = null;

const progressTitle = computed(() => {
  const name = (active.value ?? props.project)?.projectName ?? "";
  if (deployTask.value) {
    return `正在发布 ${name}`;
  }
  return progressTargetBranch.value
    ? `正在拉取 ${name}（${progressTargetBranch.value}）`
    : `正在拉取 ${name}`;
});

/** 步骤定义：与后端 gitPull 的实际动作一一对应（克隆时多一步） */
const progressSteps = computed<ProgressStep[]>(() => {
  if (deployTask.value) {
    // 发布是后端编排的多步任务，步骤名由任务帧给出，这里只给「总览」
    return [
      { key: "pull", title: "拉取代码", description: "同步远端提交到本地工作区" },
      { key: "build", title: "Maven 构建", description: "按项目配置的 goals 打包" },
      { key: "upload", title: "上传产物", description: "把构建产物投放到目标主机" },
      { key: "restart", title: "备份并重启", description: "备份当前版本、投放、健康检查" },
    ];
  }
  const steps: ProgressStep[] = [];
  if (repo.value && repo.value.cloned === false) {
    steps.push({ key: "clone", title: "克隆仓库", description: "首次拉取，把整个仓库下载到本地工作区" });
  }
  steps.push({ key: "fetch", title: "同步远端", description: "读取远端分支与对象" });
  steps.push({ key: "merge", title: "更新工作区", description: "把远端提交合并到本地分支" });
  steps.push({ key: "done", title: "完成", description: "刷新仓库状态" });
  return steps;
});

/**
 * 推进步骤状态（进度条 + 步骤清单一起动）。
 *
 * @param keys   已完成/正在进行的步骤键
 * @param status 当前步骤状态
 * @param pct    百分比
 * @param message 结论（结束时写）
 * @param finished 是否结束
 */
function setProgress(
  keys: string[],
  status: "RUNNING" | "SUCCESS" | "FAILED",
  pct: number,
  msg = "",
  finished = false,
) {
  const list = progressSteps.value.map((step) => {
    const idx = keys.indexOf(step.key);
    if (idx < 0) {
      return { ...step, status: "WAIT", statusLabel: "待执行" };
    }
    if (idx === keys.length - 1 && !finished) {
      return { ...step, status: "RUNNING", statusLabel: "进行中" };
    }
    return { ...step, status: "SUCCESS", statusLabel: "已完成" };
  });
  if (finished && status === "FAILED") {
    // 最后一个已开始的步骤标失败，后面的保持待执行
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].status === "RUNNING") {
        list[i] = { ...list[i], status: "ERROR", statusLabel: "失败", detail: msg };
        break;
      }
    }
  }
  const current = list.find((s) => s.status === "RUNNING") ?? list[list.length - 1];
  progressSnapshot.value = {
    taskId: `git-pull-${active.value?.id ?? 0}`,
    status: finished ? status : "RUNNING",
    percentage: pct,
    currentKey: current?.key,
    currentTitle: current?.title,
    currentDescription: current?.description,
    message: msg,
    steps: list,
    finished,
    cancellable: false,
  };
}

/* ---------------- 数据 ---------------- */

/** 首行提交信息（多行 message 只显示标题行） */
function firstLine(text: string): string {
  const line = String(text || "").split("\n")[0] ?? "";
  return line.length > 90 ? `${line.slice(0, 90)}…` : line;
}

/** 提交时间：今天只显示时分，其余显示日期 */
function fmtTime(ms: number): string {
  if (!ms) {
    return "";
  }
  const d = new Date(ms);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) {
    return hm;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`;
}

/** 读取仓库概览 */
async function load() {
  const project = active.value ?? props.project;
  if (!project) {
    return;
  }
  loading.value = true;
  loadError.value = "";
  try {
    repo.value = await getGitRepository(project.id);
  } catch (e: any) {
    loadError.value = errorText(e, "读取 Git 仓库失败");
  } finally {
    loading.value = false;
  }
}

/**
 * 打开面板。
 *
 * @param project 目标项目
 */
async function open(project: GitProjectRef) {
  active.value = project;
  visible.value = true;
  repo.value = null;
  loadError.value = "";
  tab.value = "commits";
  await load();
}

/** 关闭后清状态：下次打开必须是干净的加载态，不能闪一下上个项目的数据 */
function reset() {
  repo.value = null;
  loadError.value = "";
  active.value = null;
  progressVisible.value = false;
  progressSnapshot.value = null;
  stopDeployWatch?.();
  stopDeployWatch = null;
  deployTask.value = null;
  deploying.value = false;
}

/**
 * 拉取（或切换分支并拉取）。
 *
 * @param branch 目标分支；空表示跟随项目配置 / 当前分支
 */
async function pull(branch?: string) {
  const project = active.value ?? props.project;
  if (!project || pulling.value) {
    return;
  }
  pulling.value = true;
  progressTargetBranch.value = branch ?? "";
  progressVisible.value = true;
  const willClone = repo.value?.cloned === false;
  const steps = progressSteps.value.map((s) => s.key);
  setProgress(willClone ? [steps[0]] : [steps[0]], "RUNNING", 10);

  try {
    // 后端是一个同步接口：这里只能按「请求已发出 / 请求返回」两个真实节点推进，
    // 不伪造中间百分比（伪造的进度条比没有更糟）
    setProgress(willClone ? ["clone", "fetch"] : ["fetch"], "RUNNING", 45);
    const result = await pullGitRepository(project.id, branch);
    setProgress(steps, "SUCCESS", 100, result.updated ? "已更新到最新提交" : "已是最新，无需更新", true);
    message.success(
      result.updated ? `已更新到 ${String(result.commit ?? "").slice(0, 8)}` : "已是最新，无需更新",
    );
    await load();
  } catch (e: any) {
    setProgress(steps, "FAILED", 100, errorText(e, "拉取失败"), true);
    message.error(`拉取失败：${errorText(e, "未知原因")}`);
  } finally {
    pulling.value = false;
  }
}

/**
 * 拉取并发布（拉代码 → 构建 → 投放 → 重启）。
 *
 * <p>进度不自己编：后端把步骤、百分比、日志都推在任务帧里，这里只把它映射成
 * ReProgressDialog 的快照。用户点的是「发布」，看到的就该是发布链路真实走到哪一步。</p>
 */
async function deploy() {
  const project = active.value ?? props.project;
  if (!project || deploying.value) {
    return;
  }
  deploying.value = true;
  progressTargetBranch.value = "";
  progressVisible.value = true;
  progressSnapshot.value = {
    taskId: "",
    status: "RUNNING",
    percentage: 0,
    currentTitle: "正在提交发布任务",
    currentDescription: "拉取代码 → Maven 构建 → 上传 → 备份重启",
    steps: progressSteps.value,
    details: [],
    finished: false,
    cancellable: false,
  };
  try {
    const taskId = await deployGitRepository(project.id);
    if (!taskId) {
      throw new Error("项目有操作正在进行，请稍后再试");
    }
    const task = trackTask(taskId, project.projectName, "deploy");
    deployTask.value = task;
    // 任务状态是 reactive 的：watch 一帧一帧映射到弹窗
    stopDeployWatch = watch(
      () => [task.phase, task.currentStep, task.progress, task.finished, task.success, task.message, task.logs.length],
      () => applyDeployTask(task),
      { immediate: true },
    );
  } catch (e: any) {
    progressSnapshot.value = {
      ...(progressSnapshot.value as ProgressSnapshot),
      status: "FAILED",
      percentage: 100,
      message: errorText(e, "发布提交失败"),
      finished: true,
    };
    message.error(`发布失败：${errorText(e, "未知原因")}`);
    deploying.value = false;
  }
}

/**
 * 把发布任务映射成进度快照。
 *
 * @param task 任务（reactive）
 */
function applyDeployTask(task: ProcessTask) {
  const steps: ProgressStep[] = progressSteps.value.map((step) => {
    const done = task.finished && task.success;
    return {
      ...step,
      status: done ? "SUCCESS" : task.finished && !task.success ? "WAIT" : "WAIT",
      statusLabel: done ? "已完成" : "待执行",
    };
  });
  // 当前步骤名来自后端（「拉取代码」「Maven 构建」…），按包含关系点亮对应步骤
  const current = task.currentStep || "";
  const hit = steps.findIndex((s) => current && (current.includes(s.title) || s.title.includes(current)));
  steps.forEach((s, i) => {
    if (hit >= 0 && i < hit) {
      s.status = "SUCCESS";
      s.statusLabel = "已完成";
    } else if (hit >= 0 && i === hit) {
      s.status = task.finished ? (task.success ? "SUCCESS" : "ERROR") : "RUNNING";
      s.statusLabel = task.finished ? (task.success ? "已完成" : "失败") : "进行中";
      if (task.finished && !task.success) {
        s.detail = task.message;
      }
    }
  });
  if (task.finished && task.success) {
    steps.forEach((s) => {
      s.status = "SUCCESS";
      s.statusLabel = "已完成";
    });
  }
  progressSnapshot.value = {
    taskId: task.taskId,
    status: task.finished ? (task.success ? "SUCCESS" : "FAILED") : "RUNNING",
    percentage: task.progress,
    currentKey: steps[Math.max(0, hit)]?.key,
    currentTitle: task.currentStep || "正在发布",
    currentDescription: task.finished ? task.message : task.currentStep,
    message: task.finished ? task.message : "",
    steps,
    details: task.logs.slice(-200),
    finished: task.finished,
    cancellable: false,
  };
  if (task.finished) {
    deploying.value = false;
    stopDeployWatch?.();
    stopDeployWatch = null;
    deployTask.value = null;
    if (task.success) {
      message.success("发布完成");
      void load();
    } else {
      message.error(`发布失败：${task.message || "未知原因"}`);
    }
  }
}

onBeforeUnmount(() => {
  stopDeployWatch?.();
  stopDeployWatch = null;
});

defineExpose({ open, reload: load });</script>

<style scoped>
.git-repo {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.git-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle, #eef0f6);
}

.git-head__main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.git-head__ic {
  color: var(--brand-600, #2563eb);
  flex: none;
}

.git-head__url {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-primary, #1f2430);
}

.git-head__ops {
  display: flex;
  gap: 8px;
  flex: none;
}

.mono {
  font-family: "Cascadia Code", Consolas, ui-monospace, monospace;
  font-size: 12px;
}

.git-kv {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 18px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-fill, #f7f8fa);
}

.git-kv__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
}

.git-kv__k {
  flex: 0 0 64px;
  color: var(--text-secondary, #6b7280);
  font-size: 12.5px;
}

.git-kv__sub {
  color: var(--text-tertiary, #9aa1ad);
  font-size: 12px;
}

.git-kv__path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.git-tabs {
  margin-top: 2px;
}

.git-commits,
.git-branches,
.git-changes {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
}

.git-commit {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 4px;
  border-bottom: 1px solid var(--border-subtle, #eef0f6);
  font-size: 13px;
}

.git-commit:last-child {
  border-bottom: 0;
}

.git-commit__sha {
  flex: none;
  color: var(--brand-600, #2563eb);
}

.git-commit__msg {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, #1f2430);
}

.git-commit__meta {
  flex: none;
  font-size: 12px;
  color: var(--text-tertiary, #9aa1ad);
}

.git-branch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 4px;
  border-bottom: 1px solid var(--border-subtle, #eef0f6);
  font-size: 13px;
}

.git-branch:last-child {
  border-bottom: 0;
}

.git-branch__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.git-change {
  padding: 4px 4px;
  border-bottom: 1px dashed var(--border-subtle, #eef0f6);
  color: var(--text-secondary, #6b7280);
}

.git-change:last-child {
  border-bottom: 0;
}

.git-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 36px 12px;
  text-align: center;
  color: var(--text-secondary, #6b7280);
}

.git-empty--inline {
  padding: 24px 12px;
  font-size: 13px;
}

.git-empty__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}

.git-empty__desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  max-width: 520px;
}

.git-empty__path {
  margin: 4px 0 0;
  color: var(--text-tertiary, #9aa1ad);
}

.git-repo__error {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-color-danger-light-5, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}

.git-repo__error-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-danger-dark-2, #c45656);
}

.git-repo__error-msg {
  margin: 6px 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary, #1f2430);
  white-space: pre-wrap;
}

.git-repo__error-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 760px) {
  .git-kv {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
