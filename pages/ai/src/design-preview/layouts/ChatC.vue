<template>
  <div class="pv-chat pv-chat--triptych">
    <!-- 左：会话（更窄、更密） -->
    <aside class="tc-rail">
      <div class="tc-rail__head">
        <span class="tc-rail__title">会话</span>
        <button class="tc-rail__new" type="button">＋</button>
      </div>
      <input class="tc-rail__search" placeholder="搜索" />
      <div class="tc-rail__list">
        <button
          v-for="s in spec.sessions"
          :key="s.id"
          type="button"
          class="tc-sess"
          :class="{ 'is-on': s.active }"
        >
          <span class="tc-sess__title">{{ s.title }}</span>
          <span class="tc-sess__meta">{{ s.meta }}</span>
        </button>
      </div>
    </aside>

    <!-- 中：对话（紧凑） -->
    <main class="tc-chat">
      <header class="tc-top">
        <span class="tc-top__title">{{ activeSession?.title }}</span>
        <span class="tc-top__right">
          <span class="tc-tag">GLM-5</span>
          <span class="tc-tag">128k</span>
        </span>
      </header>

      <div class="tc-scroll">
        <div v-for="m in spec.messages" :key="m.id" class="tc-msg" :data-role="m.role">
          <span class="tc-msg__avatar">{{ m.role === 'user' ? '陈' : 'AI' }}</span>
          <div class="tc-msg__body">
            <div class="tc-msg__head">
              <span class="tc-msg__who">{{ m.role === 'user' ? '陈默' : '助手' }}</span>
              <span class="tc-msg__time">{{ m.time }}</span>
            </div>
            <p class="tc-msg__text">{{ m.text }}</p>

            <ul v-if="m.tools?.length" class="tc-calls">
              <li v-for="t in m.tools" :key="t" class="tc-call">
                <span class="tc-call__dot" />
                <span class="tc-call__name">{{ t }}</span>
                <span class="tc-call__state">完成</span>
              </li>
            </ul>

            <pre v-if="m.code" class="tc-code"><code>{{ m.code.body }}</code></pre>
          </div>
        </div>
      </div>

      <div class="tc-composer">
        <button class="tc-plus" type="button">＋</button>
        <div class="tc-input">
          <span class="tc-input__ph">输入消息，Enter 发送</span>
        </div>
        <button class="tc-send" type="button">↑</button>
      </div>
    </main>

    <!-- 右：上下文面板 -->
    <aside class="tc-context">
      <div class="tc-ctx__tabs">
        <button class="tc-ctx__tab is-on" type="button">任务</button>
        <button class="tc-ctx__tab" type="button">文件</button>
        <button class="tc-ctx__tab" type="button">用量</button>
      </div>

      <section class="tc-block">
        <h3 class="tc-block__title">待办 <span class="tc-block__count">3/5</span></h3>
        <ul class="tc-todos">
          <li class="tc-todo is-done"><span class="tc-todo__box">✓</span>渠道 SPI 注册</li>
          <li class="tc-todo is-done"><span class="tc-todo__box">✓</span>端到端验证到授权页</li>
          <li class="tc-todo is-doing"><span class="tc-todo__box" />等待框三版式对比</li>
          <li class="tc-todo"><span class="tc-todo__box" />品牌卡补 WorkBuddy</li>
          <li class="tc-todo"><span class="tc-todo__box" />提交并推送</li>
        </ul>
      </section>

      <section class="tc-block">
        <h3 class="tc-block__title">改动文件 <span class="tc-block__count">12</span></h3>
        <ul class="tc-files">
          <li class="tc-file">
            <span class="tc-file__path">WorkBuddyAccountChannelAuthManager.java</span>
            <span class="tc-file__stat is-add">+804</span>
          </li>
          <li class="tc-file">
            <span class="tc-file__path">ChannelManagementPage.vue</span>
            <span class="tc-file__stat">+1</span>
          </li>
          <li class="tc-file">
            <span class="tc-file__path">ApiProviderController.java</span>
            <span class="tc-file__stat">+16</span>
          </li>
        </ul>
      </section>

      <section class="tc-block">
        <h3 class="tc-block__title">本次用量</h3>
        <div class="tc-usage">
          <div class="tc-usage__row"><span>上下文</span><span>18.4k / 128k</span></div>
          <div class="tc-bar"><i style="width: 14%" /></div>
          <div class="tc-usage__row"><span>工具调用</span><span>9 次</span></div>
          <div class="tc-usage__row"><span>耗时</span><span>42 秒</span></div>
        </div>
      </section>
    </aside>
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
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr) 292px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-page);
  color: var(--text-primary);
  font-size: 12.5px;
}

/* ---------- 左侧会话 ---------- */
.tc-rail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-container);
  border-right: 1px solid var(--border-default);
}

.tc-rail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
}

.tc-rail__title { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }

