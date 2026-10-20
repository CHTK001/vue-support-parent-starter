import { E as createTextVNode, Ht as watch, Lt as useSlots, On as unref, b as createElementBlock, bt as renderList, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElText } from "./text-Dt3_J0ai.js";
import "./src-CEonioA3.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/core/src/obfuscation/fontObfuscator.ts
/** 从某区间抽取随机不重复偏移 */
function buildOffsets(size, base) {
	const pool = Array.from({ length: size }, (_, i) => i);
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[pool[i], pool[j]] = [pool[j], pool[i]];
	}
	return pool.map((o) => base + o);
}
/** 解析颜色：支持 rgb()/rgba()/#hex */
function parseColor(color) {
	if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
		const hex = color.slice(1);
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 1;
		if (hex.length === 3) {
			r = parseInt(hex[0] + hex[0], 16);
			g = parseInt(hex[1] + hex[1], 16);
			b = parseInt(hex[2] + hex[2], 16);
		} else if (hex.length === 6) {
			r = parseInt(hex.slice(0, 2), 16);
			g = parseInt(hex.slice(2, 4), 16);
			b = parseInt(hex.slice(4, 6), 16);
		} else if (hex.length === 8) {
			r = parseInt(hex.slice(0, 2), 16);
			g = parseInt(hex.slice(2, 4), 16);
			b = parseInt(hex.slice(4, 6), 16);
			a = parseInt(hex.slice(6, 8), 16) / 255;
		}
		return {
			r,
			g,
			b,
			a
		};
	}
	const m = color.match(/rgba?\(([^)]+)\)/);
	if (m) {
		const parts = m[1].split(",").map((s) => s.trim());
		const r = Number(parts[0]);
		const g = Number(parts[1]);
		const b = Number(parts[2]);
		const a = parts[3] !== void 0 ? Number(parts[3]) : 1;
		if ([
			r,
			g,
			b
		].every((n) => Number.isFinite(n))) return {
			r,
			g,
			b,
			a
		};
	}
	return null;
}
/**
* 生成混淆字符列表
* @param text 需要混淆的原文
* @param options 配置
*/
function buildObfuscatedChars(text, options = {}) {
	const { baseCodepoint = 57344, fontSize = 14, fontFamily = "-apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif", color = "#303133" } = options;
	const dpr = window.devicePixelRatio || 1;
	const chars = Array.from(text);
	const offsets = buildOffsets(chars.length, baseCodepoint);
	const glyphMap = /* @__PURE__ */ new Map();
	chars.forEach((ch, i) => {
		if (!glyphMap.has(ch)) glyphMap.set(ch, {
			pua: String.fromCodePoint(offsets[i]),
			offset: i
		});
	});
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	ctx.font = `${fontSize}px ${fontFamily}`;
	const parsed = parseColor(color);
	return chars.map((ch) => {
		if (/[\r\n\t\0\u200b\u200c]/.test(ch) || ch.length === 0) return {
			pua: ch,
			image: "",
			width: 0,
			height: fontSize,
			ascent: fontSize * .8
		};
		const metrics = ctx.measureText(ch);
		const w = Math.ceil(metrics.width);
		const h = Math.ceil(fontSize * 1.4);
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		if (parsed) ctx.fillStyle = `rgba(${parsed.r},${parsed.g},${parsed.b},${parsed.a})`;
		ctx.font = `${fontSize}px ${fontFamily}`;
		ctx.textBaseline = "alphabetic";
		const ascent = Math.ceil(metrics.actualBoundingBoxAscent || fontSize * .8);
		ctx.fillText(ch, 0, ascent);
		return {
			pua: glyphMap.get(ch).pua,
			image: canvas.toDataURL("image/png"),
			width: w,
			height: h,
			ascent
		};
	});
}
//#endregion
//#region ../../node_modules/.pnpm/secure-render-text@0.1.1/node_modules/secure-render-text/dist/index.js
var PatternEngine = class {
	constructor(ctx) {
		this.ctx = ctx;
	}
	getPattern(type) {
		const size = 4;
		const offscreen = document.createElement("canvas");
		offscreen.width = size;
		offscreen.height = size;
		const offCtx = offscreen.getContext("2d");
		offCtx.clearRect(0, 0, size, size);
		offCtx.strokeStyle = "#000000";
		offCtx.lineWidth = 1;
		if (type === "stripe") for (let x = 0; x < size; x += 2) {
			offCtx.beginPath();
			offCtx.moveTo(x + .5, 0);
			offCtx.lineTo(x + .5, size);
			offCtx.stroke();
		}
		else if (type === "diagonal") {
			offCtx.beginPath();
			offCtx.moveTo(0, 0);
			offCtx.lineTo(size, size);
			offCtx.stroke();
			offCtx.beginPath();
			offCtx.moveTo(2, 0);
			offCtx.lineTo(size, 2);
			offCtx.stroke();
			offCtx.beginPath();
			offCtx.moveTo(0, 2);
			offCtx.lineTo(2, size);
			offCtx.stroke();
		} else if (type === "crosshatch") {
			for (let x = 0; x < size; x += 2) {
				offCtx.beginPath();
				offCtx.moveTo(x + .5, 0);
				offCtx.lineTo(x + .5, size);
				offCtx.stroke();
			}
			offCtx.beginPath();
			offCtx.moveTo(0, 0);
			offCtx.lineTo(size, size);
			offCtx.stroke();
			offCtx.beginPath();
			offCtx.moveTo(2, 0);
			offCtx.lineTo(size, 2);
			offCtx.stroke();
			offCtx.beginPath();
			offCtx.moveTo(0, 2);
			offCtx.lineTo(2, size);
			offCtx.stroke();
		} else throw new Error(`PatternEngine: unknown pattern type "${type}"`);
		const pattern = this.ctx.createPattern(offscreen, "repeat");
		if (!pattern) throw new Error(`PatternEngine: failed to create pattern for type "${type}"`);
		return pattern;
	}
};
var GlyphEngine = class {
	constructor(fontSize, pattern) {
		this.fontSize = fontSize;
		this.pattern = pattern;
	}
	renderGlyphs(text) {
		const measureCanvas = document.createElement("canvas");
		measureCanvas.width = this.fontSize * 2;
		measureCanvas.height = this.fontSize * 2;
		const measureCtx = measureCanvas.getContext("2d");
		const font = `${this.fontSize}px monospace`;
		measureCtx.font = font;
		const canvasPattern = new PatternEngine(measureCtx).getPattern(this.pattern);
		const glyphs = [];
		for (const char of text) {
			const metrics = measureCtx.measureText(char);
			const width = Math.max(Math.ceil(metrics.width), 1);
			const height = this.fontSize;
			const offscreen = document.createElement("canvas");
			offscreen.width = width;
			offscreen.height = height;
			const ctx = offscreen.getContext("2d");
			ctx.font = font;
			ctx.save();
			ctx.beginPath();
			const baseline = Math.round(this.fontSize * .8);
			ctx.fillStyle = canvasPattern;
			ctx.fillText(char, 0, baseline);
			ctx.restore();
			const imageData = ctx.getImageData(0, 0, width, height);
			glyphs.push({
				char,
				width,
				height,
				imageData
			});
		}
		return glyphs;
	}
};
var TemporalEngine = class {
	constructor(fps, layerCount = 2) {
		this.rafId = null;
		this.lastFrameTime = 0;
		this.currentLayer = 0;
		this.fps = fps;
		this.layerCount = layerCount;
	}
	/**
	* Split an array of GlyphBitmaps into N layers using round-robin pixel assignment.
	* Returns a 2D array: layers[layerIndex] = composited ImageData for that layer.
	*/
	splitIntoLayers(glyphs) {
		return glyphs.map((glyph) => {
			const { width, height, imageData } = glyph;
			const src = imageData.data;
			const layers = Array.from({ length: this.layerCount }, () => {
				return new ImageData(width, height);
			});
			const pixelCount = width * height;
			for (let i = 0; i < pixelCount; i++) {
				const layer = i % this.layerCount;
				const offset = i * 4;
				layers[layer].data[offset] = src[offset];
				layers[layer].data[offset + 1] = src[offset + 1];
				layers[layer].data[offset + 2] = src[offset + 2];
				layers[layer].data[offset + 3] = src[offset + 3];
			}
			return layers;
		});
	}
	/**
	* Compose all per-glyph layer ImageDatas for the current layer into a single
	* wide ImageData that spans the full text width.
	*/
	compositeLayer(glyphLayers, glyphs, layerIndex) {
		const totalWidth = glyphs.reduce((sum, g) => sum + g.width, 0);
		const height = glyphs[0]?.height ?? 0;
		const composite = new ImageData(Math.max(totalWidth, 1), Math.max(height, 1));
		let xOffset = 0;
		for (let gi = 0; gi < glyphs.length; gi++) {
			const glyph = glyphs[gi];
			const layerData = glyphLayers[gi][layerIndex];
			for (let row = 0; row < glyph.height; row++) for (let col = 0; col < glyph.width; col++) {
				const srcIdx = (row * glyph.width + col) * 4;
				const dstIdx = (row * totalWidth + xOffset + col) * 4;
				composite.data[dstIdx] = layerData.data[srcIdx];
				composite.data[dstIdx + 1] = layerData.data[srcIdx + 1];
				composite.data[dstIdx + 2] = layerData.data[srcIdx + 2];
				composite.data[dstIdx + 3] = layerData.data[srcIdx + 3];
			}
			xOffset += glyph.width;
		}
		return composite;
	}
	start(glyphs, glyphLayers, onFrame) {
		this.currentLayer = 0;
		this.lastFrameTime = 0;
		const tick = (timestamp) => {
			this.rafId = requestAnimationFrame(tick);
			const elapsed = timestamp - this.lastFrameTime;
			const interval = 1e3 / this.fps;
			if (elapsed >= interval) {
				this.lastFrameTime = timestamp - elapsed % interval;
				const compositeImageData = this.compositeLayer(glyphLayers, glyphs, this.currentLayer);
				onFrame({
					layerIndex: this.currentLayer,
					totalLayers: this.layerCount,
					compositeImageData
				});
				this.currentLayer = (this.currentLayer + 1) % this.layerCount;
			}
		};
		this.rafId = requestAnimationFrame(tick);
	}
	stop() {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}
};
var NOISE_FRAG_SRC = `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_time;
varying vec2 v_texCoord;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  float noise = (rand(v_texCoord + u_time) - 0.5) * 0.08;
  gl_FragColor = clamp(color + vec4(noise, noise, noise, 0.0), 0.0, 1.0);
}
`;
var DISTORTION_FRAG_SRC = `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_time;
varying vec2 v_texCoord;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float dx = sin(v_texCoord.y * 40.0 + u_time * 6.28) * 0.003
           + (rand(vec2(v_texCoord.y, u_time)) - 0.5) * 0.004;
  float dy = sin(v_texCoord.x * 40.0 + u_time * 6.28) * 0.003
           + (rand(vec2(v_texCoord.x, u_time)) - 0.5) * 0.004;
  vec2 displaced = v_texCoord + vec2(dx, dy);
  gl_FragColor = texture2D(u_texture, displaced);
}
`;
var VERT_SRC = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  // Map clip-space [-1,1] to texture coords [0,1]
  v_texCoord = (a_position + 1.0) * 0.5;
  // Flip Y so texture is right-side up
  v_texCoord.y = 1.0 - v_texCoord.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
