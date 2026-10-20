import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, fn as markRaw, ft as onUnmounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { $t as top_default, Bt as search_default, Et as plus_default, I as delete_default, K as expand_default, L as delete_filled_default, W as edit_default, Y as fold_default, _ as check_default, ct as lightning_default, dt as loading_default, h as chat_dot_round_default, k as cpu_default, pt as magic_stick_default, r as arrow_down_default, s as back_default, xt as more_filled_default } from "./dist-DogtK295.js";
import { in as http } from "./src-CEonioA3.js";
import { E as createOpenAiSseClient, H as getUserInfo, T as createSpringAiSseClient } from "./src-DDwlSqPX.js";
import { n as ensureFingerprint } from "./fingerprint-BEOYWheV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/vue-element-plus-x-stub/index.js
var Conversations = {};
var BubbleList = {};
var XSender = {};
//#endregion
//#region ../../packages/ui/src/components/ReChat/ReChat.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-chat" };
var _hoisted_2 = { class: "re-chat__history-search" };
var _hoisted_3 = { class: "re-chat__history-menu" };
var _hoisted_4 = ["onClick"];
var _hoisted_5 = {
	key: 0,
	class: "re-chat__batch-bar"
};
var _hoisted_6 = { class: "re-chat__batch-count" };
var _hoisted_7 = { class: "re-chat__batch-ops" };
var _hoisted_8 = { class: "re-chat__history-body" };
var _hoisted_9 = { class: "re-chat__group-title" };
var _hoisted_10 = { class: "re-chat__item-label" };
var _hoisted_11 = ["title", "onClick"];
var _hoisted_12 = ["onClick"];
var _hoisted_13 = { class: "re-chat__history-footer" };
var _hoisted_14 = { key: 0 };
var _hoisted_15 = { class: "re-chat__main" };
var _hoisted_16 = { class: "re-chat__panel" };
var _hoisted_17 = {
	key: 0,
	class: "re-chat__welcome"
};
var _hoisted_18 = { class: "re-chat__welcome-logo" };
var _hoisted_19 = { class: "re-chat__welcome-prompts" };
var _hoisted_20 = { class: "re-chat__input" };
var _hoisted_21 = {
	key: 0,
	class: "re-chat__command-panel"
};
var _hoisted_22 = ["onMousedown"];
var _hoisted_23 = { class: "re-chat__command-icon" };
var _hoisted_24 = { class: "re-chat__command-body" };
var _hoisted_25 = { class: "re-chat__command-name" };
var _hoisted_26 = { class: "re-chat__command-desc" };
var _hoisted_27 = { class: "re-chat__tool-row" };
var _hoisted_28 = {
	class: "re-chat__mini-btn re-chat__model-btn",
	type: "button"
};
var _hoisted_29 = { class: "re-chat__model-popover" };
var _hoisted_30 = ["onClick"];
var _hoisted_31 = { class: "re-chat__model-item-label" };
var _hoisted_32 = ["disabled", "title"];
var _hoisted_33 = {
	key: 1,
	class: "re-chat__skills-center"
};
var _hoisted_34 = { class: "re-chat__skills-header" };
var _hoisted_35 = { class: "re-chat__skills-head-left" };
var _hoisted_36 = { class: "re-chat__skills-grid" };
var _hoisted_37 = { class: "re-chat__skill-card-icon" };
var _hoisted_38 = { class: "re-chat__skill-card-body" };
var _hoisted_39 = { class: "re-chat__skill-card-name" };
var _hoisted_40 = { class: "re-chat__skill-card-desc" };
var _hoisted_41 = { class: "re-chat__skill-card-actions" };
/** 命令面板是否可见 */
var DAY = 864e5;
//#endregion
//#region ../../packages/ui/src/components/ReChat/ReChat.vue
var ReChat_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReChat",
	__name: "ReChat",
	props: {
		url: {},
		apiUrl: { default: void 0 },
		protocol: { default: "openai" },
		model: { default: void 0 },
		models: { default: () => [] },
		modelsUrl: { default: void 0 },
		capabilityGating: {
			type: Boolean,
			default: true
		},
		systemPrompt: { default: void 0 },
		temperature: { default: .7 },
		contextSize: { default: 20 },
		headers: { default: () => ({}) },
		userId: { default: void 0 },
		apiKey: {},
		conversationId: { default: void 0 },
		showAvatar: {
			type: Boolean,
			default: true
		},
		placeholder: { default: "给 AI 发送消息" },
		emptyText: { default: "开始新的对话吧" },
		menus: { default: () => [] }
	},
	emits: [
		"send",
		"receive",
		"complete",
		"error",
		"menu-click",
		"tool-click"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReChat —— 基于 element-plus-x 的 AI 对话组件
		*
		* 支持：
		*  - 多会话历史（左侧 Conversations 会话列表，可收缩）
		*  - OpenAI / Spring AI 双协议 SSE 流式
		*  - 上下文窗口（contextSize）、模型列表、系统提示词
		*  - 未登录时以浏览器指纹作为匿名用户 ID
		*
		*   <ReChat
		*     :url="'/v1/chat/completions'"
		*     :models="[{ label: 'GPT-4', value: 'gpt-4' }]"
		*     :context-size="20"
		*     :system-prompt="'你是一个助手'"
		*   />
		*/
		/** 会话消息 */
		const props = __props;
		const emit = __emit;
		/** 实际请求地址 */
		const endpoint = computed(() => props.apiUrl ?? props.url);
		const historyCollapsed = ref(false);
		const sessions = ref([]);
		const currentId = ref(0);
		const loading = ref(false);
		/** 会话搜索关键字 */
		const searchText = ref("");
		/** 右侧视图：chat=聊天 / skills=技能中心 */
		const activeView = ref("chat");
		/** 当前选中的技能 */
		const activeSkill = ref(null);
		/** 已安装技能 key 集合 */
		const installedSkills = ref(/* @__PURE__ */ new Set());
		/** 技能列表 */
		const skills = [
			{
				key: "general",
				label: "通用助手",
				icon: magic_stick_default,
				description: "日常问答、闲聊、通用任务",
				prompt: "你是一个乐于助人的 AI 助手。"
			},
			{
				key: "translate",
				label: "翻译助手",
				icon: chat_dot_round_default,
				description: "中英互译、多语言翻译",
				prompt: "你是一个专业的翻译助手，将用户输入翻译成英文。"
			},
			{
				key: "code",
				label: "代码助手",
				icon: lightning_default,
				description: "编程答疑、代码生成与审查",
				prompt: "你是一个资深程序员，帮助用户解决编程问题。"
			}
		];
		/** XSender 实例引用（该组件无 modelValue，需通过实例方法读取输入内容） */
		const senderRef = ref(null);
		/** 输入文本（由 @change 同步，用于发送按钮禁用态判断） */
		const inputText = ref("");
		/** 输入是否为空 */
		const inputEmpty = computed(() => !inputText.value.trim());
		/** 深度思考开关 */
		const thinkEnabled = ref(false);
		/** 智能搜索开关 */
		const searchEnabled = ref(false);
		/** @change：同步 XSender 最新输入文本 */
		function onSenderChange() {
			inputText.value = senderRef.value?.getModelValue()?.text ?? "";
			updateCommandState();
		}
		/** 命令项定义 */
		const commandVisible = ref(false);
		/** 当前高亮的命令索引 */
		const commandIndex = ref(0);
		/** 常用斜杠命令 */
		const slashCommands = [
			{
				name: "new",
				description: "开启新对话",
				icon: plus_default,
				run: () => {
					startNewChat();
					return false;
				}
			},
			{
				name: "clear",
				description: "清空当前对话",
				icon: delete_filled_default,
				run: () => {
					handleClear();
					return false;
				}
			},
			{
				name: "skill",
				description: "打开技能中心",
				icon: lightning_default,
				run: () => {
					openSkills();
					return false;
				}
			},
			{
				name: "model",
				description: "切换模型",
				icon: cpu_default,
				run: () => {
					modelPopoverVisible.value = true;
					return false;
				}
			},
			{
				name: "think",
				description: "切换深度思考",
				icon: lightning_default,
				run: () => {
					thinkEnabled.value = !thinkEnabled.value;
					return false;
				}
			},
			{
				name: "search",
				description: "切换智能搜索",
				icon: search_default,
				run: () => {
					searchEnabled.value = !searchEnabled.value;
					return false;
				}
			},
			{
				name: "help",
				description: "查看可用命令",
				icon: magic_stick_default,
				run: () => {
					showCommandHelp();
					return false;
				}
			}
		];
		/** 过滤后的命令列表（按输入匹配） */
		const filteredCommands = computed(() => {
			const kw = inputText.value.trim().replace(/^\//, "").toLowerCase();
			const list = slashCommands.filter((c) => !c.hidden);
			if (!kw) return list;
			return list.filter((c) => c.name.toLowerCase().includes(kw));
		});
		/** 根据输入更新命令面板状态 */
		function updateCommandState() {
			const show = inputText.value.startsWith("/") && filteredCommands.value.length > 0;
			commandVisible.value = show;
			if (!show) commandIndex.value = 0;
			else commandIndex.value = Math.min(commandIndex.value, filteredCommands.value.length - 1);
		}
		/** 命令面板键盘导航（上/下/回车/Esc） */
		function onCommandKeydown(e) {
			if (!commandVisible.value) return;
			const list = filteredCommands.value;
			if (e.key === "ArrowDown") {
				e.preventDefault();
				commandIndex.value = (commandIndex.value + 1) % list.length;
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				commandIndex.value = (commandIndex.value - 1 + list.length) % list.length;
			} else if (e.key === "Enter") {
				e.preventDefault();
				execCommand(list[commandIndex.value]);
			} else if (e.key === "Escape") {
				commandVisible.value = false;
				e.preventDefault();
			}
		}
		/** 执行命令：返回值控制是否继续发送 */
		function execCommand(cmd) {
			commandVisible.value = false;
			commandIndex.value = 0;
			if (cmd.run() === false) {
				inputText.value = "";
				senderRef.value?.clear();
			}
		}
		/** /help：把命令列表作为一条 AI 消息插入 */
		function showCommandHelp() {
			const list = slashCommands.map((c) => `/${c.name} - ${c.description}`).join("\n");
			const cmdMsg = {
				id: `cmd-help-${Date.now()}`,
				content: `可用斜杠命令：\n${list}`,
				isSelf: false,
				time: /* @__PURE__ */ new Date(),
				status: "sent"
			};
			const arr = sessionMessages.value.get(currentId.value) ?? [];
			arr.push(cmdMsg);
			sessionMessages.value.set(currentId.value, arr);
		}
		/** 模型列表（优先 prop.models，其次从后端 /v1/models 拉取） */
		const modelOptions = ref([]);
		/** 当前选中模型 value */
		const selectedModel = ref("");
		/** 模型选择弹层是否可见 */
		const modelPopoverVisible = ref(false);
		/** 后端模型列表是否已加载成功 */
		const modelsLoaded = ref(false);
		/** 当前模型显示名 */
		const currentModelLabel = computed(() => {
			return (modelOptions.value.find((m) => m.value === selectedModel.value)?.label ?? selectedModel.value) || "选择模型";
		});
		/** 当前模型的能力集合 */
		const currentModelCaps = computed(() => {
			return modelOptions.value.find((m) => m.value === selectedModel.value)?.capabilities ?? [];
		});
		/**
		* 能力开关可见性：
		*  - 关闭 capabilityGating 时恒显示（兜底，兼容无能力协议的后端）
		*  - 后端模型列表加载失败（拿不到能力）时也显示（保守策略）
		*  - 仅当能力明确存在时才显示对应开关
		*/
		const capabilitySupport = computed(() => {
			if (!(props.capabilityGating !== false) || !modelsLoaded.value) return {
				think: true,
				search: true
			};
			const caps = currentModelCaps.value.map((c) => c.toLowerCase());
			return {
				think: caps.includes("think"),
				search: caps.includes("search")
			};
		});
		/** 选择模型（关闭弹层并同步） */
		function selectModel(value) {
			selectedModel.value = value;
			modelPopoverVisible.value = false;
			if (!capabilitySupport.value.think) thinkEnabled.value = false;
			if (!capabilitySupport.value.search) searchEnabled.value = false;
		}
		/**
		* 解析后端模型列表接口地址：
		*  props.modelsUrl > url 同级 /v1/models（chat/completions → /models）
		*/
		function resolveModelsUrl() {
			if (props.modelsUrl) return props.modelsUrl;
			const url = endpoint.value;
			if (/\/chat\/completions$/i.test(url)) return url.replace(/\/chat\/completions$/i, "/models");
			if (/\/completions$/i.test(url)) return url.replace(/\/completions$/i, "/models");
			return url.replace(/\/+$/, "") + "/models";
		}
		/** 从后端拉取模型列表（含 capabilities） */
		async function fetchModels() {
			if (props.models.length) {
				modelOptions.value = [...props.models];
				const initial = props.model || props.models[0]?.value || "";
				selectedModel.value = initial;
				modelsLoaded.value = true;
				return;
			}
			try {
				const { data: json } = await http().get(resolveModelsUrl()).headers({
					Accept: "application/json",
					...props.headers ?? {}
				});
				const list = (json.data ?? []).map((m) => ({
					value: m.id || m.name || "",
					label: m.name || m.id || "",
					description: m.description,
					capabilities: m.capabilities ?? []
				}));
				modelOptions.value = list.filter((m) => m.value);
				modelsLoaded.value = true;
				selectedModel.value = props.model || modelOptions.value[0]?.value || "";
			} catch (e) {
				console.warn("[ReChat] 模型列表拉取失败，能力开关采用保守显示策略:", e);
				modelsLoaded.value = false;
			}
		}
		fetchModels();
		/** 各会话消息缓存：sessionId -> ChatMessage[]（ref 包裹，保证响应式） */
		const sessionMessages = ref(/* @__PURE__ */ new Map());
		let seed = 0;
		let currentClient = null;
		const currentMessages = computed(() => sessionMessages.value.get(currentId.value) ?? []);
		/** Conversations 当前激活会话 key */
		const activeSessionKey = computed(() => sessions.value.some((s) => s.id === currentId.value) ? currentId.value : void 0);
		function groupOf(s) {
			if (s.pinned) return "置顶";
			const t = s.updatedAt.getTime();
			const startOfToday = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)).getTime();
			if (t >= startOfToday) return "今天";
			if (t >= startOfToday - DAY) return "昨天";
			if (t >= startOfToday - 7 * DAY) return "近 7 天";
			if (t >= startOfToday - 30 * DAY) return "近 30 天";
			return "更早";
		}
		/** 分组排序：置顶 > 今天 > 昨天 > 近 7 天 > 近 30 天 > 更早 */
		function groupSort(a, b) {
			const order = [
				"置顶",
				"今天",
				"昨天",
				"近 7 天",
				"近 30 天",
				"更早"
			];
			return order.indexOf(a) - order.indexOf(b);
		}
		/** 会话项列表（过滤搜索 + 分组） */
		const filteredSessionItems = computed(() => sessions.value.filter((s) => !searchText.value || s.title.toLowerCase().includes(searchText.value.trim().toLowerCase())).map((s) => ({
			id: s.id,
			label: s.title,
			pinned: s.pinned,
			group: groupOf(s)
		})));
		/** 更多菜单当前指向的会话（点击某会话「更多」时同步，用于菜单文字按目标会话动态变化） */
		const pinMenuTarget = ref(null);
		/** 更多菜单第一条「置顶/取消置顶」基于目标会话，而非当前激活会话 */
		const conversationMenu = computed(() => {
			return [
				{
					label: sessions.value.find((s) => s.id === pinMenuTarget.value)?.pinned ?? activeSessionPinned ? "取消置顶" : "置顶",
					key: "pin",
					icon: markRaw(top_default),
					command: "pin"
				},
				{
					label: "重命名",
					key: "rename",
					icon: markRaw(edit_default),
					command: "rename"
				},
				{
					label: "删除",
					key: "delete",
					icon: markRaw(delete_default),
					command: "delete"
				},
				{
					label: "批量删除",
					key: "batch-delete",
					icon: markRaw(delete_filled_default),
					command: "batch-delete",
					divided: true
				}
			];
		});
		/** 点击会话前置顶图标快速切换（按 item 动态，不依赖当前激活会话） */
		function togglePinFromLabel(id) {
			const target = sessions.value.find((s) => s.id === id);
			if (target) target.pinned = !target.pinned;
		}
		/** 当前激活会话是否置顶 */
		const activeSessionPinned = computed(() => {
			return sessions.value.find((s) => s.id === currentId.value)?.pinned ?? false;
		});
		const batchDeleteMode = ref(false);
		const selectedIds = ref(/* @__PURE__ */ new Set());
		/** 是否全部选中（基于过滤后的列表） */
		const allSelected = computed(() => {
			const ids = filteredSessionItems.value.map((i) => i.id);
			return ids.length > 0 && ids.every((id) => selectedIds.value.has(id));
		});
		function enterBatchDelete() {
			batchDeleteMode.value = true;
			selectedIds.value = /* @__PURE__ */ new Set();
		}
		function exitBatchDelete() {
			batchDeleteMode.value = false;
			selectedIds.value = /* @__PURE__ */ new Set();
		}
		function onToggleSelect(id, checked) {
			const next = new Set(selectedIds.value);
			if (checked) next.add(id);
			else next.delete(id);
			selectedIds.value = next;
		}
		function toggleAll(checked) {
			const next = /* @__PURE__ */ new Set();
			if (checked) filteredSessionItems.value.forEach((i) => next.add(i.id));
			selectedIds.value = next;
		}
		function confirmBatchDelete() {
			selectedIds.value.forEach((id) => {
				const index = sessions.value.findIndex((s) => s.id === id);
				if (index !== -1) {
					sessions.value.splice(index, 1);
					sessionMessages.value.delete(id);
				}
			});
			if (currentId.value !== 0 && !sessions.value.some((s) => s.id === currentId.value)) currentId.value = sessions.value[0]?.id ?? 0;
			exitBatchDelete();
		}
		/** 打开技能中心（右侧切换视图） */
		function openSkills() {
			activeView.value = "skills";
		}
		/** 安装技能 */
		function installSkill(skill) {
			installedSkills.value = new Set(installedSkills.value).add(skill.key);
			activeSkill.value = skill;
		}
		/** 顶部扩展菜单点击：优先 prop 回调，否则 emit 给父组件 */
		function onMenuClick(menu) {
			menu.onClick?.(menu);
			emit("menu-click", menu);
		}
		/** 返回聊天视图 */
		function backToChat() {
			activeView.value = "chat";
		}
		/** 输入框内迷你按钮点击（当前仅「语音」），交由父组件处理语音输入等逻辑 */
		function onToolClick(tool) {
			emit("tool-click", tool);
		}
		/** 欢迎界面提示点击 */
		function sendPrompt(text) {
			sendMessage(text);
		}
		/** BubbleList 消息项（element-plus-x 格式） */
		const bubbleItems = computed(() => currentMessages.value.map((m) => ({
			id: m.id,
			role: m.isSelf ? "user" : "assistant",
			placement: m.isSelf ? "end" : "start",
			content: m.content,
			loading: m.status === "streaming" && !m.isSelf,
			shape: "corner",
			variant: m.isSelf ? "filled" : "outlined"
		})));
		function startNewChat() {
			const id = ++seed;
			const now = /* @__PURE__ */ new Date();
			sessions.value.push({
				id,
				title: `新会话 ${id}`,
				pinned: false,
				createdAt: now,
				updatedAt: now
			});
			currentId.value = id;
			sessionMessages.value.set(id, []);
		}
		/** 清空当前会话消息 */
		function handleClear() {
			sessionMessages.value.set(currentId.value, []);
			if (currentClient) {
				currentClient.close();
				currentClient = null;
			}
			loading.value = false;
		}
		function switchSession(id) {
			if (currentClient) {
				currentClient.close();
				currentClient = null;
			}
			currentId.value = id;
			loading.value = false;
		}
		/** Conversations @change：切换会话 */
		function onSessionChange(item) {
			const id = Number(item?.id);
			if (Number.isFinite(id)) {
				switchSession(id);
				const target = sessions.value.find((s) => s.id === id);
				if (target) target.updatedAt = /* @__PURE__ */ new Date();
			}
		}
		/** Conversations 自定义菜单：pin / rename / delete / batch-delete */
		function onSessionMenuCommand(command, item) {
			const id = Number(item?.id);
			if (command === "batch-delete") {
				enterBatchDelete();
				return;
			}
			if (!Number.isFinite(id)) return;
			if (command === "pin") {
				currentId.value = id;
				const target = sessions.value.find((s) => s.id === id);
				if (target) target.pinned = !target.pinned;
			} else if (command === "delete") {
				const index = sessions.value.findIndex((s) => s.id === id);
				if (index !== -1) {
					sessions.value.splice(index, 1);
					sessionMessages.value.delete(id);
				}
				if (currentId.value === id) {
					const next = sessions.value[0];
					currentId.value = next?.id ?? 0;
				}
			} else if (command === "rename") {
				const target = sessions.value.find((s) => s.id === id);
				if (target) target.title = prompt("请输入新会话名称", target.title) ?? target.title;
			}
		}
		/**
		* 解析当前用户 ID：
		*  1. 显式传入的 props.userId 优先
		*  2. 已登录：取框架存储的 userInfo 标识（id / userId / userExtId / username）
		*  3. 未登录：用浏览器指纹作为匿名用户 ID（持久化，同一浏览器保持一致）
		*/
		async function resolveUserId() {
			const explicit = props.userId;
			if (explicit) return explicit;
			const info = getUserInfo();
			if (info) {
				const id = info.id ?? info.userId ?? info.userExtId ?? info.username;
				if (id != null) return String(id);
			}
			try {
				return await ensureFingerprint();
			} catch {
				return;
			}
		}
		function onSubmit() {
			const text = senderRef.value?.getModelValue()?.text ?? inputText.value ?? "";
			if (commandVisible.value) {
				const list = filteredCommands.value;
				if (list.length) execCommand(list[commandIndex.value]);
				return;
			}
			const trimmed = text.trim();
			if (trimmed.startsWith("/")) {
				const cmd = slashCommands.find((c) => c.name === trimmed.slice(1).trim().toLowerCase());
				if (cmd && !cmd.hidden) {
					execCommand(cmd);
					return;
				}
			}
			sendMessage(text);
		}
		async function sendMessage(text) {
			const content = text.trim();
			if (!content || loading.value) return;
			if (currentClient) {
				currentClient.close();
				currentClient = null;
			}
			const list = sessionMessages.value.get(currentId.value) ?? [];
			const userMsg = {
				id: `user-${Date.now()}`,
				content,
				isSelf: true,
				time: /* @__PURE__ */ new Date(),
				status: "sent"
			};
			list.push(userMsg);
			emit("send", userMsg);
			const assistantMsg = {
				id: `assistant-${Date.now()}`,
				content: "",
				isSelf: false,
				time: /* @__PURE__ */ new Date(),
				status: "streaming"
			};
			list.push(assistantMsg);
			sessionMessages.value.set(currentId.value, list);
			loading.value = true;
			inputText.value = "";
			nextTick(() => {
				senderRef.value?.clear();
			});
			const systemPrompt = activeSkill.value?.prompt ?? props.systemPrompt;
			const history = list.filter((m) => m.content && m.id !== assistantMsg.id).slice(-props.contextSize).map((m) => ({
				role: m.isSelf ? "user" : "assistant",
				content: m.content
			}));
			if (systemPrompt) history.unshift({
				role: "system",
				content: systemPrompt
			});
			const userId = await resolveUserId();
			const baseOptions = {
				headers: props.headers,
				auth: props.apiKey || false,
				body: {
					model: selectedModel.value || props.model || "gpt-3.5-turbo",
					messages: history,
					stream: true,
					temperature: props.temperature ?? .7,
					think: thinkEnabled.value,
					search: searchEnabled.value,
					...userId ? { user: userId } : {}
				}
			};
			const handleChunk = (content) => {
				if (!content) return;
				assistantMsg.content += content;
				emit("receive", content, assistantMsg.content);
				sessionMessages.value.set(currentId.value, [...list]);
			};
			const handleEnd = (fullContent) => {
				assistantMsg.content = fullContent;
				assistantMsg.status = "sent";
				emit("complete", assistantMsg);
				sessionMessages.value.set(currentId.value, [...list]);
				loading.value = false;
				currentClient = null;
			};
			const handleError = (err) => {
				if (err instanceof DOMException && err.name === "AbortError") {
					assistantMsg.status = "sent";
					loading.value = false;
					currentClient = null;
					return;
				}
				assistantMsg.content = "[错误] " + (err?.message || "未知错误");
				assistantMsg.status = "sent";
				emit("error", err);
				sessionMessages.value.set(currentId.value, [...list]);
				loading.value = false;
				currentClient = null;
			};
			if (props.protocol === "openai") currentClient = createOpenAiSseClient(endpoint.value, {
				...baseOptions,
				reconnect: false,
				onChunk: (chunk) => {
					handleChunk(chunk.choices?.[0]?.delta?.content || "");
				},
				onEnd: handleEnd,
				onError: handleError
			});
			else currentClient = createSpringAiSseClient(endpoint.value, {
				...baseOptions,
				reconnect: false,
				onChunk: (chunk) => {
					handleChunk(chunk.content || "");
				},
				onEnd: handleEnd,
				onError: handleError
			});
		}
		function stop() {
			if (currentClient) {
				currentClient.close();
				currentClient = null;
			}
			const msgs = sessionMessages.value.get(currentId.value);
			if (msgs) {
				const streaming = msgs.find((m) => m.status === "streaming" && !m.isSelf);
				if (streaming) streaming.status = "sent";
			}
			loading.value = false;
		}
		onUnmounted(() => {
			stop();
		});
		watch(() => props.conversationId, (id) => {
			if (id) startNewChat();
		}, { immediate: true });
		return (_ctx, _cache) => {
			const _component_el_input = resolveComponent("el-input");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_checkbox = resolveComponent("el-checkbox");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_tooltip = resolveComponent("el-tooltip");
			const _component_el_popover = resolveComponent("el-popover");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("aside", { class: normalizeClass(["re-chat__history", { collapsed: historyCollapsed.value }]) }, [
					createBaseVNode("div", _hoisted_2, [createVNode(_component_el_input, {
						modelValue: searchText.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchText.value = $event),
						"prefix-icon": unref(search_default),
						placeholder: "搜索会话",
						clearable: ""
					}, null, 8, ["modelValue", "prefix-icon"])]),
					createBaseVNode("div", _hoisted_3, [
						createBaseVNode("div", {
							class: normalizeClass(["re-chat__menu-item", { "is-active": activeView.value === "chat" && !activeSkill.value }]),
							onClick: startNewChat
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(plus_default))]),
							_: 1
						}), _cache[15] || (_cache[15] = createBaseVNode("span", null, "新对话", -1))], 2),
						createBaseVNode("div", {
							class: normalizeClass(["re-chat__menu-item", { "is-active": activeView.value === "skills" || !!activeSkill.value }]),
							onClick: openSkills
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(lightning_default))]),
							_: 1
						}), _cache[16] || (_cache[16] = createBaseVNode("span", null, "技能", -1))], 2),
						(openBlock(true), createElementBlock(Fragment, null, renderList(props.menus, (menu) => {
							return openBlock(), createElementBlock("div", {
								key: menu.key,
								class: "re-chat__menu-item",
								onClick: ($event) => onMenuClick(menu)
							}, [menu.icon ? (openBlock(), createBlock(_component_el_icon, { key: 0 }, {
								default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(menu.icon)))]),
								_: 2
							}, 1024)) : createCommentVNode("", true), createBaseVNode("span", null, toDisplayString(menu.label), 1)], 8, _hoisted_4);
						}), 128))
					]),
					batchDeleteMode.value ? (openBlock(), createElementBlock("div", _hoisted_5, [
						createBaseVNode("span", _hoisted_6, "已选 " + toDisplayString(selectedIds.value.size) + " 项", 1),
						createVNode(_component_el_checkbox, {
							"model-value": allSelected.value,
							onChange: toggleAll
						}, {
							default: withCtx(() => [..._cache[17] || (_cache[17] = [createTextVNode("全选", -1)])]),
							_: 1
						}, 8, ["model-value"]),
						createBaseVNode("div", _hoisted_7, [createVNode(_component_el_button, {
							type: "danger",
							onClick: confirmBatchDelete
						}, {
							default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode("删除", -1)])]),
							_: 1
						}), createVNode(_component_el_button, { onClick: exitBatchDelete }, {
							default: withCtx(() => [..._cache[19] || (_cache[19] = [createTextVNode("取消", -1)])]),
							_: 1
						})])
					])) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_8, [_cache[20] || (_cache[20] = createBaseVNode("div", { class: "re-chat__section-title" }, "历史对话", -1)), createVNode(unref(Conversations), {
						active: activeSessionKey.value,
						"onUpdate:active": _cache[2] || (_cache[2] = ($event) => activeSessionKey.value = $event),
						items: filteredSessionItems.value,
						"label-max-width": 150,
						"show-tooltip": true,
						groupable: { sort: groupSort },
						"row-key": "id",
						menu: conversationMenu.value,
						"show-built-in-menu": true,
						onChange: onSessionChange,
						onMenuCommand: onSessionMenuCommand
					}, {
						groupTitle: withCtx(({ group }) => [createBaseVNode("span", _hoisted_9, toDisplayString(group.title), 1)]),
						label: withCtx(({ item }) => [createBaseVNode("div", _hoisted_10, [
							batchDeleteMode.value ? (openBlock(), createBlock(_component_el_checkbox, {
								key: 0,
								"model-value": selectedIds.value.has(Number(item.id)),
								onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"])),
								onChange: (v) => onToggleSelect(Number(item.id), !!v)
							}, null, 8, ["model-value", "onChange"])) : createCommentVNode("", true),
							createBaseVNode("span", {
								class: normalizeClass(["re-chat__item-icon", { "is-pinned": item.pinned }]),
								title: item.pinned ? "取消置顶" : "置顶",
								onClick: withModifiers(($event) => togglePinFromLabel(Number(item.id)), ["stop"])
							}, [createVNode(_component_el_icon, null, {
								default: withCtx(() => [item.pinned ? (openBlock(), createBlock(unref(top_default), { key: 0 })) : (openBlock(), createBlock(unref(chat_dot_round_default), { key: 1 }))]),
								_: 2
							}, 1024)], 10, _hoisted_11),
							createBaseVNode("span", { class: normalizeClass(["re-chat__item-label-text", { "is-selected": selectedIds.value.has(Number(item.id)) }]) }, toDisplayString(item.label), 3)
						])]),
						"more-filled": withCtx(({ item }) => [createBaseVNode("span", {
							class: "re-chat__item-more",
							onClick: withModifiers(($event) => pinMenuTarget.value = Number(item.id), ["stop"])
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(more_filled_default))]),
							_: 1
						})], 8, _hoisted_12)]),
						_: 1
					}, 8, [
						"active",
						"items",
						"groupable",
						"menu"
					])]),
					createBaseVNode("div", _hoisted_13, [createBaseVNode("div", {
						class: "re-chat__collapse-btn",
						onClick: _cache[3] || (_cache[3] = ($event) => historyCollapsed.value = !historyCollapsed.value)
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [!historyCollapsed.value ? (openBlock(), createBlock(unref(fold_default), { key: 0 })) : (openBlock(), createBlock(unref(expand_default), { key: 1 }))]),
						_: 1
					}), !historyCollapsed.value ? (openBlock(), createElementBlock("span", _hoisted_14, "收起侧边栏")) : createCommentVNode("", true)])])
				], 2),
				historyCollapsed.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "re-chat__history-toggle",
					onClick: _cache[4] || (_cache[4] = ($event) => historyCollapsed.value = false)
				}, [createVNode(_component_el_icon, null, {
					default: withCtx(() => [createVNode(unref(expand_default))]),
					_: 1
				})])) : createCommentVNode("", true),
				createBaseVNode("main", _hoisted_15, [activeView.value === "chat" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_16, [currentMessages.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_17, [
					createBaseVNode("div", _hoisted_18, [createVNode(_component_el_icon, { size: 36 }, {
						default: withCtx(() => [createVNode(unref(magic_stick_default))]),
						_: 1
					})]),
					_cache[24] || (_cache[24] = createBaseVNode("h3", { class: "re-chat__welcome-title" }, "你好，有什么可以帮你的？", -1)),
					_cache[25] || (_cache[25] = createBaseVNode("p", { class: "re-chat__welcome-sub" }, "选择下方提示开始对话，或直接输入你的问题", -1)),
					createBaseVNode("div", _hoisted_19, [
						createBaseVNode("div", {
							class: "re-chat__prompt-card",
							onClick: _cache[5] || (_cache[5] = ($event) => sendPrompt("帮我写一份项目计划书"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(edit_default))]),
							_: 1
						}), _cache[21] || (_cache[21] = createBaseVNode("span", null, "帮我写一份项目计划书", -1))]),
						createBaseVNode("div", {
							class: "re-chat__prompt-card",
							onClick: _cache[6] || (_cache[6] = ($event) => sendPrompt("解释一下什么是机器学习"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(cpu_default))]),
							_: 1
						}), _cache[22] || (_cache[22] = createBaseVNode("span", null, "解释一下什么是机器学习", -1))]),
						createBaseVNode("div", {
							class: "re-chat__prompt-card",
							onClick: _cache[7] || (_cache[7] = ($event) => sendPrompt("帮我翻译一段英文"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(chat_dot_round_default))]),
							_: 1
						}), _cache[23] || (_cache[23] = createBaseVNode("span", null, "帮我翻译一段英文", -1))])
					])
				])) : (openBlock(), createBlock(unref(BubbleList), {
					key: 1,
					list: bubbleItems.value,
					"auto-scroll": true
				}, null, 8, ["list"]))]), createBaseVNode("div", _hoisted_20, [commandVisible.value && filteredCommands.value.length ? (openBlock(), createElementBlock("div", _hoisted_21, [(openBlock(true), createElementBlock(Fragment, null, renderList(filteredCommands.value, (cmd, idx) => {
					return openBlock(), createElementBlock("div", {
						key: cmd.name,
						class: normalizeClass(["re-chat__command-item", { "is-active": commandIndex.value === idx }]),
						onMousedown: withModifiers(($event) => execCommand(cmd), ["prevent"])
					}, [createBaseVNode("span", _hoisted_23, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(cmd.icon)))]),
						_: 2
					}, 1024)]), createBaseVNode("div", _hoisted_24, [createBaseVNode("span", _hoisted_25, "/" + toDisplayString(cmd.name), 1), createBaseVNode("span", _hoisted_26, toDisplayString(cmd.description), 1)])], 42, _hoisted_22);
				}), 128))])) : createCommentVNode("", true), createVNode(unref(XSender), {
					ref_key: "senderRef",
					ref: senderRef,
					placeholder: __props.placeholder,
					loading: loading.value,
					disabled: loading.value,
					variant: "updown",
					"submit-type": "enter",
					onChange: onSenderChange,
					onKeydown: onCommandKeydown,
					onSubmit
				}, {
					prefix: withCtx(() => [createBaseVNode("div", _hoisted_27, [
						createVNode(_component_el_tooltip, {
							content: "上传附件",
							placement: "top"
						}, {
							default: withCtx(() => [createBaseVNode("button", {
								class: "re-chat__mini-btn",
								type: "button",
								onClick: _cache[8] || (_cache[8] = ($event) => onToolClick("attach"))
							}, [createVNode(_component_el_icon, null, {
								default: withCtx(() => [createVNode(unref(plus_default))]),
								_: 1
							})])]),
							_: 1
						}),
						modelOptions.value.length ? (openBlock(), createBlock(_component_el_popover, {
							key: 0,
							visible: modelPopoverVisible.value,
							width: 240,
							trigger: "click",
							placement: "top-start",
							onShow: _cache[9] || (_cache[9] = ($event) => modelPopoverVisible.value = true),
							onHide: _cache[10] || (_cache[10] = ($event) => modelPopoverVisible.value = false)
						}, {
							reference: withCtx(() => [createBaseVNode("button", _hoisted_28, [
								createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(cpu_default))]),
									_: 1
								}),
								createBaseVNode("span", null, toDisplayString(currentModelLabel.value), 1),
								createVNode(_component_el_icon, { class: "re-chat__model-arrow" }, {
									default: withCtx(() => [createVNode(unref(arrow_down_default))]),
									_: 1
								})
							])]),
							default: withCtx(() => [createBaseVNode("div", _hoisted_29, [_cache[26] || (_cache[26] = createBaseVNode("div", { class: "re-chat__model-popover-title" }, "选择模型", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(modelOptions.value, (m) => {
								return openBlock(), createElementBlock("div", {
									key: m.value,
									class: normalizeClass(["re-chat__model-item", { "is-active": selectedModel.value === m.value }]),
									onClick: ($event) => selectModel(m.value)
								}, [createBaseVNode("span", _hoisted_31, toDisplayString(m.label), 1), selectedModel.value === m.value ? (openBlock(), createBlock(_component_el_icon, {
									key: 0,
									class: "re-chat__model-item-check"
								}, {
									default: withCtx(() => [createVNode(unref(check_default))]),
									_: 1
								})) : createCommentVNode("", true)], 10, _hoisted_30);
							}), 128))])]),
							_: 1
						}, 8, ["visible"])) : createCommentVNode("", true),
						capabilitySupport.value.think ? (openBlock(), createElementBlock("button", {
							key: 1,
							class: normalizeClass(["re-chat__toggle-btn", { "is-active": thinkEnabled.value }]),
							type: "button",
							onClick: _cache[11] || (_cache[11] = ($event) => thinkEnabled.value = !thinkEnabled.value)
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(lightning_default))]),
							_: 1
						}), _cache[27] || (_cache[27] = createBaseVNode("span", null, "深度思考", -1))], 2)) : createCommentVNode("", true),
						capabilitySupport.value.search ? (openBlock(), createElementBlock("button", {
							key: 2,
							class: normalizeClass(["re-chat__toggle-btn", { "is-active": searchEnabled.value }]),
							type: "button",
							onClick: _cache[12] || (_cache[12] = ($event) => searchEnabled.value = !searchEnabled.value)
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(search_default))]),
							_: 1
						}), _cache[28] || (_cache[28] = createBaseVNode("span", null, "智能搜索", -1))], 2)) : createCommentVNode("", true)
					])]),
					"action-list": withCtx(() => [createBaseVNode("button", {
						class: normalizeClass(["re-chat__send-btn", {
							"is-loading": loading.value,
							"is-empty": !loading.value && inputEmpty.value
						}]),
						type: "button",
						disabled: !loading.value && inputEmpty.value,
						title: loading.value ? "停止生成" : "发送",
						onClick: _cache[13] || (_cache[13] = ($event) => loading.value ? stop() : onSubmit())
					}, [loading.value ? (openBlock(), createBlock(_component_el_icon, {
						key: 0,
						class: "is-loading-icon"
					}, {
						default: withCtx(() => [createVNode(unref(loading_default))]),
						_: 1
					})) : (openBlock(), createBlock(_component_el_icon, { key: 1 }, {
						default: withCtx(() => [createVNode(unref(top_default))]),
						_: 1
					}))], 10, _hoisted_32)]),
					_: 1
				}, 8, [
					"placeholder",
					"loading",
					"disabled"
				])])], 64)) : (openBlock(), createElementBlock("div", _hoisted_33, [createBaseVNode("div", _hoisted_34, [createBaseVNode("div", _hoisted_35, [createVNode(_component_el_tooltip, {
					content: "返回对话",
					placement: "bottom"
				}, {
					default: withCtx(() => [createBaseVNode("div", {
						class: "re-chat__skills-back",
						onClick: backToChat
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(back_default))]),
						_: 1
					})])]),
					_: 1
				}), _cache[29] || (_cache[29] = createBaseVNode("div", null, [createBaseVNode("div", { class: "re-chat__skills-title-lg" }, "技能中心"), createBaseVNode("div", { class: "re-chat__skills-sub" }, "安装并启用技能，为对话赋予专业能力")], -1))])]), createBaseVNode("div", _hoisted_36, [(openBlock(), createElementBlock(Fragment, null, renderList(skills, (skill) => {
					return createBaseVNode("div", {
						key: skill.key,
						class: normalizeClass(["re-chat__skill-card", {
							"is-installed": installedSkills.value.has(skill.key),
							"is-active": activeSkill.value?.key === skill.key
						}])
					}, [
						createBaseVNode("div", _hoisted_37, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(skill.icon)))]),
							_: 2
						}, 1024)]),
						createBaseVNode("div", _hoisted_38, [createBaseVNode("div", _hoisted_39, toDisplayString(skill.label), 1), createBaseVNode("div", _hoisted_40, toDisplayString(skill.description), 1)]),
						createBaseVNode("div", _hoisted_41, [installedSkills.value.has(skill.key) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [activeSkill.value?.key === skill.key ? (openBlock(), createBlock(_component_el_button, {
							key: 0,
							type: "primary",
							plain: "",
							onClick: _cache[14] || (_cache[14] = ($event) => activeSkill.value = null)
						}, {
							default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("停用", -1)])]),
							_: 1
						})) : (openBlock(), createBlock(_component_el_button, {
							key: 1,
							type: "primary",
							onClick: ($event) => installSkill(skill)
						}, {
							default: withCtx(() => [..._cache[31] || (_cache[31] = [createTextVNode("启用", -1)])]),
							_: 1
						}, 8, ["onClick"]))], 64)) : (openBlock(), createBlock(_component_el_button, {
							key: 1,
							onClick: ($event) => installSkill(skill)
						}, {
							default: withCtx(() => [..._cache[32] || (_cache[32] = [createTextVNode("安装", -1)])]),
							_: 1
						}, 8, ["onClick"]))])
					], 2);
				}), 64))])]))])
			]);
		};
	}
}), [["__scopeId", "data-v-fb1b674a"]]);
//#endregion
//#region ../../packages/ui/src/components/ReChat/index.ts
var plugin = { install(app) {
	app.component("ReChat", ReChat_default$1);
} };
var ReChat_default = ReChat_default$1;
//#endregion
export { ReChat_default as default, plugin as install };
