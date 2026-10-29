<script setup lang="ts">
/**
 * 安装容器弹窗
 *
 * <p>一次填完 {@code docker run} 的常用参数：镜像（支持在线检索）、名称、端口、
 * 环境变量、卷、网络、重启策略、启动命令；也可以选模板一键回填，或反过来把当前
 * 配置保存成模板。</p>
 *
 * <p>安装动作走 SSE（{@code POST /containers/run}，事件 {@code step|log|error|done}）：
 * 后端一边 {@code docker pull} 一边 {@code docker run}，右侧进度区实时回显，
 * 用户不需要盯着一个转圈的等待图标猜后端卡在哪一步。</p>
 *
 * <p>在线检索：输入 ≥2 字符、防抖 300ms 后调 {@code /images/search}；
 * 未选镜像库时后端并发检索全部启用库，结果里带来源库 / 官方 / 星标，
 * 选中后同时带回 {@code registryId}，安装时后端据此在会话内 {@code docker login}。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { message } from "@repo/core";
import type { SseClient } from "@repo/utils";
import type { ReOption } from "@repo/ui/components/ReSelect/types";
import {
  listNetworks,
  listRegistries,
  listRegistryTags,
  listTemplates,
  openDockerSse,
  runContainerUrl,
  saveTemplate,
  searchImages,
} from "../api";
import type {
  DockerImageSearchItem,
  DockerNetwork,
  DockerRegistry,
  DockerRunRequest,
  DockerTemplate,
} from "../api";

const props = defineProps<{
  /** 是否显示 */
  modelValue: boolean;
  /** 主机 id */
  hostId: number;
  /** 主机名（标题展示） */
  hostName?: string;
  /** 预填镜像（从镜像页「用此镜像创建」进入） */
  presetImage?: string;
  /** 预填镜像库 */
  presetRegistryId?: string;
  /** 预填模板（从模板页「立即创建」进入；带 id 时后端按模板补齐未传字段） */
  presetTemplate?: DockerTemplate | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  /** 安装成功（父级刷新容器清单） */
  (e: "installed", name: string): void;
}>();

/** 表单模型 */
interface RunForm {
  templateId: string;
  image: string;
  name: string;
  ports: PortRow[];
  env: EnvRow[];
  volumes: VolumeRow[];
  network: string;
  restartPolicy: string;
  command: string;
  pull: boolean;
  registryId: string;
  saveAsTemplate: boolean;
  templateName: string;
}

/** 端口映射行（组装后传给接口：8080:80 或 8080:80/udp） */
interface PortRow {
  hostPort: string;
  containerPort: string;
  protocol: "tcp" | "udp";
}

/** 环境变量行（组装后传给接口：KEY=VALUE） */
interface EnvRow {
  key: string;
  value: string;
}

/** 卷挂载行（组装后传给接口：src:dst[:mode]） */
interface VolumeRow {
  src: string;
  dst: string;
  mode: "rw" | "ro";
}

/** 空表单 */
function emptyForm(): RunForm {
  return {
    templateId: "",
    image: props.presetImage ?? "",
    name: "",
    ports: [{ hostPort: "", containerPort: "", protocol: "tcp" }] as PortRow[],
    env: [{ key: "", value: "" }] as EnvRow[],
    volumes: [{ src: "", dst: "", mode: "rw" }] as VolumeRow[],
    network: "",
    restartPolicy: "",
    command: "",
    pull: true,
    registryId: props.presetRegistryId ?? "",
    saveAsTemplate: false,
    templateName: "",
  };
}

const form = reactive<RunForm>(emptyForm());

/* ==================== 基础数据 ==================== */

const registries = ref<DockerRegistry[]>([]);
const templates = ref<DockerTemplate[]>([]);
const networks = ref<DockerNetwork[]>([]);
const metaLoading = ref(false);

/** 读取镜像库 / 模板 / 网络（弹窗打开时刷新，保证别处刚改的配置即时可见） */
async function loadMeta(): Promise<void> {
  metaLoading.value = true;
  try {
    const [regs, tpls, nets] = await Promise.allSettled([
      listRegistries(),
      listTemplates(),
      props.hostId ? listNetworks(props.hostId) : Promise.resolve([]),
    ]);
    if (regs.status === "fulfilled") registries.value = regs.value ?? [];
    if (tpls.status === "fulfilled") templates.value = tpls.value ?? [];
    if (nets.status === "fulfilled") networks.value = nets.value ?? [];
  } finally {
    metaLoading.value = false;
  }
}

