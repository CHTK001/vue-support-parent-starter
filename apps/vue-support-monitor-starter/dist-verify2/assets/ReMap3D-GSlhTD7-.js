import { $n as normalizeClass, D as createVNode, E as createTextVNode, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, w as createSlots, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { eo as Vector3, ir as Mesh } from "./three.core-BLfAYNmz.js";
//#region ../../packages/ui/src/components/ReMap3D/ReMap3D.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "map3d-head" };
var _hoisted_2 = { class: "map3d-title-wrap" };
var _hoisted_3 = { class: "map3d-controls" };
var _hoisted_4 = {
	key: 0,
	class: "map3d-overlay"
};
var _hoisted_5 = { class: "pin-legend" };
var _hoisted_6 = { class: "map3d-footer" };
var _hoisted_7 = { class: "map3d-pins" };
var _hoisted_8 = { class: "map3d-rotation" };
var _hoisted_9 = { class: "map3d-coords" };
//#endregion
//#region ../../packages/ui/src/components/ReMap3D/ReMap3D.vue
var ReMap3D_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReMap3D",
	props: {
		pins: { default: () => [
			{
				name: "北京",
				lat: 39.9042,
				lng: 116.4074,
				type: "server",
				value: 3
			},
			{
				name: "上海",
				lat: 31.2304,
				lng: 121.4737,
				type: "redis",
				value: 2
			},
			{
				name: "东京",
				lat: 35.6762,
				lng: 139.6503,
				type: "mysql",
				value: 1
			},
			{
				name: "法兰克福",
				lat: 50.1109,
				lng: 8.6821,
				type: "server",
				value: 4
			},
			{
				name: "圣何塞",
				lat: 37.3382,
				lng: -121.8863,
				type: "alert",
				value: 5
			},
			{
				name: "圣保罗",
				lat: -23.5505,
				lng: -46.6333,
				type: "server",
				value: 2
			}
		] },
		height: { default: 500 },
		autoRotate: {
			type: Boolean,
			default: true
		},
		showFooter: {
			type: Boolean,
			default: true
		}
	},
	emits: ["pin-click"],
	setup(__props, { emit: __emit }) {
		const pinColorMap = {
			server: "#5b8def",
			redis: "#f59e0b",
			mysql: "#22c55e",
			alert: "#ef4444",
			custom: "#a855f7"
		};
		const props = __props;
		const globeMode = ref("globe");
		const autoRotate = ref(props.autoRotate);
		const autoRotateSpeed = ref(.2);
		const geBodyHeight = computed(() => typeof props.height === "number" ? `${props.height}px` : props.height);
		const focalCoords = computed(() => {
			const p = props.pins[0];
			return p ? `${p.lat.toFixed(2)}, ${p.lng.toFixed(2)}` : "0, 0";
		});
		const pinColor = (type) => pinColorMap[type] || "#94a3b8";
		function latLonToVec3(lat, lng, r) {
			const phi = (90 - lat) * (Math.PI / 180);
			const theta = (lng + 180) * (Math.PI / 180);
			return new Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
		}
		const globeMesh = shallowRef(null);
		const wireframeMesh = shallowRef(null);
		const dotCloud = shallowRef(null);
		const pinGroup = shallowRef(null);
		const ringGroup = shallowRef(null);
		const globeGroup = shallowRef(null);
		function renderGlobe(ctx) {
			const { scene, THREE } = ctx;
			const grp = new THREE.Group();
			scene.add(grp);
			globeGroup.value = grp;
			const R = 20;
			const mode = globeMode.value;
			if (mode === "globe") {
				const geo = new THREE.SphereGeometry(R * .98, 64, 48);
				const mat = new THREE.MeshPhongMaterial({
					color: 1976635,
					transparent: true,
					opacity: .9,
					shininess: 40
				});
				const mesh = new THREE.Mesh(geo, mat);
				grp.add(mesh);
				globeMesh.value = mesh;
			}
			if (mode === "wireframe" || mode === "globe") {
				const wireGeo = new THREE.SphereGeometry(20, 24, 16);
				const wireMat = new THREE.MeshBasicMaterial({
					color: 3359061,
					wireframe: true,
					transparent: true,
					opacity: mode === "wireframe" ? .6 : .15
				});
				const wire = new THREE.Mesh(wireGeo, wireMat);
				grp.add(wire);
				wireframeMesh.value = wire;
			}
			if (mode === "dots" || mode === "globe") {
				const count = 2e3;
				const positions = new Float32Array(count * 3);
				const opacities = new Float32Array(count);
				for (let i = 0; i < count; i++) {
					const v = latLonToVec3((Math.random() - .5) * 180, (Math.random() - .5) * 360, R * 1.01);
					positions[i * 3] = v.x;
					positions[i * 3 + 1] = v.y;
					positions[i * 3 + 2] = v.z;
					opacities[i] = Math.random();
				}
				const dotGeo = new THREE.BufferGeometry();
				dotGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
				const dotMat = new THREE.PointsMaterial({
					size: mode === "dots" ? .4 : .25,
					color: 6583435,
					transparent: true,
					opacity: mode === "dots" ? .8 : .4,
					sizeAttenuation: true
				});
				const dots = new THREE.Points(dotGeo, dotMat);
				grp.add(dots);
				dotCloud.value = dots;
			}
			const pinGrp = new THREE.Group();
			grp.add(pinGrp);
			pinGroup.value = pinGrp;
			props.pins.forEach((pin) => {
				const pos = latLonToVec3(pin.lat, pin.lng, R);
				const col = new THREE.Color(pin.color || pinColor(pin.type || "custom"));
				const pinGeo = new THREE.CylinderGeometry(.15, .15, 1.5, 8);
				pinGeo.translate(0, .75, 0);
				const pinMat = new THREE.MeshPhongMaterial({
					color: col,
					transparent: true,
					opacity: .9,
					shininess: 80
				});
				const pinMesh = new THREE.Mesh(pinGeo, pinMat);
				pinMesh.position.copy(pos);
				pinMesh.lookAt(0, 0, 0);
				pinMesh.rotateX(Math.PI / 2);
				pinGrp.add(pinMesh);
				const headGeo = new THREE.SphereGeometry(.4, 12, 12);
				const headMesh = new THREE.Mesh(headGeo, pinMat);
				headMesh.position.copy(pos);
				headMesh.position.multiplyScalar(1.08);
				pinGrp.add(headMesh);
				const ringGeo = new THREE.RingGeometry(.5, .6, 24);
				const ringMat = new THREE.MeshBasicMaterial({
					color: col,
					transparent: true,
					opacity: .5,
					side: THREE.DoubleSide
				});
				const ring1 = new THREE.Mesh(ringGeo, ringMat);
				ring1.position.copy(pos);
				ring1.lookAt(0, 0, 0);
				pinGrp.add(ring1);
				const ring2 = ring1.clone();
				ring2.scale.set(1.8, 1.8, 1.8);
				pinGrp.add(ring2);
			});
			const rGrp = new THREE.Group();
			grp.add(rGrp);
			ringGroup.value = rGrp;
			const orbitGeo = new THREE.TorusGeometry(R * 1.15, .03, 8, 100);
			const orbitMat = new THREE.MeshBasicMaterial({
				color: 4674921,
				transparent: true,
				opacity: .4
			});
			const orbit1 = new THREE.Mesh(orbitGeo, orbitMat);
			orbit1.rotation.x = Math.PI / 3;
			rGrp.add(orbit1);
			const orbit2 = new THREE.Mesh(orbitGeo, orbitMat.clone());
			orbit2.rotation.x = -Math.PI / 4;
			orbit2.rotation.y = Math.PI / 6;
			orbit2.scale.set(1.05, .95, .95);
			rGrp.add(orbit2);
			const amb = new THREE.AmbientLight(16777215, .3);
			scene.add(amb);
			const dir = new THREE.DirectionalLight(16777215, .8);
			dir.position.set(50, 30, 40);
			scene.add(dir);
			const back = new THREE.DirectionalLight(6000111, .3);
			back.position.set(-40, -20, -30);
			scene.add(back);
			ctx.camera.position.set(0, 10, 70);
			ctx.camera.lookAt(0, 0, 0);
		}
		function animateGlobe(ctx) {
			const t = Date.now() * .001;
			if (pinGroup.value) pinGroup.value.children.forEach((child, i) => {
				if (child instanceof Mesh && child.geometry.type === "RingGeometry") {
					const s = 1 + Math.sin(t * 2 + i * .5) * .6;
					child.scale.set(s, s, s);
					const mat = Array.isArray(child.material) ? child.material[0] : child.material;
					if (mat && "opacity" in mat) mat.opacity = Math.max(0, .5 - Math.abs(s - 1) * .4);
				}
			});
			if (ringGroup.value) ringGroup.value.rotation.y = t * .1;
			if (dotCloud.value) {
				const mat = Array.isArray(dotCloud.value.material) ? dotCloud.value.material[0] : dotCloud.value.material;
				if (mat && "opacity" in mat) mat.opacity = .3 + Math.sin(t * 1.5) * .15;
			}
		}
		function rotateToDefault() {
			if (globeGroup.value) globeGroup.value.rotation.y = 0;
		}
		function toggleRotate() {
			autoRotate.value = !autoRotate.value;
		}
		function onReady() {}
		return (_ctx, _cache) => {
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_el_radio_button = resolveComponent("el-radio-button");
			const _component_el_radio_group = resolveComponent("el-radio-group");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_button_group = resolveComponent("el-button-group");
			const _component_ReThree = resolveComponent("ReThree");
			const _component_ReCard = resolveComponent("ReCard");
			return openBlock(), createBlock(_component_ReCard, {
				layout: "simple",
				radius: 12,
				padding: 0,
				shadow: "never",
				class: "re-map3d-card"
			}, createSlots({
				header: withCtx(() => [createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createVNode(_component_ReIcon, {
					name: "Earth",
					size: 16
				}), _cache[1] || (_cache[1] = createBaseVNode("span", { class: "map3d-title" }, "3D 地球", -1))]), createBaseVNode("div", _hoisted_3, [createVNode(_component_el_radio_group, {
					modelValue: globeMode.value,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => globeMode.value = $event),
					class: "map-mode"
				}, {
					default: withCtx(() => [
						createVNode(_component_el_radio_button, { value: "globe" }, {
							default: withCtx(() => [..._cache[2] || (_cache[2] = [createTextVNode("球体", -1)])]),
							_: 1
						}),
						createVNode(_component_el_radio_button, { value: "wireframe" }, {
							default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("线框", -1)])]),
							_: 1
						}),
						createVNode(_component_el_radio_button, { value: "dots" }, {
							default: withCtx(() => [..._cache[4] || (_cache[4] = [createTextVNode("点阵", -1)])]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["modelValue"]), createVNode(_component_el_button_group, { class: "map-nav" }, {
					default: withCtx(() => [createVNode(_component_el_button, {
						plain: "",
						onClick: rotateToDefault
					}, {
						default: withCtx(() => [createVNode(_component_ReIcon, { name: "HomeFilled" })]),
						_: 1
					}), createVNode(_component_el_button, {
						plain: "",
						icon: autoRotate.value ? "" : "",
						onClick: toggleRotate,
						class: normalizeClass({ active: autoRotate.value })
					}, {
						default: withCtx(() => [createVNode(_component_ReIcon, { name: "RefreshRight" })]),
						_: 1
					}, 8, ["icon", "class"])]),
					_: 1
				})])])]),
				default: withCtx(() => [createBaseVNode("div", {
					class: "map3d-body",
					style: normalizeStyle({ height: geBodyHeight.value })
				}, [createVNode(_component_ReThree, {
					render: renderGlobe,
					animate: animateGlobe,
					"auto-rotate": autoRotate.value,
					"auto-rotate-speed": .2,
					onReady
				}, null, 8, ["auto-rotate"]), __props.pins.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_4, [createBaseVNode("div", _hoisted_5, [_cache[5] || (_cache[5] = createBaseVNode("span", { class: "legend-title" }, "标记", -1)), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.pins, (p) => {
					return openBlock(), createElementBlock("span", {
						key: p.name,
						class: "legend-item"
					}, [createBaseVNode("span", {
						class: "legend-dot",
						style: normalizeStyle({ background: p.color || pinColor(p.type ?? "") })
					}, null, 4), createTextVNode(" " + toDisplayString(p.name), 1)]);
				}), 128))])])) : createCommentVNode("", true)], 4)]),
				_: 2
			}, [__props.showFooter ? {
				name: "footer",
				fn: withCtx(() => [createBaseVNode("div", _hoisted_6, [
					createBaseVNode("span", _hoisted_7, toDisplayString(__props.pins.length) + " 个标记", 1),
					createBaseVNode("span", _hoisted_8, "旋转速度 " + toDisplayString(autoRotateSpeed.value) + "x", 1),
					createBaseVNode("span", _hoisted_9, toDisplayString(focalCoords.value), 1)
				])]),
				key: "0"
			} : void 0]), 1024);
		};
	}
}), [["__scopeId", "data-v-b5f382a2"]]);
//#endregion
//#region ../../packages/ui/src/components/ReMap3D/index.ts
var plugin = { install(app) {
	app.component("ReMap3D", ReMap3D_default$1);
} };
var ReMap3D_default = ReMap3D_default$1;
//#endregion
export { ReMap3D_default as default, plugin as install };
