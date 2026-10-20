import { Ht as watch, b as createElementBlock, ct as onMounted, k as defineComponent, mt as openBlock, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
//#endregion
//#region ../../packages/ui/src/components/ReCountup/index.vue
var ReCountup_default = /* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		value: {},
		decimals: { default: 0 },
		duration: { default: 1500 },
		prefix: { default: "" },
		suffix: { default: "" }
	},
	setup(__props) {
		const props = __props;
		const elRef = ref();
		function animate() {
			const el = elRef.value;
			if (!el) return;
			const start = performance.now();
			const from = 0;
			const to = props.value;
			function tick(now) {
				const elapsed = now - start;
				const progress = Math.min(elapsed / props.duration, 1);
				const eased = 1 - Math.pow(1 - progress, 3);
				const current = from + (to - from) * eased;
				if (el) el.textContent = props.prefix + current.toFixed(props.decimals) + props.suffix;
				if (progress < 1) requestAnimationFrame(tick);
			}
			requestAnimationFrame(tick);
		}
		onMounted(animate);
		watch(() => props.value, animate);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", {
				ref_key: "elRef",
				ref: elRef,
				class: "re-countup"
			}, null, 512);
		};
	}
});
//#endregion
export { ReCountup_default as t };