/* ==================== 模板回填 ==================== */

/** 选模板 → 一键回填全部字段 */
function applyTemplate(id: string): void {
  form.templateId = id;
  const tpl = templates.value.find((t) => String(t.id) === id);
  if (!tpl) return;
  applyTemplateData(tpl);
  message.success(`已套用模板「${tpl.name}」`);
}

/** 模板 → 表单字段 */
function applyTemplateData(tpl: DockerTemplate): void {
  form.templateId = tpl.id ? String(tpl.id) : form.templateId;
  form.image = tpl.image ?? "";
  form.name = tpl.containerName ?? "";
  form.ports = (tpl.ports ?? []).map(parsePortRow);
  form.env = (tpl.env ?? []).map(parseEnvRow);
  form.volumes = (tpl.volumes ?? []).map(parseVolumeRow);
  form.network = tpl.network ?? "";
  form.restartPolicy = tpl.restartPolicy ?? "";
  form.command = tpl.command ?? "";
}

/** 端口映射字符串 → 行（8080:80 / 0.0.0.0:8080:80 / 8080:80/udp） */
function parsePortRow(s: string): PortRow {
  const main = s.split("/")[0];
  const proto = s.split("/")[1];
  const addrs = String(main).split(":");
  const containerPort = addrs.pop() ?? "";
  const hostPort = addrs.pop() ?? "";
  const protocol = ["tcp", "udp"].includes(proto ?? "") ? (proto as "tcp" | "udp") : "tcp";
  return { hostPort, containerPort, protocol };
}

/** 环境变量字符串 → 行（KEY=VALUE，值里可能带等号） */
function parseEnvRow(s: string): EnvRow {
  const i = s.indexOf("=");
  return { key: i > 0 ? s.slice(0, i) : s, value: i > 0 ? s.slice(i + 1) : "" };
}

/** 卷挂载字符串 → 行（src:dst:rw 或 src:dst） */
function parseVolumeRow(s: string): VolumeRow {
  const parts = s.split(":");
  const mode = parts[2] === "ro" ? "ro" : "rw";
  return { src: parts[0] ?? "", dst: parts[1] ?? "", mode };
}

/** 常用环境变量（下拉选择后直接生成一行） */
const commonEnvOptions = [
  { label: "TZ", key: "TZ", value: "Asia/Shanghai" },
  { label: "LANG", key: "LANG", value: "C.UTF-8" },
  { label: "JAVA_OPTS", key: "JAVA_OPTS", value: "-Xmx512m" },
  { label: "JDK_JAVA_OPTIONS", key: "JDK_JAVA_OPTIONS", value: "" },
  { label: "NODE_ENV", key: "NODE_ENV", value: "production" },
  { label: "PORT", key: "PORT", value: "8080" },
  { label: "NGINX_HOST", key: "NGINX_HOST", value: "localhost" },
  { label: "NGINX_PORT", key: "NGINX_PORT", value: "80" },
  { label: "MYSQL_ROOT_PASSWORD", key: "MYSQL_ROOT_PASSWORD", value: "" },
  { label: "MYSQL_DATABASE", key: "MYSQL_DATABASE", value: "app" },
  { label: "MYSQL_USER", key: "MYSQL_USER", value: "root" },
  { label: "MYSQL_PASSWORD", key: "MYSQL_PASSWORD", value: "" },
  { label: "POSTGRES_PASSWORD", key: "POSTGRES_PASSWORD", value: "" },
  { label: "POSTGRES_USER", key: "POSTGRES_USER", value: "postgres" },
  { label: "POSTGRES_DB", key: "POSTGRES_DB", value: "app" },
  { label: "MONGO_INITDB_ROOT_USERNAME", key: "MONGO_INITDB_ROOT_USERNAME", value: "admin" },
  { label: "MONGO_INITDB_ROOT_PASSWORD", key: "MONGO_INITDB_ROOT_PASSWORD", value: "" },
  { label: "REDIS_PASSWORD", key: "REDIS_PASSWORD", value: "" },
  { label: "RABBITMQ_DEFAULT_USER", key: "RABBITMQ_DEFAULT_USER", value: "guest" },
  { label: "RABBITMQ_DEFAULT_PASS", key: "RABBITMQ_DEFAULT_PASS", value: "guest" },
];

