<template>
  <div class="pv-chat pv-chat--dual">
    <!-- 左：会话列表常驻 -->
    <aside class="dc-side">
      <div class="dc-side__head">
        <h1 class="dc-side__title">会话</h1>
        <button class="dc-new" type="button" title="新建会话">＋</button>
      </div>

      <div class="dc-search">
        <span class="dc-search__icon">⌕</span>
        <span class="dc-search__ph">搜索会话或消息</span>
      </div>

      <div class="dc-groups">
        <section v-for="g in groups" :key="g.name" class="dc-group">
          <h2 class="dc-group__name">{{ g.name }}</h2>
          <button
            v-for="s in g.items"
            :key="s.id"
            type="button"
            class="dc-session"
            :class="{ 'is-on': s.active }"
          >
            <span class="dc-session__body">
              <span class="dc-session__title">{{ s.title }}</span>
              <span class="dc-session__meta">{{ s.meta }}</span>
            </span>
            <span v-if="s.unread" class="dc-session__unread" />
          </button>
        </section>
      </div>

      <div class="dc-side__foot">
        <span class="dc-side__user">陈</span>
        <span class="dc-side__name">陈默</span>
        <button class="dc-side__more" type="button">⋯</button>
      </div>
    </aside>

    <!-- 右：对话 -->
    <main class="dc-main">
      <header class="dc-top">
        <div class="dc-top__left">
          <h2 class="dc-top__title">{{ activeSession?.title }}</h2>
          <span class="dc-top__meta">{{ activeSession?.meta }}</span>
        </div>
        <div class="dc-top__right">
          <span class="dc-model">GLM-5</span>
          <button class="dc-top__btn" type="button">上下文</button>
          <button class="dc-top__icon" type="button" title="更多">⋯</button>
        </div>
      </header>

      <div class="dc-scroll">
        <div
          v-for="m in spec.messages"
          :key="m.id"
          class="dc-row"
          :data-role="m.role"
        >
          <span v-if="m.role === 'assistant'" class="dc-avatar">AI</span>
          <div class="dc-bubble">
            <p class="dc-bubble__text">{{ m.text }}</p>

            <div v-if="m.tools?.length" class="dc-tools">
              <div v-for="t in m.tools" :key="t" class="dc-tool">
                <span class="dc-tool__icon">✓</span>
                <span class="dc-tool__name">{{ t }}</span>
                <span class="dc-tool__time">已完成</span>
              </div>
            </div>

            <pre v-if="m.code" class="dc-code"><code>{{ m.code.body }}</code></pre>
          </div>
          <span class="dc-time">{{ m.time }}</span>
        </div>

        <div class="dc-typing">
          <span class="dc-avatar">AI</span>
          <span class="dc-typing__bubble"><i /><i /><i /></span>
        </div>
      </div>

      <div class="dc-composer">
        <div class="dc-composer__box">
          <p class="dc-composer__ph">给助手发消息…</p>
          <div class="dc-composer__bar">
            <div class="dc-composer__left">
              <button class="dc-chip" type="button">＋</button>
              <button class="dc-chip" type="button">知识库</button>
              <button class="dc-chip" type="button">GLM-5</button>
            </div>
            <div class="dc-composer__right">
              <button class="dc-chip" type="button">思考</button>
              <button class="dc-send" type="button">发送</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PageSpec } from '../specs'

const props = defineProps<{ spec: PageSpec }>()

const activeSession = computed(() => props.spec.sessions?.find((s) => s.active) || props.spec.sessions?.[0])

const groups = computed(() => {
  const map = new Map<string, NonNullable<PageSpec['sessions']>>()
  for (const s of props.spec.sessions || []) {
    const list = map.get(s.group) || []
    list.push(s)
    map.set(s.group, list)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})
</script>

<style scoped>
.pv-chat {
  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--bg-page);
  color: var(--text-primary);
  font-size: 13px;
}

/* ---------- 左栏 ---------- */
.dc-side {
  width: 288px;
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-container);
  border-right: 1px solid var(--border-default);
}

.dc-side__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px 10px;
}

.dc-side__title { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }

