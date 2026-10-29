<script setup lang="ts">
/**
 * 模板工作台（页面级「模板」页签）
 *
 * <p>模板 = 一份保存下来的 {@code docker run} 配置。左栏模板清单，右栏编辑
 * 镜像 / 名称 / 端口 / 环境变量 / 卷 / 网络 / 重启策略 / 命令。</p>
 *
 * <p>「立即创建」不在这里直接跑 SSE：先把模板交给安装弹窗做一次可视化确认，
 * 再复用同一条 {@code /containers/run} 通道 —— 否则模板页和安装弹窗会长出
 * 两套参数解析与两套进度处理，迟早漂移。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/core";
import type { ReOption } from "@repo/ui/components/ReSelect/types";
import { deleteTemplate, listNetworks, listTemplates, saveTemplate } from "../api";
import type { DockerNetwork, DockerTemplate } from "../api";

const props = defineProps<{
  /** 主机 id（读取可选网络列表） */
  hostId: number;
}>();

const emit = defineEmits<{
  /** 立即创建：交给安装弹窗回填并确认 */
  (e: "run", template: DockerTemplate): void;
}>();

/* ==================== 清单 ==================== */

const templates = ref<DockerTemplate[]>([]);
const loading = ref(false);
const loadError = ref("");
const selectedId = ref("");
const networks = ref<DockerNetwork[]>([]);

/** 当前选中模板 */
const selected = computed(() => templates.value.find((it) => String(it.id) === selectedId.value) ?? null);

/** 读取模板 */
async function load(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    const list = await listTemplates();
    templates.value = Array.isArray(list) ? list : [];
    if (!templates.value.some((it) => String(it.id) === selectedId.value)) {
      selectedId.value = String(templates.value[0]?.id ?? "");
    }
  } catch (e: any) {
    loadError.value = e?.message ?? "读取模板失败";
    templates.value = [];
  } finally {
    loading.value = false;
  }
}

/** 读取网络名（模板里填网络时给候选） */
async function loadNetworks(): Promise<void> {
  if (!props.hostId) return;
  try {
    const list = await listNetworks(props.hostId);
    networks.value = Array.isArray(list) ? list : [];
  } catch {
    networks.value = [];
  }
}

/* ==================== 表单 ==================== */

/** 模板页面的表单行模型（保存时汇总为模板接口要求的字符串列表） */
interface TemplatePortRow {
  hostPort: string;
  containerPort: string;
  protocol: "tcp" | "udp";
}

/** 环境变量行（保存时汇总为 "KEY=VALUE" 字符串） */
interface TemplateEnvRow {
  key: string;
  value: string;
}

/** 卷挂载行（保存时汇总为 "src:dst[:mode]" 字符串） */
interface TemplateVolumeRow {
  src: string;
  dst: string;
  mode: "rw" | "ro";
}

/** 表单模型（端口/环境变量/卷 改为表格行，提交时汇总为 "KEY=VALUE" 等字符串） */
interface TemplateForm {
  id: string;
  name: string;
  image: string;
  containerName: string;
  ports: TemplatePortRow[];
  env: TemplateEnvRow[];
  volumes: TemplateVolumeRow[];
  network: string;
  restartPolicy: string;
  command: string;
}

/** 空表单 */
function emptyForm(): TemplateForm {
  return {
    id: "",
    name: "",
    image: "",
    containerName: "",
    ports: [{ hostPort: "", containerPort: "", protocol: "tcp" }] as TemplatePortRow[],
    env: [{ key: "", value: "" }] as TemplateEnvRow[],
    volumes: [{ src: "", dst: "", mode: "rw" }] as TemplateVolumeRow[],
    network: "",
    restartPolicy: "",
    command: "",
  };
}

const form = reactive<TemplateForm>(emptyForm());
const saving = ref(false);

/** 是否新增态 */
const isNew = computed(() => !form.id);

