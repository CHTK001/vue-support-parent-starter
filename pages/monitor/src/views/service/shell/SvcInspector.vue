<script setup lang="ts">
/**
 * 服务管理 —— 右侧检查器
 *
 * <p>原来是「快捷面板」：固定七颗按钮 + 活动 + 六格统计，与选中的节点无关——
 * 排障时最想看的「这个节点监听在哪、挂了什么插件、后端是谁」反而要点进详情才有。
 * 现在面板跟选中节点走：上半是节点事实与动作，下半是活动与统计。</p>
 *
 * <p>动作仍走 {@code ctx}，面板不直接调接口；没有选中节点时就只剩入口动作，
 * 不摆一堆禁用按钮。</p>
 */
import ReIcon from '@repo/ui/re-icon'
import SvcActivity from './SvcActivity.vue'
import type { SvcShellProps } from './context'

const props = withDefaults(defineProps<SvcShellProps & { showStats?: boolean }>(), { showStats: true })
</script>

<template>
  <aside class="sin">
    <div class="sin-head">
      <span class="sin-title">检查器</span>
      <button type="button" class="sin-fold" title="收起检查器" @click="props.ctx.toggleDock()">
        <ReIcon name="ArrowRight" :size="12" />
      </button>
    </div>

    <div class="sin-body">
      <!-- 节点事实：选中谁就看谁 -->
      <div v-if="props.ctx.activeCard" class="sin-card">
        <div class="sin-node">
          <i class="sv-dot" :class="props.ctx.stateClassOf(props.ctx.activeCard)" aria-hidden="true" />
          <b class="sv-ellipsis">{{ props.ctx.activeCard.name }}</b>
          <span class="sin-node__st" :class="{ 'is-err': props.ctx.activeCard.status === 'ERROR' }">
            {{ props.ctx.activeCard.statusText }}
          </span>
        </div>
        <dl class="sin-facts">
          <div>
            <dt>监听</dt>
            <dd class="sv-mono sv-ellipsis">{{ props.ctx.activeCard.listenText }}</dd>
          </div>
          <div>
            <dt>协议</dt>
            <dd class="sv-ellipsis">{{ props.ctx.activeCard.protocolText }} · {{ props.ctx.activeCard.engine || '—' }}</dd>
          </div>
          <div>
            <dt>插件</dt>
            <dd>
              {{ props.ctx.activeCard.activeFilterCount }} 生效 / {{ props.ctx.activeCard.filterCount }} 挂载
            </dd>
          </div>
          <div v-if="props.ctx.activeCard.backendText">
            <dt>后端</dt>
            <dd class="sv-mono sv-ellipsis" :title="props.ctx.activeCard.backendText">{{ props.ctx.activeCard.backendText }}</dd>
          </div>
          <div>
            <dt>启用</dt>
            <dd>{{ props.ctx.activeCard.enabledText }}</dd>
          </div>
        </dl>
        <p v-if="props.ctx.activeCard.reason" class="sin-reason" :title="props.ctx.activeCard.reason">
          {{ props.ctx.activeCard.reason }}
        </p>

        <div class="sin-actions">
          <button
            type="button"
            :disabled="props.ctx.vm.actingId === props.ctx.activeCard.id"
            @click="props.ctx.runPrimary(props.ctx.activeCard)"
          >
            <ReIcon :name="props.ctx.primaryIcon(props.ctx.activeCard)" :size="13" />
            <span>{{ props.ctx.primaryLabel(props.ctx.activeCard) }}</span>
          </button>
          <button type="button" @click="props.ctx.openTab(props.ctx.activeCard, 'detail')">
            <ReIcon name="View" :size="13" /><span>详情</span>
          </button>
          <button type="button" @click="props.ctx.openTab(props.ctx.activeCard, 'filter')">
            <ReIcon name="Filter" :size="13" /><span>过滤器链</span>
          </button>
          <button type="button" @click="props.ctx.openOperLog(props.ctx.activeCard)">
            <ReIcon name="Document" :size="13" /><span>操作日志</span>
          </button>
          <button type="button" @click="props.ctx.vm.openCreate()">
            <ReIcon name="Plus" :size="13" /><span>新增服务</span>
          </button>
          <button type="button" @click="props.ctx.openRoomEntrance()">
            <ReIcon name="Connection" :size="13" /><span>P2P 房间</span>
          </button>
        </div>
      </div>

      <!-- 没选中：只留入口，不摆禁用按钮 -->
      <div v-else class="sin-card sin-idle">
        <p>尚未选中服务。</p>
        <button type="button" @click="props.ctx.vm.openCreate()">
          <ReIcon name="Plus" :size="13" /><span>新增服务</span>
        </button>
      </div>

      <SvcActivity :ctx="props.ctx" mode="list" :limit="6" />

      <!-- 统计：只留读得懂的六格，口径与顶部计数同源 -->
      <div v-if="props.showStats" class="sin-stats">
        <div><span>总数</span><b class="sv-mono">{{ props.ctx.vm.stats.total }}</b></div>
        <div><span>运行</span><b class="sv-mono is-run">{{ props.ctx.vm.stats.running }}</b></div>
        <div><span>异常</span><b class="sv-mono" :class="{ 'is-err': props.ctx.vm.stats.error }">{{ props.ctx.vm.stats.error }}</b></div>
        <div><span>停止</span><b class="sv-mono">{{ props.ctx.vm.stats.stopped }}</b></div>
        <div><span>插件</span><b class="sv-mono">{{ props.ctx.vm.stats.plugins }}</b></div>
        <div><span>页签</span><b class="sv-mono">{{ props.ctx.tabCount }}</b></div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sin {
  display: flex;
  flex-direction: column;
  flex: none;
  width: 268px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.sin-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sin-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sin-fold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.sin-fold:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.sin-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px;
  overflow-y: auto;
}

.sin-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--el-fill-color-lighter, #fafafa);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.sin-node {
  display: flex;
  gap: 7px;
  align-items: center;
  min-width: 0;
}

.sin-node b {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sin-node__st {
  flex: none;
  padding: 0 6px;
  font-size: 10.5px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-radius: 999px;
}

.sin-node__st.is-err {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.sin-facts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
}

.sin-facts > div {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 6px;
  align-items: baseline;
}

.sin-facts dt {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.sin-facts dd {
  min-width: 0;
  margin: 0;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
}

.sin-reason {
  margin: 0;
  padding: 6px 7px;
  font-size: 11px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
}

.sin-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.sin-actions button,
.sin-idle button {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  height: 28px;
  padding: 0 8px;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.sin-actions button:hover,
.sin-idle button:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.sin-actions button:disabled {
  cursor: progress;
  opacity: 0.55;
}

.sin-idle p {
  margin: 0;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.sin-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  background: var(--el-border-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.sin-stats > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 8px;
  background: var(--el-bg-color);
}

.sin-stats span {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.sin-stats b {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sin-stats b.is-run {
  color: var(--el-color-success);
}

.sin-stats b.is-err {
  color: var(--el-color-danger);
}
</style>