/* ==================== 在线镜像检索 ==================== */

const suggest = ref<DockerImageSearchItem[]>([]);
const suggestOpen = ref(false);
const suggestLoading = ref(false);
const suggestError = ref("");
/** 选中建议项后抑制一次检索，避免把 pullRef 当关键字再搜一遍 */
let suppressSearch = false;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
/** 请求序号：慢请求回来时不覆盖新结果 */
let searchSeq = 0;

/** 清空建议 */
function closeSuggest(): void {
  suggestOpen.value = false;
}

/** 关键字变化 → 防抖 300ms 检索 */
function onImageInput(): void {
  if (suppressSearch) {
    suppressSearch = false;
    return;
  }
  if (searchTimer) clearTimeout(searchTimer);
  const keyword = form.image.trim();
  if (keyword.length < 2) {
    suggest.value = [];
    suggestError.value = "";
    suggestOpen.value = false;
    return;
  }
  searchTimer = setTimeout(() => void doSearch(keyword), 300);
}

/** 执行检索 */
async function doSearch(keyword: string): Promise<void> {
  const seq = ++searchSeq;
  suggestLoading.value = true;
  suggestError.value = "";
  suggestOpen.value = true;
  try {
    const list = await searchImages(keyword, form.registryId || undefined);
    if (seq !== searchSeq) return;
    suggest.value = Array.isArray(list) ? list : [];
    suggestError.value = suggest.value.length ? "" : "没有匹配的镜像，可直接输入完整镜像名";
  } catch (e: any) {
    if (seq !== searchSeq) return;
    suggest.value = [];
    suggestError.value = e?.message ?? "在线检索失败，可直接输入完整镜像名";
  } finally {
    if (seq === searchSeq) suggestLoading.value = false;
  }
}

/** 选中检索结果：带回镜像库，并按库取标签 */
function pickSuggestion(item: DockerImageSearchItem): void {
  suppressSearch = true;
  form.image = item.name || item.pullRef;
  if (item.registryId) form.registryId = item.registryId;
  suggestOpen.value = false;
  if (!form.name) form.name = guessContainerName(form.image);
  void loadTags();
}

/** 由镜像名猜一个合法的容器名（docker 允许 a-zA-Z0-9_.-） */
function guessContainerName(image: string): string {
  const base = image.split("/").pop() ?? image;
  return base.replace(/:[^/:]+$/, "").replace(/[^a-zA-Z0-9_.-]/g, "-");
}

/* ==================== 标签 ==================== */

const tags = ref<string[]>([]);
const tagsLoading = ref(false);

/** 取镜像标签（库 + 镜像都具备才请求） */
async function loadTags(): Promise<void> {
  const image = form.image.trim();
  if (!form.registryId || !image) {
    tags.value = [];
    return;
  }
  tagsLoading.value = true;
  try {
    const list = await listRegistryTags(form.registryId, image.replace(/:[^/:]+$/, ""));
    tags.value = Array.isArray(list) ? list.slice(0, 24) : [];
  } catch {
    tags.value = [];
  } finally {
    tagsLoading.value = false;
  }
}

/** 选中标签 → 替换镜像 tag */
function pickTag(tag: string): void {
  const base = form.image.trim().replace(/:[^/:]+$/, "");
  form.image = `${base}:${tag}`;
  if (!form.name) form.name = guessContainerName(form.image);
}

/* ==================== 安装（SSE） ==================== */

/** 进度状态 */
const prog = reactive({ running: false, done: false, failed: false, lines: [] as string[] });
let sse: SseClient | null = null;

/** 进度追加一行 */
function pushLine(line: string): void {
  prog.lines.push(line);
}

