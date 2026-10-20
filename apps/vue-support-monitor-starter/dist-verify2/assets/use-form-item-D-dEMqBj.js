import { Ht as watch, J as inject, L as getCurrentInstance, ct as onMounted, ft as onUnmounted, g as computed, vn as ref, wn as toRef } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as useId } from "./use-id-C2v-tXFq.js";
import { n as formItemContextKey, t as formContextKey } from "./constants-ntbKDiND.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/form/src/hooks/use-form-item.mjs
var useFormItem = () => {
	return {
		form: inject(formContextKey, void 0),
		formItem: inject(formItemContextKey, void 0)
	};
};
var useFormItemInputId = (props, { formItemContext, disableIdGeneration, disableIdManagement }) => {
	if (!disableIdGeneration) disableIdGeneration = ref(false);
	if (!disableIdManagement) disableIdManagement = ref(false);
	const instance = getCurrentInstance();
	const inLabel = () => {
		let parent = instance?.parent;
		while (parent) {
			if (parent.type.name === "ElFormItem") return false;
			if (parent.type.name === "ElLabelWrap") return true;
			parent = parent.parent;
		}
		return false;
	};
	const inputId = ref();
	let idUnwatch = void 0;
	const isLabeledByFormItem = computed(() => {
		return !!(!(props.label || props.ariaLabel) && formItemContext && formItemContext.inputIds && formItemContext.inputIds?.length <= 1);
	});
	onMounted(() => {
		idUnwatch = watch([toRef(props, "id"), disableIdGeneration], ([id, disableIdGeneration]) => {
			const newId = id ?? (!disableIdGeneration ? useId().value : void 0);
			if (newId !== inputId.value) {
				if (formItemContext?.removeInputId && !inLabel()) {
					inputId.value && formItemContext.removeInputId(inputId.value);
					if (!disableIdManagement?.value && !disableIdGeneration && newId) formItemContext.addInputId(newId);
				}
				inputId.value = newId;
			}
		}, { immediate: true });
	});
	onUnmounted(() => {
		idUnwatch && idUnwatch();
		if (formItemContext?.removeInputId) inputId.value && formItemContext.removeInputId(inputId.value);
	});
	return {
		isLabeledByFormItem,
		inputId
	};
};
//#endregion
export { useFormItemInputId as n, useFormItem as t };