function compileShader(gl, type, src) {
	const shader = gl.createShader(type);
	if (!shader) throw new Error("SecureRender: failed to create shader");
	gl.shaderSource(shader, src);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`SecureRender: shader compile error: ${log}`);
	}
	return shader;
}
function linkProgram(gl, vert, frag) {
	const prog = gl.createProgram();
	if (!prog) throw new Error("SecureRender: failed to create program");
	gl.attachShader(prog, vert);
	gl.attachShader(prog, frag);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(prog);
		gl.deleteProgram(prog);
		throw new Error(`SecureRender: program link error: ${log}`);
	}
	return prog;
}
var ShaderPipeline = class {
	constructor(canvas, distortion) {
		this.distortionPass = null;
		this.fbo = null;
		this.fboTexture = null;
		this.fboWidth = 0;
		this.fboHeight = 0;
		const gl = canvas.getContext("webgl");
		if (!gl) throw new Error("SecureRender: WebGL is not supported in this browser");
		this.gl = gl;
		this.distortion = distortion;
		const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
		const noiseProg = linkProgram(gl, vert, compileShader(gl, gl.FRAGMENT_SHADER, NOISE_FRAG_SRC));
		this.noisePass = this.buildPass(gl, noiseProg);
		if (distortion) {
			const distProg = linkProgram(gl, vert, compileShader(gl, gl.FRAGMENT_SHADER, DISTORTION_FRAG_SRC));
			this.distortionPass = this.buildPass(gl, distProg);
		}
		const quadVerts = new Float32Array([
			-1,
			-1,
			1,
			-1,
			-1,
			1,
			-1,
			1,
			1,
			-1,
			1,
			1
		]);
		const buf = gl.createBuffer();
		if (!buf) throw new Error("SecureRender: failed to create quad buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
		this.quadBuffer = buf;
		const tex = gl.createTexture();
		if (!tex) throw new Error("SecureRender: failed to create texture");
		this.texture = tex;
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}
	buildPass(gl, program) {
		const uTexture = gl.getUniformLocation(program, "u_texture");
		const uTime = gl.getUniformLocation(program, "u_time");
		const aPosition = gl.getAttribLocation(program, "a_position");
		if (!uTexture || !uTime) throw new Error("SecureRender: missing shader uniforms");
		return {
			program,
			uTexture,
			uTime,
			aPosition
		};
	}
	ensureFBO(width, height) {
		const gl = this.gl;
		if (this.fbo && this.fboWidth === width && this.fboHeight === height) return;
		if (this.fbo) gl.deleteFramebuffer(this.fbo);
		if (this.fboTexture) gl.deleteTexture(this.fboTexture);
		const tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		const fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.fbo = fbo;
		this.fboTexture = tex;
		this.fboWidth = width;
		this.fboHeight = height;
	}
	drawPass(pass, srcTexture, timestamp) {
		const gl = this.gl;
		gl.useProgram(pass.program);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
		gl.enableVertexAttribArray(pass.aPosition);
		gl.vertexAttribPointer(pass.aPosition, 2, gl.FLOAT, false, 0, 0);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, srcTexture);
		gl.uniform1i(pass.uTexture, 0);
		gl.uniform1f(pass.uTime, timestamp / 1e3);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	uploadFrame(imageData) {
		const gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
	}
	render(timestamp) {
		const gl = this.gl;
		const w = gl.canvas.width;
		const h = gl.canvas.height;
		gl.viewport(0, 0, w, h);
		if (this.distortion && this.distortionPass) {
			this.ensureFBO(w, h);
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
			this.drawPass(this.noisePass, this.texture, timestamp);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			this.drawPass(this.distortionPass, this.fboTexture, timestamp);
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			this.drawPass(this.noisePass, this.texture, timestamp);
		}
	}
	dispose() {
		const gl = this.gl;
		gl.deleteBuffer(this.quadBuffer);
		gl.deleteTexture(this.texture);
		if (this.fbo) gl.deleteFramebuffer(this.fbo);
		if (this.fboTexture) gl.deleteTexture(this.fboTexture);
		gl.deleteProgram(this.noisePass.program);
		if (this.distortionPass) gl.deleteProgram(this.distortionPass.program);
	}
};
var Renderer = class {
	constructor(options) {
		this.temporal = null;
		this.shader = null;
		this.running = false;
		this.options = options;
	}
	start() {
		const { canvas, text, fps, pattern, distortion } = this.options;
		const fontSize = 48;
		canvas.height = fontSize;
		const glyphs = new GlyphEngine(fontSize, pattern).renderGlyphs(text);
		const totalWidth = glyphs.reduce((sum, g) => sum + g.width, 0);
		canvas.width = Math.max(totalWidth, 1);
		canvas.height = fontSize;
		const temporal = new TemporalEngine(fps, 2);
		const glyphLayers = temporal.splitIntoLayers(glyphs);
		const shader = new ShaderPipeline(canvas, distortion);
		this.temporal = temporal;
		this.shader = shader;
		this.running = true;
		temporal.start(glyphs, glyphLayers, (frame) => {
			shader.uploadFrame(frame.compositeImageData);
			shader.render(performance.now());
		});
	}
	stop() {
		if (!this.running) return;
		this.temporal?.stop();
		this.shader?.dispose();
		this.temporal = null;
		this.shader = null;
		this.running = false;
	}
	isRunning() {
		return this.running;
	}
};
var VALID_PATTERNS = [
	"stripe",
	"diagonal",
	"crosshatch"
];
var activeRenderer = null;
function resolveCanvas(element) {
	if (element instanceof HTMLCanvasElement) return element;
	if (typeof element === "string") try {
		const el = document.querySelector(element);
		if (el instanceof HTMLCanvasElement) return el;
	} catch {}
	throw new Error("SecureRender: element must resolve to an HTMLCanvasElement");
}
var index_default = {
	render(options) {
		if (activeRenderer) {
			activeRenderer.stop();
			activeRenderer = null;
		}
		const canvas = resolveCanvas(options.element);
		if (typeof options.text !== "string" || options.text.length > 500) throw new Error("SecureRender: text exceeds 500 character limit");
		const fps = options.fps ?? 90;
		if (!Number.isFinite(fps) || fps < 1 || fps > 120) throw new Error("SecureRender: fps must be between 1 and 120");
		const pattern = options.pattern ?? "stripe";
		if (!VALID_PATTERNS.includes(pattern)) throw new Error("SecureRender: pattern must be one of stripe | diagonal | crosshatch");
		const distortion = options.distortion ?? true;
		const renderer = new Renderer({
			canvas,
			text: options.text,
			fps,
			pattern,
			distortion
		});
		renderer.start();
		activeRenderer = renderer;
	},
	stop() {
		if (activeRenderer) {
			activeRenderer.stop();
			activeRenderer = null;
		}
	}
};
//#endregion
//#region ../../packages/core/src/obfuscation/ocrNoise.ts
/**
* OCR 噪点渲染（secure-render-text 封装）（@repo/core）
*
* 基于三方库 secure-render-text 在 canvas 上渲染"人眼可读、摄像头/OCR 难识别"的文本：
*  - 时间分片（fps 高频重绘，摄像头采样捕获不完整字形）
*  - 图案干扰（stripe / diagonal / crosshatch）
*  - 可选扭曲（distortion）制造动态视觉不稳定
*
* 封装目标：
*  - 简化 API：组件内一行调用
*  - 生命周期管理：组件卸载时自动 stop
*  - 类型友好
*/
/**
* 在 canvas 上渲染防 OCR 文本
*
* @param canvas 目标 canvas 元素（组件 ref 传入）
* @param text 需要保护的文本
* @param options OCR 噪点配置
* @returns 停止渲染的函数（组件卸载时调用）
*/
function renderSecureText(canvas, text, options = {}) {
	if (!canvas || !text) return () => void 0;
	index_default.render({
		element: canvas,
		text,
		fps: options.fps ?? 60,
		pattern: options.pattern ?? "stripe",
		distortion: options.distortion ?? false
	});
	return () => index_default.stop();
}
//#endregion
//#region ../../packages/ui/src/components/ReText/ReText.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["aria-label"];
//#endregion
//#region ../../packages/ui/src/components/ReText/ReText.vue
var ReText_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReText",
	props: {
		type: { default: void 0 },
		size: { default: void 0 },
		truncated: {
			type: Boolean,
			default: false
		},
		lineClamp: { default: void 0 },
		tag: { default: void 0 },
		text: { default: "" },
		ocr: {
			type: Boolean,
			default: void 0
		},
		obfuscate: {
			type: [Boolean, Object],
			default: void 0
		},
		security: { default: () => ({}) }
	},
	setup(__props) {
		/**
		* ReText —— 文本组件
		*
		* 继承 el-text 全部 props（type/size/truncated/lineClamp/tag），
		* 新增 ocr / obfuscate 两项防抓取能力。
		*
		* 用法：
		*   <ReText type="primary" :ocr="true">保密文本</ReText>
		*   <ReText :obfuscate="{ fontSize: 16 }">动态字体混淆</ReText>
		*/
		const globalOcrEnabled = () => getConfig()?.security?.ocrObfuscation?.enable === true;
		/** 全局开关：obfuscate 未显式传入时回退 security.dynamicFont.enable */
		const globalObfuscateEnabled = () => getConfig()?.security?.dynamicFont?.enable === true;
		/** 组件 props */
		const props = __props;
		const slots = useSlots();
		/** 实际是否启用 OCR：显式传参优先，否则跟随全局开关 */
		const ocrActive = computed(() => props.ocr ?? globalOcrEnabled());
		/** 实际是否启用混淆：显式传参优先，否则跟随全局开关 */
		const obfuscateActive = computed(() => props.obfuscate !== void 0 ? props.obfuscate !== false : globalObfuscateEnabled());
		/** 实际要展示的文本（props.text 或默认插槽文本） */
		const rawText = computed(() => {
			if (props.text !== "") return props.text;
			const slot = slots.default?.();
			if (!slot) return "";
			return slot.map((node) => {
				if (typeof node.children === "string") return node.children;
				if (Array.isArray(node.children)) return node.children.map((c) => typeof c === "string" ? c : c?.children ?? "").join("");
				return "";
			}).join("");
		});
		const canvasRef = ref(null);
		let stopOcr;
		function startOcr() {
			stopOcr?.();
			if (!ocrActive.value || !rawText.value) return;
			const opt = props.security?.ocr ?? {};
			stopOcr = renderSecureText(canvasRef.value, rawText.value, opt);
		}
		const obfChars = ref([]);
		/** 混淆字符的展示样式（位图背景 + 隐藏乱码文本） */
		function charStyle(c) {
			if (!c.image) return {};
			return {
				display: "inline-block",
				width: `${c.width}px`,
				height: `${c.height}px`,
				backgroundImage: `url(${c.image})`,
				backgroundRepeat: "no-repeat",
				backgroundSize: `${c.width}px ${c.height}px`,
				fontSize: "0",
				lineHeight: "0",
				verticalAlign: `-${(c.height - c.ascent).toFixed(2)}px`,
				userSelect: "text"
			};
		}
		function startObfuscate() {
			if (!obfuscateActive.value || !rawText.value) {
				obfChars.value = [];
				return;
			}
			const opt = typeof props.obfuscate === "object" ? props.obfuscate : props.security?.obfuscate;
			obfChars.value = buildObfuscatedChars(rawText.value, opt ?? {});
		}
		watch([
			rawText,
			ocrActive,
			obfuscateActive,
			() => props.security
		], () => {
			startOcr();
			startObfuscate();
		}, { immediate: true });
		watch(canvasRef, () => {
			startOcr();
		});
		onBeforeUnmount(() => {
			stopOcr?.();
			obfChars.value = [];
		});
		return (_ctx, _cache) => {
			return ocrActive.value && rawText.value ? (openBlock(), createElementBlock("canvas", {
				key: 0,
				ref_key: "canvasRef",
				ref: canvasRef,
				class: "re-text__canvas",
				"aria-label": __props.text
			}, null, 8, _hoisted_1)) : obfuscateActive.value && obfChars.value.length ? (openBlock(), createBlock(unref(ElText), {
				key: 1,
				type: __props.type,
				size: __props.size,
				truncated: __props.truncated,
				"line-clamp": __props.lineClamp,
				tag: __props.tag,
				class: "re-text"
			}, {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(obfChars.value, (c, i) => {
					return openBlock(), createElementBlock("span", {
						key: i,
						class: "re-text__char",
						style: normalizeStyle(charStyle(c))
					}, toDisplayString(c.pua), 5);
				}), 128))]),
				_: 1
			}, 8, [
				"type",
				"size",
				"truncated",
				"line-clamp",
				"tag"
			])) : (openBlock(), createBlock(unref(ElText), {
				key: 2,
				type: __props.type,
				size: __props.size,
				truncated: __props.truncated,
				"line-clamp": __props.lineClamp,
				tag: __props.tag,
				class: "re-text"
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, () => [createTextVNode(toDisplayString(__props.text), 1)], true)]),
				_: 3
			}, 8, [
				"type",
				"size",
				"truncated",
				"line-clamp",
				"tag"
			]));
		};
	}
}), [["__scopeId", "data-v-3a359a41"]]);
//#endregion
//#region ../../packages/ui/src/components/ReText/index.ts
var plugin = { install(app) {
	app.component("ReText", ReText_default$1);
} };
var ReText_default = ReText_default$1;
//#endregion
export { ReText_default as default, plugin as install, buildObfuscatedChars as n, renderSecureText as t };
