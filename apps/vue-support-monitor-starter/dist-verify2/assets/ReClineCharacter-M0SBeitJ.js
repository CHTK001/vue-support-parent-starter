import { Ht as watch, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { A as BufferAttribute, Ar as PlaneGeometry, Fr as PointsMaterial, H as Clock, L as CanvasTexture, Ln as LinearFilter, O as BoxGeometry, Or as PerspectiveCamera, Pr as Points, Qi as Scene, Ri as RedFormat, St as DirectionalLight, U as Color, Xi as SRGBColorSpace, Z as ConeGeometry, Zn as MOUSE, ar as MeshBasicMaterial, ct as CylinderGeometry, da as SphereGeometry, ft as DataTexture, ir as Mesh, j as BufferGeometry, na as ShapeGeometry, pr as MeshStandardMaterial, qt as Group, r as AmbientLight, ta as Shape } from "./three.core-BLfAYNmz.js";
import { t as WebGLRenderer } from "./three.module-K9H-7qa7.js";
import { t as OrbitControls } from "./OrbitControls-Bb5yObQF.js";
//#region ../../packages/ui/src/components/ReClineCharacter/ReClineCharacter.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-cline-character__placeholder"
};
var _hoisted_2 = { class: "re-cline-character__placeholder-text" };
var _hoisted_3 = {
	key: 1,
	class: "re-cline-character__loading"
};
var _hoisted_4 = {
	key: 3,
	class: "re-cline-character__error"
};
//#endregion
//#region ../../packages/ui/src/components/ReClineCharacter/ReClineCharacter.vue
var ReClineCharacter_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReClineCharacter",
	props: {
		ascii: {},
		src: {},
		width: { default: 400 },
		height: { default: 400 },
		floatAmplitude: { default: 10 },
		floatSpeed: { default: 1.2 },
		interactive: {
			type: Boolean,
			default: true
		},
		particles: {
			type: Boolean,
			default: true
		},
		autoRotate: {
			type: Boolean,
			default: false
		},
		autoRotateSpeed: { default: .3 },
		gradientTopColor: { default: "#2d1b69" },
		gradientBottomColor: { default: "#e8a0d0" },
		fontSize: { default: 14 },
		charWidth: { default: 60 },
		displacementScale: { default: .4 },
		segments: { default: 100 },
		robotColor: { default: "#f0f0f5" },
		stoneColor: { default: "#4a2c8a" },
		eyeColor: { default: "#3d1a4a" },
		allowUpload: {
			type: Boolean,
			default: false
		},
		placeholder: { default: "点击或拖入图片" },
		lightColor: { default: "#ffffff" },
		fillLightColor: { default: "#9663f1" }
	},
	emits: ["ready", "error"],
	setup(__props, { emit: __emit }) {
		[
			"      .-.      ",
			"     (   )     ",
			"    /     \\    ",
			"   |  O O  |   ",
			"   |  ^^^  |   ",
			"    \\_____/    ",
			"    |  |  |    ",
			"    |  |  |    ",
			"   _|  |  |_   ",
			"  (_________)  "
		].join("\n");
		const props = __props;
		const emit = __emit;
		const containerRef = ref(null);
		const fileInputRef = ref(null);
		const loading = ref(true);
		const errorMsg = ref("");
		const _mode = ref("default");
		const _imageLoaded = ref(false);
		let scene = null;
		let camera = null;
		let renderer = null;
		let characterGroup = null;
		let asciiMesh = null;
		let particles = null;
		let controls = null;
		let animationId = null;
		let clock = null;
		/** 图片 → ASCII 字符画 */
		function imageToAscii(img, targetWidth, charSet = "@%#*+=-:. ") {
			const aspectRatio = img.height / img.width;
			const targetHeight = Math.round(targetWidth * aspectRatio * .5);
			const canvas = document.createElement("canvas");
			canvas.width = targetWidth;
			canvas.height = targetHeight;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
			const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
			const chars = [];
			for (let y = 0; y < targetHeight; y += 2) {
				const line = [];
				for (let x = 0; x < targetWidth; x += 1) {
					const idx = (y * targetWidth + x) * 4;
					const r = imageData.data[idx];
					const g = imageData.data[idx + 1];
					const b = imageData.data[idx + 2];
					const brightness = (.299 * r + .587 * g + .114 * b) / 255;
					const charIdx = Math.floor(brightness * (charSet.length - 1));
					line.push(charSet[charIdx]);
				}
				chars.push(line.join(""));
			}
			return chars.join("\n");
		}
		/** ASCII 字符串 → Canvas 深度图 */
		function asciiToDepthCanvas(ascii, canvasWidth, fontSize, charSet = "@%#*+=-:. ") {
			const lines = ascii.split("\n").filter((l) => l.trim());
			if (lines.length === 0) {
				const c = document.createElement("canvas");
				c.width = canvasWidth;
				c.height = 64;
				return c;
			}
			const testCtx = document.createElement("canvas").getContext("2d");
			testCtx.font = `${fontSize}px monospace`;
			const charW = testCtx.measureText("M").width;
			const lineH = fontSize * 1.2;
			const lineHeight = Math.max(lines[0].length * charW, canvasWidth);
			const canvasHeight = Math.max(lines.length * lineH, 64);
			const canvas = document.createElement("canvas");
			canvas.width = Math.ceil(lineHeight);
			canvas.height = Math.ceil(canvasHeight);
			const ctx = canvas.getContext("2d");
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "#ffffff";
			ctx.font = `${fontSize}px monospace`;
			ctx.textBaseline = "top";
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				for (let j = 0; j < line.length; j++) {
					const ch = line[j];
					if (ch === " " || ch === "") continue;
					const brightness = charSet.indexOf(ch);
					const intensity = Math.max(0, Math.min(255, Math.round(brightness / (charSet.length - 1) * 255)));
					ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
					ctx.fillText(ch, j * charW, i * lineH);
				}
			}
			return canvas;
		}
		/** 加载图片为 HTMLImageElement */
		function loadImage(url) {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.onload = () => resolve(img);
				img.onerror = () => reject(/* @__PURE__ */ new Error(`图片加载失败: ${url}`));
				img.src = url;
			});
		}
		/** 加载文件为 data URL */
		function loadFileAsDataURL(file) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result);
				reader.onerror = () => reject(/* @__PURE__ */ new Error("文件读取失败"));
				reader.readAsDataURL(file);
			});
		}
		async function initScene(asciiContent) {
			if (!containerRef.value) return;
			const container = containerRef.value;
			const w = props.width;
			const h = props.height;
			destroyScene();
			scene = new Scene();
			camera = new PerspectiveCamera(40, w / h, .1, 100);
			camera.position.set(0, .3, 5);
			camera.lookAt(0, 0, 0);
			renderer = new WebGLRenderer({
				alpha: true,
				antialias: true
			});
			renderer.setSize(w, h);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = 2;
			renderer.outputColorSpace = SRGBColorSpace;
			container.appendChild(renderer.domElement);
			const ambient = new AmbientLight(16777215, .5);
			scene.add(ambient);
			const dirLight = new DirectionalLight(props.lightColor, 1.2);
			dirLight.position.set(3, 5, 4);
			dirLight.castShadow = true;
			dirLight.shadow.mapSize.set(1024, 1024);
			scene.add(dirLight);
			const fillLight = new DirectionalLight(props.fillLightColor, .4);
			fillLight.position.set(-3, 2, -2);
			scene.add(fillLight);
			const rimLight = new DirectionalLight(16777215, .25);
			rimLight.position.set(0, -2, -3);
			scene.add(rimLight);
			const bgGeo = new PlaneGeometry(30, 20);
			const bgCanvas = document.createElement("canvas");
			bgCanvas.width = 512;
			bgCanvas.height = 512;
			const bgCtx = bgCanvas.getContext("2d");
			const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
			bgGrad.addColorStop(0, props.gradientTopColor);
			bgGrad.addColorStop(1, props.gradientBottomColor);
			bgCtx.fillStyle = bgGrad;
			bgCtx.fillRect(0, 0, 512, 512);
			for (let i = 0; i < 2e3; i++) {
				const gx = Math.random() * 512;
				const gy = Math.random() * 512;
				bgCtx.fillStyle = `rgba(255,255,255,${Math.random() * .03})`;
				bgCtx.fillRect(gx, gy, 1, 1);
			}
			const bgTex = new CanvasTexture(bgCanvas);
			const bgMat = new MeshBasicMaterial({
				map: bgTex,
				depthWrite: false
			});
			const bgMesh = new Mesh(bgGeo, bgMat);
			bgMesh.position.z = -6;
			scene.add(bgMesh);
			if (asciiContent) {
				_mode.value = "ascii";
				const depthCanvas = asciiToDepthCanvas(asciiContent, w, props.fontSize, "@%#*+=-:. ");
				const srcPixels = depthCanvas.getContext("2d").getImageData(0, 0, depthCanvas.width, depthCanvas.height).data;
				const count = depthCanvas.width * depthCanvas.height;
				const arr = new Uint8Array(count);
				for (let i = 0, j = 0; i < count; i++, j += 4) arr[i] = srcPixels[j];
				const depthTex = new DataTexture(arr, depthCanvas.width, depthCanvas.height, RedFormat);
				depthTex.needsUpdate = true;
				depthTex.minFilter = LinearFilter;
				depthTex.magFilter = LinearFilter;
				const invCanvas = document.createElement("canvas");
				invCanvas.width = depthCanvas.width;
				invCanvas.height = depthCanvas.height;
				const invCtx = invCanvas.getContext("2d");
				invCtx.fillStyle = "#1a1035";
				invCtx.fillRect(0, 0, invCanvas.width, invCanvas.height);
				invCtx.drawImage(depthCanvas, 0, 0);
				const colorTex = new CanvasTexture(invCanvas);
				const segs = props.segments;
				const aspect = depthCanvas.width / depthCanvas.height;
				const geoH = 3;
				const geoW = geoH * aspect;
				const geo = new PlaneGeometry(geoW, geoH, segs, segs);
				const mat = new MeshStandardMaterial({
					map: colorTex,
					displacementMap: depthTex,
					displacementScale: props.displacementScale,
					roughness: .5,
					metalness: .1,
					side: 2
				});
				asciiMesh = new Mesh(geo, mat);
				asciiMesh.castShadow = true;
				asciiMesh.receiveShadow = true;
				characterGroup = new Group();
				characterGroup.add(asciiMesh);
				const shadowGeo = new PlaneGeometry(geoW + 1, .5);
				const shadowMat = new MeshBasicMaterial({
					color: 0,
					transparent: true,
					opacity: .2,
					depthWrite: false
				});
				const shadow = new Mesh(shadowGeo, shadowMat);
				shadow.rotation.x = -Math.PI / 2;
				shadow.position.y = -3 / 2 - .3;
				characterGroup.add(shadow);
				scene.add(characterGroup);
			} else {
				_mode.value = "default";
				characterGroup = buildDefaultRobot();
				scene.add(characterGroup);
			}
			if (props.particles) {
				particles = createParticles();
				scene.add(particles);
			}
			if (props.interactive) {
				controls = new OrbitControls(camera, renderer.domElement);
				controls.enableZoom = false;
				controls.enablePan = false;
				controls.mouseButtons = {
					LEFT: MOUSE.ROTATE,
					MIDDLE: null,
					RIGHT: null
				};
				controls.enableDamping = true;
				controls.dampingFactor = .06;
				controls.minPolarAngle = Math.PI * .25;
				controls.maxPolarAngle = Math.PI * .75;
				controls.minAzimuthAngle = -Math.PI * .4;
				controls.maxAzimuthAngle = Math.PI * .4;
				controls.update();
			}
			clock = new Clock();
			loading.value = false;
			_imageLoaded.value = true;
			emit("ready");
		}
		function buildDefaultRobot() {
			const group = new Group();
			const { robotColor, stoneColor, eyeColor } = props;
			const stoneGeo = new ShapeGeometry(buildStoneShape());
			const stoneMat = new MeshStandardMaterial({
				color: new Color(stoneColor),
				roughness: .7,
				metalness: .1,
				flatShading: true
			});
			const stone = new Mesh(stoneGeo, stoneMat);
			stone.position.y = -1.4;
			stone.castShadow = true;
			stone.receiveShadow = true;
			group.add(stone);
			const shadowGeo = new PlaneGeometry(4, 1.2);
			const shadowMat = new MeshBasicMaterial({
				color: 0,
				transparent: true,
				opacity: .25,
				depthWrite: false
			});
			const shadow = new Mesh(shadowGeo, shadowMat);
			shadow.rotation.x = -Math.PI / 2;
			shadow.position.y = -1.85;
			group.add(shadow);
			const bodyGeo = new BoxGeometry(.9, 1, .7, 2, 2, 2);
			const bodyMat = new MeshStandardMaterial({
				color: new Color(robotColor),
				roughness: .4,
				metalness: .05
			});
			const body = new Mesh(bodyGeo, bodyMat);
			body.position.y = -.3;
			body.castShadow = true;
			group.add(body);
			const neckGeo = new CylinderGeometry(.15, .18, .2, 8);
			const neck = new Mesh(neckGeo, bodyMat);
			neck.position.y = .25;
			group.add(neck);
			const headGeo = new BoxGeometry(1.3, 1.1, .9, 4, 4, 4);
			const headMat = new MeshStandardMaterial({
				color: new Color(robotColor),
				roughness: .3,
				metalness: .05
			});
			const head = new Mesh(headGeo, headMat);
			head.position.y = .95;
			head.castShadow = true;
			group.add(head);
			const antStemGeo = new CylinderGeometry(.03, .03, .3, 6);
			const antStemMat = new MeshStandardMaterial({ color: 8947865 });
			const antStem = new Mesh(antStemGeo, antStemMat);
			antStem.position.set(0, 1.65, 0);
			group.add(antStem);
			const antBallGeo = new SphereGeometry(.08, 8, 8);
			const antBallMat = new MeshStandardMaterial({
				color: 9855985,
				emissive: 9855985,
				emissiveIntensity: .5
			});
			const antBall = new Mesh(antBallGeo, antBallMat);
			antBall.position.set(0, 1.85, 0);
			group.add(antBall);
			const eyeGeo = new SphereGeometry(.14, 8, 8);
			eyeGeo.scale(1, 1.3, .6);
			const eyeMat = new MeshStandardMaterial({
				color: new Color(eyeColor),
				roughness: .2
			});
			const le = new Mesh(eyeGeo, eyeMat);
			le.position.set(-.3, 1.05, .42);
			group.add(le);
			const re = new Mesh(eyeGeo, eyeMat);
			re.position.set(.3, 1.05, .42);
			group.add(re);
			const hlGeo = new SphereGeometry(.04, 6, 6);
			const hlMat = new MeshBasicMaterial({ color: 16777215 });
			const hlL = new Mesh(hlGeo, hlMat);
			hlL.position.set(-.26, 1.12, .5);
			group.add(hlL);
			const hlR = new Mesh(hlGeo, hlMat);
			hlR.position.set(.34, 1.12, .5);
			group.add(hlR);
			const earGeo = new ConeGeometry(.12, .2, 3);
			const earMat = new MeshStandardMaterial({ color: new Color(robotColor) });
			const le2 = new Mesh(earGeo, earMat);
			le2.position.set(-.72, 1, 0);
			le2.rotation.z = .3;
			group.add(le2);
			const re2 = new Mesh(earGeo, earMat);
			re2.position.set(.72, 1, 0);
			re2.rotation.z = -.3;
			group.add(re2);
			const armGeo = new CylinderGeometry(.08, .08, .5, 6);
			const la = new Mesh(armGeo, earMat);
			la.position.set(-.58, -.1, 0);
			la.rotation.z = .15;
			group.add(la);
			const ra = new Mesh(armGeo, earMat);
			ra.position.set(.58, -.1, 0);
			ra.rotation.z = -.15;
			group.add(ra);
			const handGeo = new SphereGeometry(.1, 8, 8);
			const lh = new Mesh(handGeo, earMat);
			lh.position.set(-.62, -.38, 0);
			group.add(lh);
			const rh = new Mesh(handGeo, earMat);
			rh.position.set(.62, -.38, 0);
			group.add(rh);
			const legGeo = new CylinderGeometry(.07, .07, .25, 6);
			const ll = new Mesh(legGeo, earMat);
			ll.position.set(-.2, -.9, 0);
			group.add(ll);
			const rl = new Mesh(legGeo, earMat);
			rl.position.set(.2, -.9, 0);
			group.add(rl);
			const footGeo = new BoxGeometry(.16, .06, .22);
			const lf = new Mesh(footGeo, earMat);
			lf.position.set(-.2, -1.05, .05);
			group.add(lf);
			const rf = new Mesh(footGeo, earMat);
			rf.position.set(.2, -1.05, .05);
			group.add(rf);
			group.position.y = .1;
			return group;
		}
		function buildStoneShape() {
			const shape = new Shape();
			const W = 3.2, H = .8, R = .5;
			shape.moveTo(-1.1, -.8 / 2);
			shape.lineTo(W / 2 - R, -.8 / 2);
			shape.quadraticCurveTo(W / 2, -.8 / 2, W / 2, .09999999999999998);
			shape.lineTo(W / 2, H / 2 - R);
			shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
			const bumps = 7;
			const bumpWidth = W / bumps;
			for (let i = 0; i < bumps; i++) {
				const x = -3.2 / 2 + i * bumpWidth;
				const bumpH = (i % 2 === 0 ? .25 : .15) * H;
				shape.lineTo(x + bumpWidth / 2, H / 2 + bumpH);
				shape.lineTo(x + bumpWidth, H / 2);
			}
			shape.lineTo(-1.1, H / 2);
			shape.quadraticCurveTo(-3.2 / 2, H / 2, -3.2 / 2, H / 2 - R);
			shape.lineTo(-3.2 / 2, .09999999999999998);
			shape.quadraticCurveTo(-3.2 / 2, -.8 / 2, -1.1, -.8 / 2);
			return shape;
		}
		function createParticles() {
			const count = 80;
			const positions = /* @__PURE__ */ new Float32Array(240);
			for (let i = 0; i < count; i++) {
				positions[i * 3] = (Math.random() - .5) * 12;
				positions[i * 3 + 1] = (Math.random() - .5) * 8;
				positions[i * 3 + 2] = (Math.random() - .5) * 6 - 2;
			}
			const geo = new BufferGeometry();
			geo.setAttribute("position", new BufferAttribute(positions, 3));
			const canvas = document.createElement("canvas");
			canvas.width = 32;
			canvas.height = 32;
			const ctx = canvas.getContext("2d");
			const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
			grad.addColorStop(0, "rgba(255,255,255,1)");
			grad.addColorStop(.3, "rgba(200,180,255,0.6)");
			grad.addColorStop(1, "rgba(255,255,255,0)");
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, 32, 32);
			const tex = new CanvasTexture(canvas);
			const mat = new PointsMaterial({
				map: tex,
				size: .12,
				transparent: true,
				opacity: .6,
				depthWrite: false,
				blending: 2,
				sizeAttenuation: true
			});
			return new Points(geo, mat);
		}
		function animate() {
			animationId = requestAnimationFrame(animate);
			const elapsed = clock.getElapsedTime();
			if (characterGroup) {
				const floatY = props.floatAmplitude * .01 * Math.sin(elapsed * props.floatSpeed);
				characterGroup.position.y = floatY;
				characterGroup.rotation.z = Math.sin(elapsed * props.floatSpeed * .5) * .02;
				characterGroup.rotation.x = Math.sin(elapsed * props.floatSpeed * .7) * .01;
			}
			if (particles) {
				particles.rotation.y = elapsed * .02;
				const pos = particles.geometry.attributes.position;
				for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + Math.sin(elapsed + i) * .001);
				pos.needsUpdate = true;
			}
			if (props.autoRotate && characterGroup) characterGroup.rotation.y += props.autoRotateSpeed * .01;
			if (controls) controls.update();
			if (renderer && scene && camera) renderer.render(scene, camera);
		}
		function startAnimation() {
			if (animationId) return;
			animate();
		}
		function stopAnimation() {
			if (animationId) {
				cancelAnimationFrame(animationId);
				animationId = null;
			}
		}
		function destroyScene() {
			stopAnimation();
			if (controls) {
				controls.dispose();
				controls = null;
			}
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
			characterGroup = null;
			asciiMesh = null;
			particles = null;
			clock = null;
		}
		const containerStyle = computed(() => ({
			width: `${props.width}px`,
			height: `${props.height}px`,
			position: "relative",
			overflow: "hidden",
			cursor: props.interactive ? "grab" : "default"
		}));
		const hasInput = computed(() => Boolean(props.ascii || props.src));
		async function handleFileChange(e) {
			const file = e.target.files?.[0];
			if (!file || !file.type.startsWith("image/")) return;
			try {
				const ascii = imageToAscii(await loadImage(await loadFileAsDataURL(file)), props.charWidth);
				errorMsg.value = "";
				loading.value = true;
				await initScene(ascii);
				startAnimation();
			} catch (err) {
				errorMsg.value = err instanceof Error ? err.message : "加载失败";
				loading.value = false;
			}
		}
		watch(() => [
			props.ascii,
			props.src,
			props.displacementScale,
			props.segments
		], async ([newAscii, newSrc]) => {
			if (!containerRef.value) return;
			errorMsg.value = "";
			loading.value = true;
			if (newAscii) try {
				await initScene(newAscii);
				startAnimation();
			} catch (e) {
				errorMsg.value = e instanceof Error ? e.message : "初始化失败";
				loading.value = false;
			}
			else if (newSrc) try {
				await initScene(imageToAscii(await loadImage(newSrc), props.charWidth));
				startAnimation();
			} catch (e) {
				errorMsg.value = e instanceof Error ? e.message : "加载失败";
				loading.value = false;
			}
			else {
				await initScene();
				startAnimation();
			}
		}, { immediate: true });
		watch(() => props.width, () => {
			if (!containerRef.value || !renderer) return;
			const cw = containerRef.value.clientWidth;
			const ch = containerRef.value.clientHeight;
			if (cw > 0 && ch > 0 && camera) {
				camera.aspect = cw / ch;
				camera.updateProjectionMatrix();
				renderer.setSize(cw, ch);
			}
		});
		onMounted(() => {
			if (!hasInput.value) initScene().then(startAnimation).catch((e) => {
				errorMsg.value = e instanceof Error ? e.message : "初始化失败";
				loading.value = false;
			});
		});
		onBeforeUnmount(() => {
			destroyScene();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: "re-cline-character",
				style: normalizeStyle(containerStyle.value)
			}, [!_imageLoaded.value && !hasInput.value ? (openBlock(), createElementBlock("div", _hoisted_1, [
				_cache[1] || (_cache[1] = createBaseVNode("svg", {
					class: "re-cline-character__placeholder-icon",
					width: "48",
					height: "48",
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "1.5"
				}, [
					createBaseVNode("rect", {
						x: "3",
						y: "3",
						width: "18",
						height: "18",
						rx: "2"
					}),
					createBaseVNode("circle", {
						cx: "9",
						cy: "9",
						r: "2"
					}),
					createBaseVNode("path", { d: "M21 15l-5-5L5 21" })
				], -1)),
				createBaseVNode("p", _hoisted_2, toDisplayString(__props.placeholder), 1),
				__props.allowUpload ? (openBlock(), createElementBlock("input", {
					key: 0,
					ref_key: "fileInputRef",
					ref: fileInputRef,
					type: "file",
					accept: "image/*",
					class: "re-cline-character__file-input",
					onChange: handleFileChange
				}, null, 544)) : createCommentVNode("", true),
				__props.allowUpload ? (openBlock(), createElementBlock("button", {
					key: 1,
					class: "re-cline-character__upload-btn",
					onClick: _cache[0] || (_cache[0] = ($event) => fileInputRef.value?.click())
				}, "选择图片")) : createCommentVNode("", true)
			])) : loading.value ? (openBlock(), createElementBlock("div", _hoisted_3, [_cache[2] || (_cache[2] = createBaseVNode("div", { class: "re-cline-character__spinner" }, null, -1)), createBaseVNode("span", null, toDisplayString(_mode.value === "ascii" ? "转换字符画中..." : "加载中..."), 1)])) : (openBlock(), createElementBlock("div", {
				key: 2,
				ref_key: "containerRef",
				ref: containerRef,
				class: "re-cline-character__canvas"
			}, null, 512)), errorMsg.value ? (openBlock(), createElementBlock("div", _hoisted_4, [createBaseVNode("span", null, toDisplayString(errorMsg.value), 1)])) : createCommentVNode("", true)], 4);
		};
	}
}), [["__scopeId", "data-v-45be7700"]]);
//#endregion
//#region ../../packages/ui/src/components/ReClineCharacter/index.ts
var plugin = { install(app) {
	app.component("ReClineCharacter", ReClineCharacter_default$1);
} };
var ReClineCharacter_default = ReClineCharacter_default$1;
//#endregion
export { ReClineCharacter_default as default, plugin as install };
