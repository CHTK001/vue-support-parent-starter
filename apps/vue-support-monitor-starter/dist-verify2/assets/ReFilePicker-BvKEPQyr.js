import { $ as mergeModels, $n as normalizeClass, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, Lt as useSlots, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tr as normalizeProps, tt as nextTick, u as Teleport, un as isRef, v as createBlock, vn as ref, w as createSlots, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode, z as guardReactiveProps } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { Bt as search_default, G as edit_pen_default, I as delete_default, Nt as refresh_default, Q as folder_opened_default, U as download_default, V as document_default, X as folder_add_default, Z as folder_default, Zt as tickets_default, at as info_filled_default, dn as view_default, dt as loading_default, en as top_right_default, et as grid_default, ht as menu_default, i as arrow_left_default, pn as warning_filled_default, q as files_default, rn as upload_default, tt as headset_default, un as video_play_default, ut as list_default, wt as picture_default } from "./dist-DogtK295.js";
import { t as ElMessage } from "./message-BQI5cdKE.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
//#region ../../packages/ui/src/components/ReFilePicker/utils.ts
/** 归一化路径：去掉结尾分隔符；空串保持空串、`/`\\` 归一到 `/` */
var normalizePath = (value) => {
	const text = String(value || "");
	if (!text || text === "/" || text === "\\") return text === "" ? "" : "/";
	return text.replace(/[\\/]+$/, "") || "/";
};
/** 两条路径是否指向同一位置（空串与 `/` 等价） */
var samePath = (a, b) => {
	const na = normalizePath(a);
	const nb = normalizePath(b);
	return na === nb || na === "" && nb === "/" || na === "/" && nb === "";
};
/** 是否根路径：空串、`/`、或 Windows 盘符 `C:` */
var isRootPath = (path) => {
	const p = normalizePath(path);
	return p === "" || p === "/" || /^[A-Za-z]:$/.test(p);
};
/** 路径使用的分隔符（按原串是否含 `\` 判定） */
var separatorOf = (path) => path.includes("\\") ? "\\" : "/";
/**
* 盘符根补上分隔符：`C:` → `C:\`。
*
* <p>Windows 后端用 {@code Paths.get(x).isAbsolute()} 判绝对路径，而 `C:` 在 Windows 上
* <b>不是</b>绝对路径（驱动器相对）—— 发出去会被判「必须使用绝对路径」。所以盘符根
* 一律带分隔符，导航时报错的那条路径才会消失。</p>
*/
var driveRootPath = (drive) => `${String(drive).replace(/[\\/]+$/, "")}\\`;
/** 拼接子路径，保留盘符/根语义 */
var joinPath = (base, name) => {
	const root = normalizePath(base);
	const sep = base.includes("\\") || /^[A-Za-z]:$/.test(root) ? "\\" : "/";
	if (!root || root === "/" || /^[A-Za-z]:$/.test(root)) return root === "/" ? `/${name}` : name ? `${root}${sep}${name}` : `/${name}`;
	return `${root}${sep}${name}`;
};
/** 父目录路径；根/盘符的父仍是 `/`（盘符的父就是组件的虚拟根，即盘符列表） */
var parentPathOf = (path) => {
	const current = normalizePath(path);
	if (!current || current === "/" || /^[A-Za-z]:$/.test(current)) return "/";
	const idx = Math.max(current.lastIndexOf("/"), current.lastIndexOf("\\"));
	if (idx <= 0) return "/";
	const parent = current.slice(0, idx);
	if (!parent) return "/";
	return /^[A-Za-z]:$/.test(parent) ? driveRootPath(parent) : parent;
};
/** 拆成非空片段 */
var pathSegments = (path) => normalizePath(path).split(/[\\/]+/).filter(Boolean);
/**
* 面包屑：根目录 + 逐级片段。
*
* <p>Windows 盘符也挂在「根目录」之下：`C:\` → 根目录 › C:。组件把「文件系统根」
* 表达成虚拟根 `/`（Windows 后端下就是盘符列表），盘符若取代根节点，进了盘符
* 就再也点不回盘符列表了。</p>
*/
var breadcrumbOf = (path) => {
	const p = normalizePath(path);
	if (!p || p === "/") return [{
		name: "根目录",
		path: "/"
	}];
	const segs = pathSegments(p);
	const firstDrive = /^[A-Za-z]:$/.test(segs[0] || "");
	const crumbs = [{
		name: "根目录",
		path: "/"
	}];
	let current = "";
	if (firstDrive) {
		current = driveRootPath(segs[0]);
		crumbs.push({
			name: segs[0],
			path: current
		});
	}
	for (const seg of segs.slice(firstDrive ? 1 : 0)) {
		current = joinPath(current, seg);
		crumbs.push({
			name: seg,
			path: current
		});
	}
	return crumbs;
};
var IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif|bmp)$/i;
var VIDEO_EXT = /\.(mp4|webm|ogg|mov|avi|mkv)$/i;
var AUDIO_EXT = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
var PDF_EXT = /\.pdf$/i;
var ARCHIVE_EXT = /\.(zip|rar|7z|tar|gz|bz2|xz|jar|war)$/i;
/** accept 里代表「目录」的 token（与文件类型并列，如 `accept="dir,.zip"`） */
var DIR_ACCEPT_TOKENS = /* @__PURE__ */ new Set([
	"dir",
	"folder",
	"directory"
]);
/** 扩展名（小写，无点）；无扩展名返回空串 */
var extensionOf = (name) => {
	const idx = name.lastIndexOf(".");
	return idx > 0 ? name.slice(idx + 1).toLowerCase() : "";
};
/**
* 归一到单一类型，供图标/类型列/排序共用。
*
* <p>优先级与历史模板一致：目录 → 图片 → 视频 → 音频 → PDF → 普通文件；
* mimeType 优先于扩展名，两者都缺时回落「文件」。</p>
*/
var fileKindOf = (item) => {
	if (item.isDir) return "dir";
	const mime = item.mimeType ?? "";
	if (mime.startsWith("image/") || IMAGE_EXT.test(item.name)) return "image";
	if (mime.startsWith("video/") || VIDEO_EXT.test(item.name)) return "video";
	if (mime.startsWith("audio/") || AUDIO_EXT.test(item.name)) return "audio";
	if (mime === "application/pdf" || PDF_EXT.test(item.name)) return "pdf";
	return "file";
};
var isImage = (item) => fileKindOf(item) === "image";
var isVideo = (item) => fileKindOf(item) === "video";
var isAudio = (item) => fileKindOf(item) === "audio";
var isPdf = (item) => fileKindOf(item) === "pdf";
/** 类型列的展示文案 */
var fileTypeText = (name) => {
	const ext = extensionOf(name);
	return {
		csv: "CSV",
		xls: "Excel",
		xlsx: "Excel",
		doc: "Word",
		docx: "Word",
		pdf: "PDF",
		json: "JSON",
		xml: "XML",
		txt: "文本",
		md: "Markdown",
		jpg: "图片",
		jpeg: "图片",
		png: "图片",
		gif: "图片",
		webp: "图片",
		svg: "图片",
		avif: "图片",
		bmp: "图片",
		mp4: "视频",
		webm: "视频",
		mov: "视频",
		avi: "视频",
		mp3: "音频",
		wav: "音频",
		flac: "音频",
		m4a: "音频",
		zip: "压缩包",
		rar: "压缩包",
		tar: "压缩包",
		gz: "压缩包",
		jar: "JAR",
		war: "WAR"
	}[ext] || (ext ? `${ext.toUpperCase()} 文件` : "文件");
};
/** 单个 accept token 是否放行某个条目（目录恒放行） */
var matchesAccept = (item, token) => {
	if (token === "*/*" || token === "*") return true;
	if (DIR_ACCEPT_TOKENS.has(token)) return item.isDir;
	if (token === "image" || token.startsWith("image/")) return !!item.mimeType?.startsWith("image/") || IMAGE_EXT.test(item.name);
	if (token === "video" || token.startsWith("video/")) return !!item.mimeType?.startsWith("video/") || VIDEO_EXT.test(item.name);
	if (token === "audio" || token.startsWith("audio/")) return !!item.mimeType?.startsWith("audio/") || AUDIO_EXT.test(item.name);
	if (token === "pdf") return !!item.mimeType?.startsWith("application/pdf") || PDF_EXT.test(item.name);
	if (token === "archive") return ARCHIVE_EXT.test(item.name);
	if (token === "text" || token.startsWith("text/")) return !!item.mimeType?.startsWith("text/") || /\.(txt|md|json|xml|csv|log|ya?ml)$/i.test(item.name);
	if (token.startsWith(".")) return item.name.toLowerCase().endsWith(token.toLowerCase());
	return true;
};
/** accept 串里的 token 列表（小写去空） */
var acceptTokens = (accept) => String(accept || "").split(",").map((token) => token.trim().toLowerCase()).filter(Boolean);
/**
* accept 是否显式放行「目录」。
*
* <p>列出目录恒允许（不然进不去下一级），但<b>能不能选中目录</b>由它决定：
* `accept="dir"` / `accept="dir,.zip"` 都可选目录；空 accept 或纯文件类型
* 只可选文件（选目录仍走 {@code directoryMode}）。</p>
*/
var acceptHasDir = (accept) => acceptTokens(accept).some((token) => DIR_ACCEPT_TOKENS.has(token));
/** 把 accept 转成原生 input[accept]（去掉 dir/类别等非原生 token） */
var toNativeAccept = (accept) => acceptTokens(accept).filter((token) => token.startsWith(".") || token.includes("/")).join(",");
/** 把 accept 串编译成谓词；空 accept 放行全部 */
var buildAcceptFilter = (accept) => {
	const tokens = acceptTokens(accept);
	if (!tokens.length) return () => true;
	return (item) => item.isDir || tokens.some((token) => matchesAccept(item, token));
};
/** 列的声明式配置：表头渲染与宽度类名都由此驱动，避免四段重复模板。
*  列序沿用 Windows 资源管理器详细信息视图：名称 / 修改时间 / 类型 / 大小。 */
var FILE_PICKER_COLUMNS = [
	{
		key: "name",
		label: "名称"
	},
	{
		key: "updatedAt",
		label: "修改时间",
		className: "rfp-details__time"
	},
	{
		key: "type",
		label: "类型"
	},
	{
		key: "size",
		label: "大小",
		className: "rfp-details__size",
		align: "right"
	}
];
/**
* 列表排序：目录恒在前，其余按列比较。
*
* <p>「类型」列按<b>扩展名</b>排序（而非本地化中文标签），否则同后缀文件
* 会被标签文案打散、跨语言下顺序还会变。</p>
*/
var compareItems = (a, b, key, asc) => {
	const dirOrder = Number(b.isDir) - Number(a.isDir);
	if (dirOrder !== 0) return dirOrder;
	let left = "";
	let right = "";
	if (key === "name") {
		left = a.name.toLowerCase();
		right = b.name.toLowerCase();
	} else if (key === "type") {
		left = extensionOf(a.name);
		right = extensionOf(b.name);
	} else if (key === "size") {
		left = a.isDir ? -1 : a.size ?? 0;
		right = b.isDir ? -1 : b.size ?? 0;
	} else {
		left = a.updatedAt ?? 0;
		right = b.updatedAt ?? 0;
	}
	const cmp = left < right ? -1 : left > right ? 1 : 0;
	return asc ? cmp : -cmp;
};
/** 人类可读体积；0 字节显示 `0 B`（历史把 0 与未知一起显示为 `-`，是 bug） */
var formatSize = (bytes) => {
	if (bytes === void 0 || bytes === null || Number.isNaN(bytes) || bytes < 0) return "-";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1073741824) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};
