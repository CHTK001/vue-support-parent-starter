const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CardDropdown-w1QggEdu.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/popover-BedfGaMS.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/dist-DI3cGDuP.js","assets/aria-DKP9Ei-1.js","assets/tooltip-DEX5DBfd.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/isUndefined-DfHYomSZ.js","assets/dist-Clzx2YUA.js","assets/use-id-C2v-tXFq.js","assets/focus-trap-B31xXeBw.js","assets/use-z-index-Q40Vppe1.js","assets/use-aria-VmjVV7Ut.js","assets/pick-BwGnaelS.js","assets/_flatRest-CP5Zoeqo.js","assets/_baseFlatten-D6objHuc.js","assets/_arrayPush-DAsStFRE.js","assets/hasIn-COufhDdn.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/constants-ntbKDiND.js","assets/dropdown-BQYEchFy.js","assets/icon-C0dIJHSD.js","assets/dist-DogtK295.js","assets/rolldown-runtime-CEgmsyvS.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/CardDropdown-wLPHMGG9.css","assets/Square-CQw0yrpe.js","assets/ReIcon-mRxVAA3T.js","assets/icon-CKvLDnIU.js","assets/registry-Dp44ioVs.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/ReIcon-B6YUJqdV.css","assets/Square-CQkuNNTn.css","assets/Modern-C-35iCJ2.js","assets/Modern-Bs2LveSW.css","assets/modern-vars-DGJCsX_d.css"])))=>i.map(i=>d[i]);
import { $ as mergeModels, $n as normalizeClass, D as createVNode, Ft as useModel, Ht as watch, Nt as useAttrs, O as defineAsyncComponent, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tr as normalizeProps, v as createBlock, vn as ref, w as createSlots, xt as renderSlot, y as createCommentVNode, z as guardReactiveProps } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { r as ElSelect, t as ElOption } from "./select-0mzxLp1O.js";
import { t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
import { Qn as debounce, Zt as getApiHttp, t as useDataSource } from "./src-CEonioA3.js";
import { u as getStorageKey } from "./src-DzQcKxHP.js";
import { et as browserLocalStorage, nt as createStorage, tt as browserSessionStorage } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReSelect/ReSelect.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-select__bulk-actions"
};
var _hoisted_2 = { class: "re-select__table-head" };
var _hoisted_3 = {
	key: 0,
	class: "re-select__table-check"
};
var _hoisted_4 = ["onClick"];
var _hoisted_5 = ["onClick"];
//#endregion
//#region ../../packages/ui/src/components/ReSelect/ReSelect.vue
var ReSelect_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReSelect",
	inheritAttrs: true,
	__name: "ReSelect",
	props: /*@__PURE__*/ mergeModels({
		data: {
			type: [Array, Function],
			default: void 0
		},
		options: { default: void 0 },
		url: { default: "" },
		loader: {
			type: Function,
			default: void 0
		},
		params: { default: () => ({}) },
		cache: {
			type: Boolean,
			default: false
		},
		cacheTtl: { default: 3e5 },
		cacheKey: { default: "" },
		cacheStorage: { default: "session" },
		layout: { default: "default" },
		placeholder: { default: "请选择" },
		clearable: {
			type: Boolean,
			default: false
		},
		filterable: {
			type: Boolean,
			default: false
		},
		allowCreate: {
			type: Boolean,
			default: false
		},
		multiple: {
			type: Boolean,
			default: false
		},
		collapseTags: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		loading: {
			type: Boolean,
			default: false
		},
		type: { default: void 0 },
		size: { default: void 0 },
		popoverWidth: { default: 280 },
		tableColumns: { default: () => [] },
		autoReload: {
			type: Boolean,
			default: true
		},
		title: { default: "" },
		triggerIcon: {
			type: Boolean,
			default: true
		},
		iconOnly: {
			type: Boolean,
			default: true
		},
		vertical: {
			type: Boolean,
			default: false
		},
		compact: {
			type: Boolean,
			default: void 0
		},
		bulkActions: {
			type: Boolean,
			default: false
		}
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props, { expose: __expose }) {
		/**
		* ReSelect —— 下拉选择组件
		*
		* 多种布局模式：
		*   - "default"：原生 el-select 文本选项
		*   - "card"：卡片式下拉弹窗（支持标签/高阶标记/消耗说明/分组，popover 自动上下适配）
		*   - "card-dropdown"：已合并至 "card"（历史别名，行为相同）
		*   - "table"：表格形式（多列），适合用户列表等场景
		*   - "square"：正方形图标选择器，支持纯图标（默认）/ 图标+文字，直接展示所有选项；传 vertical 改为竖向档位菜单（一行一档）
		*
		* 尺寸：type="small | default | large" 对五种布局统一生效（size 为旧名，兼容保留）。
		*
		* 数据源（语义清晰，遵循 data=静态/函数、url=远程地址、loader=函数 三分原则）：
		*   1) data   —— 静态数组（也可用 options 别名）；**传函数则等价于 loader**，见下
		*   2) url    —— 远程接口地址，自动请求 + 防抖 + 重试（getApiHttp）
		*   3) loader —— 自定义加载函数 (params) => Promise<ReOption[]>，用于复杂场景
		*
		* 其中「传函数走远程」与 ReTable 的约定一致：:data 传函数即后端加载器，
		* 与 :loader 二选一；两者都传时以 data 的函数形态优先（同 ReTable）。
		*
		* 用法：
		*   <ReSelect :data="[{label:'男',value:1}]" />
		*   <ReSelect url="/api/roles" v-model="id" />
		*   <ReSelect :data="(p) => fetchRoles(p)" v-model="id" />
		*   <ReSelect :loader="(p) => fetchRoles(p)" v-model="id" />
		*
		* 远程结果缓存（cache=true 时生效，与 ReTable 同一套 cache / cacheTtl / cacheKey / cacheStorage）：
		*   同一「查询条件（params + keyword）」在 cacheTtl 内再次出现时直接读存档，不再请求；
		*   显式 reload() 绕过缓存一次并顺手写回，暴露 clearCache() 供增删改后主动失效。
		*/
		const CardDropdownLayout = defineAsyncComponent(() => __vitePreload(() => import("./CardDropdown-w1QggEdu.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35])));
		/** Square 布局组件（按需异步加载） */
		const SquareLayout = defineAsyncComponent(() => __vitePreload(() => import("./Square-CQw0yrpe.js"), __vite__mapDeps([36,1,34,37,32,33,38,4,5,6,7,8,9,10,11,12,27,28,39,40,41,42])));
		/** Modern 扁平布局组件（按需异步加载） */
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-C-35iCJ2.js"), __vite__mapDeps([43,1,34,44,45])));
		const model = useModel(__props, "modelValue");
		const props = __props;
		/** 是否为远程模式（url / loader / data 传函数） */
		const isRemote = computed(() => Boolean(props.url) || typeof props.loader === "function" || typeof props.data === "function");
		/**
		* 最终生效的尺寸档位：type 优先，size 作为兼容别名兜底。
		*
		* 抽成 computed 而不是各处写 props.type ?? props.size，是因为五种布局都要用，
		* 而 size 会被 v-bind="$attrs" / modernProps 透传到子布局，各处重复兜底容易漏。
		*/
		const controlSize = computed(() => props.type ?? props.size ?? "default");
		/** 静态模式下的最终数据（data 传数组优先，否则 options） */
		const staticData = computed(() => Array.isArray(props.data) ? props.data : props.options ?? []);
		/** 远程搜索关键词（当 filterable 时自动收集） */
		const keyword = ref("");
		/** 内置远程加载参数对象（合并 keyword + props.params） */
		const remoteParams = computed(() => {
			const base = { ...props.params ?? {} };
			if (props.filterable && keyword.value) base.keyword = keyword.value;
			return base;
		});
		/**
		* 缓存命名空间：显式 {@code cacheKey} 优先，缺省回落到 {@link url}。
		*
		* <p>空串 = 不缓存：既没传 cacheKey 又不是 url 模式（即仅有 loader 函数）时，
		* 无法定位这份缓存属于谁，硬存只会让不同下拉互相覆盖。此时 dev 下告警一次。</p>
		*/
		const cacheNamespace = computed(() => {
			if (!props.cache) return "";
			return props.cacheKey || props.url || "";
		});
		/**
		* 缓存载体：按 {@code cacheStorage} 选 session / local，并以命名空间为前缀建独立实例。
		*
		* <p>用带前缀的独立实例而不是裸的 localStore / sessionStore，是为了 {@link clearCache}
		* 的 {@code clear()} 只清本下拉这一份 —— 裸实例前缀为空，clear 会把同 storage 里的
		* 列配置、token 一起端掉。</p>
		*/
		const cacheStore = computed(() => {
			const ns = cacheNamespace.value;
			if (!ns) return null;
			return createStorage(props.cacheStorage === "local" ? browserLocalStorage : browserSessionStorage, { prefix: getStorageKey(`re-select-cache:${ns}`) });
		});
		/** 缓存是否生效：开关打开 + 命名空间定位得到 */
		const cacheEnabled = computed(() => cacheStore.value !== null);
		/**
		* 下一次取数强制走网络（显式 reload 用）。
		*
		* <p>「显式刷新」的语义就是「我要最新的」：绕过读缓存，拿到响应后照常写回。
		* 标志在 {@link buildRemoteSource} 的 run 里读一次即清零 —— 只影响紧接着的这一次取数。</p>
		*/
		let bypassCacheOnce = false;
		/** 条目 key = 查询指纹（params + keyword 全量参与，任一不同即另一批选项） */
		function buildCacheEntryKey(paramObj) {
			return JSON.stringify(paramObj);
		}
		/** 读缓存：命中且形状是数组才返回，否则一律当作未命中 */
		function readCachedOptions(entryKey) {
			const store = cacheStore.value;
			if (!store) return null;
			const cached = store.get(entryKey);
			return Array.isArray(cached) ? cached : null;
		}
		/** 写缓存；失败（隐私模式 / 配额满）由 StorageWrapper 内部吞掉，不影响本次取数 */
		function writeCachedOptions(entryKey, options) {
			const store = cacheStore.value;
			if (!store) return;
			const ttl = Number(props.cacheTtl);
			store.set(entryKey, options, Number.isFinite(ttl) && ttl > 0 ? Math.round(ttl) : 0);
		}
		/** 清空本下拉全部缓存条目（所有查询条件），供页面在增删改后主动失效 */
		function clearCache() {
			cacheStore.value?.clear();
		}
		onMounted(() => {
			if (props.cache && !cacheNamespace.value && false);
		});
		/**
		* 真正取数：data 传函数 / loader 模式直接调用用户函数，
		* url 模式用 getApiHttp（拦截器含加密/签名/重试）。
		*/
		async function fetchRemoteOptions(paramObj) {
			if (typeof props.data === "function") return await props.data(paramObj);
			if (typeof props.loader === "function") return await props.loader(paramObj);
			const qs = new URLSearchParams();
			for (const [k, v] of Object.entries(paramObj)) {
				if (v === void 0 || v === null || v === "") continue;
				qs.set(k, String(v));
			}
			const sep = props.url.includes("?") ? "&" : "?";
			const fullUrl = `${props.url}${qs.toString() ? sep + qs.toString() : ""}`;
			const body = await getApiHttp().get(fullUrl).then((r) => r.data);
			if (Array.isArray(body)) return body;
			if (body && typeof body === "object") {
				const obj = body;
				for (const key of [
					"records",
					"rows",
					"list",
					"items",
					"content",
					"data"
				]) if (Array.isArray(obj[key])) return obj[key];
			}
			return [];
		}
		/**
		* 远程加载函数（useDataSource 的 source）。
		*
		* <p>列表结果缓存也挂在这一层：先按查询指纹读档（显式 reload 的这次跳过），
		* 未命中才真正取数并写回。</p>
		*/
		function buildRemoteSource() {
			const run = async () => {
				const paramObj = { ...props.params ?? {} };
				if (props.filterable && keyword.value) paramObj.keyword = keyword.value;
				const bypass = bypassCacheOnce;
				bypassCacheOnce = false;
				const entryKey = cacheEnabled.value ? buildCacheEntryKey(paramObj) : "";
				if (entryKey && !bypass) {
					const cached = readCachedOptions(entryKey);
					if (cached) return cached;
				}
				try {
					const options = await fetchRemoteOptions(paramObj);
					if (entryKey) writeCachedOptions(entryKey, options);
					return options;
				} catch (e) {
					console.error("[ReSelect] 数据加载失败", e);
					return [];
				}
			};
			return run;
		}
		/** useDataSource 接受的 source */
		const sourceRef = computed(() => {
			if (isRemote.value) return buildRemoteSource();
			return staticData.value;
		});
		const { loading: dataLoading, data: dataList, reload: dsReload } = useDataSource(sourceRef);
		/**
		* 实际渲染给下拉的选项。
		*
		* <p>为什么需要：模板给 {@code ElSelect} 绑了 {@code :filter-method="onInput"}，
		* 而 Element Plus 的语义是「一旦提供 filter-method，内置过滤就不再生效，过滤完全交给该方法」。
		* 原先 {@code onInput} 只把关键词存进 {@code keyword}（那是给远程模式拼 keyword 参数用的），
		* 于是**本地静态选项的搜索框输入任何内容都不做过滤**——filterable 形同虚设。
		* 这里在本地模式下由组件自己按关键词过滤；远程模式维持原样（关键词交给数据源重新请求）。</p>
		*/
		const visibleList = computed(() => {
			const list = dataList.value ?? [];
			if (isRemote.value) return list;
			const kw = keyword.value.trim().toLowerCase();
			if (!kw) return list;
			return list.filter((o) => String(o.label ?? o.value ?? "").toLowerCase().includes(kw));
		});
		const debouncedReload = debounce(() => {
			if (isRemote.value) dsReload();
		}, 300);
		if (props.autoReload) watch([remoteParams], () => {
			debouncedReload();
		}, { deep: true });
		/** 当前选中项的标签拼接（用于回显） */
		const selectedLabels = computed(() => {
			const list = dataList.value ?? [];
			const v = model.value;
			if (v === null || v === void 0 || v === "") return "";
			const values = Array.isArray(v) ? v : [v];
			return list.filter((o) => values.includes(o.value)).map((o) => o.label).join(", ");
		});
		/** 根据单个选中值查找对应 label（multiple 模式下每个 tag 只显示自己的 label） */
		function labelFor(value) {
			const hit = (dataList.value ?? []).find((o) => o.value === value);
			if (hit) return hit.label;
			const v = model.value;
			return (Array.isArray(v) ? v : [v]).includes(value) ? String(value) : "";
		}
		/** 是否为富文本布局（table） */
		const isRichLayout = computed(() => props.layout === "table");
		/** 紧凑模式：square 布局默认开启，card/table/default 默认关闭（显式开关） */
		const isCompact = computed(() => props.compact ?? props.layout === "square");
		/** 多选切换 */
		function onToggleSelect(option) {
			if (props.disabled || option.disabled) return;
			const v = option.value;
			if (!props.multiple) {
				model.value = v;
				return;
			}
			const cur = Array.isArray(model.value) ? [...model.value] : [];
			const idx = cur.indexOf(v);
			if (idx >= 0) cur.splice(idx, 1);
			else cur.push(v);
			model.value = cur;
		}
		/** 是否已选中 */
		function isChecked(option) {
			const v = option.value;
			if (Array.isArray(model.value)) return model.value.includes(v);
			return model.value === v;
		}
		/** 全选（多选模式） */
		function selectAll() {
			if (props.disabled || !props.multiple) return;
			const all = (dataList.value ?? []).filter((o) => !o.disabled).map((o) => o.value);
			model.value = all;
		}
		/** 反选（多选模式） */
		function invertSelection() {
			if (props.disabled || !props.multiple) return;
			const cur = Array.isArray(model.value) ? [...model.value] : [];
			const curSet = new Set(cur);
			const result = [];
			for (const opt of dataList.value ?? []) if (opt.disabled) {
				if (curSet.has(opt.value)) result.push(opt.value);
			} else if (!curSet.has(opt.value)) result.push(opt.value);
			model.value = result;
		}
		function onInput(value) {
			keyword.value = value;
		}
		/** 透传给 Modern 布局的 props（排除 layout，避免循环分发） */
		const modernProps = computed(() => {
			const { layout: _, ...rest } = props;
			return rest;
		});
		const attrs = useAttrs();
		const modernBind = computed(() => ({
			...modernProps.value,
			...attrs
		}));
		/**
		* 显式重新加载：绕过缓存一次（拿到最新数据），拿到响应后照常写回存档。
		*
		* <p>与 ReTable 的 {@code reload()} 同一语义：默认的 params / keyword 变化重载仍走缓存，
		* 只有这里的显式刷新强制走网络。</p>
		*/
		function reload() {
			bypassCacheOnce = isRemote.value;
			return dsReload();
		}
		__expose({
			reload,
			clearCache,
			get loading() {
				return dataLoading.value;
			},
			get cacheEnabled() {
				return cacheEnabled.value;
			},
			get data() {
				return dataList.value;
			}
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [__props.layout === "modern" ? (openBlock(), createBlock(unref(ModernLayout), mergeProps({
				key: 0,
				modelValue: model.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => model.value = $event)
			}, modernBind.value), null, 16, ["modelValue"])) : createCommentVNode("", true), __props.layout === "card" || __props.layout === "card-dropdown" ? (openBlock(), createBlock(unref(CardDropdownLayout), mergeProps({
				key: 1,
				"model-value": model.value,
				"onUpdate:modelValue": _cache[1] || (_cache[1] = (v) => model.value = v),
				options: visibleList.value ?? [],
				multiple: __props.multiple,
				disabled: __props.disabled,
				loading: __props.loading || unref(dataLoading),
				filterable: __props.filterable,
				placeholder: __props.placeholder,
				title: __props.title,
				"trigger-icon": __props.triggerIcon,
				"popover-width": __props.popoverWidth,
				compact: isCompact.value,
				"bulk-actions": __props.bulkActions,
				"control-size": controlSize.value
			}, _ctx.$attrs), createSlots({ _: 2 }, [_ctx.$slots.option ? {
				name: "option",
				fn: withCtx((slotProps) => [renderSlot(_ctx.$slots, "option", normalizeProps(guardReactiveProps(slotProps)), void 0, true)]),
				key: "0"
			} : void 0]), 1040, [
				"model-value",
				"options",
				"multiple",
				"disabled",
				"loading",
				"filterable",
				"placeholder",
				"title",
				"trigger-icon",
				"popover-width",
				"compact",
				"bulk-actions",
				"control-size"
			])) : __props.layout === "square" ? (openBlock(), createBlock(unref(SquareLayout), mergeProps({
				key: 2,
				"model-value": model.value ?? "",
				"onUpdate:modelValue": _cache[2] || (_cache[2] = (v) => model.value = v),
				options: visibleList.value ?? [],
				multiple: __props.multiple,
				disabled: __props.disabled,
				"icon-only": __props.iconOnly,
				vertical: __props.vertical,
				compact: isCompact.value,
				"control-size": controlSize.value
			}, _ctx.$attrs), null, 16, [
				"model-value",
				"options",
				"multiple",
				"disabled",
				"icon-only",
				"vertical",
				"compact",
				"control-size"
			])) : (openBlock(), createBlock(unref(ElSelect), mergeProps({
				key: 3,
				modelValue: model.value,
				"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => model.value = $event)
			}, _ctx.$attrs, {
				placeholder: __props.placeholder,
				clearable: __props.clearable,
				filterable: __props.filterable,
				"allow-create": __props.allowCreate,
				"default-first-option": __props.allowCreate,
				multiple: __props.multiple,
				"collapse-tags": __props.collapseTags,
				disabled: __props.disabled,
				loading: __props.loading || unref(dataLoading),
				size: controlSize.value,
				"filter-method": onInput,
				"popper-class": isRichLayout.value ? "re-select__popper--rich" : "",
				teleported: true,
				class: ["re-select", [
					`re-select--${__props.layout}`,
					`re-select--${controlSize.value}`,
					{ "re-select--compact": isCompact.value }
				]]
			}), createSlots({
				default: withCtx(() => [__props.layout === "default" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [renderSlot(_ctx.$slots, "default", {}, void 0, true), (openBlock(true), createElementBlock(Fragment, null, renderList(visibleList.value ?? [], (opt) => {
					return openBlock(), createBlock(unref(ElOption), {
						key: String(opt.value),
						label: opt.label,
						value: opt.value,
						disabled: opt.disabled
					}, null, 8, [
						"label",
						"value",
						"disabled"
					]);
				}), 128))], 64)) : __props.layout === "table" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
					__props.multiple ? (openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("span", {
						class: "re-select__bulk-btn",
						onClick: withModifiers(selectAll, ["stop"])
					}, "全选"), createBaseVNode("span", {
						class: "re-select__bulk-btn",
						onClick: withModifiers(invertSelection, ["stop"])
					}, "反选")])) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tableColumns, (col) => {
						return openBlock(), createElementBlock("span", {
							key: col.key,
							style: normalizeStyle({ flex: col.width ? `0 0 ${typeof col.width === "number" ? col.width + "px" : col.width}` : "1" })
						}, toDisplayString(col.label), 5);
					}), 128)), __props.multiple ? (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString("已选"))) : createCommentVNode("", true)]),
					(openBlock(true), createElementBlock(Fragment, null, renderList(visibleList.value ?? [], (opt) => {
						return openBlock(), createBlock(unref(ElOption), {
							key: String(opt.value),
							label: opt.label,
							value: opt.value,
							disabled: opt.disabled,
							class: "re-select__option-table"
						}, {
							default: withCtx(() => [createBaseVNode("div", {
								class: normalizeClass(["re-select__table-row", { "re-select__table-row--checked": isChecked(opt) }]),
								onClick: withModifiers(($event) => onToggleSelect(opt), ["stop"])
							}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tableColumns, (col) => {
								return openBlock(), createElementBlock("span", {
									key: col.key,
									style: normalizeStyle({ flex: col.width ? `0 0 ${typeof col.width === "number" ? col.width + "px" : col.width}` : "1" })
								}, toDisplayString(opt[col.key] ?? "-"), 5);
							}), 128)), __props.multiple ? (openBlock(), createElementBlock("span", {
								key: 0,
								class: "re-select__table-check",
								onClick: withModifiers(($event) => onToggleSelect(opt), ["stop"])
							}, [createVNode(unref(ElCheckbox), { "model-value": isChecked(opt) }, null, 8, ["model-value"])], 8, _hoisted_5)) : createCommentVNode("", true)], 10, _hoisted_4)]),
							_: 2
						}, 1032, [
							"label",
							"value",
							"disabled"
						]);
					}), 128))
				], 64)) : createCommentVNode("", true)]),
				_: 2
			}, [!__props.multiple && _ctx.$slots.selected ? {
				name: "label",
				fn: withCtx((slotProps) => [renderSlot(_ctx.$slots, "selected", {
					value: slotProps.value,
					labels: selectedLabels.value
				}, () => [createBaseVNode("span", null, toDisplayString(slotProps.value !== "" && slotProps.value != null ? slotProps.label ?? labelFor(slotProps.value) : __props.placeholder), 1)], true)]),
				key: "0"
			} : void 0]), 1040, [
				"modelValue",
				"placeholder",
				"clearable",
				"filterable",
				"allow-create",
				"default-first-option",
				"multiple",
				"collapse-tags",
				"disabled",
				"loading",
				"size",
				"popper-class",
				"class"
			]))], 64);
		};
	}
}), [["__scopeId", "data-v-0263018d"]]);
//#endregion
export { ReSelect_default as t };
