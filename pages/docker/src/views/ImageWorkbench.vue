<script setup lang="ts">
/**
 * 镜像工作台（页面级「镜像」页签）
 *
 * <p>左栏镜像清单（关键字过滤），右栏分为两段：下载镜像 + 镜像详情/操作。</p>
 *
 * <p>下载镜像 {@code POST /images/pull?image=&registryId=} 与删除镜像
 * {@code POST /images/{id}/remove-stream?force=} 都是 SSE（事件 {@code step|log|error|done}），
 * 统一步骤弹窗展示，不在页面上留一个只能转圈的按钮。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/core";
import type { SseClient } from "@repo/utils";
import {
  listImages,
  listRegistries,
  openDockerSse,
  pullImageUrl,
  removeImageStreamUrl,
} from "../api";
import type { DockerImage, DockerRegistry } from "../api";
import ProgressDialog from "./ProgressDialog.vue";

const props = defineProps<{
  /** 主机 id */
  hostId: number;
}>();

const emit = defineEmits<{
  /** 用某个镜像创建容器（父级打开安装弹窗并预填） */
  (e: "create", image: string, registryId?: string): void;
}>();

/* ==================== 清单 ==================== */

const images = ref<DockerImage[]>([]);
const loading = ref(false);
const loadError = ref("");
const keyword = ref("");
const selectedId = ref("");

/** 关键字过滤（引用 / ID / tag 都参与） */
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return images.value;
  return images.value.filter((it) =>
    [it.repository, it.name, it.tag, it.id].some((v) => String(v ?? "").toLowerCase().includes(kw)),
  );
});

/** 当前选中镜像 */
const selected = computed(() => images.value.find((it) => it.id === selectedId.value) ?? null);

/** 镜像引用（repository:tag） */
function imageRef(img: DockerImage): string {
  const repo = img.repository || img.name || "<none>";
  const tag = img.tag || (img.digest ? img.digest.replace(/^sha256:/, "").slice(0, 12) : "<none>");
  return `${repo}:${tag}`;
}

