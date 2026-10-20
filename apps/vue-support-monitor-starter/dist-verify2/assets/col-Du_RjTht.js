import { $n as normalizeClass, Hn as isObject, J as inject, g as computed, gt as provide, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { c as definePropType, f as isNumber, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { t as mutable } from "./typescript-CMUKtCBO.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/col/src/col.mjs
/**
* @deprecated Removed after 3.0.0, Use `ColProps` instead.
*/
var colProps = buildProps({
	/**
	* @description custom element tag
	*/
	tag: {
		type: String,
		default: "div"
	},
	/**
	* @description number of column the grid spans
	*/
	span: {
		type: Number,
		default: 24
	},
	/**
	* @description number of spacing on the left side of the grid
	*/
	offset: {
		type: Number,
		default: 0
	},
	/**
	* @description number of columns that grid moves to the left
	*/
	pull: {
		type: Number,
		default: 0
	},
	/**
	* @description number of columns that grid moves to the right
	*/
	push: {
		type: Number,
		default: 0
	},
	/**
	* @description `<768px` Responsive columns or column props object
	*/
	xs: {
		type: definePropType([Number, Object]),
		default: () => mutable({})
	},
	/**
	* @description `≥768px` Responsive columns or column props object
	*/
	sm: {
		type: definePropType([Number, Object]),
		default: () => mutable({})
	},
	/**
	* @description `≥992px` Responsive columns or column props object
	*/
	md: {
		type: definePropType([Number, Object]),
		default: () => mutable({})
	},
	/**
	* @description `≥1200px` Responsive columns or column props object
	*/
	lg: {
		type: definePropType([Number, Object]),
		default: () => mutable({})
	},
	/**
	* @description `≥1920px` Responsive columns or column props object
	*/
	xl: {
		type: definePropType([Number, Object]),
		default: () => mutable({})
	}
});
/**
* @deprecated Removed after 3.0.0, Use `RowProps` instead.
*/
var rowProps = buildProps({
	/**
	* @description custom element tag
	*/
	tag: {
		type: String,
		default: "div"
	},
	/**
	* @description grid spacing
	*/
	gutter: {
		type: Number,
		default: 0
	},
	/**
	* @description horizontal alignment of flex layout
	*/
	justify: {
		type: String,
		values: [
			"start",
			"center",
			"end",
			"space-around",
			"space-between",
			"space-evenly"
		],
		default: "start"
	},
	/**
	* @description vertical alignment of flex layout
	*/
	align: {
		type: String,
		values: [
			"top",
			"middle",
			"bottom"
		]
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/row/src/constants.mjs
var rowContextKey = Symbol("rowContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/row/index.mjs
var ElRow = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElRow",
	__name: "row",
	props: rowProps,
	setup(__props) {
		const props = __props;
		const ns = useNamespace("row");
		provide(rowContextKey, { gutter: computed(() => props.gutter) });
		const style = computed(() => {
			const styles = {};
			if (!props.gutter) return styles;
			styles.marginRight = styles.marginLeft = `-${props.gutter / 2}px`;
			return styles;
		});
		const rowKls = computed(() => [
			ns.b(),
			ns.is(`justify-${props.justify}`, props.justify !== "start"),
			ns.is(`align-${props.align}`, !!props.align)
		]);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.tag), {
				class: normalizeClass(rowKls.value),
				style: normalizeStyle(style.value)
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 8, ["class", "style"]);
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/col/index.mjs
var ElCol = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElCol",
	__name: "col",
	props: colProps,
	setup(__props) {
		const props = __props;
		const { gutter } = inject(rowContextKey, { gutter: computed(() => 0) });
		const ns = useNamespace("col");
		const style = computed(() => {
			const styles = {};
			if (gutter.value) styles.paddingLeft = styles.paddingRight = `${gutter.value / 2}px`;
			return styles;
		});
		const colKls = computed(() => {
			const classes = [];
			[
				"span",
				"offset",
				"pull",
				"push"
			].forEach((prop) => {
				const size = props[prop];
				if (isNumber(size)) {
					if (prop === "span") classes.push(ns.b(`${props[prop]}`));
					else if (size > 0) classes.push(ns.b(`${prop}-${props[prop]}`));
				}
			});
			[
				"xs",
				"sm",
				"md",
				"lg",
				"xl"
			].forEach((size) => {
				if (isNumber(props[size])) classes.push(ns.b(`${size}-${props[size]}`));
				else if (isObject(props[size])) Object.entries(props[size]).forEach(([prop, sizeProp]) => {
					classes.push(prop !== "span" ? ns.b(`${size}-${prop}-${sizeProp}`) : ns.b(`${size}-${sizeProp}`));
				});
			});
			if (gutter.value) classes.push(ns.is("guttered"));
			return [ns.b(), classes];
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.tag), {
				class: normalizeClass(colKls.value),
				style: normalizeStyle(style.value)
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 8, ["class", "style"]);
		};
	}
}));
//#endregion
export { ElRow as n, ElCol as t };
