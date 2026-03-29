<template>
  <div class="example-container flourish-example">
    <h2 class="example-title">ScFlourishEmbed 数据可视化嵌入</h2>
    <p class="example-desc">
      集成 Flourish 数据可视化平台，支持 Public Embed（公开嵌入）和 Live API（程序化创建）两种模式，无需额外 npm 依赖，脚本通过 CDN 单例加载。
    </p>

    <!-- 模式切换 -->
    <div class="mode-switcher">
      <button
        v-for="m in modes"
        :key="m.key"
        class="mode-btn"
        :class="{ active: activeMode === m.key }"
        @click="activeMode = m.key"
      >
        <span class="mode-icon">{{ m.icon }}</span>
        <span>{{ m.label }}</span>
      </button>
    </div>

    <!-- ── Public Embed 模式 ── -->
    <section v-if="activeMode === 'embed'" class="demo-section">
      <div class="section-header">
        <div class="section-badge badge-embed">Public Embed</div>
        <h3 class="section-title">嵌入已发布的 Flourish 可视化</h3>
        <p class="section-desc">传入 <code>visualisation-id</code>，通过 Flourish 官方 embed.js 渲染公开可视化，无需 API Key。</p>
      </div>

      <!-- ID 输入控制 -->
      <div class="control-row">
        <label class="ctrl-label">Visualisation ID</label>
        <div class="ctrl-input-group">
          <input
            v-model="embedId"
            class="ctrl-input"
            placeholder="如 1234567 或 visualisation/1234567"
          />
          <button class="ctrl-btn primary" @click="applyEmbedId">应用</button>
        </div>
        <div class="ctrl-presets">
          <span class="preset-label">快速示例：</span>
          <button
            v-for="p in presets"
            :key="p.id"
            class="preset-btn"
            :class="{ active: activePreset === p.id }"
            @click="applyPreset(p)"
          >{{ p.label }}</button>
        </div>
      </div>

      <!-- 尺寸控制 -->
      <div class="control-row">
        <label class="ctrl-label">高度</label>
        <div class="ctrl-input-group">
          <input v-model="embedHeight" class="ctrl-input" placeholder="如 500px 或留空自适应" />
        </div>
      </div>

      <!-- 组件渲染区 -->
      <div class="render-area">
        <div class="render-label">
          <span class="dot dot-green" />
          实时预览
          <span class="render-status" :class="embedStatus">{{ embedStatusText }}</span>
        </div>
        <ScFlourishEmbed
          :key="embedKey"
          :visualisation-id="activeEmbedId"
          :height="embedHeight || undefined"
          aria-label="Flourish 数据可视化示例"
          @loaded="onEmbedLoaded"
          @error="onEmbedError"
        />
      </div>

      <!-- 代码示例 -->
      <div class="code-block">
        <div class="code-header">
          <span>使用示例</span>
          <button class="copy-btn" @click="copyCode(embedCode)">复制</button>
        </div>
        <pre class="code-content">{{ embedCode }}</pre>
      </div>
    </section>

    <!-- ── Live API 模式 ── -->
    <section v-if="activeMode === 'live'" class="demo-section">
      <div class="section-header">
        <div class="section-badge badge-live">Live API</div>
        <h3 class="section-title">程序化创建 Flourish 可视化</h3>
        <p class="section-desc">传入 <code>api-key</code> + <code>template</code> + <code>data</code>，通过 Flourish Live API 动态渲染，支持实时数据更新。需要企业级 API Key。</p>
      </div>

      <div class="live-notice">
        <span class="notice-icon">ℹ</span>
        <span>Live API 为 Flourish 企业版功能，需要有效的 API Key。下方为接口演示，填入真实 Key 后可正常渲染。</span>
      </div>

      <!-- API Key 输入 -->
      <div class="control-row">
        <label class="ctrl-label">API Key</label>
        <input v-model="liveApiKey" class="ctrl-input" type="password" placeholder="输入 Flourish API Key" />
      </div>
      <div class="control-row">
        <label class="ctrl-label">Template</label>
        <input v-model="liveTemplate" class="ctrl-input" placeholder="如 @flourish/scatter" />
      </div>
      <div class="control-row">
        <label class="ctrl-label">Version</label>
        <input v-model="liveVersion" class="ctrl-input" placeholder="如 4" />
      </div>

      <!-- 组件渲染区 -->
      <div class="render-area">
        <div class="render-label">
          <span class="dot dot-purple" />
          Live API 预览
        </div>
        <ScFlourishEmbed
          v-if="liveApiKey"
          :key="liveKey"
          :api-key="liveApiKey"
          :template="liveTemplate"
          :version="liveVersion"
          :data="liveData"
          :bindings="liveBindings"
          :state="liveState"
          height="480px"
          @loaded="onLiveLoaded"
          @error="onLiveError"
        />
        <div v-else class="live-placeholder">
          <div class="placeholder-icon">🔑</div>
          <p>请输入 API Key 后查看 Live API 渲染效果</p>
        </div>
      </div>

      <!-- 代码示例 -->
      <div class="code-block">
        <div class="code-header">
          <span>使用示例</span>
          <button class="copy-btn" @click="copyCode(liveCode)">复制</button>
        </div>
        <pre class="code-content">{{ liveCode }}</pre>
      </div>
    </section>

    <!-- Props 说明 -->
    <section class="props-section">
      <h3 class="props-title">Props 说明</h3>
      <div class="props-table-wrapper">
        <table class="props-table">
          <thead>
            <tr>
              <th>属性</th>
              <th>类型</th>
              <th>默认值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in propsData" :key="p.name">
              <td><code>{{ p.name }}</code></td>
              <td class="type-cell">{{ p.type }}</td>
              <td class="default-cell">{{ p.default }}</td>
              <td>{{ p.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Events 说明 -->
    <section class="props-section">
      <h3 class="props-title">Events</h3>
      <div class="props-table-wrapper">
        <table class="props-table">
          <thead>
            <tr><th>事件</th><th>参数</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td><code>loaded</code></td><td>—</td><td>脚本加载 + 渲染完成时触发</td></tr>
            <tr><td><code>error</code></td><td><code>err: Error</code></td><td>脚本加载失败或渲染异常时触发</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ScFlourishEmbed } from "@repo/components/ScFlourishEmbed";

// ── 模式切换 ──────────────────────────────────────────────────────
const activeMode = ref<"embed" | "live">("embed");
const modes = [
  { key: "embed", label: "Public Embed", icon: "📊" },
  { key: "live",  label: "Live API",     icon: "⚡" },
];

// ── Public Embed ──────────────────────────────────────────────────
const embedId     = ref("1234567");
const activeEmbedId = ref("1234567");
const embedHeight = ref("500px");
const embedKey    = ref(0);
const embedStatus = ref<"idle" | "ok" | "err">("idle");

const embedStatusText = computed(() => ({
  idle: "等待渲染",
  ok:   "渲染成功 ✓",
  err:  "渲染失败 ✗",
}[embedStatus.value]));

const presets = [
  { id: "1234567", label: "散点图示例" },
  { id: "2345678", label: "柱状图示例" },
  { id: "3456789", label: "地图示例" },
];
const activePreset = ref("1234567");

function applyPreset(p: { id: string; label: string }) {
  embedId.value = p.id;
  activePreset.value = p.id;
  applyEmbedId();
}

function applyEmbedId() {
  activeEmbedId.value = embedId.value;
  embedStatus.value = "idle";
  embedKey.value++;
}

function onEmbedLoaded() { embedStatus.value = "ok"; }
function onEmbedError()  { embedStatus.value = "err"; }

const embedCode = computed(() => `<ScFlourishEmbed
  visualisation-id="${activeEmbedId.value}"
  height="${embedHeight.value || 'auto'}"
  aria-label="数据可视化"
  @loaded="onLoaded"
  @error="onError"
/>`);

// ── Live API ──────────────────────────────────────────────────────
const liveApiKey  = ref("");
const liveTemplate = ref("@flourish/scatter");
const liveVersion  = ref("4");
const liveKey      = ref(0);

const liveData = {
  data: [
    { country: "Argentina", pos_x: 1, pos_y: 2 },
    { country: "Brazil",    pos_x: 2, pos_y: 4 },
    { country: "Colombia",  pos_x: 3, pos_y: 9 },
  ],
};
const liveBindings = {
  data: { x: "pos_x", y: "pos_y", metadata: ["country"] },
};
const liveState = {
  layout: { title: "Flourish Live API 示例" },
};

function onLiveLoaded() { /* success */ }
function onLiveError(err: Error) { console.error("[Flourish Live]", err); }

const liveCode = computed(() => `<ScFlourishEmbed
  api-key="YOUR_API_KEY"
  template="${liveTemplate.value}"
  version="${liveVersion.value}"
  :data="{ data: [...] }"
  :bindings="{ data: { x: 'pos_x', y: 'pos_y' } }"
  :state="{ layout: { title: '标题' } }"
  height="480px"
/>`);

// ── 复制代码 ──────────────────────────────────────────────────────
function copyCode(code: string) {
  navigator.clipboard?.writeText(code).catch(() => {});
}

// ── Props 说明 ────────────────────────────────────────────────────
const propsData = [
  { name: "visualisation-id", type: "string | number", default: "—",      desc: "Public Embed 模式：Flourish 可视化 ID，如 1234567 或 visualisation/1234567" },
  { name: "api-key",          type: "string",          default: "—",      desc: "Live API 模式：Flourish 企业版 API Key" },
  { name: "template",         type: "string",          default: "—",      desc: "Live API 模式：模板标识，如 @flourish/scatter" },
  { name: "version",          type: "string",          default: "—",      desc: "Live API 模式：模板版本号，如 4" },
  { name: "data",             type: "object",          default: "—",      desc: "Live API 模式：数据对象" },
  { name: "bindings",         type: "object",          default: "—",      desc: "Live API 模式：数据绑定配置" },
  { name: "state",            type: "object",          default: "—",      desc: "Live API 模式：样式/状态配置" },
  { name: "width",            type: "string | number", default: "'100%'", desc: "容器宽度" },
  { name: "height",           type: "string | number", default: "auto",   desc: "容器高度，不传则 Flourish 自适应" },
  { name: "aria-label",       type: "string",          default: "Flourish 数据可视化", desc: "无障碍标签" },
];
</script>

<style scoped>
.flourish-example {
  padding: 0 4px;
}

.example-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
  letter-spacing: -0.3px;
}

