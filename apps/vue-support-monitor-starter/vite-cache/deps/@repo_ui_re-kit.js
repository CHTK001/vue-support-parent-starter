import { U as computed, Ut as provide, nt as defineComponent, pt as h, xt as inject } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { $i as ElRadio, Ar as ElDropdownItem, Ri as ElCol, Ur as ElDivider, Ya as ElOption, bc as ElAlert, ea as ElRadioButton, is as ElAvatar, jr as ElDropdownMenu, kr as ElDropdown, ln as ElTableColumn, ni as ElDescriptions, ri as ElDescriptionsItem, ta as ElRadioGroup, ur as ElLink, vt as ElTreeSelect, zi as ElRow, zs as ElFormItem } from "./es-BernUpY0.js";
import StateIcon from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReStateIcon/StateIcon.vue";
import "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/shared/re-inputs.css";
import "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReKit/re-kit.css";
//#region ../../packages/ui/src/components/ReKit/index.ts
/**
* ReRadioGroup 向下提供当前选中值（computed ref），供 ReRadio / ReRadioButton 判断激活态。
*
* 不用 Element Plus 内部的 `radioGroupKey`（深路径导入 `element-plus/es/components/radio`
* 在 exports 映射下并不可靠），改用本组件自己的注入键：语义相同，且不依赖 EP 内部实现。
*
* 键值类型刻意用 `unknown`：把 `ComputedRef<T>` 直接标成 `Ref<unknown>` 会触发 ref 的
* 读写变体检查；统一成 `unknown`，读取处再判空即可。
*/
var RE_RADIO_STATE_KEY = Symbol("reRadioState");
var ReOption = defineComponent({
	name: "ReOption",
	inheritAttrs: true,
	props: {
		value: { type: [
			String,
			Number,
			Boolean,
			Object
		] },
		label: { type: [String, Number] },
		disabled: {
			type: Boolean,
			default: false
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(ElOption, {
			...attrs,
			value: props.value,
			label: props.label,
			disabled: props.disabled
		}, slots.default);
	}
});
var ReFormItem = defineComponent({
	name: "ReFormItem",
	inheritAttrs: true,
	props: {
		prop: {
			type: String,
			default: ""
		},
		label: {
			type: String,
			default: ""
		},
		required: {
			type: Boolean,
			default: false
		},
		labelWidth: { type: [String, Number] },
		error: {
			type: String,
			default: ""
		},
		showMessage: {
			type: Boolean,
			default: true
		},
		size: { type: String }
	},
	setup(props, { attrs, slots }) {
		return () => h(ElFormItem, {
			...attrs,
			prop: props.prop,
			label: props.label,
			required: props.required,
			labelWidth: props.labelWidth,
			error: props.error,
			showMessage: props.showMessage,
			size: props.size,
			class: "re-form-item"
		}, {
			default: () => slots.default?.(),
			...slots.label ? { label: () => slots.label?.() } : {}
		});
	}
});
var ReRow = defineComponent({
	name: "ReRow",
	inheritAttrs: true,
	props: {
		gutter: {
			type: Number,
			default: 0
		},
		justify: {
			type: String,
			default: "start"
		},
		align: {
			type: String,
			default: "top"
		},
		wrap: {
			type: Boolean,
			default: true
		},
		tag: {
			type: String,
			default: "div"
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(ElRow, {
			...attrs,
			gutter: props.gutter,
			justify: props.justify,
			align: props.align,
			wrap: props.wrap,
			tag: props.tag
		}, slots.default);
	}
});
var ReCol = defineComponent({
	name: "ReCol",
	inheritAttrs: true,
	props: {
		span: {
			type: Number,
			default: 24
		},
		offset: {
			type: Number,
			default: 0
		},
		push: {
			type: Number,
			default: 0
		},
		pull: {
			type: Number,
			default: 0
		},
		xs: { type: [Number, Object] },
		sm: { type: [Number, Object] },
		md: { type: [Number, Object] },
		lg: { type: [Number, Object] },
		xl: { type: [Number, Object] },
		tag: {
			type: String,
			default: "div"
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(ElCol, {
			...attrs,
			span: props.span,
			offset: props.offset,
			push: props.push,
			pull: props.pull,
			xs: props.xs,
			sm: props.sm,
			md: props.md,
			lg: props.lg,
			xl: props.xl,
			tag: props.tag
		}, slots.default);
	}
});
var ReRadioGroup = defineComponent({
	name: "ReRadioGroup",
	inheritAttrs: true,
	props: {
		modelValue: {
			type: [
				String,
				Number,
				Boolean,
				Object
			],
			default: void 0
		},
		/** 尺寸（只对 ReKit 布局生效，`el` 布局走 EP 自己的尺寸类） */
		size: {
			type: String,
			default: "default"
		},
		/**
		* 布局模式：
		*   - `"default"`（默认/留空） ReKit 风格：轨道 + 选块，由 size / button / capsule 联合控制圆角与描边。
		*   - `"el"` Element Plus 原生风格：不挂 `re-radio-group` 类，re-kit.css 中的所有 ReRadioGroup
		*     规则全部不生效，由 EP 自己的样式（右下角拼接 + 实心主色）运载。
		*   - `"square"` 扁平方块风格（`class="proc-metric"` 同级）：浅灰底轨道、按钮无描边半圆角
		*    （Solid 圆角、Capsule 药丸均不渲染，选项语义由选中态的白底深字承载）。
		*/
		layout: {
			type: String,
			default: "default"
		},
		disabled: {
			type: Boolean,
			default: false
		},
		button: {
			type: Boolean,
			default: false
		},
		capsule: {
			type: Boolean,
			default: true
		}
	},
	emits: ["update:modelValue"],
	setup(props, { attrs, slots, emit }) {
		provide(RE_RADIO_STATE_KEY, computed(() => props.modelValue));
		const groupClass = [];
		if (props.layout !== "el") {
			groupClass.push("re-radio-group", `re-radio-group--${props.size}`, `re-radio-group--${props.layout}`);
			if (props.layout === "default") {
				if (props.button) groupClass.push("re-radio-group--button");
				if (props.capsule) groupClass.push("re-radio-group--capsule");
			}
		}
		return () => h(ElRadioGroup, {
			...attrs,
			modelValue: props.modelValue,
			size: props.size,
			disabled: props.disabled,
			class: groupClass,
			"onUpdate:modelValue": (v) => emit("update:modelValue", v)
		}, { default: () => slots.default?.() });
	}
});
/**
* 读取 ReRadioGroup 下发的当前选中值（computed ref）。
*
* ReRadio / ReRadioButton 只是 el-radio / el-radio-button 的薄封装，自身不持有分组值；
* 判断某个选项当前是否选中（图标动画要知道激活态）必须读注入的分组状态。
*/
function useRadioState() {
	return inject(RE_RADIO_STATE_KEY, null);
}
/** 该选项当前是否选中（不在分组内时按未选中处理） */
function isRadioChecked(state, value) {
	return state != null && state.value === value;
}
/**
* 组装 radio 的显示内容：图标 + 文本。
*
* 只有配置了图标才追加 ReStateIcon；文本优先取使用者插槽，其次 label 属性。
* 配置了图标时始终下发 default 插槽（含 label 文本），否则沿用「直接透传插槽」的既有行为。
*/
function renderRadioContent(options) {
	const children = [];
	if (options.icon || options.activeIcon || options.inactiveIcon || options.preset) children.push(h(StateIcon, {
		active: options.checked,
		icon: options.icon,
		activeIcon: options.activeIcon,
		inactiveIcon: options.inactiveIcon,
		preset: options.preset,
		size: options.iconSize ?? 16
	}));
	const slotNodes = options.slots.default?.() ?? [];
	if (slotNodes.length) children.push(...slotNodes);
	else if (options.label != null && options.label !== "") children.push(String(options.label));
	return children;
}
var ReRadio = defineComponent({
	name: "ReRadio",
	inheritAttrs: true,
	props: {
		value: {
			type: [
				String,
				Number,
				Boolean,
				Object
			],
			default: ""
		},
		label: { type: [
			String,
			Number,
			Object
		] },
		disabled: {
			type: Boolean,
			default: false
		},
		border: {
			type: Boolean,
			default: false
		},
		size: { type: String },
		/** 通用图标（两态相同）；activeIcon / inactiveIcon 未配置时回落到它 */
		icon: {
			type: String,
			default: ""
		},
		/** 激活态图标名 */
		activeIcon: {
			type: String,
			default: ""
		},
		/** 非激活态图标名 */
		inactiveIcon: {
			type: String,
			default: ""
		},
		/** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
		preset: {
			type: String,
			default: void 0
		},
		/** 图标尺寸（px） */
		iconSize: {
			type: Number,
			default: 16
		}
	},
	setup(props, { attrs, slots }) {
		const radioState = useRadioState();
		return () => {
			const childSlots = props.icon || props.activeIcon || props.inactiveIcon || props.preset ? { default: () => renderRadioContent({
				checked: isRadioChecked(radioState, props.value),
				label: props.label,
				slots,
				icon: props.icon,
				activeIcon: props.activeIcon,
				inactiveIcon: props.inactiveIcon,
				preset: props.preset,
				iconSize: props.iconSize
			}) } : { default: () => slots.default?.() };
			return h(ElRadio, {
				...attrs,
				value: props.value,
				label: props.label,
				disabled: props.disabled,
				border: props.border,
				size: props.size
			}, childSlots);
		};
	}
});
var ReRadioButton = defineComponent({
	name: "ReRadioButton",
	inheritAttrs: true,
	props: {
		value: {
			type: [
				String,
				Number,
				Boolean,
				Object
			],
			default: ""
		},
		label: { type: [
			String,
			Number,
			Object
		] },
		disabled: {
			type: Boolean,
			default: false
		},
		/** 通用图标（两态相同）；activeIcon / inactiveIcon 未配置时回落到它 */
		icon: {
			type: String,
			default: ""
		},
		/** 激活态图标名 */
		activeIcon: {
			type: String,
			default: ""
		},
		/** 非激活态图标名 */
		inactiveIcon: {
			type: String,
			default: ""
		},
		/** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
		preset: {
			type: String,
			default: void 0
		},
		/** 图标尺寸（px） */
		iconSize: {
			type: Number,
			default: 16
		}
	},
	setup(props, { attrs, slots }) {
		const radioState = useRadioState();
		return () => {
			const childSlots = props.icon || props.activeIcon || props.inactiveIcon || props.preset ? { default: () => renderRadioContent({
				checked: isRadioChecked(radioState, props.value),
				label: props.label,
				slots,
				icon: props.icon,
				activeIcon: props.activeIcon,
				inactiveIcon: props.inactiveIcon,
				preset: props.preset,
				iconSize: props.iconSize
			}) } : { default: () => slots.default?.() };
			return h(ElRadioButton, {
				...attrs,
				value: props.value,
				label: props.label,
				disabled: props.disabled
			}, childSlots);
		};
	}
});
var ReTreeSelect = defineComponent({
	name: "ReTreeSelect",
	inheritAttrs: true,
	props: {
		modelValue: { default: null },
		data: {
			type: Array,
			default: () => []
		},
		props: {
			type: Object,
			default: () => ({
				children: "children",
				label: "label",
				value: "value"
			})
		},
		nodeKey: {
			type: String,
			default: ""
		},
		placeholder: {
			type: String,
			default: "请选择"
		},
		clearable: {
			type: Boolean,
			default: false
		},
		filterable: {
			type: Boolean,
			default: false
		},
		multiple: {
			type: Boolean,
			default: false
		},
		checkStrictly: {
			type: Boolean,
			default: false
		},
		checkOnClickNode: {
			type: Boolean,
			default: false
		},
		defaultExpandAll: {
			type: Boolean,
			default: false
		},
		size: {
			type: String,
			default: "default"
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:modelValue"],
	setup(props, { attrs, slots, emit }) {
		return () => h(ElTreeSelect, {
			...attrs,
			data: props.data,
			props: props.props,
			nodeKey: props.nodeKey,
			placeholder: props.placeholder,
			clearable: props.clearable,
			filterable: props.filterable,
			multiple: props.multiple,
			checkStrictly: props.checkStrictly,
			checkOnClickNode: props.checkOnClickNode,
			defaultExpandAll: props.defaultExpandAll,
			size: props.size,
			disabled: props.disabled,
			class: "re-tree-select",
			modelValue: props.modelValue,
			"onUpdate:modelValue": (v) => emit("update:modelValue", v)
		}, slots.default);
	}
});
var ReTableColumn = defineComponent({
	name: "ReTableColumn",
	inheritAttrs: true,
	props: {
		type: {
			type: String,
			default: "default"
		},
		prop: {
			type: String,
			default: ""
		},
		label: {
			type: String,
			default: ""
		},
		width: { type: [String, Number] },
		minWidth: { type: [String, Number] },
		fixed: { type: [Boolean, String] },
		align: { type: String },
		headerAlign: { type: String },
		sortable: {
			type: [Boolean, String],
			default: false
		},
		showOverflowTooltip: {
			type: Boolean,
			default: false
		},
		formatter: { type: Function }
	},
	setup(props, { attrs, slots }) {
		return () => h(ElTableColumn, {
			...attrs,
			type: props.type,
			prop: props.prop,
			label: props.label,
			width: props.width,
			minWidth: props.minWidth,
			fixed: props.fixed,
			align: props.align,
			headerAlign: props.headerAlign,
			sortable: props.sortable,
			showOverflowTooltip: props.showOverflowTooltip,
			formatter: props.formatter
		}, {
			default: (scope) => slots.default?.(scope ?? {}),
			...slots.header ? { header: (scope) => slots.header?.(scope ?? {}) } : {}
		});
	}
});
var ReDropdown = defineComponent({
	name: "ReDropdown",
	inheritAttrs: true,
	props: {
		trigger: {
			type: String,
			default: "hover"
		},
		splitButton: {
			type: Boolean,
			default: false
		},
		type: {
			type: String,
			default: "default"
		},
		size: {
			type: String,
			default: "default"
		},
		disabled: {
			type: Boolean,
			default: false
		},
		hideOnClick: {
			type: Boolean,
			default: true
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(ElDropdown, {
			...attrs,
			trigger: props.trigger,
			splitButton: props.splitButton,
			type: props.type,
			size: props.size,
			disabled: props.disabled,
			hideOnClick: props.hideOnClick,
			popperClass: "re-dropdown"
		}, {
			default: slots.default,
			dropdown: slots.dropdown
		});
	}
});
var ReDropdownMenu = defineComponent({
	name: "ReDropdownMenu",
	inheritAttrs: true,
	setup(_, { attrs, slots }) {
		return () => h(ElDropdownMenu, { ...attrs }, slots.default);
	}
});
var ReDropdownItem = defineComponent({
	name: "ReDropdownItem",
	inheritAttrs: true,
	props: {
		disabled: {
			type: Boolean,
			default: false
		},
		divided: {
			type: Boolean,
			default: false
		},
		command: { type: [
			String,
			Number,
			Object
		] }
	},
	setup(props, { attrs, slots }) {
		return () => h(ElDropdownItem, {
			...attrs,
			disabled: props.disabled,
			divided: props.divided,
			command: props.command,
			class: "re-dropdown-item"
		}, slots.default);
	}
});
/**
* 子项不可包装：ElDescriptions 在自身 render 阶段按 vnode 类型名收集子项，
* 且 ElDescriptionsItem 是无 render 的标记组件，包一层即丢失全部内容。
*/
var ReDescriptionsItem = ElDescriptionsItem;
var ReDescriptions = defineComponent({
	name: "ReDescriptions",
	inheritAttrs: true,
	props: {
		column: {
			type: Number,
			default: 2
		},
		border: {
			type: Boolean,
			default: true
		},
		size: {
			type: String,
			default: "small"
		},
		title: {
			type: String,
			default: ""
		},
		direction: {
			type: String,
			default: "horizontal"
		},
		labelStyle: {
			type: Object,
			default: () => ({})
		},
		contentStyle: {
			type: Object,
			default: () => ({})
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(ElDescriptions, {
			...attrs,
			column: props.column,
			border: props.border,
			size: props.size,
			title: props.title,
			direction: props.direction,
			labelStyle: props.labelStyle,
			contentStyle: props.contentStyle,
			class: "re-descriptions"
		}, slots.default);
	}
});
var ReAlert = defineComponent({
	name: "ReAlert",
	inheritAttrs: true,
	props: {
		title: {
			type: String,
			default: ""
		},
		description: {
			type: String,
			default: ""
		},
		type: {
			type: String,
			default: "info"
		},
		closable: {
			type: Boolean,
			default: true
		},
		closeText: {
			type: String,
			default: ""
		},
		showIcon: {
			type: Boolean,
			default: true
		},
		center: {
			type: Boolean,
			default: false
		}
	},
	emits: ["close"],
	setup(props, { attrs, slots, emit }) {
		return () => h(ElAlert, {
			...attrs,
			title: props.title,
			description: props.description,
			type: props.type,
			closable: props.closable,
			closeText: props.closeText,
			showIcon: props.showIcon,
			center: props.center,
			class: "re-alert",
			onClose: () => emit("close")
		}, {
			...slots.title ? { title: () => slots.title?.() } : {},
			...slots.default ? { default: () => slots.default?.() } : {}
		});
	}
});
var ReDivider = defineComponent({
	name: "ReDivider",
	inheritAttrs: true,
	props: {
		direction: {
			type: String,
			default: "horizontal"
		},
		contentPosition: {
			type: String,
			default: "center"
		},
		borderStyle: {
			type: String,
			default: "solid"
		},
		plain: {
			type: Boolean,
			default: true
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(ElDivider, {
			...attrs,
			direction: props.direction,
			contentPosition: props.contentPosition,
			borderStyle: props.borderStyle,
			plain: props.plain,
			class: "re-divider"
		}, slots.default);
	}
});
var ReLink = defineComponent({
	name: "ReLink",
	inheritAttrs: true,
	props: {
		type: {
			type: String,
			default: "default"
		},
		underline: {
			type: Boolean,
			default: true
		},
		disabled: {
			type: Boolean,
			default: false
		},
		href: { type: String },
		target: {
			type: String,
			default: "_blank"
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(ElLink, {
			...attrs,
			type: props.type,
			underline: props.underline,
			disabled: props.disabled,
			href: props.href,
			target: props.target,
			class: "re-link"
		}, slots.default);
	}
});
var ReAvatar = defineComponent({
	name: "ReAvatar",
	inheritAttrs: true,
	props: {
		size: {
			type: [Number, String],
			default: 40
		},
		shape: {
			type: String,
			default: "circle"
		},
		src: {
			type: String,
			default: ""
		},
		fit: {
			type: String,
			default: "cover"
		},
		alt: {
			type: String,
			default: ""
		}
	},
	setup(props, { attrs, slots }) {
		return () => h(ElAvatar, {
			...attrs,
			size: props.size,
			shape: props.shape,
			src: props.src,
			fit: props.fit,
			alt: props.alt,
			class: "re-avatar"
		}, slots.default);
	}
});
var COMPONENTS = [
	["ReOption", ReOption],
	["ReFormItem", ReFormItem],
	["ReRow", ReRow],
	["ReCol", ReCol],
	["ReRadioGroup", ReRadioGroup],
	["ReRadio", ReRadio],
	["ReRadioButton", ReRadioButton],
	["ReTreeSelect", ReTreeSelect],
	["ReTableColumn", ReTableColumn],
	["ReDropdown", ReDropdown],
	["ReDropdownMenu", ReDropdownMenu],
	["ReDropdownItem", ReDropdownItem],
	["ReDescriptions", ReDescriptions],
	["ReDescriptionsItem", ReDescriptionsItem],
	["ReAlert", ReAlert],
	["ReDivider", ReDivider],
	["ReLink", ReLink],
	["ReAvatar", ReAvatar]
];
var install = { install(app) {
	for (const [name, comp] of COMPONENTS) app.component(name, comp);
} };
//#endregion
export { ReAlert, ReAvatar, ReCol, ReDescriptions, ReDescriptionsItem, ReDivider, ReDropdown, ReDropdownItem, ReDropdownMenu, ReFormItem, ReLink, ReOption, ReRadio, ReRadioButton, ReRadioGroup, ReRow, ReTableColumn, ReTreeSelect, install as default, install };
