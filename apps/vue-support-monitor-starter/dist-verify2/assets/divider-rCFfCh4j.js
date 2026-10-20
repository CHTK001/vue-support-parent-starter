import { $n as normalizeClass, B as h, D as createVNode, E as createTextVNode, Ht as watch, J as inject, Jn as isString, Lt as useSlots, On as unref, Yt as withDirectives, Z as isVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, gn as reactive, gt as provide, h as cloneVNode, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wn as toRef, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, t as Transition } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { i as componentSizes, r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { _ as isNil, c as definePropType, f as isNumber, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { r as keysOf } from "./objects-BYkkqs6t.js";
import { n as getNormalizedProps, r as isComment, t as flattedChildren } from "./vnode-6UdpuL7k.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { r as useTooltipContentProps, t as ElTooltip, u as Ee } from "./tooltip-DEX5DBfd.js";
import { n as useFormSize } from "./use-form-common-props-DzQ9ZY64.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { a as iconPropType, n as TypeComponents, r as TypeComponentsMap } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/constants/column-alignment.mjs
var columnAlignment = [
	"left",
	"center",
	"right"
];
/**
* @deprecated Removed after 3.0.0, Use `AlertProps` instead.
*/
var alertProps = buildProps({
	/**
	* @description alert title.
	*/
	title: {
		type: String,
		default: ""
	},
	description: {
		type: String,
		default: ""
	},
	/**
	* @description alert type.
	*/
	type: {
		type: String,
		values: keysOf(TypeComponentsMap),
		default: "info"
	},
	/**
	* @description whether alert can be dismissed.
	*/
	closable: {
		type: Boolean,
		default: true
	},
	/**
	* @description text for replacing x button
	*/
	closeText: {
		type: String,
		default: ""
	},
	/**
	* @description whether show icon
	*/
	showIcon: Boolean,
	/**
	* @description should content be placed in center.
	*/
	center: Boolean,
	effect: {
		type: String,
		values: ["light", "dark"],
		default: "light"
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/alert/index.mjs
var ElAlert = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElAlert",
	__name: "alert",
	props: alertProps,
	emits: { close: (evt) => evt instanceof MouseEvent },
	setup(__props, { emit: __emit }) {
		const { Close } = TypeComponents;
		const props = __props;
		const emit = __emit;
		const slots = useSlots();
		const ns = useNamespace("alert");
		const visible = ref(true);
		const iconComponent = computed(() => TypeComponentsMap[props.type]);
		const hasDesc = computed(() => {
			if (props.description) return true;
			const slotContent = slots.default?.();
			if (!slotContent) return false;
			return flattedChildren(slotContent).some((child) => !isComment(child));
		});
		const close = (evt) => {
			visible.value = false;
			emit("close", evt);
		};
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Transition, {
				name: unref(ns).b("fade"),
				persisted: ""
			}, {
				default: withCtx(() => [withDirectives(createBaseVNode("div", {
					class: normalizeClass([
						unref(ns).b(),
						unref(ns).m(__props.type),
						unref(ns).is("center", __props.center),
						unref(ns).is(__props.effect)
					]),
					role: "alert"
				}, [__props.showIcon && (_ctx.$slots.icon || iconComponent.value) ? (openBlock(), createBlock(unref(ElIcon), {
					key: 0,
					class: normalizeClass([unref(ns).e("icon"), unref(ns).is("big", hasDesc.value)])
				}, {
					default: withCtx(() => [renderSlot(_ctx.$slots, "icon", {}, () => [(openBlock(), createBlock(resolveDynamicComponent(iconComponent.value)))])]),
					_: 3
				}, 8, ["class"])) : createCommentVNode("v-if", true), createBaseVNode("div", { class: normalizeClass(unref(ns).e("content")) }, [
					__props.title || _ctx.$slots.title ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: normalizeClass([unref(ns).e("title"), { "with-description": hasDesc.value }])
					}, [renderSlot(_ctx.$slots, "title", {}, () => [createTextVNode(toDisplayString(__props.title), 1)])], 2)) : createCommentVNode("v-if", true),
					hasDesc.value ? (openBlock(), createElementBlock("p", {
						key: 1,
						class: normalizeClass(unref(ns).e("description"))
					}, [renderSlot(_ctx.$slots, "default", {}, () => [createTextVNode(toDisplayString(__props.description), 1)])], 2)) : createCommentVNode("v-if", true),
					__props.closable ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [__props.closeText ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass([unref(ns).e("close-btn"), unref(ns).is("customed")]),
						onClick: close
					}, toDisplayString(__props.closeText), 3)) : (openBlock(), createBlock(unref(ElIcon), {
						key: 1,
						class: normalizeClass(unref(ns).e("close-btn")),
						onClick: close
					}, {
						default: withCtx(() => [createVNode(unref(Close))]),
						_: 1
					}, 8, ["class"]))], 64)) : createCommentVNode("v-if", true)
				], 2)], 2), [[vShow, visible.value]])]),
				_: 3
			}, 8, ["name"]);
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/avatar/src/avatar.mjs
/**
* @deprecated Removed after 3.0.0, Use `AvatarProps` instead.
*/
var avatarProps = buildProps({
	/**
	* @description avatar size.
	*/
	size: {
		type: [Number, String],
		values: componentSizes,
		validator: (val) => isNumber(val)
	},
	/**
	* @description avatar shape.
	*/
	shape: {
		type: String,
		values: ["circle", "square"]
	},
	/**
	* @description representation type to icon, more info on icon component.
	*/
	icon: { type: iconPropType },
	/**
	* @description the source of the image for an image avatar.
	*/
	src: {
		type: String,
		default: ""
	},
	/**
	* @description native attribute `alt` of image avatar.
	*/
	alt: String,
	/**
	* @description native attribute srcset of image avatar.
	*/
	srcSet: String,
	/**
	* @description set how the image fit its container for an image avatar.
	*/
	fit: {
		type: definePropType(String),
		default: "cover"
	}
});
var avatarEmits = { error: (evt) => evt instanceof Event };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/avatar/src/constants.mjs
var avatarGroupContextKey = Symbol("avatarGroupContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/avatar/src/avatar-group-props.mjs
var avatarGroupProps = {
	/**
	* @description control the size of avatars in this avatar-group
	*/
	size: {
		type: definePropType([Number, String]),
		values: componentSizes,
		validator: (val) => isNumber(val)
	},
	/**
	* @description control the shape of avatars in this avatar-group
	*/
	shape: {
		type: definePropType(String),
		values: ["circle", "square"]
	},
	/**
	* @description whether to collapse avatars
	*/
	collapseAvatars: Boolean,
	/**
	* @description whether show all collapsed avatars when mouse hover text of the collapse-avatar. To use this, `collapse-avatars` must be true
	*/
	collapseAvatarsTooltip: Boolean,
	/**
	* @description the max avatars number to be shown. To use this, `collapse-avatars` must be true
	*/
	maxCollapseAvatars: {
		type: Number,
		default: 1
	},
	/**
	* @description tooltip theme, built-in theme: `dark` / `light`
	*/
	effect: {
		type: definePropType(String),
		default: "light"
	},
	/**
	* @description placement of tooltip
	*/
	placement: {
		type: definePropType(String),
		values: Ee,
		default: "top"
	},
	/**
	* @description custom class name for tooltip
	*/
	popperClass: useTooltipContentProps.popperClass,
	/**
	* @description custom style for tooltip
	*/
	popperStyle: useTooltipContentProps.popperStyle,
	/**
	* @description custom class name for the collapse-avatar
	*/
	collapseClass: String,
	/**
	* @description custom style for the collapse-avatar
	*/
	collapseStyle: {
		type: definePropType([
			String,
			Array,
			Object,
			Boolean
		]),
		default: void 0
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/avatar/src/avatar.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = [
	"src",
	"alt",
	"srcset"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/avatar/src/avatar2.mjs
var avatar_default = /* @__PURE__ */ defineComponent({
	name: "ElAvatar",
	__name: "avatar",
	props: avatarProps,
	emits: avatarEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const avatarGroupContext = inject(avatarGroupContextKey, void 0);
		const ns = useNamespace("avatar");
		const hasLoadError = ref(false);
		const size = computed(() => props.size ?? avatarGroupContext?.size);
		const shape = computed(() => props.shape ?? avatarGroupContext?.shape ?? "circle");
		const avatarClass = computed(() => {
			const { icon } = props;
			const classList = [ns.b()];
			if (isString(size.value)) classList.push(ns.m(size.value));
			if (icon) classList.push(ns.m("icon"));
			if (shape.value) classList.push(ns.m(shape.value));
			return classList;
		});
		const sizeStyle = computed(() => {
			return isNumber(size.value) ? ns.cssVarBlock({ size: addUnit(size.value) }) : void 0;
		});
		const fitStyle = computed(() => ({ objectFit: props.fit }));
		watch(() => [props.src, props.srcSet], () => hasLoadError.value = false);
		function handleError(e) {
			hasLoadError.value = true;
			emit("error", e);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", {
				class: normalizeClass(avatarClass.value),
				style: normalizeStyle(sizeStyle.value)
			}, [(__props.src || __props.srcSet) && !hasLoadError.value ? (openBlock(), createElementBlock("img", {
				key: 0,
				src: __props.src,
				alt: __props.alt,
				srcset: __props.srcSet,
				style: normalizeStyle(fitStyle.value),
				onError: handleError
			}, null, 44, _hoisted_1$1)) : __props.icon ? (openBlock(), createBlock(unref(ElIcon), { key: 1 }, {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
				_: 1
			})) : renderSlot(_ctx.$slots, "default", { key: 2 })], 6);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/avatar/src/avatar-group.mjs
var avatar_group_default = /* @__PURE__ */ defineComponent({
	name: "ElAvatarGroup",
	props: avatarGroupProps,
	setup(props, { slots }) {
		const ns = useNamespace("avatar-group");
		provide(avatarGroupContextKey, reactive({
			size: toRef(props, "size"),
			shape: toRef(props, "shape")
		}));
		return () => {
			const avatars = flattedChildren(slots.default?.() ?? []);
			let visibleAvatars = avatars;
			if (props.collapseAvatars && avatars.length > props.maxCollapseAvatars) {
				visibleAvatars = avatars.slice(0, props.maxCollapseAvatars);
				const hiddenAvatars = avatars.slice(props.maxCollapseAvatars);
				visibleAvatars.push(createVNode(ElTooltip, {
					"popperClass": props.popperClass,
					"popperStyle": props.popperStyle,
					"placement": props.placement,
					"effect": props.effect,
					"disabled": !props.collapseAvatarsTooltip
				}, {
					default: () => createVNode(avatar_default, {
						"size": props.size,
						"shape": props.shape,
						"class": props.collapseClass,
						"style": props.collapseStyle
					}, { default: () => [createTextVNode("+ "), hiddenAvatars.length] }),
					content: () => createVNode("div", { "class": ns.e("collapse-avatars") }, [hiddenAvatars.map((node, idx) => isVNode(node) ? cloneVNode(node, { key: node.key ?? idx }) : node)])
				}));
			}
			return createVNode("div", { "class": ns.b() }, [visibleAvatars]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/avatar/index.mjs
var ElAvatar = withInstall(avatar_default, { AvatarGroup: avatar_group_default });
var ElAvatarGroup = withNoopInstall(avatar_group_default);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/src/description.mjs
/**
* @deprecated Removed after 3.0.0, Use `DescriptionProps` instead.
*/
var descriptionProps = buildProps({
	/**
	* @description with or without border
	*/
	border: Boolean,
	/**
	* @description numbers of `Descriptions Item` in one line
	*/
	column: {
		type: Number,
		default: 3
	},
	/**
	* @description direction of list
	*/
	direction: {
		type: String,
		values: ["horizontal", "vertical"],
		default: "horizontal"
	},
	/**
	* @description size of list
	*/
	size: useSizeProp,
	/**
	* @description title text, display on the top left
	*/
	title: {
		type: String,
		default: ""
	},
	/**
	* @description extra text, display on the top right
	*/
	extra: {
		type: String,
		default: ""
	},
	/**
	* @description width of every label column
	*/
	labelWidth: { type: [String, Number] }
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/src/constants.mjs
var COMPONENT_NAME = "ElDescriptionsItem";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/src/description-item.mjs
var descriptionItemProps = buildProps({
	/**
	* @description label text
	*/
	label: {
		type: String,
		default: ""
	},
	/**
	* @description colspan of column
	*/
	span: {
		type: Number,
		default: 1
	},
	/**
	* @description the number of rows a cell should span
	*/
	rowspan: {
		type: Number,
		default: 1
	},
	/**
	* @description column width, the width of the same column in different rows is set by the max value (If no `border`, width contains label and content)
	*/
	width: {
		type: [String, Number],
		default: ""
	},
	/**
	* @description column minimum width, columns with `width` has a fixed width, while columns with `min-width` has a width that is distributed in proportion (If no`border`, width contains label and content)
	*/
	minWidth: {
		type: [String, Number],
		default: ""
	},
	/**
	* @description column label width, if not set, it will be the same as the width of the column. Higher priority than the `label-width` of `Descriptions`
	*/
	labelWidth: { type: [String, Number] },
	/**
	* @description column content alignment (If no `border`, effective for both label and content)
	*/
	align: {
		type: String,
		values: columnAlignment,
		default: "left"
	},
	/**
	* @description column label alignment, if omitted, the value of the above `align` attribute will be applied (If no `border`, please use `align` attribute)
	*/
	labelAlign: {
		type: String,
		values: columnAlignment
	},
	/**
	* @description column content custom class name
	*/
	className: {
		type: String,
		default: ""
	},
	/**
	* @description column label custom class name
	*/
	labelClassName: {
		type: String,
		default: ""
	}
});
var DescriptionItem = defineComponent({
	name: COMPONENT_NAME,
	props: descriptionItemProps
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/src/token.mjs
var descriptionsKey = Symbol("elDescriptions");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/src/descriptions-row.mjs
/**
* @deprecated Removed after 3.0.0, Use `DescriptionsRowProps` instead.
*/
var descriptionsRowProps = buildProps({ row: {
	type: definePropType(Array),
	default: () => []
} });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/src/descriptions-cell.mjs
var descriptions_cell_default = defineComponent({
	name: "ElDescriptionsCell",
	props: {
		cell: { type: Object },
		tag: {
			type: String,
			default: "td"
		},
		type: { type: String }
	},
	setup() {
		return { descriptions: inject(descriptionsKey, {}) };
	},
	render() {
		const item = getNormalizedProps(this.cell);
		const directives = (this.cell?.dirs || []).map((dire) => {
			const { dir, arg, modifiers, value } = dire;
			return [
				dir,
				value,
				arg,
				modifiers
			];
		});
		const { border, direction } = this.descriptions;
		const isVertical = direction === "vertical";
		const renderLabel = () => this.cell?.children?.label?.() || item.label;
		const renderContent = () => this.cell?.children?.default?.();
		const span = item.span;
		const rowspan = item.rowspan;
		const align = item.align ? `is-${item.align}` : "";
		const labelAlign = item.labelAlign ? `is-${item.labelAlign}` : align;
		const className = item.className;
		const labelClassName = item.labelClassName;
		const style = {
			width: addUnit(this.type === "label" ? item.labelWidth ?? this.descriptions.labelWidth ?? item.width : item.width),
			minWidth: addUnit(item.minWidth)
		};
		const ns = useNamespace("descriptions");
		switch (this.type) {
			case "label": return withDirectives(h(this.tag, {
				style,
				class: [
					ns.e("cell"),
					ns.e("label"),
					ns.is("bordered-label", border),
					ns.is("vertical-label", isVertical),
					labelAlign,
					labelClassName
				],
				colSpan: isVertical ? span : 1,
				rowspan: isVertical ? 1 : rowspan
			}, renderLabel()), directives);
			case "content": return withDirectives(h(this.tag, {
				style,
				class: [
					ns.e("cell"),
					ns.e("content"),
					ns.is("bordered-content", border),
					ns.is("vertical-content", isVertical),
					align,
					className
				],
				colSpan: isVertical ? span : span * 2 - 1,
				rowspan: isVertical ? rowspan * 2 - 1 : rowspan
			}, renderContent()), directives);
			default: {
				const label = renderLabel();
				const labelStyle = {};
				const width = addUnit(item.labelWidth ?? this.descriptions.labelWidth);
				if (width) {
					labelStyle.width = width;
					labelStyle.display = "inline-block";
				}
				return withDirectives(h("td", {
					style,
					class: [ns.e("cell"), align],
					colSpan: span,
					rowspan
				}, [!isNil(label) ? h("span", {
					style: labelStyle,
					class: [ns.e("label"), labelClassName]
				}, label) : void 0, h("span", { class: [ns.e("content"), className] }, renderContent())]), directives);
			}
		}
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/src/descriptions-row.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = { key: 1 };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/src/descriptions-row2.mjs
var descriptions_row_default = /* @__PURE__ */ defineComponent({
	name: "ElDescriptionsRow",
	__name: "descriptions-row",
	props: descriptionsRowProps,
	setup(__props) {
		const descriptions = inject(descriptionsKey, {});
		return (_ctx, _cache) => {
			return unref(descriptions).direction === "vertical" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("tr", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.row, (cell, _index) => {
				return openBlock(), createBlock(unref(descriptions_cell_default), {
					key: `tr1-${_index}`,
					cell,
					tag: "th",
					type: "label"
				}, null, 8, ["cell"]);
			}), 128))]), createBaseVNode("tr", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.row, (cell, _index) => {
				return openBlock(), createBlock(unref(descriptions_cell_default), {
					key: `tr2-${_index}`,
					cell,
					tag: "td",
					type: "content"
				}, null, 8, ["cell"]);
			}), 128))])], 64)) : (openBlock(), createElementBlock("tr", _hoisted_1, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.row, (cell, _index) => {
				return openBlock(), createElementBlock(Fragment, { key: `tr3-${_index}` }, [unref(descriptions).border ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(unref(descriptions_cell_default), {
					cell,
					tag: "td",
					type: "label"
				}, null, 8, ["cell"]), createVNode(unref(descriptions_cell_default), {
					cell,
					tag: "td",
					type: "content"
				}, null, 8, ["cell"])], 64)) : (openBlock(), createBlock(unref(descriptions_cell_default), {
					key: 1,
					cell,
					tag: "td",
					type: "both"
				}, null, 8, ["cell"]))], 64);
			}), 128))]));
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/descriptions/index.mjs
var ElDescriptions = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElDescriptions",
	__name: "description",
	props: descriptionProps,
	setup(__props) {
		const props = __props;
		const ns = useNamespace("descriptions");
		const descriptionsSize = useFormSize();
		const slots = useSlots();
		provide(descriptionsKey, props);
		const descriptionKls = computed(() => [ns.b(), ns.m(descriptionsSize.value)]);
		const filledNode = (node, span, count, isLast = false) => {
			if (!node.props) node.props = {};
			if (span > count) node.props.span = count;
			if (isLast) node.props.span = span;
			return node;
		};
		const getRows = () => {
			if (!slots.default) return [];
			const children = flattedChildren(slots.default()).filter((node) => node?.type?.name === COMPONENT_NAME);
			const rows = [];
			let temp = [];
			let count = props.column;
			let totalSpan = 0;
			const rowspanTemp = [];
			children.forEach((node, index) => {
				const span = node.props?.span || 1;
				const rowspan = node.props?.rowspan || 1;
				const rowNo = rows.length;
				rowspanTemp[rowNo] ||= 0;
				if (rowspan > 1) for (let i = 1; i < rowspan; i++) {
					rowspanTemp[rowNo + i] ||= 0;
					rowspanTemp[rowNo + i]++;
					totalSpan++;
				}
				if (rowspanTemp[rowNo] > 0) {
					count -= rowspanTemp[rowNo];
					rowspanTemp[rowNo] = 0;
				}
				if (index < children.length - 1) totalSpan += span > count ? count : span;
				if (index === children.length - 1) {
					const lastSpan = props.column - totalSpan % props.column;
					temp.push(filledNode(node, lastSpan, count, true));
					rows.push(temp);
					return;
				}
				if (span < count) {
					count -= span;
					temp.push(node);
				} else {
					temp.push(filledNode(node, span, count));
					rows.push(temp);
					count = props.column;
					temp = [];
				}
			});
			return rows;
		};
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(descriptionKls.value) }, [__props.title || __props.extra || _ctx.$slots.title || _ctx.$slots.extra ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass(unref(ns).e("header"))
			}, [createBaseVNode("div", { class: normalizeClass(unref(ns).e("title")) }, [renderSlot(_ctx.$slots, "title", {}, () => [createTextVNode(toDisplayString(__props.title), 1)])], 2), createBaseVNode("div", { class: normalizeClass(unref(ns).e("extra")) }, [renderSlot(_ctx.$slots, "extra", {}, () => [createTextVNode(toDisplayString(__props.extra), 1)])], 2)], 2)) : createCommentVNode("v-if", true), createBaseVNode("div", { class: normalizeClass(unref(ns).e("body")) }, [createBaseVNode("table", { class: normalizeClass([unref(ns).e("table"), unref(ns).is("bordered", __props.border)]) }, [createBaseVNode("tbody", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(getRows(), (row, _index) => {
				return openBlock(), createBlock(descriptions_row_default, {
					key: _index,
					row
				}, null, 8, ["row"]);
			}), 128))])], 2)], 2)], 2);
		};
	}
}), { DescriptionsItem: DescriptionItem });
var ElDescriptionsItem = withNoopInstall(DescriptionItem);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/divider/src/divider.mjs
/**
* @deprecated Removed after 3.0.0, Use `DividerProps` instead.
*/
var dividerProps = buildProps({
	/**
	* @description Set divider's direction
	*/
	direction: {
		type: String,
		values: ["horizontal", "vertical"],
		default: "horizontal"
	},
	/**
	* @description The position of the customized content on the divider line
	*/
	contentPosition: {
		type: String,
		values: [
			"left",
			"center",
			"right"
		],
		default: "center"
	},
	/**
	* @description Set the style of divider
	*/
	borderStyle: {
		type: definePropType(String),
		default: "solid"
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/divider/index.mjs
var ElDivider = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElDivider",
	__name: "divider",
	props: dividerProps,
	setup(__props) {
		const props = __props;
		const ns = useNamespace("divider");
		const dividerStyle = computed(() => {
			return ns.cssVar({ "border-style": props.borderStyle });
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass([unref(ns).b(), unref(ns).m(__props.direction)]),
				style: normalizeStyle(dividerStyle.value),
				role: "separator"
			}, [_ctx.$slots.default && __props.direction !== "vertical" ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass([unref(ns).e("text"), unref(ns).is(__props.contentPosition)])
			}, [renderSlot(_ctx.$slots, "default")], 2)) : createCommentVNode("v-if", true)], 6);
		};
	}
}));
//#endregion
export { ElAvatarGroup as a, ElAvatar as i, ElDescriptions as n, ElAlert as o, ElDescriptionsItem as r, ElDivider as t };