.dc-new {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.dc-new:hover { background: var(--brand-50); border-color: var(--brand-200); color: var(--brand-700); }

.dc-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 16px 10px;
  height: 30px;
  padding: 0 9px;
  border-radius: var(--radius-md);
  background: var(--bg-fill);
  color: var(--text-tertiary);
  font-size: 12px;
}

.dc-groups { flex: 1; min-height: 0; overflow: auto; padding: 0 8px 10px; }

.dc-group { padding-top: 8px; }

.dc-group__name {
  margin: 0 0 4px;
  padding: 0 8px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.dc-session {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 9px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.dc-session:hover { background: var(--bg-hover); }
.dc-session.is-on { background: var(--brand-50); }

.dc-session__body { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 1px; }

.dc-session__title {
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-session.is-on .dc-session__title { color: var(--brand-700); font-weight: 600; }

.dc-session__meta { font-size: 10.5px; color: var(--text-tertiary); }

.dc-session__unread {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-600);
  flex: none;
}

.dc-side__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--border-subtle);
}

.dc-side__user {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--brand-50);
  color: var(--brand-700);
  font-size: 11px;
  font-weight: 600;
}

.dc-side__name { font-size: 12px; color: var(--text-secondary); }

.dc-side__more {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
}

/* ---------- 右栏 ---------- */
.dc-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.dc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--bg-container);
  border-bottom: 1px solid var(--border-subtle);
}

.dc-top__left { min-width: 0; }

.dc-top__title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-top__meta { font-size: 10.5px; color: var(--text-tertiary); }

.dc-top__right { display: flex; align-items: center; gap: 6px; flex: none; }

.dc-model {
  height: 24px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--bg-fill);
  font-size: 11px;
  color: var(--text-secondary);
}

.dc-top__btn {
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 11.5px;
  cursor: pointer;
}

.dc-top__icon {
  width: 26px;
  height: 26px;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
}

/* ---------- 消息 ---------- */
.dc-scroll { flex: 1; min-height: 0; overflow: auto; padding: 18px 20px 8px; }

.dc-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 880px;
  margin: 0 auto 14px;
}

.dc-row[data-role='user'] { justify-content: flex-end; }

.dc-avatar {
  width: 26px;
  height: 26px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--brand-600);
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
}

.dc-bubble {
  max-width: 76%;
  padding: 10px 13px;
  border-radius: 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
}

.dc-row[data-role='user'] .dc-bubble {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.dc-row[data-role='assistant'] .dc-bubble { border-bottom-left-radius: 4px; }

.dc-bubble__text { margin: 0; font-size: 13px; line-height: 1.7; }

.dc-time {
  flex: none;
  font-size: 10px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  padding-bottom: 2px;
}

.dc-tools { display: flex; flex-direction: column; gap: 5px; margin-top: 9px; }

.dc-tool {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 9px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  font-size: 11.5px;
  color: var(--text-secondary);
}

.dc-tool__icon { color: var(--status-success); font-size: 10px; }
.dc-tool__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dc-tool__time { font-size: 10px; color: var(--text-tertiary); }

.dc-code {
  margin: 9px 0 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: #0f172a;
  color: #dbeafe;
  font-family: var(--font-mono, ui-monospace, Menlo, monospace);
  font-size: 11px;
  line-height: 1.65;
  overflow-x: auto;
}

.dc-typing { display: flex; align-items: flex-end; gap: 8px; max-width: 880px; margin: 0 auto; }

.dc-typing__bubble {
  display: inline-flex;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
}

.dc-typing__bubble i { width: 4px; height: 4px; border-radius: 50%; background: var(--text-tertiary); }

/* ---------- 输入 ---------- */
.dc-composer { flex: none; padding: 8px 20px 16px; }

.dc-composer__box {
  max-width: 880px;
  margin: 0 auto;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  background: var(--bg-container);
  padding: 10px 11px 7px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.dc-composer__ph { margin: 0 0 8px; font-size: 12.5px; color: var(--text-tertiary); }

.dc-composer__bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }

.dc-composer__left, .dc-composer__right { display: flex; align-items: center; gap: 6px; }

.dc-chip {
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
}

.dc-send {
  height: 26px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--brand-600);
  color: #fff;
  font-size: 11.5px;
  font-weight: 550;
  cursor: pointer;
}

@media (max-width: 860px) {
  .dc-side { width: 220px; }
  .dc-bubble { max-width: 86%; }
}
</style>