/** 字节 / 字符串统一成可读大小 */
function formatSize(size?: string | number): string {
  if (size === undefined || size === null || size === "") return "-";
  const n = typeof size === "number" ? size : Number(size);
  if (!Number.isFinite(n)) return String(size);
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

/** 读取镜像清单 */
async function load(): Promise<void> {
  if (!props.hostId) return;
  loading.value = true;
  loadError.value = "";
  try {
    const list = await listImages(props.hostId);
    images.value = Array.isArray(list) ? list : [];
    if (!images.value.some((it) => it.id === selectedId.value)) {
      selectedId.value = images.value[0]?.id ?? "";
    }
  } catch (e: any) {
    loadError.value = e?.message ?? "读取镜像列表失败";
    images.value = [];
  } finally {
    loading.value = false;
  }
}

watch(() => props.hostId, () => void load(), { immediate: true });

/* ==================== 镜像库（下载用） ==================== */

const registries = ref<DockerRegistry[]>([]);

/** 读取镜像库（失败不阻断页面，只是下载时不能选库） */
async function loadRegistries(): Promise<void> {
  try {
    const list = await listRegistries();
    registries.value = Array.isArray(list) ? list : [];
  } catch {
    registries.value = [];
  }
}

watch(
  () => props.hostId,
  () => void loadRegistries(),
  { immediate: true },
);

/* ==================== SSE 进度（下载 / 删除共用） ==================== */

const prog = reactive({
  open: false,
  title: "",
  running: false,
  done: false,
  failed: false,
  lines: [] as string[],
});
let sse: SseClient | null = null;

/**
 * 运行一个 {@code step|log|error|done} 的 SSE 动作。
 *
 * <p>{@code done} 事件允许不带 data，此时会被 SSE 客户端当作心跳丢弃；
 * 因此 {@code onClose} 里补一次「正常收流即完成」的判定，避免弹窗永远停在执行中。</p>
 *
 * @param title  弹窗标题
 * @param url    SSE 地址
 * @param method 请求方法
 * @param body   请求体
 * @param okText 成功提示
 * @param after  成功后的刷新动作
 */
function runProgress(
  title: string,
  url: string,
  method: "GET" | "POST",
  body: unknown,
  okText: string,
  after: () => void,
): void {
  sse?.close();
  sse = null;
  prog.open = true;
  prog.title = title;
  prog.running = true;
  prog.done = false;
  prog.failed = false;
  prog.lines = [];

  const finishOk = (): void => {
    prog.running = false;
    prog.done = true;
    after();
  };

  sse = openDockerSse(url, { method, body }, {
    onEvent: (event, data) => {
      if (event === "step") prog.lines.push(`▶ ${data}`);
      else if (event === "log") prog.lines.push(data);
      else if (event === "error") {
        prog.lines.push(`✖ ${data}`);
        prog.running = false;
        prog.failed = true;
      } else if (event === "done") {
        prog.lines.push(`✔ ${data || okText}`);
        finishOk();
        message.success(okText);
      }
    },
    onError: () => {
      if (!prog.done) {
        prog.running = false;
        prog.failed = true;
        prog.lines.push("✖ 与服务器的实时通道断开，请刷新列表确认结果");
      }
    },
    onClose: () => {
      if (prog.running && !prog.failed) {
        prog.lines.push(`✔ ${okText}`);
        finishOk();
        message.success(okText);
      }
    },
  });
}

/** 关闭进度弹窗 */
function closeProgress(): void {
  sse?.close();
  sse = null;
  prog.open = false;
  prog.running = false;
}

/* ==================== 下载镜像 ==================== */

const pull = reactive({ image: "", registryId: "" });

/** 下载（SSE） */
function doPull(): void {
  const image = pull.image.trim();
  if (!props.hostId) return;
  if (!image) {
    message.warning("请填写镜像，例如 nginx:latest");
    return;
  }
  runProgress(
    `下载镜像 ${image}`,
    pullImageUrl(props.hostId, image, pull.registryId || undefined),
    "POST",
    undefined,
    `镜像已下载：${image}`,
    () => void load(),
  );
}

/* ==================== 删除镜像（SSE） ==================== */

const removeForce = ref(false);

/** 删除镜像（SSE remove-stream） */
async function doRemove(): Promise<void> {
  const img = selected.value;
  if (!img) return;
  try {
    await ElMessageBox.confirm(
      `确认删除镜像「${imageRef(img)}」？${removeForce.value ? "已勾选强制删除，被容器引用时也会移除。" : "若仍被容器引用会失败，可勾选「强制删除」重试。"}`,
      "删除镜像",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  runProgress(
    `删除镜像 ${imageRef(img)}`,
    removeImageStreamUrl(props.hostId, img.id, removeForce.value),
    "POST",
    undefined,
    `镜像已删除：${imageRef(img)}`,
    () => {
      selectedId.value = "";
      void load();
    },
  );
}

/** 复制镜像引用 */
async function copyRef(): Promise<void> {
  if (!selected.value) return;
  try {
    await navigator.clipboard.writeText(imageRef(selected.value));
    message.success("镜像引用已复制");
  } catch {
    message.error("复制失败，请手动选择");
  }
}

/** 用当前镜像创建容器 */
function createContainer(): void {
  const img = selected.value;
  if (!img) return;
  const repo = img.repository || img.name || "";
  if (!repo || repo === "<none>") {
    message.warning("该镜像没有可用引用，请先在镜像库下载");
    return;
  }
  emit("create", imageRef(img), pull.registryId || undefined);
}

/** 打开安装容器弹窗（父级预选镜像库与镜像名） */
function openInstall(): void {
  emit("create", "");
}

onBeforeUnmount(() => {
  sse?.close();
  sse = null;
});
</script>

<template>
  <div class="dk-body">
    <!-- 左栏：镜像清单 -->
    <div class="dk-pane dk-pane--list">
      <div class="dk-pane-head">
        <ReIcon name="Files" :size="14" />
        <b>镜像</b>
        <span class="dk-pill">{{ images.length }}</span>
        <span class="dk-spacer" />
        <ReButton layout="square" icon="Plus" tip="安装容器" :disabled="!props.hostId" @click="openInstall()">
          安装容器
        </ReButton>
        <ReButton layout="square" link icon="Refresh" tip="刷新镜像列表" :loading="loading" @click="load" />
      </div>

      <div class="dk-filter">
        <input v-model="keyword" class="dk-search" placeholder="过滤镜像引用 / ID" />
      </div>

      <div class="dk-pane-body dk-pane-body--flush">
        <div v-if="loading && !images.length" v-loading="true" class="dk-loading" />
        <div v-else-if="loadError" class="dk-empty">
          <ReIcon name="Warning" :size="22" />
          <b>读取失败</b>
          <span>{{ loadError }}</span>
          <ReButton size="small" icon="Refresh" @click="load">重试</ReButton>
        </div>
        <div v-else-if="!filtered.length" class="dk-empty">
          <ReIcon name="Files" :size="22" />
          <b>{{ keyword ? "没有匹配的镜像" : "还没有镜像" }}</b>
          <span>{{ keyword ? "换个关键字试试" : "在右侧填写镜像名下载" }}</span>
        </div>
        <ul v-else class="dk-items">
          <li
            v-for="img in filtered"
            :key="img.id"
            class="dk-item dk-item--static"
            :class="{ on: img.id === selectedId }"
            @click="selectedId = img.id"
          >
            <span class="dk-dot is-off" />
            <span class="dk-item-main">
              <span class="dk-item-name" :title="imageRef(img)">{{ imageRef(img) }}</span>
              <span class="dk-item-sub dk-mono" :title="img.id">{{ img.id?.replace(/^sha256:/, "").slice(0, 12) }}</span>
            </span>
            <span class="dk-item-meta">
              <span class="dk-item-time">{{ formatSize(img.size) }}</span>
              <span class="dk-item-time" :title="img.created">{{ img.created || "-" }}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 右栏：下载 + 详情 -->
    <div class="dk-pane dk-pane--main">
      <div class="dk-pane-head">
        <ReIcon name="Box" :size="14" />
        <b>镜像详情</b>
        <span v-if="selected" class="dk-hint dk-ellipsis" :title="imageRef(selected)">{{ imageRef(selected) }}</span>
        <span class="dk-spacer" />
        <ReButton layout="square" link icon="CopyDocument" tip="复制镜像引用" :disabled="!selected" @click="copyRef" />
        <ReButton layout="square" link icon="VideoPlay" tip="用此镜像创建容器" :disabled="!selected" @click="createContainer" />
        <ReButton layout="square" link icon="Delete" type="danger" tip="删除镜像（SSE 实时进度）" :disabled="!selected" @click="doRemove" />
      </div>

      <div class="dk-pane-body">
        <!-- 下载镜像 -->
        <div class="dk-sec">
          <h4>下载镜像（SSE 实时进度）</h4>
          <div class="dk-row">
            <label class="dk-field">
              <span>镜像引用</span>
              <input v-model="pull.image" class="dk-input" placeholder="nginx:latest / registry.example.com/library/nginx:1.27" @keyup.enter="doPull" />
            </label>
            <label class="dk-field">
              <span>镜像库<em> · 私有库需在此选择</em></span>
              <select v-model="pull.registryId" class="dk-select">
                <option value="">默认（不指定库）</option>
                <option v-for="r in registries" :key="String(r.id)" :value="String(r.id)">
                  {{ r.name }}{{ r.builtin ? " · 内置" : "" }}
                </option>
              </select>
            </label>
            <div class="dk-field" style="flex: 0 0 auto">
              <span>&nbsp;</span>
              <ReButton icon="Download" tip="下载镜像并实时回显 pull 输出" :loading="prog.open && prog.running" @click="doPull">下载</ReButton>
            </div>
          </div>
        </div>

        <!-- 详情 -->
        <div v-if="!selected" class="dk-empty">
          <ReIcon name="Box" :size="24" />
          <b>未选择镜像</b>
          <span>左侧选择一条镜像查看详情</span>
        </div>
        <template v-else>
          <div class="dk-sec">
            <h4>基本信息</h4>
            <dl class="dk-kv">
              <dt>引用</dt>
              <dd class="dk-mono">{{ imageRef(selected) }}</dd>
              <dt>镜像 ID</dt>
              <dd class="dk-mono">{{ selected.id }}</dd>
              <dt>大小</dt>
              <dd>{{ formatSize(selected.size) }}</dd>
              <dt>创建时间</dt>
              <dd>{{ selected.created || "-" }}</dd>
              <dt>Digest</dt>
              <dd class="dk-mono">{{ selected.digest || "-" }}</dd>
            </dl>
          </div>

          <div class="dk-sec">
            <h4>删除</h4>
            <label class="dk-check">
              <input v-model="removeForce" type="checkbox" />
              强制删除（镜像仍被容器引用时使用）
            </label>
            <p class="dk-note">删除走 <code>remove-stream</code>，后端逐步输出 docker rmi 的结果。</p>
            <ReButton icon="Delete" type="danger" tip="删除前会再次确认" @click="doRemove">删除镜像</ReButton>
          </div>
        </template>
      </div>
    </div>

    <ProgressDialog
      :model-value="prog.open"
      :title="prog.title"
      :running="prog.running"
      :done="prog.done"
      :failed="prog.failed"
      :lines="prog.lines"
      @close="closeProgress"
    />
  </div>
</template>
