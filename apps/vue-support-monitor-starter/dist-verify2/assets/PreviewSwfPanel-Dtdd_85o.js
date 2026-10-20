import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { $ as full_screen_default, Nt as refresh_default, U as download_default, ln as video_pause_default, un as video_play_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { O as resolveObjectUrl } from "./filestorageApi-CcKqXwQ9.js";
//#region ../../pages/filesystem/src/components/PreviewSwfPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	class: "swf",
	"aria-label": "SWF Flash 预览"
};
var _hoisted_2 = { class: "swf__stats" };
var _hoisted_3 = { class: "swf__stat" };
var _hoisted_4 = { class: "swf__stat-value swf__stat-value--accent" };
var _hoisted_5 = { class: "swf__stat" };
var _hoisted_6 = { class: "swf__stat-value" };
var _hoisted_7 = { class: "swf__stat" };
var _hoisted_8 = { class: "swf__stat-value" };
var _hoisted_9 = { class: "swf__stat" };
var _hoisted_10 = { class: "swf__stat-value" };
var _hoisted_11 = { class: "swf__toolbar" };
var _hoisted_12 = { class: "swf__hint" };
var _hoisted_13 = { class: "swf__body" };
var _hoisted_14 = {
	key: 0,
	class: "swf__overlay"
};
var _hoisted_15 = {
	key: 1,
	class: "swf__overlay swf__overlay--soft"
};
var _hoisted_16 = { class: "swf__footer" };
var _hoisted_17 = ["title"];
var LOAD_TIMEOUT_MS = 6e4;
/** ruffle source 注册的轮询间隔（onload 时刻 init 可能只排进了宏任务队列） */
var API_POLL_INTERVAL_MS = 20;
/** 等待 source 注册的时长上限 */
var API_POLL_TIMEOUT_MS = 5e3;
/** 播放状态同步轮询间隔（Ruffle 不派发 play/pause 事件，只能主动问） */
var PLAY_POLL_INTERVAL_MS = 800;
//#endregion
//#region ../../pages/filesystem/src/components/PreviewSwfPanel.vue
var PreviewSwfPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PreviewSwfPanel",
	props: {
		bucket: {},
		objectKey: {},
		fileName: {},
		inner: {},
		size: {}
	},
	setup(__props) {
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
		const props = __props;
		/**
		* Ruffle 自托管脚本地址。
		*
		* <p>Vite 把 {@code public/} 原样发布到 {@code import.meta.env.BASE_URL} 下
		* （本工程 base 为 {@code "/"}，即站点根），dev 与 build 行为一致。</p>
		*/
		const RUFFLE_SCRIPT_URL = `/ruffle/ruffle.js`;
		/** SWF 加载兜底超时：首次包含 2×14MB wasm 冷启动，给足 60 秒 */
		let runtimePromise = null;
		/**
		* 轮询等待 ruffle.js 把 source 注册进 {@code window.RufflePlayer}。
		*
		* <p>ruffle.js 求值时会经 {@code setTimeout(0)} 异步 init（页面加载完成后注入
		* 的脚本走不到 DOMContentLoaded 分支），脚本 onload 与 source 就绪之间可能
		* 隔一个宏任务，所以这里小步轮询而不是 onload 直接取。</p>
		*/
		async function waitForSource() {
			const deadline = Date.now() + API_POLL_TIMEOUT_MS;
			for (;;) {
				const source = window.RufflePlayer?.newest?.();
				if (source) return source;
				if (Date.now() > deadline) throw new Error("Ruffle 运行时初始化超时，请刷新重试");
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
		function ensureRuffleRuntime() {
			if (runtimePromise) return runtimePromise;
			runtimePromise = new Promise((resolve, reject) => {
				if (typeof window.RufflePlayer?.newest !== "function") window.RufflePlayer = {
					...window.RufflePlayer ?? {},
					config: {
						...window.RufflePlayer?.config ?? {},
						polyfills: false
					}
				};
				const script = document.createElement("script");
				script.src = RUFFLE_SCRIPT_URL;
				script.async = true;
				script.addEventListener("load", () => {
					waitForSource().then(resolve, reject);
				});
				script.addEventListener("error", () => {
					reject(/* @__PURE__ */ new Error("Ruffle 播放器脚本加载失败，请确认 public/ruffle/ 资产已随站点发布"));
				});
				document.head.appendChild(script);
			});
			runtimePromise.catch(() => {
				runtimePromise = null;
			});
			return runtimePromise;
		}
		/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
		const effectiveName = computed(() => {
			const p = props.inner;
			if (!p) return props.fileName;
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
		const containerEl = ref();
		/** 当前播放器实例（null 表示未挂） */
		let player = null;
		/** 影片字节对应的 objectURL（释放时 revoke） */
		let blobUrl = "";
		/** 监听 Ruffle 内部 #panic 兜底屏 */
		let panicObserver = null;
		/** 加载超时定时器 */
		let loadTimer = null;
		/** 播放状态轮询定时器 */
		let playTimer = null;
		/** 加载代次：props 变化 / 卸载时递增，让旧的异步链路自动作废 */
		let generation = 0;
		/** 字节数可读化 */
		function formatSize(bytes) {
			if (!bytes || bytes < 0) return "-";
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			if (bytes < 1073741824) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
		const sizeText = computed(() => props.inner ? "-" : formatSize(props.size));
		/** 统计条「尺寸」文案 */
		const dimensionText = computed(() => movieWidth.value > 0 && movieHeight.value > 0 ? `${movieWidth.value}×${movieHeight.value}` : "--");
		/** 统计条「帧率」文案 */
		const frameRateText = computed(() => frameRate.value > 0 ? `${frameRate.value} fps` : "--");
		/**
		* 播放期失败：Ruffle 在容器里渲染英文 panic 屏（wasm 加载失败、SWF 解析
		* 失败、不支持的特性等），此处转为中文错误态并盖在 panic 屏之上。
		*
		* @param gen 发起加载时的代次（过期回调不再生效）
		*/
		function failRuntime(gen) {
			if (gen !== generation || errorText.value) return;
			if (loadTimer !== null) {
				clearTimeout(loadTimer);
				loadTimer = null;
			}
			if (playTimer !== null) {
				clearInterval(playTimer);
				playTimer = null;
			}
			loading.value = false;
			errorText.value = "该 SWF 无法在浏览器中播放：可能需要 Ruffle 暂不支持的 ActionScript 版本或 Flash 特性，可下载后用桌面 Flash 播放器打开";
		}
		/**
		* 监听播放器内部 DOM：Ruffle 出错时把兜底屏挂在 {@code #panic} 节点下。
		*
		* @param el  播放器元素
		* @param gen 发起加载时的代次
		*/
		function watchPanic(el, gen) {
			panicObserver = new MutationObserver(() => {
				if (el.querySelector("#panic")) failRuntime(gen);
			});
			panicObserver.observe(el, {
				childList: true,
				subtree: true
			});
		}
		/** loadedmetadata：收起骨架、回填统计、开始同步播放状态 */
		function onMetadata() {
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
			if (player && playTimer === null) playTimer = setInterval(() => {
				if (player) playing.value = player.isPlaying;
			}, PLAY_POLL_INTERVAL_MS);
		}
		/**
		* 释放当前播放器与全部派生资源（幂等，供重载与卸载共用）。
		*/
		function releasePlayer() {
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
				try {
					el.destroy();
				} catch {}
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
		async function load() {
			const gen = ++generation;
			errorText.value = "";
			loading.value = true;
			movieWidth.value = 0;
			movieHeight.value = 0;
			frameRate.value = 0;
			playing.value = false;
			releasePlayer();
			try {
				const params = {};
				if (props.inner) {
					params.preview = "true";
					params.inner = props.inner;
				}
				const ticketUrl = await resolveObjectUrl(props.bucket, props.objectKey, { params });
				if (!ticketUrl) throw new Error("获取文件地址失败");
				const res = await fetch(ticketUrl);
				if (!res.ok) throw new Error(`加载失败（HTTP ${res.status}）`);
				const bytes = await res.arrayBuffer();
				if (gen !== generation) return;
				if (bytes.byteLength < 8) throw new Error("不是有效的 SWF 文件（文件过小）");
				const sig = String.fromCharCode(...new Uint8Array(bytes, 0, 3));
				if (sig !== "FWS" && sig !== "CWS" && sig !== "ZWS") throw new Error("不是有效的 SWF 文件（缺少 FWS/CWS/ZWS 文件头）");
				const source = await ensureRuffleRuntime();
				if (gen !== generation) return;
				const host = containerEl.value;
				if (!host) throw new Error("播放器容器尚未就绪");
				blobUrl = URL.createObjectURL(new Blob([bytes], { type: "application/x-shockwave-flash" }));
				const el = source.createPlayer();
				el.style.width = "100%";
				el.style.height = "100%";
				el.addEventListener("loadedmetadata", onMetadata);
				player = el;
				host.appendChild(el);
				watchPanic(el, gen);
				loadTimer = setTimeout(() => failRuntime(gen), LOAD_TIMEOUT_MS);
				await el.load({
					url: blobUrl,
					allowFullscreen: true,
					backgroundColor: "#000000"
				});
				if (gen !== generation) return;
			} catch (e) {
				if (gen !== generation) return;
				loading.value = false;
				errorText.value = e?.message || "加载失败";
			}
		}
		/** 播放 / 暂停切换（Ruffle 不发事件，点完立即读一次状态） */
		function togglePlay() {
			const el = player;
			if (!el) return;
			if (el.isPlaying) el.pause();
			else el.play();
			playing.value = el.isPlaying;
		}
		/** 全屏切换（播放器原生 requestFullscreen，不受弹层 overflow 裁剪影响） */
		function toggleFullscreen() {
			player?.setFullscreen(!player.isFullscreen);
		}
		/** 手动刷新：整条链路重走 */
		function reload() {
			load();
		}
		/**
		* 下载本体。
		*
		* <p>顶层对象带 {@code download=true} 走附件下载；包内条目改为在新标签打开
		* 条目字节（{@code preview+inner}）—— 网关的包内通道固定内联响应，不认
		* download 参数，硬拼上只会让人以为点了下载却弹出播放器。</p>
		*/
		async function downloadSelf() {
			const params = {};
			if (props.inner) {
				params.preview = "true";
				params.inner = props.inner;
			} else params.download = "true";
			const url = await resolveObjectUrl(props.bucket, props.objectKey, { params }).catch(() => "");
			if (url) window.open(url, "_blank");
		}
		/** 页脚右侧状态文案 */
		const statusText = computed(() => {
			if (errorText.value) return "无法播放";
			if (loading.value) return "正在加载…";
			return playing.value ? "在线播放中" : "已暂停";
		});
		onMounted(() => {
			load();
		});
		watch(() => [
			props.bucket,
			props.objectKey,
			props.inner
		], () => void load());
		onBeforeUnmount(() => {
			generation++;
			releasePlayer();
		});
		return (_ctx, _cache) => {
			const _component_el_button = resolveComponent("el-button");
			const _component_el_empty = resolveComponent("el-empty");
			const _component_el_skeleton = resolveComponent("el-skeleton");
			return openBlock(), createElementBlock("section", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [
					createBaseVNode("div", _hoisted_3, [_cache[0] || (_cache[0] = createBaseVNode("span", { class: "swf__stat-label" }, "类型", -1)), createBaseVNode("b", _hoisted_4, toDisplayString(typeText.value), 1)]),
					createBaseVNode("div", _hoisted_5, [_cache[1] || (_cache[1] = createBaseVNode("span", { class: "swf__stat-label" }, "大小", -1)), createBaseVNode("b", _hoisted_6, toDisplayString(sizeText.value), 1)]),
					createBaseVNode("div", _hoisted_7, [_cache[2] || (_cache[2] = createBaseVNode("span", { class: "swf__stat-label" }, "尺寸", -1)), createBaseVNode("b", _hoisted_8, toDisplayString(dimensionText.value), 1)]),
					createBaseVNode("div", _hoisted_9, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "swf__stat-label" }, "帧率", -1)), createBaseVNode("b", _hoisted_10, toDisplayString(frameRateText.value), 1)])
				]),
				createBaseVNode("div", _hoisted_11, [
					createBaseVNode("span", _hoisted_12, toDisplayString(__props.inner ? `位于 ${__props.fileName}` : effectiveName.value), 1),
					_cache[4] || (_cache[4] = createBaseVNode("div", { class: "swf__spacer" }, null, -1)),
					createVNode(_component_el_button, {
						icon: playing.value ? unref(video_pause_default) : unref(video_play_default),
						disabled: loading.value || !!errorText.value,
						title: "播放 / 暂停",
						"aria-label": "播放或暂停",
						onClick: togglePlay
					}, null, 8, ["icon", "disabled"]),
					createVNode(_component_el_button, {
						icon: unref(full_screen_default),
						disabled: loading.value || !!errorText.value,
						title: "全屏",
						"aria-label": "全屏",
						onClick: toggleFullscreen
					}, null, 8, ["icon", "disabled"]),
					createVNode(_component_el_button, {
						icon: unref(refresh_default),
						loading: loading.value,
						title: "重新加载",
						"aria-label": "刷新",
						onClick: reload
					}, null, 8, ["icon", "loading"]),
					createVNode(_component_el_button, {
						icon: unref(download_default),
						title: "下载文件",
						onClick: downloadSelf
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(__props.inner ? "打开" : "下载"), 1)]),
						_: 1
					}, 8, ["icon"])
				]),
				createBaseVNode("div", _hoisted_13, [createBaseVNode("div", {
					ref_key: "containerEl",
					ref: containerEl,
					class: "swf__player"
				}, null, 512), errorText.value ? (openBlock(), createElementBlock("div", _hoisted_14, [createVNode(_component_el_empty, { description: errorText.value }, {
					default: withCtx(() => [createVNode(_component_el_button, {
						type: "primary",
						icon: unref(refresh_default),
						onClick: reload
					}, {
						default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode("重试", -1)])]),
						_: 1
					}, 8, ["icon"]), createVNode(_component_el_button, {
						icon: unref(download_default),
						onClick: downloadSelf
					}, {
						default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("下载文件", -1)])]),
						_: 1
					}, 8, ["icon"])]),
					_: 1
				}, 8, ["description"])])) : loading.value ? (openBlock(), createElementBlock("div", _hoisted_15, [createVNode(_component_el_skeleton, {
					rows: 4,
					animated: ""
				}), _cache[7] || (_cache[7] = createBaseVNode("p", { class: "swf__loading-text" }, " 正在加载 Ruffle 运行环境与 SWF…（首次需下载约 28 MB 的 WASM 模拟器，之后有缓存） ", -1))])) : createCommentVNode("", true)]),
				createBaseVNode("footer", _hoisted_16, [createBaseVNode("span", { title: __props.inner ? `${__props.fileName} › ${effectiveName.value}` : effectiveName.value }, toDisplayString(__props.inner ? `${__props.fileName} › ${effectiveName.value}` : effectiveName.value), 9, _hoisted_17), createBaseVNode("span", { class: normalizeClass({ "is-error": !!errorText.value }) }, toDisplayString(statusText.value), 3)])
			]);
		};
	}
}), [["__scopeId", "data-v-7048e9e4"]]);
//#endregion
export { PreviewSwfPanel_default as default };
