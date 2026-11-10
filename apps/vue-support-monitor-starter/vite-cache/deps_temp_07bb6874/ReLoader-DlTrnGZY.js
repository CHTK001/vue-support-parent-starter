import { Kn as ref, U as computed, Wn as reactive, a as createApp, pt as h } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { a as resolveLoaderDeployPolicy } from "./src-CyyrhO16.js";
import ReLoader from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReLoader/ReLoader.vue";
import ReLoaderHairline from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReLoader/HairlinePreview.vue";
import ReLoaderDinoGame from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReLoader/DinoGame.vue";
//#region ../../packages/ui/src/components/ReLoader/progressEstimator.ts
/**
* 创建一个进度估算器。
*
* @param options 配置
* @returns 估算器句柄
*/
function createProgressEstimator(options = {}) {
	const ceiling = clamp(options.ceiling ?? 90, 1, 99);
	const tau = Math.max(200, options.tau ?? 8e3);
	const interval = Math.max(50, options.interval ?? 200);
	const stopOnReal = options.stopOnRealProgress !== false;
	const startedAt = Date.now();
	let current = 0;
	let active = true;
	let timer = null;
	const emit = (v) => {
		current = v;
		options.onTick?.(v);
	};
	const clear = () => {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	};
	const compute = () => {
		const elapsed = Date.now() - startedAt;
		return ceiling * (1 - Math.exp(-elapsed / tau));
	};
	timer = setInterval(() => {
		if (!active) return;
		const next = Math.max(current, compute());
		emit(Math.min(next, ceiling));
	}, interval);
	timer?.unref?.();
	return {
		get percent() {
			return current;
		},
		get active() {
			return active;
		},
		setReal(percent) {
			const v = clamp(percent, 0, 100);
			if (stopOnReal) {
				active = false;
				clear();
			}
			emit(v);
		},
		finish(immediate = false) {
			active = false;
			clear();
			if (immediate) emit(100);
			else {
				const from = current;
				const t0 = Date.now();
				const dur = 200;
				const t = setInterval(() => {
					const k = Math.min(1, (Date.now() - t0) / dur);
					emit(from + (100 - from) * k);
					if (k >= 1) clearInterval(t);
				}, 30);
			}
		},
		stop() {
			active = false;
			clear();
		}
	};
}
/** 数值限幅 */
function clamp(v, min, max) {
	if (!Number.isFinite(v)) return min;
	return Math.min(max, Math.max(min, v));
}
//#endregion
//#region ../../packages/ui/src/components/ReLoader/visibility.ts
/**
* 页面不可见时暂停动画（省电）。
*
* <p>背景：标签页切到后台后，浏览器虽会节流 rAF，但 CSS 动画仍可能继续消耗
* 合成/绘制资源；笔记本上开一晚上多个后台标签会明显耗电。而用户根本看不见
* 这些动画 —— 切回来时它应该从"当前状态"继续，而不是从头开始。</p>
*
* <p>实现方式：用一个**响应式**的"页面是否可见"状态，各变体按它加上
* {@code .is-paused} 类；CSS 里写「容器带 .is-paused 时内部动画 play-state: paused」。</p>
*
* <p>为什么不用 {@code html.is-page-hidden} + scoped：scoped 编译会把
* {@code :global(html.x) .y} 里的后代选择器退化成孤立的 {@code html.x}，
* 规则匹配不到动画元素（实测 play-state 始终 running）。改成"标记打在动画容器
* 自己身上"就绕开了这个问题。</p>
*/
/** 页面是否可见（响应式；各组件 watch 它来加/摘暂停类） */
var pageVisible = ref(typeof document === "undefined" ? true : !document.hidden);
/** 暂停态的 class 名（各变体 CSS 需配合） */
var PAUSED_CLASS = "is-paused";
/** 已注册的监听解绑函数 */
var unbind = null;
/**
* 监听页面可见性（幂等：多次调用只绑定一次）。
*
* <p><b>不解绑</b>：页面可见性是**进程级**状态，不是某个加载遮罩的生命周期。
* 之前把它挂在「宿主应用创建/销毁」上，结果遮罩一开一关就把监听摘掉了 ——
* 之后页面再切后台，动画照旧在跑（实测 {@link pageVisible} 一直停在 true）。</p>
*
* <p>改为模块级单例绑定：首次调用时注册，之后一直有效。</p>
*/
function bindVisibilityPause() {
	if (typeof document === "undefined") return () => {};
	if (unbind) return unbind;
	const apply = () => {
		pageVisible.value = !document.hidden;
	};
	apply();
	document.addEventListener("visibilitychange", apply);
	unbind = () => {
		document.removeEventListener("visibilitychange", apply);
		unbind = null;
	};
	return unbind;
}
//#endregion
//#region ../../packages/ui/src/components/ReLoader/service.ts
/**
* ReLoader 命令式服务。
*
* <p>为什么需要它：很多加载态不是由「一个响应式布尔值」驱动的 ——
* 文件上传、批量任务、跨组件的长流程，调用点与渲染点根本不在一处。
* 这种场景下声明式组件很别扭（要在某处存一个 ref、再想办法跨层传递），
* 命令式 `ReLoader.open()` 返回一个句柄，谁发起谁推进进度、谁收尾。</p>
*
* <p>实现上挂一个独立的 Vue 应用实例到 body：不污染宿主 app 的组件上下文，
* 也保证全屏遮罩不受父级 `overflow: hidden` / `transform` 影响。
* ReLoader 内部按需引入 ElButton，因此该独立实例不依赖宿主是否全局注册了 Element Plus。</p>
*/
var instances = reactive([]);
var hostEl = null;
var hostApp = null;
var seq = 0;
/** 句柄注册表：id → handle（onTimeout 等回调需要把句柄交回调用方） */
var handles = /* @__PURE__ */ new Map();
/**
* 单例表：singletonKey → 实例 + 引用计数。
*
* <p>并发请求共用遮罩的实现基础：后到的 open 不新建遮罩，只把计数 +1；
* 每个请求结束各自 close，计数归零才真正关闭。</p>
*/
var singletons = /* @__PURE__ */ new Map();
function handleOf(rec) {
	return handles.get(rec.id);
}
function ensureHost() {
	if (hostApp) return;
	hostEl = document.createElement("div");
	hostEl.setAttribute("data-re-loader-host", "");
	document.body.appendChild(hostEl);
	bindVisibilityPause();
	hostApp = createApp({
		name: "ReLoaderHost",
		render() {
			return instances.map((rec, i) => h(ReLoader, {
				key: rec.id,
				loading: rec.visible,
				variant: rec.variant,
				size: rec.size,
				color: rec.color,
				text: rec.text,
				percent: rec.progress,
				fullscreen: rec.fullscreen ?? true,
				mask: rec.mask ?? true,
				closable: rec.closable ?? false,
				cancelOnEsc: rec.cancelOnEsc ?? true,
				failed: rec.failed,
				errorMessage: rec.errorMessage,
				retrying: rec.retrying,
				errorText: rec.errorText,
				delay: rec.delay ?? 0,
				minDuration: rec.minDuration ?? 0,
				timeout: rec.timeout ?? 0,
				style: { zIndex: 2100 + i },
				onTimeout: () => rec.onTimeout?.(handleOf(rec)),
				onCancel: () => handleOf(rec)?.cancel(),
				onRetry: () => handleOf(rec)?.retry(),
				onClose: (reason) => finalize(rec, rec.reason ?? reason)
			}));
		}
	});
	hostApp.mount(hostEl);
}
/** 收尾：回调 + resolve + 摘除实例；最后一个实例关闭时卸载宿主应用 */
function finalize(rec, reason) {
	if (rec.done) return;
	rec.done = true;
	const idx = instances.findIndex((r) => r.id === rec.id);
	if (idx >= 0) instances.splice(idx, 1);
	handles.delete(rec.id);
	if (rec.singleton) {
		const key = rec.singletonKey || "default";
		const single = singletons.get(key);
		if (single && single.rec.id === rec.id) singletons.delete(key);
	}
	try {
		rec.onClose?.(reason);
	} finally {
		rec.resolve(reason);
	}
	if (instances.length === 0) setTimeout(() => {
		if (instances.length === 0 && hostApp) {
			hostApp.unmount();
			hostEl?.remove();
			hostApp = null;
			hostEl = null;
		}
	}, 260);
}
/**
* 打开一个加载态。
*
* @param options 见 {@link ReLoaderServiceOptions}
* @returns 句柄：可 setProgress / error / close
*/
function open(options = {}) {
	ensureHost();
	if (options.singleton) {
		const key = options.singletonKey || "default";
		const exist = singletons.get(key);
		if (exist && !exist.rec.done) {
			exist.refCount++;
			if (options.text) exist.rec.text = options.text;
			if (options.variant) exist.rec.variant = options.variant;
			if (options.progress !== void 0 && options.progress !== null) exist.rec.progress = options.progress;
			return exist.handle;
		}
	}
	const id = `re-loader-${++seq}`;
	let resolveClosed = () => {};
	const closed = new Promise((res) => {
		resolveClosed = res;
	});
	const rec = reactive({
		...options,
		id,
		visible: true,
		progress: options.percent ?? options.progress ?? null,
		done: false,
		reason: null,
		resolve: resolveClosed,
		failed: false,
		errorMessage: "",
		retrying: false
	});
	/** 进度估算器（仅在 estimateProgress 时创建） */
	let estimator = null;
	/** 平滑进度的补间定时器（同一时刻只允许一个） */
	let tweenTimer = null;
	/** 停掉进行中的平滑补间 */
	const stopTween = () => {
		if (tweenTimer) {
			clearInterval(tweenTimer);
			tweenTimer = null;
		}
	};
	/** 统一写进度并回调（避免多处重复） */
	const applyProgress = (percent) => {
		rec.progress = percent;
		if (percent !== null) {
			const payload = {
				percent,
				id
			};
			rec.onProgress?.(payload);
		}
	};
	/** 创建/重建进度估算器（reset 需要重启计时） */
	const startEstimator = () => {
		estimator?.stop();
		estimator = createProgressEstimator({
			ceiling: options.estimateCeiling,
			tau: options.estimateTau,
			onTick: (p) => {
				if (rec.done) return;
				applyProgress(Math.round(p));
			}
		});
	};
	/**
	* 取消用的 AbortController。
	*
	* <p>始终创建：即便调用方没传 onCancel，用户点取消时也应该能关掉遮罩；
	* 传了 onCancel 则把 signal 交出去，让底层请求真正中止。</p>
	*/
	const abortController = new AbortController();
	const handle = {
		id,
		get visible() {
			return !rec.done;
		},
		get failed() {
			return rec.failed;
		},
		get percent() {
			return rec.progress;
		},
		setProgress(percent, opts) {
			if (rec.done) return handle;
			stopTween();
			if (percent !== null) estimator?.setReal(percent);
			const smooth = opts?.smooth;
			if (!smooth || percent === null || rec.progress === null) {
				applyProgress(percent);
				return handle;
			}
			const from = rec.progress;
			const to = Math.max(0, Math.min(100, percent));
			const duration = typeof smooth === "number" ? Math.max(0, smooth) : 320;
			if (duration === 0 || from === to) {
				applyProgress(to);
				return handle;
			}
			const startedAt = Date.now();
			tweenTimer = setInterval(() => {
				if (rec.done) {
					stopTween();
					return;
				}
				const k = Math.min(1, (Date.now() - startedAt) / duration);
				const eased = 1 - Math.pow(1 - k, 3);
				applyProgress(Math.round(from + (to - from) * eased));
				if (k >= 1) stopTween();
			}, 32);
			return handle;
		},
		reset(opts) {
			if (rec.done) return handle;
			stopTween();
			const target = opts?.percent === void 0 ? 0 : opts.percent;
			estimator?.stop();
			applyProgress(target);
			if (options.estimateProgress && opts?.restartEstimate === true) startEstimator();
			return handle;
		},
		update(patch) {
			if (rec.done) return handle;
			const p = { ...patch };
			if (p.percent !== void 0) {
				rec.progress = p.percent;
				delete p.percent;
			}
			Object.assign(rec, p);
			return handle;
		},
		error(err) {
			if (rec.done) return handle;
			estimator?.stop();
			if (rec.onError?.(err, handle) === false) return handle;
			if (rec.retryable && rec.onRetry) {
				rec.failed = true;
				rec.errorMessage = (err instanceof Error ? err.message : String(err ?? "")) || rec.errorText || "加载失败";
				return handle;
			}
			rec.reason = "error";
			rec.visible = false;
			return handle;
		},
		cancel() {
			if (rec.done) return;
			try {
				rec.onCancel?.(abortController.signal);
			} catch {}
			if (!abortController.signal.aborted) abortController.abort(new DOMException("用户取消", "AbortError"));
			handle.close("cancel");
		},
		retry() {
			if (rec.done || !rec.failed || !rec.onRetry) return handle;
			if (rec.retrying) return handle;
			rec.retrying = true;
			rec.failed = false;
			rec.errorMessage = "";
			Promise.resolve().then(() => rec.onRetry?.(handle)).then(() => {
				rec.retrying = false;
				handle.close("auto");
			}).catch((e) => {
				rec.retrying = false;
				rec.failed = true;
				rec.errorMessage = (e instanceof Error ? e.message : String(e ?? "")) || rec.errorText || "加载失败";
			});
			return handle;
		},
		close(reason = "manual") {
			if (rec.done) return;
			const key = rec.singletonKey || "default";
			const single = rec.singleton ? singletons.get(key) : void 0;
			if (single && single.refCount > 1) {
				single.refCount--;
				return;
			}
			stopTween();
			estimator?.finish();
			rec.reason = reason;
			rec.visible = false;
		},
		whenClosed: () => closed
	};
	if (options.estimateProgress) startEstimator();
	if (options.singleton) singletons.set(options.singletonKey || "default", {
		handle,
		rec,
		refCount: 1
	});
	handles.set(id, handle);
	instances.push(rec);
	queueMicrotask(() => {
		if (!rec.done) rec.onOpen?.(handle);
	});
	return handle;
}
/** 关闭所有加载态（登出 / 全局重置时兜底） */
function closeAll(reason = "manual") {
	for (const rec of [...instances]) {
		rec.reason = reason;
		rec.visible = false;
	}
}
/**
* 关闭"路由级"加载态（路由切换后调用）。
*
* <p>为什么不直接用 {@link closeAll}：页面内也可能有正当的局部加载态
* （例如详情页自己的数据请求）。切路由时把这些一并关掉，虽然遮罩会消失，
* 但页面的 loading 标志仍为 true，回来时会看到一个"永远转圈"的页面。</p>
*
* <p>因此这里只关闭**显式标记为路由级**的实例（{@code routerScoped: true}），
* 通常由请求层联动在跨页请求上自动打标。普通页面内加载态不受影响。</p>
*
* @param reason 关闭原因
* @returns 实际关闭的数量
*/
function closeRouterScoped(reason = "auto") {
	let n = 0;
	for (const rec of [...instances]) {
		if (!rec.routerScoped) continue;
		rec.reason = reason;
		rec.visible = false;
		n++;
	}
	return n;
}
/** 当前打开的加载态数量 */
function count() {
	return instances.length;
}
/** 对象风格聚合导出，便于 `import { loader } from "@repo/ui/re-loader"` */
var loader = {
	open,
	closeAll,
	count
};
//#endregion
//#region ../../packages/ui/src/components/ReLoader/animations.ts
/**
* 统一加载动画（唯一定义处）
*
* <p>十款 CSS 动画只在这里写一次，三处共用：</p>
* <ul>
*   <li><b>首屏</b>：{@code public/loader.js} 注入同一份 CSS（该文件是 public 静态资源，
*       不能 import 本模块，因此那里是逐字一致的副本，由
*       {@code test/vue/loader-anim/verify.mjs} 校验字节一致）；</li>
*   <li><b>应用内</b>：{@code ReLoader} 组件用 {@link loaderAnimationMarkup} 渲染同样的类名；</li>
*   <li><b>主题配置</b>：设置抽屉里的选择器直接复用同一份 CSS 做缩略预览。</li>
* </ul>
*
* <p>尺寸只读 {@code --sla-s}（像素），内部一律用 em 换算 —— 于是 96px 的首屏与 28px 的行内
* 用的是同一套样式，不需要维护两份；颜色只读 {@code --sla-c}。</p>
*/
/** 十款 CSS 动画的键（同时也是 localStorage 里 {@code sys-loader-style} 的值） */
var LOADER_ANIMATIONS = [
	"dots",
	"rings",
	"dino",
	"ripple",
	"orbit",
	"bars",
	"matrix",
	"conveyor",
	"pillars",
	"cards"
];
/** 「无动画」开关：不是动画，但必须能选，否则停不掉 */
var LOADER_ANIMATION_NONE = "none";
/** 每个动画的展示信息（主题配置、文档、演示共用，避免各处再写一遍文案） */
var LOADER_ANIMATION_META = {
	dots: {
		name: "三个圆点",
		description: "经典三点跳动，最通用、最低调"
	},
	rings: {
		name: "科技圆圈",
		description: "双环反向旋转 + 中心脉冲，偏科技感"
	},
	dino: {
		name: "像素恐龙",
		description: "像素恐龙跨栏：方向键 / 空格起跳、有积分、撞到就结束，等待时能玩一把"
	},
	ripple: {
		name: "水波涟漪",
		description: "三圈同心涟漪向外扩散，安静、节奏均匀"
	},
	orbit: {
		name: "双轨环绕",
		description: "一颗卫星绕环运行，内外双轨反向，偏太空感"
	},
	bars: {
		name: "音量柱",
		description: "四根竖向音柱各自起伏，像在听一段节奏"
	},
	matrix: {
		name: "点阵",
		description: "七乘七点阵被一道扫描带掠过，像信号正在传输"
	},
	conveyor: {
		name: "传送带",
		description: "板条箱沿传送带穿过闸门，适合表达流程在推进"
	},
	pillars: {
		name: "柱阵",
		description: "柱阵逐排起伏，像数据正在铺开"
	},
	cards: {
		name: "卡片翻动",
		description: "三张卡片依次翻面，节奏轻快不抢眼"
	},
	none: {
		name: "无动画",
		description: "只保留纯色底，不显示任何动效"
	}
};
/**
* 历史取值映射。
*
* <p>旧版本存过 {@code default / dinoGame / simple / pulse / blocks / book / minecraft /
* pokemon / cyberpunk / writing} 等键；后端 {@code LoadingPageStyle} 也会写入
* {@code spinner / clock / pixel / cube / dots / pulse / minimal / space / servererror}。
* 这些值不能再让用户看到「选中的动画不见了」，统一折到最接近的现行动画之一。</p>
*/
var LEGACY_ANIMATION_ALIASES = {
	dots: "dots",
	rings: "rings",
	dino: "dino",
	ripple: "ripple",
	orbit: "orbit",
	bars: "bars",
	matrix: "matrix",
	conveyor: "conveyor",
	pillars: "pillars",
	cards: "cards",
	none: "none",
	"hairline-phosphor": "matrix",
	"hairline-slow": "conveyor",
	"hairline-terrain": "pillars",
	"hairline-turntable": "cards",
	default: "dots",
	pulse: "dots",
	blocks: "dots",
	book: "dots",
	writing: "dots",
	pokemon: "dots",
	wave: "dots",
	hourglass: "dots",
	clock: "dots",
	minimal: "dots",
	cube: "dots",
	servererror: "dots",
	dinoGame: "dino",
	pixel: "dino",
	spin: "rings",
	simple: "rings",
	spinner: "rings",
	space: "rings",
	cyberpunk: "rings"
};
/**
* 把任意历史值折成当前合法取值。
*
* @param value 本地存储 / 后端下发的原始值
* @returns 合法键；无法识别时返回 {@code null}（由调用方决定兜底）
*/
function normalizeLoaderAnimation(value) {
	if (typeof value !== "string") return null;
	const key = value.trim();
	if (!key) return null;
	return LEGACY_ANIMATION_ALIASES[key] ?? null;
}
/** localStorage 里存动画的键（与 loader.js 完全一致，含 appCode 后缀） */
var STORAGE_KEY = "sys-loader-style";
/** 读取当前应用的 appCode（与 loader.js 的探测顺序一致） */
function resolveAppCode$1() {
	const win = window;
	const fromWindow = typeof win.__SYS_APP_CODE__ === "string" ? win.__SYS_APP_CODE__.trim() : "";
	if (fromWindow) return fromWindow;
	const meta = document.querySelector("meta[name=\"sys-app-code\"]")?.getAttribute("content");
	if (meta && meta.trim()) return meta.trim();
	return document.documentElement?.getAttribute("data-system-code")?.trim() ?? "";
}
/** 带 appCode 的存储键；没有 appCode 时退回全局键 */
function loaderAnimationStorageKey(appCode = resolveAppCode$1()) {
	return appCode ? `${STORAGE_KEY}:${appCode}` : STORAGE_KEY;
}
/**
* 读取用户选择的动画。
*
* @param fallback 没存过 / 值无法识别时的兜底
*/
function readLoaderAnimation(fallback = "dots", appCode = resolveAppCode$1()) {
	try {
		const scopedKey = normalizeLoaderAnimation(localStorage.getItem(loaderAnimationStorageKey(appCode)));
		if (scopedKey) return scopedKey;
		const globalKey = normalizeLoaderAnimation(localStorage.getItem(STORAGE_KEY));
		if (globalKey) return globalKey;
	} catch {}
	return fallback;
}
/**
* 写入用户选择的动画。
*
* <p>同时写带 appCode 与不带 appCode 两个键：首屏 loader 在应用还没起来时就要读，
* 那时 appCode 可能来自 meta，写两份才能保证刷新后立刻生效。</p>
*/
function writeLoaderAnimation(choice, appCode = resolveAppCode$1()) {
	try {
		localStorage.setItem(loaderAnimationStorageKey(appCode), choice);
		localStorage.setItem(STORAGE_KEY, choice);
	} catch {}
}
/** 注入动画样式的 style 标签 id */
var ANIM_STYLE_ID = "sys-loader-anim-style";
/**
* 全局注入一次动画样式。
*
* <p>首屏由 {@code loader.js} 注入同样内容；应用内由这里补齐 —— 两者 id 不同，
* 互不覆盖，也不会出现「首屏隐藏后动画样式被一起删掉」的问题。</p>
*/
function ensureLoaderAnimationStyle(doc = document) {
	if (doc.getElementById(ANIM_STYLE_ID)) return;
	if (!doc.head && !doc.documentElement) return;
	const style = doc.createElement("style");
	style.id = ANIM_STYLE_ID;
	style.textContent = LOADER_ANIMATION_CSS;
	(doc.head || doc.documentElement).appendChild(style);
}
/**
* 全局当前动画（响应式）。
*
* <p>初值在客户端创建时从 localStorage 读；SSR / 构建期没有 localStorage，
* 落到 {@code dots}，不会因为读不到而报错。</p>
*
* <p>部署侧接管（{@code app.yaml other.loaderConfig.enable: true}）时这里是
* <b>只读</b>的：值由配置决定，用户在主题配置里改不动（选择器会置灰）。</p>
*/
var userAnimation = ref(typeof window === "undefined" ? "dots" : readLoaderAnimation());
/**
* 部署侧加载动画策略（响应式）。
*
* <p>直接读 {@code @repo/config} 的响应式配置，所以 app.yaml / 远程配置更新后
* 这里跟着重算，不需要额外订阅。未接管时 {@code locked === false}，
* 行为与没有这段配置时逐字一致。</p>
*/
function useLoaderDeployPolicy() {
	return computed(() => resolveLoaderDeployPolicy());
}
/**
* 当前生效的动画（唯一的读取口）。
*
* <p>锁定态返回部署配置里的动画（历史键照样折叠），未锁定态返回用户选择 ——
* 于是首屏、ReLoader、主题配置预览三处永远不会各说各话。</p>
*/
var currentAnimation = computed(() => {
	const policy = resolveLoaderDeployPolicy();
	if (policy.locked) return normalizeLoaderAnimation(policy.animation) ?? "dots";
	return userAnimation.value;
});
/** 只读的当前动画（组件 / 配置面板都订阅它，改一处全局立即跟着换） */
function useLoaderAnimation() {
	return currentAnimation;
}
/**
* 部署侧是否锁定了动画（主题配置据此置灰选择器）。
*
* @returns 锁定返回 true；未接管返回 false
*/
function isLoaderAnimationLocked() {
	return resolveLoaderDeployPolicy().locked;
}
/**
* 切换全局动画。
*
* <p>三处联动都在这里收口：内存态（组件立即重渲染）+ localStorage（下次刷新首屏用同一款）。
* 首屏正在显示时也会就地换 —— 首屏只在启动那几秒存在，用户改完设置刷新时才用得上，
* 但保持一致比"改了却看不到"更符合预期。</p>
*
* <p><b>锁定态直接返回</b>：既不写内存态也不写 localStorage —— 界面会置灰，
* 但代码路径（快捷键、脚本调用、历史遗留的按钮）绕不过这一层。</p>
*/
function setLoaderAnimation(choice) {
	if (isLoaderAnimationLocked()) return;
	userAnimation.value = choice;
	writeLoaderAnimation(choice);
	syncBootLoader(choice);
}
/**
* 把选择同步到首屏 loader。
*
* <p>首屏的 DOM 由 {@code public/loader.js} 注入，应用内改不了一份已渲染好的结构 ——
* 这里只处理「首屏还挂着」的瞬间：有容器就按新键重绘，没有就什么都不做。</p>
*
* <p>只重绘动画，<b>不动尺寸与主色</b>：锁定态下本函数根本走不到
* （{@link setLoaderAnimation} 已提前返回），未锁定态的尺寸/主色由
* {@code loader.js} 的默认值决定，改它反而会让首屏和应用内不一致。</p>
*/
function syncBootLoader(choice) {
	if (typeof document === "undefined") return;
	const container = document.getElementById("app-loader");
	if (!container) return;
	if (choice === "none") {
		container.innerHTML = "";
		return;
	}
	container.innerHTML = `<div class="sys-loader-shell" data-loader-key="${choice}">${loaderAnimationMarkup(choice)}</div>`;
	ensureLoaderAnimationStyle();
}
/**
* 生成某个动画的 HTML。
*
* @param animation 动画键
* @param percent   预留：真实进度（0-100）；未知键按默认动画渲染
* @returns 可直接塞进容器的 HTML 字符串（内容完全由本模块生成，不含用户输入）
*/
function loaderAnimationMarkup(animation, percent = null) {
	switch (animation) {
		case "dots": return "<div class=\"sla sla-dots\"><i></i><i></i><i></i></div>";
		case "rings": return "<div class=\"sla sla-rings\"><i></i><i></i><i></i></div>";
		case "dino": return "<div class=\"sla sla-dino\"><div class=\"sla-dino__scene\"><div class=\"sla-dino__ground\"></div><div class=\"sla-dino__runner\"><span class=\"sla-dino__body\"></span><span class=\"sla-dino__head\"></span><span class=\"sla-dino__tail\"></span><span class=\"sla-dino__leg sla-dino__leg--front\"></span><span class=\"sla-dino__leg sla-dino__leg--back\"></span></div><div class=\"sla-dino__cactus\"><span class=\"sla-dino__branch sla-dino__branch--left\"></span><span class=\"sla-dino__branch sla-dino__branch--right\"></span></div></div></div>";
		case "ripple": return "<div class=\"sla sla-ripple\"><i></i><i></i><i></i></div>";
		case "orbit": return "<div class=\"sla sla-orbit\"><i></i><i></i></div>";
		case "bars": return "<div class=\"sla sla-bars\"><i></i><i></i><i></i><i></i></div>";
		case "matrix": return "<div class=\"sla sla-matrix\"><i></i></div>";
		case "conveyor": return "<div class=\"sla sla-conveyor\"><div class=\"sla-conveyor__belt sla-conveyor__belt--top\"></div><div class=\"sla-conveyor__belt sla-conveyor__belt--bottom\"></div><div class=\"sla-conveyor__crate\"></div></div>";
		case "pillars": return "<div class=\"sla sla-pillars\"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>";
		case "cards": return "<div class=\"sla sla-cards\"><i></i><i></i><i></i></div>";
		case "none": return "<div class=\"sla sla-none\" aria-hidden=\"true\"></div>";
		default: return "<div class=\"sla sla-dots\"><i></i><i></i><i></i></div>";
	}
}
/**
* 加载动画用到的 hairline 图形。
*
* <p>用户明确要求「直接用 hairline 图形」：点阵 / 传送带 / 柱阵 / 卡片翻动这四款在应用内
* 由 {at code at lucasmarkes/hairline} 真画（函数来自 {at src packages/ui/src/components/ReEmpty/figures.ts}），
* 不再是「只用 CSS 重画一遍」。</p>
*
* <p><b>卡片翻动为什么不是 turntable：</b>那个图形没有自转动画 —— 它随指针横向划过才转，
* 转完吸附到最近的 90°。加载态里根本没有指针，挂上去就是一张静止的转盘（实测静置与
* 指针不动时内容逐帧完全相同）。改用同一图库里的 {at code riffle}：一叠卡片自己就会
* 起落翻动，符合「卡片翻动」这个名字，也不需要我们给图库写补丁。</p>
*
* <p>代价与约束：首屏 {at code public/loader.js} 是静态脚本，加载不了这个库，
* 这四款在首屏退回纯 CSS 近似图（同色同尺寸）；应用内与预览图则一律走矢量图。</p>
*/
var LOADER_HAIRLINE_FIGURES = {
	matrix: "phosphor",
	conveyor: "slow",
	pillars: "terrain",
	cards: "riffle"
};
/** 该动画对应的 hairline 图形键；不是矢量款返回 {at code null} */
function loaderHairlineFigureOf(animation) {
	return LOADER_HAIRLINE_FIGURES[animation] ?? null;
}
/**
* 十款 CSS 动画的完整样式（首屏与应用内唯一的一份）。
*
* <p>两条硬规则，改样式时别破坏：</p>
* <ul>
*   <li><b>尺寸/主色只能写 {@code var(--sla-s, 兜底)} 形式</b>，不能直接在 {@code .sla} 上
*       声明 {@code --sla-s}。自定义属性"元素自身优先于继承"，一旦在这里声明，
*       外部（ReLoader 的 wrapper、首屏的 {@code #app-loader}）设下的同名变量就被挡住，
*       表现是"传了尺寸却还是 64px"。</li>
*   <li><b>必须与 {@code public/loader.js} 里的副本逐字一致</b>：那边是 public 静态资源，
*       不能 import 本模块。由 {@code test/vue/loader-anim/verify.mjs} 做字节比对。</li>
* </ul>
*/
var LOADER_ANIMATION_CSS = `
/* ===== 统一加载动画（首屏 loader / ReLoader / 主题配置预览共用） ===== */
.sla{position:relative;display:block;flex:0 0 auto;box-sizing:border-box;line-height:0;color:var(--sla-c,#406eeb)}

/* ── 三个圆点 ──
   点的直径只取 --sla-s 的 0.16 倍（旧值 0.34）：首屏默认 96px 时单个点约 15px，
   旧值会到 33px —— 三个连起来像三个大圆球，这是「默认太大了」的直接原因。
   动效是每个点各自「从无到有」：scale(0)/opacity:0 起，依次错峰 0.16s，
   于是看到的是「第一个冒出来 → 第二个 → 第三个 → 收回去」的呼吸，而不是整排一起跳。 */
.sla-dots{width:calc(var(--sla-s,64px)*1.1);height:calc(var(--sla-s,64px)*0.34);display:flex;align-items:center;justify-content:space-between}
.sla-dots i{display:block;width:calc(var(--sla-s,64px)*0.16);height:calc(var(--sla-s,64px)*0.16);border-radius:50%;background:currentColor;transform:scale(0);opacity:0;animation:sla-dot calc(1.5s / var(--sla-rate,1)) cubic-bezier(.4,0,.6,1) infinite both}
.sla-dots i:nth-child(2){animation-delay:calc(.16s / var(--sla-rate,1))}
.sla-dots i:nth-child(3){animation-delay:calc(.32s / var(--sla-rate,1))}
@keyframes sla-dot{0%,6%{transform:scale(0);opacity:0}42%{transform:scale(1);opacity:1}70%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}}

/* ── 科技圆圈 ── */
.sla-rings{width:var(--sla-s,64px);height:var(--sla-s,64px);font-size:calc(var(--sla-s,64px)/4.4)}
.sla-rings::before{content:'';position:absolute;inset:-.45em;border:.1em solid color-mix(in srgb,var(--sla-c,#406eeb) 12%,transparent);border-radius:50%}
.sla-rings i{position:absolute;display:block;border-radius:50%;border:.2em solid transparent}
.sla-rings i:nth-child(1){inset:0;border-top-color:currentColor;border-right-color:color-mix(in srgb,var(--sla-c,#406eeb) 40%,transparent);animation:sla-spin calc(1.6s / var(--sla-rate,1)) linear infinite}
.sla-rings i:nth-child(2){inset:.85em;border-bottom-color:currentColor;border-left-color:color-mix(in srgb,var(--sla-c,#406eeb) 40%,transparent);animation:sla-spin calc(1.15s / var(--sla-rate,1)) linear infinite reverse}
.sla-rings i:nth-child(3){inset:0;width:.62em;height:.62em;margin:auto;background:currentColor;border:0;animation:sla-core calc(1.7s / var(--sla-rate,1)) ease-in-out infinite}
@keyframes sla-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes sla-core{0%,100%{transform:scale(.72);opacity:.6}50%{transform:scale(1.12);opacity:1}}

/* ── 像素恐龙 ──
   坐标全部用 em：--sla-s 表示**高度**（与圆圈同口径），
   横向按原始 220×88 的比例放大到 2.5 倍高度。
   为什么不写 calc(220px * calc(var(--sla-s)/220)) —— 单位相乘在 CSS 里非法，
   整条声明会被丢弃，表现是"永远 220px、永不缩放"（实测踩过）。
   用 em 一次解决：1em = 高度/8.8，所有原坐标除以 10 就是 em 值。 */
.sla-dino{width:calc(var(--sla-s,96px)*2.5);height:var(--sla-s,96px);font-size:calc(var(--sla-s,96px)/8.8);overflow:hidden}
.sla-dino__scene{position:relative;width:100%;height:100%;overflow:hidden}
.sla-dino__ground{position:absolute;right:0;bottom:1.4em;left:0;height:.3em;background:repeating-linear-gradient(90deg,#52525b 0 1.4em,rgba(82,82,91,.15) 1.4em 2em);background-size:2em 100%;animation:sla-dino-ground calc(1.65s / var(--sla-rate,1)) linear infinite}
.sla-dino__runner{position:absolute;bottom:1.7em;left:2.6em;width:4.8em;height:4em;z-index:1;animation:sla-dino-jump calc(1.15s / var(--sla-rate,1)) ease-in-out infinite}
.sla-dino__body,.sla-dino__head,.sla-dino__tail,.sla-dino__leg,.sla-dino__cactus,.sla-dino__branch{position:absolute;display:block;background:#111827}
.sla-dino__body{bottom:1em;left:.8em;width:2.4em;height:1.6em}
.sla-dino__head{top:0;right:0;width:1.6em;height:1.4em;box-shadow:-.6em .3em 0 0 #111827,.8em .3em 0 -.5em #f8fafc}
.sla-dino__tail{bottom:1.8em;left:0;width:1em;height:.6em}
.sla-dino__leg{bottom:0;width:.6em;height:1.4em;animation:sla-dino-run calc(.38s / var(--sla-rate,1)) steps(1) infinite}
.sla-dino__leg--front{left:1.4em}
.sla-dino__leg--back{left:2.6em;animation-delay:calc(.19s / var(--sla-rate,1))}
/* 仙人掌从左前方远处进入：起点在容器右侧之外，落到 ground 之上，
   z-index 低于 runner，于是"从恐龙身后穿过"而不是糊在它身上 */
.sla-dino__cactus{right:-3em;bottom:1.7em;width:1.4em;height:3em;background:#14532d;z-index:0;animation:sla-dino-cactus calc(1.65s / var(--sla-rate,1)) linear infinite}
.sla-dino__branch{width:.6em;height:1.2em;background:#14532d}
.sla-dino__branch--left{top:.8em;left:-.5em}
.sla-dino__branch--right{top:.3em;right:-.5em}
@keyframes sla-dino-jump{0%,22%,100%{transform:translateY(0)}48%{transform:translateY(-2.8em)}}
@keyframes sla-dino-run{0%,100%{height:1.4em}50%{height:.9em}}
/* 仙人掌横穿整个场景（宽度约 10em 的容器 + 起点在右侧外），到左侧外再回环 */
@keyframes sla-dino-cactus{from{transform:translateX(0)}to{transform:translateX(-18em)}}
@keyframes sla-dino-ground{from{background-position:0 0}to{background-position:-2em 0}}

/* ── 水波涟漪 ──
   三圈同心环从中心向外扩散，错峰 1/3 周期。环本身不移动，只做 scale + 透明度，
   所以不会像旋转类动画那样抢注意力 —— 适合"等一个后台任务"这种长等待。 */
.sla-ripple{width:var(--sla-s,64px);height:var(--sla-s,64px)}
.sla-ripple i{position:absolute;inset:0;margin:auto;width:100%;height:100%;border:calc(var(--sla-s,64px)*0.045) solid currentColor;border-radius:50%;opacity:0;transform:scale(.18);animation:sla-ripple calc(2.4s / var(--sla-rate,1)) cubic-bezier(.2,.6,.3,1) infinite}
.sla-ripple i:nth-child(2){animation-delay:calc(.8s / var(--sla-rate,1))}
.sla-ripple i:nth-child(3){animation-delay:calc(1.6s / var(--sla-rate,1))}
@keyframes sla-ripple{0%{transform:scale(.18);opacity:0}12%{opacity:.9}70%{opacity:.24}100%{transform:scale(1);opacity:0}}

/* ── 双轨环绕 ──
   一颗卫星沿外圈顺时针、一颗沿内圈逆时针；轨道本身只画一圈淡色参考线。
   卫星用 ::before 挂在轨道顶端，rotate 整条轨道即等于卫星绕圈。 */
.sla-orbit{width:var(--sla-s,64px);height:var(--sla-s,64px)}
.sla-orbit::before{content:'';position:absolute;inset:0;border:1px solid color-mix(in srgb,var(--sla-c,#406eeb) 18%,transparent);border-radius:50%}
.sla-orbit i{position:absolute;inset:0;display:block;border-radius:50%;animation:sla-orbit calc(2.6s / var(--sla-rate,1)) linear infinite}
.sla-orbit i::before{content:'';position:absolute;top:0;left:50%;width:calc(var(--sla-s,64px)*0.16);height:calc(var(--sla-s,64px)*0.16);margin-left:calc(var(--sla-s,64px)*-0.08);margin-top:calc(var(--sla-s,64px)*-0.08);border-radius:50%;background:currentColor}
.sla-orbit i:nth-child(2){inset:18%;border:1px solid color-mix(in srgb,var(--sla-c,#406eeb) 12%,transparent);animation-direction:reverse;animation-duration:calc(1.8s / var(--sla-rate,1))}
.sla-orbit i:nth-child(2)::before{width:calc(var(--sla-s,64px)*0.11);height:calc(var(--sla-s,64px)*0.11);margin-left:calc(var(--sla-s,64px)*-0.055);margin-top:calc(var(--sla-s,64px)*-0.055);background:color-mix(in srgb,var(--sla-c,#406eeb) 55%,white)}
@keyframes sla-orbit{from{transform:rotate(0)}to{transform:rotate(360deg)}}

/* ── 音量柱 ──
   四根竖柱各自伸缩，错峰 0.14~0.42s；错峰刻意不等距，
   等距会变成整齐的"波浪"，反而不像音量。 */
.sla-bars{width:calc(var(--sla-s,64px)*1.2);height:var(--sla-s,64px);display:flex;align-items:flex-end;justify-content:space-between;padding:0 calc(var(--sla-s,64px)*0.06);box-sizing:border-box}
.sla-bars i{display:block;width:14%;height:100%;border-radius:999px;background:currentColor;transform-origin:50% 100%;transform:scaleY(.25);animation:sla-bars calc(1.1s / var(--sla-rate,1)) ease-in-out infinite alternate}
.sla-bars i:nth-child(2){animation-delay:calc(.28s / var(--sla-rate,1))}
.sla-bars i:nth-child(3){animation-delay:calc(.14s / var(--sla-rate,1))}
.sla-bars i:nth-child(4){animation-delay:calc(.42s / var(--sla-rate,1))}
@keyframes sla-bars{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
/* ── hairline 矢量层 ──
   四款（点阵 / 传送带 / 柱阵 / 卡片翻动）在应用内由 at lucasmarkes/hairline 真画：
   上面那几段 CSS 只作为首屏 / 库未就位时的近似图。.has-hl 时隐藏近似层，只留图形本身；
   颜色与尺寸仍走 --sla-c / --sla-s，与其它动画同一口径。 */
.sla.has-hl{display:flex;align-items:center;justify-content:center;color:var(--sla-c,#406eeb)}
.sla.has-hl > *:not(.sla-hl){display:none!important}
.sla .sla-hl{position:relative;display:flex;align-items:center;justify-content:center;width:var(--sla-s,64px);height:var(--sla-s,64px);line-height:0}

/* ── 点阵 ──
   格子由 repeating-conic-gradient 画出（每格中心一个小方块），一条宽的渐变扫描带
   自上而下掠过；扫描带用 mask 复用同一张格子图，于是只有点上会亮。 */
.sla-matrix{width:var(--sla-s,64px);height:var(--sla-s,64px);overflow:hidden}
.sla-matrix::before{content:'';position:absolute;inset:0;background-image:repeating-conic-gradient(currentColor 0 25%,transparent 0 100%);background-size:calc(100% / 7) calc(100% / 7);opacity:.28}
.sla-matrix i{position:absolute;inset:-20% 0;display:block;background:linear-gradient(to bottom,transparent 0,currentColor 38%,currentColor 62%,transparent 100%);-webkit-mask-image:repeating-conic-gradient(#000 0 25%,transparent 0 100%);mask-image:repeating-conic-gradient(#000 0 25%,transparent 0 100%);-webkit-mask-size:calc(100% / 7) calc(100% / 7);mask-size:calc(100% / 7) calc(100% / 7);animation:sla-matrix calc(1.8s / var(--sla-rate,1)) linear infinite}
at keyframes sla-matrix{from{transform:translateY(-60%)}to{transform:translateY(60%)}}
/* ── 传送带 ──
   两条皮带用斜纹渐变平移，板条箱夹在中间轻微上抬 —— 一眼能看出东西在往前送。 */
.sla-conveyor{width:calc(var(--sla-s,64px)*1.4);height:var(--sla-s,64px);font-size:calc(var(--sla-s,64px)*0.06)}
.sla-conveyor__belt{position:absolute;left:0;right:0;height:.2em;background:repeating-linear-gradient(90deg,currentColor 0 .18em,color-mix(in srgb,var(--sla-c,#406eeb) 22%,transparent) .18em .4em);background-size:.88em 100%;animation:sla-conveyor calc(.9s / var(--sla-rate,1)) linear infinite}
.sla-conveyor__belt--top{top:20%}
.sla-conveyor__belt--bottom{bottom:20%}
.sla-conveyor__crate{position:absolute;top:50%;left:50%;width:calc(var(--sla-s,64px)*0.36);height:calc(var(--sla-s,64px)*0.36);margin:calc(var(--sla-s,64px)*-0.18);border:.16em solid currentColor;background:color-mix(in srgb,var(--sla-c,#406eeb) 16%,transparent);box-sizing:border-box;animation:sla-conveyor-crate calc(1.6s / var(--sla-rate,1)) ease-in-out infinite}
at keyframes sla-conveyor{from{background-position:0 0}to{background-position:.88em 0}}
at keyframes sla-conveyor-crate{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-.3em) rotate(-6deg)}}
/* ── 柱阵 ──
   三排五列的小柱，按列序错峰 0.08s，于是看到的是斜向推进的波而不是整排一起跳。 */
.sla-pillars{width:calc(var(--sla-s,64px)*1.2);height:var(--sla-s,64px);display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(3,1fr);align-items:end;gap:calc(var(--sla-s,64px)*0.07)}
.sla-pillars i{display:block;height:100%;border-radius:calc(var(--sla-s,64px)*0.05);background:currentColor;transform-origin:50% 100%;transform:scaleY(.3);animation:sla-pillars calc(1.4s / var(--sla-rate,1)) ease-in-out infinite}
.sla-pillars i:nth-child(5n+2){animation-delay:calc(.08s / var(--sla-rate,1))}
.sla-pillars i:nth-child(5n+3){animation-delay:calc(.16s / var(--sla-rate,1))}
.sla-pillars i:nth-child(5n+4){animation-delay:calc(.24s / var(--sla-rate,1))}
.sla-pillars i:nth-child(5n+5){animation-delay:calc(.32s / var(--sla-rate,1))}
at keyframes sla-pillars{0%,100%{transform:scaleY(.3);opacity:.45}50%{transform:scaleY(1);opacity:1}}
/* ── 卡片翻动 ──
   三张卡并排绕 Y 轴依次翻面；翻到侧面时透明度降下来，像纸片薄下去。 */
.sla-cards{width:calc(var(--sla-s,64px)*1.5);height:var(--sla-s,64px);display:flex;align-items:center;justify-content:space-between;perspective:calc(var(--sla-s,64px)*3)}
.sla-cards i{display:block;width:calc(var(--sla-s,64px)*0.38);height:calc(var(--sla-s,64px)*0.62);border-radius:calc(var(--sla-s,64px)*0.05);border:calc(var(--sla-s,64px)*0.045) solid currentColor;background:color-mix(in srgb,var(--sla-c,#406eeb) 12%,transparent);box-sizing:border-box;animation:sla-cards calc(1.5s / var(--sla-rate,1)) ease-in-out infinite}
.sla-cards i:nth-child(2){animation-delay:calc(.15s / var(--sla-rate,1))}
.sla-cards i:nth-child(3){animation-delay:calc(.3s / var(--sla-rate,1))}
at keyframes sla-cards{0%,100%{transform:rotateY(0);opacity:1}45%{transform:rotateY(180deg)}55%{opacity:.55}100%{opacity:1}}

/* ── 无动画 ── */
.sla-none{width:1px;height:1px;opacity:0}

/* 减少动态效果：整体放慢但不停 —— 加载指示器停住会让人以为卡死 */
@media (prefers-reduced-motion:reduce){
.sla-dots i{animation-duration:calc(2.4s / var(--sla-rate,1))}
.sla-rings i:nth-child(1){animation-duration:calc(2.8s / var(--sla-rate,1))}
.sla-rings i:nth-child(2){animation-duration:calc(2s / var(--sla-rate,1))}
.sla-dino__runner{animation-duration:calc(1.9s / var(--sla-rate,1))}
.sla-dino__cactus{animation-duration:calc(2.6s / var(--sla-rate,1))}
.sla-dino__ground{animation-duration:calc(2.6s / var(--sla-rate,1))}
.sla-ripple i{animation-duration:calc(3.8s / var(--sla-rate,1))}
.sla-orbit i{animation-duration:calc(4.2s / var(--sla-rate,1))}
.sla-bars i{animation-duration:calc(1.8s / var(--sla-rate,1))}
.sla-matrix i{animation-duration:calc(3.2s / var(--sla-rate,1))}
.sla-conveyor__belt{animation-duration:calc(1.8s / var(--sla-rate,1))}
.sla-conveyor__crate{animation-duration:calc(2.4s / var(--sla-rate,1))}
.sla-pillars i{animation-duration:calc(2.4s / var(--sla-rate,1))}
.sla-cards i{animation-duration:calc(2.6s / var(--sla-rate,1))}
}
`.trim();
//#endregion
//#region ../../packages/ui/src/components/ReLoader/prefs.ts
/**
* 加载动画的「观感偏好」：尺寸两档、速度倍率、是否跟随主题主色。
*
* <p>为什么单开一个文件而不是塞进 animations.ts：animations.ts 是动画结构与样式的
* 唯一定义处，必须与 {@code public/loader.js} 逐字对应；这里只是「数值偏好」的读写与
* 合并规则，和动画长什么样无关。混在一起会让那个文件的字节比对越来越脆弱。</p>
*
* <p>优先级（三处一致：首屏 loader / ReLoader / 主题配置预览）：</p>
* <ol>
*   <li><b>部署侧</b>{@code app.yaml other.loaderConfig}（{@code enable: true} 时整片锁定）；</li>
*   <li><b>用户偏好</b> localStorage {@code sys-loader-prefs}（主题配置里可调）；</li>
*   <li><b>内置默认</b> 96 / 1 倍 / 不跟随主色。</li>
* </ol>
*
* <p>首屏 {@code public/loader.js} 不能 import 本模块，那边读同一个 localStorage 键，
* 键名与默认值由 {@code test/vue/loader-anim/verify.mjs} 逐字比对。</p>
*/
/** 用户偏好键（与 public/loader.js 的 LOADER_PREFS_KEY 一致） */
var LOADER_PREFS_KEY = "sys-loader-prefs";
/** 窄屏断点（与 loader.js 的 media query 一致） */
var LOADER_WIDTH_BREAKPOINT = 768;
/** 尺寸上下限（px） */
var LOADER_SIZE_MIN = 8;
var LOADER_SIZE_MAX = 512;
/** 速度倍率上下限（1 = 原速） */
var LOADER_SPEED_MIN = .5;
var LOADER_SPEED_MAX = 3;
/** 内置默认尺寸：与接入两档尺寸之前逐字一致（首屏 96px） */
var LOADER_SIZE_NARROW_DEFAULT = 96;
var LOADER_SIZE_WIDE_DEFAULT = 96;
/** 内置默认速度与主色跟随 */
var LOADER_SPEED_DEFAULT = 1;
var LOADER_ADAPT_COLOR_DEFAULT = false;
/** 内置主色：与动画 CSS 里 --sla-c 的兜底、部署配置默认值一致 */
var LOADER_COLOR_DEFAULT = "#406eeb";
/** 跟随主题主色时的 CSS 取值：Element Plus 没加载时退回默认蓝 */
var LOADER_ADAPT_COLOR_VALUE = `var(--el-color-primary,${LOADER_COLOR_DEFAULT})`;
/** 缺省偏好 */
var LOADER_PREFS_DEFAULT = {
	size: {
		narrow: 96,
		wide: 96
	},
	speed: 1,
	adaptColor: false
};
/** 把任意值收窄成合法尺寸（px）；非法值用兜底 */
function normalizeLoaderSize(value, fallback = 96) {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) return fallback;
	return Math.min(512, Math.max(8, Math.round(num)));
}
/** 把任意值收窄成合法速度倍率（0.5~3，保留两位小数） */
function normalizeLoaderSpeed(value, fallback = 1) {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num) || num <= 0) return fallback;
	return Math.min(3, Math.max(LOADER_SPEED_MIN, Math.round(num * 100) / 100));
}
/** 兼容旧的单数字尺寸（size: 96 → 两档都是 96） */
function readSizeObject(raw) {
	if (typeof raw === "number" || typeof raw === "string") {
		const size = normalizeLoaderSize(raw);
		return {
			narrow: size,
			wide: size
		};
	}
	if (raw && typeof raw === "object") {
		const obj = raw;
		const narrow = normalizeLoaderSize(obj.narrow, 96);
		return {
			narrow,
			wide: normalizeLoaderSize(obj.wide, narrow)
		};
	}
	return { ...LOADER_PREFS_DEFAULT.size };
}
/** 把任意值（localStorage 里的 JSON / 配置对象）归一化成完整偏好 */
function normalizeLoaderPrefs(raw) {
	if (!raw || typeof raw !== "object") return {
		...LOADER_PREFS_DEFAULT,
		size: { ...LOADER_PREFS_DEFAULT.size }
	};
	const obj = raw;
	return {
		size: readSizeObject(obj.size),
		speed: normalizeLoaderSpeed(obj.speed),
		adaptColor: obj.adaptColor === true
	};
}
/** 当前应用的 appCode（与 animations.ts / loader.js 的探测顺序一致） */
function resolveAppCode() {
	if (typeof window === "undefined") return "";
	const win = window;
	const fromWindow = typeof win.__SYS_APP_CODE__ === "string" ? win.__SYS_APP_CODE__.trim() : "";
	if (fromWindow) return fromWindow;
	const meta = document.querySelector("meta[name=\"sys-app-code\"]")?.getAttribute("content");
	if (meta && meta.trim()) return meta.trim();
	return document.documentElement?.getAttribute("data-system-code")?.trim() ?? "";
}
/** 读取用户偏好（带 appCode 的键优先，全局键兜底；都没有就用默认） */
function readLoaderPrefs(appCode = resolveAppCode()) {
	try {
		const raw = (appCode ? localStorage.getItem(`sys-loader-prefs:${appCode}`) : null) ?? localStorage.getItem("sys-loader-prefs");
		if (!raw) return normalizeLoaderPrefs(null);
		return normalizeLoaderPrefs(JSON.parse(raw));
	} catch {
		return normalizeLoaderPrefs(null);
	}
}
/** 写入用户偏好（两份都写：首屏在应用起来之前可能拿不到 appCode） */
function writeLoaderPrefs(prefs, appCode = resolveAppCode()) {
	try {
		const payload = JSON.stringify(normalizeLoaderPrefs(prefs));
		localStorage.setItem(LOADER_PREFS_KEY, payload);
		if (appCode) localStorage.setItem(`${LOADER_PREFS_KEY}:${appCode}`, payload);
	} catch {}
}
/** 响应式用户偏好（SSR / 构建期没有 localStorage） */
var currentPrefs = ref(typeof window === "undefined" ? normalizeLoaderPrefs(null) : readLoaderPrefs());
/** 只读的用户偏好（面板订阅它） */
function useLoaderPrefs() {
	return currentPrefs;
}
/** 合并部署策略与用户偏好，得到最终观感（纯函数，便于单测） */
function resolveLoaderVisuals(policy, prefs) {
	const size = policy.locked ? readSizeObject(policy.size) : prefs.size;
	const speed = policy.locked ? normalizeLoaderSpeed(policy.speed) : normalizeLoaderSpeed(prefs.speed);
	const adaptColor = policy.locked ? policy.adaptColor === true : prefs.adaptColor === true;
	const color = adaptColor ? LOADER_ADAPT_COLOR_VALUE : policy.locked && policy.color ? policy.color : LOADER_COLOR_DEFAULT;
	return {
		locked: policy.locked === true,
		size,
		speed,
		adaptColor,
		color
	};
}
/** 当前生效的观感（部署 > 用户 > 默认）；配置更新后自动重算 */
function useLoaderVisuals() {
	return computed(() => {
		const policy = resolveLoaderDeployPolicy();
		return resolveLoaderVisuals({
			locked: policy.locked,
			size: policy.size,
			speed: policy.speed,
			adaptColor: policy.adaptColor,
			color: policy.color
		}, currentPrefs.value);
	});
}
/**
* 修改用户偏好。
*
* <p>锁定态直接返回：部署侧接管时界面会置灰，但快捷键 / 脚本路径绕不过这一层
* （与 {@code setLoaderAnimation} 同一口径）。</p>
*/
function setLoaderPrefs(patch) {
	if (resolveLoaderDeployPolicy().locked) return;
	const merged = {
		size: patch.size ? readSizeObject(patch.size) : currentPrefs.value.size,
		speed: patch.speed === void 0 ? currentPrefs.value.speed : normalizeLoaderSpeed(patch.speed),
		adaptColor: patch.adaptColor === void 0 ? currentPrefs.value.adaptColor : patch.adaptColor === true
	};
	currentPrefs.value = merged;
	writeLoaderPrefs(merged);
}
//#endregion
//#region ../../packages/ui/src/components/ReLoader/request.ts
/**
* ReLoader 请求层联动。
*
* <p>目标：业务代码写 {@code api.get('/x', { loader: true })} 就自动出现加载态，
* 不必在每个页面手写 {@code loading.value = true/false}（那是最容易漏掉
* finally 的地方，漏了就一直转圈）。</p>
*
* <p>三个关键设计：</p>
* <ul>
*   <li><b>单例合并</b>：并发多个请求只显示一个遮罩，靠引用计数在最后一个结束时关闭。
*       否则 3 个请求会让遮罩闪 3 次，观感很差。</li>
*   <li><b>延迟显示</b>：默认 200ms。绝大多数请求 100ms 内返回，不闪才是对的。</li>
*   <li><b>失败也要关</b>：用 finally 保证异常路径同样收尾，并交给 {@code onError}
*       决定是否提示（遮罩本身不弹错误，避免与业务提示重复）。</li>
* </ul>
*/
/** 默认配置：可通过 {@link configureLoaderRequests} 覆盖 */
var defaults = {
	enabled: true,
	variant: void 0,
	size: "lg",
	text: "加载中…",
	delay: 200,
	minDuration: 300,
	singleton: true,
	singletonKey: "http",
	mask: true,
	fullscreen: true,
	routerScoped: true
};
/**
* 覆盖默认配置（通常在应用启动时调用一次）。
*
* @param patch 要覆盖的字段
*/
function configureLoaderRequests(patch) {
	defaults = {
		...defaults,
		...patch
	};
}
/** 读取当前默认配置（只读用途，如调试面板展示） */
function loaderRequestDefaults() {
	return defaults;
}
/**
* 包一个异步请求：自动开/关加载态。
*
* <p>用法（在 axios/Http 拦截器里最自然）：</p>
* ```ts
* const data = await withLoader(() => http.get('/api/x'), { text: '查询中' })
* ```
*
* @param task     返回 Promise 的任务
* @param options  加载态配置（与 open 一致）
* @returns 任务结果（原样透传）
*/
async function withLoader(task, options = {}) {
	const merged = {
		...defaults,
		...options
	};
	if (!merged.enabled) return task();
	/**
	* 实际执行的任务。
	*
	* <p>可重试时，遮罩上的「重试」按钮会重新调用它 —— 所以这里要把 task 本身
	* 交给 handle，而不是只跑一次。</p>
	*/
	const run = () => task();
	let handle = null;
	try {
		handle = open({
			...merged,
			onRetry: merged.onRetry ?? (merged.retryable ? () => run() : void 0)
		});
		return await run();
	} catch (e) {
		if (handle) if (merged.retryable) handle.error(e);
		else handle.close("error");
		throw e;
	} finally {
		if (handle && handle.visible) {
			if (!handle.failed) handle.close("auto");
		}
	}
}
/**
* 给一个「请求函数」套上加载态，返回同签名的包装函数。
*
* <p>适合在 service 层一次性包装：</p>
* ```ts
* export const fetchModels = withLoaderFn((id: string) => http.get(`/models/${id}`), { text: '加载模型' })
* ```
*
* @param fn      原请求函数
* @param options 加载态配置
* @returns 包装后的函数（参数与返回值类型保持不变）
*/
function withLoaderFn(fn, options = {}) {
	return (...args) => withLoader(() => fn(...args), options);
}
//#endregion
//#region ../../packages/ui/src/components/ReLoader/router.ts
/**
* ReLoader 路由联动。
*
* <p>要防的事故：用户在"加载中"点了侧栏跳到别的页面，而发起加载的那个组件
* 已被卸载 —— 它的 {@code finally} 里 {@code close()} 仍会执行（Promise 还在），
* 但如果是**请求层自动挂载的单例遮罩**，且那个请求永远不返回（后端挂住/断网
* 无超时），遮罩就会一直盖在新页面上，全站不可用。</p>
*
* <p>这里的策略：路由切换后关闭**标记为路由级**的遮罩。普通页面内加载态不动，
* 避免"切回来发现页面永远转圈"。</p>
*/
/**
* 把 ReLoader 挂到路由上。
*
* <p>在 router 创建之后调用一次即可：</p>
* ```ts
* import { attachRouterLoader } from '@repo/ui/re-loader'
* attachRouterLoader(router)
* ```
*
* @param router  路由实例
* @param options 配置
* @returns 解绑函数（HMR / 测试时用）
*/
function attachRouterLoader(router, options = {}) {
	const onlyPathChange = options.onlyOnPathChange !== false;
	let lastPath = "";
	const shouldClose = (to, from) => {
		if (!onlyPathChange) return true;
		const tp = pathOf(to);
		const fp = pathOf(from);
		if (!fp) return false;
		if (!tp) return true;
		return tp !== fp;
	};
	const onAfterEach = (...args) => {
		const to = args[0];
		const from = args[1];
		if (!shouldClose(to, from)) return;
		const n = closeRouterScoped("auto");
		if (n > 0) console.debug(`[ReLoader] 路由切换，已关闭 ${n} 个路由级加载态`);
		lastPath = pathOf(to) || lastPath;
	};
	const onBeforeEach = (...args) => {
		const to = args[0];
		const from = args[1];
		if (!shouldClose(to, from)) return;
		closeRouterScoped("auto");
	};
	router.afterEach(onAfterEach);
	if (options.closeOnBeforeEach && router.beforeEach) router.beforeEach(onBeforeEach);
	return () => {
		lastPath = "";
	};
}
/** 从路由对象里取 path（容错：可能是 string / RouteLocation） */
function pathOf(route) {
	if (typeof route === "string") return route;
	if (route && typeof route === "object") {
		const p = route.path;
		if (typeof p === "string") return p;
	}
	return "";
}
//#endregion
//#region ../../packages/ui/src/components/ReLoader/skeleton.ts
/**
* 按结构描述生成骨架块序列。
*
* @param shape 结构描述
* @returns 块序列（按渲染顺序）
*/
function buildSkeleton(shape = {}) {
	const layout = shape.layout ?? "list";
	const rowHeight = shape.rowHeight ?? 18;
	shape.gap;
	const out = [];
	const text = (kind, width) => ({
		type: "text",
		kind,
		width: width ?? "100%",
		height: `${rowHeight}px`
	});
	switch (layout) {
		case "table": {
			const columns = Math.max(1, shape.columns ?? 3);
			for (let c = 0; c < columns; c++) out.push({
				type: "cell",
				kind: "head",
				width: `${Math.round(100 / columns)}%`,
				height: `${rowHeight}px`
			});
			const rows = Math.max(1, shape.rows ?? 3);
			for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
				const w = c === columns - 1 && columns > 2 ? "60%" : `${Math.round(100 / columns)}%`;
				out.push({
					type: "cell",
					kind: "cell",
					width: w,
					height: `${rowHeight}px`
				});
			}
			return out;
		}
		case "card": {
			const count = Math.max(1, shape.rows ?? 2);
			for (let i = 0; i < count; i++) {
				if (shape.avatar !== false) out.push({
					type: "avatar",
					kind: "avatar",
					width: "40px",
					height: "40px"
				});
				if (shape.title !== false) out.push(text("title", "45%"));
				out.push(text("text", i === count - 1 ? "72%" : "100%"));
			}
			return out;
		}
		case "form": {
			const rows = Math.max(1, shape.rows ?? 3);
			for (let i = 0; i < rows; i++) {
				out.push({
					type: "text",
					kind: "label",
					width: "96px",
					height: "16px"
				});
				out.push({
					type: "cell",
					kind: "field",
					width: "100%",
					height: `${rowHeight + 8}px`
				});
			}
			return out;
		}
		case "article": {
			if (shape.title !== false) out.push(text("title", "62%"));
			const rows = Math.max(2, shape.rows ?? 5);
			for (let i = 0; i < rows; i++) out.push(text("text", i === rows - 1 ? "48%" : "100%"));
			return out;
		}
		default: {
			const rows = Math.max(1, shape.rows ?? 4);
			for (let i = 0; i < rows; i++) {
				if (shape.avatar) out.push({
					type: "avatar",
					kind: "avatar",
					width: "36px",
					height: "36px"
				});
				out.push(text("text", i === rows - 1 ? "55%" : "100%"));
			}
			return out;
		}
	}
}
/**
* 生成骨架容器的 CSS 变量（间距统一在这里定）。
*
* @param shape 结构描述
* @returns CSS 变量集合
*/
function skeletonVars(shape = {}) {
	return { "--rl-sk-gap": `${shape.gap ?? 12}px` };
}
//#endregion
//#region ../../packages/ui/src/components/ReLoader/index.ts
var plugin = { install(app) {
	app.component("ReLoader", ReLoader);
} };
var ReLoader_default = ReLoader;
//#endregion
export { LOADER_ADAPT_COLOR_DEFAULT, LOADER_ANIMATIONS, LOADER_ANIMATION_CSS, LOADER_ANIMATION_META, LOADER_ANIMATION_NONE, LOADER_HAIRLINE_FIGURES, LOADER_PREFS_DEFAULT, LOADER_PREFS_KEY, LOADER_SIZE_MAX, LOADER_SIZE_MIN, LOADER_SIZE_NARROW_DEFAULT, LOADER_SIZE_WIDE_DEFAULT, LOADER_SPEED_DEFAULT, LOADER_SPEED_MAX, LOADER_SPEED_MIN, LOADER_WIDTH_BREAKPOINT, PAUSED_CLASS, ReLoaderDinoGame, ReLoaderHairline, attachRouterLoader, bindVisibilityPause, buildSkeleton, closeAll, closeRouterScoped, configureLoaderRequests, count, createProgressEstimator, ReLoader_default as default, ensureLoaderAnimationStyle, plugin as install, isLoaderAnimationLocked, loader, loaderAnimationMarkup, loaderAnimationStorageKey, loaderHairlineFigureOf, loaderRequestDefaults, normalizeLoaderAnimation, normalizeLoaderPrefs, normalizeLoaderSize, normalizeLoaderSpeed, open, pageVisible, readLoaderAnimation, readLoaderPrefs, resolveLoaderVisuals, setLoaderAnimation, setLoaderPrefs, skeletonVars, useLoaderAnimation, useLoaderDeployPolicy, useLoaderPrefs, useLoaderVisuals, withLoader, withLoaderFn, writeLoaderAnimation, writeLoaderPrefs };
