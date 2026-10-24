<template>
  <!-- 渠道绑定等待框 · 阶段内容（mock 演示用；Phase 3 落地时换真实句柄/SSE 数据） -->
  <div class="bw-stage">
    <!-- 设备码 / 授权码 -->
    <div v-if="scene.stage === 'device-code'" class="bw-code">
      <span class="bw-code-label">授权码</span>
      <div class="bw-code-row">
        <b class="bw-code-value">{{ scene.userCode || 'CL-8F2K-9QX' }}</b>
        <button class="bw-copy" type="button">复制</button>
      </div>
      <span class="bw-code-hint">在设备 / 授权页面输入此授权码完成登录</span>
    </div>

    <!-- 扫码（qr-code） -->
    <div v-else-if="scene.stage === 'qr-code'" class="bw-qr">
      <div class="bw-qr-box" v-html="mockQr()"></div>
      <span class="bw-qr-hint">使用微信「扫一扫」完成授权，成功后自动绑定</span>
    </div>

    <!-- 浏览器授权入口 -->
    <div v-else-if="scene.stage === 'browser-oauth'" class="bw-cta">
      <button class="bw-open" type="button">打开授权页</button>
      <a class="bw-href" href="javascript:void(0)">或点此链接</a>
    </div>

    <!-- API key -->
    <div v-else-if="scene.stage === 'api-key'" class="bw-form">
      <div class="bw-row">
        <input class="bw-input" placeholder="Zen API key（匿名通道填 public）" />
        <button class="bw-btn bw-btn--primary" type="button">提交</button>
      </div>
    </div>

    <!-- 回调粘贴兜底 -->
    <div v-else class="bw-form">
      <div class="bw-hint">检测到本地回调端口不可用，授权后请把浏览器地址栏的回调地址粘到下面：</div>
      <div class="bw-row">
        <input class="bw-input" placeholder="http://127.0.0.1:…/authorize?…" />
        <button class="bw-btn bw-btn--primary" type="button">提交</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 等待框阶段内容（布局无关；5 个变体复用它，只差异化外壳） */
export interface BindWaitingScene {
  channel: string
  displayName: string
  method: string
  phase: 'starting' | 'waiting' | 'error'
  elapsed: number
  stage: 'device-code' | 'qr-code' | 'browser-oauth' | 'api-key' | 'callback'
  userCode?: string
  error?: string
  callbackAuto?: boolean
}

defineProps<{ scene: BindWaitingScene }>()

/** mock 二维码：用内联 SVG 网格模拟（真实阶段 Phase 3 换成句柄里的 data URL） */
function mockQr(): string {
  const size = 168
  const cell = 14
  const marks = new Set<string>()
  // 伪随机但稳定：以 channel 名做种子
  let seed = 7
  for (let y = 0; y < size / cell; y++) {
    for (let x = 0; x < size / cell; x++) {
      seed = (seed * 31 + 17) % 997
      if (seed % 3 === 0) marks.add(`${x},${y}`)
    }
  }
  // 定位角
  const corner = (cx: number, cy: number) =>
    `<rect x="${cx}" y="${cy}" width="${3 * cell}" height="${3 * cell}" fill="none" stroke="currentColor" stroke-width="2"/>` +
    `<rect x="${cx + cell}" y="${cy + cell}" width="${cell}" height="${cell}" fill="currentColor"/>`
  let body = ''
  marks.forEach((m) => {
    const [x, y] = m.split(',').map(Number)
    body += `<rect x="${x * cell}" y="${y * cell}" width="${cell - 2}" height="${cell - 2}" fill="currentColor"/>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" color="#0f172a">${body}${corner(0, 0)}${corner(size - 3 * cell, 0)}${corner(0, size - 3 * cell)}</svg>`
}
</script>

<style scoped>
.bw-stage {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* 设备码 */
.bw-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 12px;
  background: var(--bg-elevated, #f8fafc);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
}
.bw-code-label { font-size: 12px; color: var(--text-secondary, #475569); }
.bw-code-row { display: flex; align-items: center; gap: 8px; }
.bw-code-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 22px;
  letter-spacing: 2px;
  user-select: all;
  color: var(--text-primary, #0f172a);
}
.bw-copy {
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-container, #fff);
  color: var(--text-regular, #475569);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
}
.bw-copy:hover { border-color: var(--brand-400, #60a5fa); color: var(--brand-600, #2563eb); }
.bw-code-hint { font-size: 12px; color: var(--text-tertiary, #94a3b8); }
/* 扫码 */
.bw-qr { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.bw-qr-box {
  width: 176px;
  height: 176px;
  display: grid;
  place-items: center;
  background: #fff;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 10px;
  color: var(--text-primary, #0f172a);
}
.bw-qr-box :deep(svg) { width: 168px; height: 168px; }
.bw-qr-hint { font-size: 12px; color: var(--text-tertiary, #94a3b8); }
/* 浏览器授权 */
.bw-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  font-size: 12px;
}
.bw-open {
  border: 1px solid var(--brand-600, #2563eb);
  background: var(--brand-600, #2563eb);
  color: #fff;
  border-radius: 8px;
  padding: 7px 18px;
  font-size: 13px;
  cursor: pointer;
}
.bw-open:hover { background: var(--brand-500, #3b82f6); }
.bw-href { color: var(--brand-600, #2563eb); }
/* 表单 */
.bw-form { display: flex; flex-direction: column; gap: 8px; }
.bw-row { display: flex; gap: 8px; }
.bw-hint { font-size: 12px; color: var(--el-color-warning, #e6a23c); }
.bw-input {
  padding: 5px 8px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  background: var(--el-fill-color-blank, #fff);
  width: 100%;
}
.bw-input:focus { outline: none; border-color: var(--el-color-primary, #409eff); }
.bw-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  cursor: pointer;
}
.bw-btn--primary {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
</style>