.tc-rail__new {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

.tc-rail__search {
  margin: 0 12px 8px;
  height: 26px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
  font-size: 11.5px;
  color: var(--text-secondary);
  outline: none;
}

.tc-rail__list { flex: 1; min-height: 0; overflow: auto; padding: 0 6px 8px; }

.tc-sess {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.tc-sess:hover { background: var(--bg-hover); }
.tc-sess.is-on { background: var(--brand-50); }

.tc-sess__title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tc-sess.is-on .tc-sess__title { color: var(--brand-700); font-weight: 600; }

.tc-sess__meta { font-size: 10px; color: var(--text-tertiary); }

/* ---------- 中间对话 ---------- */
.tc-chat { display: flex; flex-direction: column; min-height: 0; min-width: 0; }

.tc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 42px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-container);
}

.tc-top__title { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tc-top__right { display: flex; gap: 4px; flex: none; }

.tc-tag {
  height: 20px;
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  background: var(--bg-fill);
  font-size: 10.5px;
  color: var(--text-tertiary);
}

.tc-scroll { flex: 1; min-height: 0; overflow: auto; padding: 12px 18px 6px; }

.tc-msg { display: flex; gap: 9px; padding: 9px 0; }

.tc-msg__avatar {
  width: 22px;
  height: 22px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 9.5px;
  font-weight: 600;
  background: var(--bg-fill);
  color: var(--text-secondary);
}

.tc-msg[data-role='assistant'] .tc-msg__avatar { background: var(--brand-600); color: #fff; }

.tc-msg__body { min-width: 0; flex: 1; }

.tc-msg__head { display: flex; align-items: baseline; gap: 8px; }

.tc-msg__who { font-size: 11.5px; font-weight: 600; }
.tc-msg__time { font-size: 10px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }

.tc-msg__text { margin: 2px 0 0; font-size: 12.5px; line-height: 1.68; color: var(--text-primary); }

.tc-calls { list-style: none; margin: 7px 0 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }

.tc-call {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 7px;
  border-radius: 4px;
  background: var(--bg-elevated);
  font-size: 11px;
  color: var(--text-secondary);
}

.tc-call__dot { width: 4px; height: 4px; border-radius: 50%; background: var(--status-success); }
.tc-call__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tc-call__state { font-size: 10px; color: var(--text-tertiary); }

.tc-code {
  margin: 7px 0 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: #0f172a;
  color: #dbeafe;
  font-family: var(--font-mono, ui-monospace, Menlo, monospace);
  font-size: 10.5px;
  line-height: 1.6;
  overflow-x: auto;
}

.tc-composer {
  flex: none;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px 14px;
}

.tc-plus {
  width: 30px;
  height: 30px;
  flex: none;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.tc-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
}

.tc-input__ph { font-size: 12px; color: var(--text-tertiary); }

.tc-send {
  width: 30px;
  height: 30px;
  flex: none;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--brand-600);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

/* ---------- 右侧上下文 ---------- */
.tc-context {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  background: var(--bg-container);
  border-left: 1px solid var(--border-default);
}

.tc-ctx__tabs {
  display: flex;
  gap: 2px;
  padding: 8px 10px 0;
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  background: var(--bg-container);
  z-index: 1;
}

.tc-ctx__tab {
  padding: 6px 10px 8px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 11.5px;
  cursor: pointer;
}

.tc-ctx__tab.is-on { color: var(--text-primary); border-bottom-color: var(--brand-600); font-weight: 600; }

.tc-block { padding: 13px 13px 0; }
.tc-block + .tc-block { border-top: 1px solid var(--border-subtle); margin-top: 12px; }

.tc-block__title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.tc-block__count { font-size: 10px; color: var(--text-tertiary); font-weight: 400; }

.tc-todos, .tc-files { list-style: none; margin: 0 0 4px; padding: 0; display: flex; flex-direction: column; gap: 5px; }

.tc-todo { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--text-secondary); }

.tc-todo__box {
  width: 13px;
  height: 13px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  font-size: 8px;
  color: transparent;
}

.tc-todo.is-done { color: var(--text-tertiary); text-decoration: line-through; }
.tc-todo.is-done .tc-todo__box { background: var(--status-success); border-color: var(--status-success); color: #fff; }
.tc-todo.is-doing .tc-todo__box { border-color: var(--brand-600); background: var(--brand-50); }

.tc-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 7px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
}

.tc-file__path {
  flex: 1;
  min-width: 0;
  font-size: 10.5px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
}

.tc-file__stat { font-size: 10px; color: var(--status-success); font-variant-numeric: tabular-nums; }

.tc-usage { display: flex; flex-direction: column; gap: 6px; padding-bottom: 14px; }

.tc-usage__row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.tc-bar { height: 4px; border-radius: 2px; background: var(--bg-fill); overflow: hidden; }
.tc-bar i { display: block; height: 100%; background: var(--brand-500); }

@media (max-width: 1180px) {
  .pv-chat { grid-template-columns: 210px minmax(0, 1fr); }
  .tc-context { display: none; }
}
</style>