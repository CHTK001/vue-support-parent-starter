<!--
  /**
   * 虚拟桌面 · 运维窗口（命令片段 / 会话审计）
   *
   * <p>两页都来自平台自己的台账，不是远端 shell：</p>
   * <ul>
   *   <li><b>片段</b>：{@code ms_terminal_snippet} 里保存的命令，选中后可以
   *       在当前主机执行——执行走批量执行接口（单主机），会落 {@code ms_exec_log}，
   *       与「批量作业」页是同一份审计；</li>
   *   <li><b>会话</b>：{@code ms_terminal_session} 里属于这台主机的终端会话，
   *       进行中的可以断开，断开会写关闭原因。</li>
   * </ul>
   *
   * <p>片段正文可能是多行脚本，执行前原样展示，不做任何拼接或改写：
   * 用户看到的就是将要执行的那份文本。</p>
   */
  -->
<template>
  <div class="dops">
    <div class="dops__bar">
      <button type="button" class="dops__tab" :class="{ 'is-on': tab === 'snippet' }" @click="tab = 'snippet'">
        命令片段
      </button>
      <button type="button" class="dops__tab" :class="{ 'is-on': tab === 'session' }" @click="tab = 'session'">
        会话审计
      </button>
      <span class="dops__spacer" />
      <span class="dops__host">{{ hostName || `主机 #${hostId}` }}</span>
    </div>

    <!-- 片段：左列表右正文 -->
    <template v-if="tab === 'snippet'">
      <div class="dops__tools">
        <input v-model="kw" class="dops__search" type="text" spellcheck="false" placeholder="筛选名称 / 命令 / 备注" />
        <span class="dops__count">{{ filteredSnippets.length }} / {{ snippets.length }}</span>
        <span class="dops__spacer" />
        <button type="button" class="dops__btn" :disabled="loadingSnippets" @click="loadSnippets">
          <ReIcon name="RefreshRight" :size="12" />
        </button>
      </div>

      <div class="dops__body">
        <ul class="dops__list">
          <li v-if="loadingSnippets" class="dops__empty">正在读取片段…</li>
          <li v-else-if="!filteredSnippets.length" class="dops__empty">
            {{ snippets.length ? "没有匹配的片段" : "片段库为空：先在「运维台 → 片段管理」里新增一条" }}
          </li>
          <li
            v-for="s in filteredSnippets"
            :key="s.id"
            class="dops__item"
            :class="{ 'is-on': s.id === activeId }"
            @click="activeId = s.id"
          >
            <b class="dops__name">{{ s.name }}</b>
            <span class="dops__first">{{ s.firstLine || "（空片段）" }}</span>
          </li>
        </ul>

        <div class="dops__detail">
          <template v-if="current">
            <div class="dops__detail-head">
              <b>{{ current.name }}</b>
              <span class="dops__meta">{{ current.lines }} 行 · {{ current.chars }} 字符</span>
              <span class="dops__spacer" />
              <button type="button" class="dops__run" :disabled="running || !current.content.trim()" @click="runSnippet">
                {{ running ? "执行中…" : "在当前主机执行" }}
              </button>
            </div>
            <pre class="dops__code">{{ current.content || "（空片段）" }}</pre>

            <div v-if="result" class="dops__result">
              <div class="dops__result-head">
                <span>执行结果</span>
                <span class="dops__meta" :class="result.exitCode === 0 ? 'is-ok' : 'is-bad'">
                  exit {{ result.exitCode ?? "?" }} · {{ result.costMs }}ms
                </span>
              </div>
              <pre v-if="result.output" class="dops__out">{{ result.output }}</pre>
              <pre v-if="result.error" class="dops__out is-err">{{ result.error }}</pre>
              <div v-if="!result.output && !result.error" class="dops__out is-dim">（无输出）</div>
            </div>
          </template>
          <div v-else class="dops__empty">
            {{ snippets.length ? "从左侧选一条片段" : "片段库为空：先在「运维台 → 片段管理」里新增一条，再回到这里执行" }}
          </div>
        </div>
      </div>
    </template>

    <!-- 会话：这台主机的终端会话 -->
    <template v-else>
      <div class="dops__tools">
        <span class="dops__count">{{ sessions.length }} 条会话</span>
        <span class="dops__spacer" />
        <button type="button" class="dops__btn" :disabled="loadingSessions" @click="loadSessions">
          <ReIcon name="RefreshRight" :size="12" />
        </button>
      </div>

      <div class="dops__sessions">
        <div v-if="loadingSessions" class="dops__empty">正在读取会话…</div>
        <div v-else-if="!sessions.length" class="dops__empty">这台主机还没有终端会话记录</div>
        <div v-for="s in sessions" :key="s.id" class="dops__row">
          <span class="dops__dot" :class="s.open ? 'is-open' : ''" />
          <b class="dops__user">{{ s.user || "—" }}</b>
          <span class="dops__proto">{{ s.protocol || "SSH" }}</span>
          <span class="dops__ip">{{ s.clientIp || "—" }}</span>
          <span class="dops__time">{{ s.connectTime || "—" }}</span>
          <span class="dops__status" :class="s.open ? 'is-open' : ''">{{ s.statusText }}</span>
          <button v-if="s.open" type="button" class="dops__close" @click="close(s)">断开</button>
          <span v-else class="dops__time">{{ s.closeTime || "—" }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { closeSession, getSessions, getSnippets, runCommand } from "../../../api";

const props = withDefaults(
  defineProps<{
    /** 主机标识 */
    hostId: number;
    /** 主机名 */
    hostName?: string;
    /** 窗口是否激活（父级透传，这里只用于样式） */
    active?: boolean;
  }>(),
  { hostName: "", active: false },
);

/** 单次输出上限：片段可能是一段脚本，输出照样要截断 */
const MAX_OUTPUT = 16000;

/** 一页是片段还是会话 */
const tab = ref<"snippet" | "session">("snippet");

interface SnippetRow {
  id: number;
  name: string;
  content: string;
  remark: string;
  lines: number;
  chars: number;
  firstLine: string;
}

const snippets = ref<SnippetRow[]>([]);
const loadingSnippets = ref(false);
const kw = ref("");
const activeId = ref(0);
const running = ref(false);

interface RunResult {
  output: string;
  error: string;
  exitCode: number | null;
  costMs: number;
}

const result = ref<RunResult | null>(null);

const current = computed(() => snippets.value.find((s) => s.id === activeId.value) ?? null);

/** 关键字同时匹配名称、正文、备注：只记得命令里有 systemctl 是很常见的事 */
const filteredSnippets = computed(() => {
  const q = kw.value.trim().toLowerCase();
  if (!q) return snippets.value;
  return snippets.value.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q) ||
      s.remark.toLowerCase().includes(q),
  );
});