/** 端口行 → 接口串（8080:80 或 8080:80/udp） */
function portToString(p: PortRow): string {
  const proto = p.protocol === "udp" ? `/${p.protocol}` : "";
  return `${p.hostPort}:${p.containerPort}${proto}`;
}

/** 环境变量行 → 接口串（KEY=VALUE） */
function envToString(e: EnvRow): string {
  return `${e.key}=${e.value}`;
}

/** 卷行 → 接口串（src:dst[:mode]） */
function volumeToString(v: VolumeRow): string {
  return `${v.src}:${v.dst}${v.mode === "ro" ? ":ro" : ""}`;
}

/** 把当前表单整理成安装请求体 */
function buildRequest(): DockerRunRequest {
  return {
    image: form.image.trim(),
    name: form.name.trim() || undefined,
    command: form.command.trim() || undefined,
    ports: form.ports.filter((p) => p.hostPort.trim() && p.containerPort.trim()).map(portToString),
    env: form.env.filter((e) => e.key.trim()).map(envToString),
    volumes: form.volumes.filter((v) => v.src.trim() && v.dst.trim()).map(volumeToString),
    network: form.network.trim() || undefined,
    restartPolicy: form.restartPolicy.trim() || undefined,
    pull: form.pull,
    registryId: form.registryId || undefined,
    templateId: form.templateId || undefined,
  };
}

/* ==================== 动态表格行（端口 / 环境变量 / 卷） ==================== */

/** 环境变量 KEY 的选项（label / value 都是 key 本身，value 作为表格回显） */
const envKeyOptions = computed<ReOption[]>(() =>
  commonEnvOptions.map((o) => ({ label: o.key, value: o.key })),
);

/** 环境变量 KEY 变更：选中常用 key 时回填默认 value */
function onEnvKey(i: number, v: string | number | null): void {
  const e = form.env[i];
  if (!e) return;
  e.key = String(v ?? "");
  const opt = commonEnvOptions.find((o) => o.key === e.key);
  if (opt) e.value = opt.value;
}

/** 添加环境变量行（KEY 允许在 ReSelect 中敲击回车直接创建） */
function addEnvRow(): void {
  form.env.push({ key: "", value: "" });
}

/** 添加端口行 */
function addPortRow(): void {
  form.ports.push({ hostPort: "", containerPort: "", protocol: "tcp" });
}

/** 删除端口行 */
function removePortRow(i: number): void {
  form.ports.splice(i, 1);
  if (!form.ports.length) addPortRow();
}

/** 删除环境变量行 */
function removeEnvRow(i: number): void {
  form.env.splice(i, 1);
  if (!form.env.length) addEnvRow();
}

/** 添加卷行 */
function addVolumeRow(): void {
  form.volumes.push({ src: "", dst: "", mode: "rw" });
}

/** 删除卷行 */
function removeVolumeRow(i: number): void {
  form.volumes.splice(i, 1);
  if (!form.volumes.length) addVolumeRow();
}

/** 保存为模板（失败即中止安装，避免用户以为已保存） */
async function persistTemplate(req: DockerRunRequest): Promise<boolean> {
  const name = (form.templateName.trim() || req.name || req.image).trim();
  try {
    await saveTemplate({
      name,
      image: req.image,
      containerName: req.name,
      ports: req.ports,
      env: req.env,
      volumes: req.volumes,
      network: req.network,
      restartPolicy: req.restartPolicy,
      command: req.command,
    });
    message.success(`已保存为模板「${name}」`);
    return true;
  } catch (e: any) {
    message.error(e?.message ?? "保存模板失败");
    return false;
  }
}

