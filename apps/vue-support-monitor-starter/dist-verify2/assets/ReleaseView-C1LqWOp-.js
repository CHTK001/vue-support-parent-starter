import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { G as edit_pen_default, I as delete_default, a as arrow_right_default, dt as loading_default, l as box_default, q as files_default, vt as monitor_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { r as trackTask } from "./processTasks-COQ9xU4g.js";
import { n as osLabel, t as osIconSvg } from "./osIcon-CfmjFf8B.js";
//#region src/views/ReleaseView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "px tel-page" };
var _hoisted_2 = { class: "release-wrap" };
var _hoisted_3 = {
	key: 1,
	class: "card-grid"
};
var _hoisted_4 = ["onClick"];
var _hoisted_5 = ["src"];
var _hoisted_6 = ["innerHTML"];
var _hoisted_7 = { class: "media-os" };
var _hoisted_8 = { class: "card-content" };
var _hoisted_9 = ["onClick"];
var _hoisted_10 = ["onClick"];
var _hoisted_11 = { class: "content-top" };
var _hoisted_12 = ["title"];
var _hoisted_13 = { class: "proj-count" };
var _hoisted_14 = { class: "host-line" };
var _hoisted_15 = { class: "host-chip" };
var _hoisted_16 = { class: "host-ip" };
var _hoisted_17 = ["onClick"];
var _hoisted_18 = ["onClick"];
var _hoisted_19 = { class: "software-repo" };
var _hoisted_20 = { class: "search-bar" };
var _hoisted_21 = { class: "software-list" };
var _hoisted_22 = {
	key: 1,
	class: "loading-tip"
};
var _hoisted_23 = { class: "software-info" };
var _hoisted_24 = { class: "software-name" };
var _hoisted_25 = { class: "software-desc" };
var _hoisted_26 = {
	key: 0,
	class: "software-version"
};
var BASE = "/ms/server/release";
//#endregion
//#region src/views/ReleaseView.vue
var ReleaseView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReleaseView",
	setup(__props) {
		async function api(path) {
			const res = await http().get(BASE + path);
			return unwrapResult(res);
		}
		const router = useRouter();
		const list = ref([]);
		const hosts = ref([]);
		const counts = ref({});
		const dialogVisible = ref(false);
		const editingId = ref(null);
		const installDialogVisible = ref(false);
		const currentRelease = ref(null);
		const searching = ref(false);
		const searchResults = ref([]);
		/** 软件仓库对话框中固定显示的主机（当前发布绑定的主机） */
		const currentHostLabel = computed(() => {
			const h = hosts.value.find((x) => x.id === searchForm.value.hostId);
			if (h) return h.serverHostName + " (" + h.serverHostAddress + ")";
			return currentRelease.value?.hostIp || "未绑定主机";
		});
		const form = ref({
			releaseName: "",
			hostId: void 0,
			description: "",
			backgroundImage: ""
		});
		const searchForm = ref({
			hostId: void 0,
			keyword: ""
		});
		/** 平台类型 -> 样式类 */
		function osType(item) {
			const h = hosts.value.find((x) => x.id === item.hostId);
			const t = String(h?.serverHostOsType || "").toUpperCase();
			if (t === "WINDOWS") return "win";
			if (t === "MACOS") return "mac";
			return "linux";
		}
		/** 主机名称 */
		function hostNameOf(item) {
			const h = hosts.value.find((x) => x.id === item.hostId);
			return h ? h.serverHostName : "未绑定主机";
		}
		/** 主机平台类型（供平台图标/名称使用） */
		function hostOsOf(item) {
			return hosts.value.find((x) => x.id === item.hostId)?.serverHostOsType || "";
		}
		async function loadList() {
			try {
				const res = await api("/list");
				list.value = res || [];
				loadCounts();
			} catch (e) {
				message.error("加载发布列表失败");
			}
		}
		/** 并行加载每个发布的项目数量（一次性，非轮询） */
		async function loadCounts() {
			await Promise.all(list.value.map(async (r) => {
				try {
					const res = await http().get(`${BASE}/${r.id}/projects`);
					const projects = unwrapResult(res) || [];
					counts.value[r.id] = projects.length;
				} catch (e) {
					counts.value[r.id] = 0;
				}
			}));
		}
		async function loadHosts() {
			for (let attempt = 0; attempt < 3; attempt++) try {
				const res = await http().get("/ms/server/host");
				hosts.value = unwrapResult(res) || [];
				return;
			} catch (e) {
				console.error("加载主机列表失败:", e);
				if (attempt < 2) await new Promise((r) => setTimeout(r, 600));
			}
		}
		/** 打开对话框前确保主机列表已加载（首次失败也能在点击新增/编辑时重新拉取） */
		async function ensureHosts() {
			if (!hosts.value.length) await loadHosts();
		}
		async function openCreateDialog() {
			await ensureHosts();
			editingId.value = null;
			form.value = {
				releaseName: "",
				hostId: void 0,
				description: "",
				backgroundImage: ""
			};
			dialogVisible.value = true;
		}
		async function openEditDialog(item) {
			await ensureHosts();
			editingId.value = item.id;
			form.value = {
				releaseName: item.releaseName,
				hostId: item.hostId,
				description: item.description,
				backgroundImage: item.backgroundImage || ""
			};
			dialogVisible.value = true;
		}
		async function handleSave() {
			try {
				if (editingId.value != null) {
					await http().put(`/ms/server/release/${editingId.value}`).data(form.value);
					message.success("更新成功");
				} else {
					await http().post(BASE).data(form.value);
					message.success("创建成功");
				}
				dialogVisible.value = false;
				loadList();
			} catch (e) {
				message.error("保存失败");
			}
		}
		async function handleDelete(item) {
			try {
				await ElMessageBox.confirm(`确定删除发布「${item.releaseName}」吗？其下项目将一并删除。`, "提示", { type: "warning" });
				await http().delete(`/ms/server/release/${item.id}`);
				message.success("删除成功");
				loadList();
			} catch (e) {
				if (e !== "cancel") message.error("删除失败");
			}
		}
		function goToProjects(item) {
			router.push(`/projects?releaseId=${item.id}`);
		}
		async function openInstallDialog(item) {
			await ensureHosts();
			currentRelease.value = item;
			searchForm.value = {
				hostId: item.hostId,
				keyword: ""
			};
			searchResults.value = [];
			installDialogVisible.value = true;
		}
		async function handleSearch() {
			if (!searchForm.value.hostId) {
				message.warning("该发布未绑定主机，请先在编辑中选择主机");
				return;
			}
			if (!searchForm.value.keyword) {
				message.warning("请输入软件名称");
				return;
			}
			searching.value = true;
			searchResults.value = [];
			try {
				const res = await http().get("/ms/server/release/software/search").query({
					hostId: searchForm.value.hostId,
					keyword: searchForm.value.keyword
				}).timeout(3e4);
				searchResults.value = unwrapResult(res) || [];
			} catch (e) {
				message.error("搜索失败，请检查主机连接");
			} finally {
				searching.value = false;
			}
		}
		async function handleInstall(pkg) {
			if (!searchForm.value.hostId) {
				message.warning("该发布未绑定主机，请先在编辑中选择主机");
				return;
			}
			try {
				const res = await http().post("/ms/server/release/software/install").query({
					hostId: searchForm.value.hostId,
					name: pkg.name
				}).timeout(3e4);
				const taskId = unwrapResult(res);
				if (taskId) trackTask(taskId, pkg.name, "install");
			} catch (e) {
				message.error("安装触发失败");
			}
		}
		onMounted(() => {
			loadList();
			loadHosts();
		});
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReSectionHead = resolveComponent("ReSectionHead");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReFormItem = resolveComponent("ReFormItem");
			const _component_ReOption = resolveComponent("ReOption");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReDialog = resolveComponent("ReDialog");
			const _component_el_tag = resolveComponent("el-tag");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createVNode(_component_ReSectionHead, { description: "管理服务器发布与项目 · 支持启动/停止/重启/升级/备份/回滚" }, {
					title: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("发布管理", -1)])]),
					actions: withCtx(() => [createVNode(_component_ReButton, {
						icon: "Plus",
						"show-text": true,
						type: "primary",
						onClick: openCreateDialog
					}, {
						default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("新增发布", -1)])]),
						_: 1
					})]),
					_: 1
				}),
				createBaseVNode("div", _hoisted_2, [!list.value.length ? (openBlock(), createBlock(_component_ReEmpty, {
					key: 0,
					description: "点击右上角「新增发布」创建发布",
					"image-size": 80,
					style: { "padding": "56px 0" }
				})) : (openBlock(), createElementBlock("div", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(list.value, (item) => {
					return openBlock(), createElementBlock("div", {
						key: item.id,
						class: "release-card",
						onClick: ($event) => goToProjects(item)
					}, [createBaseVNode("div", { class: normalizeClass(["card-media", osType(item)]) }, [item.backgroundImage ? (openBlock(), createElementBlock("img", {
						key: 0,
						src: item.backgroundImage,
						class: "media-img",
						alt: ""
					}, null, 8, _hoisted_5)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("span", {
						class: "media-ico",
						innerHTML: unref(osIconSvg)(hostOsOf(item))
					}, null, 8, _hoisted_6), createBaseVNode("span", _hoisted_7, toDisplayString(unref(osLabel)(hostOsOf(item))), 1)], 64))], 2), createBaseVNode("div", _hoisted_8, [
						createBaseVNode("div", {
							class: "card-actions",
							onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
						}, [createBaseVNode("button", {
							class: "mini-ico",
							title: "编辑",
							onClick: ($event) => openEditDialog(item)
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(edit_pen_default))]),
							_: 1
						})], 8, _hoisted_9), createBaseVNode("button", {
							class: "mini-ico danger",
							title: "删除",
							onClick: ($event) => handleDelete(item)
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(delete_default))]),
							_: 1
						})], 8, _hoisted_10)]),
						createBaseVNode("div", _hoisted_11, [createBaseVNode("h3", {
							class: "release-name",
							title: item.releaseName
						}, toDisplayString(item.releaseName), 9, _hoisted_12), createBaseVNode("span", _hoisted_13, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(files_default))]),
							_: 1
						}), createTextVNode(toDisplayString(counts.value[item.id] ?? 0) + " 个项目 ", 1)])]),
						createBaseVNode("div", _hoisted_14, [createBaseVNode("span", _hoisted_15, toDisplayString(hostNameOf(item)), 1), createBaseVNode("span", _hoisted_16, toDisplayString(item.hostIp || "未绑定主机"), 1)]),
						createBaseVNode("p", { class: normalizeClass(["release-desc", { muted: !item.description }]) }, toDisplayString(item.description || "暂无描述，点击卡片添加项目"), 3),
						createBaseVNode("div", {
							class: "card-footer",
							onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
						}, [createBaseVNode("button", {
							class: "ghost-ico",
							title: "软件仓库",
							onClick: ($event) => openInstallDialog(item)
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(box_default))]),
							_: 1
						}), _cache[12] || (_cache[12] = createBaseVNode("span", null, "软件仓库", -1))], 8, _hoisted_17), createBaseVNode("button", {
							class: "enter-link",
							onClick: ($event) => goToProjects(item)
						}, [_cache[13] || (_cache[13] = createTextVNode(" 进入项目", -1)), createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(arrow_right_default))]),
							_: 1
						})], 8, _hoisted_18)])
					])], 8, _hoisted_4);
				}), 128))]))]),
				createVNode(_component_ReDialog, {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => dialogVisible.value = $event),
					title: editingId.value != null ? "编辑发布" : "新增发布",
					width: "500px"
				}, {
					footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[6] || (_cache[6] = ($event) => dialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_ReButton, {
						type: "primary",
						onClick: handleSave
					}, {
						default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode("保存", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createVNode(_component_ReForm, {
						model: form.value,
						"label-position": "top"
					}, {
						default: withCtx(() => [
							createVNode(_component_ReFormItem, { label: "发布名称" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.releaseName,
									"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.value.releaseName = $event),
									placeholder: "如：生产环境发布",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "主机" }, {
								default: withCtx(() => [createVNode(_component_ReSelect, {
									modelValue: form.value.hostId,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.value.hostId = $event),
									placeholder: "选择主机",
									style: { "width": "100%" },
									filterable: ""
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(hosts.value, (host) => {
										return openBlock(), createBlock(_component_ReOption, {
											key: host.id,
											label: host.serverHostName + " (" + host.serverHostAddress + ")",
											value: host.id
										}, null, 8, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "描述" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.description,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.description = $event),
									type: "textarea",
									rows: 3,
									placeholder: "发布描述",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_ReFormItem, { label: "背景图URL" }, {
								default: withCtx(() => [createVNode(_component_ReInput, {
									modelValue: form.value.backgroundImage,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.value.backgroundImage = $event),
									placeholder: "输入背景图URL（可选）",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["model"])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(_component_ReDialog, {
					modelValue: installDialogVisible.value,
					"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => installDialogVisible.value = $event),
					title: "软件仓库",
					width: "750px",
					"close-on-click-modal": false,
					"footer-hidden": true
				}, {
					default: withCtx(() => [createBaseVNode("div", _hoisted_19, [createBaseVNode("div", _hoisted_20, [
						createVNode(_component_el_tag, {
							size: "large",
							type: "info",
							effect: "plain",
							class: "host-tag"
						}, {
							default: withCtx(() => [createVNode(_component_el_icon, { style: {
								"vertical-align": "-2px",
								"margin-right": "4px"
							} }, {
								default: withCtx(() => [createVNode(unref(monitor_default))]),
								_: 1
							}), createTextVNode(toDisplayString(currentHostLabel.value), 1)]),
							_: 1
						}),
						createVNode(_component_ReInput, {
							modelValue: searchForm.value.keyword,
							"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => searchForm.value.keyword = $event),
							placeholder: "输入软件名称，如 nginx",
							style: { "flex": "1" },
							onKeyup: withKeys(handleSearch, ["enter"])
						}, null, 8, ["modelValue"]),
						createVNode(_component_ReButton, {
							type: "primary",
							icon: "Search",
							onClick: handleSearch
						}, {
							default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("查询", -1)])]),
							_: 1
						})
					]), createBaseVNode("div", _hoisted_21, [
						!searchResults.value.length && !searching.value ? (openBlock(), createBlock(_component_ReEmpty, {
							key: 0,
							description: searchForm.value.hostId ? "输入关键词搜索软件包" : "该发布未绑定主机",
							"image-size": 60
						}, null, 8, ["description"])) : createCommentVNode("", true),
						searching.value ? (openBlock(), createElementBlock("div", _hoisted_22, [createVNode(_component_el_icon, { class: "is-loading" }, {
							default: withCtx(() => [createVNode(unref(loading_default))]),
							_: 1
						}), _cache[17] || (_cache[17] = createBaseVNode("span", null, "正在搜索软件包...", -1))])) : createCommentVNode("", true),
						(openBlock(true), createElementBlock(Fragment, null, renderList(searchResults.value, (pkg) => {
							return openBlock(), createElementBlock("div", {
								key: pkg.name,
								class: "software-item"
							}, [createBaseVNode("div", _hoisted_23, [
								createBaseVNode("div", _hoisted_24, toDisplayString(pkg.name), 1),
								createBaseVNode("div", _hoisted_25, toDisplayString(pkg.summary || "暂无描述"), 1),
								pkg.version ? (openBlock(), createElementBlock("div", _hoisted_26, "版本: " + toDisplayString(pkg.version), 1)) : createCommentVNode("", true)
							]), createVNode(_component_ReButton, {
								type: "primary",
								icon: "Download",
								onClick: ($event) => handleInstall(pkg)
							}, {
								default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode("安装", -1)])]),
								_: 1
							}, 8, ["onClick"])]);
						}), 128))
					])])]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-876cd15a"]]);
//#endregion
export { ReleaseView_default as default };