.example-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 28px;
  line-height: 1.6;
}

/* ── 模式切换 ── */
.mode-switcher {
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.mode-btn.active {
  border-color: #6366f1;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.mode-icon { font-size: 16px; }

/* ── Section ── */
.demo-section {
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-header { margin-bottom: 24px; }

.section-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.badge-embed { background: rgba(16, 185, 129, 0.1); color: #059669; }
.badge-live  { background: rgba(139, 92, 246, 0.1); color: #7c3aed; }

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px;
}

.section-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.section-desc code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: #6366f1;
}

/* ── 控制行 ── */
.control-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.ctrl-label {
  min-width: 110px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  padding-top: 8px;
}

.ctrl-input-group {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.ctrl-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.2s;
}

.ctrl-input:focus {
  border-color: #6366f1;
  background: #fff;
}

.ctrl-btn {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn.primary {
  background: #6366f1;
  color: #fff;
}

.ctrl-btn.primary:hover {
  background: #4f46e5;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.ctrl-presets {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
  padding-left: 122px;
}

.preset-label {
  font-size: 12px;
  color: #94a3b8;
}

.preset-btn {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover,
.preset-btn.active {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.06);
}

/* ── 渲染区 ── */
.render-area {
  margin: 20px 0;
  border: 1.5px dashed #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.render-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e8edf5;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.dot-green  { background: #10b981; }
.dot-purple { background: #8b5cf6; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.render-status {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
}

.render-status.ok  { color: #10b981; }
.render-status.err { color: #ef4444; }
.render-status.idle { color: #94a3b8; }

/* ── 代码块 ── */
.code-block {
  margin-top: 20px;
  border: 1px solid #e8edf5;
  border-radius: 10px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #1e293b;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
}

.copy-btn {
  padding: 3px 10px;
  border: 1px solid #334155;
  border-radius: 5px;
  background: transparent;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: #6366f1;
  color: #a5b4fc;
}

.code-content {
  margin: 0;
  padding: 16px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12.5px;
  line-height: 1.7;
  overflow-x: auto;
  white-space: pre;
}

/* ── Live 占位 ── */
.live-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  font-size: 13px;
  color: #3b82f6;
  margin-bottom: 20px;
  line-height: 1.5;
}

.notice-icon { font-size: 16px; flex-shrink: 0; }

.live-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  color: #94a3b8;
}

.placeholder-icon { font-size: 40px; }

.live-placeholder p {
  margin: 0;
  font-size: 14px;
}

/* ── Props 表格 ── */
.props-section {
  margin-bottom: 24px;
}

.props-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 14px;
}

.props-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e8edf5;
  border-radius: 12px;
}

.props-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.props-table th {
  padding: 10px 16px;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid #e8edf5;
}

.props-table td {
  padding: 10px 16px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.props-table tr:last-child td { border-bottom: none; }

.props-table code {
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: #6366f1;
}

.type-cell    { color: #7c3aed; font-family: monospace; font-size: 12px; }
.default-cell { color: #059669; font-family: monospace; font-size: 12px; }
</style>