/** 常用环境变量（key 值，value 作为二级默认值） */
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

/** KEY 行下拉选项（label / value 都是 key 本身） */
const envKeyOptions = computed<ReOption[]>(() =>
  commonEnvOptions.map((o) => ({ label: o.key, value: o.key })),
);

/** KEY 变更：选中常用 key 时回填默认 value */
function onEnvKey(i: number, v: string | number | null): void {
  const e = form.env[i];
  if (!e) return;
  e.key = String(v ?? "");
  const opt = commonEnvOptions.find((o) => o.key === e.key);
  if (opt) e.value = opt.value;
}

/** 用选中模板填充表单 */
function fillForm(item: DockerTemplate | null): void {
  if (!item) {
    Object.assign(form, emptyForm());
    return;
  }
  Object.assign(form, {
    id: String(item.id ?? ""),
    name: item.name ?? "",
    image: item.image ?? "",
    containerName: item.containerName ?? "",
    ports: (item.ports ?? []).map(parsePortRow),
    env: (item.env ?? []).map(parseEnvRow),
    volumes: (item.volumes ?? []).map(parseVolumeRow),
    network: item.network ?? "",
    restartPolicy: item.restartPolicy ?? "",
    command: item.command ?? "",
  });
}

watch(selected, (item) => fillForm(item), { immediate: true });

/** 端口映射字符串 → 行（8080:80 / 0.0.0.0:8080:80 / 8080:80/udp） */
function parsePortRow(s: string): TemplatePortRow {
  const main = s.split("/")[0];
  const proto = s.split("/")[1];
  const addrs = String(main).split(":");
  const containerPort = addrs.pop() ?? "";
  const hostPort = addrs.pop() ?? "";
  const protocol = ["tcp", "udp"].includes(proto ?? "") ? (proto as "tcp" | "udp") : "tcp";
  return { hostPort, containerPort, protocol };
}

/** 环境变量字符串 → 行（KEY=VALUE，值里可能带等号） */
function parseEnvRow(s: string): TemplateEnvRow {
  const i = s.indexOf("=");
  return { key: i > 0 ? s.slice(0, i) : s, value: i > 0 ? s.slice(i + 1) : "" };
}

/** 卷挂载字符串 → 行（src:dst:rw 或 src:dst） */
function parseVolumeRow(s: string): TemplateVolumeRow {
  const parts = s.split(":");
  const mode = parts[2] === "ro" ? "ro" : "rw";
  return { src: parts[0] ?? "", dst: parts[1] ?? "", mode };
}

/** 端口行 → 字符串（8080:80 / 8080:80/udp） */
function portToString(p: TemplatePortRow): string {
  const proto = p.protocol === "udp" ? `/${p.protocol}` : "";
  return `${p.hostPort}:${p.containerPort}${proto}`;
}

/** 环境变量行 → 字符串（KEY=VALUE） */
function envToString(e: TemplateEnvRow): string {
  return `${e.key}=${e.value}`;
}

/** 卷行 → 字符串（src:dst[:mode]） */
function volumeToString(v: TemplateVolumeRow): string {
  return `${v.src}:${v.dst}${v.mode === "ro" ? ":ro" : ""}`;
}

/** 当前表单 → 模板对象 */
function toTemplate(): DockerTemplate {
  return {
    id: form.id || undefined,
    name: form.name.trim(),
    image: form.image.trim(),
    containerName: form.containerName.trim() || undefined,
    ports: form.ports.filter((p) => p.hostPort.trim() && p.containerPort.trim()).map(portToString),
    env: form.env.filter((e) => e.key.trim()).map(envToString),
    volumes: form.volumes.filter((v) => v.src.trim() && v.dst.trim()).map(volumeToString),
    network: form.network.trim() || undefined,
    restartPolicy: form.restartPolicy.trim() || undefined,
    command: form.command.trim() || undefined,
  };
}

