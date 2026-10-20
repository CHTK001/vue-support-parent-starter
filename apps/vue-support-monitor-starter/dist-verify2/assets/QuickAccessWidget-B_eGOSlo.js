import { Ct as resolveDirective, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as getMenuLanguage } from "./src-BVnZQO9c.js";
import { Et as plus_default, Ht as setting_default, P as data_board_default, Qt as tools_default, V as document_default, Z as folder_default, an as user_default, at as info_filled_default, c as bell_default, et as grid_default, g as chat_dot_square_default, gt as message_default, ht as menu_default, lt as link_default, q as files_default, st as key_default, vt as monitor_default, w as close_default } from "./dist-DogtK295.js";
import { yt as message } from "./src-CEonioA3.js";
import "./src-DDwlSqPX.js";
import { t as IndexedDBStore } from "./indexeddb-8Dvu0tZo.js";
import { t as authStore } from "./auth-C8MLoNwd.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/QuickAccessWidget.vue?vue&type=script&setup=true&name=QuickAccessWidget&lang.ts
var _hoisted_1 = { class: "qw" };
var _hoisted_2 = {
	key: 0,
	class: "qw__header"
};
var _hoisted_3 = { class: "qw__title" };
var _hoisted_4 = { class: "qw__body" };
var _hoisted_5 = {
	key: 0,
	class: "qw__empty"
};
var _hoisted_6 = {
	key: 1,
	class: "qw__grid"
};
var _hoisted_7 = ["title", "onClick"];
var _hoisted_8 = { class: "qw__item-icon" };
var _hoisted_9 = ["src", "onError"];
var _hoisted_10 = { class: "qw__item-title" };
var _hoisted_11 = [
	"title",
	"aria-label",
	"onClick"
];
var _hoisted_12 = { class: "text-xs text-[var(--el-text-color-disabled)] ml-2" };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/QuickAccessWidget.vue
var QuickAccessWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "QuickAccessWidget",
	props: { widget: {} },
	setup(__props) {
		const router = useRouter();
		const authStore$1 = authStore();
		const iconMap = {
			Grid: grid_default,
			Link: link_default,
			Menu: menu_default,
			Setting: setting_default,
			User: user_default,
			Document: document_default,
			DataBoard: data_board_default,
			Monitor: monitor_default,
			ChatDotSquare: chat_dot_square_default,
			Message: message_default,
			Bell: bell_default,
			Key: key_default,
			Files: files_default,
			Folder: folder_default,
			Tools: tools_default,
			InfoFilled: info_filled_default
		};
		/**
		* 品牌 logo 图库（@repo/images/brand/），按域名 key 索引。
		*
		* <p>{@code import: "default"} 时运行时取的是模块的 default 导出（字符串），但 Vite 的
		* {@code import.meta.glob} 泛型标注的是**模块**类型，于是 TS 推出
		* {@code Record<string, { default: string }>}，直接断言成 {@code Record<string, string>}
		* 属于「无充分重叠」的错误断言。这里经 unknown 过渡一次并注明原因。</p>
		*/
		const brandImages = /* #__PURE__ */ Object.assign({});
		/** 域名 → 品牌图片路径 */
		function brandForDomain(domain) {
			const key = domain.replace(/^www\./, "").split(".")[0].toLowerCase();
			for (const [path, img] of Object.entries(brandImages)) if ((path.split("/").pop()?.replace(/\.webp$/, "").replace(/-1$/, "").toLowerCase() ?? "") === key) return img;
		}
		const store = new IndexedDBStore({
			dbName: "koi-home-quickaccess",
			storeName: "items",
			keyPath: "id",
			version: 1
		});
		const customItems = ref([]);
		const loading = ref(true);
		const dialogVisible = ref(false);
		/** 记录图片加载失败的快捷项（回退到 Element 图标） */
		const imgFailed = reactive({});
		const form = reactive({
			type: "route",
			routePath: "",
			linkTitle: "",
			linkUrl: ""
		});
		/** 展平系统菜单叶子节点（标题经 getMenuLanguage 翻译） */
		const systemItems = computed(() => {
			const result = [];
			function walk(list) {
				list.forEach((m) => {
					if (m.children?.length) walk(m.children);
					else if (m.path && m.meta?.title) result.push({
						title: getMenuLanguage(m.meta.title),
						path: m.path,
						icon: m.meta?.icon,
						isSystem: true
					});
				});
			}
			walk(authStore$1.recursiveMenuList || []);
			return result;
		});
		/** 路由下拉选项 */
		const routeOptions = computed(() => systemItems.value.map((m) => ({
			path: m.path,
			title: m.title
		})));
		/** 合并系统 + 自定义 */
		const merged = computed(() => {
			const sys = systemItems.value.map((m) => ({
				...m,
				id: "sys_" + m.path
			}));
			return [...customItems.value.map((m) => ({
				...m,
				id: m.id ?? "cust_" + Math.random()
			})), ...sys].slice(0, 30);
		});
		async function load() {
			loading.value = true;
			try {
				customItems.value = await store.getAll();
			} catch {} finally {
				loading.value = false;
			}
		}
		async function remove(id) {
			customItems.value = customItems.value.filter((x) => x.id !== id);
			await store.remove(id);
		}
		function go(item) {
			if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
			else if (item.path) router.push(item.path).catch(() => void 0);
		}
		function openAdd() {
			form.type = "route";
			form.routePath = "";
			form.linkTitle = "";
			form.linkUrl = "";
			dialogVisible.value = true;
		}
		async function save() {
			const now = Date.now();
			if (form.type === "route") {
				if (!form.routePath) {
					message.warning("请选择系统路由");
					return;
				}
				const found = systemItems.value.find((m) => m.path === form.routePath);
				if (!found) return;
				const item = {
					id: "cust_" + now,
					title: found.title,
					path: found.path,
					icon: found.icon,
					isSystem: false
				};
				await store.put(item);
				customItems.value.push(item);
			} else {
				const title = form.linkTitle.trim();
				const url = form.linkUrl.trim();
				if (!title) {
					message.warning("请输入快捷名称");
					return;
				}
				if (!url) {
					message.warning("请输入链接地址");
					return;
				}
				const item = {
					id: "cust_" + now,
					title,
					url,
					icon: resolveIcon(url),
					isSystem: false
				};
				await store.put(item);
				customItems.value.push(item);
			}
			dialogVisible.value = false;
			message.success("已添加");
		}
		/** 判断是否为图片 URL（本地路径 / http 链接 / 数据 URL） */
		function isImageUrl(v) {
			return v.startsWith("/") || v.startsWith("http") || v.startsWith("data:");
		}
		/** 解析图标：优先本地品牌图库，其次在线 favicon */
		function resolveIcon(raw) {
			try {
				let url = raw.trim();
				if (!/^https?:\/\//i.test(url)) url = "https://" + url;
				const domain = new URL(url).hostname;
				const local = brandForDomain(domain);
				if (local) return local;
				return `https://${domain}/favicon.ico`;
			} catch {
				return;
			}
		}
		onMounted(() => load());
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_radio = resolveComponent("el-radio");
			const _component_el_radio_group = resolveComponent("el-radio-group");
			const _component_el_form_item = resolveComponent("el-form-item");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_form = resolveComponent("el-form");
			const _component_el_button = resolveComponent("el-button");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				!__props.widget.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(_component_el_icon, { class: "qw__title-icon" }, {
					default: withCtx(() => [createVNode(unref(grid_default))]),
					_: 1
				}), createBaseVNode("span", null, toDisplayString(__props.widget.title), 1)]), createBaseVNode("button", {
					type: "button",
					class: "qw__add-btn",
					title: "添加快捷",
					"aria-label": "添加快捷",
					onClick: openAdd
				}, [createVNode(_component_el_icon, null, {
					default: withCtx(() => [createVNode(unref(plus_default))]),
					_: 1
				})])])) : createCommentVNode("", true),
				withDirectives((openBlock(), createElementBlock("div", _hoisted_4, [!merged.value.length && !loading.value ? (openBlock(), createElementBlock("div", _hoisted_5, [
					createVNode(_component_el_icon, { size: 28 }, {
						default: withCtx(() => [createVNode(unref(grid_default))]),
						_: 1
					}),
					_cache[7] || (_cache[7] = createBaseVNode("span", null, "暂无快捷项", -1)),
					createBaseVNode("button", {
						type: "button",
						class: "qw__empty-btn",
						onClick: openAdd
					}, "添加一个")
				])) : (openBlock(), createElementBlock("div", _hoisted_6, [(openBlock(true), createElementBlock(Fragment, null, renderList(merged.value, (item) => {
					return openBlock(), createElementBlock("div", {
						key: item.id,
						class: "qw__item",
						title: item.title,
						onClick: ($event) => go(item)
					}, [
						createBaseVNode("div", _hoisted_8, [item.icon && isImageUrl(item.icon) && !imgFailed[item.id] ? (openBlock(), createElementBlock("img", {
							key: 0,
							src: item.icon,
							alt: "",
							class: "qw__item-img",
							onError: ($event) => imgFailed[item.id] = true
						}, null, 40, _hoisted_9)) : (openBlock(), createBlock(_component_el_icon, {
							key: 1,
							size: 20
						}, {
							default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(iconMap[item.icon ?? ""] || "Menu")))]),
							_: 2
						}, 1024))]),
						createBaseVNode("span", _hoisted_10, toDisplayString(item.title), 1),
						!item.isSystem ? (openBlock(), createElementBlock("button", {
							key: 0,
							type: "button",
							class: "qw__item-del",
							title: `删除 ${item.title}`,
							"aria-label": `删除 ${item.title}`,
							onClick: withModifiers(($event) => remove(item.id), ["stop"])
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(close_default))]),
							_: 1
						})], 8, _hoisted_11)) : createCommentVNode("", true)
					], 8, _hoisted_7);
				}), 128))]))])), [[_directive_loading, loading.value]]),
				createVNode(unref(component), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => dialogVisible.value = $event),
					title: "添加快捷",
					width: "440px",
					"close-on-click-modal": false,
					"append-to-body": "",
					onClose: _cache[6] || (_cache[6] = ($event) => dialogVisible.value = false)
				}, {
					footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[4] || (_cache[4] = ($event) => dialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_el_button, {
						type: "primary",
						onClick: save
					}, {
						default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("添加", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createVNode(_component_el_form, {
						"label-width": "70px",
						"label-position": "left"
					}, {
						default: withCtx(() => [
							createVNode(_component_el_form_item, { label: "类型" }, {
								default: withCtx(() => [createVNode(_component_el_radio_group, {
									modelValue: form.type,
									"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.type = $event)
								}, {
									default: withCtx(() => [createVNode(_component_el_radio, { value: "route" }, {
										default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("系统路由", -1)])]),
										_: 1
									}), createVNode(_component_el_radio, { value: "link" }, {
										default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("外部链接", -1)])]),
										_: 1
									})]),
									_: 1
								}, 8, ["modelValue"])]),
								_: 1
							}),
							form.type === "route" ? (openBlock(), createBlock(_component_el_form_item, {
								key: 0,
								label: "路由"
							}, {
								default: withCtx(() => [createVNode(_component_el_select, {
									modelValue: form.routePath,
									"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.routePath = $event),
									filterable: "",
									placeholder: "搜索系统菜单...",
									style: { "width": "100%" }
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(routeOptions.value, (r) => {
										return openBlock(), createBlock(_component_el_option, {
											key: r.path,
											label: r.title,
											value: r.path
										}, {
											default: withCtx(() => [createBaseVNode("span", null, toDisplayString(r.title), 1), createBaseVNode("span", _hoisted_12, toDisplayString(r.path), 1)]),
											_: 2
										}, 1032, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true),
							form.type === "link" ? (openBlock(), createBlock(_component_el_form_item, {
								key: 1,
								label: "名称"
							}, {
								default: withCtx(() => [createVNode(_component_el_input, {
									modelValue: form.linkTitle,
									"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.linkTitle = $event),
									maxlength: "20",
									placeholder: "快捷名称"
								}, null, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true),
							form.type === "link" ? (openBlock(), createBlock(_component_el_form_item, {
								key: 2,
								label: "链接"
							}, {
								default: withCtx(() => [createVNode(_component_el_input, {
									modelValue: form.linkUrl,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.linkUrl = $event),
									placeholder: "https://example.com",
									clearable: ""
								}, null, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true)
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-50ab078b"]]);
//#endregion
export { QuickAccessWidget_default as default };
