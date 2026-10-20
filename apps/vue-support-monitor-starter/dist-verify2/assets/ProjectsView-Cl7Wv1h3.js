import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { g as getGlobalSocketService, yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { a as useRouter, i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { r as trackTask } from "./processTasks-COQ9xU4g.js";
import { n as listTemplates, t as fillTemplate } from "./templates-CUjg7cUc.js";
//#region src/views/ProjectsView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "px tel-page" };
var _hoisted_2 = { class: "projects-wrap" };
var _hoisted_3 = {
	key: 1,
	class: "card-grid"
};
var _hoisted_4 = ["onDragover", "onDrop"];
var _hoisted_5 = { class: "card-left" };
var _hoisted_6 = { class: "card-right" };
var _hoisted_7 = { class: "card-header" };
var _hoisted_8 = { class: "title-row" };
var _hoisted_9 = ["title"];
var _hoisted_10 = { class: "card-body" };
var _hoisted_11 = { class: "info-row" };
var _hoisted_12 = ["title"];
var _hoisted_13 = { class: "info-row" };
var _hoisted_14 = ["title"];
var _hoisted_15 = {
	key: 0,
	class: "info-row"
};
var _hoisted_16 = { class: "info-val" };
var _hoisted_17 = { class: "pid-val" };
var _hoisted_18 = {
	key: 1,
	class: "info-row"
};
var _hoisted_19 = { class: "info-val" };
var _hoisted_20 = { class: "runtime-val" };
var _hoisted_21 = {
	key: 2,
	class: "info-row"
};
var _hoisted_22 = { class: "drop-hint" };
var _hoisted_23 = { class: "card-footer" };
var _hoisted_24 = {
	key: 0,
	class: "actions-group"
};
var _hoisted_25 = {
	key: 1,
	class: "disabled-tip"
};
var _hoisted_26 = { class: "actions-group" };
var _hoisted_27 = { class: "tab-grid" };
var _hoisted_28 = { class: "script-autogen" };
var _hoisted_29 = { class: "sa-text" };
var _hoisted_30 = { class: "sa-sub" };
var _hoisted_31 = { class: "script-list" };
var _hoisted_32 = { class: "vars-summary" };
var _hoisted_33 = {
	key: 0,
	class: "vars-block"
};
var _hoisted_34 = { class: "vars-card-meta" };
var _hoisted_35 = { class: "vars-card-count" };
var _hoisted_36 = ["onClick"];
var _hoisted_37 = { class: "vars-card-meta" };
var _hoisted_38 = { class: "vars-card-title" };
var _hoisted_39 = { class: "vars-card-count" };
var _hoisted_40 = { class: "vars-inline" };
var _hoisted_41 = {
	key: 0,
	class: "vars-inline-empty"
};
var _hoisted_42 = { class: "sys-pane" };
var _hoisted_43 = { class: "sys-card" };
var _hoisted_44 = { class: "sys-card-head" };
var _hoisted_45 = { class: "sys-switches" };
var _hoisted_46 = { class: "sys-switch" };
var _hoisted_47 = { class: "sys-switch" };
var _hoisted_48 = { class: "sys-actions" };
var _hoisted_49 = { class: "bk-pane" };
var _hoisted_50 = { class: "bk-toolbar" };
var _hoisted_51 = {
	key: 0,
	class: "bk-state-tip"
};
var _hoisted_52 = {
	key: 1,
	class: "bk-empty"
};
var _hoisted_53 = {
	key: 2,
	class: "bk-list"
};
var _hoisted_54 = { class: "bk-row-main" };
var _hoisted_55 = { class: "bk-row-name" };
var _hoisted_56 = { class: "bk-row-meta" };
var _hoisted_57 = { class: "vd-cats" };
var _hoisted_58 = { class: "vd-ph" };
var _hoisted_59 = { class: "vd-rows" };
var _hoisted_60 = { class: "vd-opt-flag" };
var _hoisted_61 = { class: "vd-opt-desc" };
var _hoisted_62 = {
	key: 1,
	class: "vd-boolean"
};
var _hoisted_63 = { class: "vd-rows" };
var _hoisted_64 = { class: "upg-pane" };
var _hoisted_65 = { class: "upg-switches" };
var _hoisted_66 = { class: "upg-switch" };
var _hoisted_67 = { class: "upg-switch" };
var _hoisted_68 = { class: "upg-switch" };
var _hoisted_69 = { class: "upg-switch" };
var _hoisted_70 = { class: "log-wrap" };
var _hoisted_71 = {
	key: 0,
	class: "log-tip"
};
var BASE = "/ms/server/release";
var VARS_BEGIN = "# >>> VARS (auto-managed) >>>";
var VARS_END = "# <<< VARS (auto-managed) <<<";
var LOG_STICK_THRESHOLD = 24;
//#endregion
//#region src/views/ProjectsView.vue
var ProjectsView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ProjectsView",
	setup(__props) {
		const router = useRouter();
		const route = useRoute();
		const list = ref([]);
		const loading = ref(false);
		const dialogVisible = ref(false);
		const editingId = ref(null);
		const releaseId = ref(Number(route.query.releaseId) || 0);
		const activeTab = ref("basic");
		const hostOs = ref("linux");
		const nowTs = ref(Date.now());
		let runtimeTimer = null;
		function pad2(n) {
			return n < 10 ? `0${n}` : `${n}`;
		}
		/** 依据 runningSince 实时计算运行时长：不足 1 小时显示 mm:ss，否则 HH:mm:ss，超过 1 天加「N天」 */
		function formatRuntime(item) {
			if (!item.runningSince) return "-";
			const start = new Date(item.runningSince).getTime();
			if (Number.isNaN(start)) return "-";
			let sec = Math.max(0, Math.floor((nowTs.value - start) / 1e3));
			const days = Math.floor(sec / 86400);
			sec -= days * 86400;
			const h = Math.floor(sec / 3600);
			sec -= h * 3600;
			const m = Math.floor(sec / 60);
			const s = sec - m * 60;
			const clock = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
			return days > 0 ? `${days}天 ${clock}` : clock;
		}
		const form = ref({
			projectName: "",
			projectType: "",
			mainEntry: "",
			startScript: "",
			stopScript: "",
			restartScript: "",
			statusScript: "",
			projectPath: "",
			logPath: "",
			logMode: "append",
			description: "",
			icon: "",
			envVars: [],
			jvmArgs: [],
			cmdArgs: [],
			serviceName: "",
			autostart: false,
			guardian: false,
			enabled: true,
			pid: "",
			appConfig: [],
			configDir: "",
			libDir: "",
			nginxDir: ""
		});
		const editTabs = computed(() => {
			const tabs = [
				{
					name: "basic",
					label: "基础信息",
					icon: "InfoFilled"
				},
				{
					name: "scripts",
					label: "脚本配置",
					icon: "EditPen"
				},
				{
					name: "vars",
					label: "变量设置",
					icon: "Operation"
				},
				{
					name: "system",
					label: "系统管理",
					icon: "Setting"
				}
			];
			if (editingId.value != null) tabs.push({
				name: "backups",
				label: "备份记录",
				icon: "Files"
			});
			return tabs;
		});
		const entryPlaceholder = computed(() => {
			switch (form.value.projectType) {
				case "springboot":
				case "fatjar": return "如：user-service.jar";
				case "separated": return "如：app（可执行文件名）或 app.js";
				case "static":
				case "nginx": return "静态站点通常无需主入口";
				default: return "请先选择项目类型";
			}
		});
		const MAIN_ENTRY_REQUIRED_TYPES = ["springboot", "separated"];
		const mainEntryRequired = computed(() => MAIN_ENTRY_REQUIRED_TYPES.includes(form.value.projectType));
		const needsEntry = computed(() => !["static", "nginx"].includes(form.value.projectType));
		const scriptContext = computed(() => ({
			entry: form.value.mainEntry,
			log: form.value.logPath,
			path: form.value.projectPath,
			appName: form.value.projectName
		}));
		function typeLabel(t) {
			return {
				springboot: "SpringBoot",
				fatjar: "FatJar",
				separated: "分离式",
				static: "静态页面",
				nginx: "Nginx"
			}[t] || t || "未知";
		}
		function defaultIconByType(t) {
			switch (t) {
				case "springboot":
				case "fatjar": return "Cpu";
				case "separated": return "Box";
				case "static": return "Picture";
				case "nginx": return "Connection";
				default: return "Folder";
			}
		}
		function displayIcon(item) {
			return item.icon || defaultIconByType(item.projectType);
		}
		async function loadList() {
			loading.value = true;
			try {
				const res = await http().get(`${BASE}/${releaseId.value}/projects`);
				list.value = unwrapResult(res) || [];
			} catch (e) {
				message.error("加载项目列表失败");
			} finally {
				loading.value = false;
			}
		}
		async function loadHostOs() {
			try {
				const relRes = await http().get(`${BASE}/list`);
				const rel = (unwrapResult(relRes) || []).find((r) => r.id === releaseId.value);
				if (!rel?.hostId) return;
				const hostRes = await http().get("/ms/server/host");
				const host = (unwrapResult(hostRes) || []).find((h) => h.id === rel.hostId);
				if (host && String(host.serverHostOsType).toUpperCase() === "WINDOWS") hostOs.value = "windows";
			} catch (e) {}
		}
		function resetForm() {
			form.value = {
				projectName: "",
				projectType: "",
				mainEntry: "",
				startScript: "",
				stopScript: "",
				restartScript: "",
				statusScript: "",
				projectPath: "",
				logPath: "",
				logMode: "append",
				description: "",
				icon: "",
				envVars: [],
				jvmArgs: [],
				cmdArgs: [],
				serviceName: "",
				autostart: false,
				guardian: false,
				enabled: true,
				pid: "",
				appConfig: [],
				configDir: "",
				libDir: "",
				nginxDir: ""
			};
		}
		function openCreateDialog() {
			editingId.value = null;
			resetForm();
			activeTab.value = "basic";
			dialogVisible.value = true;
		}
		function openEditDialog(item) {
			editingId.value = item.id;
			form.value = {
				projectName: item.projectName,
				projectType: item.projectType,
				mainEntry: item.mainEntry,
				startScript: item.startScript,
				stopScript: item.stopScript,
				restartScript: item.restartScript,
				statusScript: item.statusScript,
				projectPath: item.projectPath,
				logPath: item.logPath,
				logMode: item.logMode || "append",
				description: item.description,
				icon: item.icon,
				envVars: parseJson(item.envVars, []).filter((r) => r && typeof r.key === "string").map((r) => ({
					key: r.key,
					value: r.value ?? ""
				})),
				jvmArgs: parseJson(item.jvmArgs, []).filter((a) => typeof a === "string"),
				cmdArgs: parseJson(item.cmdArgs, []).filter((a) => typeof a === "string"),
				serviceName: item.serviceName || "",
				autostart: !!item.autostart,
				guardian: !!item.guardian,
				enabled: item.enabled === void 0 ? true : !!item.enabled,
				pid: item.pid || "",
				appConfig: parseJson(item.appConfig, []).filter((r) => r && typeof r.key === "string").map((r) => ({
					key: r.key,
					value: r.value ?? ""
				})),
				configDir: item.configDir || "",
				libDir: item.libDir || "",
				nginxDir: item.nginxDir || ""
			};
			activeTab.value = "basic";
			dialogVisible.value = true;
		}
		function parseJson(raw, fallback) {
			if (!raw || !raw.trim()) return fallback;
			try {
				const v = JSON.parse(raw);
				return Array.isArray(v) ? v : fallback;
			} catch {
				return fallback;
			}
		}
		const VARS_BLOCK_RE = /# >>> VARS \(auto-managed\) >>>[\s\S]*?# <<< VARS \(auto-managed\) <<<\n?/;
		function buildVarsBlock() {
			const envs = form.value.envVars.filter((r) => r.key.trim());
			const jvms = form.value.jvmArgs.map((a) => a.trim()).filter(Boolean);
			const args = form.value.cmdArgs.map((a) => a.trim()).filter(Boolean);
			if (!envs.length && !jvms.length && !args.length) return "";
			const ps = hostOs.value === "windows";
			const lines = [VARS_BEGIN];
			if (ps) {
				envs.forEach((r) => lines.push(`$env:${r.key.trim()} = '${r.value.replace(/'/g, "''")}'`));
				lines.push(`$JvmArgs = @(${jvms.map((a) => `'${a.replace(/'/g, "''")}'`).join(",")})`);
				lines.push(`$AppArgs = @(${args.map((a) => `'${a.replace(/'/g, "''")}'`).join(",")})`);
			} else {
				envs.forEach((r) => lines.push(`export ${r.key.trim()}='${r.value.replace(/'/g, "'\\''")}'`));
				lines.push(`JVM_ARGS='${jvms.map((a) => a.replace(/'/g, "'\\''")).join(" ")}'`);
				lines.push(`APP_ARGS='${args.map((a) => a.replace(/'/g, "'\\''")).join(" ")}'`);
			}
			lines.push(VARS_END);
			return lines.join("\n");
		}
		function injectVarsBlock(script, block) {
			if (VARS_BLOCK_RE.test(script)) return script.replace(VARS_BLOCK_RE, block ? block + "\n" : "");
			return block ? block + "\n" + script : script;
		}
		function applyArgsToken(script) {
			return script.replace(/__JVMARGS__/g, hostOs.value === "windows" ? "$JvmArgs" : "$JVM_ARGS").replace(/__ARGS__/g, hostOs.value === "windows" ? "$AppArgs" : "$APP_ARGS");
		}
		function materializeVars() {
			const block = buildVarsBlock();
			form.value.startScript = applyArgsToken(injectVarsBlock(form.value.startScript || "", block));
			form.value.restartScript = applyArgsToken(injectVarsBlock(form.value.restartScript || "", block));
		}
		const anyScriptEmpty = computed(() => [
			!form.value.startScript,
			!form.value.stopScript,
			!form.value.restartScript,
			!form.value.statusScript
		].some(Boolean));
		const autogenLoading = ref(false);
		/**
		* 用内置模板补齐为空的脚本（已手写的不覆盖）
		*
		* @param silent 静默模式：保存前自动补全时不弹校验/成功提示
		* @returns 是否成功套用模板
		*/
		function fillScriptsFromTemplate(silent = false) {
			if (!form.value.projectType) {
				if (!silent) {
					message.error("请先在「基础信息」选择项目类型");
					activeTab.value = "basic";
				}
				return false;
			}
			if (!form.value.projectPath) {
				if (!silent) {
					message.error("请先在「基础信息」填写项目地址");
					activeTab.value = "basic";
				}
				return false;
			}
			const templates = listTemplates(hostOs.value, form.value.projectType);
			const tpl = templates.find((t) => t.types.includes(form.value.projectType)) || templates[0];
			if (!tpl) {
				if (!silent) message.error("当前类型暂无内置模板");
				return false;
			}
			try {
				const filled = fillTemplate(tpl, {
					entry: form.value.mainEntry,
					log: form.value.logPath,
					path: form.value.projectPath,
					appName: form.value.projectName,
					logOp: form.value.logMode === "truncate" ? ">" : ">>"
				});
				if (!form.value.startScript) form.value.startScript = filled.start;
				if (!form.value.stopScript) form.value.stopScript = filled.stop;
				if (!form.value.restartScript) form.value.restartScript = filled.restart;
				if (!form.value.statusScript && filled.status) form.value.statusScript = filled.status;
				if (!silent) message.success("已根据基础配置生成脚本");
				return true;
			} catch (e) {
				if (!silent) message.error(e?.message || "脚本生成失败");
				return false;
			}
		}
		/**
		* 一键生成四个脚本：按「OS + 项目类型」内置模板 + 项目字段展开，
		* 覆盖 启动/停止/重启/状态，并立即展开 __JVMARGS__/__ARGS__ 为可直接执行的命令。
		*/
		async function autoGenerateScripts() {
			if (!form.value.projectType) {
				message.error("请先在「基础信息」选择项目类型");
				activeTab.value = "basic";
				return;
			}
			if (!form.value.projectPath) {
				message.error("请先在「基础信息」填写项目地址");
				activeTab.value = "basic";
				return;
			}
			const templates = listTemplates(hostOs.value, form.value.projectType);
			const tpl = templates.find((t) => t.types.includes(form.value.projectType)) || templates[0];
			if (!tpl) {
				message.error("当前类型暂无内置模板");
				return;
			}
			if ([
				form.value.startScript,
				form.value.stopScript,
				form.value.restartScript,
				form.value.statusScript
			].some((s) => (s || "").trim())) try {
				await ElMessageBox.confirm("将用内置模板覆盖当前四个脚本，是否继续？", "一键生成脚本", { type: "warning" });
			} catch {
				return;
			}
			autogenLoading.value = true;
			try {
				const filled = fillTemplate(tpl, {
					entry: form.value.mainEntry,
					log: form.value.logPath,
					path: form.value.projectPath,
					appName: form.value.projectName,
					logOp: form.value.logMode === "truncate" ? ">" : ">>"
				});
				form.value.startScript = filled.start;
				form.value.stopScript = filled.stop;
				form.value.restartScript = filled.restart;
				form.value.statusScript = filled.status || "";
				materializeVars();
				message.success("已生成 启动·停止·重启·状态 四个脚本");
			} catch (e) {
				message.error(e?.message || "脚本生成失败");
			} finally {
				autogenLoading.value = false;
			}
		}
		async function handleSave() {
			if (!form.value.projectName.trim()) {
				message.error("请填写「项目名称」");
				return;
			}
			if (!form.value.projectType) {
				message.error("请选择「项目类型」");
				return;
			}
			if (!form.value.projectPath.trim()) {
				message.error("请填写「项目地址」");
				return;
			}
			if (!form.value.logPath.trim()) {
				message.error("请填写「日志地址」");
				return;
			}
			if (mainEntryRequired.value && !form.value.mainEntry.trim()) {
				message.error("当前项目类型必须填写「主入口名称」");
				return;
			}
			form.value.serviceName = form.value.serviceName.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/(^-|-$)/g, "");
			try {
				fillScriptsFromTemplate(true);
				materializeVars();
				const payload = {
					...form.value,
					envVars: JSON.stringify(form.value.envVars),
					jvmArgs: JSON.stringify(form.value.jvmArgs),
					cmdArgs: JSON.stringify(form.value.cmdArgs),
					appConfig: JSON.stringify(form.value.appConfig)
				};
				if (editingId.value != null) {
					await http().put(`${BASE}/project/${editingId.value}`).data(payload);
					message.success("更新成功");
				} else {
					await http().post(`${BASE}/project`).data({
						...payload,
						releaseId: releaseId.value
					});
					message.success("创建成功");
				}
				dialogVisible.value = false;
				loadList();
			} catch (e) {
				message.error("保存失败");
			}
		}
		async function toggleEnabled(item) {
			const next = item.enabled === false;
			try {
				await http().put(`${BASE}/project/${item.id}`).data({ enabled: next });
				message.success(next ? "已激活" : "已禁用");
				loadList();
			} catch {
				message.error("操作失败");
			}
		}
		function onMoreCommand(item, command) {
			switch (command) {
				case "edit":
					openEditDialog(item);
					break;
				case "log":
					handleViewLog(item);
					break;
				case "backup":
					handleBackup(item);
					break;
				case "rollback":
					handleRollback(item);
					break;
				case "toggle":
					toggleEnabled(item);
					break;
				case "delete": handleDelete(item);
			}
		}
		async function runOperation(item, operation, path) {
			try {
				const res = await http().post(BASE + path);
				const taskId = unwrapResult(res);
				if (taskId) trackTask(taskId, item.projectName, operation);
			} catch (e) {
				message.error("操作触发失败");
			}
		}
		function handleStart(row) {
			return runOperation(row, "start", `/project/${row.id}/start`);
		}
		function handleStop(row) {
			return runOperation(row, "stop", `/project/${row.id}/stop`);
		}
		function handleRestart(row) {
			return runOperation(row, "restart", `/project/${row.id}/restart`);
		}
		function handleBackup(row) {
			return runOperation(row, "backup", `/project/${row.id}/backup`);
		}
		async function handleRollback(row) {
			try {
				await ElMessageBox.confirm(`确定回滚项目「${row.projectName}」到上一个版本吗？`, "回滚确认", { type: "warning" });
				await runOperation(row, "rollback", `/project/${row.id}/rollback`);
			} catch (e) {
				if (e !== "cancel") message.error("回滚失败");
			}
		}
		const varsVisible = ref(false);
		const varsCategory = ref("env");
		const ENV_CATALOG = [
			{
				flag: "JAVA_HOME",
				desc: "JDK 安装路径，如 /usr/lib/jvm/jdk-17"
			},
			{
				flag: "JRE_HOME",
				desc: "JRE 安装路径"
			},
			{
				flag: "JAVA_OPTS",
				desc: "JVM 额外参数（启动时追加），如 -Xmx512m"
			},
			{
				flag: "JAVA_TOOL_OPTIONS",
				desc: "JVM 启动时自动注入的参数，如 -Dfile.encoding=UTF-8"
			},
			{
				flag: "SPRING_PROFILES_ACTIVE",
				desc: "Spring 激活的 Profile，如 prod"
			},
			{
				flag: "SPRING_APPLICATION_JSON",
				desc: "Spring 内联 JSON 配置"
			},
			{
				flag: "SPRING_CONFIG_LOCATION",
				desc: "Spring 外部配置文件位置"
			},
			{
				flag: "CLASSPATH",
				desc: "类搜索路径，如 ./lib/*"
			},
			{
				flag: "PATH",
				desc: "可执行文件搜索路径"
			},
			{
				flag: "TZ",
				desc: "时区，如 Asia/Shanghai"
			},
			{
				flag: "LANG",
				desc: "语言与编码，如 en_US.UTF-8"
			},
			{
				flag: "LC_ALL",
				desc: "强制区域设置，如 en_US.UTF-8"
			},
			{
				flag: "HOME",
				desc: "用户主目录"
			},
			{
				flag: "APP_HOME",
				desc: "应用安装目录"
			},
			{
				flag: "LOG_PATH",
				desc: "日志输出目录"
			},
			{
				flag: "HTTP_PROXY",
				desc: "HTTP 代理地址，如 http://proxy:8080"
			},
			{
				flag: "HTTPS_PROXY",
				desc: "HTTPS 代理地址"
			},
			{
				flag: "NO_PROXY",
				desc: "代理排除地址，如 localhost,127.0.0.1"
			},
			{
				flag: "NODE_ENV",
				desc: "Node 运行环境，如 production"
			}
		];
		const JVM_CATALOG = [
			{
				flag: "-Xmx",
				desc: "最大堆内存，如 512m / 2g",
				sep: "concat"
			},
			{
				flag: "-Xms",
				desc: "初始堆内存，如 256m",
				sep: "concat"
			},
			{
				flag: "-Xmn",
				desc: "年轻代大小，如 256m",
				sep: "concat"
			},
			{
				flag: "-Xss",
				desc: "每个线程栈大小，如 512k",
				sep: "concat"
			},
			{
				flag: "-XX:MaxMetaspaceSize",
				desc: "元空间最大值，如 256m"
			},
			{
				flag: "-XX:MetaspaceSize",
				desc: "元空间初始阈值，如 128m"
			},
			{
				flag: "-XX:MaxDirectMemorySize",
				desc: "最大直接内存，如 512m"
			},
			{
				flag: "-XX:SurvivorRatio",
				desc: "Eden / Survivor 比例，如 8"
			},
			{
				flag: "-XX:NewRatio",
				desc: "老年代 / 年轻代比例，如 2"
			},
			{
				flag: "-XX:MaxRAMPercentage",
				desc: "堆占容器内存百分比，如 75.0"
			},
			{
				flag: "-XX:InitialRAMPercentage",
				desc: "初始堆占内存百分比，如 50.0"
			},
			{
				flag: "-XX:+UseG1GC",
				desc: "启用 G1 垃圾收集器（推荐）",
				boolean: true
			},
			{
				flag: "-XX:+UseParallelGC",
				desc: "启用 ParallelGC（吞吐优先）",
				boolean: true
			},
			{
				flag: "-XX:+UseZGC",
				desc: "启用 ZGC（超低延迟，JDK15+）",
				boolean: true
			},
			{
				flag: "-XX:+UseShenandoahGC",
				desc: "启用 ShenandoahGC（低延迟）",
				boolean: true
			},
			{
				flag: "-XX:+UseSerialGC",
				desc: "启用 SerialGC（单线程，小应用）",
				boolean: true
			},
			{
				flag: "-XX:MaxGCPauseMillis",
				desc: "GC 最大停顿目标毫秒，如 200"
			},
			{
				flag: "-XX:GCTimeRatio",
				desc: "GC 时间占比（0-100，越大越少），如 99"
			},
			{
				flag: "-XX:+UseStringDeduplication",
				desc: "G1 字符串去重，节省内存",
				boolean: true
			},
			{
				flag: "-Xlog:gc*",
				desc: "GC 日志输出（JDK11+），如 gc.log:time",
				sep: ":"
			},
			{
				flag: "-XX:+HeapDumpOnOutOfMemoryError",
				desc: "OOM 时自动 dump 堆快照",
				boolean: true
			},
			{
				flag: "-XX:HeapDumpPath",
				desc: "堆 dump 输出路径，如 ./heap.hprof"
			},
			{
				flag: "-XX:+ExitOnOutOfMemoryError",
				desc: "OOM 时直接退出进程（便于守护重启）",
				boolean: true
			},
			{
				flag: "-XX:OnOutOfMemoryError",
				desc: "OOM 时执行的命令，如 ./restart.sh"
			},
			{
				flag: "-Dfile.encoding",
				desc: "文件编码，如 UTF-8"
			},
			{
				flag: "-Dsun.jnu.encoding",
				desc: "JNU 文件名编码，如 UTF-8"
			},
			{
				flag: "-Duser.timezone",
				desc: "时区，如 Asia/Shanghai"
			},
			{
				flag: "-Duser.language",
				desc: "语言，如 zh"
			},
			{
				flag: "-Duser.country",
				desc: "国家/地区，如 CN"
			},
			{
				flag: "-cp",
				desc: "类路径，如 ./lib/*",
				sep: " "
			},
			{
				flag: "-Djava.ext.dirs",
				desc: "扩展类目录（JDK8），如 ./ext"
			},
			{
				flag: "-Dloader.path",
				desc: "Spring Boot PropertiesLauncher 加载路径，如 lib"
			},
			{
				flag: "-Djava.class.path",
				desc: "类路径，如 ./classes;./lib/*"
			},
			{
				flag: "-javaagent",
				desc: "挂载 Java Agent，如 /opt/agent/skywalking-agent.jar",
				sep: ":"
			},
			{
				flag: "-agentlib:jdwp",
				desc: "远程调试，如 transport=dt_socket,server=y,suspend=n,address=*:5005",
				sep: ":"
			},
			{
				flag: "-agentlib",
				desc: "挂载本地代理库，如 hprof",
				sep: ":"
			},
			{
				flag: "-agentpath",
				desc: "本地代理库绝对路径",
				sep: ":"
			},
			{
				flag: "-verbose:class",
				desc: "打印类加载信息",
				boolean: true
			},
			{
				flag: "-Dskywalking.agent.service_name",
				desc: "SkyWalking 服务名，如 user-service"
			},
			{
				flag: "-Dskywalking.collector.backend_service",
				desc: "SkyWalking OAP 地址，如 oap:11800"
			},
			{
				flag: "-Dskywalking.logging.dir",
				desc: "SkyWalking Agent 日志目录"
			},
			{
				flag: "-Darthas.appName",
				desc: "Arthas 应用名（配合 arthas agent）"
			},
			{
				flag: "-Darthas.tunnelServer",
				desc: "Arthas Tunnel 地址，如 tunnel:7777"
			},
			{
				flag: "-Dhttp.proxyHost",
				desc: "HTTP 代理主机"
			},
			{
				flag: "-Dhttp.proxyPort",
				desc: "HTTP 代理端口，如 8080"
			},
			{
				flag: "-Dhttps.proxyHost",
				desc: "HTTPS 代理主机"
			},
			{
				flag: "-Dhttps.proxyPort",
				desc: "HTTPS 代理端口"
			},
			{
				flag: "-Dlogging.level.root",
				desc: "根日志级别，如 INFO / DEBUG"
			},
			{
				flag: "-Dlogging.config",
				desc: "日志配置文件，如 classpath:logback-spring.xml"
			},
			{
				flag: "-Dlogback.configurationFile",
				desc: "Logback 配置文件路径"
			},
			{
				flag: "-Dlog4j.configurationFile",
				desc: "Log4j2 配置文件路径"
			}
		];
		const APP_CATALOG = [
			{
				flag: "--spring.profiles.active",
				desc: "Spring 激活的 Profile，如 prod"
			},
			{
				flag: "--spring.application.name",
				desc: "应用名，如 user-service"
			},
			{
				flag: "--server.port",
				desc: "服务监听端口，如 8080"
			},
			{
				flag: "--server.servlet.context-path",
				desc: "上下文路径，如 /api"
			},
			{
				flag: "--spring.config.location",
				desc: "外部配置文件位置"
			},
			{
				flag: "--spring.config.additional-location",
				desc: "额外配置文件位置"
			},
			{
				flag: "--spring.config.name",
				desc: "配置文件名（无扩展名），如 application"
			},
			{
				flag: "--spring.main.web-application-type",
				desc: "Web 类型，servlet / reactive / none"
			},
			{
				flag: "--logging.level.root",
				desc: "根日志级别，如 DEBUG"
			},
			{
				flag: "--logging.file.name",
				desc: "日志文件名，如 app.log"
			},
			{
				flag: "--logging.file.path",
				desc: "日志输出目录"
			},
			{
				flag: "--management.endpoints.web.exposure.include",
				desc: "Actuator 暴露端点，如 health,info,*"
			},
			{
				flag: "--management.endpoint.health.show-details",
				desc: "健康检查显示详情，如 always"
			},
			{
				flag: "--spring.datasource.url",
				desc: "数据源 JDBC URL"
			},
			{
				flag: "--spring.datasource.username",
				desc: "数据源用户名"
			},
			{
				flag: "--spring.datasource.password",
				desc: "数据源密码"
			},
			{
				flag: "--spring.redis.host",
				desc: "Redis 主机"
			},
			{
				flag: "--spring.redis.port",
				desc: "Redis 端口，如 6379"
			},
			{
				flag: "--spring.jpa.show-sql",
				desc: "打印 SQL 语句",
				boolean: true
			},
			{
				flag: "--spring.cloud.nacos.discovery.server-addr",
				desc: "Nacos 注册中心地址"
			},
			{
				flag: "--spring.cloud.nacos.config.server-addr",
				desc: "Nacos 配置中心地址"
			},
			{
				flag: "--spring.profiles.include",
				desc: "附加 Profile，如 dev,common"
			},
			{
				flag: "--debug",
				desc: "开启调试日志",
				boolean: true
			}
		];
		const currentCatalog = computed(() => ({
			env: ENV_CATALOG,
			jvm: JVM_CATALOG,
			app: APP_CATALOG
		})[varsCategory.value]);
		const varsBuffer = ref({
			env: [],
			jvm: [],
			app: []
		});
		const varsRows = computed(() => varsBuffer.value[varsCategory.value]);
		const varsExpanded = ref(null);
		function toggleVarsExpand(cat) {
			varsExpanded.value = varsExpanded.value === cat ? null : cat;
		}
		const varCards = computed(() => [
			{
				cat: "env",
				title: "环境变量",
				icon: "Operation",
				count: `${form.value.envVars.length} 项`,
				items: form.value.envVars.filter((r) => r.key).map((r) => `${r.key}=${r.value}`)
			},
			{
				cat: "jvm",
				title: "JVM 参数",
				icon: "Cpu",
				count: `${form.value.jvmArgs.length} 项（-jar 之前）`,
				items: form.value.jvmArgs
			},
			{
				cat: "app",
				title: "命令参数",
				icon: "Tickets",
				count: `${form.value.cmdArgs.length} 项（应用参数）`,
				items: form.value.cmdArgs
			}
		]);
		const serviceNamePreview = computed(() => {
			return `ms-${(form.value.projectName || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project"}`;
		});
		const keyPlaceholder = computed(() => ({
			env: "选择或输入变量名，如 JAVA_HOME",
			jvm: "选择或输入 JVM 参数，如 -Xmx",
			app: "选择或输入命令参数，如 --server.port"
		})[varsCategory.value]);
		const valuePlaceholder = computed(() => ({
			env: "变量值",
			jvm: "参数值，如 512m",
			app: "参数值，如 8080"
		})[varsCategory.value]);
		function isBooleanRow(row) {
			if (varsCategory.value === "jvm") {
				if (/^-XX:[+-]/.test(row.key)) return true;
			}
			return currentCatalog.value.some((o) => o.flag === row.key && o.boolean);
		}
		let focusedValEl = null;
		function onValFocus(e) {
			focusedValEl = e.target;
		}
		function insertPlaceholder(snippet) {
			const el = focusedValEl;
			if (!el) {
				const rows = varsRows.value;
				if (!rows.length) return;
				rows[rows.length - 1].value += snippet;
				return;
			}
			const start = el.selectionStart ?? el.value.length;
			const end = el.selectionEnd ?? el.value.length;
			const next = el.value.slice(0, start) + snippet + el.value.slice(end);
			const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
			if (desc && desc.set) desc.set.call(el, next);
			else el.value = next;
			el.dispatchEvent(new Event("input", { bubbles: true }));
			const pos = start + snippet.length;
			el.setSelectionRange(pos, pos);
			el.focus();
		}
		function openVarsDialog(cat) {
			varsBuffer.value = {
				env: form.value.envVars.map((r) => ({
					key: r.key,
					value: r.value
				})),
				jvm: form.value.jvmArgs.map(splitJvm),
				app: form.value.cmdArgs.map(splitApp)
			};
			varsCategory.value = cat;
			varsVisible.value = true;
		}
		function splitJvm(s) {
			const t = s.trim();
			if (t.startsWith("-D")) {
				const i = t.indexOf("=");
				return i >= 0 ? {
					key: t.slice(0, i),
					value: t.slice(i + 1)
				} : {
					key: t,
					value: ""
				};
			}
			const cm = t.match(/^(-javaagent|-agentlib|-agentpath|-Xlog|-Xbootclasspath(?:\/a)?):(.+)$/);
			if (cm) return {
				key: cm[1],
				value: cm[2]
			};
			if (t.startsWith("-XX:")) {
				const body = t.slice(4);
				if (body.startsWith("+") || body.startsWith("-")) return {
					key: t,
					value: ""
				};
				const i = body.indexOf("=");
				return i >= 0 ? {
					key: "-XX:" + body.slice(0, i),
					value: body.slice(i + 1)
				} : {
					key: t,
					value: ""
				};
			}
			for (const p of [
				"-Xmx",
				"-Xms",
				"-Xss",
				"-Xmn"
			]) if (t.startsWith(p)) return {
				key: p,
				value: t.slice(p.length)
			};
			const cp = t.match(/^(-cp|-classpath)\s+(.+)$/);
			if (cp) return {
				key: cp[1],
				value: cp[2]
			};
			return {
				key: t,
				value: ""
			};
		}
		function joinJvm(r) {
			const k = r.key.trim();
			if (!k) return "";
			const v = r.value.trim();
			const cat = JVM_CATALOG.find((c) => c.flag === k);
			if (cat?.boolean || /^-XX:[+-]/.test(k)) return k;
			let sep = cat?.sep;
			if (!sep) if (k.startsWith("-D") || k.startsWith("-XX:")) sep = "=";
			else if ([
				"-Xmx",
				"-Xms",
				"-Xss",
				"-Xmn"
			].includes(k)) sep = "concat";
			else if (/^-(javaagent|agentlib|agentpath|Xlog|Xbootclasspath)/.test(k)) sep = ":";
			else if (k === "-cp" || k === "-classpath") sep = " ";
			else sep = "=";
			if (!v) return k;
			return sep === "concat" ? k + v : k + sep + v;
		}
		function splitApp(s) {
			const i = s.indexOf("=");
			return i >= 0 ? {
				key: s.slice(0, i),
				value: s.slice(i + 1)
			} : {
				key: s,
				value: ""
			};
		}
		function joinApp(r) {
			const k = r.key.trim();
			if (!k) return "";
			return r.value.trim() ? `${k}=${r.value.trim()}` : k;
		}
		function confirmVars() {
			form.value.envVars = varsBuffer.value.env.filter((r) => r.key.trim()).map((r) => ({
				key: r.key.trim(),
				value: r.value
			}));
			form.value.jvmArgs = varsBuffer.value.jvm.map(joinJvm).filter(Boolean);
			form.value.cmdArgs = varsBuffer.value.app.map(joinApp).filter(Boolean);
			varsVisible.value = false;
		}
		const supportsAppConfig = computed(() => ["springboot", "fatjar"].includes(form.value.projectType));
		const appCfgVisible = ref(false);
		const appCfgRows = ref([]);
		function openAppConfigDialog() {
			appCfgRows.value = form.value.appConfig.map((r) => ({
				key: r.key,
				value: r.value
			}));
			appCfgVisible.value = true;
		}
		function confirmAppConfig() {
			form.value.appConfig = appCfgRows.value.filter((r) => r.key.trim()).map((r) => ({
				key: r.key.trim(),
				value: r.value
			}));
			appCfgVisible.value = false;
		}
		async function handleInstallService() {
			if (form.value.guardian && !form.value.statusScript) {
				message.error("开启守护进程需先在「脚本配置」中配置状态命令");
				return;
			}
			await handleSave();
			if (!dialogVisible.value) try {
				const res = await http().post(`${BASE}/project/${editingId.value}/service/install`);
				const taskId = unwrapResult(res);
				if (taskId) trackTask(taskId, form.value.projectName, "install-service");
			} catch {
				message.error("挂载服务失败");
			}
		}
		async function handleUninstallService() {
			try {
				const res = await http().post(`${BASE}/project/${editingId.value}/service/uninstall`);
				const taskId = unwrapResult(res);
				form.value.serviceName = "";
				if (taskId) trackTask(taskId, form.value.projectName, "uninstall-service");
			} catch {
				message.error("卸载服务失败");
			}
		}
		const dragOverId = ref(null);
		async function onDropFile(item, ev) {
			dragOverId.value = null;
			const file = ev.dataTransfer?.files?.[0];
			if (!file) return;
			const fd = new FormData();
			fd.append("file", file);
			try {
				const res = await http().post(`${BASE}/project/${item.id}/upload`).data(fd);
				const taskId = unwrapResult(res);
				if (taskId) trackTask(taskId, item.projectName, "upgrade");
				else message.error("上传升级失败");
			} catch {
				message.error("上传升级失败");
			}
		}
		const upgVisible = ref(false);
		const upgProject = ref(null);
		const upgForm = ref({
			autoBackup: true,
			autoExtract: true,
			autoRestart: true,
			autoRollback: false,
			packagePath: ""
		});
		async function openUpgradeDialog(item) {
			upgProject.value = item;
			try {
				const res = await http().get(`${BASE}/upgrade/config`);
				const cfg = unwrapResult(res) || {};
				const base = cfg.last || cfg.global || {};
				upgForm.value = {
					autoBackup: base.autoBackup ?? true,
					autoExtract: base.autoExtract ?? true,
					autoRestart: base.autoRestart ?? true,
					autoRollback: base.autoRollback ?? false,
					packagePath: base.packagePath ?? ""
				};
			} catch {}
			upgVisible.value = true;
		}
		async function saveGlobalConfig() {
			try {
				await http().put(`${BASE}/upgrade/config?scope=global`).data(upgForm.value);
				message.success("已保存为全局默认");
			} catch {
				message.error("保存失败");
			}
		}
		async function executeUpgrade() {
			if (!upgProject.value) return;
			try {
				await http().put(`${BASE}/upgrade/config?scope=last`).data(upgForm.value);
				const res = await http().post(`${BASE}/project/${upgProject.value.id}/upgrade/run`).data(upgForm.value);
				const taskId = unwrapResult(res);
				upgVisible.value = false;
				if (taskId) trackTask(taskId, upgProject.value.projectName, "upgrade");
			} catch {
				message.error("升级触发失败");
			}
		}
		const logDialogVisible = ref(false);
		const logLines = ref([]);
		const currentLogProject = ref(null);
		const logBoxEl = ref();
		const logAutoScroll = ref(true);
		let logSessionId = null;
		let logUnsub = null;
		async function handleViewLog(item) {
			currentLogProject.value = item;
			logLines.value = [];
			logAutoScroll.value = true;
			logDialogVisible.value = true;
			logUnsub = getGlobalSocketService()?.subscribe("project", "log", (msg) => {
				const data = msg?.data ?? msg;
				if (!data || data.sessionId !== logSessionId) return;
				if (data.status === "LINE" && typeof data.line === "string") logLines.value.push(data.line);
				else if (data.status === "ERROR") logLines.value.push(`[错误] ${data.message || "日志采集失败"}`);
			}) ?? null;
			try {
				const res = await http().post(`${BASE}/project/${item.id}/log/start`);
				logSessionId = unwrapResult(res);
			} catch (e) {
				logLines.value.push("[错误] 无法启动日志采集");
			}
		}
		function cleanupLog() {
			const sessionId = logSessionId;
			if (sessionId) {
				http().post(`${BASE}/project/log/${sessionId}/stop`).catch(() => {});
				logSessionId = null;
			}
			logUnsub?.();
			logUnsub = null;
		}
		watch(logDialogVisible, (visible) => {
			if (!visible) cleanupLog();
		});
		/** 距底部小于该阈值(px)视为仍贴底，保持自动滚动 */
		function onLogScroll(e) {
			const el = e.target;
			const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
			logAutoScroll.value = dist < LOG_STICK_THRESHOLD;
		}
		function resumeLogScroll() {
			logAutoScroll.value = true;
			if (logBoxEl.value) logBoxEl.value.scrollTop = logBoxEl.value.scrollHeight;
		}
		watch(logLines, () => {
			if (logAutoScroll.value && logBoxEl.value) logBoxEl.value.scrollTop = logBoxEl.value.scrollHeight;
		});
		async function handleDelete(row) {
			try {
				await ElMessageBox.confirm(`确定删除项目「${row.projectName}」吗？`, "提示", { type: "warning" });
				await http().delete(`${BASE}/project/${row.id}`);
				message.success("删除成功");
				loadList();
			} catch (e) {
				if (e !== "cancel") message.error("删除失败");
			}
		}
		const backupRows = ref([]);
		const backupLoading = ref(false);
		const backupActionLoading = ref(false);
		function formatBackupTime(ms) {
			if (ms == null) return "时间未知";
			const d = new Date(ms);
			if (Number.isNaN(d.getTime())) return "时间未知";
			return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
		}
		function formatSize(bytes) {
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
			return `${(bytes / 1073741824).toFixed(2)} GB`;
		}
		async function loadBackups() {
			if (editingId.value == null) {
				backupRows.value = [];
				return;
			}
			backupLoading.value = true;
			try {
				const res = await http().get(`${BASE}/project/${editingId.value}/backups`);
				backupRows.value = unwrapResult(res) || [];
			} catch {
				message.error("加载备份记录失败");
			} finally {
				backupLoading.value = false;
			}
		}
		async function handleBackupNow() {
			if (editingId.value == null) return;
			backupActionLoading.value = true;
			try {
				const res = await http().post(`${BASE}/project/${editingId.value}/backup`);
				const taskId = unwrapResult(res);
				if (taskId) {
					const task = trackTask(taskId, form.value.projectName, "backup");
					const stopWatch = watch(() => task.finished, (fin) => {
						if (fin) {
							stopWatch();
							loadBackups();
						}
					});
				} else message.error("备份触发失败");
			} catch {
				message.error("备份失败");
			} finally {
				backupActionLoading.value = false;
			}
		}
		async function handleRollbackTo(b) {
			if (editingId.value == null) return;
			try {
				await ElMessageBox.confirm(`确定用备份「${b.name}」回滚项目吗？当前未保存的状态将被覆盖。`, "回滚确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				const res = await http().post(`${BASE}/project/${editingId.value}/rollback?backup=${encodeURIComponent(b.name)}`);
				const taskId = unwrapResult(res);
				if (taskId) {
					const task = trackTask(taskId, form.value.projectName, "rollback");
					const stopWatch = watch(() => task.finished, (fin) => {
						if (fin) {
							stopWatch();
							loadBackups();
							loadList();
						}
					});
				} else message.error("回滚触发失败");
			} catch {
				message.error("回滚失败");
			}
		}
		watch(activeTab, (tab) => {
			if (tab === "backups" && editingId.value != null) loadBackups();
		});
		const unsubTaskRefresh = getGlobalSocketService()?.subscribe("project", "task", (msg) => {
			const data = msg?.data ?? msg;
			if (data && (data.phase === "COMPLETE" || data.phase === "ERROR")) loadList();
		});
		function goBack() {
			router.push("/release");
		}
		onMounted(() => {
			loadList();
			loadHostOs();
			nowTs.value = Date.now();
			runtimeTimer = setInterval(() => {
				nowTs.value = Date.now();
			}, 1e3);
		});
		onBeforeUnmount(() => {
			cleanupLog();
			unsubTaskRefresh?.();
			if (runtimeTimer) {
				clearInterval(runtimeTimer);
				runtimeTimer = null;
			}
		});
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReSectionHead = resolveComponent("ReSectionHead");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_el_tag = resolveComponent("el-tag");
			const _component_el_dropdown_item = resolveComponent("el-dropdown-item");
			const _component_el_dropdown_menu = resolveComponent("el-dropdown-menu");
			const _component_el_dropdown = resolveComponent("el-dropdown");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReFormItem = resolveComponent("ReFormItem");
			const _component_ReOption = resolveComponent("ReOption");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReIconSelect = resolveComponent("ReIconSelect");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReCommand = resolveComponent("ReCommand");
			const _component_el_switch = resolveComponent("el-switch");
			const _component_ReTab = resolveComponent("ReTab");
			const _component_ReDialog = resolveComponent("ReDialog");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_checkbox = resolveComponent("el-checkbox");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createVNode(_component_ReSectionHead, { description: "项目管理 · 启动/停止/重启/升级/备份/回滚，支持拖拽安装包到卡片升级" }, {
					title: withCtx(() => [createVNode(_component_ReButton, {
						icon: "Back",
						layout: "square",
						title: "返回发布管理",
						onClick: goBack,
						style: { "margin-right": "8px" }
					}), _cache[45] || (_cache[45] = createTextVNode(" 项目管理 ", -1))]),
					actions: withCtx(() => [createVNode(_component_ReButton, {
						icon: "Plus",
						"show-text": true,
						type: "primary",
						onClick: openCreateDialog
					}, {
						default: withCtx(() => [..._cache[46] || (_cache[46] = [createTextVNode("新增项目", -1)])]),
						_: 1
					})]),
					_: 1
				}),
				createBaseVNode("div", _hoisted_2, [!list.value.length ? (openBlock(), createBlock(_component_ReEmpty, {
					key: 0,
					description: "点击右上角「新增项目」创建项目",
					"image-size": 80,
					style: { "padding": "48px 0" }
				})) : (openBlock(), createElementBlock("div", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(list.value, (item) => {
					return openBlock(), createElementBlock("div", {
						key: item.id,
						class: normalizeClass(["project-card", {
							"is-dragover": dragOverId.value === item.id,
							"is-disabled": item.enabled === false
						}]),
						onDragover: withModifiers(($event) => item.enabled !== false && (dragOverId.value = item.id), ["prevent"]),
						onDragleave: _cache[0] || (_cache[0] = withModifiers(($event) => dragOverId.value = null, ["prevent"])),
						onDrop: withModifiers(($event) => onDropFile(item, $event), ["prevent"])
					}, [createBaseVNode("div", _hoisted_5, [createBaseVNode("div", { class: normalizeClass(["big-icon-wrap", item.status === "running" ? "running" : "stopped"]) }, [createVNode(_component_ReIcon, {
						name: displayIcon(item),
						class: "big-icon"
					}, null, 8, ["name"])], 2), createBaseVNode("span", { class: normalizeClass(["status-dot", item.status === "running" ? "running" : "stopped"]) }, null, 2)]), createBaseVNode("div", _hoisted_6, [
						createBaseVNode("div", _hoisted_7, [createBaseVNode("div", _hoisted_8, [createBaseVNode("h3", { title: item.projectName }, toDisplayString(item.projectName), 9, _hoisted_9), item.enabled === false ? (openBlock(), createBlock(_component_el_tag, {
							key: 0,
							type: "info",
							effect: "plain",
							round: ""
						}, {
							default: withCtx(() => [..._cache[47] || (_cache[47] = [createTextVNode("已禁用", -1)])]),
							_: 1
						})) : createCommentVNode("", true)]), createVNode(_component_el_tag, {
							effect: "plain",
							round: ""
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(typeLabel(item.projectType)), 1)]),
							_: 2
						}, 1024)]),
						createBaseVNode("div", _hoisted_10, [
							createBaseVNode("div", _hoisted_11, [createVNode(_component_ReIcon, {
								name: "FolderOpened",
								class: "info-ic"
							}), createBaseVNode("span", {
								class: "info-val",
								title: item.projectPath
							}, toDisplayString(item.projectPath || "未设置"), 9, _hoisted_12)]),
							createBaseVNode("div", _hoisted_13, [createVNode(_component_ReIcon, {
								name: "Document",
								class: "info-ic"
							}), createBaseVNode("span", {
								class: "info-val",
								title: item.logPath
							}, toDisplayString(item.logPath || "未设置"), 9, _hoisted_14)]),
							item.status === "running" && item.pid ? (openBlock(), createElementBlock("div", _hoisted_15, [createVNode(_component_ReIcon, {
								name: "Cpu",
								class: "info-ic"
							}), createBaseVNode("span", _hoisted_16, [_cache[48] || (_cache[48] = createTextVNode("PID：", -1)), createBaseVNode("b", _hoisted_17, toDisplayString(item.pid), 1)])])) : createCommentVNode("", true),
							item.status === "running" && item.runningSince ? (openBlock(), createElementBlock("div", _hoisted_18, [createVNode(_component_ReIcon, {
								name: "Timer",
								class: "info-ic"
							}), createBaseVNode("span", _hoisted_19, [_cache[49] || (_cache[49] = createTextVNode("运行时长：", -1)), createBaseVNode("b", _hoisted_20, toDisplayString(formatRuntime(item)), 1)])])) : createCommentVNode("", true),
							item.serviceName ? (openBlock(), createElementBlock("div", _hoisted_21, [createVNode(_component_ReIcon, {
								name: "Connection",
								class: "info-ic"
							}), _cache[50] || (_cache[50] = createBaseVNode("span", { class: "info-val service-badge" }, "已挂载系统服务", -1))])) : createCommentVNode("", true)
						]),
						createBaseVNode("div", _hoisted_22, [createVNode(_component_ReIcon, { name: "Upload" }), _cache[51] || (_cache[51] = createTextVNode(" 拖拽安装包到此卡片即可升级 ", -1))]),
						createBaseVNode("div", _hoisted_23, [item.enabled !== false ? (openBlock(), createElementBlock("div", _hoisted_24, [item.status !== "running" ? (openBlock(), createBlock(_component_ReButton, {
							key: 0,
							icon: "VideoPlay",
							layout: "square",
							title: "启动",
							onClick: ($event) => handleStart(item)
						}, null, 8, ["onClick"])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createVNode(_component_ReButton, {
							icon: "VideoPause",
							layout: "square",
							title: "停止",
							onClick: ($event) => handleStop(item)
						}, null, 8, ["onClick"]), createVNode(_component_ReButton, {
							icon: "RefreshRight",
							layout: "square",
							title: "重启",
							onClick: ($event) => handleRestart(item)
						}, null, 8, ["onClick"])], 64)), createVNode(_component_ReButton, {
							icon: "Top",
							layout: "square",
							title: "升级",
							onClick: ($event) => openUpgradeDialog(item)
						}, null, 8, ["onClick"])])) : (openBlock(), createElementBlock("div", _hoisted_25, "该项目已禁用，激活后可操作")), createBaseVNode("div", _hoisted_26, [createVNode(_component_el_dropdown, {
							trigger: "click",
							placement: "top",
							onCommand: (c) => onMoreCommand(item, c)
						}, {
							dropdown: withCtx(() => [createVNode(_component_el_dropdown_menu, null, {
								default: withCtx(() => [
									createVNode(_component_el_dropdown_item, { command: "edit" }, {
										default: withCtx(() => [createVNode(_component_ReIcon, {
											name: "EditPen",
											size: 15,
											class: "dd-ic"
										}), _cache[52] || (_cache[52] = createTextVNode("编辑 ", -1))]),
										_: 1
									}),
									item.enabled !== false && item.logPath ? (openBlock(), createBlock(_component_el_dropdown_item, {
										key: 0,
										command: "log"
									}, {
										default: withCtx(() => [createVNode(_component_ReIcon, {
											name: "Tickets",
											size: 15,
											class: "dd-ic"
										}), _cache[53] || (_cache[53] = createTextVNode("实时日志 ", -1))]),
										_: 1
									})) : createCommentVNode("", true),
									item.enabled !== false ? (openBlock(), createBlock(_component_el_dropdown_item, {
										key: 1,
										command: "backup"
									}, {
										default: withCtx(() => [createVNode(_component_ReIcon, {
											name: "FolderChecked",
											size: 15,
											class: "dd-ic"
										}), _cache[54] || (_cache[54] = createTextVNode("备份 ", -1))]),
										_: 1
									})) : createCommentVNode("", true),
									item.enabled !== false ? (openBlock(), createBlock(_component_el_dropdown_item, {
										key: 2,
										command: "rollback"
									}, {
										default: withCtx(() => [createVNode(_component_ReIcon, {
											name: "RefreshLeft",
											size: 15,
											class: "dd-ic"
										}), _cache[55] || (_cache[55] = createTextVNode("回滚 ", -1))]),
										_: 1
									})) : createCommentVNode("", true),
									createVNode(_component_el_dropdown_item, { command: "toggle" }, {
										default: withCtx(() => [createVNode(_component_ReIcon, {
											name: item.enabled === false ? "Unlock" : "Lock",
											size: 15,
											class: "dd-ic"
										}, null, 8, ["name"]), createTextVNode(toDisplayString(item.enabled === false ? "激活" : "禁用"), 1)]),
										_: 2
									}, 1024),
									createVNode(_component_el_dropdown_item, {
										command: "delete",
										divided: ""
									}, {
										default: withCtx(() => [createVNode(_component_ReIcon, {
											name: "Delete",
											size: 15,
											class: "dd-ic dd-danger"
										}), _cache[56] || (_cache[56] = createTextVNode("删除 ", -1))]),
										_: 1
									})
								]),
								_: 2
							}, 1024)]),
							default: withCtx(() => [createVNode(_component_ReButton, {
								icon: "MoreFilled",
								layout: "square",
								title: "更多"
							})]),
							_: 2
						}, 1032, ["onCommand"])])])
					])], 42, _hoisted_4);
				}), 128))]))]),
				createVNode(_component_ReDialog, {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => dialogVisible.value = $event),
					title: editingId.value != null ? "编辑项目" : "新增项目",
					width: "960px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[20] || (_cache[20] = ($event) => dialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[71] || (_cache[71] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						onClick: handleSave
					}, {
						default: withCtx(() => [..._cache[72] || (_cache[72] = [createTextVNode("保存", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createVNode(_component_ReTab, {
						modelValue: activeTab.value,
						"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => activeTab.value = $event),
						tabs: editTabs.value,
						class: "edit-tab"
					}, {
						basic: withCtx(() => [createBaseVNode("div", _hoisted_27, [createVNode(_component_ReForm, {
							model: form.value,
							"label-position": "top",
							class: "tab-form"
						}, {
							default: withCtx(() => [
								createVNode(_component_ReFormItem, {
									label: "项目名称",
									required: ""
								}, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.projectName,
										"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.value.projectName = $event),
										placeholder: "如：用户服务",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])]),
									_: 1
								}),
								createVNode(_component_ReFormItem, {
									label: "项目类型",
									required: ""
								}, {
									default: withCtx(() => [createVNode(_component_ReSelect, {
										modelValue: form.value.projectType,
										"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.value.projectType = $event),
										placeholder: "选择项目类型",
										style: { "width": "100%" }
									}, {
										default: withCtx(() => [
											createVNode(_component_ReOption, {
												label: "SpringBoot 单体",
												value: "springboot"
											}),
											createVNode(_component_ReOption, {
												label: "FatJar",
												value: "fatjar"
											}),
											createVNode(_component_ReOption, {
												label: "分离式部署",
												value: "separated"
											}),
											createVNode(_component_ReOption, {
												label: "静态页面",
												value: "static"
											}),
											createVNode(_component_ReOption, {
												label: "Nginx",
												value: "nginx"
											})
										]),
										_: 1
									}, 8, ["modelValue"])]),
									_: 1
								}),
								needsEntry.value ? (openBlock(), createBlock(_component_ReFormItem, {
									key: 0,
									label: "主入口名称",
									required: mainEntryRequired.value
								}, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.mainEntry,
										"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.value.mainEntry = $event),
										placeholder: entryPlaceholder.value,
										style: { "width": "100%" }
									}, null, 8, ["modelValue", "placeholder"])]),
									_: 1
								}, 8, ["required"])) : createCommentVNode("", true),
								createVNode(_component_ReFormItem, {
									label: "项目地址",
									required: ""
								}, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.projectPath,
										"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.projectPath = $event),
										placeholder: "如：/opt/app/user-service",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])]),
									_: 1
								}),
								createVNode(_component_ReFormItem, {
									label: "日志地址",
									required: ""
								}, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.logPath,
										"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.value.logPath = $event),
										placeholder: "如：/opt/app/user-service/logs/app.log",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])]),
									_: 1
								}),
								createVNode(_component_ReFormItem, { label: "重启时日志" }, {
									default: withCtx(() => [createVNode(_component_ReSelect, {
										modelValue: form.value.logMode,
										"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.value.logMode = $event),
										style: { "width": "100%" }
									}, {
										default: withCtx(() => [createVNode(_component_ReOption, {
											label: "追加（保留历史日志）",
											value: "append"
										}), createVNode(_component_ReOption, {
											label: "清空（重新写入）",
											value: "truncate"
										})]),
										_: 1
									}, 8, ["modelValue"])]),
									_: 1
								}),
								form.value.projectType === "separated" ? (openBlock(), createBlock(_component_ReFormItem, {
									key: 1,
									label: "配置目录（可选，相对项目地址，如 config）"
								}, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.configDir,
										"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.value.configDir = $event),
										placeholder: "如：config",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])]),
									_: 1
								})) : createCommentVNode("", true),
								form.value.projectType === "separated" ? (openBlock(), createBlock(_component_ReFormItem, {
									key: 2,
									label: "依赖库目录（可选，相对项目地址，如 lib）"
								}, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.libDir,
										"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.value.libDir = $event),
										placeholder: "如：lib",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])]),
									_: 1
								})) : createCommentVNode("", true),
								form.value.projectType === "nginx" ? (openBlock(), createBlock(_component_ReFormItem, {
									key: 3,
									label: "Nginx 目录（nginx 安装 / 配置目录）"
								}, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.nginxDir,
										"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => form.value.nginxDir = $event),
										placeholder: "如：/usr/local/nginx 或 ./nginx",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])]),
									_: 1
								})) : createCommentVNode("", true),
								createVNode(_component_ReFormItem, { label: "项目图标" }, {
									default: withCtx(() => [createVNode(_component_ReIconSelect, {
										modelValue: form.value.icon,
										"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.value.icon = $event),
										placeholder: "留空则按类型使用默认图标",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])]),
									_: 1
								}),
								createVNode(_component_ReFormItem, { label: "描述" }, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.description,
										"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.value.description = $event),
										type: "textarea",
										rows: 3,
										placeholder: "项目描述",
										style: { "width": "100%" }
									}, null, 8, ["modelValue"])]),
									_: 1
								})
							]),
							_: 1
						}, 8, ["model"])])]),
						scripts: withCtx(() => [createBaseVNode("div", _hoisted_28, [createBaseVNode("div", _hoisted_29, [createVNode(_component_ReIcon, {
							name: "MagicStick",
							class: "sa-ic"
						}), createBaseVNode("div", null, [_cache[57] || (_cache[57] = createBaseVNode("div", { class: "sa-title" }, "一键生成脚本", -1)), createBaseVNode("div", _hoisted_30, toDisplayString(anyScriptEmpty.value ? "脚本未填写完整，点右侧按 项目地址/日志/主入口 生成" : "可用内置模板一键覆盖为 启动·停止·重启·状态 四个命令"), 1)])]), createVNode(_component_ReButton, {
							icon: "MagicStick",
							type: "primary",
							loading: autogenLoading.value,
							onClick: autoGenerateScripts
						}, {
							default: withCtx(() => [..._cache[58] || (_cache[58] = [createTextVNode("一键生成四个脚本", -1)])]),
							_: 1
						}, 8, ["loading"])]), createBaseVNode("div", _hoisted_31, [
							createVNode(_component_ReCommand, {
								modelValue: form.value.startScript,
								"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => form.value.startScript = $event),
								context: scriptContext.value,
								os: hostOs.value,
								"project-type": form.value.projectType,
								label: "启动命令",
								rows: 4,
								"script-kind": "start"
							}, null, 8, [
								"modelValue",
								"context",
								"os",
								"project-type"
							]),
							createVNode(_component_ReCommand, {
								modelValue: form.value.stopScript,
								"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => form.value.stopScript = $event),
								context: scriptContext.value,
								os: hostOs.value,
								"project-type": form.value.projectType,
								label: "停止命令",
								rows: 4,
								"script-kind": "stop"
							}, null, 8, [
								"modelValue",
								"context",
								"os",
								"project-type"
							]),
							createVNode(_component_ReCommand, {
								modelValue: form.value.restartScript,
								"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => form.value.restartScript = $event),
								context: scriptContext.value,
								os: hostOs.value,
								"project-type": form.value.projectType,
								label: "重启命令",
								rows: 4,
								"script-kind": "restart"
							}, null, 8, [
								"modelValue",
								"context",
								"os",
								"project-type"
							]),
							createVNode(_component_ReCommand, {
								modelValue: form.value.statusScript,
								"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => form.value.statusScript = $event),
								context: scriptContext.value,
								os: hostOs.value,
								"project-type": form.value.projectType,
								label: "状态命令",
								rows: 3,
								"script-kind": "status"
							}, null, 8, [
								"modelValue",
								"context",
								"os",
								"project-type"
							])
						])]),
						vars: withCtx(() => [createBaseVNode("div", _hoisted_32, [supportsAppConfig.value ? (openBlock(), createElementBlock("div", _hoisted_33, [createBaseVNode("div", {
							class: "vars-card",
							onClick: openAppConfigDialog
						}, [
							createVNode(_component_ReIcon, {
								name: "Files",
								class: "vars-card-ic"
							}),
							createBaseVNode("div", _hoisted_34, [_cache[59] || (_cache[59] = createBaseVNode("div", { class: "vars-card-title" }, "项目配置（Spring Boot 外部配置）", -1)), createBaseVNode("div", _hoisted_35, toDisplayString(form.value.appConfig.length) + " 项 · 生成 config/application.properties 覆盖 jar 内配置", 1)]),
							createVNode(_component_ReButton, {
								icon: "ArrowRight",
								layout: "square",
								title: "编辑",
								onClick: withModifiers(openAppConfigDialog, ["stop"])
							})
						])])) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(varCards.value, (v) => {
							return openBlock(), createElementBlock("div", {
								key: v.cat,
								class: "vars-block"
							}, [createBaseVNode("div", {
								class: "vars-card",
								onClick: ($event) => openVarsDialog(v.cat)
							}, [
								createVNode(_component_ReIcon, {
									name: v.icon,
									class: "vars-card-ic"
								}, null, 8, ["name"]),
								createBaseVNode("div", _hoisted_37, [createBaseVNode("div", _hoisted_38, toDisplayString(v.title), 1), createBaseVNode("div", _hoisted_39, toDisplayString(v.count), 1)]),
								createVNode(_component_ReButton, {
									icon: varsExpanded.value === v.cat ? "ArrowDown" : "ArrowRight",
									layout: "square",
									title: varsExpanded.value === v.cat ? "折叠" : "展开",
									onClick: withModifiers(($event) => toggleVarsExpand(v.cat), ["stop"])
								}, null, 8, [
									"icon",
									"title",
									"onClick"
								])
							], 8, _hoisted_36), withDirectives(createBaseVNode("div", _hoisted_40, [!v.items.length ? (openBlock(), createElementBlock("div", _hoisted_41, "暂无配置，点击卡片添加")) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(v.items, (s, i) => {
								return openBlock(), createElementBlock("span", {
									key: i,
									class: "vars-chip"
								}, toDisplayString(s), 1);
							}), 128))], 512), [[vShow, varsExpanded.value === v.cat]])]);
						}), 128))])]),
						system: withCtx(() => [createBaseVNode("div", _hoisted_42, [createBaseVNode("div", _hoisted_43, [
							createBaseVNode("div", _hoisted_44, [
								createVNode(_component_ReIcon, {
									name: "Connection",
									class: "sys-head-ic"
								}),
								_cache[62] || (_cache[62] = createBaseVNode("div", { class: "sys-head-text" }, [createBaseVNode("div", { class: "sys-card-title" }, "系统服务"), createBaseVNode("div", { class: "sys-card-sub" }, "将项目挂载为系统服务，统一管理生命周期")], -1)),
								form.value.serviceName ? (openBlock(), createBlock(_component_el_tag, {
									key: 0,
									type: "success",
									effect: "light",
									round: ""
								}, {
									default: withCtx(() => [..._cache[60] || (_cache[60] = [createTextVNode("已挂载", -1)])]),
									_: 1
								})) : (openBlock(), createBlock(_component_el_tag, {
									key: 1,
									type: "info",
									effect: "plain",
									round: ""
								}, {
									default: withCtx(() => [..._cache[61] || (_cache[61] = [createTextVNode("未挂载", -1)])]),
									_: 1
								}))
							]),
							createVNode(_component_ReForm, {
								"label-position": "top",
								class: "sys-form"
							}, {
								default: withCtx(() => [createVNode(_component_ReFormItem, { label: "服务名称（留空自动生成；挂载后如需变更请先卸载）" }, {
									default: withCtx(() => [createVNode(_component_ReInput, {
										modelValue: form.value.serviceName,
										"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => form.value.serviceName = $event),
										disabled: !!form.value.serviceName,
										placeholder: `自动生成，如 ${serviceNamePreview.value}`
									}, null, 8, [
										"modelValue",
										"disabled",
										"placeholder"
									])]),
									_: 1
								})]),
								_: 1
							}),
							createBaseVNode("div", _hoisted_45, [createBaseVNode("div", _hoisted_46, [_cache[63] || (_cache[63] = createBaseVNode("div", { class: "ssw-text" }, [createBaseVNode("div", { class: "ssw-title" }, "开机自启动"), createBaseVNode("div", { class: "ssw-desc" }, "主机开机 / 登录后自动拉起项目")], -1)), createVNode(_component_el_switch, {
								modelValue: form.value.autostart,
								"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => form.value.autostart = $event)
							}, null, 8, ["modelValue"])]), createBaseVNode("div", _hoisted_47, [_cache[64] || (_cache[64] = createBaseVNode("div", { class: "ssw-text" }, [createBaseVNode("div", { class: "ssw-title" }, "守护进程"), createBaseVNode("div", { class: "ssw-desc" }, "定时检测状态，进程异常退出自动重启（需状态命令）")], -1)), createVNode(_component_el_switch, {
								modelValue: form.value.guardian,
								"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => form.value.guardian = $event)
							}, null, 8, ["modelValue"])])]),
							createBaseVNode("div", _hoisted_48, [!form.value.serviceName ? (openBlock(), createBlock(_component_ReButton, {
								key: 0,
								icon: "Connection",
								type: "primary",
								onClick: handleInstallService
							}, {
								default: withCtx(() => [..._cache[65] || (_cache[65] = [createTextVNode("挂载系统服务", -1)])]),
								_: 1
							})) : (openBlock(), createBlock(_component_ReButton, {
								key: 1,
								icon: "Delete",
								type: "danger",
								onClick: handleUninstallService
							}, {
								default: withCtx(() => [..._cache[66] || (_cache[66] = [createTextVNode("卸载系统服务", -1)])]),
								_: 1
							}))])
						])])]),
						backups: withCtx(() => [createBaseVNode("div", _hoisted_49, [createBaseVNode("div", _hoisted_50, [
							createVNode(_component_ReIcon, {
								name: "Files",
								class: "bk-toolbar-ic"
							}),
							_cache[68] || (_cache[68] = createBaseVNode("div", { class: "bk-toolbar-text" }, [createBaseVNode("div", { class: "bk-title" }, "备份记录"), createBaseVNode("div", { class: "bk-sub" }, "备份保存在项目目录 backups/ 下，可用于升级前备份与回滚")], -1)),
							createVNode(_component_ReButton, {
								icon: "FolderChecked",
								type: "primary",
								loading: backupActionLoading.value,
								onClick: handleBackupNow
							}, {
								default: withCtx(() => [..._cache[67] || (_cache[67] = [createTextVNode("立即备份", -1)])]),
								_: 1
							}, 8, ["loading"])
						]), backupLoading.value ? (openBlock(), createElementBlock("div", _hoisted_51, "加载备份记录…")) : !backupRows.value.length ? (openBlock(), createElementBlock("div", _hoisted_52, [createVNode(_component_ReIcon, {
							name: "FolderOpened",
							size: 30
						}), _cache[69] || (_cache[69] = createBaseVNode("div", null, "暂无备份记录，点击右上角「立即备份」创建", -1))])) : (openBlock(), createElementBlock("div", _hoisted_53, [(openBlock(true), createElementBlock(Fragment, null, renderList(backupRows.value, (b) => {
							return openBlock(), createElementBlock("div", {
								key: b.name,
								class: "bk-row"
							}, [
								createVNode(_component_ReIcon, {
									name: b.kind === "dir" ? "Folder" : "Document",
									class: "bk-row-ic"
								}, null, 8, ["name"]),
								createBaseVNode("div", _hoisted_54, [createBaseVNode("div", _hoisted_55, toDisplayString(b.name), 1), createBaseVNode("div", _hoisted_56, [createTextVNode(toDisplayString(formatBackupTime(b.time)) + " · " + toDisplayString(b.kind === "dir" ? "目录镜像" : "压缩包"), 1), b.size != null ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode(" · " + toDisplayString(formatSize(b.size)), 1)], 64)) : createCommentVNode("", true)])]),
								createVNode(_component_ReButton, {
									icon: "RefreshLeft",
									onClick: ($event) => handleRollbackTo(b)
								}, {
									default: withCtx(() => [..._cache[70] || (_cache[70] = [createTextVNode("回滚", -1)])]),
									_: 1
								}, 8, ["onClick"])
							]);
						}), 128))]))])]),
						_: 1
					}, 8, ["modelValue", "tabs"])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: varsVisible.value,
					"onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => varsVisible.value = $event),
					title: "变量设置",
					width: "720px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[31] || (_cache[31] = ($event) => varsVisible.value = false) }, {
						default: withCtx(() => [..._cache[75] || (_cache[75] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						onClick: confirmVars
					}, {
						default: withCtx(() => [..._cache[76] || (_cache[76] = [createTextVNode("确定", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [
						createBaseVNode("div", _hoisted_57, [
							createBaseVNode("span", {
								class: normalizeClass(["vd-cat", { active: varsCategory.value === "env" }]),
								onClick: _cache[22] || (_cache[22] = ($event) => varsCategory.value = "env")
							}, "环境变量", 2),
							createBaseVNode("span", {
								class: normalizeClass(["vd-cat", { active: varsCategory.value === "jvm" }]),
								onClick: _cache[23] || (_cache[23] = ($event) => varsCategory.value = "jvm")
							}, "JVM 参数", 2),
							createBaseVNode("span", {
								class: normalizeClass(["vd-cat", { active: varsCategory.value === "app" }]),
								onClick: _cache[24] || (_cache[24] = ($event) => varsCategory.value = "app")
							}, "命令参数", 2)
						]),
						createBaseVNode("div", _hoisted_58, [
							_cache[73] || (_cache[73] = createBaseVNode("span", { class: "vd-ph-hint" }, "值支持占位符，执行时解析：", -1)),
							createBaseVNode("span", {
								class: "vd-ph-chip",
								onClick: _cache[25] || (_cache[25] = ($event) => insertPlaceholder("${KEY:默认值}"))
							}, "${KEY:默认值}"),
							createBaseVNode("span", {
								class: "vd-ph-chip",
								onClick: _cache[26] || (_cache[26] = ($event) => insertPlaceholder("${now(yyyy-MM-dd)}"))
							}, "${now(yyyy-MM-dd)}"),
							createBaseVNode("span", {
								class: "vd-ph-chip",
								onClick: _cache[27] || (_cache[27] = ($event) => insertPlaceholder("${now(yyyyMMddHHmmss)}"))
							}, "${now(时间戳)}"),
							createBaseVNode("span", {
								class: "vd-ph-chip",
								onClick: _cache[28] || (_cache[28] = ($event) => insertPlaceholder("${uuid}"))
							}, "${uuid}"),
							createBaseVNode("span", {
								class: "vd-ph-chip",
								onClick: _cache[29] || (_cache[29] = ($event) => insertPlaceholder("${random(100)}"))
							}, "${random(n)}")
						]),
						createBaseVNode("div", _hoisted_59, [(openBlock(true), createElementBlock(Fragment, null, renderList(varsRows.value, (row, idx) => {
							return openBlock(), createElementBlock("div", {
								key: idx,
								class: "vd-row"
							}, [
								createVNode(_component_el_select, {
									modelValue: row.key,
									"onUpdate:modelValue": ($event) => row.key = $event,
									filterable: "",
									"allow-create": "",
									"default-first-option": "",
									"reserve-keyword": false,
									class: "vd-key",
									placeholder: keyPlaceholder.value
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(currentCatalog.value, (o) => {
										return openBlock(), createBlock(_component_el_option, {
											key: o.flag,
											label: o.flag,
											value: o.flag
										}, {
											default: withCtx(() => [createBaseVNode("span", _hoisted_60, toDisplayString(o.flag), 1), createBaseVNode("span", _hoisted_61, toDisplayString(o.desc), 1)]),
											_: 2
										}, 1032, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"placeholder"
								]),
								!isBooleanRow(row) ? (openBlock(), createBlock(_component_el_input, {
									key: 0,
									modelValue: row.value,
									"onUpdate:modelValue": ($event) => row.value = $event,
									class: "vd-val",
									placeholder: valuePlaceholder.value,
									onFocus: onValFocus
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"placeholder"
								])) : (openBlock(), createElementBlock("span", _hoisted_62, "开关项（无需值）")),
								createVNode(_component_ReButton, {
									icon: "Close",
									layout: "square",
									title: "移除",
									onClick: ($event) => varsRows.value.splice(idx, 1)
								}, null, 8, ["onClick"])
							]);
						}), 128)), createVNode(_component_ReButton, {
							icon: "Plus",
							"show-text": true,
							class: "vd-add",
							onClick: _cache[30] || (_cache[30] = ($event) => varsRows.value.push({
								key: "",
								value: ""
							}))
						}, {
							default: withCtx(() => [..._cache[74] || (_cache[74] = [createTextVNode("添加一行", -1)])]),
							_: 1
						})])
					]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(_component_ReDialog, {
					modelValue: appCfgVisible.value,
					"onUpdate:modelValue": _cache[35] || (_cache[35] = ($event) => appCfgVisible.value = $event),
					title: "项目配置 · Spring Boot 外部配置",
					width: "720px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[34] || (_cache[34] = ($event) => appCfgVisible.value = false) }, {
						default: withCtx(() => [..._cache[78] || (_cache[78] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						onClick: confirmAppConfig
					}, {
						default: withCtx(() => [..._cache[79] || (_cache[79] = [createTextVNode("确定", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [_cache[80] || (_cache[80] = createBaseVNode("div", { class: "acfg-tip" }, [
						createTextVNode(" 保存后在项目目录生成 "),
						createBaseVNode("code", null, "config/application.properties"),
						createTextVNode("，Spring Boot 会自动加载且优先级高于 jar 内配置。 ")
					], -1)), createBaseVNode("div", _hoisted_63, [(openBlock(true), createElementBlock(Fragment, null, renderList(appCfgRows.value, (row, idx) => {
						return openBlock(), createElementBlock("div", {
							key: idx,
							class: "vd-row"
						}, [
							createVNode(_component_el_input, {
								modelValue: row.key,
								"onUpdate:modelValue": ($event) => row.key = $event,
								class: "vd-key-acfg",
								placeholder: "配置键，如 server.port"
							}, null, 8, ["modelValue", "onUpdate:modelValue"]),
							createVNode(_component_el_input, {
								modelValue: row.value,
								"onUpdate:modelValue": ($event) => row.value = $event,
								class: "vd-val",
								placeholder: "配置值，如 8081"
							}, null, 8, ["modelValue", "onUpdate:modelValue"]),
							createVNode(_component_ReButton, {
								icon: "Close",
								layout: "square",
								title: "移除",
								onClick: ($event) => appCfgRows.value.splice(idx, 1)
							}, null, 8, ["onClick"])
						]);
					}), 128)), createVNode(_component_ReButton, {
						icon: "Plus",
						"show-text": true,
						class: "vd-add",
						onClick: _cache[33] || (_cache[33] = ($event) => appCfgRows.value.push({
							key: "",
							value: ""
						}))
					}, {
						default: withCtx(() => [..._cache[77] || (_cache[77] = [createTextVNode("添加一项", -1)])]),
						_: 1
					})])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(_component_ReDialog, {
					modelValue: upgVisible.value,
					"onUpdate:modelValue": _cache[42] || (_cache[42] = ($event) => upgVisible.value = $event),
					title: `升级项目 · ${upgProject.value?.projectName || ""}`,
					width: "560px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [
						createVNode(_component_ReButton, { onClick: saveGlobalConfig }, {
							default: withCtx(() => [..._cache[85] || (_cache[85] = [createTextVNode("保存为全局默认", -1)])]),
							_: 1
						}),
						createVNode(_component_ReButton, { onClick: _cache[41] || (_cache[41] = ($event) => upgVisible.value = false) }, {
							default: withCtx(() => [..._cache[86] || (_cache[86] = [createTextVNode("取消", -1)])]),
							_: 1
						}),
						createVNode(_component_ReButton, {
							type: "primary",
							onClick: executeUpgrade
						}, {
							default: withCtx(() => [..._cache[87] || (_cache[87] = [createTextVNode("执行升级", -1)])]),
							_: 1
						})
					]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_64, [createVNode(_component_ReForm, { "label-position": "top" }, {
						default: withCtx(() => [createVNode(_component_ReFormItem, { label: "安装包路径（主机上的绝对路径，jar / tar.gz / zip；为空则仅执行重启）" }, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: upgForm.value.packagePath,
								"onUpdate:modelValue": _cache[36] || (_cache[36] = ($event) => upgForm.value.packagePath = $event),
								placeholder: "如：/home/ubuntu/uploads/app.tar.gz"
							}, null, 8, ["modelValue"])]),
							_: 1
						})]),
						_: 1
					}), createBaseVNode("div", _hoisted_65, [
						createBaseVNode("label", _hoisted_66, [createVNode(_component_el_checkbox, {
							modelValue: upgForm.value.autoBackup,
							"onUpdate:modelValue": _cache[37] || (_cache[37] = ($event) => upgForm.value.autoBackup = $event)
						}, null, 8, ["modelValue"]), _cache[81] || (_cache[81] = createTextVNode("自动备份", -1))]),
						createBaseVNode("label", _hoisted_67, [createVNode(_component_el_checkbox, {
							modelValue: upgForm.value.autoExtract,
							"onUpdate:modelValue": _cache[38] || (_cache[38] = ($event) => upgForm.value.autoExtract = $event)
						}, null, 8, ["modelValue"]), _cache[82] || (_cache[82] = createTextVNode("自动解压（压缩包）", -1))]),
						createBaseVNode("label", _hoisted_68, [createVNode(_component_el_checkbox, {
							modelValue: upgForm.value.autoRestart,
							"onUpdate:modelValue": _cache[39] || (_cache[39] = ($event) => upgForm.value.autoRestart = $event)
						}, null, 8, ["modelValue"]), _cache[83] || (_cache[83] = createTextVNode("自动重启", -1))]),
						createBaseVNode("label", _hoisted_69, [createVNode(_component_el_checkbox, {
							modelValue: upgForm.value.autoRollback,
							"onUpdate:modelValue": _cache[40] || (_cache[40] = ($event) => upgForm.value.autoRollback = $event)
						}, null, 8, ["modelValue"]), _cache[84] || (_cache[84] = createTextVNode("失败自动回滚（需状态命令）", -1))])
					])])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: logDialogVisible.value,
					"onUpdate:modelValue": _cache[44] || (_cache[44] = ($event) => logDialogVisible.value = $event),
					title: `实时日志 - ${currentLogProject.value?.projectName || ""}`,
					width: "820px",
					"close-on-click-modal": false
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[43] || (_cache[43] = ($event) => logDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[90] || (_cache[90] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_70, [
						createBaseVNode("div", {
							ref_key: "logBoxEl",
							ref: logBoxEl,
							class: "log-container",
							onScroll: onLogScroll
						}, [(openBlock(true), createElementBlock(Fragment, null, renderList(logLines.value, (line, i) => {
							return openBlock(), createElementBlock("div", {
								key: i,
								class: "log-line"
							}, toDisplayString(line || " "), 1);
						}), 128)), !logLines.value.length ? (openBlock(), createElementBlock("div", _hoisted_71, "等待日志输出…")) : createCommentVNode("", true)], 544),
						createBaseVNode("div", { class: normalizeClass(["log-state", { paused: !logAutoScroll.value }]) }, [_cache[88] || (_cache[88] = createBaseVNode("span", { class: "ls-dot" }, null, -1)), createTextVNode(toDisplayString(logAutoScroll.value ? "自动滚动" : "已暂停跟随"), 1)], 2),
						createVNode(Transition, { name: "ls-fade" }, {
							default: withCtx(() => [!logAutoScroll.value ? (openBlock(), createElementBlock("div", {
								key: 0,
								class: "log-resume",
								onClick: resumeLogScroll
							}, [createVNode(_component_ReIcon, {
								name: "Bottom",
								size: 14
							}), _cache[89] || (_cache[89] = createTextVNode("回到底部 ", -1))])) : createCommentVNode("", true)]),
							_: 1
						})
					])]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-43c041bb"]]);
//#endregion
export { ProjectsView_default as default };
