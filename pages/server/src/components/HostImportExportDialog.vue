<script setup lang="ts">
/**
 * 主机导入 / 导出（两个能力放在同一个弹窗里，避免左侧工具栏再排两个图标）。
 *
 * <p>两件事的共同点只在于「从外部搬东西进来」，但数据面完全不同，所以分两个页签：</p>
 * <ul>
 *   <li><b>客户端会话导入</b>：解析 OpenSSH {@code config}、PuTTY / plink 的
 *       {@code .reg} / {@code .ini}、Xshell {@code .xsh}，先按<b>地址</b>匹配已有主机；
 *       匹配不到且「未匹配自动建主机」打开时，按会话名/地址建资产（落未分组），
 *       再把账号落到该主机的「主机账号」里（建身份 + 绑定）。凭据只导入能拿到明文的；
 *       客户端自己加密过的口令会标成「需手动补」，绝不把密文当口令写库。</li>
 *   <li><b>主机信息归档</b>：走后端 {@code /ms/server/host/archive}，导出主机 + 身份
 *       （口令密文）+ 绑定关系的 JSON，并支持把同一份 JSON 导回来（幂等去重）。
 *       归档带密文，所以只在 {@code credential-key} 相同的环境之间通用。</li>
 * </ul>
 *
 * <p>为什么匹配只认地址：台账允许同一地址不同端口是两台机器（跳板/多协议场景），
 * 因此匹配顺序是「地址 + 端口」优先，其次「地址相同」，都不中才标未匹配；
 * 未匹配的行默认不勾选，避免把凭据悄无声息地丢掉。</p>
 *
 * @author CH
 * @since 4.0.0.54
 */
import { computed, ref, watch } from "vue";
import { message } from "@repo/core";
import {
  bindIdentity,
  exportHostArchive,
  getIdentities,
  importHostArchive,
  listBoundIdentities,
  saveHost,
  saveIdentity,
} from "../api";
import {
  buildSessionHostPayload,
  decodeSessionText,
  matchImportHost,
  parseSessionFile,
  SOURCE_LABEL,
  type ImportHost,
  type ParsedSession,
} from "../utils/sessionImport";

/** 预览行：解析结果 + 主机匹配 + 勾选状态 */
interface PreviewRow extends ParsedSession {
  /** 行标识（v-for key） */
  key: string;
  /** 命中的主机 ID，未匹配为 null */
  hostId: number | null;
  /** 命中的主机名 */
  hostName: string;
  /** 解析阶段的可导入性（非 SSH 会话为 false），勾选开关不能把它翻回来 */
  baseInclude: boolean;
}