/** 开始安装 */
async function install(): Promise<void> {
  if (prog.running) return;
  if (!props.hostId) {
    message.warning("请先选择主机");
    return;
  }
  const req = buildRequest();
  if (!req.image) {
    message.warning("请填写镜像，例如 nginx:latest");
    return;
  }

  if (form.saveAsTemplate && !(await persistTemplate(req))) return;

  prog.running = true;
  prog.done = false;
  prog.failed = false;
  prog.lines = [];
  pushLine(`▶ 目标主机 #${props.hostId}，镜像 ${req.image}`);
  if (req.registryId) pushLine(`▶ 镜像库 ${registryName(req.registryId)}`);
  if (req.name) pushLine(`▶ 容器名 ${req.name}`);

  sse?.close();
  sse = openDockerSse(runContainerUrl(props.hostId), { method: "POST", body: req }, {
    onEvent: (event, data) => {
      if (event === "step") pushLine(`▶ ${data}`);
      else if (event === "log") pushLine(data);
      else if (event === "error") {
        pushLine(`✖ ${data}`);
        prog.running = false;
        prog.failed = true;
      } else if (event === "done") {
        pushLine(`✔ ${data || "安装完成"}`);
        prog.running = false;
        prog.done = true;
        message.success(`容器已创建：${req.name || req.image}`);
        emit("installed", req.name || req.image);
      }
    },
    onError: () => {
      if (!prog.done) {
        prog.running = false;
        prog.failed = true;
        pushLine("✖ 与服务器的实时通道断开，请到容器列表确认是否已创建");
      }
    },
    onClose: () => {
      // 后端 `done` 事件可能不带 data 而被 SSE 客户端丢弃，正常收流也是一种「结束」。
      if (prog.running && !prog.failed) {
        prog.running = false;
        prog.done = true;
        pushLine("✔ 安装流程已结束");
        emit("installed", req.name || req.image);
      }
    },
  });
}

/** 镜像库显示名 */
function registryName(id: string): string {
  const hit = registries.value.find((r) => String(r.id) === id);
  return hit ? `${hit.name}（${hit.type}）` : id;
}

/** 关闭弹窗（安装中不允许关闭：后端动作不会因前端断开而回滚） */
function close(): void {
  if (prog.running) return;
  sse?.close();
  sse = null;
  emit("update:modelValue", false);
}

/* ==================== 生命周期 ==================== */

/** 打开时重置表单并拉取基础数据 */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      sse?.close();
      sse = null;
      return;
    }
    Object.assign(form, emptyForm());
    if (props.presetTemplate) applyTemplateData(props.presetTemplate);
    prog.running = false;
    prog.done = false;
    prog.failed = false;
    prog.lines = [];
    suggest.value = [];
    suggestOpen.value = false;
    suggestError.value = "";
    tags.value = [];
    void loadMeta();
  },
);

watch(
  () => form.registryId,
  () => {
    suggest.value = [];
    if (form.image.trim().length >= 2 && !suppressSearch) void doSearch(form.image.trim());
    void loadTags();
  },
);

/** 底部状态文案 */
const progressText = computed(() => {
  if (prog.running) return "安装中…";
  if (prog.done) return "安装完成";
  if (prog.failed) return "安装失败";
  return "等待开始";
});

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  sse?.close();
  sse = null;
});
</script>

