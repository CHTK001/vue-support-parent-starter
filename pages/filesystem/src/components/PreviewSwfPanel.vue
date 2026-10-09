<script setup lang="ts">
/**
 * SWF（Flash）预览面板组件
 *
 * <p>浏览器早已全面移除 Flash 插件，这里用 <b>Ruffle</b>（Rust/WASM 实现的
 * Flash 模拟器）在主应用文档内直接播放 SWF：票据取回字节 → 校验文件头 →
 * Blob objectURL → {@code <ruffle-player>} 播放器 {@code load({ url })}。
 * 整条链路纯前端、不经后端转换、不依赖外网，内网可用。</p>
 *
 * <p><b>运行时资产为何放 public/ruffle/ 而非 src/。</b>npm 包
 * {@code @ruffle-rs/ruffle} 发的是 selfhosted 版 IIFE（ruffle.js），不带 ESM
 * 入口也不带类型；它在运行时按「脚本所在目录 + 固定文件名」动态加载两个
 * core chunk 和两份约 14MB 的 wasm。Vite 的 {@code ?url} 只会为被 import 的
 * 单个文件生成<b>哈希名</b>资产，对这种「按原文件名按需取兄弟文件」的加载方式
 * 无能为力 —— 只有 public 目录（原文件名直出站点根）能同时满足 dev 与 build，
 * 这也正是 Ruffle 官方的自托管部署方式。面板通过动态 {@code <script>} 引入
 * ruffle.js，Ruffle 从 script src 自动解析出 chunk / wasm 地址，无需任何
 * vite 配置改动。</p>
 *
 * <p>资产实际放在<b>共享根 public/</b>（{@code {WORKSPACE_ROOT}/public/ruffle/}），
 * 由 {@code turbo/vite/createVite.ts} 把 Vite 的 {@code publicDir} 指向该目录统一
 * 服务 —— 而不是页面包内的 {@code pages/filesystem/public/}。后者不会被任何消费方
 * App 的 dev/build 服务到（Vite 只认一个 publicDir），放那里会 404。</p>
 *
 * <p><b>错误口径</b>：加载前先校验 FWS/CWS/ZWS 文件头，坏文件直接给中文
 * 提示（「不是有效的 SWF 文件」）；播放期失败 Ruffle 会把英文 panic 屏画进
 * 容器（{@code #panic} 节点），这里用 MutationObserver 探测到后再叠一层中文
 * 错误（「需要 Ruffle 暂不支持的 ActionScript 版本 / Flash 特性」），另设
 * 60 秒兜底超时 —— 首次冷启动要下载约 28MB 的 wasm。</p>
 *
 * @author CH
 * @since 2026/10/08
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, FullScreen, Refresh, VideoPause, VideoPlay } from "@element-plus/icons-vue";
import { resolveObjectUrl } from "../api/filestorageApi";
import type { RufflePlayerElement, RuffleSourceApi } from "../types/ruffle";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（顶层对象名；包内条目时为压缩包名，展示与判型请用生效名） */
  fileName: string;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入；包内条目暂无从得知时为 0 */
  size?: number;
}>();

/**
 * Ruffle 自托管脚本地址。
 *
 * <p>Vite 把 {@code public/} 原样发布到 {@code import.meta.env.BASE_URL} 下
 * （本工程 base 为 {@code "/"}，即站点根），dev 与 build 行为一致。</p>
 */
const RUFFLE_SCRIPT_URL = `${import.meta.env.BASE_URL}ruffle/ruffle.js`;

/** SWF 加载兜底超时：首次包含 2×14MB wasm 冷启动，给足 60 秒 */
const LOAD_TIMEOUT_MS = 60_000;

/** ruffle source 注册的轮询间隔（onload 时刻 init 可能只排进了宏任务队列） */
const API_POLL_INTERVAL_MS = 20;

/** 等待 source 注册的时长上限 */
const API_POLL_TIMEOUT_MS = 5_000;

/** 播放状态同步轮询间隔（Ruffle 不派发 play/pause 事件，只能主动问） */
const PLAY_POLL_INTERVAL_MS = 800;

