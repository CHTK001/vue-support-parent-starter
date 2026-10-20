import { D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xn as shallowRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { $ as full_screen_default, Bt as search_default, Nt as refresh_default, hn as zoom_out_default, ln as video_pause_default, mn as zoom_in_default, un as video_play_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { c as simulation_default, f as center_default, i as splitKeywords, l as link_default, r as fuzzyMatchNodes, s as manyBody_default, t as buildContainerStyle } from "./internals-C4HpkYaV.js";
import { $a as Vector2, Ii as Raycaster, L as CanvasTexture, Ln as LinearFilter, Lt as Float32BufferAttribute, Or as PerspectiveCamera, Qi as Scene, St as DirectionalLight, U as Color, Z as ConeGeometry, _a as Sprite, ar as MeshBasicMaterial, cr as MeshLambertMaterial, da as SphereGeometry, ir as Mesh, j as BufferGeometry, jn as LineBasicMaterial, kn as Line, qt as Group, r as AmbientLight, va as SpriteMaterial } from "./three.core-BLfAYNmz.js";
import { t as WebGLRenderer } from "./three.module-K9H-7qa7.js";
//#region ../../packages/ui/src/components/ReGraph3D/theme/default/ReGraph3D.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-graph-3d__toolbar" };
var _hoisted_2 = { class: "re-graph-3d__toolbar-left" };
var _hoisted_3 = { class: "re-graph-3d__toolbar-right" };
var _hoisted_4 = {
	key: 0,
	class: "re-graph-3d__loading"
};
var _hoisted_5 = {
	key: 1,
	class: "re-graph-3d__empty"
};
var _hoisted_6 = { class: "re-graph-3d__statusbar" };
var _hoisted_7 = {
	key: 0,
	class: "re-graph-3d__statusbar-item--warn"
};
var _hoisted_8 = {
	key: 1,
	class: "re-graph-3d__statusbar-item--info"
};
//#endregion
//#region ../../packages/ui/src/components/ReGraph3D/theme/default/ReGraph3D.vue
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
		nodeRelSize: { default: 4 },
		backgroundColor: { default: "transparent" },
		showNodeLabel: {
			type: Boolean,
			default: true
		},
		showLinkLabel: {
			type: Boolean,
			default: false
		},
		linkWidth: { default: 1 },
		linkArrowLength: { default: 6 },
		forceChargeStrength: { default: -90 },
		forceLinkDistance: { default: 60 },
		forceCenterStrength: { default: .05 },
		cameraDistance: { default: 800 },
		autoRotate: {
			type: Boolean,
			default: false
		},
		interactive: {
			type: Boolean,
			default: true
		},
		debug: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"ready",
		"node-click",
		"node-hover",
		"link-click"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReGraph3D default 主题 —— 3D 力导向关系图（功能完整版）
		*
		* 底层实现：three.js + d3-force-3d 模拟 3d-force-graph 算法
		* （自行实现，不引入第三方 3d-force-graph 包）。
		*
		* 功能：
		*   - 3D 渲染（WebGL/three.js）
		*   - 力导向布局（基于 d3-force-3d 算法）
		*   - 鼠标拖拽旋转 / 滚轮缩放
		*   - 自动旋转
		*   - 节点悬停高亮 / 节点点击事件
		*   - 颜色按 group 分组 / 自定义
		*   - 节点大小按 val / 度数计算
		*   - 方向箭头
		*   - 节点/连线文本标签
		*/
		/** 内部模拟节点（继承 d3 SimulationNodeDatum + z 轴） */
		const props = __props;
		const emit = __emit;
		/** 容器引用 */
		const containerRef = ref(null);
		/** Three.js 实例引用（暴露给外部） */
		const instance = shallowRef(null);
		/** 状态 */
		const state = reactive({
			loading: false,
			paused: false,
			rotate: false,
			keyword: "",
			hoveredId: null
		});
		/** 容器样式 */
		const containerStyle = computed(() => buildContainerStyle(props.width, props.height));
		/** 归一化最终数据 */
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
		let raycaster;
		let pointer;
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
			const ambient = new AmbientLight(16777215, .6);
			scene.add(ambient);
			const directional = new DirectionalLight(16777215, 1);
			directional.position.set(200, 300, 400);
			scene.add(directional);
			const back = new DirectionalLight(16777215, .4);
			back.position.set(-300, -100, -200);
			scene.add(back);
			nodeGroup = new Group();
			linkGroup = new Group();
			scene.add(nodeGroup);
			scene.add(linkGroup);
			raycaster = new Raycaster();
			pointer = new Vector2();
			setupInteraction();
			setupResize();
		}
		/** 创建节点球体 + 文本标签 */
		function createNodeMesh(node) {
			const radius = Math.max(2, Math.sqrt(node.val || 1) * props.nodeRelSize);
			const geometry = new SphereGeometry(radius, 16, 12);
			const material = new MeshLambertMaterial({
				color: node.baseColor,
				emissive: node.baseColor.clone().multiplyScalar(.15)
			});
			const mesh = new Mesh(geometry, material);
			mesh.position.set(node.x ?? 0, node.y ?? 0, node.z ?? 0);
			mesh.userData = {
				id: node.id,
				type: "node"
			};
			nodeGroup.add(mesh);
			if (props.showNodeLabel) {
				const sprite = makeTextSprite(node.text || node.id, node.baseColor);
				sprite.position.set(0, radius + 4, 0);
				mesh.add(sprite);
				node.label = sprite;
			}
			node.mesh = mesh;
		}
		/** 创建连线 Line + 箭头 */
		function createLinkMesh(link) {
			const color = new Color(link.color || "#888888");
			const material = new LineBasicMaterial({
				color,
				transparent: true,
				opacity: .55
			});
			const geometry = new BufferGeometry();
			geometry.setAttribute("position", new Float32BufferAttribute([
				0,
				0,
				0,
				0,
				0,
				0
			], 3));
			const line = new Line(geometry, material);
			line.userData = {
				id: link.id,
				type: "link"
			};
			linkGroup.add(line);
			link.line = line;
			if (props.linkArrowLength > 0) {
				const arrowGeom = new ConeGeometry(2, props.linkArrowLength, 8);
				const arrowMat = new MeshBasicMaterial({ color });
				const arrow = new Mesh(arrowGeom, arrowMat);
				arrow.visible = false;
				arrow.userData = {
					id: link.id,
					type: "arrow"
				};
				linkGroup.add(arrow);
				link.arrow = arrow;
			}
		}
		/** 文本精灵（用 Canvas 贴图实现） */
		function makeTextSprite(text, color) {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const fontSize = 28;
			ctx.font = `${fontSize}px sans-serif`;
			canvas.width = ctx.measureText(text).width + 16;
			canvas.height = 40;
			ctx.font = `${fontSize}px sans-serif`;
			ctx.fillStyle = "rgba(255,255,255,0.92)";
			ctx.strokeStyle = "rgba(0,0,0,0.4)";
			ctx.lineWidth = 3;
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
			ctx.fillText(text, canvas.width / 2, canvas.height / 2);
			const texture = new CanvasTexture(canvas);
			texture.minFilter = LinearFilter;
			const material = new SpriteMaterial({
				map: texture,
				transparent: true,
				depthWrite: false
			});
			const sprite = new Sprite(material);
			const scale = 6;
			sprite.scale.set(canvas.width / canvas.height * scale, scale, 1);
			return sprite;
		}
		/** 构建模拟数据 */
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
				text: l.text,
				color: l.color || "#888888",
				width: l.width ?? props.linkWidth
			}));
			while (nodeGroup.children.length) {
				const child = nodeGroup.children[0];
				nodeGroup.remove(child);
				disposeObject(child);
			}
			while (linkGroup.children.length) {
				const child = linkGroup.children[0];
				linkGroup.remove(child);
				disposeObject(child);
			}
			simNodes.forEach((n) => createNodeMesh(n));
			simLinks.forEach((l) => createLinkMesh(l));
		}
		/** 构建力学模拟 */
		function buildSimulationForce() {
			simulation = simulation_default(simNodes).force("link", link_default(simLinks).id((d) => d.id).distance(props.forceLinkDistance).strength(.6)).force("charge", manyBody_default().strength(props.forceChargeStrength)).force("center", center_default(0, 0).strength(props.forceCenterStrength)).alphaDecay(.015).on("tick", tick);
		}
		/** 每帧更新位置 */
		function tick() {
			simNodes.forEach((node) => {
				if (node.mesh) node.mesh.position.set(node.x ?? 0, node.y ?? 0, node.z ?? 0);
			});
			simLinks.forEach((link) => {
				const s = link.source;
				const t = link.target;
				if (!s || !t || !link.line) return;
				const line = link.line;
				const positions = line.geometry.attributes.position.array;
				positions[0] = s.x ?? 0;
				positions[1] = s.y ?? 0;
				positions[2] = s.z ?? 0;
				positions[3] = t.x ?? 0;
				positions[4] = t.y ?? 0;
				positions[5] = t.z ?? 0;
				line.geometry.attributes.position.needsUpdate = true;
				if (link.arrow) {
					const dx = (t.x ?? 0) - (s.x ?? 0);
					const dy = (t.y ?? 0) - (s.y ?? 0);
					const dz = (t.z ?? 0) - (s.z ?? 0);
					const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
					if (len > 0) {
						const tr = Math.max(2, Math.sqrt(t.val || 1) * props.nodeRelSize);
						const dirX = dx / len;
						const dirY = dy / len;
						const dirZ = dz / len;
						const arrowLen = props.linkArrowLength;
						link.arrow.position.set((t.x ?? 0) - dirX * (tr + arrowLen / 2), (t.y ?? 0) - dirY * (tr + arrowLen / 2), (t.z ?? 0) - dirZ * (tr + arrowLen / 2));
						link.arrow.visible = true;
						link.arrow.lookAt(t.x ?? 0, t.y ?? 0, t.z ?? 0);
						link.arrow.rotateX(Math.PI / 2);
					}
				}
			});
		}
		/** 渲染循环 */
		function animate() {
			animationId = requestAnimationFrame(animate);
			if (state.rotate && !state.paused) {
				const angle = .002;
				const x = camera.position.x;
				const z = camera.position.z;
				camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
				camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
			}
			camera.lookAt(0, 0, 0);
			if (renderer && scene && camera) renderer.render(scene, camera);
		}
		function startAnimation() {
			if (animationId) return;
			animate();
		}
		function stopAnimation() {
			if (animationId !== null) {
				cancelAnimationFrame(animationId);
				animationId = null;
			}
		}
		let isPointerDown = false;
		let pointerStart = {
			x: 0,
			y: 0
		};
		let cameraStart = {
			x: 0,
			y: 0,
			z: 0
		};
		function setupInteraction() {
			if (!props.interactive || !renderer) return;
			const dom = renderer.domElement;
			dom.addEventListener("pointerdown", (ev) => {
				isPointerDown = true;
				pointerStart = {
					x: ev.clientX,
					y: ev.clientY
				};
				cameraStart = {
					x: camera.position.x,
					y: camera.position.y,
					z: camera.position.z
				};
				dom.setPointerCapture(ev.pointerId);
			});
			dom.addEventListener("pointermove", (ev) => {
				if (!isPointerDown) {
					pickAtPointer(ev);
					return;
				}
				const dx = ev.clientX - pointerStart.x;
				const dy = ev.clientY - pointerStart.y;
				const factor = 1;
				camera.position.x = cameraStart.x + dx * factor;
				camera.position.y = cameraStart.y - dy * factor;
			});
			dom.addEventListener("pointerup", (ev) => {
				if (isPointerDown) {
					isPointerDown = false;
					try {
						dom.releasePointerCapture(ev.pointerId);
					} catch {}
				}
			});
			dom.addEventListener("wheel", (ev) => {
				ev.preventDefault();
				const dir = ev.deltaY > 0 ? 1.05 : .95;
				camera.position.multiplyScalar(dir);
			}, { passive: false });
			dom.addEventListener("click", (ev) => {
				pickAtPointer(ev, true);
			});
		}
		/** 拾取节点 */
		function pickAtPointer(ev, fireClick = false) {
			if (!containerRef.value) return;
			const rect = containerRef.value.getBoundingClientRect();
			pointer.x = (ev.clientX - rect.left) / rect.width * 2 - 1;
			pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);
			const intersects = raycaster.intersectObjects(nodeGroup.children);
			if (intersects.length > 0) {
				const id = intersects[0].object.userData?.id;
				const simNode = simNodes.find((n) => n.id === id);
				if (!simNode) return;
				if (fireClick) emit("node-click", {
					id: simNode.id,
					text: simNode.text,
					group: simNode.group,
					val: simNode.val,
					color: simNode.color,
					data: simNode.data
				});
				else {
					state.hoveredId = simNode.id;
					emit("node-hover", {
						id: simNode.id,
						text: simNode.text,
						group: simNode.group,
						val: simNode.val,
						color: simNode.color,
						data: simNode.data
					});
				}
			} else if (!fireClick) {
				if (state.hoveredId) {
					state.hoveredId = null;
					emit("node-hover", null);
				}
			}
		}
		/** 自适应容器尺寸 */
		function setupResize() {
			if (!containerRef.value) return;
			new ResizeObserver(() => {
				if (!containerRef.value) return;
				const w = containerRef.value.clientWidth;
				const h = containerRef.value.clientHeight;
				if (w === 0 || h === 0) return;
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
				renderer.setSize(w, h);
			}).observe(containerRef.value);
		}
		/** 销毁场景 */
		function disposeObject(obj) {
			obj.traverse((child) => {
				const mesh = child;
				if (mesh.geometry) mesh.geometry.dispose();
				const mat = mesh.material;
				if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
				else if (mat) mat.dispose();
				const sprite = child;
				if (sprite.material) {
					const spriteMat = sprite.material;
					spriteMat.map?.dispose();
					spriteMat.dispose();
				}
			});
		}
		function destroyScene() {
			stopAnimation();
			if (simulation) simulation.stop();
			if (renderer) {
				renderer.dispose();
				renderer.domElement.remove();
			}
			instance.value = null;
		}
		function rebuild() {
			if (!scene) return;
			state.loading = true;
			try {
				buildSimulation();
				buildSimulationForce();
			} finally {
				state.loading = false;
			}
		}
		onMounted(() => {
			initScene();
			rebuild();
			startAnimation();
			instance.value = {
				scene,
				camera,
				renderer,
				simulation,
				pause: () => {
					simulation.stop();
					state.paused = true;
				},
				resume: () => {
					simulation.alpha(.3).restart();
					state.paused = false;
				},
				restart: () => {
					simulation.alpha(.8).restart();
					state.paused = false;
				},
				zoomTo: (distance) => {
					const dir = camera.position.clone().normalize();
					camera.position.copy(dir.multiplyScalar(distance));
				},
				focusNode: (id) => {
					const node = simNodes.find((n) => n.id === id);
					if (!node) return;
					camera.position.set((node.x ?? 0) * 2, (node.y ?? 0) * 2, (node.z ?? 0) * 2 + props.cameraDistance);
				},
				fitView: () => {
					camera.position.set(0, 0, props.cameraDistance);
				}
			};
			emit("ready", instance.value);
		});
		watch(() => finalData.value, () => {
			rebuild();
		}, { deep: true });
		watch(() => props.backgroundColor, () => {
			if (!scene) return;
			if (props.backgroundColor === "transparent") scene.background = null;
			else scene.background = new Color(props.backgroundColor);
		});
		watch(() => props.showNodeLabel, (val) => {
			simNodes?.forEach((n) => {
				if (n.label) n.label.visible = val;
			});
		});
		watch(() => props.autoRotate, (val) => {
			state.rotate = val;
		}, { immediate: true });
		onBeforeUnmount(() => {
			destroyScene();
		});
		watch(() => state.keyword, (kw) => {
			if (!simNodes) return;
			if (!kw.trim()) {
				simNodes.forEach((n) => {
					if (n.mesh) n.mesh.scale.setScalar(1);
				});
				return;
			}
			const keywords = splitKeywords(kw);
			const matched = /* @__PURE__ */ new Set();
			const plainNodes = simNodes.map((n) => ({
				id: n.id,
				text: n.text
			}));
			keywords.forEach((k) => {
				fuzzyMatchNodes(plainNodes, k).forEach((n) => matched.add(n.id));
			});
			simNodes.forEach((n) => {
				if (!n.mesh) return;
				const isMatch = matched.has(n.id);
				n.mesh.scale.setScalar(isMatch ? 1.6 : .6);
			});
		});
		function zoom(delta) {
			const cur = camera.position.length();
			camera.position.multiplyScalar(cur > 0 ? delta : 1);
		}
		function restart() {
			simulation?.alpha(.8).restart();
			state.paused = false;
		}
		function fitView() {
			camera.position.set(0, 0, props.cameraDistance);
		}
		function toggleRotate() {
			state.rotate = !state.rotate;
		}
		__expose({
			instance,
			zoom,
			restart,
			fitView,
			toggleRotate,
			pause: () => {
				simulation?.stop();
				state.paused = true;
			},
			resume: () => {
				simulation?.alpha(.3).restart();
				state.paused = false;
			}
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_button_group = resolveComponent("el-button-group");
			return openBlock(), createElementBlock("div", {
				class: "re-graph-3d",
				style: normalizeStyle(containerStyle.value)
			}, [
				createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createVNode(_component_el_input, {
					modelValue: state.keyword,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => state.keyword = $event),
					placeholder: "搜索节点",
					clearable: ""
				}, {
					prefix: withCtx(() => [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(search_default))]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue"])]), createBaseVNode("div", _hoisted_3, [createVNode(_component_el_button_group, null, {
					default: withCtx(() => [
						createVNode(_component_el_button, { onClick: _cache[1] || (_cache[1] = ($event) => zoom(.9)) }, {
							default: withCtx(() => [createVNode(_component_el_icon, null, {
								default: withCtx(() => [createVNode(unref(zoom_in_default))]),
								_: 1
							})]),
							_: 1
						}),
						createVNode(_component_el_button, { onClick: _cache[2] || (_cache[2] = ($event) => zoom(1.1)) }, {
							default: withCtx(() => [createVNode(_component_el_icon, null, {
								default: withCtx(() => [createVNode(unref(zoom_out_default))]),
								_: 1
							})]),
							_: 1
						}),
						createVNode(_component_el_button, { onClick: fitView }, {
							default: withCtx(() => [createVNode(_component_el_icon, null, {
								default: withCtx(() => [createVNode(unref(full_screen_default))]),
								_: 1
							})]),
							_: 1
						}),
						createVNode(_component_el_button, { onClick: toggleRotate }, {
							default: withCtx(() => [state.rotate ? (openBlock(), createBlock(_component_el_icon, { key: 0 }, {
								default: withCtx(() => [createVNode(unref(video_pause_default))]),
								_: 1
							})) : (openBlock(), createBlock(_component_el_icon, { key: 1 }, {
								default: withCtx(() => [createVNode(unref(video_play_default))]),
								_: 1
							})), createTextVNode(" " + toDisplayString(state.rotate ? "停止" : "旋转"), 1)]),
							_: 1
						}),
						createVNode(_component_el_button, { onClick: restart }, {
							default: withCtx(() => [createVNode(_component_el_icon, null, {
								default: withCtx(() => [createVNode(unref(refresh_default))]),
								_: 1
							}), _cache[3] || (_cache[3] = createTextVNode(" 重启 ", -1))]),
							_: 1
						})
					]),
					_: 1
				}), renderSlot(_ctx.$slots, "toolbar", { instance: instance.value }, void 0, true)])]),
				createBaseVNode("div", {
					ref_key: "containerRef",
					ref: containerRef,
					class: "re-graph-3d__canvas"
				}, null, 512),
				state.loading ? (openBlock(), createElementBlock("div", _hoisted_4, [..._cache[4] || (_cache[4] = [createBaseVNode("span", null, "构建图谱中...", -1)])])) : createCommentVNode("", true),
				!state.loading && unref(simNodes) && unref(simNodes).length === 0 ? (openBlock(), createElementBlock("div", _hoisted_5, [..._cache[5] || (_cache[5] = [createBaseVNode("span", null, "暂无数据", -1)])])) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_6, [
					createBaseVNode("span", null, "节点 " + toDisplayString(finalData.value.nodes?.length ?? 0), 1),
					createBaseVNode("span", null, "连线 " + toDisplayString(finalData.value.links?.length ?? 0), 1),
					state.paused ? (openBlock(), createElementBlock("span", _hoisted_7, "已暂停")) : createCommentVNode("", true),
					state.keyword ? (openBlock(), createElementBlock("span", _hoisted_8, " 搜索：" + toDisplayString(state.keyword), 1)) : createCommentVNode("", true),
					renderSlot(_ctx.$slots, "status", {
						data: finalData.value,
						instance: instance.value
					}, void 0, true)
				])
			], 4);
		};
	}
}), [["__scopeId", "data-v-c30abcd5"]]);
//#endregion
export { ReGraph3D_default as default };
