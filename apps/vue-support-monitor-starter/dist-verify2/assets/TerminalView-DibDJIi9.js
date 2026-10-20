import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElSkeleton } from "./skeleton-BaqFbYYr.js";
import { n as ElDropdownItem, r as ElDropdownMenu, t as ElDropdown } from "./dropdown-C0jOPTGL.js";
import { t as vLoading } from "./directive-BSbh65vI.js";
import { yt as message } from "./src-CEonioA3.js";
import { a as useRouter, i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { B as sftpDownloadUrl, G as sftpUpload, H as sftpMkdir, K as sftpWriteContent, U as sftpReadContent, V as sftpList, W as sftpRename, i as delBookmark, k as queryHosts, m as getBookmarks, r as createBookmark, v as getHost, z as sftpDelete } from "./api-CRz4q4qT.js";
import { t as osIconSvg } from "./osIcon-CfmjFf8B.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { n as ScSshDirectViewer_default, r as ScGuacViewer_default, t as ScVncDirectViewer_default } from "./ScVncDirectViewer-iBrbl4VU.js";
import { t as component } from "./ReDrawer-DD0yjZVq.js";
import { t as ReScrollbar_default } from "./ReScrollbar-BMqW3Lby.js";
//#region ../../pages/server/src/components/ScSftpPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "toolbar" };
var _hoisted_2$1 = { class: "upload-btn" };
var _hoisted_3$1 = {
	key: 0,
	class: "bookmarks"
};
var _hoisted_4$1 = { class: "sftp-table-wrap" };
//#endregion
//#region ../../pages/server/src/components/ScSftpPanel.vue
var ScSftpPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScSftpPanel",
	props: { hostId: {} },
	setup(__props) {
		const props = __props;
		/** 文件条目 */
		const currentPath = ref("/");
		/** 条目列表与加载态 */
		const entries = ref([]);
		const loading = ref(false);
		/** 编辑器状态 */
		const editorVisible = ref(false);
		const editorPath = ref("");
		const editorContent = ref("");
		const editorTruncated = ref(false);
		const editorSaving = ref(false);
		/** 书签列表 */
		const bookmarks = ref([]);
		watch(() => props.hostId, (id) => {
			if (id) {
				loadBookmarks();
				go("/");
			} else entries.value = [];
		});
		onMounted(() => {
			if (props.hostId) {
				loadBookmarks();
				go("/");
			}
		});
		/**
		* 加载目录内容
		*
		* @param path 目标路径，空则刷新当前目录
		*/
		async function go(path) {
			if (!props.hostId) return;
			const target = path ?? currentPath.value;
			loading.value = true;
			try {
				const list = await sftpList(props.hostId, target || "/");
				entries.value = [...list].sort((a, b) => {
					if (!!a.directory !== !!b.directory) return a.directory ? -1 : 1;
					return String(a.name).localeCompare(String(b.name));
				});
				currentPath.value = target || "/";
			} catch (e) {
				message.error(e.message);
			} finally {
				loading.value = false;
			}
		}
		/**
		* 进入子目录（文件则打开编辑器）
		*
		* @param entry 文件条目
		*/
		function enter(entry) {
			const fullPath = `${currentPath.value.endsWith("/") ? currentPath.value : `${currentPath.value}/`}${entry.name}`;
			if (entry.directory) go(fullPath);
			else openEditor(fullPath);
		}
		/**
		* 返回上级目录
		*/
		async function up() {
			if (currentPath.value === "/") return;
			await go(currentPath.value.replace(/\/[^/]+\/?$/, "") || "/");
		}
		/**
		* 打开文本编辑器
		*
		* @param path 文件路径
		*/
		async function openEditor(path) {
			if (!props.hostId) return;
			try {
				const result = await sftpReadContent(props.hostId, path);
				editorPath.value = path;
				editorContent.value = result.content ?? "";
				editorTruncated.value = !!result.truncated;
				editorVisible.value = true;
			} catch (e) {
				message.error(e.message);
			}
		}
		/**
		* 保存编辑器内容
		*/
		async function saveEditor() {
			if (!props.hostId) return;
			editorSaving.value = true;
			try {
				await sftpWriteContent(props.hostId, editorPath.value, editorContent.value);
				message.success("保存成功");
				editorVisible.value = false;
			} catch (e) {
				message.error(e.message);
			} finally {
				editorSaving.value = false;
			}
		}
		/**
		* 创建目录
		*/
		async function onMkdir() {
			if (!props.hostId) return;
			const { value } = await message.prompt("新目录名", "创建目录", "确定", "取消", "info", { inputValue: "newdir" });
			const base = currentPath.value.endsWith("/") ? currentPath.value : `${currentPath.value}/`;
			await sftpMkdir(props.hostId, `${base}${value}`);
			message.success("已创建");
			go();
		}
		/**
		* 删除条目
		*
		* @param entry 文件条目
		*/
		async function onDelete(entry) {
			if (!props.hostId) return;
			const base = currentPath.value.endsWith("/") ? currentPath.value : `${currentPath.value}/`;
			await message.confirm(`确认删除 ${entry.name}?`, "删除");
			await sftpDelete(props.hostId, `${base}${entry.name}`, !!entry.directory);
			message.success("已删除");
			go();
		}
		/**
		* 重命名/移动
		*
		* @param entry 文件条目
		*/
		async function onRename(entry) {
			if (!props.hostId) return;
			const base = currentPath.value.endsWith("/") ? currentPath.value : `${currentPath.value}/`;
			const { value } = await message.prompt("新名称", "重命名", "确定", "取消", "info", { inputValue: entry.name });
			await sftpRename(props.hostId, `${base}${entry.name}`, `${base}${value}`);
			message.success("已完成");
			go();
		}
		/**
		* 触发浏览器下载
		*
		* @param entry 文件条目
		*/
		function download(entry) {
			if (!props.hostId) return;
			const base = currentPath.value.endsWith("/") ? currentPath.value : `${currentPath.value}/`;
			window.open(sftpDownloadUrl(props.hostId, `${base}${entry.name}`), "_blank");
		}
		/**
		* 上传选中文件到当前目录
		*
		* @param event input change 事件
		*/
		async function onUpload(event) {
			if (!props.hostId) return;
			const input = event.target;
			const file = input.files?.[0];
			if (!file) return;
			try {
				await sftpUpload(props.hostId, currentPath.value, file);
				message.success("上传成功");
				go();
			} catch (e) {
				message.error(`上传失败: ${e.message}`);
			}
			input.value = "";
		}
		/**
		* 加载书签列表
		*/
		async function loadBookmarks() {
			if (!props.hostId) return;
			try {
				bookmarks.value = await getBookmarks(props.hostId);
			} catch {
				bookmarks.value = [];
			}
		}
		/**
		* 拼接当前目录与文件名为完整路径
		*
		* @param name 文件名
		*/
		function joint(name) {
			return `${currentPath.value?.endsWith("/") ? currentPath.value : `${currentPath.value}/`}${name}`;
		}
		/**
		* 人性化字节数展示
		*
		* @param bytes 字节数
		*/
		function formatSize(bytes) {
			if (bytes == null) return "-";
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / 1048576).toFixed(1)} MB`;
		}
		/**
		* 收藏当前目录
		*/
		async function addBookmark() {
			if (!props.hostId) return;
			await createBookmark({
				msTerminalBookmarkHostId: props.hostId,
				msTerminalBookmarkName: currentPath.value,
				msTerminalBookmarkPath: currentPath.value
			});
			loadBookmarks();
		}
		/**
		* 删除书签
		*
		* @param id 书签 ID
		*/
		async function removeBookmark(id) {
			await delBookmark(id);
			loadBookmarks();
		}
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReLink = resolveComponent("ReLink");
			const _component_ReTableColumn = resolveComponent("ReTableColumn");
			const _component_ReTable = resolveComponent("ReTable");
			const _component_ReAlert = resolveComponent("ReAlert");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["sftp-panel", { disabled: !__props.hostId }]) }, [
				createBaseVNode("div", _hoisted_1$1, [
					createVNode(_component_ReButton, {
						onClick: up,
						disabled: currentPath.value === "/"
					}, {
						default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("上级", -1)])]),
						_: 1
					}, 8, ["disabled"]),
					createVNode(_component_ReInput, {
						modelValue: currentPath.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => currentPath.value = $event),
						style: { "width": "380px" },
						onKeyup: _cache[1] || (_cache[1] = withKeys(($event) => go(), ["enter"])),
						placeholder: "远程路径"
					}, null, 8, ["modelValue"]),
					createVNode(_component_ReButton, {
						type: "primary",
						onClick: _cache[2] || (_cache[2] = ($event) => go())
					}, {
						default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("刷新", -1)])]),
						_: 1
					}),
					createVNode(_component_ReButton, { onClick: onMkdir }, {
						default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("新建目录", -1)])]),
						_: 1
					}),
					createVNode(_component_ReButton, { onClick: addBookmark }, {
						default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("收藏路径", -1)])]),
						_: 1
					}),
					createBaseVNode("label", _hoisted_2$1, [createBaseVNode("input", {
						type: "file",
						hidden: "",
						onChange: onUpload
					}, null, 32), createVNode(_component_ReButton, { tag: "span" }, {
						default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("上传到此目录", -1)])]),
						_: 1
					})])
				]),
				bookmarks.value.length ? (openBlock(), createElementBlock("div", _hoisted_3$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(bookmarks.value, (bookmark) => {
					return openBlock(), createBlock(_component_ReTag, {
						key: bookmark.id,
						closable: "",
						class: "bookmark-tag",
						onClick: ($event) => go(bookmark.msTerminalBookmarkPath),
						onClose: ($event) => removeBookmark(bookmark.id)
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(bookmark.msTerminalBookmarkName), 1)]),
						_: 2
					}, 1032, ["onClick", "onClose"]);
				}), 128))])) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_4$1, [loading.value && !entries.value.length ? (openBlock(), createBlock(unref(ElSkeleton), {
					key: 0,
					rows: 9,
					animated: "",
					class: "sftp-skeleton"
				})) : withDirectives((openBlock(), createBlock(_component_ReTable, {
					key: 1,
					"element-loading-text": "正在读取远程目录…",
					data: entries.value,
					border: "",
					pagination: false,
					toolbar: false,
					"empty-text": "当前目录为空",
					"layout-table": {
						minHeight: 0,
						height: "calc(100vh - 320px)"
					}
				}, {
					default: withCtx(() => [
						createVNode(_component_ReTableColumn, {
							label: "名称",
							"min-width": "240"
						}, {
							default: withCtx(({ row }) => [createVNode(_component_ReLink, {
								type: "primary",
								underline: false,
								onClick: ($event) => enter(row)
							}, {
								default: withCtx(() => [createVNode(_component_ReIcon, {
									style: { "margin-right": "4px" },
									name: row.directory ? "Folder" : "Document"
								}, null, 8, ["name"]), createTextVNode(" " + toDisplayString(row.name), 1)]),
								_: 2
							}, 1032, ["onClick"])]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "类型",
							width: "90"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.directory ? "目录" : "文件"), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "大小",
							width: "110"
						}, {
							default: withCtx(({ row }) => [createTextVNode(toDisplayString(row.directory ? "-" : formatSize(row.size)), 1)]),
							_: 1
						}),
						createVNode(_component_ReTableColumn, {
							label: "操作",
							width: "200"
						}, {
							default: withCtx(({ row }) => [
								!row.directory ? (openBlock(), createBlock(_component_ReButton, {
									key: 0,
									link: "",
									onClick: ($event) => openEditor(joint(row.name))
								}, {
									default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("编辑", -1)])]),
									_: 1
								}, 8, ["onClick"])) : createCommentVNode("", true),
								!row.directory ? (openBlock(), createBlock(_component_ReButton, {
									key: 1,
									link: "",
									onClick: ($event) => download(row)
								}, {
									default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("下载", -1)])]),
									_: 1
								}, 8, ["onClick"])) : createCommentVNode("", true),
								createVNode(_component_ReButton, {
									link: "",
									onClick: ($event) => onRename(row)
								}, {
									default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("改名", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(_component_ReButton, {
									link: "",
									type: "danger",
									onClick: ($event) => onDelete(row)
								}, {
									default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("删除", -1)])]),
									_: 1
								}, 8, ["onClick"])
							]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["data"])), [[unref(vLoading), loading.value]])]),
				createVNode(_component_ReDialog, {
					modelValue: editorVisible.value,
					"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => editorVisible.value = $event),
					title: editorPath.value,
					width: "760",
					height: 560,
					"confirm-text": "保存",
					"cancel-text": "取消",
					"footer-hidden": false,
					onConfirm: saveEditor,
					onCancel: _cache[5] || (_cache[5] = ($event) => editorVisible.value = false)
				}, {
					default: withCtx(() => [editorTruncated.value ? (openBlock(), createBlock(_component_ReAlert, {
						key: 0,
						title: "文件过大，仅加载前 1MB 内容；保存将覆盖完整文件，请谨慎操作",
						type: "warning",
						closable: false,
						style: { "margin-bottom": "8px" }
					})) : createCommentVNode("", true), createVNode(_component_ReInput, {
						modelValue: editorContent.value,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => editorContent.value = $event),
						type: "textarea",
						rows: 20,
						spellcheck: "false"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["modelValue", "title"])
			], 2);
		};
	}
}), [["__scopeId", "data-v-12de5e73"]]);
//#endregion
//#region ../../pages/server/src/components/specialKeys.ts
/** X11 常用键 keysym */
var KEYSYM = {
	Control_L: 65507,
	Shift_L: 65505,
	Alt_L: 65513,
	Super_L: 65515,
	Delete: 65535,
	Escape: 65307,
	Tab: 65289,
	F4: 65473,
	Print: 65377
};
/** 任务管理器：Ctrl+Alt+Del（Windows 安全注意序列） */
var CTRL_ALT_DEL = [
	{
		keysym: KEYSYM.Control_L,
		code: "ControlLeft"
	},
	{
		keysym: KEYSYM.Alt_L,
		code: "AltLeft"
	},
	{
		keysym: KEYSYM.Delete,
		code: "Delete"
	}
];
/**
* 「其它无法触发的按键」候选项
*
* 覆盖 Windows 桌面常用、但会被本机 OS/浏览器截获的组合键。
*/
var SPECIAL_KEY_COMBOS = [
	{
		value: "ctrl-alt-del",
		label: "任务管理器",
		hint: "Ctrl+Alt+Del",
		keys: CTRL_ALT_DEL
	},
	{
		value: "ctrl-shift-esc",
		label: "任务管理器（直接）",
		hint: "Ctrl+Shift+Esc",
		keys: [
			{
				keysym: KEYSYM.Control_L,
				code: "ControlLeft"
			},
			{
				keysym: KEYSYM.Shift_L,
				code: "ShiftLeft"
			},
			{
				keysym: KEYSYM.Escape,
				code: "Escape"
			}
		]
	},
	{
		value: "alt-tab",
		label: "切换窗口",
		hint: "Alt+Tab",
		keys: [{
			keysym: KEYSYM.Alt_L,
			code: "AltLeft"
		}, {
			keysym: KEYSYM.Tab,
			code: "Tab"
		}]
	},
	{
		value: "alt-f4",
		label: "关闭窗口",
		hint: "Alt+F4",
		keys: [{
			keysym: KEYSYM.Alt_L,
			code: "AltLeft"
		}, {
			keysym: KEYSYM.F4,
			code: "F4"
		}]
	},
	{
		value: "win",
		label: "开始菜单",
		hint: "Win",
		keys: [{
			keysym: KEYSYM.Super_L,
			code: "MetaLeft"
		}]
	},
	{
		value: "ctrl-esc",
		label: "开始菜单（组合）",
		hint: "Ctrl+Esc",
		keys: [{
			keysym: KEYSYM.Control_L,
			code: "ControlLeft"
		}, {
			keysym: KEYSYM.Escape,
			code: "Escape"
		}]
	},
	{
		value: "print-screen",
		label: "截屏",
		hint: "PrintScreen",
		keys: [{
			keysym: KEYSYM.Print,
			code: "PrintScreen"
		}]
	},
	{
		value: "escape",
		label: "Esc",
		hint: "Esc",
		keys: [{
			keysym: KEYSYM.Escape,
			code: "Escape"
		}]
	}
];
/** 工具条「任务管理器」按钮直达的组合键 */
var TASK_MANAGER_KEYS = CTRL_ALT_DEL;
//#endregion
//#region src/views/TerminalView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "rail-inner"
};
var _hoisted_2 = { class: "rail-head" };
var _hoisted_3 = { class: "rail-count" };
var _hoisted_4 = {
	key: 0,
	class: "tip"
};
var _hoisted_5 = {
	key: 1,
	class: "tip err"
};
var _hoisted_6 = { class: "g-title" };
var _hoisted_7 = { class: "g-count" };
var _hoisted_8 = ["onClick"];
var _hoisted_9 = { class: "ri-os" };
var _hoisted_10 = ["innerHTML"];
var _hoisted_11 = { class: "ri-name" };
var _hoisted_13 = {
	key: 0,
	class: "tip"
};
var _hoisted_14 = { class: "rail-foot" };
var _hoisted_15 = {
	key: 0,
	class: "foot-hint"
};
var _hoisted_16 = {
	key: 1,
	class: "foot-hint"
};
var _hoisted_17 = { class: "term-toolbar__status" };
var _hoisted_18 = { class: "conn-label" };
var _hoisted_19 = {
	key: 0,
	class: "conn-host"
};
var _hoisted_20 = { class: "tt-key-hint" };
var _hoisted_21 = {
	key: 1,
	class: "remote-empty"
};
var _hoisted_22 = { class: "mono" };
var _hoisted_23 = { class: "mono" };
var _hoisted_24 = {
	key: 5,
	class: "remote-empty"
};
//#endregion
//#region src/views/TerminalView.vue
var TerminalView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "TerminalView",
	setup(__props) {
		/**
		* 远程控制工作区 —— design.md §4.8（沉浸式 master–detail）
		* 左侧主机资源条（点选即切）+ 右侧 ScGuacViewer 远控渲染（guacamole 客户端直连隧道）
		* 支持 ?hostId= 直达：从资产页「连接」进入并自动选中、自动连接。
		* @author CH
		* @since 4.0.0
		*/
		const layout = {
			railWidth: 288,
			railCollapsed: 48
		};
		const route = useRoute();
		const router = useRouter();
		const hosts = ref([]);
		const loading = ref(false);
		const error = ref("");
		const selectedId = ref(null);
		const railOpen = ref(true);
		const keyword = ref("");
		/** SFTP 文件面板抽屉开关 */
		const sftpVisible = ref(false);
		/**
		* 读取路由上显式指定的协议（直达链接 / 资产页指定协议入口）
		* @returns 规范化协议名或空串
		*/
		function protocolQuery() {
			const raw = route.query.protocol;
			const v = ((Array.isArray(raw) ? raw[0] : raw) || "").toLowerCase();
			return v === "ssh" || v === "rdp" || v === "vnc" ? v : "";
		}
		/**
		* 主机默认协议：主机配置优先，未配置时按平台推断
		* @param h 主机
		*/
		function defaultProtocolOf(h) {
			const configured = (h.serverHostRemoteProtocol ?? "").toUpperCase();
			if (configured === "SSH" || configured === "RDP" || configured === "VNC") return configured.toLowerCase();
			const s = (h.serverHostOsType ?? "").toUpperCase();
			if (s.includes("WIN")) return "rdp";
			if (s.includes("MAC")) return "vnc";
			return "ssh";
		}
		/**
		* 当前生效协议：直达链接显式指定的协议优先（可在 VNC 主机上临时开 SSH），
		* 未显式指定时回落到主机默认协议
		* @param h 主机
		*/
		function protocolOf(h) {
			return protocolQuery() || defaultProtocolOf(h);
		}
		/**
		* 生效远控端口：主机配置优先，SSH 沿用端口字段，其余按协议默认
		* @param h 主机
		*/
		function remotePortOf(h) {
			const p = protocolOf(h);
			if (h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
			return p === "ssh" ? null : p === "rdp" ? 3389 : 5900;
		}
		const railWidth = computed(() => railOpen.value ? `${layout.railWidth}px` : `${layout.railCollapsed}px`);
		/** 当前选中资产 */
		const selectedHost = computed(() => hosts.value.find((h) => h.id === selectedId.value) ?? null);
		/** 手动断开标记：切换主机或点关闭时复位 */
		const disconnected = ref(false);
		/** 传给远控渲染组件的连接对象 */
		const connection = computed(() => {
			const h = selectedHost.value;
			if (!h || disconnected.value) return null;
			const qIdentity = route.query.identityId ? Number(route.query.identityId) : null;
			const mode = (h.serverHostRemoteMode ?? "").toUpperCase();
			return {
				hostId: h.id,
				hostName: `${h.serverHostName} (${h.serverHostAddress})`,
				address: h.serverHostAddress,
				protocol: protocolOf(h),
				identityId: Number.isFinite(qIdentity) ? qIdentity : null,
				targetPort: remotePortOf(h),
				mode: mode === "DIRECT" || mode === "NONE" ? mode : "GUACD"
			};
		});
		/**
		* 「无需通道」时本机客户端的连接目标：远控端口优先，SSH 回落资产接入端口，RDP/VNC 用协议默认端口
		*/
		const noneTarget = computed(() => {
			const c = connection.value;
			if (!c) return "";
			if (c.targetPort) return `${c.address}:${c.targetPort}`;
			if (c.protocol === "ssh") return `${c.address}:${selectedHost.value?.serverHostPort ?? 22}`;
			return `${c.address}:${c.protocol === "rdp" ? 3389 : 5900}`;
		});
		const termMainRef = ref(null);
		/** 应用内沉浸：隐藏左侧资源条，显示区铺满内容区（不触发浏览器全屏） */
		const immersive = ref(false);
		/** 浏览器/OS 级全屏状态（Fullscreen API） */
		const isFullscreen = ref(false);
		/** 特殊按键候选项（工具条下拉） */
		const specialKeyCombos = SPECIAL_KEY_COMBOS;
		/** guacd 渲染组件实例（内嵌 Guacamole 客户端） */
		const guacViewerRef = ref(null);
		/** VNC 直连渲染组件实例（noVNC） */
		const vncViewerRef = ref(null);
		/** 当前连接是否支持特殊按键下发（SSH 终端无桌面语义、NONE 无线上通道，仅 RDP/VNC 显示） */
		const supportsSpecialKeys = computed(() => {
			const c = connection.value;
			return !!c && c.protocol !== "ssh" && c.mode !== "NONE";
		});
		/**
		* 把按键序列下发给当前生效的渲染组件
		* @param keys 按键序列
		*/
		function sendSpecialKeys(keys) {
			const c = connection.value;
			if (!c) return;
			(c.protocol === "vnc" && c.mode === "DIRECT" ? vncViewerRef.value : guacViewerRef.value)?.sendSpecialKey?.(keys);
		}
		/** 「任务管理器」按钮：Ctrl+Alt+Del（Windows 安全注意序列） */
		function triggerTaskManager() {
			sendSpecialKeys(TASK_MANAGER_KEYS);
		}
		/**
		* 特殊按键下拉选择
		* @param command 组合 key
		*/
		function onSpecialCommand(command) {
			const combo = specialKeyCombos.find((c) => c.value === command);
			if (combo) sendSpecialKeys(combo.keys);
		}
		/** 断开当前连接：渲染区回到空态 */
		function disconnect() {
			disconnected.value = true;
		}
		/** 切换浏览器/OS 级全屏（作用于右侧显示区），ESC 退出；环境禁止时回落到应用内沉浸 */
		async function toggleFullscreen() {
			try {
				if (document.fullscreenElement) await document.exitFullscreen();
				else if (termMainRef.value) await termMainRef.value.requestFullscreen();
			} catch (e) {
				immersive.value = true;
				message.warning("浏览器未允许全屏，已切换为应用内全屏");
			}
		}
		function onFsChange() {
			isFullscreen.value = !!document.fullscreenElement;
		}
		const toolbarHidden = ref(false);
		const hoverToolbar = ref(false);
		let hideTimer = null;
		function inFullView() {
			return immersive.value || isFullscreen.value;
		}
		function revealToolbar() {
			if (hideTimer) {
				clearTimeout(hideTimer);
				hideTimer = null;
			}
			toolbarHidden.value = false;
		}
		function scheduleHide() {
			if (hideTimer) clearTimeout(hideTimer);
			hideTimer = setTimeout(() => {
				if (inFullView() && !hoverToolbar.value) toolbarHidden.value = true;
			}, 1600);
		}
		function onTermMouseMove(e) {
			if (!inFullView()) {
				toolbarHidden.value = false;
				return;
			}
			const top = termMainRef.value ? termMainRef.value.getBoundingClientRect().top : 0;
			if (e.clientY - top <= 26) revealToolbar();
			else if (!hoverToolbar.value) scheduleHide();
		}
		function onToolbarEnter() {
			hoverToolbar.value = true;
			revealToolbar();
		}
		function onToolbarLeave() {
			hoverToolbar.value = false;
			scheduleHide();
		}
		watch([immersive, isFullscreen], () => {
			if (inFullView()) {
				revealToolbar();
				scheduleHide();
			} else revealToolbar();
		});
		/** 切换应用内沉浸（可视范围全屏） */
		function toggleImmersive() {
			immersive.value = !immersive.value;
		}
		/** 弹出不带应用外壳、独占可视范围的独立全屏窗口（用 a[target=_blank] 兼容弹窗策略） */
		function popout() {
			const h = selectedHost.value;
			if (!h) return;
			const q = new URLSearchParams({
				hostId: String(h.id),
				protocol: protocolOf(h)
			});
			const c = connection.value;
			if (c && c.identityId != null) q.set("identityId", String(c.identityId));
			const url = `${window.location.origin}${window.location.pathname}#/terminal-standalone?${q.toString()}`;
			const a = document.createElement("a");
			a.href = url;
			a.target = "_blank";
			a.rel = "noopener";
			document.body.appendChild(a);
			a.click();
			a.remove();
		}
		/** 选中主机：复位断开标记；写入该主机的默认协议（不沿用上个主机的显式协议） */
		function selectHost(h) {
			selectedId.value = h.id;
			disconnected.value = false;
			const q = {
				hostId: String(h.id),
				protocol: defaultProtocolOf(h)
			};
			const qId = route.query.identityId;
			if (qId) q.identityId = String(qId);
			router.replace({
				path: "/terminal",
				query: q
			});
		}
		const filteredHosts = computed(() => {
			let list = hosts.value;
			if (keyword.value) {
				const k = keyword.value.toLowerCase();
				list = list.filter((h) => h.serverHostName.toLowerCase().includes(k) || h.serverHostAddress.toLowerCase().includes(k));
			}
			return [...list].sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0));
		});
		/** 标签分割 */
		function splitTags(tags) {
			if (!tags || !tags.trim()) return [];
			return tags.split(",").map((t) => t.trim()).filter(Boolean);
		}
		/** 按标签分组：有标签的按首个标签归组，无标签进「默认」 */
		const tagGroups = computed(() => {
			const map = /* @__PURE__ */ new Map();
			const def = [];
			for (const h of filteredHosts.value) {
				const tags = splitTags(h.serverHostTags);
				if (tags.length) {
					const key = tags[0];
					if (!map.has(key)) map.set(key, []);
					map.get(key).push(h);
				} else def.push(h);
			}
			const groups = [];
			for (const [label, list] of map) groups.push({
				label,
				list
			});
			if (def.length) groups.push({
				label: "默认",
				list: def
			});
			return groups;
		});
		ref(13);
		async function loadHosts() {
			loading.value = true;
			error.value = "";
			try {
				hosts.value = await queryHosts() ?? [];
			} catch (e) {
				error.value = String(e?.message ?? e);
			} finally {
				loading.value = false;
			}
		}
		/** 同步路由 query.hostId → 选中 */
		function syncFromQuery(qid) {
			const base = qid instanceof Array ? qid[0] : qid;
			if (!base) return;
			const id = Number(base);
			if (!Number.isFinite(id)) return;
			selectedId.value = id;
			disconnected.value = false;
		}
		/** 从资产页直达时：先按 query 选中，若无该 host 再从后端补拉 */
		async function selectFromQuery() {
			const qid = route.query.hostId;
			if (!qid) return;
			const base = qid instanceof Array ? qid[0] : qid;
			const id = Number(base);
			if (!Number.isFinite(id)) return;
			if (hosts.value.some((h) => h.id === id)) {
				selectedId.value = id;
				return;
			}
			try {
				const h = await getHost(id);
				if (h) {
					const mapped = {
						id: h.id,
						serverHostName: h.serverHostName,
						serverHostAddress: h.serverHostAddress,
						serverHostPort: h.serverHostPort,
						serverHostOsType: h.serverHostOsType,
						serverHostOnline: h.serverHostOnline,
						serverHostRemoteEnabled: h.serverHostRemoteEnabled,
						serverHostRemoteProtocol: h.serverHostRemoteProtocol,
						serverHostRemotePort: h.serverHostRemotePort,
						serverHostRemoteMode: h.serverHostRemoteMode
					};
					hosts.value = [mapped, ...hosts.value];
					selectedId.value = id;
				}
			} catch {}
		}
		/** 左列表点选：就地断言 + 更新 URL（同路由不重建整页，保留 identityId） */
		watch(() => route.query.hostId, (val) => {
			if (val != null) syncFromQuery(val);
		});
		async function onMountedInit() {
			await loadHosts();
			await selectFromQuery();
		}
		onMounted(onMountedInit);
		onMounted(() => document.addEventListener("fullscreenchange", onFsChange));
		onMounted(() => termMainRef.value?.addEventListener("mousemove", onTermMouseMove));
		onBeforeUnmount(() => document.removeEventListener("fullscreenchange", onFsChange));
		onBeforeUnmount(() => termMainRef.value?.removeEventListener("mousemove", onTermMouseMove));
		onBeforeUnmount(() => {
			if (hideTimer) clearTimeout(hideTimer);
		});
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			return openBlock(), createElementBlock("div", { class: normalizeClass([
				"tw",
				"tel-page",
				{ immersive: immersive.value }
			]) }, [createBaseVNode("aside", {
				style: normalizeStyle({ width: railWidth.value }),
				class: "rail tel-rail"
			}, [railOpen.value ? (openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [
					_cache[8] || (_cache[8] = createBaseVNode("span", { class: "rail-title" }, "主机资源", -1)),
					createBaseVNode("span", _hoisted_3, toDisplayString(hosts.value.length), 1),
					createBaseVNode("span", {
						class: "rail-collapse-btn",
						onClick: _cache[0] || (_cache[0] = ($event) => railOpen.value = false),
						title: "折叠资源条"
					}, "«")
				]),
				createVNode(unref(ReInput_default), {
					modelValue: keyword.value,
					"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => keyword.value = $event),
					placeholder: "搜索主机 / IP",
					clearable: "",
					class: "rail-search"
				}, null, 8, ["modelValue"]),
				loading.value ? (openBlock(), createElementBlock("div", _hoisted_4, "加载中…")) : error.value ? (openBlock(), createElementBlock("div", _hoisted_5, toDisplayString(error.value), 1)) : (openBlock(), createBlock(unref(ReScrollbar_default), {
					key: 2,
					class: "rail-list"
				}, {
					default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(tagGroups.value, (g) => {
						return openBlock(), createElementBlock(Fragment, { key: g.label }, [createBaseVNode("div", _hoisted_6, [createTextVNode(toDisplayString(g.label === "默认" ? "∅ 默认" : "#" + g.label) + " ", 1), createBaseVNode("span", _hoisted_7, toDisplayString(g.list.length), 1)]), (openBlock(true), createElementBlock(Fragment, null, renderList(g.list, (h) => {
							return openBlock(), createElementBlock("div", {
								key: h.id,
								class: "rail-group"
							}, [createBaseVNode("div", {
								class: normalizeClass(["rail-item", { active: selectedId.value === h.id }]),
								onClick: ($event) => selectHost(h)
							}, [
								createBaseVNode("span", _hoisted_9, [createBaseVNode("span", { innerHTML: unref(osIconSvg)(h.serverHostOsType) }, null, 8, _hoisted_10)]),
								createBaseVNode("span", _hoisted_11, toDisplayString(h.serverHostName), 1),
								createBaseVNode("span", { class: normalizeClass(["pdot", h.serverHostOnline === 1 ? "pdot-online" : "pdot-offline"]) }, null, 2),
								createBaseVNode("span", { class: normalizeClass(["ri-proto", `proto-${defaultProtocolOf(h)}`]) }, toDisplayString(defaultProtocolOf(h).toUpperCase()), 3)
							], 10, _hoisted_8), createCommentVNode("", true)]);
						}), 128))], 64);
					}), 128)), tagGroups.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_13, "暂无主机")) : createCommentVNode("", true)]),
					_: 1
				})),
				createBaseVNode("div", _hoisted_14, [!selectedHost.value ? (openBlock(), createElementBlock("span", _hoisted_15, "从左侧选择一台主机开始控制")) : (openBlock(), createElementBlock("span", _hoisted_16, "已选择 " + toDisplayString(selectedHost.value.serverHostName), 1))])
			])) : (openBlock(), createElementBlock("div", {
				key: 1,
				class: "rail-collapsed",
				onClick: _cache[2] || (_cache[2] = ($event) => railOpen.value = true),
				title: "展开资源条"
			}, "☰"))], 4), createBaseVNode("main", {
				ref_key: "termMainRef",
				ref: termMainRef,
				class: "term-main"
			}, [
				selectedHost.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass([
						"term-toolbar",
						{ "is-hidden": toolbarHidden.value },
						connection.value ? "is-connected" : "is-idle"
					]),
					onMouseenter: onToolbarEnter,
					onMouseleave: onToolbarLeave
				}, [
					createBaseVNode("div", _hoisted_17, [
						createBaseVNode("span", { class: normalizeClass(["conn-dot", connection.value ? "is-live" : "is-idle"]) }, null, 2),
						createBaseVNode("span", _hoisted_18, toDisplayString(connection.value ? connection.value.protocol.toUpperCase() : "未连接"), 1),
						connection.value ? (openBlock(), createElementBlock("span", _hoisted_19, toDisplayString(connection.value.hostName), 1)) : createCommentVNode("", true)
					]),
					_cache[11] || (_cache[11] = createBaseVNode("span", { class: "tt-sep" }, null, -1)),
					createVNode(_component_ReButton, {
						layout: "square",
						icon: "SwitchButton",
						title: "断开连接",
						onClick: disconnect
					}),
					supportsSpecialKeys.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						_cache[9] || (_cache[9] = createBaseVNode("span", { class: "tt-sep" }, null, -1)),
						createVNode(_component_ReButton, {
							layout: "square",
							icon: "Tools",
							title: "任务管理器（Ctrl+Alt+Del）",
							onClick: triggerTaskManager
						}),
						createVNode(unref(ElDropdown), {
							trigger: "click",
							placement: "bottom",
							onCommand: onSpecialCommand
						}, {
							dropdown: withCtx(() => [createVNode(unref(ElDropdownMenu), null, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(specialKeyCombos), (c) => {
									return openBlock(), createBlock(unref(ElDropdownItem), {
										key: c.value,
										command: c.value
									}, {
										default: withCtx(() => [createTextVNode(toDisplayString(c.label) + " ", 1), createBaseVNode("span", _hoisted_20, toDisplayString(c.hint), 1)]),
										_: 2
									}, 1032, ["command"]);
								}), 128))]),
								_: 1
							})]),
							default: withCtx(() => [createVNode(_component_ReButton, {
								layout: "square",
								icon: "MoreFilled",
								title: "其它无法透传的按键"
							})]),
							_: 1
						}),
						_cache[10] || (_cache[10] = createBaseVNode("span", { class: "tt-sep" }, null, -1))
					], 64)) : createCommentVNode("", true),
					createVNode(_component_ReButton, {
						layout: "square",
						icon: isFullscreen.value ? "Aim" : "FullScreen",
						type: isFullscreen.value ? "primary" : "default",
						title: isFullscreen.value ? "退出全屏" : "全屏（浏览器/OS）",
						onClick: toggleFullscreen
					}, null, 8, [
						"icon",
						"type",
						"title"
					]),
					createVNode(_component_ReButton, {
						layout: "square",
						icon: immersive.value ? "Rank" : "Expand",
						type: immersive.value ? "primary" : "default",
						title: immersive.value ? "退出可视范围全屏" : "可视范围全屏（应用内）",
						onClick: toggleImmersive
					}, null, 8, [
						"icon",
						"type",
						"title"
					]),
					createVNode(_component_ReButton, {
						layout: "square",
						icon: "TopRight",
						title: "弹出独立页面（独占可视范围）",
						onClick: popout
					})
				], 34)) : createCommentVNode("", true),
				connection.value && connection.value.mode === "NONE" ? (openBlock(), createElementBlock("div", _hoisted_21, [
					createTextVNode(" 「" + toDisplayString(connection.value.hostName) + "」的远控通道为「无需通道」，平台不做中转：请用本机 ", 1),
					createBaseVNode("b", _hoisted_22, toDisplayString(connection.value.protocol.toUpperCase()), 1),
					_cache[12] || (_cache[12] = createTextVNode(" 客户端连接 ", -1)),
					createBaseVNode("b", _hoisted_23, toDisplayString(noneTarget.value), 1),
					_cache[13] || (_cache[13] = createTextVNode(" ；需要网页远控请把该主机的远控通道改为「平台直连」或「Guacd 中转」。 ", -1))
				])) : connection.value && connection.value.protocol === "ssh" ? (openBlock(), createBlock(ScSshDirectViewer_default, {
					key: 2,
					connection: connection.value,
					"hide-close": "",
					onClose: _cache[3] || (_cache[3] = ($event) => disconnected.value = true),
					onFiles: _cache[4] || (_cache[4] = ($event) => sftpVisible.value = true)
				}, null, 8, ["connection"])) : connection.value && connection.value.protocol === "vnc" && connection.value.mode === "DIRECT" ? (openBlock(), createBlock(ScVncDirectViewer_default, {
					key: 3,
					ref_key: "vncViewerRef",
					ref: vncViewerRef,
					connection: connection.value,
					"hide-close": "",
					onClose: _cache[5] || (_cache[5] = ($event) => disconnected.value = true)
				}, null, 8, ["connection"])) : connection.value ? (openBlock(), createBlock(ScGuacViewer_default, {
					key: 4,
					ref_key: "guacViewerRef",
					ref: guacViewerRef,
					connection: connection.value,
					inline: "",
					onClose: _cache[6] || (_cache[6] = ($event) => disconnected.value = true)
				}, null, 8, ["connection"])) : createCommentVNode("", true),
				!connection.value ? (openBlock(), createElementBlock("div", _hoisted_24, "从左侧选择一台主机开始控制")) : createCommentVNode("", true),
				createVNode(unref(component), {
					modelValue: sftpVisible.value,
					"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => sftpVisible.value = $event),
					title: connection.value ? `文件管理 · ${connection.value.hostName}` : "文件管理",
					direction: "rtl",
					size: "720px",
					"destroy-on-close": "",
					"footer-hidden": true
				}, {
					content: withCtx(() => [connection.value ? (openBlock(), createBlock(ScSftpPanel_default, {
						key: 0,
						"host-id": connection.value.hostId
					}, null, 8, ["host-id"])) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["modelValue", "title"])
			], 512)], 2);
		};
	}
}), [["__scopeId", "data-v-56d72047"]]);
//#endregion
export { TerminalView_default as default };