/** Ruffle 运行时加载 promise（模块级缓存：多面板 / 反复开关弹层只加载一次） */
let runtimePromise: Promise<RuffleSourceApi> | null = null;

/**
 * 轮询等待 ruffle.js 把 source 注册进 {@code window.RufflePlayer}。
 *
 * <p>ruffle.js 求值时会经 {@code setTimeout(0)} 异步 init（页面加载完成后注入
 * 的脚本走不到 DOMContentLoaded 分支），脚本 onload 与 source 就绪之间可能
 * 隔一个宏任务，所以这里小步轮询而不是 onload 直接取。</p>
 */
async function waitForSource(): Promise<RuffleSourceApi> {
  const deadline = Date.now() + API_POLL_TIMEOUT_MS;
  for (;;) {
    const source = window.RufflePlayer?.newest?.();
    if (source) {
      return source;
    }
    if (Date.now() > deadline) {
      throw new Error("Ruffle 运行时初始化超时，请刷新重试");
    }
    await new Promise((r) => setTimeout(r, API_POLL_INTERVAL_MS));
  }
}

/**
 * 注入 ruffle.js 并等到可用（幂等、失败后允许重试）。
 *
 * <p>注入前先占住 {@code window.RufflePlayer} 配置位：脚本求值时会读取该对象
 * 上的 {@code config}；{@code polyfills=false} 关掉它对页面
 * {@code <object>/<embed>} 的自动替换扫描 —— 我们要的是播放器 API，不是全站
 * Flash 重建。</p>
 */
function ensureRuffleRuntime(): Promise<RuffleSourceApi> {
  if (runtimePromise) {
    return runtimePromise;
  }
  runtimePromise = new Promise<RuffleSourceApi>((resolve, reject) => {
    if (typeof window.RufflePlayer?.newest !== "function") {
      window.RufflePlayer = {
        ...(window.RufflePlayer ?? {}),
        config: { ...(window.RufflePlayer?.config ?? {}), polyfills: false },
      };
    }
    const script = document.createElement("script");
    script.src = RUFFLE_SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", () => {
      waitForSource().then(resolve, reject);
    });
    script.addEventListener("error", () => {
      reject(new Error("Ruffle 播放器脚本加载失败，请确认 public/ruffle/ 资产已随站点发布"));
    });
    document.head.appendChild(script);
  });
  // 失败要清掉缓存，否则一次网络抖动后这个面板永久失效（口径同 xls2xlsx）
  runtimePromise.catch(() => {
    runtimePromise = null;
  });
  return runtimePromise;
}