/** yyyy-MM-dd HH:mm；缺失/非法返回 `-` */
var formatTime = (value) => {
	if (!value || Number.isNaN(value)) return "-";
	const date = new Date(value);
	const pad = (n) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
/** 按 key（回落 name）去重，避免远端返回重复条目时渲染出重复行/重复 key */
var dedupeItems = (list) => {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const item of list) {
		const key = String(item.key || item.name);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(item);
	}
	return out;
};
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/composables/useFilePicker.ts
/**
* ReFilePicker 状态机。
*
* <p>把「加载目录 / 导航与历史 / 过滤排序 / 选中」从视图里拆出来：
* index.vue 只负责 props→composable→子组件 的接线与确认事件。</p>
*/
function useFilePicker(options) {
	const currentPath = ref(options.initialPath());
	const items = ref([]);
	const loading = ref(false);
	const loadError = ref("");
	const searchText = ref("");
	const selectedItems = ref([]);
	const history = ref([]);
	const sortKey = ref("name");
	const sortAsc = ref(true);
	const activeIndex = ref(-1);
	/** 到达选择上限的瞬时提示（空串 = 不显示） */
	const limitHint = ref("");
	/** Shift 连选的锚点（最近一次单击改选的条目） */
	const anchorKey = ref("");
	let limitHintTimer = null;
	onBeforeUnmount(() => {
		if (limitHintTimer) clearTimeout(limitHintTimer);
	});
	/** 请求序号：晚到的响应不许覆盖新目录（快速点目录/刷新时的竞态） */
	let loadSeq = 0;
	/**
	* 目录打开防抖时间戳。
	*
	* <p>双击在浏览器里是「click + click + dblclick」：若两次 click 里有一次落在
	* 已重新渲染的新行上，或某些设备重复派发 dblclick，就会连续进入两级目录。
	* 一次双击只允许触发一次「进入目录」，时间窗内后续 open 直接丢弃。</p>
	*/
	let lastDirOpenAt = 0;
	const DIR_OPEN_GUARD_MS = 400;
	/** 正在加载的目标目录：同一目标在途时不再重复发请求（双击父级/侧栏时常见） */
	let pendingPath = "";
	const dataArray = computed(() => {
		const raw = options.data();
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		return raw.items ?? [];
	});
	const dataCurrent = computed(() => {
		const raw = options.data();
		return !Array.isArray(raw) && raw ? raw.current ?? "" : "";
	});
	const hasStaticData = computed(() => {
		const raw = options.data();
		return raw !== void 0 && raw !== null;
	});
	/** 从扁平静态清单里推断某个目录的直接子项 */
	const staticChildren = (all, path) => {
		const baseSegs = pathSegments(path);
		const seen = /* @__PURE__ */ new Map();
		const result = [];
		for (const origin of all) {
			const key = String(origin.key || origin.name);
			if (samePath(key, path) || isRootPath(key) && isRootPath(path)) continue;
			const keySegs = pathSegments(key);
			if (keySegs.length <= baseSegs.length) continue;
			const rest = keySegs.slice(baseSegs.length);
			if (rest.length === 1) {
				if (!seen.has(key)) {
					seen.set(key, origin);
					result.push(origin);
				}
				continue;
			}
			const first = rest[0];
			const dirKey = joinPath(path, first);
			if (!seen.has(dirKey)) {
				const child = {
					key: dirKey,
					name: first,
					isDir: true
				};
				seen.set(dirKey, child);
				result.push(child);
			}
		}
		return result;
	};
	const resolveStaticData = (path) => {
		if (dataCurrent.value && samePath(dataCurrent.value, path)) return [...dataArray.value];
		return staticChildren(dataArray.value, path);
	};
	const normalizeLoadedResult = (result) => {
		if (Array.isArray(result)) return result;
		if (result && typeof result === "object") {
			const list = result.items;
			if (Array.isArray(list)) return list;
		}
		return [];
	};
	/** 取某个目录的条目（不改动当前路径 / 历史） */
	const fetchItems = async (path) => {
		if (hasStaticData.value) return resolveStaticData(path);
		if (options.loader()) return normalizeLoadedResult(await options.loader()(path));
		throw new Error("ReFilePicker 必须配置 loader（filesystem-starter/宿主远端接口）或 data（本地 JSON）");
	};
	/** 刷新当前目录：保留旧列表直到新数据到达，避免闪烁 */
	const load = async (path = currentPath.value) => {
		const seq = ++loadSeq;
		loading.value = true;
		loadError.value = "";
		try {
			const next = await fetchItems(path);
			if (seq !== loadSeq) return;
			items.value = dedupeItems(next);
			activeIndex.value = -1;
		} catch (err) {
			if (seq !== loadSeq) return;
			items.value = [];
			loadError.value = err instanceof Error ? err.message : String(err);
		} finally {
			if (seq === loadSeq) loading.value = false;
		}
	};
	/**
	* 切换到目标目录：**先取数据，再一次性更新路径 / 历史 / 列表 / 选中**。
	*
	* <p>不能先改 currentPath 再异步 load：那样面包屑、左侧目录树会先变成新路径，
	* 右侧列表还停留在旧目录，等 loader 回来才换内容，视觉上就像「双击触发了两次」。
	* 数据回来后再整体切换，进度条只表示一次加载。</p>
	*
	* @param path          目标目录
	* @param historyAction 后退栈操作：push=进入；back=后退；none=仅切换
	*/
	const switchTo = async (path, historyAction) => {
		const seq = ++loadSeq;
		pendingPath = path;
		loading.value = true;
		loadError.value = "";
		try {
			const next = await fetchItems(path);
			if (seq !== loadSeq) return;
			if (historyAction === "push") history.value.push(currentPath.value);
			else if (historyAction === "back") history.value.pop();
			currentPath.value = path;
			items.value = dedupeItems(next);
			selectedItems.value = [];
			activeIndex.value = -1;
		} catch (err) {
			if (seq !== loadSeq) return;
			loadError.value = err instanceof Error ? err.message : String(err);
		} finally {
			if (seq === loadSeq) {
				loading.value = false;
				pendingPath = "";
			}
		}
	};
	const refresh = () => load(currentPath.value);
	/** 打开弹窗/换起始目录时的整体复位 */
	const reset = async (path) => {
		currentPath.value = path;
		items.value = [];
		selectedItems.value = [];
		history.value = [];
		searchText.value = "";
		sortKey.value = "name";
		sortAsc.value = true;
		activeIndex.value = -1;
		limitHint.value = "";
		anchorKey.value = "";
		await load(path);
	};
	const breadcrumb = computed(() => breadcrumbOf(currentPath.value));
	const treeNodes = computed(() => {
		const nodes = [{
			key: "/",
			name: "根目录",
			depth: 0
		}];
		breadcrumb.value.slice(1).forEach((crumb, i) => {
			nodes.push({
				key: crumb.path,
				name: crumb.name,
				depth: i + 1
			});
		});
		return nodes;
	});
	const isCurrentPath = (path) => samePath(path, currentPath.value);
	const isParentEntry = (item) => item.name === ".." || samePath(item.key, parentPathOf(currentPath.value));
	const parentEntry = computed(() => {
		if (isRootPath(currentPath.value)) return null;
		return items.value.find((item) => item.name === ".." && item.isDir) ?? {
			key: parentPathOf(currentPath.value),
			name: "..",
			isDir: true
		};
	});
	const treeDirs = computed(() => items.value.filter((item) => item.isDir && item.name !== ".." && !isParentEntry(item)).slice(0, 30));
	/** 过滤后的行（不含「..」/上级目录、按 accept + 搜索词筛） */
	const rows = computed(() => {
		const acceptFilter = buildAcceptFilter(options.accept());
		let list = items.value.filter((item) => !isParentEntry(item) && acceptFilter(item));
		const q = searchText.value.trim().toLowerCase();
		if (q) list = list.filter((item) => item.name.toLowerCase().includes(q));
		return [...list].sort((a, b) => compareItems(a, b, sortKey.value, sortAsc.value));
	});
	const searching = computed(() => searchText.value.trim().length > 0);
	const selectedCount = computed(() => selectedItems.value.length);
	const canConfirm = computed(() => options.multiple() ? selectedCount.value > 0 : selectedCount.value === 1);
	const selectedSummary = computed(() => {
		if (!selectedItems.value.length) return "尚未选择";
		if (options.multiple()) {
			const first = selectedItems.value[0]?.key ?? "";
			return selectedItems.value.length > 1 ? `${selectedItems.value.length} 项 · ${first}` : first;
		}
		return selectedItems.value[0]?.key || selectedItems.value[0]?.name || "";
	});
	const navigateTo = (path) => {
		if (samePath(path, currentPath.value)) return;
		if (loading.value && samePath(path, pendingPath)) return;
		switchTo(path, "push");
	};
	const goBack = () => {
		const previous = history.value[history.value.length - 1];
		if (previous === void 0) return;
		if (loading.value && samePath(previous, pendingPath)) return;
		switchTo(previous, "back");
	};
	/** 目录能否被选中：显式 directoryMode，或 accept 里写了 dir */
	const dirSelectable = computed(() => options.directoryMode() || acceptHasDir(options.accept()));
	/** 选择数量上限（0 = 不限） */
	const limit = computed(() => Math.max(0, Math.floor(Number(options.limit?.() ?? 0) || 0)));
	/**
	* 该条目是否可选中。
	*
	* <p>目录默认只能进不能选；目录模式下文件只作为「目标目录里有什么」的参考展示，
	* 不允许被选中，否则会出现「选文件夹」却确认了一个文件的情况。</p>
	*/
	const canSelect = (item) => item.isDir ? dirSelectable.value : !options.directoryMode();
	const isLimitReached = computed(() => limit.value > 0 && selectedItems.value.length >= limit.value);
	/** 到上限的提示：2.4s 后自动消失（默认不静默丢弃已有选择） */
	const showLimitHint = () => {
		limitHint.value = `最多选择 ${limit.value} 项`;
		if (limitHintTimer) clearTimeout(limitHintTimer);
		limitHintTimer = setTimeout(() => {
			limitHint.value = "";
			limitHintTimer = null;
		}, 2400);
	};
	const isSelected = (item) => selectedItems.value.some((selected) => selected.key === item.key);
	const toggleSelect = (item) => {
		const idx = selectedItems.value.findIndex((selected) => selected.key === item.key);
		if (idx >= 0) {
			selectedItems.value.splice(idx, 1);
			limitHint.value = "";
			return;
		}
		if (isLimitReached.value) {
			if (limit.value === 1) {
				selectedItems.value = [item];
				return;
			}
			showLimitHint();
			return;
		}
		selectedItems.value.push(item);
	};
	const clearSelection = () => {
		selectedItems.value = [];
		anchorKey.value = "";
		limitHint.value = "";
	};
	/** Shift 连选：锚点 → 目标之间的行；目录不可选时跳过，超上限截断并提示 */
	const selectRangeTo = (item) => {
		const list = rows.value;
		const toIndex = list.findIndex((row) => row.key === item.key);
		const fromIndex = list.findIndex((row) => row.key === anchorKey.value);
		if (toIndex < 0) return;
		if (fromIndex < 0) {
			selectOnly(item);
			return;
		}
		const [start, end] = fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
		let range = list.slice(start, end + 1).filter((row) => canSelect(row));
		if (limit.value > 0 && range.length > limit.value) {
			range = range.slice(0, limit.value);
			showLimitHint();
		}
		selectedItems.value = range;
		activeIndex.value = toIndex;
	};
	/**
	* 单击：目录在文件模式下不选中（进目录靠双击/回车）；「..」直接跳转。
	*
	* <p>多选对齐资源管理器：<b>普通单击 = 改选</b>（不会越点越多），
	* Ctrl/⌘ + 单击 = 加/减选，Shift + 单击 = 从锚点连选。</p>
	*/
	const selectItem = (item, modifiers) => {
		if (isParentEntry(item)) {
			navigateTo(item.key);
			return;
		}
		if (!canSelect(item)) return;
		if (!options.multiple()) {
			selectOnly(item);
			return;
		}
		if (modifiers?.shiftKey) {
			selectRangeTo(item);
			return;
		}
		if (modifiers?.ctrlKey || modifiers?.metaKey) {
			toggleSelect(item);
			anchorKey.value = item.key;
			return;
		}
		selectOnly(item);
	};
	/** 只选中这一项（右键唤起菜单 / 普通单击时用：资源管理器口径） */
	const selectOnly = (item) => {
		if (!canSelect(item)) return;
		selectedItems.value = [item];
		anchorKey.value = item.key;
		limitHint.value = "";
	};
	/**
	* 双击/回车：目录进入，「..」跳转。
	* @returns 单选模式下选中了一个文件时为 true —— 视图层据此立刻确认（双击即选）
	*/
	const openItem = (item) => {
		if (isParentEntry(item)) {
			navigateTo(item.key);
			return false;
		}
		if (item.isDir) {
			const now = Date.now();
			if (now - lastDirOpenAt < DIR_OPEN_GUARD_MS) return false;
			lastDirOpenAt = now;
			navigateTo(item.key);
			return false;
		}
		if (options.directoryMode()) return false;
		if (!options.multiple()) {
			selectedItems.value = [item];
			return true;
		}
		return false;
	};
	const takeSelection = () => {
		const picked = [...selectedItems.value];
		selectedItems.value = [];
		return picked;
	};
	const toggleSort = (key) => {
		if (sortKey.value === key) sortAsc.value = !sortAsc.value;
		else {
			sortKey.value = key;
			sortAsc.value = true;
		}
	};
	const sortArrow = (key) => sortKey.value === key ? sortAsc.value ? "↑" : "↓" : "";
	const moveActive = (delta) => {
		const list = rows.value;
		if (!list.length) return;
		if (activeIndex.value < 0) {
			activeIndex.value = delta > 0 ? 0 : list.length - 1;
			return;
		}
		activeIndex.value = Math.min(list.length - 1, Math.max(0, activeIndex.value + delta));
	};
	const activateActive = () => {
		const item = rows.value[activeIndex.value];
		if (!item) return false;
		if (item.isDir && canSelect(item)) {
			selectItem(item);
			return false;
		}
		return openItem(item);
	};
	return {
		currentPath,
		items,
		loading,
		loadError,
		searchText,
		selectedItems,
		history,
		sortKey,
		sortAsc,
		activeIndex,
		breadcrumb,
		treeNodes,
		treeDirs,
		parentEntry,
		rows,
		selectedCount,
		searching,
		canConfirm,
		selectedSummary,
		limit,
		limitHint,
		canSelect,
		isLimitReached,
		load,
		refresh,
		reset,
		navigateTo,
		goBack,
		selectItem,
		selectOnly,
		toggleSelect,
		openItem,
		clearSelection,
		toggleSort,
		sortArrow,
		isSelected,
		isCurrentPath,
		isParentEntry,
		moveActive,
		activateActive,
		takeSelection
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerToolbar.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$6 = { class: "rfp__toolbar re-file-picker__toolbar" };
var _hoisted_2$6 = { class: "rfp__nav-btns" };
var _hoisted_3$5 = ["disabled"];
var _hoisted_4$5 = ["disabled"];
var _hoisted_5$4 = {
	class: "rfp__address re-file-picker__bread rfp__crumbs",
	"aria-label": "地址栏"
};
var _hoisted_6$3 = [
	"title",
	"onClick",
	"onKeydown"
];
var _hoisted_7$3 = {
	key: 0,
	class: "rfp__crumb-sep",
	"aria-hidden": "true"
};
var _hoisted_8$2 = { class: "rfp__search" };
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerToolbar.vue
var FilePickerToolbar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FilePickerToolbar",
	props: /*@__PURE__*/ mergeModels({
		breadcrumb: {},
		loading: { type: Boolean },
		canBack: { type: Boolean }
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels([
		"back",
		"refresh",
		"navigate"
	], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* ReFilePicker 工具条 —— 对齐 Windows 资源管理器文件对话框顶栏：
		* 左侧后退 / 刷新按钮，中间地址栏（面包屑），右侧搜索框。
		*/
		const emit = __emit;
		/** 搜索词由宿主双向绑定 */
		const search = useModel(__props, "modelValue");
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_input = resolveComponent("el-input");
			return openBlock(), createElementBlock("div", _hoisted_1$6, [
				createBaseVNode("div", _hoisted_2$6, [createBaseVNode("button", {
					type: "button",
					class: "rfp-icon-btn",
					title: "后退",
					"aria-label": "后退",
					disabled: !__props.canBack,
					onClick: _cache[0] || (_cache[0] = ($event) => emit("back"))
				}, [createVNode(_component_el_icon, { size: 16 }, {
					default: withCtx(() => [createVNode(unref(arrow_left_default))]),
					_: 1
				})], 8, _hoisted_3$5), createBaseVNode("button", {
					type: "button",
					class: "rfp-icon-btn",
					title: "刷新",
					"aria-label": "刷新",
					disabled: __props.loading,
					onClick: _cache[1] || (_cache[1] = ($event) => emit("refresh"))
				}, [createVNode(_component_el_icon, {
					size: 16,
					class: normalizeClass({ "is-spin": __props.loading })
				}, {
					default: withCtx(() => [createVNode(unref(refresh_default))]),
					_: 1
				}, 8, ["class"])], 8, _hoisted_4$5)]),
				createBaseVNode("nav", _hoisted_5$4, [createVNode(_component_el_icon, {
					class: "rfp__address-icon",
					"aria-hidden": "true"
				}, {
					default: withCtx(() => [createVNode(unref(folder_opened_default))]),
					_: 1
				}), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.breadcrumb, (seg, i) => {
					return openBlock(), createElementBlock("span", {
						key: seg.path || "root",
						class: normalizeClass(["re-file-picker__bread-item rfp__crumb", { "is-active": i === __props.breadcrumb.length - 1 }]),
						role: "button",
						tabindex: "0",
						title: seg.path,
						onClick: ($event) => emit("navigate", seg.path),
						onKeydown: withKeys(($event) => emit("navigate", seg.path), ["enter"])
					}, [createTextVNode(toDisplayString(seg.name) + " ", 1), i < __props.breadcrumb.length - 1 ? (openBlock(), createElementBlock("span", _hoisted_7$3, "›")) : createCommentVNode("", true)], 42, _hoisted_6$3);
				}), 128))]),
				createBaseVNode("div", _hoisted_8$2, [createVNode(_component_el_input, {
					modelValue: search.value,
					"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => search.value = $event),
					size: "small",
					placeholder: "搜索",
					clearable: "",
					"aria-label": "搜索文件或目录"
				}, {
					prefix: withCtx(() => [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(search_default))]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue"])])
			]);
		};
	}
}), [["__scopeId", "data-v-58208982"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerSidebar.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$5 = { class: "rfp-nav" };
var _hoisted_2$5 = ["title", "onClick"];
var _hoisted_3$4 = { class: "rfp-nav__label" };
var _hoisted_4$4 = ["title", "onClick"];
var _hoisted_5$3 = { class: "rfp-nav__label" };
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerSidebar.vue
var FilePickerSidebar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FilePickerSidebar",
	props: {
		nodes: {},
		dirs: {},
		currentPath: {}
	},
	emits: ["navigate"],
	setup(__props, { emit: __emit }) {
		/**
		* ReFilePicker 导航窗格 —— 对齐资源管理器左侧「导航窗格」：
		* 窗口底色、分区标题、文件夹图标、按层级缩进、选中浅蓝高亮。
		*/
		const props = __props;
		const emit = __emit;
		const isCurrent = (path) => samePath(path, props.currentPath);
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("aside", _hoisted_1$5, [
				_cache[2] || (_cache[2] = createBaseVNode("div", { class: "rfp-nav__title" }, "位置", -1)),
				(openBlock(true), createElementBlock(Fragment, null, renderList(__props.nodes, (node) => {
					return openBlock(), createElementBlock("button", {
						key: node.key,
						type: "button",
						class: normalizeClass(["rfp-nav__item", { "is-active": isCurrent(node.key) }]),
						style: normalizeStyle({ "--rfp-tree-depth": node.depth }),
						title: node.key,
						onClick: ($event) => emit("navigate", node.key)
					}, [createVNode(_component_el_icon, {
						size: 15,
						class: "rfp-nav__icon"
					}, {
						default: withCtx(() => [createVNode(unref(folder_default))]),
						_: 1
					}), createBaseVNode("span", _hoisted_3$4, toDisplayString(node.name), 1)], 14, _hoisted_2$5);
				}), 128)),
				__props.dirs.length ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [_cache[1] || (_cache[1] = createBaseVNode("div", { class: "rfp-nav__title rfp-nav__title--sub" }, "当前目录", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.dirs, (dir) => {
					return openBlock(), createElementBlock("button", {
						key: dir.key,
						type: "button",
						class: normalizeClass(["rfp-nav__item rfp-nav__item--child", { "is-active": isCurrent(dir.key) }]),
						title: dir.key,
						onClick: ($event) => emit("navigate", dir.key)
					}, [
						_cache[0] || (_cache[0] = createBaseVNode("span", {
							class: "rfp-nav__blank",
							"aria-hidden": "true"
						}, null, -1)),
						createVNode(_component_el_icon, {
							size: 15,
							class: "rfp-nav__icon"
						}, {
							default: withCtx(() => [createVNode(unref(folder_default))]),
							_: 1
						}),
						createBaseVNode("span", _hoisted_5$3, toDisplayString(dir.name), 1)
					], 10, _hoisted_4$4);
				}), 128))], 64)) : createCommentVNode("", true)
			]);
		};
	}
}), [["__scopeId", "data-v-ae675ce5"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerList.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$4 = {
	key: 0,
	class: "rfp-main__progress",
	"aria-hidden": "true"
};
var _hoisted_2$4 = {
	key: 1,
	class: "rfp-main__state rfp-main__state--error"
};
var _hoisted_3$3 = {
	class: "rfp-details__head",
	role: "row"
};
var _hoisted_4$3 = ["aria-label", "onClick"];
var _hoisted_5$2 = { class: "rfp-sort-arrow" };
var _hoisted_6$2 = { class: "rfp-details__name" };
var _hoisted_7$2 = [
	"data-row-index",
	"title",
	"aria-label",
	"onClick",
	"onDblclick"
];
var _hoisted_8$1 = { class: "rfp-details__name" };
var _hoisted_9 = ["src"];
var _hoisted_10 = { class: "rfp-details__time" };
var _hoisted_11 = { class: "rfp-details__type" };
var _hoisted_12 = { class: "rfp-details__size" };
var _hoisted_13 = { class: "rfp-grid__thumb" };
var _hoisted_14 = {
	key: 0,
	class: "rfp-grid__meta"
};
var _hoisted_15 = [
	"data-row-index",
	"title",
	"aria-label",
	"onClick",
	"onDblclick"
];
var _hoisted_16 = { class: "rfp-grid__thumb" };
var _hoisted_17 = ["src"];
var _hoisted_18 = {
	key: 0,
	class: "rfp-grid__meta"
};
var _hoisted_19 = {
	key: 3,
	class: "rfp-main__state"
};
var _hoisted_20 = {
	key: 4,
	class: "rfp-main__state"
};
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerList.vue
var FilePickerList_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FilePickerList",
	props: {
		rows: {},
		columns: {},
		parentEntry: {},
		loading: { type: Boolean },
		loadError: {},
		searching: { type: Boolean },
		sortKey: {},
		sortAsc: { type: Boolean },
		activeIndex: {},
		isSelected: { type: Function },
		canSelect: { type: Function },
		viewMode: {}
	},
	emits: [
		"sort",
		"activate",
		"open",
		"navigate"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReFilePicker 详细信息视图 —— 对齐资源管理器「详细信息」列表：
		* 灰色表头 + 列排序、文件夹/文件图标、浅蓝悬停与选中、底部加载进度。
		*
		* <p>「..」由父级传入（参与排序/过滤之外），行点击/双击分别对外抛
		* activate/open，键盘高亮行由 activeIndex 驱动并自动滚入可视区。</p>
		*/
		const props = __props;
		const emit = __emit;
		const detailsRef = ref(null);
		const sortArrow = (key) => props.sortKey === key ? props.sortAsc ? "↑" : "↓" : "";
		/** 键盘高亮行变化时滚入可视区 */
		watch(() => props.activeIndex, async (index) => {
			if (index < 0) return;
			await nextTick();
			detailsRef.value?.querySelector(`[data-row-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("main", { class: normalizeClass(["rfp-main", { "is-loading": __props.loading }]) }, [
				__props.loading ? (openBlock(), createElementBlock("div", _hoisted_1$4)) : createCommentVNode("", true),
				__props.loadError ? (openBlock(), createElementBlock("div", _hoisted_2$4, [createVNode(_component_el_icon, { size: 26 }, {
					default: withCtx(() => [createVNode(unref(warning_filled_default))]),
					_: 1
				}), createBaseVNode("div", null, [_cache[2] || (_cache[2] = createBaseVNode("b", null, "目录加载失败", -1)), createBaseVNode("span", null, toDisplayString(__props.loadError), 1)])])) : __props.rows.length || __props.parentEntry ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [__props.viewMode === "details" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_3$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.columns, (col) => {
					return openBlock(), createElementBlock("button", {
						key: col.key,
						type: "button",
						class: normalizeClass(["rfp-details__head-cell", [col.className, { "is-sorted": __props.sortKey === col.key }]]),
						"aria-label": `排序：${col.label}`,
						onClick: ($event) => emit("sort", col.key)
					}, [createTextVNode(toDisplayString(col.label) + " ", 1), createBaseVNode("span", _hoisted_5$2, toDisplayString(sortArrow(col.key)), 1)], 10, _hoisted_4$3);
				}), 128))]), createBaseVNode("div", {
					ref_key: "detailsRef",
					ref: detailsRef,
					class: "rfp-details"
				}, [__props.parentEntry ? (openBlock(), createElementBlock("button", {
					key: 0,
					type: "button",
					class: "rfp-details__row rfp-details__row--parent rfp-parent",
					title: "返回上级目录",
					onClick: _cache[0] || (_cache[0] = ($event) => emit("navigate", __props.parentEntry.key))
				}, [
					createBaseVNode("span", _hoisted_6$2, [createVNode(_component_el_icon, {
						size: 16,
						class: "rfp-file-icon rfp-file-icon--dir"
					}, {
						default: withCtx(() => [createVNode(unref(folder_opened_default))]),
						_: 1
					}), _cache[3] || (_cache[3] = createBaseVNode("span", null, "..", -1))]),
					_cache[4] || (_cache[4] = createBaseVNode("span", { class: "rfp-details__time" }, "-", -1)),
					_cache[5] || (_cache[5] = createBaseVNode("span", { class: "rfp-details__type" }, "上级目录", -1)),
					_cache[6] || (_cache[6] = createBaseVNode("span", { class: "rfp-details__size" }, "-", -1))
				])) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.rows, (item, i) => {
					return openBlock(), createElementBlock("button", {
						key: item.key,
						type: "button",
						class: normalizeClass(["rfp-details__row re-file-picker__item", {
							"is-selected": __props.isSelected(item),
							"is-active": i === __props.activeIndex,
							"is-dir": item.isDir,
							"is-disabled": !item.isDir && !__props.canSelect(item)
						}]),
						"data-row-index": i,
						title: item.key,
						"aria-label": item.name,
						onClick: ($event) => emit("activate", item, i, $event),
						onDblclick: ($event) => emit("open", item)
					}, [
						createBaseVNode("span", _hoisted_8$1, [!item.isDir && item.thumbnail ? (openBlock(), createElementBlock("img", {
							key: 0,
							src: item.thumbnail,
							class: "rfp-details__thumb",
							alt: ""
						}, null, 8, _hoisted_9)) : item.isDir ? (openBlock(), createBlock(_component_el_icon, {
							key: 1,
							size: 16,
							class: "rfp-file-icon rfp-file-icon--dir"
						}, {
							default: withCtx(() => [createVNode(unref(folder_default))]),
							_: 1
						})) : unref(fileKindOf)(item) === "image" ? (openBlock(), createBlock(_component_el_icon, {
							key: 2,
							size: 16,
							class: "rfp-file-icon rfp-file-icon--image"
						}, {
							default: withCtx(() => [createVNode(unref(picture_default))]),
							_: 1
						})) : unref(fileKindOf)(item) === "video" ? (openBlock(), createBlock(_component_el_icon, {
							key: 3,
							size: 16,
							class: "rfp-file-icon rfp-file-icon--video"
						}, {
							default: withCtx(() => [createVNode(unref(video_play_default))]),
							_: 1
						})) : unref(fileKindOf)(item) === "audio" ? (openBlock(), createBlock(_component_el_icon, {
							key: 4,
							size: 16,
							class: "rfp-file-icon rfp-file-icon--audio"
						}, {
							default: withCtx(() => [createVNode(unref(headset_default))]),
							_: 1
						})) : unref(fileKindOf)(item) === "pdf" ? (openBlock(), createBlock(_component_el_icon, {
							key: 5,
							size: 16,
							class: "rfp-file-icon rfp-file-icon--pdf"
						}, {
							default: withCtx(() => [createVNode(unref(document_default))]),
							_: 1
						})) : (openBlock(), createBlock(_component_el_icon, {
							key: 6,
							size: 16,
							class: "rfp-file-icon"
						}, {
							default: withCtx(() => [createVNode(unref(files_default))]),
							_: 1
						})), createBaseVNode("span", { class: normalizeClass(["rfp-details__name-text", { "is-dir": item.isDir }]) }, toDisplayString(item.name), 3)]),
						createBaseVNode("span", _hoisted_10, toDisplayString(unref(formatTime)(item.updatedAt)), 1),
						createBaseVNode("span", _hoisted_11, toDisplayString(item.isDir ? "文件夹" : unref(fileTypeText)(item.name)), 1),
						createBaseVNode("span", _hoisted_12, toDisplayString(item.isDir ? "-" : unref(formatSize)(item.size)), 1)
					], 42, _hoisted_7$2);
				}), 128))], 512)], 64)) : (openBlock(), createElementBlock("div", {
					key: 1,
					ref_key: "detailsRef",
					ref: detailsRef,
					class: normalizeClass(["rfp-grid", `rfp-grid--${__props.viewMode}`])
				}, [__props.parentEntry ? (openBlock(), createElementBlock("button", {
					key: 0,
					type: "button",
					class: "rfp-grid__cell rfp-grid__cell--parent",
					title: "返回上级目录",
					onClick: _cache[1] || (_cache[1] = ($event) => emit("navigate", __props.parentEntry.key))
				}, [
					createBaseVNode("span", _hoisted_13, [createVNode(_component_el_icon, { class: "rfp-grid__icon rfp-file-icon rfp-file-icon--dir" }, {
						default: withCtx(() => [createVNode(unref(folder_opened_default))]),
						_: 1
					})]),
					_cache[7] || (_cache[7] = createBaseVNode("span", { class: "rfp-grid__name" }, "..", -1)),
					__props.viewMode !== "smallIcons" ? (openBlock(), createElementBlock("span", _hoisted_14, "上级目录")) : createCommentVNode("", true)
				])) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.rows, (item, i) => {
					return openBlock(), createElementBlock("button", {
						key: item.key,
						type: "button",
						class: normalizeClass(["rfp-grid__cell re-file-picker__item", {
							"is-selected": __props.isSelected(item),
							"is-active": i === __props.activeIndex,
							"is-dir": item.isDir,
							"is-disabled": !item.isDir && !__props.canSelect(item)
						}]),
						"data-row-index": i,
						title: item.key,
						"aria-label": item.name,
						onClick: ($event) => emit("activate", item, i, $event),
						onDblclick: ($event) => emit("open", item)
					}, [
						createBaseVNode("span", _hoisted_16, [!item.isDir && item.thumbnail && __props.viewMode !== "smallIcons" ? (openBlock(), createElementBlock("img", {
							key: 0,
							src: item.thumbnail,
							class: "rfp-grid__thumb-img rfp-details__thumb",
							alt: ""
						}, null, 8, _hoisted_17)) : item.isDir ? (openBlock(), createBlock(_component_el_icon, {
							key: 1,
							class: "rfp-grid__icon rfp-file-icon rfp-file-icon--dir"
						}, {
							default: withCtx(() => [createVNode(unref(folder_default))]),
							_: 1
						})) : unref(fileKindOf)(item) === "image" ? (openBlock(), createBlock(_component_el_icon, {
							key: 2,
							class: "rfp-grid__icon rfp-file-icon rfp-file-icon--image"
						}, {
							default: withCtx(() => [createVNode(unref(picture_default))]),
							_: 1
						})) : unref(fileKindOf)(item) === "video" ? (openBlock(), createBlock(_component_el_icon, {
							key: 3,
							class: "rfp-grid__icon rfp-file-icon rfp-file-icon--video"
						}, {
							default: withCtx(() => [createVNode(unref(video_play_default))]),
							_: 1
						})) : unref(fileKindOf)(item) === "audio" ? (openBlock(), createBlock(_component_el_icon, {
							key: 4,
							class: "rfp-grid__icon rfp-file-icon rfp-file-icon--audio"
						}, {
							default: withCtx(() => [createVNode(unref(headset_default))]),
							_: 1
						})) : unref(fileKindOf)(item) === "pdf" ? (openBlock(), createBlock(_component_el_icon, {
							key: 5,
							class: "rfp-grid__icon rfp-file-icon rfp-file-icon--pdf"
						}, {
							default: withCtx(() => [createVNode(unref(document_default))]),
							_: 1
						})) : (openBlock(), createBlock(_component_el_icon, {
							key: 6,
							class: "rfp-grid__icon rfp-file-icon"
						}, {
							default: withCtx(() => [createVNode(unref(files_default))]),
							_: 1
						}))]),
						createBaseVNode("span", { class: normalizeClass(["rfp-grid__name", { "is-dir": item.isDir }]) }, toDisplayString(item.name), 3),
						__props.viewMode !== "smallIcons" ? (openBlock(), createElementBlock("span", _hoisted_18, toDisplayString(item.isDir ? "文件夹" : unref(formatSize)(item.size)), 1)) : createCommentVNode("", true)
					], 42, _hoisted_15);
				}), 128))], 2))], 64)) : !__props.loading ? (openBlock(), createElementBlock("div", _hoisted_19, [renderSlot(_ctx.$slots, "empty", {}, () => [createVNode(_component_el_icon, {
					size: 40,
					class: "rfp-main__empty-icon"
				}, {
					default: withCtx(() => [createVNode(unref(folder_opened_default))]),
					_: 1
				}), createBaseVNode("span", null, toDisplayString(__props.searching ? "未找到匹配项" : "当前目录为空"), 1)], true)])) : createCommentVNode("", true),
				__props.loading && !__props.rows.length && !__props.loadError ? (openBlock(), createElementBlock("div", _hoisted_20, [createVNode(_component_el_icon, {
					size: 22,
					class: "is-spin"
				}, {
					default: withCtx(() => [createVNode(unref(loading_default))]),
					_: 1
				}), _cache[8] || (_cache[8] = createBaseVNode("span", null, "加载中…", -1))])) : createCommentVNode("", true)
			], 2);
		};
	}
}), [["__scopeId", "data-v-4b23994a"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerContextMenu.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = {
	key: 0,
	class: "rfp-ctx__divider",
	"aria-hidden": "true"
};
var _hoisted_2$3 = [
	"disabled",
	"aria-label",
	"onClick"
];
var _hoisted_3$2 = {
	key: 1,
	class: "rfp-ctx__icon",
	"aria-hidden": "true"
};
var _hoisted_4$2 = { class: "rfp-ctx__label" };
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerContextMenu.vue
var FilePickerContextMenu_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FilePickerContextMenu",
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		items: { default: () => [] },
		x: { default: 0 },
		y: { default: 0 }
	},
	emits: ["update:visible", "select"],
	setup(__props, { emit: __emit }) {
		/**
		* ReFilePicker 右键菜单 —— 定位在鼠标右键处，样式对齐资源管理器的上下文菜单。
		*
		* <p>只负责「画菜单 + 收回事件」，菜单项由父级按开关与宿主回调拼好后传入；
		* 不挂在 DOM 里常驻（v-if + Teleport），因此关着的时候页面上没有任何多余可点元素。</p>
		*/
		const props = __props;
		const emit = __emit;
		const menuRef = ref(null);
		/** 菜单尺寸（用于贴边翻转，避免溢出视口） */
		const menuSize = ref({
			width: 200,
			height: 0
		});
		/** 尺寸测出来之前先不显示，免得第一帧闪到视口外 */
		const placed = ref(false);
		const menuStyle = computed(() => {
			const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
			const vh = typeof window === "undefined" ? 720 : window.innerHeight;
			const gap = 6;
			const w = menuSize.value.width || 200;
			const h = menuSize.value.height || props.items.length * 32 + 8;
			let left = props.x;
			let top = props.y;
			if (left + w + gap > vw) left = Math.max(gap, props.x - w);
			if (top + h + gap > vh) top = Math.max(gap, props.y - h);
			return {
				left: `${left}px`,
				top: `${top}px`,
				visibility: placed.value ? "visible" : "hidden"
			};
		});
		const close = () => emit("update:visible", false);
		const onSelect = (item) => {
			if (item.disabled) return;
			emit("select", item.key);
			close();
		};
		/** 点空白 / 再右键 / 滚轮 / Esc 都收回菜单 */
		const onDocumentPointer = (event) => {
			if (!props.visible) return;
			if (menuRef.value?.contains(event.target)) return;
			close();
		};
		const onKeydown = (event) => {
			if (props.visible && event.key === "Escape") {
				event.stopPropagation();
				close();
			}
		};
		watch(() => props.visible, async (visible) => {
			if (!visible) {
				placed.value = false;
				return;
			}
			placed.value = false;
			await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
			if (menuRef.value) {
				const rect = menuRef.value.getBoundingClientRect();
				menuSize.value = {
					width: rect.width,
					height: rect.height
				};
			}
			placed.value = true;
		}, { immediate: true });
		onMounted(() => {
			document.addEventListener("mousedown", onDocumentPointer, true);
			document.addEventListener("contextmenu", onDocumentPointer, true);
			document.addEventListener("wheel", onDocumentPointer, true);
			document.addEventListener("keydown", onKeydown, true);
		});
		onBeforeUnmount(() => {
			document.removeEventListener("mousedown", onDocumentPointer, true);
			document.removeEventListener("contextmenu", onDocumentPointer, true);
			document.removeEventListener("wheel", onDocumentPointer, true);
			document.removeEventListener("keydown", onKeydown, true);
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createBlock(Teleport, { to: "body" }, [__props.visible && __props.items.length ? (openBlock(), createElementBlock("div", {
				key: 0,
				ref_key: "menuRef",
				ref: menuRef,
				class: "rfp-ctx",
				role: "menu",
				style: normalizeStyle(menuStyle.value),
				onContextmenu: _cache[0] || (_cache[0] = withModifiers(() => {}, ["prevent"]))
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item, index) => {
				return openBlock(), createElementBlock(Fragment, { key: item.key }, [item.divided && index > 0 ? (openBlock(), createElementBlock("span", _hoisted_1$3)) : createCommentVNode("", true), createBaseVNode("button", {
					type: "button",
					role: "menuitem",
					class: normalizeClass(["rfp-ctx__item", { "is-disabled": item.disabled }]),
					disabled: item.disabled,
					"aria-label": item.label,
					onClick: ($event) => onSelect(item)
				}, [item.icon ? (openBlock(), createBlock(_component_el_icon, {
					key: 0,
					size: 14,
					class: "rfp-ctx__icon"
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(item.icon)))]),
					_: 2
				}, 1024)) : (openBlock(), createElementBlock("span", _hoisted_3$2)), createBaseVNode("span", _hoisted_4$2, toDisplayString(item.label), 1)], 10, _hoisted_2$3)], 64);
			}), 128))], 36)) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-87827918"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerPropertiesDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "rfp-props__list" };
var _hoisted_2$2 = ["title"];
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerPropertiesDialog.vue
var FilePickerPropertiesDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FilePickerPropertiesDialog",
	props: {
		modelValue: { type: Boolean },
		item: {},
		path: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		/**
		* ReFilePicker「属性」弹窗 —— 对齐资源管理器的属性页：名称 / 位置 / 类型 / 大小 / 修改时间。
		*
		* <p>数据全部来自列表里已有的字段（不额外请求后端），右键空白处时展示的是当前目录的属性。</p>
		*/
		const props = __props;
		const emit = __emit;
		const visible = computed({
			get: () => props.modelValue,
			set: (value) => emit("update:modelValue", value)
		});
		const rows = computed(() => {
			const item = props.item;
			if (item) return [
				{
					label: "名称",
					value: item.name
				},
				{
					label: "位置",
					value: parentPathOf(item.key || props.path)
				},
				{
					label: "类型",
					value: item.isDir ? "文件夹" : fileTypeText(item.name)
				},
				{
					label: "大小",
					value: item.isDir ? "-" : formatSize(item.size)
				},
				{
					label: "修改时间",
					value: formatTime(item.updatedAt)
				},
				{
					label: "完整路径",
					value: item.key
				}
			];
			return [
				{
					label: "名称",
					value: props.path || "根目录"
				},
				{
					label: "位置",
					value: parentPathOf(props.path)
				},
				{
					label: "类型",
					value: "文件夹"
				},
				{
					label: "完整路径",
					value: props.path
				}
			];
		});
		return (_ctx, _cache) => {
			const _component_el_dialog = resolveComponent("el-dialog");
			return __props.modelValue ? (openBlock(), createBlock(_component_el_dialog, {
				key: 0,
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => visible.value = $event),
				title: "属性",
				width: "min(520px, 92vw)",
				"append-to-body": "",
				"destroy-on-close": "",
				class: "rfp-props"
			}, {
				default: withCtx(() => [createBaseVNode("dl", _hoisted_1$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(rows.value, (row) => {
					return openBlock(), createElementBlock(Fragment, { key: row.label }, [createBaseVNode("dt", null, toDisplayString(row.label), 1), createBaseVNode("dd", { title: row.value }, toDisplayString(row.value || "-"), 9, _hoisted_2$2)], 64);
				}), 128))])]),
				_: 1
			}, 8, ["modelValue"])) : createCommentVNode("", true);
		};
	}
}), [["__scopeId", "data-v-a0054385"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerPreviewDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "rfp-preview__body" };
var _hoisted_2$1 = {
	key: 0,
	class: "rfp-preview__state"
};
var _hoisted_3$1 = {
	key: 1,
	class: "rfp-preview__state is-error"
};
var _hoisted_4$1 = ["src", "title"];
var _hoisted_5$1 = {
	key: 3,
	class: "rfp-preview__state"
};
var _hoisted_6$1 = { class: "rfp-preview__foot" };
var _hoisted_7$1 = ["href"];
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/components/FilePickerPreviewDialog.vue
var FilePickerPreviewDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FilePickerPreviewDialog",
	props: {
		modelValue: { type: Boolean },
		item: {},
		src: {},
		loading: { type: Boolean },
		error: {}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		/**
		* ReFilePicker「预览」弹窗 —— 默认把宿主给的预览地址放进 iframe。
		*
		* <p>地址由宿主提供（如 FileStorageServerFilter 的 {@code ?preview=true} 票据通道）；
		* 宿主也可以直接用 `#preview` 插槽接管内容（例如换成带完整渲染器的预览面板），
		* 插槽存在时 iframe 只是兜底。</p>
		*/
		const props = __props;
		const emit = __emit;
		const visible = computed({
			get: () => props.modelValue,
			set: (value) => emit("update:modelValue", value)
		});
		const title = computed(() => props.item ? `预览 · ${props.item.name}` : "预览");
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_dialog = resolveComponent("el-dialog");
			return __props.modelValue ? (openBlock(), createBlock(_component_el_dialog, {
				key: 0,
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => visible.value = $event),
				title: title.value,
				width: "min(1080px, 94vw)",
				top: "6vh",
				"append-to-body": "",
				"destroy-on-close": "",
				class: "rfp-preview"
			}, {
				footer: withCtx(() => [createBaseVNode("div", _hoisted_6$1, [__props.src ? (openBlock(), createElementBlock("a", {
					key: 0,
					class: "rfp-preview__open",
					href: __props.src,
					target: "_blank",
					rel: "noopener noreferrer"
				}, [_cache[2] || (_cache[2] = createTextVNode(" 在新窗口打开 ", -1)), createVNode(_component_el_icon, { size: 12 }, {
					default: withCtx(() => [createVNode(unref(top_right_default))]),
					_: 1
				})], 8, _hoisted_7$1)) : createCommentVNode("", true), createVNode(_component_el_button, { onClick: _cache[0] || (_cache[0] = ($event) => visible.value = false) }, {
					default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("关闭", -1)])]),
					_: 1
				})])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_1$1, [renderSlot(_ctx.$slots, "default", {
					item: __props.item,
					src: __props.src,
					error: __props.error,
					loading: __props.loading,
					close: () => visible.value = false
				}, () => [__props.loading ? (openBlock(), createElementBlock("div", _hoisted_2$1, "预览地址解析中…")) : __props.error ? (openBlock(), createElementBlock("div", _hoisted_3$1, [createVNode(_component_el_icon, { size: 20 }, {
					default: withCtx(() => [createVNode(unref(warning_filled_default))]),
					_: 1
				}), createBaseVNode("span", null, toDisplayString(__props.error), 1)])) : __props.src ? (openBlock(), createElementBlock("iframe", {
					key: 2,
					class: "rfp-preview__frame",
					src: __props.src,
					title: title.value,
					referrerpolicy: "no-referrer"
				}, null, 8, _hoisted_4$1)) : (openBlock(), createElementBlock("div", _hoisted_5$1, "该文件没有可用的预览通道"))], true)])]),
				_: 3
			}, 8, ["modelValue", "title"])) : createCommentVNode("", true);
		};
	}
}), [["__scopeId", "data-v-6577216c"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "rfp__body" };
var _hoisted_2 = { class: "rfp__selected" };
var _hoisted_3 = { class: "rfp__status-count" };
var _hoisted_4 = ["title"];
var _hoisted_5 = {
	key: 1,
	class: "rfp__status-hint",
	role: "status"
};
var _hoisted_6 = {
	class: "rfp__views",
	role: "group",
	"aria-label": "查看方式"
};
var _hoisted_7 = [
	"data-view",
	"title",
	"aria-label",
	"aria-pressed",
	"onClick"
];
var _hoisted_8 = { class: "rfp__footer" };
var NAME_MESSAGE = "名称不能为空，且不能包含 \\ / : * ? \" < > |";
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/index.vue
var ReFilePicker_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		modelValue: { type: Boolean },
		title: { default: "选择文件" },
		loader: {},
		data: {},
		multiple: {
			type: Boolean,
			default: false
		},
		limit: { default: 0 },
		accept: { default: "" },
		initialPath: { default: "/" },
		directoryMode: {
			type: Boolean,
			default: false
		},
		contextMenu: {
			type: [Boolean, Object],
			default: true
		},
		previewUrl: {
			type: Function,
			default: void 0
		},
		createDir: {
			type: Function,
			default: void 0
		},
		renameItem: {
			type: Function,
			default: void 0
		},
		removeItems: {
			type: Function,
			default: void 0
		},
		uploadFiles: {
			type: Function,
			default: void 0
		},
		downloadItems: {
			type: Function,
			default: void 0
		}
	},
	emits: [
		"update:modelValue",
		"select",
		"cancel",
		"preview"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReFilePicker —— 文件 / 目录选择器。
		*
		* <p>交互与外观对齐 Windows 资源管理器的文件对话框：顶栏（后退 / 刷新 /
		* 地址栏 / 搜索）、左侧导航窗格、右侧「详细信息」列表（名称 / 修改时间 /
		* 类型 / 大小，可点表头排序）、底部状态栏，以及键盘上下选行 + 回车打开。</p>
		*
		* <p>数据来源二选一：`loader`（宿主远端接口，返回 FilePickerItem[]）或
		* `data`（本地 JSON）。逻辑在 {@link useFilePicker}，纯函数在 utils.ts，
		* 视图拆成 toolbar / sidebar / list 三个子组件。</p>
		*/
		const props = __props;
		const emit = __emit;
		const slots = useSlots();
		const dialogVisible = computed({
			get: () => props.modelValue,
			set: (val) => {
				if (!val) emit("cancel");
				emit("update:modelValue", val);
			}
		});
		const dialogTitle = computed(() => props.title);
		const isDirectoryMode = computed(() => props.directoryMode);
		const columns = FILE_PICKER_COLUMNS;
		/** 视图模式：默认详细列表，可切到大/中/小图标（参考 pages/filesystem 的状态栏切换） */
		const viewMode = ref("details");
		const viewModeOptions = [
			{
				key: "details",
				label: "详细信息",
				icon: list_default
			},
			{
				key: "largeIcons",
				label: "大图标",
				icon: grid_default
			},
			{
				key: "mediumIcons",
				label: "中图标",
				icon: menu_default
			},
			{
				key: "smallIcons",
				label: "小图标",
				icon: tickets_default
			}
		];
		const rootRef = ref(null);
		const { currentPath, loading, loadError, searchText, selectedItems, history, sortKey, sortAsc, activeIndex, breadcrumb, treeNodes, treeDirs, parentEntry, rows, searching, canConfirm, selectedSummary, selectedCount, limit, limitHint, canSelect, isLimitReached, load, refresh, reset, navigateTo, goBack, selectItem, selectOnly, openItem, clearSelection, toggleSort, toggleSelect, isSelected, isParentEntry, moveActive, activateActive, takeSelection } = useFilePicker({
			loader: () => props.loader,
			data: () => props.data,
			accept: () => props.accept,
			initialPath: () => props.initialPath,
			directoryMode: () => props.directoryMode,
			multiple: () => props.multiple,
			limit: () => props.limit
		});
		/**
		* 行单击：记录键盘高亮位，再按模式选中（Ctrl/⌘ 加减选、Shift 连选，见 selectItem）。
		*
		* <p>双击的第二颗 click 不再改选：浏览器按 click → click → dblclick 派发，
		* 第二颗若在新列表上命中另一行，会把选择 / 高亮带偏；目录进入统一交给 dblclick。</p>
		*/
		const onActivate = (item, index, event) => {
			if (event && event.detail > 1) return;
			activeIndex.value = index;
			selectItem(item, event);
		};
		/** 行双击 / 回车：目录进入；单选文件即确认；多选文件且有预览通道时打开预览 */
		const onOpen = (item) => {
			if (openItem(item)) {
				handleConfirm();
				return;
			}
			if (!item.isDir && hasPreview.value) openPreview(item);
		};
		const handleConfirm = () => {
			if (!canConfirm.value) return;
			emit("select", takeSelection());
			emit("update:modelValue", false);
		};
		/**
		* 菜单项默认开关。
		*
		* <p>默认只开「刷新 / 属性」（不动真实文件）；新建文件夹、重命名、删除、上传、
		* 下载要落盘，默认关，由宿主显式打开并且必须同时给对应回调。</p>
		*/
		const DEFAULT_MENU_ACTIONS = {
			refresh: true,
			properties: true,
			preview: true,
			newFolder: false,
			rename: false,
			remove: false,
			upload: false,
			download: false
		};
		const menuVisible = ref(false);
		const menuX = ref(0);
		const menuY = ref(0);
		/** 右键目标条目；null = 当前目录空白处（作用于当前目录） */
		const menuItem = ref(null);
		const propsVisible = ref(false);
		const previewVisible = ref(false);
		const previewItem = ref(null);
		const previewSrc = ref("");
		const previewLoading = ref(false);
		const previewError = ref("");
		const menuEnabled = computed(() => props.contextMenu !== false);
		/** 开关：默认值 + 宿主覆盖（非布尔值忽略） */
		const menuActions = computed(() => {
			const raw = props.contextMenu;
			const overrides = raw && typeof raw === "object" ? raw : {};
			const next = { ...DEFAULT_MENU_ACTIONS };
			Object.keys(overrides).forEach((key) => {
				const value = overrides[key];
				if (typeof value === "boolean") next[key] = value;
			});
			return next;
		});
		/** 预览通道：地址构造器或 `#preview` 插槽任一存在即可用 */
		const hasPreview = computed(() => !!props.previewUrl || !!slots.preview);
		/**
		* 按目标拼菜单项：开关打开 <b>且</b> 宿主给了对应回调（或组件自带实现）才出现，
		* 免得菜单里挂一堆点了没反应的项。
		*/
		const buildMenuItems = (target) => {
			const actions = menuActions.value;
			const dirTarget = !target || target.isDir;
			const list = [];
			let lastGroup = -1;
			const push = (group, entry) => {
				list.push({
					...entry,
					divided: group > lastGroup && lastGroup >= 0
				});
				lastGroup = group;
			};
			if (actions.refresh) push(0, {
				key: "refresh",
				label: "刷新",
				icon: refresh_default
			});
			if (actions.preview && target && !target.isDir && hasPreview.value) push(0, {
				key: "preview",
				label: "预览",
				icon: view_default
			});
			if (actions.properties) push(0, {
				key: "properties",
				label: "属性",
				icon: info_filled_default
			});
			if (actions.newFolder && dirTarget && props.createDir) push(1, {
				key: "newFolder",
				label: "新建文件夹",
				icon: folder_add_default
			});
			if (actions.upload && dirTarget && props.uploadFiles) push(1, {
				key: "upload",
				label: "上传文件",
				icon: upload_default
			});
			if (actions.rename && target && props.renameItem) push(2, {
				key: "rename",
				label: "重命名",
				icon: edit_pen_default
			});
			if (actions.remove && target && props.removeItems) push(2, {
				key: "remove",
				label: "删除",
				icon: delete_default
			});
			if (actions.download && target && !target.isDir && props.downloadItems) push(2, {
				key: "download",
				label: "下载",
				icon: download_default
			});
			return list;
		};
		const menuItems = computed(() => buildMenuItems(menuItem.value));
		/**
		* 右键：只在菜单确实有项时才接管原生菜单。
		*
		* <p>落在条目行上时同时改选该行（资源管理器语义）；多选下右键已选中项保留整批选择，
		* 于是删除/下载天然作用于整批。空白处右键 = 以当前目录为对象。</p>
		*/
		const onContextMenu = (event) => {
			if (!menuEnabled.value) return;
			const rowEl = event.target?.closest(".re-file-picker__item");
			const index = rowEl ? Number(rowEl.dataset.rowIndex ?? -1) : -1;
			const hovered = index >= 0 ? rows.value[index] ?? null : null;
			const target = hovered && !isParentEntry(hovered) ? hovered : null;
			if (!buildMenuItems(target).length) return;
			event.preventDefault();
			if (target) {
				activeIndex.value = index;
				if (!isSelected(target)) if (event.ctrlKey || event.metaKey) toggleSelect(target);
				else selectOnly(target);
			}
			menuItem.value = target;
			menuX.value = event.clientX;
			menuY.value = event.clientY;
			menuVisible.value = true;
		};
		/** 宿主文件操作：失败提示原文，成功后刷新当前目录 */
		const runFileTask = async (task, reload = true) => {
			try {
				await task();
			} catch (err) {
				ElMessage.error(err instanceof Error ? err.message : String(err));
				return;
			}
			if (reload) await refresh();
		};
		/** 非法文件名字符（Windows 口径，与后端落盘规则一致） */
		const NAME_PATTERN = /^(?!\s*$)[^\\/:*?"<>|]+$/;
		const askText = async (title, message, value = "") => {
			try {
				const result = await ElMessageBox.prompt(message, title, {
					confirmButtonText: "确定",
					cancelButtonText: "取消",
					inputValue: value,
					inputPattern: NAME_PATTERN,
					inputErrorMessage: NAME_MESSAGE,
					autofocus: true
				});
				return String(result?.value ?? "").trim();
			} catch {
				return null;
			}
		};
		/** 操作对象：右键项已在多选里就作用整批，否则只作用它自己 */
		const targetsOf = (item) => isSelected(item) && selectedItems.value.length > 1 ? [...selectedItems.value] : [item];
		/** 目录级操作的落点：右键目录 = 那个目录，其余 = 当前目录 */
		const dirTargetOf = () => menuItem.value?.isDir ? menuItem.value.key : currentPath.value;
		const onNewFolder = async () => {
			const create = props.createDir;
			if (!create) return;
			const name = await askText("新建文件夹", "请输入文件夹名称");
			if (!name) return;
			const dir = dirTargetOf();
			await runFileTask(() => create(dir, name));
		};
		const onRename = async (item) => {
			const rename = props.renameItem;
			if (!rename) return;
			const name = await askText("重命名", "请输入新名称", item.name);
			if (!name || name === item.name) return;
			await runFileTask(() => rename(item, name));
		};
		const onRemove = async (item) => {
			const remove = props.removeItems;
			if (!remove) return;
			const targets = targetsOf(item);
			try {
				await ElMessageBox.confirm(targets.length > 1 ? `确定删除选中的 ${targets.length} 个条目？` : `确定删除「${item.name}」？`, "删除确认", {
					type: "warning",
					confirmButtonText: "删除",
					cancelButtonText: "取消",
					confirmButtonClass: "el-button--danger"
				});
			} catch {
				return;
			}
			await runFileTask(() => remove(targets));
		};
		/**
		* 上传：临时建一个 input[type=file]（原生选择框无法用页面元素替代）。
		*
		* <p>只在点了菜单项的那一刻出现、选完/取消即移除 —— 页面上不留常驻可点元素，
		* 也不会被界面普查（clickable census）当成未分类控件。</p>
		*/
		const onUpload = () => {
			const upload = props.uploadFiles;
			if (!upload) return;
			const dir = dirTargetOf();
			const input = document.createElement("input");
			input.type = "file";
			input.multiple = true;
			const native = toNativeAccept(props.accept);
			if (native) input.accept = native;
			input.style.display = "none";
			input.onchange = () => {
				const files = Array.from(input.files ?? []);
				input.remove();
				if (files.length) runFileTask(() => upload(dir, files));
			};
			input.oncancel = () => input.remove();
			document.body.appendChild(input);
			input.click();
		};
		/** 预览：地址来自宿主（如 FileStorageServerFilter 的 ?preview=true 票据通道） */
		const openPreview = async (item) => {
			previewItem.value = item;
			previewSrc.value = "";
			previewError.value = "";
			previewLoading.value = !!props.previewUrl;
			previewVisible.value = true;
			emit("preview", item);
			const buildUrl = props.previewUrl;
			if (!buildUrl) return;
			try {
				const url = await buildUrl(item);
				previewSrc.value = typeof url === "string" ? url : "";
				if (!previewSrc.value && !slots.preview) previewError.value = "没有可用的预览地址";
			} catch (err) {
				previewError.value = err instanceof Error ? err.message : String(err);
			} finally {
				previewLoading.value = false;
			}
		};
		const onMenuSelect = (key) => {
			const item = menuItem.value;
			switch (key) {
				case "refresh":
					refresh();
					return;
				case "properties":
					propsVisible.value = true;
					return;
				case "preview":
					if (item) openPreview(item);
					return;
				case "newFolder":
					onNewFolder();
					return;
				case "upload":
					onUpload();
					return;
				case "rename":
					if (item) onRename(item);
					return;
				case "remove":
					if (item) onRemove(item);
					return;
				case "download": {
					const download = props.downloadItems;
					if (item && download) runFileTask(() => download(targetsOf(item)), false);
					return;
				}
			}
		};
		/**
		* 键盘：↑/↓ 移动高亮行（列表会随之聚焦该行），回车打开、退格返回上一级。
		*
		* <p>回车必须在这里统一处理：行按钮上的原生回车会触发 click，而单击目录在
		* FILE 模式下「不进入」是刻意约定，键盘用户就永远进不去目录。所以对行按钮
		* 先 preventDefault 掐掉原生 click，再按「回车 = 双击」重建语义：目录进入、
		* 文件选中（单选直接确认）。</p>
		*/
		const onKeydown = (event) => {
			const target = event.target;
			const inField = !!target?.closest("input, textarea, [contenteditable='true']");
			if (event.key === "ArrowDown") {
				event.preventDefault();
				moveActive(1);
				return;
			}
			if (event.key === "ArrowUp") {
				event.preventDefault();
				moveActive(-1);
				return;
			}
			if (inField) return;
			if (event.key === "Enter") {
				const rowEl = target?.closest(".re-file-picker__item");
				if (rowEl) {
					event.preventDefault();
					const index = Number(rowEl.dataset.rowIndex ?? -1);
					const item = rows.value[index];
					if (!item) return;
					if (item.isDir) onOpen(item);
					else {
						onActivate(item, index);
						if (!props.multiple) handleConfirm();
					}
					return;
				}
				if (target?.closest("button, a")) return;
				event.preventDefault();
				if (activateActive()) handleConfirm();
				return;
			}
			if (event.key === "Backspace") {
				event.preventDefault();
				goBack();
			}
		};
		watch(() => props.modelValue, async (visible) => {
			if (!visible) return;
			await reset(props.initialPath);
			activeIndex.value = -1;
			await nextTick();
			rootRef.value?.focus();
		}, { immediate: true });
		watch(() => props.data, () => {
			if (props.modelValue) load();
		}, { deep: true });
		watch(() => props.initialPath, (path) => {
			if (props.modelValue) reset(path);
		});
		return (_ctx, _cache) => {
			const _component_el_button = resolveComponent("el-button");
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createBlock(unref(component), {
				modelValue: dialogVisible.value,
				"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => dialogVisible.value = $event),
				title: dialogTitle.value,
				width: "min(1080px, 96vw)",
				"close-on-click-modal": false,
				"append-to-body": "",
				"destroy-on-close": "",
				class: "re-file-picker"
			}, {
				footer: withCtx(() => [createBaseVNode("div", _hoisted_8, [createVNode(_component_el_button, { onClick: _cache[4] || (_cache[4] = ($event) => dialogVisible.value = false) }, {
					default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(_component_el_button, {
					type: "primary",
					disabled: !unref(canConfirm),
					onClick: handleConfirm
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(isDirectoryMode.value ? "选择该目录" : "确认选择"), 1)]),
					_: 1
				}, 8, ["disabled"])])]),
				default: withCtx(() => [
					createBaseVNode("div", {
						ref_key: "rootRef",
						ref: rootRef,
						class: "rfp",
						tabindex: "-1",
						onKeydown,
						onContextmenu: onContextMenu
					}, [
						createVNode(FilePickerToolbar_default, {
							modelValue: unref(searchText),
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => isRef(searchText) ? searchText.value = $event : null),
							breadcrumb: unref(breadcrumb),
							loading: unref(loading),
							"can-back": unref(history).length > 0,
							onBack: unref(goBack),
							onRefresh: unref(refresh),
							onNavigate: unref(navigateTo)
						}, null, 8, [
							"modelValue",
							"breadcrumb",
							"loading",
							"can-back",
							"onBack",
							"onRefresh",
							"onNavigate"
						]),
						createBaseVNode("div", _hoisted_1, [createVNode(FilePickerSidebar_default, {
							nodes: unref(treeNodes),
							dirs: unref(treeDirs),
							"current-path": unref(currentPath),
							onNavigate: unref(navigateTo)
						}, null, 8, [
							"nodes",
							"dirs",
							"current-path",
							"onNavigate"
						]), createVNode(FilePickerList_default, {
							rows: unref(rows),
							columns: unref(columns),
							"parent-entry": unref(parentEntry),
							loading: unref(loading),
							"load-error": unref(loadError),
							searching: unref(searching),
							"sort-key": unref(sortKey),
							"sort-asc": unref(sortAsc),
							"active-index": unref(activeIndex),
							"is-selected": unref(isSelected),
							"can-select": unref(canSelect),
							"view-mode": viewMode.value,
							onSort: unref(toggleSort),
							onActivate,
							onOpen,
							onNavigate: unref(navigateTo)
						}, createSlots({ _: 2 }, [_ctx.$slots.empty ? {
							name: "empty",
							fn: withCtx(() => [renderSlot(_ctx.$slots, "empty", {}, void 0, true)]),
							key: "0"
						} : void 0]), 1032, [
							"rows",
							"columns",
							"parent-entry",
							"loading",
							"load-error",
							"searching",
							"sort-key",
							"sort-asc",
							"active-index",
							"is-selected",
							"can-select",
							"view-mode",
							"onSort",
							"onNavigate"
						])]),
						createBaseVNode("div", _hoisted_2, [
							createBaseVNode("span", _hoisted_3, toDisplayString(unref(rows).length) + " 个项目", 1),
							_cache[7] || (_cache[7] = createBaseVNode("span", { class: "rfp__selected-label" }, "当前选择", -1)),
							createBaseVNode("span", {
								class: "rfp__selected-value",
								title: unref(selectedSummary)
							}, toDisplayString(unref(selectedSummary)), 9, _hoisted_4),
							unref(limit) > 0 ? (openBlock(), createElementBlock("span", {
								key: 0,
								class: normalizeClass(["rfp__status-limit", { "is-full": unref(isLimitReached) }])
							}, toDisplayString(unref(selectedCount)) + " / " + toDisplayString(unref(limit)), 3)) : createCommentVNode("", true),
							unref(limitHint) ? (openBlock(), createElementBlock("span", _hoisted_5, toDisplayString(unref(limitHint)), 1)) : createCommentVNode("", true),
							unref(selectedItems).length ? (openBlock(), createBlock(_component_el_button, {
								key: 2,
								size: "small",
								text: "",
								type: "primary",
								onClick: unref(clearSelection)
							}, {
								default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode(" 清除 ", -1)])]),
								_: 1
							}, 8, ["onClick"])) : createCommentVNode("", true),
							createBaseVNode("div", _hoisted_6, [(openBlock(), createElementBlock(Fragment, null, renderList(viewModeOptions, (mode) => {
								return createBaseVNode("button", {
									key: mode.key,
									type: "button",
									class: normalizeClass(["rfp-view-btn", { "is-active": viewMode.value === mode.key }]),
									"data-view": mode.key,
									title: mode.label,
									"aria-label": mode.label,
									"aria-pressed": viewMode.value === mode.key,
									onClick: ($event) => viewMode.value = mode.key
								}, [createVNode(_component_el_icon, { size: 15 }, {
									default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(mode.icon)))]),
									_: 2
								}, 1024)], 10, _hoisted_7);
							}), 64))])
						])
					], 544),
					createVNode(FilePickerContextMenu_default, {
						visible: menuVisible.value,
						"onUpdate:visible": _cache[1] || (_cache[1] = ($event) => menuVisible.value = $event),
						items: menuItems.value,
						x: menuX.value,
						y: menuY.value,
						onSelect: onMenuSelect
					}, null, 8, [
						"visible",
						"items",
						"x",
						"y"
					]),
					createVNode(FilePickerPropertiesDialog_default, {
						modelValue: propsVisible.value,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => propsVisible.value = $event),
						item: menuItem.value,
						path: unref(currentPath)
					}, null, 8, [
						"modelValue",
						"item",
						"path"
					]),
					createVNode(FilePickerPreviewDialog_default, {
						modelValue: previewVisible.value,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => previewVisible.value = $event),
						item: previewItem.value,
						src: previewSrc.value,
						loading: previewLoading.value,
						error: previewError.value
					}, createSlots({ _: 2 }, [_ctx.$slots.preview ? {
						name: "default",
						fn: withCtx((previewSlotProps) => [renderSlot(_ctx.$slots, "preview", normalizeProps(guardReactiveProps(previewSlotProps)), void 0, true)]),
						key: "0"
					} : void 0]), 1032, [
						"modelValue",
						"item",
						"src",
						"loading",
						"error"
					])
				]),
				_: 3
			}, 8, ["modelValue", "title"]);
		};
	}
}), [["__scopeId", "data-v-ed953033"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/index.ts
var plugin = { install(app) {
	app.component("ReFilePicker", ReFilePicker_default$1);
} };
var ReFilePicker_default = ReFilePicker_default$1;
//#endregion
export { matchesAccept as C, samePath as D, pathSegments as E, separatorOf as O, joinPath as S, parentPathOf as T, isAudio as _, acceptHasDir as a, isRootPath as b, buildAcceptFilter as c, driveRootPath as d, extensionOf as f, formatTime as g, formatSize as h, FILE_PICKER_COLUMNS as i, toNativeAccept as k, compareItems as l, fileTypeText as m, plugin as n, acceptTokens as o, fileKindOf as p, useFilePicker as r, breadcrumbOf as s, ReFilePicker_default as t, dedupeItems as u, isImage as v, normalizePath as w, isVideo as x, isPdf as y };