/** 表格行操作 */
function addPortRow(): void {
  form.ports.push({ hostPort: "", containerPort: "", protocol: "tcp" });
}
function removePortRow(i: number): void {
  form.ports.splice(i, 1);
  if (!form.ports.length) addPortRow();
}
function addEnvRow(): void {
  form.env.push({ key: "", value: "" });
}
function removeEnvRow(i: number): void {
  form.env.splice(i, 1);
  if (!form.env.length) addEnvRow();
}
function addVolumeRow(): void {
  form.volumes.push({ src: "", dst: "", mode: "rw" });
}
function removeVolumeRow(i: number): void {
  form.volumes.splice(i, 1);
  if (!form.volumes.length) addVolumeRow();
}

/* ==================== 操作 ==================== */

/** 新建 */
function createNew(): void {
  selectedId.value = "";
  fillForm(null);
}

/** 保存 */
async function save(): Promise<void> {
  const tpl = toTemplate();
  if (!tpl.name) {
    message.warning("请填写模板名称");
    return;
  }
  if (!tpl.image) {
    message.warning("请填写镜像");
    return;
  }
  saving.value = true;
  try {
    const saved = await saveTemplate(tpl);
    message.success(isNew.value ? "模板已新增" : "模板已保存");
    await load();
    if (saved?.id) selectedId.value = String(saved.id);
  } catch (e: any) {
    message.error(e?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

/** 删除模板 */
async function remove(): Promise<void> {
  if (!form.id) return;
  try {
    await ElMessageBox.confirm(`确认删除模板「${form.name}」？已创建的容器不受影响。`, "删除模板", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await deleteTemplate(form.id);
    message.success("模板已删除");
    selectedId.value = "";
    await load();
  } catch (e: any) {
    message.error(e?.message ?? "删除失败");
  }
}

/** 立即创建：交给安装弹窗（带 templateId，后端按模板补齐未传字段） */
function runNow(): void {
  const tpl = toTemplate();
  if (!tpl.image) {
    message.warning("请填写镜像");
    return;
  }
  if (!tpl.name) tpl.name = tpl.image;
  emit("run", tpl);
}

void load();
void loadNetworks();
</script>

<template>
  <div class="dk-body">
    <!-- 左栏：模板清单 -->
    <div class="dk-pane dk-pane--list">
      <div class="dk-pane-head">
        <ReIcon name="Document" :size="14" />
        <b>模板</b>
        <span class="dk-pill">{{ templates.length }}</span>
        <span class="dk-spacer" />
        <ReButton layout="square" link icon="Plus" tip="新增模板" @click="createNew" />
        <ReButton layout="square" link icon="Refresh" tip="刷新模板列表" :loading="loading" @click="load" />
      </div>

      <div class="dk-pane-body dk-pane-body--flush">
        <div v-if="loading && !templates.length" v-loading="true" class="dk-loading" />
        <div v-else-if="loadError" class="dk-empty">
          <ReIcon name="Warning" :size="22" />
          <b>读取失败</b>
          <span>{{ loadError }}</span>
          <ReButton size="small" icon="Refresh" @click="load">重试</ReButton>
        </div>
        <div v-else-if="!templates.length" class="dk-empty">
          <ReIcon name="Document" :size="22" />
          <b>还没有模板</b>
          <span>在安装容器时勾选「保存为模板」，或点右上角「+」新建</span>
        </div>
        <ul v-else class="dk-items">
          <li
            v-for="t in templates"
            :key="String(t.id)"
            class="dk-item dk-item--static"
            :class="{ on: String(t.id) === selectedId }"
            @click="selectedId = String(t.id)"
          >
            <span class="dk-dot is-off" />
            <span class="dk-item-main">
              <span class="dk-item-name" :title="t.name">{{ t.name }}</span>
              <span class="dk-item-sub" :title="t.image">{{ t.image }}</span>
            </span>
            <span class="dk-item-meta">
              <span class="dk-item-time">{{ (t.ports ?? []).length ? `${(t.ports ?? []).length} 端口` : "无端口" }}</span>
              <span class="dk-item-time" :title="t.updatedAt || t.createdAt">{{ t.updatedAt || t.createdAt || "" }}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 右栏：编辑 -->
    <div class="dk-pane dk-pane--main">
      <div class="dk-pane-head">
        <ReIcon name="Document" :size="14" />
        <b>{{ isNew ? "新增模板" : `编辑 · ${form.name}` }}</b>
        <span class="dk-spacer" />
        <ReButton layout="square" link icon="VideoPlay" tip="按此模板立即创建容器" :disabled="!form.image" @click="runNow" />
        <ReButton
          layout="square"
          link
          icon="Delete"
          type="danger"
          tip="删除模板"
          :disabled="isNew"
          @click="remove"
        />
      </div>

      <div class="dk-pane-body">
        <div class="dk-form">
          <div class="dk-row">
            <label class="dk-field">
              <span>模板名称 <i>*</i></span>
              <input v-model="form.name" class="dk-input" placeholder="如 MySQL 8 开发库" />
            </label>
            <label class="dk-field">
              <span>镜像 <i>*</i></span>
              <input v-model="form.image" class="dk-input" placeholder="mysql:8.4" />
            </label>
          </div>

          <label class="dk-field">
            <span>容器名称</span>
            <input v-model="form.containerName" class="dk-input" placeholder="留空由 Docker 随机命名" />
          </label>

          <label class="dk-field">
            <span>端口映射 <em>· 一行一个，如 3306:3306</em></span>
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
                    <input v-model="p.hostPort" class="dk-input" placeholder="3306" />
                  </td>
                  <td>
                    <input v-model="p.containerPort" class="dk-input" placeholder="8080" />
                  </td>
                  <td>
                    <select v-model="p.protocol" class="dk-select">
                      <option value="tcp">tcp</option>
                      <option value="udp">udp</option>
                    </select>
                  </td>
                  <td class="dk-tc">
                    <div class="dk-actions">
                      <ReButton layout="square" type="primary" icon="Plus" tip="添加新行" @click="addPortRow" />
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
            <span>环境变量 <em>· 一行一个 KEY=VALUE</em></span>
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
                      <ReButton layout="square" type="primary" icon="Plus" tip="添加新行" @click="addEnvRow" />
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
            <span>卷挂载 <em>· 一行一个 宿主:容器[:ro]</em></span>
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
                    <input v-model="v.src" class="dk-input" placeholder="/data/mysql" />
                  </td>
                  <td>
                    <input v-model="v.dst" class="dk-input" placeholder="/var/lib/mysql" />
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
              <span>网络</span>
              <input v-model="form.network" class="dk-input" list="dk-template-networks" placeholder="bridge" />
              <datalist id="dk-template-networks">
                <option v-for="n in networks" :key="n.name" :value="n.name" />
              </datalist>
            </label>
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
          </div>

          <label class="dk-field">
            <span>启动命令</span>
            <input v-model="form.command" class="dk-input" placeholder="留空使用镜像默认 CMD" />
          </label>

          <p class="dk-note">
            「立即创建」会把模板带入安装弹窗，确认参数后再走 SSE 安装；模板本身不直接启动容器，
            避免手滑点一下就多出一个正在跑的实例。
          </p>
        </div>
      </div>

      <div class="dk-form-foot">
        <ReButton v-if="!isNew" icon="RefreshLeft" tip="放弃改动并重新载入" @click="fillForm(selected)">重置</ReButton>
        <span class="dk-spacer" />
        <ReButton icon="VideoPlay" tip="按当前配置立即创建容器" :disabled="!form.image" @click="runNow">立即创建</ReButton>
        <ReButton type="primary" icon="Check" tip="保存模板" :loading="saving" @click="save">保存</ReButton>
      </div>
    </div>
  </div>
</template>