/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) {
    return props.fileName;
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** 加载中 */
const loading = ref(true);
/** 错误文案（空串表示无错） */
const errorText = ref("");

/** 影片宽度（loadedmetadata 后回填） */
const movieWidth = ref(0);
/** 影片高度（loadedmetadata 后回填） */
const movieHeight = ref(0);
/** 帧率（loadedmetadata 后回填） */
const frameRate = ref(0);
/** 是否正在播放（轮询同步，驱动工具条按钮图标） */
const playing = ref(false);

/** 播放器挂载容器（常驻 DOM，加载/错误以覆盖层叠加） */
const containerEl = ref<HTMLDivElement>();

/** 当前播放器实例（null 表示未挂） */
let player: RufflePlayerElement | null = null;
/** 影片字节对应的 objectURL（释放时 revoke） */
let blobUrl = "";
/** 监听 Ruffle 内部 #panic 兜底屏 */
let panicObserver: MutationObserver | null = null;
/** 加载超时定时器 */
let loadTimer: ReturnType<typeof setTimeout> | null = null;
/** 播放状态轮询定时器 */
let playTimer: ReturnType<typeof setInterval> | null = null;
/** 加载代次：props 变化 / 卸载时递增，让旧的异步链路自动作废 */
let generation = 0;

/** 字节数可读化 */
function formatSize(bytes?: number): string {
  if (!bytes || bytes < 0) {
    return "-";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 统计条「类型」文案 */
const typeText = computed(() => "Flash SWF");

/**
 * 统计条「大小」：包内条目显示 -。
 *
 * <p>同 {@link PreviewMediaPanel} 的口径：open-entry 只回传路径，能拿到的
 * {@link props.size} 是压缩包体积而非条目体积，宁可显示 - 也不标错数字。</p>
 */
const sizeText = computed(() => (props.inner ? "-" : formatSize(props.size)));

/** 统计条「尺寸」文案 */
const dimensionText = computed(() =>
  movieWidth.value > 0 && movieHeight.value > 0 ? `${movieWidth.value}×${movieHeight.value}` : "--",
);

/** 统计条「帧率」文案 */
const frameRateText = computed(() => (frameRate.value > 0 ? `${frameRate.value} fps` : "--"));

/**
 * 播放期失败：Ruffle 在容器里渲染英文 panic 屏（wasm 加载失败、SWF 解析
 * 失败、不支持的特性等），此处转为中文错误态并盖在 panic 屏之上。
 *
 * @param gen 发起加载时的代次（过期回调不再生效）
 */
function failRuntime(gen: number): void {
  if (gen !== generation || errorText.value) {
    return;
  }
  if (loadTimer !== null) {
    clearTimeout(loadTimer);
    loadTimer = null;
  }
  if (playTimer !== null) {
    clearInterval(playTimer);
    playTimer = null;
  }
  loading.value = false;
  errorText.value =
    "该 SWF 无法在浏览器中播放：可能需要 Ruffle 暂不支持的 ActionScript 版本或 Flash 特性，"
    + "可下载后用桌面 Flash 播放器打开";
}

/**
 * 监听播放器内部 DOM：Ruffle 出错时把兜底屏挂在 {@code #panic} 节点下。
 *
 * @param el  播放器元素
 * @param gen 发起加载时的代次
 */
function watchPanic(el: HTMLElement, gen: number): void {
  panicObserver = new MutationObserver(() => {
    if (el.querySelector("#panic")) {
      failRuntime(gen);
    }
  });
  panicObserver.observe(el, { childList: true, subtree: true });
}

/** loadedmetadata：收起骨架、回填统计、开始同步播放状态 */
function onMetadata(): void {
  if (loadTimer !== null) {
    clearTimeout(loadTimer);
    loadTimer = null;
  }
  const md = player?.metadata ?? null;
  movieWidth.value = md ? Math.round(md.width) : 0;
  movieHeight.value = md ? Math.round(md.height) : 0;
  frameRate.value = md ? Math.round(md.frameRate) : 0;
  loading.value = false;
  playing.value = !!player?.isPlaying;
  if (player && playTimer === null) {
    playTimer = setInterval(() => {
      if (player) {
        playing.value = player.isPlaying;
      }
    }, PLAY_POLL_INTERVAL_MS);
  }
}

/**
 * 释放当前播放器与全部派生资源（幂等，供重载与卸载共用）。
 */
function releasePlayer(): void {
  if (loadTimer !== null) {
    clearTimeout(loadTimer);
    loadTimer = null;
  }
  if (playTimer !== null) {
    clearInterval(playTimer);
    playTimer = null;
  }
  panicObserver?.disconnect();
  panicObserver = null;
  const el = player;
  player = null;
  if (el) {
    el.removeEventListener("loadedmetadata", onMetadata);
    // remove() 触发的 disconnectedCallback 会再 destroy 一次，Ruffle 内部幂等
    try {
      el.destroy();
    } catch {
      /* 已销毁 / 实例未建时忽略 */
    }
    el.remove();
  }
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrl = "";
  }
}

/**
 * 加载并播放：签票据 → 取字节 → 校验文件头 → 起 Ruffle → load({ url })。
 *
 * <p>包内条目必须带 {@code preview=true&inner=}：条目提取只挂在预览分支上，
 * 只传 inner 会拿到整个压缩包的字节。</p>
 */
async function load(): Promise<void> {
  const gen = ++generation;
  errorText.value = "";
  loading.value = true;
  movieWidth.value = 0;
  movieHeight.value = 0;
  frameRate.value = 0;
  playing.value = false;
  releasePlayer();
  try {
    // 1. 票据直链取字节
    const params: Record<string, string> = {};
    if (props.inner) {
      params.preview = "true";
      params.inner = props.inner;
    }
    const ticketUrl = await resolveObjectUrl(props.bucket, props.objectKey, { params });
    if (!ticketUrl) {
      throw new Error("获取文件地址失败");
    }
    const res = await fetch(ticketUrl);
    if (!res.ok) {
      throw new Error(`加载失败（HTTP ${res.status}）`);
    }
    const bytes = await res.arrayBuffer();
    if (gen !== generation) {
      return;
    }

    // 2. 文件头校验：FWS=未压缩 / CWS=zlib / ZWS=lzma，不认这三个就不是 SWF
    if (bytes.byteLength < 8) {
      throw new Error("不是有效的 SWF 文件（文件过小）");
    }
    const sig = String.fromCharCode(...new Uint8Array(bytes, 0, 3));
    if (sig !== "FWS" && sig !== "CWS" && sig !== "ZWS") {
      throw new Error("不是有效的 SWF 文件（缺少 FWS/CWS/ZWS 文件头）");
    }

    // 3. 等运行时就绪（首次会拉取 public/ruffle/ 脚本与约 28MB wasm）
    const source = await ensureRuffleRuntime();
    if (gen !== generation) {
      return;
    }

    // 4. Blob objectURL → 播放器 load({ url })
    const host = containerEl.value;
    if (!host) {
      throw new Error("播放器容器尚未就绪");
    }
    blobUrl = URL.createObjectURL(new Blob([bytes], { type: "application/x-shockwave-flash" }));
    const el = source.createPlayer();
    el.style.width = "100%";
    el.style.height = "100%";
    el.addEventListener("loadedmetadata", onMetadata);
    player = el;
    // load() 要求元素已连接文档（未挂载会被静默忽略），先挂载再加载
    host.appendChild(el);
    watchPanic(el, gen);

    // 首次冷启动含 wasm 下载，60 秒兜底；loadedmetadata / panic 都会提前收掉
    loadTimer = setTimeout(() => failRuntime(gen), LOAD_TIMEOUT_MS);

    await el.load({
      url: blobUrl,
      // 全屏走播放器原生 requestFullscreen，工具条按钮与右键菜单共用
      allowFullscreen: true,
      backgroundColor: "#000000",
    });
    if (gen !== generation) {
      return;
    }
  } catch (e) {
    if (gen !== generation) {
      return;
    }
    loading.value = false;
    errorText.value = (e as Error)?.message || "加载失败";
  }
}

/** 播放 / 暂停切换（Ruffle 不发事件，点完立即读一次状态） */
function togglePlay(): void {
  const el = player;
  if (!el) {
    return;
  }
  if (el.isPlaying) {
    el.pause();
  } else {
    el.play();
  }
  playing.value = el.isPlaying;
}

/** 全屏切换（播放器原生 requestFullscreen，不受弹层 overflow 裁剪影响） */
function toggleFullscreen(): void {
  player?.setFullscreen(!player.isFullscreen);
}

/** 手动刷新：整条链路重走 */
function reload(): void {
  void load();
}

/**
 * 下载本体。
 *
 * <p>顶层对象带 {@code download=true} 走附件下载；包内条目改为在新标签打开
 * 条目字节（{@code preview+inner}）—— 网关的包内通道固定内联响应，不认
 * download 参数，硬拼上只会让人以为点了下载却弹出播放器。</p>
 */
async function downloadSelf(): Promise<void> {
  const params: Record<string, string> = {};
  if (props.inner) {
    params.preview = "true";
    params.inner = props.inner;
  } else {
    params.download = "true";
  }
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params }).catch(() => "");
  if (url) {
    window.open(url, "_blank");
  }
}

