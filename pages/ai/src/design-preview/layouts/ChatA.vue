<template>
  <div class="pv-chat pv-chat--focus">
    <!-- 极窄图标条：只放最常用的四个入口 -->
    <nav class="fc-rail" aria-label="主导航">
      <span class="fc-rail__logo">AI</span>
      <button class="fc-rail__btn is-on" type="button" title="会话">◍</button>
      <button class="fc-rail__btn" type="button" title="知识库">▤</button>
      <button class="fc-rail__btn" type="button" title="文件">⌸</button>
      <button class="fc-rail__btn" type="button" title="设置">⚙</button>
    </nav>

    <div class="fc-main">
      <!-- 顶部：只留会话名与模型，不抢注意力 -->
      <header class="fc-top">
        <div class="fc-top__left">
          <span class="fc-top__title">{{ activeSession?.title }}</span>
          <span class="fc-top__model">GLM-5 · 128k</span>
        </div>
        <div class="fc-top__right">
          <button class="fc-icon" type="button" title="会话列表">☰</button>
          <button class="fc-icon" type="button" title="更多">⋯</button>
        </div>
      </header>

      <div class="fc-scroll">
        <article
          v-for="m in spec.messages"
          :key="m.id"
          class="fc-msg"
          :data-role="m.role"
        >
          <span class="fc-msg__who">{{ m.role === 'user' ? '你' : '助手' }}</span>
          <div class="fc-msg__body">
            <p class="fc-msg__text">{{ m.text }}</p>

            <div v-if="m.tools?.length" class="fc-tools">
              <div v-for="t in m.tools" :key="t" class="fc-tool">
                <span class="fc-tool__state">✓</span>
                <span class="fc-tool__name">{{ t }}</span>
              </div>
            </div>

            <pre v-if="m.code" class="fc-code"><code>{{ m.code.body }}</code></pre>

            <span class="fc-msg__time">{{ m.time }}</span>
          </div>
        </article>

        <div class="fc-typing">
          <span class="fc-typing__dot" /><span class="fc-typing__dot" /><span class="fc-typing__dot" />
          <span class="fc-typing__text">正在整理三个版式的差异…</span>
        </div>
      </div>

      <!-- 输入框：整页唯一「有形状」的东西，视线自然落在这里 -->
      <div class="fc-composer">
        <div class="fc-composer__box">
          <p class="fc-composer__ph">继续对话，或按 / 选择命令</p>
          <div class="fc-composer__bar">
            <div class="fc-composer__left">
              <button class="fc-pill" type="button">＋ 附件</button>
              <button class="fc-pill" type="button">模型</button>
              <button class="fc-pill" type="button">思考</button>
            </div>
            <button class="fc-send" type="button" title="发送">↑</button>
          </div>
        </div>
        <p class="fc-hint">Enter 发送 · Shift+Enter 换行 · 本次会话已用 18.4k tokens</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PageSpec } from '../specs'

const props = defineProps<{ spec: PageSpec }>()
const activeSession = computed(() => props.spec.sessions?.find((s) => s.active) || props.spec.sessions?.[0])
</script>

<style scoped>
.pv-chat {
  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--bg-page);
  color: var(--text-primary);
}

/* ---------- 图标条 ---------- */
.fc-rail {
  width: 54px;
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-container);
}

.fc-rail__logo {
  width: 28px;
  height: 28px;
  margin-bottom: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--brand-600);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.fc-rail__btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 15px;
  cursor: pointer;
}

.fc-rail__btn:hover { background: var(--bg-hover); color: var(--text-secondary); }
.fc-rail__btn.is-on { background: var(--brand-50); color: var(--brand-700); }

/* ---------- 主列 ---------- */
.fc-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.fc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 46px;
  padding: 0 22px;
  flex: none;
}

.fc-top__left { display: flex; align-items: center; gap: 10px; min-width: 0; }

.fc-top__title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fc-top__model {
  flex: none;
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg-fill);
}

.fc-top__right { display: flex; gap: 4px; }

.fc-icon {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 13px;
}

.fc-icon:hover { background: var(--bg-hover); }

/* ---------- 对话区 ---------- */
.fc-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 22px 24px;
}

.fc-msg {
  display: flex;
  gap: 14px;
  max-width: 720px;
  margin: 0 auto;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.fc-msg:last-of-type { border-bottom: 0; }

.fc-msg__who {
  width: 42px;
  flex: none;
  padding-top: 2px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
}

.fc-msg[data-role='assistant'] .fc-msg__who { color: var(--brand-600); }

.fc-msg__body { flex: 1; min-width: 0; }

.fc-msg__text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--text-primary);
}

.fc-msg[data-role='user'] .fc-msg__text { color: var(--text-secondary); }

.fc-msg__time {
  display: block;
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.fc-tools {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fc-tool {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--text-secondary);
}

.fc-tool__state { color: var(--status-success); font-size: 11px; }

.fc-code {
  margin: 10px 0 0;
  padding: 11px 13px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  overflow-x: auto;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.fc-typing {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 720px;
  margin: 4px auto 0;
  padding: 10px 0 0 56px;
}

.fc-typing__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brand-400);
}

.fc-typing__text { margin-left: 6px; font-size: 11.5px; color: var(--text-tertiary); }

/* ---------- 输入框 ---------- */
.fc-composer {
  flex: none;
  padding: 0 22px 18px;
  background: linear-gradient(180deg, transparent, var(--bg-page) 38%);
}

.fc-composer__box {
  max-width: 720px;
  margin: 0 auto;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  background: var(--bg-container);
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.07);
  padding: 12px 12px 8px;
}

.fc-composer__ph {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.fc-composer__bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }

.fc-composer__left { display: flex; gap: 6px; }

.fc-pill {
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  font-size: 11.5px;
  cursor: pointer;
}

.fc-pill:hover { background: var(--bg-hover); }

.fc-send {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 9px;
  background: var(--brand-600);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.fc-hint {
  max-width: 720px;
  margin: 8px auto 0;
  font-size: 10.5px;
  color: var(--text-tertiary);
  text-align: center;
}

@media (max-width: 760px) {
  .fc-rail { display: none; }
  .fc-msg__who { width: 32px; }
  .fc-composer { padding: 0 12px 12px; }
  .fc-scroll { padding: 4px 14px 16px; }
}
</style>