<template>
  <div v-if="modelValue" class="dk-mask" @click.self="close">
    <div class="dk-modal dk-modal--run" role="dialog" aria-modal="true" aria-label="安装容器">
      <div class="dk-modal-head">
        <ReIcon name="Box" :size="15" />
        <b>安装容器</b>
        <span v-if="hostName" class="dk-hint">{{ hostName }}</span>
        <span class="dk-spacer" />
        <ReButton layout="square" link icon="Close" tip="关闭" :disabled="prog.running" @click="close" />
      </div>

      <div class="dk-modal-body">
        <!-- 模板回填 + 镜像库 -->
        <div class="dk-row" style="margin-bottom: 9px">
          <label class="dk-field">
            <span>从模板回填</span>
            <select class="dk-select" :value="form.templateId" @change="applyTemplate(($event.target as HTMLSelectElement).value)">
              <option value="">不使用模板</option>
              <option v-for="t in templates" :key="String(t.id)" :value="String(t.id)">
                {{ t.name }} · {{ t.image }}
              </option>
            </select>
          </label>
          <label class="dk-field">
            <span>镜像库<em v-if="registries.length"> · {{ registries.length }} 个</em></span>
            <select v-model="form.registryId" class="dk-select" :disabled="metaLoading">
              <option value="">自动（全部启用库）</option>
              <option v-for="r in registries" :key="String(r.id)" :value="String(r.id)" :disabled="r.enabled === false">
                {{ r.name }}{{ r.builtin ? " · 内置" : "" }}{{ r.enabled === false ? " · 已停用" : "" }}
              </option>
            </select>
          </label>
        </div>

        <div class="dk-run-body">
          <!-- 左：参数 -->
          <div class="dk-form">
            <label class="dk-field">
              <span>镜像 <i>*</i><em v-if="suggestLoading"> · 检索中…</em></span>
              <div class="dk-searchbox">
                <input
                  v-model="form.image"
                  class="dk-input"
                  placeholder="输入 ≥2 字符在线检索，或直接填 nginx:latest"
                  @input="onImageInput"
                  @focus="suggest.length && (suggestOpen = true)"
                />
                <ul v-if="suggestOpen && (suggestLoading || suggest.length || suggestError)" class="dk-suggest">
                  <li v-if="suggestLoading" class="dk-suggest-sub">正在检索各镜像库…</li>
                  <li v-else-if="!suggest.length" class="dk-suggest-sub">{{ suggestError }}</li>
                  <li
                    v-for="(it, i) in suggest"
                    :key="`${it.registryId}-${it.name}-${i}`"
                    @click="pickSuggestion(it)"
                  >
                    <span class="dk-suggest-top">
                      <span class="dk-ellipsis">{{ it.name }}</span>
                      <span v-if="it.official" class="dk-pill is-info">官方</span>
                      <span v-if="it.stars" class="dk-pill">★ {{ it.stars }}</span>
                    </span>
                    <span class="dk-suggest-sub">
                      {{ it.registryName }} · {{ it.description || it.pullRef }}
                    </span>
                  </li>
                </ul>
              </div>
            </label>

            <div v-if="tags.length || tagsLoading" class="dk-tags">
              <span v-if="tagsLoading" class="dk-hint">读取标签…</span>
              <button v-for="t in tags" :key="t" type="button" :class="{ on: form.image.endsWith(`:${t}`) }" @click="pickTag(t)">
                {{ t }}
              </button>
            </div>

            <div class="dk-row">
              <label class="dk-field">
                <span>容器名称</span>
                <input v-model="form.name" class="dk-input" placeholder="留空由 Docker 随机命名" />
              </label>
              <label class="dk-field">
                <span>网络</span>
                <select v-model="form.network" class="dk-select">
                  <option value="">默认（bridge）</option>
                  <option value="host">host</option>
                  <option value="none">none</option>
                  <option v-for="n in networks" :key="n.name" :value="n.name">{{ n.name }}</option>
                </select>
              </label>
            </div>

            <label class="dk-field">
              <span>
                端口映射 <em>· 每行一个，传输层协议可加 /udp</em>
              </span>
              <table class="dk-table">
                <thead>
                  <tr>
                    <th>宿主端口</th>
                    <th>容器端口</th>
                    <th>协议</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in form.ports" :key="i">
                    <td>
                      <input v-model="p.hostPort" class="dk-input" placeholder="8080" />
                    </td>
                    <td>
                      <input v-model="p.containerPort" class="dk-input" placeholder="80" />
                    </td>
                    <td>
                      <select v-model="p.protocol" class="dk-select">
                        <option value="tcp">tcp</option>
                        <option value="udp">udp</option>
                      </select>
                    </td>
                    <td class="dk-tc">
                      <div class="dk-actions">
                        <ReButton
                          layout="square"
                          type="primary"
                          icon="Plus"
                          tip="添加新行"
                          @click="addPortRow"
                        />
                        <ReButton
                          layout="square"
                          type="danger"
                          icon="Delete"
                          tip="删除此行"
                          :disabled="form.ports.length <= 1"
                          @click="removePortRow(i)"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <span v-if="!form.ports.length" class="dk-hint">暂无端口映射</span>
            </label>

            <label class="dk-field">
              <span>
                环境变量 <em>· 每行一个 KEY=VALUE</em>
              </span>
              <table class="dk-table">
                <thead>
                  <tr>
                    <th>KEY</th>
                    <th>VALUE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(e, i) in form.env" :key="i">
                    <td>
                      <ReSelect
                        v-model="e.key"
                        :data="envKeyOptions"
                        filterable
                        allow-create
                        type="small"
                        clearable
                        placeholder="选 KEY 或敲击回车创建"
                        @update:model-value="(v: any) => onEnvKey(i, v)"
                      />
                    </td>
                    <td>
                      <input v-model="e.value" class="dk-input" placeholder="如 Asia/Shanghai" />
                    </td>
                    <td class="dk-tc">
                      <div class="dk-actions">
                        <ReButton
                          layout="square"
                          type="primary"
                          icon="Plus"
                          tip="添加新行"
                          @click="addEnvRow"
                        />
                        <ReButton
                          layout="square"
                          type="danger"
                          icon="Delete"
                          tip="删除此行"
                          :disabled="form.env.length <= 1"
                          @click="removeEnvRow(i)"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <span v-if="!form.env.length" class="dk-hint">暂无环境变量</span>
            </label>

            <label class="dk-field">
              <span>
                卷挂载 <em>· 每行一个，例 /data/nginx:/etc/nginx/conf.d:ro</em>
              </span>
              <table class="dk-table">
                <thead>
                  <tr>
                    <th>宿主路径</th>
                    <th>容器路径</th>
                    <th>权限</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(v, i) in form.volumes" :key="i">
                    <td>
                      <input v-model="v.src" class="dk-input" placeholder="/data/nginx" />
                    </td>
                    <td>
                      <input v-model="v.dst" class="dk-input" placeholder="/etc/nginx/conf.d" />
                    </td>
                    <td>
                      <select v-model="v.mode" class="dk-select">
                        <option value="rw">rw</option>
                        <option value="ro">ro</option>
                      </select>
                    </td>
                    <td class="dk-tc">
                      <div class="dk-actions">
                        <ReButton layout="square" type="primary" icon="Plus" tip="添加新行" @click="addVolumeRow" />
                        <ReButton
                          layout="square"
                          type="danger"
                          icon="Delete"
                          tip="删除此行"
                          :disabled="form.volumes.length <= 1"
                          @click="removeVolumeRow(i)"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <span v-if="!form.volumes.length" class="dk-hint">暂无卷挂载</span>
            </label>

            <div class="dk-row">
              <label class="dk-field">
                <span>重启策略</span>
                <select v-model="form.restartPolicy" class="dk-select">
                  <option value="">不设置</option>
                  <option value="no">no</option>
                  <option value="on-failure">on-failure</option>
                  <option value="always">always</option>
                  <option value="unless-stopped">unless-stopped</option>
                </select>
              </label>
              <label class="dk-field">
                <span>启动命令</span>
                <input v-model="form.command" class="dk-input" placeholder="如 nginx -g 'daemon off;'" />
              </label>
            </div>

            <label class="dk-check">
              <input v-model="form.pull" type="checkbox" />
              安装前拉取最新镜像（docker pull）
            </label>

            <label class="dk-check">
              <input v-model="form.saveAsTemplate" type="checkbox" />
              保存为模板
            </label>
            <input
              v-if="form.saveAsTemplate"
              v-model="form.templateName"
              class="dk-input"
              :placeholder="form.name || form.image || '模板名称'"
            />
          </div>

          <!-- 右：SSE 进度 -->
          <div class="dk-progress">
            <div class="dk-progress-head">
              <i class="dk-live" :class="{ on: prog.running }" />
              <span>{{ progressText }}</span>
              <span class="dk-spacer" />
              <span v-if="prog.lines.length" class="dk-hint">{{ prog.lines.length }} 行输出</span>
            </div>
            <pre class="dk-log dk-log--progress">{{ prog.lines.length ? prog.lines.join("\n") : "点击「安装」后，这里实时显示 pull / run 的每一步。" }}</pre>
          </div>
        </div>
      </div>

      <div class="dk-modal-foot">
        <span class="dk-hint">安装、下载、卸载都走 SSE 实时回显</span>
        <span class="dk-spacer" />
        <ReButton :disabled="prog.running" @click="close">关闭</ReButton>
        <ReButton type="primary" icon="Download" tip="拉取镜像并启动容器" :loading="prog.running" :disabled="prog.running" @click="install">
          {{ prog.done ? "重新安装" : "安装" }}
        </ReButton>
      </div>
    </div>
  </div>
</template>