/** 页脚右侧状态文案 */
const statusText = computed(() => {
  if (errorText.value) {
    return "无法播放";
  }
  if (loading.value) {
    return "正在加载…";
  }
  return playing.value ? "在线播放中" : "已暂停";
});

onMounted(() => {
  void load();
});

watch(() => [props.bucket, props.objectKey, props.inner], () => void load());

onBeforeUnmount(() => {
  generation++;
  releasePlayer();
});
</script>

<template>
  <!-- 无自带 header：文件名与关闭按钮由外层 el-dialog 承担 -->
  <section class="swf" aria-label="SWF Flash 预览">
    <!-- ===== 统计条 ===== -->
    <div class="swf__stats">
      <div class="swf__stat">
        <span class="swf__stat-label">类型</span>
        <b class="swf__stat-value swf__stat-value--accent">{{ typeText }}</b>
      </div>
      <div class="swf__stat">
        <span class="swf__stat-label">大小</span>
        <b class="swf__stat-value">{{ sizeText }}</b>
      </div>
      <div class="swf__stat">
        <span class="swf__stat-label">尺寸</span>
        <b class="swf__stat-value">{{ dimensionText }}</b>
      </div>
      <div class="swf__stat">
        <span class="swf__stat-label">帧率</span>
        <b class="swf__stat-value">{{ frameRateText }}</b>
      </div>
    </div>

    <!-- ===== 工具条 ===== -->
    <div class="swf__toolbar">
      <span class="swf__hint">{{ inner ? `位于 ${fileName}` : effectiveName }}</span>
      <div class="swf__spacer" />
      <el-button
        :icon="playing ? VideoPause : VideoPlay"
        :disabled="loading || !!errorText"
        title="播放 / 暂停"
        aria-label="播放或暂停"
        @click="togglePlay"
      />
      <el-button
        :icon="FullScreen"
        :disabled="loading || !!errorText"
        title="全屏"
        aria-label="全屏"
        @click="toggleFullscreen"
      />
      <el-button :icon="Refresh" :loading="loading" title="重新加载" aria-label="刷新" @click="reload" />
      <el-button :icon="Download" title="下载文件" @click="downloadSelf">
        {{ inner ? "打开" : "下载" }}
      </el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <!-- 挂载点常驻 DOM（v-if 重建会丢播放器实例并重复绑监听），
         加载/错误全部作为绝对覆盖层叠在它上面 -->
    <div class="swf__body">
      <div ref="containerEl" class="swf__player" />
      <div v-if="errorText" class="swf__overlay">
        <el-empty :description="errorText">
          <el-button type="primary" :icon="Refresh" @click="reload">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </el-empty>
      </div>
      <div v-else-if="loading" class="swf__overlay swf__overlay--soft">
        <el-skeleton :rows="4" animated />
        <p class="swf__loading-text">
          正在加载 Ruffle 运行环境与 SWF…（首次需下载约 28 MB 的 WASM 模拟器，之后有缓存）
        </p>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="swf__footer">
      <span :title="inner ? `${fileName} › ${effectiveName}` : effectiveName">
        {{ inner ? `${fileName} › ${effectiveName}` : effectiveName }}
      </span>
      <span :class="{ 'is-error': !!errorText }">{{ statusText }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   SWF Flash 预览面板（koi / Element Plus 变量体系）

   与音视频 / GeoJSON 面板同一套结构：统计条 + 工具条 + 主体 + 状态栏。
   画面区保持播放器黑底（与视频面板同口径的合理例外，暗色模式无需处理），
   其余 chrome 全部走 --el-* 令牌，暗色模式自动跟随。
   ======================================================== */
.swf {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* ---- 统计条 ---- */
.swf__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.swf__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
  min-width: 0;
}

.swf__stat:first-child {
  padding-left: 0;
}

.swf__stat + .swf__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.swf__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.swf__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.swf__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.swf__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.swf__hint {
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swf__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.swf__body {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* 播放器宿主：Ruffle 是黑色播放器（与视频面板同口径的合理例外） */
.swf__player {
  position: absolute;
  inset: 0;
  background: #000;
}

/* 运行时插入的自定义元素拿不到 scoped 标记，用 :deep 兜住尺寸 */
.swf__player :deep(ruffle-player) {
  display: block;
}

/* 加载 / 错误覆盖层：盖住整块画面区，不挤压布局 */
.swf__overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: var(--el-bg-color);
}

.swf__overlay--soft {
  align-items: stretch;
  justify-content: flex-start;
  background: var(--el-bg-color-page);
}

.swf__loading-text {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* ---- 底部状态栏 ---- */
.swf__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.swf__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swf__footer .is-error {
  color: var(--el-color-danger);
}
</style>