interface SessionRow {
  id: number;
  open: boolean;
  user: string;
  protocol: string;
  clientIp: string;
  connectTime: string;
  closeTime: string;
  statusText: string;
}

const sessions = ref<SessionRow[]>([]);
const loadingSessions = ref(false);

/**
 * 输出截断。
 *
 * @param s 原文
 */
function clip(s: string): string {
  if (!s) return "";
  return s.length > MAX_OUTPUT ? `${s.slice(0, MAX_OUTPUT)}\n…（输出过长，已截断）` : s;
}

/** 拉片段（后端行 → 展示行） */
async function loadSnippets(): Promise<void> {
  loadingSnippets.value = true;
  try {
    const rows = ((await getSnippets()) ?? []) as any[];
    snippets.value = rows.map((r) => {
      const content = String(r.msTerminalSnippetContent ?? "");
      const lines = content.split(/\r\n?|\n/).filter((l) => l.trim().length > 0);
      return {
        id: Number(r.id),
        name: String(r.msTerminalSnippetName ?? "").trim() || "未命名片段",
        content,
        remark: String(r.msTerminalSnippetRemark ?? "").trim(),
        lines: lines.length,
        chars: content.length,
        firstLine: (lines[0] ?? "").trim(),
      };
    });
    if (!snippets.value.some((s) => s.id === activeId.value)) activeId.value = snippets.value[0]?.id ?? 0;
  } catch (e) {
    snippets.value = [];
    ElMessage.error(`读取命令片段失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    loadingSnippets.value = false;
  }
}

/** 在当前主机执行选中的片段（单主机批量执行，会落执行日志） */
async function runSnippet(): Promise<void> {
  const s = current.value;
  if (!s || running.value || !s.content.trim()) return;
  running.value = true;
  const started = Date.now();
  try {
    const logs = ((await runCommand([props.hostId], s.content, 60)) ?? []) as any[];
    const log = logs[0] ?? {};
    result.value = {
      output: clip(String(log.msExecLogOutput ?? "")),
      error: clip(String(log.msExecLogError ?? "")),
      exitCode: log.msExecLogExitCode ?? null,
      costMs: log.msExecLogCostMs ?? Date.now() - started,
    };
  } catch (e) {
    result.value = {
      output: "",
      error: String((e as Error)?.message ?? e),
      exitCode: -1,
      costMs: Date.now() - started,
    };
  } finally {
    running.value = false;
  }
}

/** 拉会话；只保留这台主机的记录 */
async function loadSessions(): Promise<void> {
  loadingSessions.value = true;
  try {
    const rows = ((await getSessions()) ?? []) as any[];
    sessions.value = rows
      .filter((r) => Number(r.msTerminalSessionHostId ?? 0) === props.hostId)
      .map((r) => ({
        id: Number(r.id),
        open: String(r.msTerminalSessionStatus ?? "").toUpperCase() === "OPEN",
        user: String(r.msTerminalSessionUser ?? "").trim(),
        protocol: String(r.msTerminalSessionProtocol ?? "").trim(),
        clientIp: String(r.msTerminalSessionClientIp ?? "").trim(),
        connectTime: String(r.msTerminalSessionConnectTime ?? "").trim(),
        closeTime: String(r.msTerminalSessionCloseTime ?? "").trim(),
        statusText: String(r.msTerminalSessionStatus ?? "").toUpperCase() === "OPEN" ? "进行中" : "已结束",
      }));
  } catch (e) {
    sessions.value = [];
    ElMessage.error(`读取会话失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    loadingSessions.value = false;
  }
}

/**
 * 断开一条进行中的会话。
 *
 * <p>这是会踢掉用户的操作，必须先确认：谁也不想在核对会话列表时误点一下
 * 就把别人的终端关掉。</p>
 *
 * @param s 会话行
 */
async function close(s: SessionRow): Promise<void> {
  try {
    await ElMessageBox.confirm(`断开 ${s.user || "该用户"} 在 ${s.connectTime || "当前"} 建立的会话？`, "断开会话", {
      confirmButtonText: "断开",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    await closeSession(s.id);
    ElMessage.success("会话已断开");
    await loadSessions();
  } catch (e) {
    ElMessage.error(`断开会话失败：${String((e as Error)?.message ?? e)}`);
  }
}

onMounted(() => {
  void loadSnippets();
  void loadSessions();
});
</script>

<style scoped>
.dops {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.dops__bar {
  display: flex;
  flex: none;
  gap: 4px;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dops__tab {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: #b9b4c2;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
}

.dops__tab.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.28);
  border-color: rgba(233, 84, 32, 0.5);
}

.dops__spacer {
  flex: 1;
}

.dops__host {
  overflow: hidden;
  font-size: 10.5px;
  color: #8f8a9b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dops__tools {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  padding: 7px 10px 6px;
}

.dops__search {
  flex: none;
  width: 200px;
  height: 21px;
  padding: 0 8px;
  font-size: 11px;
  color: #e6e1ef;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  outline: none;
}

.dops__count {
  font-size: 10.5px;
  color: #8f8a9b;
}

.dops__btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 20px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

.dops__btn:not(:disabled):hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.3);
}

.dops__body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 8px;
  padding: 0 10px 10px;
}

