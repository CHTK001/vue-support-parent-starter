import { Ht as watch, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, vn as ref, xn as shallowRef, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { c as simulation_default, f as center_default, l as link_default, s as manyBody_default, t as buildContainerStyle } from "./internals-C4HpkYaV.js";
import { Lt as Float32BufferAttribute, Or as PerspectiveCamera, Qi as Scene, St as DirectionalLight, U as Color, cr as MeshLambertMaterial, da as SphereGeometry, ir as Mesh, j as BufferGeometry, jn as LineBasicMaterial, kn as Line, qt as Group, r as AmbientLight } from "./three.core-BLfAYNmz.js";
import { t as WebGLRenderer } from "./three.module-K9H-7qa7.js";
//#endregion
//#region ../../packages/ui/src/components/ReGraph3D/theme/koi/ReGraph3D.vue
var ReGraph3D_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReGraph3D",
	__name: "ReGraph3D",
	props: {
		data: { default: void 0 },
		nodes: { default: void 0 },
		links: { default: void 0 },
		height: { default: "100%" },
		width: { default: "100%" },
		nodeColors: { default: () => ({
			default: "#5b8def",
			A: "#5b8def",
			B: "#22c55e",
			C: "#f59e0b",
			D: "#ef4444",
			E: "#a855f7"
		}) },
		nodeRelSize: { default: 3 },
		backgroundColor: { default: "transparent" },
		cameraDistance: { default: 600 },
		autoRotate: {
			type: Boolean,
			default: true
		},
		interactive: {
			type: Boolean,
			default: false
		}
	},
	emits: ["ready", "node-click"],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReGraph3D koi 主题 —— 精简版 3D 关系图
		*
		* 与 default 主题差异：
		*   - 移除顶部工具栏，仅保留 3D 画布
		*   - 节点/连线更克制（无文本标签、无箭头）
		*   - 自动旋转（关闭交互）
		*   - 适合纯展示场景（仪表盘背景）
		*/
		const props = __props;
		const emit = __emit;
		const containerRef = ref(null);
		const instance = shallowRef(null);
		const containerStyle = computed(() => buildContainerStyle(props.width, props.height));
		const finalData = computed(() => {
			if (props.data) return props.data;
			return {
				nodes: props.nodes ?? [],
				links: props.links ?? []
			};
		});
		let scene;
		let camera;
		let renderer;
		let simulation;
		let simNodes;
		let simLinks;
		let animationId = null;
		let nodeGroup;
		let linkGroup;
		let rotateEnabled = false;
		function initScene() {
			if (!containerRef.value) return;
			const w = containerRef.value.clientWidth;
			const h = containerRef.value.clientHeight;
			scene = new Scene();
			if (props.backgroundColor !== "transparent") scene.background = new Color(props.backgroundColor);
			camera = new PerspectiveCamera(45, w / h, 1, 5e3);
			camera.position.set(0, 0, props.cameraDistance);
			renderer = new WebGLRenderer({
				alpha: true,
				antialias: true
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.setSize(w, h);
			containerRef.value.appendChild(renderer.domElement);
			scene.add(new AmbientLight(16777215, .6));
			const dir = new DirectionalLight(16777215, 1);
			dir.position.set(200, 300, 400);
			scene.add(dir);
			nodeGroup = new Group();
			linkGroup = new Group();
			scene.add(nodeGroup, linkGroup);
			if (props.interactive) setupInteraction();
			rotateEnabled = props.autoRotate;
			new ResizeObserver(() => {
				if (!containerRef.value) return;
				const cw = containerRef.value.clientWidth;
				const ch = containerRef.value.clientHeight;
				if (cw === 0 || ch === 0) return;
				camera.aspect = cw / ch;
				camera.updateProjectionMatrix();
				renderer.setSize(cw, ch);
			}).observe(containerRef.value);
		}
		function buildSimulation() {
			const incoming = finalData.value;
			const incomingNodes = incoming.nodes ?? [];
			const incomingLinks = incoming.links ?? [];
			const degree = {};
			incomingLinks.forEach((l) => {
				const s = typeof l.source === "string" ? l.source : l.source;
				const t = typeof l.target === "string" ? l.target : l.target;
				if (s) degree[s] = (degree[s] || 0) + 1;
				if (t) degree[t] = (degree[t] || 0) + 1;
			});
			simNodes = incomingNodes.map((n) => {
				const group = n.group || "default";
				const colorHex = n.color || props.nodeColors[group] || props.nodeColors.default || "#5b8def";
				return {
					id: n.id,
					text: n.text || n.id,
					group,
					val: n.val ?? (degree[n.id] || 1),
					color: colorHex,
					data: n.data,
					baseColor: new Color(colorHex)
				};
			});
			simLinks = incomingLinks.map((l, i) => ({
				id: `${l.source}-${l.target}-${i}`,
				source: l.source,
				target: l.target,
				color: l.color || "#888888"
			}));
			while (nodeGroup.children.length) {
				const c = nodeGroup.children[0];
				nodeGroup.remove(c);
				disposeObject(c);
			}
			while (linkGroup.children.length) {
				const c = linkGroup.children[0];
				linkGroup.remove(c);
				disposeObject(c);
			}
			simNodes.forEach((n) => {
				const radius = Math.max(1.5, Math.sqrt(n.val || 1) * props.nodeRelSize);
				const geo = new SphereGeometry(radius, 12, 10);
				const mat = new MeshLambertMaterial({
					color: n.baseColor,
					transparent: true,
					opacity: .85
				});
				const mesh = new Mesh(geo, mat);
				mesh.position.set(n.x ?? 0, n.y ?? 0, n.z ?? 0);
				mesh.userData = { id: n.id };
				nodeGroup.add(mesh);
				n.mesh = mesh;
			});
			simLinks.forEach((l) => {
				const mat = new LineBasicMaterial({
					color: new Color(l.color || "#888888"),
					transparent: true,
					opacity: .35
				});
				const geo = new BufferGeometry();
				geo.setAttribute("position", new Float32BufferAttribute([
					0,
					0,
					0,
					0,
					0,
					0
				], 3));
				const line = new Line(geo, mat);
				linkGroup.add(line);
				l.line = line;
			});
		}
		function buildSimulationForce() {
			simulation = simulation_default(simNodes).force("link", link_default(simLinks).id((d) => d.id).distance(80).strength(.5)).force("charge", manyBody_default().strength(-60)).force("center", center_default(0, 0).strength(.05)).alphaDecay(.012).on("tick", tick);
		}
		function tick() {
			simNodes.forEach((n) => {
				if (n.mesh) n.mesh.position.set(n.x ?? 0, n.y ?? 0, n.z ?? 0);
			});
			simLinks.forEach((l) => {
				const s = l.source;
				const t = l.target;
				if (!s || !t || !l.line) return;
				const positions = l.line.geometry.attributes.position.array;
				positions[0] = s.x ?? 0;
				positions[1] = s.y ?? 0;
				positions[2] = s.z ?? 0;
				positions[3] = t.x ?? 0;
				positions[4] = t.y ?? 0;
				positions[5] = t.z ?? 0;
				l.line.geometry.attributes.position.needsUpdate = true;
			});
		}
		function animate() {
			animationId = requestAnimationFrame(animate);
			if (rotateEnabled) {
				const angle = .0015;
				const x = camera.position.x;
				const z = camera.position.z;
				camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
				camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
			}
			camera.lookAt(0, 0, 0);
			renderer.render(scene, camera);
		}
		function start() {
			if (animationId) return;
			animate();
		}
		function stop() {
			if (animationId !== null) {
				cancelAnimationFrame(animationId);
				animationId = null;
			}
		}
		function disposeObject(obj) {
			obj.traverse((child) => {
				const m = child;
				if (m.geometry) m.geometry.dispose();
				const mat = m.material;
				if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
				else if (mat) mat.dispose();
			});
		}
		function destroy() {
			stop();
			if (simulation) simulation.stop();
			if (renderer) {
				renderer.dispose();
				renderer.domElement.remove();
			}
			instance.value = null;
		}
		let pointerDown = false;
		let pointerStart = {
			x: 0,
			y: 0
		};
		let camStart = {
			x: 0,
			y: 0,
			z: 0
		};
		function setupInteraction() {
			const dom = renderer.domElement;
			dom.addEventListener("pointerdown", (ev) => {
				pointerDown = true;
				pointerStart = {
					x: ev.clientX,
					y: ev.clientY
				};
				camStart = {
					x: camera.position.x,
					y: camera.position.y,
					z: camera.position.z
				};
				dom.setPointerCapture(ev.pointerId);
			});
			dom.addEventListener("pointermove", (ev) => {
				if (!pointerDown) return;
				const dx = ev.clientX - pointerStart.x;
				const dy = ev.clientY - pointerStart.y;
				camera.position.x = camStart.x + dx * .6;
				camera.position.y = camStart.y - dy * .6;
			});
			dom.addEventListener("pointerup", () => {
				pointerDown = false;
			});
			dom.addEventListener("wheel", (ev) => {
				ev.preventDefault();
				camera.position.multiplyScalar(ev.deltaY > 0 ? 1.05 : .95);
			}, { passive: false });
		}
		onMounted(() => {
			initScene();
			buildSimulation();
			buildSimulationForce();
			start();
			instance.value = {
				scene,
				camera,
				renderer,
				simulation
			};
			emit("ready", instance.value);
		});
		watch(() => finalData.value, () => {
			if (!scene) return;
			buildSimulation();
			buildSimulationForce();
		}, { deep: true });
		watch(() => props.autoRotate, (v) => {
			rotateEnabled = v;
		});
		watch(() => props.backgroundColor, (v) => {
			if (!scene) return;
			scene.background = v === "transparent" ? null : new Color(v);
		});
		onBeforeUnmount(() => {
			destroy();
		});
		__expose({
			instance,
			fitView: () => camera.position.set(0, 0, props.cameraDistance)
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: "re-graph-3d-koi",
				style: normalizeStyle(containerStyle.value)
			}, [createBaseVNode("div", {
				ref_key: "containerRef",
				ref: containerRef,
				class: "re-graph-3d-koi__canvas"
			}, null, 512), renderSlot(_ctx.$slots, "overlay", {
				data: finalData.value,
				instance: instance.value
			}, void 0, true)], 4);
		};
	}
}), [["__scopeId", "data-v-a06d20d7"]]);
//#endregion
export { ReGraph3D_default as default };