const props = withDefaults(defineProps<{
  /** 是否显示 */
  modelValue: boolean;
  /** 当前主机台账（用于地址匹配） */
  hosts?: ImportHost[];
}>(), { hosts: () => [] });

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  /** 导入完成，外层刷新主机与身份列表 */
  (e: "imported"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

/* ==================== 页签 ==================== */

type TabKey = "session" | "archive";
const tab = ref<TabKey>("session");

/* ==================== 一、客户端会话导入 ==================== */

const parsed = ref<PreviewRow[]>([]);
const parsing = ref(false);
const importing = ref(false);
const parseErrors = ref<string[]>([]);

/**
 * 未匹配到台账的 SSH 会话是否直接建资产。
 *
 * <p>默认开启：客户端里有的会话，平台上大概率还没有对应主机；不建的话整批导入只能导入
 * 已经在台账里的那几台，剩下的全被丢掉。开关关掉时退回原来的「只绑定已有主机」语义。</p>
 */
const autoCreateHost = ref(true);

/**
 * 把解析结果接到主机上，并按当前开关决定未匹配行的默认勾选。
 *
 * @param rows 解析行
 * @returns 预览行
 */
function applyMatch(rows: ParsedSession[]): PreviewRow[] {
  return rows.map((r, i) => {
    const hit = matchImportHost(r.address, r.port, props.hosts ?? []);
    return {
      ...r,
      key: `${i}-${r.source}-${r.address}-${r.port}-${r.username}`,
      baseInclude: r.include,
      hostId: hit ? hit.id : null,
      hostName: hit ? hit.serverHostName : "",
      include: canIncludeRow(r.include, !!hit, r.address, r.username, autoCreateHost.value),
    };
  });
}

/**
 * 一行是否允许勾选。
 *
 * <p>已匹配主机：必须有登录用户（否则没有账号可写）；
 * 未匹配主机：开关开启时只要有地址就能建资产，用户可留给后面手动补账号。</p>
 *
 * @param baseInclude 解析阶段的协议判定
 * @param matched     是否命中台账
 * @param address     会话地址
 * @param username    会话登录用户
 * @param autoCreate  是否自动建主机
 * @returns 是否允许勾选
 */
function canIncludeRow(baseInclude: boolean, matched: boolean, address: string, username: string, autoCreate: boolean): boolean {
  if (!baseInclude || !address || !address.trim()) return false;
  // 已匹配主机：没有登录用户就没有账号可写；未匹配主机：只建资产也算有效，没有用户也允许
  return matched ? !!username : autoCreate;
}

/**
 * 预览行的「匹配主机」栏文案。
 *
 * @param r 预览行
 * @returns 展示文案
 */
function matchLabel(r: PreviewRow): string {
  if (r.hostId) return r.hostName;
  return autoCreateHost.value ? "将新建" : "未匹配";
}

/**
 * 预览行的说明栏文案。
 *
 * @param r 预览行
 * @returns 说明
 */
function rowNote(r: PreviewRow): string {
  if (!r.baseInclude) return r.note || "不是 SSH 会话，已跳过";
  if (r.hostId) {
    if (!r.username) return "缺少登录用户，无法建立账号";
    return r.note || "—";
  }
  if (!autoCreateHost.value) return "未找到对应主机，导入后会跳过";
  const prefix = r.note ? `${r.note}；` : "";
  return r.username
    ? `${prefix}未匹配，导入时新建主机（${r.address}:${r.port}）`
    : `${prefix}未匹配，导入时仅新建主机（无登录用户）`;
}

/** 开关切换后，只重算未匹配行；已匹配行保留用户手动勾选的结果 */
watch(autoCreateHost, (v) => {
  parsed.value = parsed.value.map(r => r.hostId ? r : ({
    ...r,
    include: canIncludeRow(r.baseInclude, false, r.address, r.username, v),
  }));
});

/**
 * 选文件并解析（可多选，多个文件的结果合并去重）。
 *
 * @param e input 事件
 */
async function onFilesPicked(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;
  parsing.value = true;
  parseErrors.value = [];
  const merged: ParsedSession[] = [];
  for (const f of files) {
    try {
      const text = decodeSessionText(await f.arrayBuffer());
      const rows = parseSessionFile(f.name, text);
      if (!rows.length) {
        parseErrors.value.push(`${f.name}：没有识别到可导入的会话`);
      }
      merged.push(...rows);
    } catch (err) {
      parseErrors.value.push(`${f.name}：${String((err as Error)?.message ?? err)}`);
    }
  }
  // 同一会话可能同时出现在多个文件里（例如 config 与导出的 reg），按来源+地址+端口+用户去重
  const seen = new Set<string>();
  const dedup: ParsedSession[] = [];
  for (const r of merged) {
    const k = `${r.source}|${r.address}|${r.port}|${r.username}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(r);
  }
  parsed.value = applyMatch(dedup);
  parsing.value = false;
  if (!dedup.length && !parseErrors.value.length) {
    message.warning("没有识别到会话，请确认文件类型（ssh config / PuTTY .reg / Xshell .xsh）");
  }
}

/** 拖拽悬停态 */
const dragOver = ref(false);

/**
 * 放下文件。
 *
 * @param e 拖拽事件
 */
async function onDrop(e: DragEvent): Promise<void> {
  dragOver.value = false;
  const files = Array.from(e.dataTransfer?.files ?? []);
  if (!files.length) return;
  const fake = { target: { files, value: "" } } as unknown as Event;
  await onFilesPicked(fake);
}

/** 全选开关（只选当前允许勾选的行） */
const allChecked = computed({
  get: () => parsed.value.length > 0 && parsed.value.every(r => r.include || !canIncludeRow(r.baseInclude, !!r.hostId, r.address, r.username, autoCreateHost.value)),
  set: (v: boolean) => {
    parsed.value = parsed.value.map(r => ({
      ...r,
      include: v && canIncludeRow(r.baseInclude, !!r.hostId, r.address, r.username, autoCreateHost.value),
    }));
  },
});

/** 本次会处理的行（建主机和/或建账号） */
const importable = computed(() => parsed.value.filter(r => r.include));

/**
 * 执行导入：未匹配的先建主机，再建/复用账号并绑定。
 *
 * <p>复用已有身份时不改它的口令：那是当前环境正在用的凭据，被文件里的空值或旧口令覆盖会直接
 * 造成连不上。需要换口令的用户在主机账号里改一次即可。</p>
 */
async function doSessionImport(): Promise<void> {
  const rows = importable.value;
  if (!rows.length) {
    message.warning("没有可导入的会话");
    return;
  }
  importing.value = true;
  let createdHosts = 0;
  let hostsOnly = 0;
  let created = 0;
  let reused = 0;
  let bound = 0;
  const failed: string[] = [];
  // 同一批里一个「地址+端口」只建一台主机，否则多用户会话会重复建资产
  const createdByEndpoint = new Map<string, number>();
  const usedNames = new Set((props.hosts ?? []).map(h => String(h.serverHostName ?? "").toLowerCase()));
  try {
    const identities = await getIdentities();
    const byName = new Map<string, any>();
    for (const it of identities) {
      byName.set(String(it.msServerIdentityName ?? ""), it);
    }
    const boundCache = new Map<number, Set<number>>();
    for (const r of rows) {
      try {
        const endpoint = `${r.address}:${r.port}`;
        let hostId = r.hostId ?? createdByEndpoint.get(endpoint) ?? null;
        let createdThisRow = false;
        if (!hostId) {
          const host = await saveHost(null, buildSessionHostPayload(r, usedNames));
          hostId = Number(host?.id ?? 0) || null;
          if (!hostId) {
            failed.push(`${endpoint} 主机创建失败`);
            continue;
          }
          createdByEndpoint.set(endpoint, hostId);
          createdHosts++;
          createdThisRow = true;
        }
        // 没有登录用户的会话只建资产，不建账号
        if (!r.username) {
          if (createdThisRow) hostsOnly++;
          continue;
        }
        const identityName = `${r.hostName || r.address}@${r.username}`;
        let identity = byName.get(identityName);
        if (identity) {
          reused++;
        } else {
          identity = await saveIdentity(null, {
            msServerIdentityName: identityName,
            msServerIdentityAuthType: r.password ? "PASSWORD" : "NONE",
            msServerIdentityUsername: r.username,
            msServerIdentityPassword: r.password || "",
            msServerIdentityRemark: `从 ${SOURCE_LABEL[r.source]} 导入`,
          });
          byName.set(identityName, identity);
          created++;
        }
        if (!identity?.id) {
          failed.push(`${endpoint} 账号创建失败`);
          continue;
        }
        let set = boundCache.get(hostId);
        if (!set) {
          set = new Set(await listBoundIdentities(hostId).catch(() => [] as number[]));
          boundCache.set(hostId, set);
        }
        if (!set.has(identity.id)) {
          await bindIdentity(hostId, identity.id);
          set.add(identity.id);
          bound++;
        }
      } catch (err) {
        failed.push(`${r.address}:${r.port} ${String((err as Error)?.message ?? err)}`);
      }
    }
    const summary = `导入完成：新建主机 ${createdHosts}（其中仅建主机 ${hostsOnly}），新建账号 ${created}，复用 ${reused}，新增绑定 ${bound}`;
    if (failed.length) {
      message.warning(`${summary}；${failed.length} 条失败：${failed.slice(0, 3).join("；")}`);
    } else {
      message.success(summary);
    }
    emit("imported");
    parsed.value = [];
  } finally {
    importing.value = false;
  }
}

/* ==================== 二、主机信息归档 ==================== */

const archiveBusy = ref(false);
const archiveImporting = ref(false);
/** 导入结果 */
const archiveResult = ref<any>(null);
/** 待导入的归档文件内容 */
const archivePending = ref<{ name: string; data: any; summary: string } | null>(null);

/** 归档文件选择框（点按钮时手动触发，<label> 里套按钮不会把点击透传给 input） */
const archiveFileEl = ref<HTMLInputElement | null>(null);

/**
 * 导出归档并下载为 JSON。
 */
async function doExportArchive(): Promise<void> {
  archiveBusy.value = true;
  try {
    const data = await exportHostArchive();
    const hosts = Array.isArray(data?.hosts) ? data.hosts.length : 0;
    const identities = Array.isArray(data?.identities) ? data.identities.length : 0;
    const bindings = Array.isArray(data?.bindings) ? data.bindings.length : 0;
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `主机资产归档-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    message.success(`已导出 ${hosts} 台主机 / ${identities} 个账号 / ${bindings} 条绑定`);
  } catch (e) {
    message.error(`导出失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    archiveBusy.value = false;
  }
}

/**
 * 选择归档 JSON 并做一次结构预检。
 *
 * @param e input 事件
 */
async function onArchivePicked(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const text = decodeSessionText(await file.arrayBuffer());
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || (!data.hosts && !data.identities)) {
      message.error("不是有效的归档文件：缺少 hosts / identities");
      return;
    }
    const summary = `主机 ${Array.isArray(data.hosts) ? data.hosts.length : 0} · `
      + `账号 ${Array.isArray(data.identities) ? data.identities.length : 0} · `
      + `绑定 ${Array.isArray(data.bindings) ? data.bindings.length : 0}`;
    archivePending.value = { name: file.name, data, summary };
    archiveResult.value = null;
  } catch (err) {
    message.error(`读取归档失败：${String((err as Error)?.message ?? err)}`);
  }
}

/**
 * 导入待确认的归档。
 */
async function doArchiveImport(): Promise<void> {
  if (!archivePending.value) return;
  archiveImporting.value = true;
  try {
    const res = await importHostArchive(archivePending.value.data);
    archiveResult.value = res;
    emit("imported");
    message.success(
      `导入完成：主机 +${res?.hostsCreated ?? 0}（命中 ${res?.hostsMatched ?? 0}），`
      + `账号 +${res?.identitiesCreated ?? 0}（命中 ${res?.identitiesMatched ?? 0}），`
      + `绑定 +${res?.bindingsCreated ?? 0}`);
    archivePending.value = null;
  } catch (e) {
    message.error(`导入失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    archiveImporting.value = false;
  }
}

// 每次打开都回到「客户端会话导入」，并清掉上一次的临时结果
watch(visible, (v) => {
  if (!v) return;
  parsed.value = [];
  parseErrors.value = [];
  archivePending.value = null;
  archiveResult.value = null;
});
</script>

<template>
  <ReDialog v-model="visible" title="导入 / 导出主机" width="980px" append-to-body>
    <div class="hie">
      <div class="hie__tabs">
        <button type="button" class="hie__tab" :class="{ 'is-on': tab === 'session' }" @click="tab = 'session'">
          <ReIcon name="Upload" :size="13" /> 客户端会话导入
        </button>
        <button type="button" class="hie__tab" :class="{ 'is-on': tab === 'archive' }" @click="tab = 'archive'">
          <ReIcon name="FolderOpened" :size="13" /> 主机信息归档
        </button>
      </div>

      <!-- ========== 一、客户端会话导入 ========== -->
      <div v-show="tab === 'session'" class="hie__pane">
        <p class="hie__hint">
          支持 OpenSSH <code>config</code>、PuTTY / plink 的 <code>.reg</code> 与便携版 <code>.ini</code>、
          Xshell <code>.xsh</code>。解析后先按<b>地址</b>匹配已有主机；匹配不到且开关打开时，
          按会话名/地址<b>新建主机</b>（落「未分组」，之后在主机编辑里调整），再把账号绑上去。
          同名账号沿用现有口令。
        </p>

        <label
          class="hie__drop"
          :class="{ 'is-over': dragOver }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="onDrop"
        >
          <input
            type="file"
            multiple
            class="hie__file"
            @change="onFilesPicked"
          />
          <ReIcon name="UploadFilled" :size="26" />
          <b>{{ parsing ? "正在解析…" : "点击选择文件，或把文件拖到这里" }}</b>
          <span>OpenSSH 的 <code>config</code> 没有扩展名，所以这里不按后缀过滤；类型由内容特征识别。口令只有能拿到明文的才会导入，加密过的会在下方标出</span>
        </label>

        <ul v-if="parseErrors.length" class="hie__errs">
          <li v-for="(e2, i) in parseErrors" :key="i">{{ e2 }}</li>
        </ul>

        <template v-if="parsed.length">
          <div class="hie__bar">
            <label class="hie__check" title="未匹配到台账的 SSH 会话直接建主机；关掉则退回只绑定已有主机">
              <input v-model="autoCreateHost" type="checkbox" />
              <span>未匹配自动建主机</span>
            </label>
            <label class="hie__check">
              <input type="checkbox" :checked="allChecked" @change="allChecked = ($event.target as HTMLInputElement).checked" />
              <span>全选（{{ importable.length }}/{{ parsed.length }}）</span>
            </label>
            <span class="hie__gap" />
            <span class="hie__stat">匹配到的绑定账号，未匹配的建主机后再绑定</span>
            <ReButton icon="Check" type="primary" :loading="importing" :disabled="!importable.length" @click="doSessionImport">
              导入选中 {{ importable.length }} 条
            </ReButton>
          </div>

          <div class="hie__table-wrap">
            <table class="hie__table">
              <thead>
                <tr>
                  <th class="w-check" />
                  <th>会话</th>
                  <th>地址</th>
                  <th>端口</th>
                  <th>登录用户</th>
                  <th>口令</th>
                  <th>来源</th>
                  <th>匹配 / 新建</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in parsed" :key="r.key" :class="{ 'is-off': !r.include }">
                  <td class="w-check">
                    <input
                      v-model="r.include"
                      type="checkbox"
                      :disabled="!canIncludeRow(r.baseInclude, !!r.hostId, r.address, r.username, autoCreateHost)"
                    />
                  </td>
                  <td class="mono" :title="r.name">{{ r.name || "—" }}</td>
                  <td class="mono">{{ r.address }}</td>
                  <td class="mono">{{ r.port }}</td>
                  <td class="mono">{{ r.username || "—" }}</td>
                  <td>
                    <span v-if="r.password" class="hie__tag is-ok">已带上</span>
                    <span v-else-if="r.passwordLocked" class="hie__tag is-warn">需手动补</span>
                    <span v-else class="hie__tag">无</span>
                  </td>
                  <td>{{ SOURCE_LABEL[r.source] }}</td>
                  <td>
                    <span v-if="r.hostId" class="hie__tag is-ok">{{ matchLabel(r) }}</span>
                    <span v-else-if="autoCreateHost" class="hie__tag is-warn" :title="`${r.address}:${r.port}`">{{ matchLabel(r) }}</span>
                    <span v-else class="hie__tag is-bad">{{ matchLabel(r) }}</span>
                  </td>
                  <td class="note" :title="rowNote(r)">{{ rowNote(r) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- ========== 二、主机信息归档 ========== -->
      <div v-show="tab === 'archive'" class="hie__pane">
        <p class="hie__hint">
          归档是 JSON，包含<b>主机台账 + 登录账号 + 绑定关系</b>；账号口令按库中的密文原样导出。
          导入时会按「地址 + 端口」「账号名」去重，同一份文件重复导入不会产生重复数据。
        </p>

        <div class="hie__cards">
          <div class="hie__card">
            <div class="hie__card-title"><ReIcon name="Download" :size="14" /> 导出</div>
            <p>把当前全部主机、账号与绑定关系打包成一个 JSON 文件，用于备份或迁移到另一套环境。</p>
            <ReButton icon="Download" type="primary" :loading="archiveBusy" @click="doExportArchive">
              导出为 JSON
            </ReButton>
          </div>

          <div class="hie__card">
            <div class="hie__card-title"><ReIcon name="Upload" :size="14" /> 导入</div>
            <p>选择之前导出的 JSON。主机按「地址 + 端口」、账号按名称去重，已存在的只补绑定。</p>
            <div class="hie__pick">
              <input
                ref="archiveFileEl"
                type="file"
                class="hie__file"
                accept=".json,application/json"
                @change="onArchivePicked"
              />
              <ReButton icon="FolderOpened" @click="archiveFileEl?.click()">选择归档文件</ReButton>
            </div>
            <div v-if="archivePending" class="hie__pending">
              <div class="hie__pending-head">
                <b class="mono">{{ archivePending.name }}</b>
                <span>{{ archivePending.summary }}</span>
              </div>
              <ReButton icon="Check" type="primary" :loading="archiveImporting" @click="doArchiveImport">
                确认导入
              </ReButton>
            </div>
          </div>
        </div>

        <div class="hie__warn">
          <ReIcon name="Warning" :size="14" />
          <div>
            <b>口令密文的适用边界</b>
            <p>
              导出的口令是平台加密后的密文，只在本平台同一部署环境内可解密。
              换到其他平台或重新部署后，主机、账号与绑定仍会导入，但这些口令需要重新填写。
            </p>
          </div>
        </div>

        <div v-if="archiveResult" class="hie__result">
          <div class="hie__result-title">导入结果</div>
          <div class="hie__result-grid mono">
            <span>主机 新建 <b>{{ archiveResult.hostsCreated ?? 0 }}</b> / 命中 <b>{{ archiveResult.hostsMatched ?? 0 }}</b></span>
            <span>账号 新建 <b>{{ archiveResult.identitiesCreated ?? 0 }}</b> / 命中 <b>{{ archiveResult.identitiesMatched ?? 0 }}</b></span>
            <span>绑定 新建 <b>{{ archiveResult.bindingsCreated ?? 0 }}</b> / 跳过 <b>{{ archiveResult.bindingsSkipped ?? 0 }}</b></span>
          </div>
          <ul v-if="archiveResult.warnings?.length" class="hie__warns">
            <li v-for="(w, i) in archiveResult.warnings.slice(0, 12)" :key="i">{{ w }}</li>
            <li v-if="archiveResult.warnings.length > 12">…共 {{ archiveResult.warnings.length }} 条</li>
          </ul>
        </div>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
.hie {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 68vh;
  overflow: auto;
}

.hie__tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  background: var(--el-fill-color-light);
  border-radius: 9px;
  align-self: flex-start;
}

.hie__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.hie__tab.is-on {
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}

.hie__pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hie__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.hie__hint code {
  padding: 1px 5px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11.5px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

/* ===== 拖拽区 ===== */
.hie__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 26px 16px;
  text-align: center;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.hie__drop:hover,
.hie__drop.is-over {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.hie__drop b {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.hie__drop span {
  max-width: 620px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}

.hie__file {
  display: none;
}

.hie__errs {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--el-color-danger);
}

/* ===== 工具栏 ===== */
.hie__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hie__check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.hie__gap {
  flex: 1 1 auto;
}

.hie__stat {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}

/* ===== 预览表 ===== */
.hie__table-wrap {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.hie__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.hie__table th,
.hie__table td {
  padding: 7px 10px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hie__table th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.hie__table tr.is-off {
  opacity: 0.55;
}

.hie__table td.mono {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11.5px;
}

.hie__table td.note {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-placeholder);
}

.hie__table th.w-check,
.hie__table td.w-check {
  width: 34px;
  text-align: center;
}

/* ===== 标签 ===== */
.hie__tag {
  display: inline-block;
  padding: 1px 7px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.hie__tag.is-ok {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.hie__tag.is-warn {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}

.hie__tag.is-bad {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

/* ===== 归档卡片 ===== */
.hie__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 12px;
}

.hie__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.hie__card-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.hie__card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
}

.hie__warn {
  display: flex;
  gap: 9px;
  padding: 11px 13px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 9%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 26%, transparent);
  border-radius: 9px;
}

.hie__warn b {
  display: block;
  margin-bottom: 2px;
  font-size: 12.5px;
}

.hie__warn p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.hie__warn code {
  padding: 1px 5px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11.5px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.hie__pick {
  align-self: flex-start;
}

.hie__pending {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.hie__pending-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.hie__pending-head b {
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hie__result {
  padding: 12px 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
}

.hie__result-title {
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.hie__result-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.hie__result-grid b {
  color: var(--el-color-primary);
}

.hie__warns {
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--el-color-warning);
}
</style>