.dops__list {
  flex: none;
  width: 250px;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  list-style: none;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
}

.dops__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 9px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dops__item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dops__item.is-on {
  background: rgba(233, 84, 32, 0.22);
}

.dops__name {
  overflow: hidden;
  font-size: 11.5px;
  color: #efeaf7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dops__first {
  overflow: hidden;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: #8f8a9b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dops__detail {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
}

.dops__detail-head {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  padding: 6px 9px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dops__meta {
  font-size: 10.5px;
  color: #8f8a9b;
}

.dops__meta.is-ok {
  color: #7fd6a0;
}

.dops__meta.is-bad {
  color: #ff9a86;
}

.dops__run {
  flex: none;
  height: 21px;
  padding: 0 9px;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  background: rgba(233, 84, 32, 0.85);
  border: 0;
  border-radius: 5px;
}

.dops__run:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.dops__code {
  flex: 1;
  min-height: 0;
  padding: 8px 9px;
  margin: 0;
  overflow: auto;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  line-height: 1.55;
  color: #c9c4d4;
  white-space: pre-wrap;
  word-break: break-all;
}

.dops__result {
  flex: none;
  max-height: 45%;
  overflow: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.dops__result-head {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 9px;
  font-size: 10.5px;
  color: #8f8a9b;
  background: rgba(255, 255, 255, 0.03);
}

.dops__out {
  padding: 6px 9px;
  margin: 0;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  line-height: 1.55;
  color: #c9c4d4;
  white-space: pre-wrap;
  word-break: break-all;
}

.dops__out.is-err {
  color: #ff9a86;
}

.dops__out.is-dim {
  color: #7e7889;
}

.dops__sessions {
  flex: 1;
  min-height: 0;
  padding: 0 10px 10px;
  overflow-y: auto;
}

.dops__row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 9px;
  font-size: 11px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dops__dot {
  flex: none;
  width: 6px;
  height: 6px;
  background: #6b6575;
  border-radius: 50%;
}

.dops__dot.is-open {
  background: #4ad07a;
}

.dops__user {
  flex: none;
  width: 110px;
  overflow: hidden;
  color: #efeaf7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dops__proto {
  flex: none;
  width: 54px;
  color: #8f8a9b;
}

.dops__ip {
  flex: none;
  width: 120px;
  overflow: hidden;
  color: #c9c4d4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dops__time {
  flex: none;
  color: #8f8a9b;
}

.dops__status {
  flex: none;
  margin-left: auto;
  color: #8f8a9b;
}

.dops__status.is-open {
  color: #7fd6a0;
}

.dops__close {
  flex: none;
  height: 20px;
  padding: 0 8px;
  font-size: 10.5px;
  color: #ffb3a3;
  cursor: pointer;
  background: rgba(255, 90, 60, 0.12);
  border: 1px solid rgba(255, 90, 60, 0.35);
  border-radius: 5px;
}

.dops__close:hover {
  color: #fff;
  background: rgba(255, 90, 60, 0.3);
}

.dops__empty {
  padding: 18px;
  font-size: 11.5px;
  color: #7e7889;
  text-align: center;
  list-style: none;
}
</style>
