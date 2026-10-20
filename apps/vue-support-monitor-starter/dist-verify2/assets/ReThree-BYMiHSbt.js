import { On as unref, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, tt as nextTick, vn as ref, xn as shallowRef, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { Or as PerspectiveCamera, Qi as Scene, St as DirectionalLight, U as Color, r as AmbientLight } from "./three.core-BLfAYNmz.js";
import { n as three_module_exports, t as WebGLRenderer } from "./three.module-K9H-7qa7.js";
//#endregion
//#region ../../packages/ui/src/components/ReThree/theme/default/ReThree.vue
var ReThree_default = /* @__PURE__ */ defineComponent({
	__name: "ReThree",
	props: {
		width: { default: "100%" },
		height: { default: "100%" },
		backgroundColor: { default: "transparent" },
		autoRotate: {
			type: Boolean,
			default: false
		},
		autoRotateSpeed: { default: 1 },
		interactive: {
			type: Boolean,
			default: true
		},
		render: {
			type: Function,
			default: void 0
		},
		animate: {
			type: Function,
			default: void 0
		}
	},
	emits: ["ready"],
	setup(__props, { emit: __emit }) {
		/**
		* ReThree default 主题 —— 通用 Three.js 画布组件
		*
		* 提供标准 Three.js 渲染循环，暴露 scene / camera / renderer 供业务自定义渲染。
		*
		* 用法：import ReThree from '@repo/ui/re-three'
		*  在 render 回调中添加对象到 scene。
		*
		* 生命周期：
		*   onMounted -> initScene -> render 回调 -> RAF 循环
		*   onBeforeUnmount -> 停止 RAF -> 释放 renderer
		*/
		const props = __props;
		const emit = __emit;
		const containerRef = ref(null);
		const instance = shallowRef(null);
		let renderer = null;
		let scene = null;
		let camera = null;
		let animationId = null;
		const containerStyle = computed(() => {
			return {
				width: typeof props.width === "number" ? `${props.width}px` : props.width,
				height: typeof props.height === "number" ? `${props.height}px` : props.height,
				position: "relative",
				overflow: "hidden"
			};
		});
		function initScene() {
			if (!containerRef.value) return;
			const w = containerRef.value.clientWidth || 400;
			const h = containerRef.value.clientHeight || 300;
			scene = new Scene();
			if (props.backgroundColor !== "transparent") scene.background = new Color(props.backgroundColor);
			camera = new PerspectiveCamera(45, w / h, .1, 5e3);
			camera.position.set(0, 0, 300);
			renderer = new WebGLRenderer({
				alpha: true,
				antialias: true
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.setSize(w, h);
			containerRef.value.appendChild(renderer.domElement);
			const ambient = new AmbientLight(16777215, .5);
			scene.add(ambient);
			const directional = new DirectionalLight(16777215, 1);
			directional.position.set(100, 150, 200);
			scene.add(directional);
			const back = new DirectionalLight(16777215, .3);
			back.position.set(-150, -100, -200);
			scene.add(back);
			instance.value = {
				scene,
				camera,
				renderer,
				THREE: three_module_exports
			};
			emit("ready", instance.value);
			if (props.render) try {
				props.render(instance.value);
			} catch (e) {
				console.error("[ReThree] render 回调异常", e);
			}
			startLoop();
			setupResize();
		}
		function startLoop() {
			const loop = () => {
				animationId = requestAnimationFrame(loop);
				if (props.autoRotate && scene) scene.rotation.y += props.autoRotateSpeed * Math.PI / 180;
				if (props.animate && instance.value) try {
					props.animate(instance.value);
				} catch (e) {
					console.error("[ReThree] animate 回调异常", e);
				}
				if (renderer && scene && camera) renderer.render(scene, camera);
			};
			loop();
		}
		function stopLoop() {
			if (animationId) {
				cancelAnimationFrame(animationId);
				animationId = null;
			}
		}
		function setupResize() {
			const observer = new ResizeObserver(() => {
				if (!containerRef.value || !camera || !renderer) return;
				const w = containerRef.value.clientWidth;
				const h = containerRef.value.clientHeight;
				if (w > 0 && h > 0) {
					camera.aspect = w / h;
					camera.updateProjectionMatrix();
					renderer.setSize(w, h);
				}
			});
			if (containerRef.value) observer.observe(containerRef.value);
		}
		onMounted(async () => {
			await nextTick();
			initScene();
		});
		onBeforeUnmount(() => {
			stopLoop();
			if (renderer) {
				renderer.dispose();
				if (containerRef.value) {
					const dom = renderer.domElement;
					if (dom.parentNode) dom.parentNode.removeChild(dom);
				}
				renderer = null;
			}
			scene = null;
			camera = null;
			instance.value = null;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "containerRef",
				ref: containerRef,
				style: normalizeStyle(containerStyle.value)
			}, [renderSlot(_ctx.$slots, "default", {
				scene: unref(scene),
				camera: unref(camera),
				renderer: unref(renderer),
				THREE: instance.value?.THREE
			})], 4);
		};
	}
});
//#endregion
export { ReThree_default as default };
