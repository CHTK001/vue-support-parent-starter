import { Kn as ref, U as computed, jt as onBeforeUnmount } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import ReFilePicker from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReFilePicker/index.vue";
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
	* 一次双击只允许触发一次「进入目录」，时间窗内对<b>同一目标</b>的后续 open 直接丢弃。
	* 只按时间不看目标会把「先双击 A、再很快双击 B」里的 B 误伤，所以还要比对路径。</p>
	*/
	let lastDirOpenAt = 0;
	let lastDirOpenKey = "";
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
	/**
	* 对任意条目列表套用 accept 过滤 + 搜索 + 排序。
	*
	* <p>从 {@code rows} 抽出来，供 macOS 式分栏视图逐列复用：每一列的原始数据
	* 走同一个过滤/排序口径，搜索词变化时各列一起收窄。</p>
	*/
	const prepareItems = (list) => {
		const acceptFilter = buildAcceptFilter(options.accept());
		let out = list.filter((item) => acceptFilter(item));
		const q = searchText.value.trim().toLowerCase();
		if (q) out = out.filter((item) => item.name.toLowerCase().includes(q));
		return [...out].sort((a, b) => compareItems(a, b, sortKey.value, sortAsc.value));
	};
	/** 过滤后的行（不含「..」/上级目录、按 accept + 搜索词筛） */
	const rows = computed(() => prepareItems(items.value.filter((item) => !isParentEntry(item))));
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
			if (samePath(item.key, lastDirOpenKey) && now - lastDirOpenAt < DIR_OPEN_GUARD_MS) return false;
			lastDirOpenAt = now;
			lastDirOpenKey = item.key;
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
		fetchItems,
		prepareItems,
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
		activateActive,
		takeSelection
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReFilePicker/index.ts
var plugin = { install(app) {
	app.component("ReFilePicker", ReFilePicker);
} };
var ReFilePicker_default = ReFilePicker;
//#endregion
export { FILE_PICKER_COLUMNS, acceptHasDir, acceptTokens, breadcrumbOf, buildAcceptFilter, compareItems, dedupeItems, ReFilePicker_default as default, driveRootPath, extensionOf, fileKindOf, fileTypeText, formatSize, formatTime, plugin as install, isAudio, isImage, isPdf, isRootPath, isVideo, joinPath, matchesAccept, normalizePath, parentPathOf, pathSegments, samePath, separatorOf, toNativeAccept, useFilePicker };
