<template>
  <div class="mg-pl">
    <div class="mg-pl__head">
      <span class="mg-pl__title">
        网关插件
        <i>{{ plugins.length }}</i>
      </span>
      <span class="mg-pl__ops">
        <select
          v-if="connections.length > 1"
          v-model="connectionId"
          class="mg-pl__select"
          title="选择要管理的 Magpie 网关"
          @change="load()"
        >
          <option v-for="c in connections" :key="c.connectionId" :value="c.connectionId">
            {{ c.label || c.connectionId }}
          </option>
        </select>
        <button type="button" class="mg-pl__btn" :disabled="loading" @click="load()">
          {{ loading ? '读取中…' : '刷新' }}
        </button>
        <button
          type="button"
          class="mg-pl__btn"
          :disabled="marketLoading"
          title="会访问 npm / GitHub，较慢"
          @click="loadMarket()"
        >
          {{ marketLoading ? '读市场中…' : '插件市场' }}
        </button>
        <button type="button" class="mg-pl__btn is-primary" @click="openInstall('')">
          ＋ 安装插件
        </button>
      </span>
    </div>

    <p v-if="error" class="mg-pl__error">{{ error }}</p>
    <p v-if="!bun" class="mg-pl__hint is-warn">
      本机尚未就绪 Bun：首次安装插件时 magpie 会先下载 Bun，可能要几分钟，请勿关闭页面。
    </p>

    <div v-if="!connections.length" class="mg-pl__empty">
      先在「账号」页绑定 Magpie 网关（地址 + 网关 key），再回到这里管理插件。
    </div>
    <template v-else>
      <div class="mg-pl__tablewrap">
        <table class="mg-pl__table">
          <thead>
            <tr>
              <th>名称</th>
              <th>规格</th>
              <th>版本</th>
              <th>接管 provider</th>
              <th>状态</th>
              <th class="is-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plugin in plugins" :key="String(plugin.spec)">
              <td class="is-name" :title="String(plugin.name ?? '')">
                {{ plugin.name || shortSpec(plugin.spec) }}
              </td>
              <td class="is-id" :title="String(plugin.spec ?? '')">{{ plugin.spec }}</td>
              <td>
                {{ plugin.version || '—' }}
                <span v-if="hasUpdate(plugin)" class="mg-pl__tag is-new">可升级 {{ plugin.latest }}</span>
              </td>
              <td>{{ listText(plugin.moved) }}</td>
              <td>
                <span class="mg-pl__tag" :class="{ 'is-off': plugin.off, 'is-bad': plugin.error }">
                  {{ statusText(plugin) }}
                </span>
              </td>
              <td class="is-actions">
                <button
                  type="button"
                  class="mg-pl__link"
                  :disabled="busySpec === plugin.spec"
                  @click="toggle(plugin)"
                >{{ plugin.off ? '启用' : '停用' }}</button>
                <button
                  type="button"
                  class="mg-pl__link"
                  :disabled="busySpec === plugin.spec || !hasUpdate(plugin)"
                  @click="upgrade(plugin)"
                >升级</button>
                <button
                  type="button"
                  class="mg-pl__link"
                  :disabled="busySpec === plugin.spec"
                  @click="check(plugin)"
                >检查更新</button>
                <button
                  type="button"
                  class="mg-pl__link is-danger"
                  :disabled="busySpec === plugin.spec"
                  @click="remove(plugin)"
                >卸载</button>
              </td>
            </tr>
            <tr v-if="!plugins.length && !loading">
              <td colspan="6" class="mg-pl__empty-cell">
                <template v-if="error">管理面不可用：{{ error }}</template>
                <template v-else>网关里还没有插件，点「插件市场」挑一个装上</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="listings.length" class="mg-pl__market">
        <div class="mg-pl__market-head">
          <span>插件市场</span>
          <button type="button" class="mg-pl__link" @click="listings = []">收起</button>
        </div>
        <ul class="mg-pl__list">
          <li v-for="item in listings" :key="String(item.package ?? item.spec ?? item.name)">
            <div class="mg-pl__list-main">
              <b>{{ String(item.name ?? item.package ?? '') }}</b>
              <span class="mg-pl__list-spec">{{ String(item.package ?? '') }}</span>
            </div>
            <div class="mg-pl__list-meta">
              <span v-if="item.version">v{{ String(item.version) }}</span>
              <span v-if="Array.isArray(item.providers)">
                接管 {{ (item.providers as string[]).join(' / ') }}
              </span>
              <span v-if="item.community" class="mg-pl__tag">社区</span>
            </div>
            <button
              type="button"
              class="mg-pl__btn"
              :disabled="installing || installed(String(item.package ?? ''))"
              @click="install(String(item.package ?? ''))"
            >{{ installed(String(item.package ?? '')) ? '已安装' : '安装' }}</button>
          </li>
        </ul>
      </div>
    </template>

    <ReDialog
      v-model="dialogVisible"
      title="安装网关插件"
      width="560px"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form label-width="90px" class="mg-pl__form">
        <el-form-item label="npm 规格" required>
          <el-input
            v-model="specInput"
            placeholder="如 @magpie-community/opencode-workbuddy-auth"
            maxlength="200"
            spellcheck="false"
          />
          <span class="mg-pl__formhint">
            可带版本号（@0.2.24）；magpie 会自己下载依赖。首次安装会先下载 Bun，耗时可能几分钟。
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="installing" @click="install(specInput)">开始安装</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Magpie 网关「插件」管理面板。
 *
 * <p>插件是网关自己的扩展：登录、签到、模型目录都可能由插件提供。装完后
 * 被接管的 provider 在 magpie 里 {@code move.state} 变成 {@code plugin}，
 * 签到与登录都会改走插件端点——这些分流后端已经处理，前端只负责装 / 卸 / 升。</p>
 *
 * <p><b>为什么动作要二次确认</b>：安装与卸载会改变路由与签到行为，且安装是
 * 分钟级长任务（下载 Bun + npm 安装）。误点一次代价很高，所以统一走确认框。</p>
 */
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import {
  channelApi,
  type ChannelConnectionSummary,
  type MagpiePlugin,
} from '../channelApi'

const props = defineProps<{
  /** 渠道标识 */
  channel: string
  /** 该渠道下已绑定的网关连接 */
  connections: ChannelConnectionSummary[]
}>()

const emit = defineEmits<{
  (e: 'changed'): void
}>()

/** 当前管理的网关连接（多网关时可切换） */
const connectionId = ref('')
const loading = ref(false)
const marketLoading = ref(false)
const installing = ref(false)
const error = ref('')
const plugins = ref<MagpiePlugin[]>([])
const listings = ref<Array<Record<string, unknown>>>([])
const bun = ref(true)
const busySpec = ref('')

const dialogVisible = ref(false)
const specInput = ref('')

/** 同步默认连接：优先主账号，其次第一条 */
watch(
  () => props.connections,
  (list) => {
    if (!list.length) {
      connectionId.value = ''
      return
    }
    if (list.some((c) => c.connectionId === connectionId.value)) return
    connectionId.value = (list.find((c) => c.primary) ?? list[0])!.connectionId ?? ''
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  if (props.connections.length && connectionId.value) void load()
})

watch(connectionId, (id, prev) => {
  if (id && id !== prev) {
    listings.value = []
    void load()
  }
})

/**
 * 读取已安装插件。
 *
 * @param market 是否同时读市场（慢）
 */
async function load(market = false): Promise<void> {
  if (!connectionId.value) {
    plugins.value = []
    return
  }
  const target = market ? marketLoading : loading
  target.value = true
  error.value = ''
  try {
    const res = await channelApi.magpiePlugins(
      props.channel,
      { connectionId: connectionId.value },
      market,
    )
    const out = (res as any)?.data ?? res
    const state = out?.result ?? out
    plugins.value = (state?.plugins ?? []) as MagpiePlugin[]
    bun.value = state?.bun !== false
    if (market) {
      listings.value = (state?.listings ?? []) as Array<Record<string, unknown>>
      if (!listings.value.length) ElMessage.info('市场里没有可安装的插件')
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    if (!market) plugins.value = []
  } finally {
    target.value = false
  }
}

/** 读插件市场（访问 npm / GitHub，单独触发） */
function loadMarket(): void {
  void load(true)
}

/** 打开安装弹窗 */
function openInstall(spec: string): void {
  if (!connectionId.value) {
    ElMessage.warning('请先绑定 Magpie 网关')
    return
  }
  specInput.value = spec
  dialogVisible.value = true
}

/**
 * 安装插件：二次确认 + 分钟级等待提示。
 *
 * @param spec npm 规格，如 {@code @magpie-community/opencode-workbuddy-auth}
 */
async function install(spec: string): Promise<void> {
  const value = (spec ?? '').trim()
  if (!value) {
    ElMessage.warning('请填写插件的 npm 规格')
    return
  }
  try {
    await ElMessageBox.confirm(
      `安装插件「${value}」？首次安装会先下载 Bun，可能需要几分钟；装好后被接管的 provider 改走插件登录与签到。`,
      '确认安装',
      { type: 'warning', confirmButtonText: '开始安装', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  installing.value = true
  const tip = ElMessage({
    message: '正在安装，请勿关闭页面…',
    type: 'info',
    duration: 0,
  })
  try {
    await channelApi.magpiePluginAction(props.channel, 'add', {
      connectionId: connectionId.value,
      spec: value,
    })
    ElMessage.success('插件已安装')
    dialogVisible.value = false
    listings.value = []
    await load()
    emit('changed')
  } catch (e: any) {
    ElMessage.error('安装失败：' + (e?.message ?? e))
  } finally {
    tip.close()
    installing.value = false
  }
}

/**
 * 停用 / 启用插件（停用不等于卸载）。
 *
 * @param plugin 插件行
 */
async function toggle(plugin: MagpiePlugin): Promise<void> {
  const spec = String(plugin.spec ?? '')
  if (!spec) return
  const off = !plugin.off
  if (off) {
    try {
      await ElMessageBox.confirm(
        `停用插件「${plugin.name || spec}」？停用后它接管的 provider 会回落到内置实现。`,
        '确认停用',
        { type: 'warning' },
      )
    } catch {
      return
    }
  }
  await run('off', spec, { spec, off })
}

/**
 * 升级到最新版。
 *
 * @param plugin 插件行
 */
async function upgrade(plugin: MagpiePlugin): Promise<void> {
  const spec = String(plugin.spec ?? '')
  if (!spec) return
  try {
    await ElMessageBox.confirm(
      `把「${plugin.name || spec}」升级到 ${plugin.latest || '最新版'}？升级期间该插件负责的登录与签到会短暂不可用。`,
      '确认升级',
      { type: 'warning' },
    )
  } catch {
    return
  }
  await run('upgrade', spec, { spec })
}

/**
 * 检查更新（只读，不吃确认）。
 *
 * @param plugin 插件行
 */
async function check(plugin: MagpiePlugin): Promise<void> {
  const spec = String(plugin.spec ?? '')
  if (!spec) return
  await run('check', spec, { spec })
}

/**
 * 卸载插件。
 *
 * @param plugin 插件行
 */
async function remove(plugin: MagpiePlugin): Promise<void> {
  const spec = String(plugin.spec ?? '')
  if (!spec) return
  try {
    await ElMessageBox.confirm(
      `卸载插件「${plugin.name || spec}」？被它接管的 provider 会回落到内置实现，插件带来的签到与登录方式也会失效。`,
      '确认卸载',
      { type: 'warning', confirmButtonText: '卸载' },
    )
  } catch {
    return
  }
  await run('remove', spec, { spec })
}

/**
 * 统一的动作执行：置忙 → 调接口 → 重读清单。
 *
 * @param op   动作名
 * @param spec 插件规格（用于置忙）
 * @param body 请求体
 */
async function run(
  op: 'off' | 'upgrade' | 'check' | 'remove',
  spec: string,
  body: Record<string, unknown>,
): Promise<void> {
  busySpec.value = spec
  try {
    await channelApi.magpiePluginAction(props.channel, op, {
      connectionId: connectionId.value,
      ...body,
    })
    ElMessage.success(actionText(op))
    await load()
    emit('changed')
  } catch (e: any) {
    ElMessage.error(actionText(op, true) + '：' + (e?.message ?? e))
  } finally {
    busySpec.value = ''
  }
}

/**
 * 动作的中文提示。
 *
 * @param op  动作名
 * @param fail 是否失败文案
 * @returns 文案
 */
function actionText(op: string, fail = false): string {
  if (fail) return '操作失败'
  if (op === 'off') return '插件状态已更新'
  if (op === 'upgrade') return '升级完成'
  if (op === 'check') return '已检查更新'
  if (op === 'remove') return '插件已卸载'
  return '操作完成'
}

/** 是否有新版本 */
function hasUpdate(plugin: MagpiePlugin): boolean {
  return !!plugin.latest && !!plugin.version && plugin.latest !== plugin.version
}

/** 是否已安装该规格 */
function installed(spec: string): boolean {
  if (!spec) return false
  return plugins.value.some((p) => String(p.spec ?? '') === spec)
}

/** 状态文案 */
function statusText(plugin: MagpiePlugin): string {
  if (plugin.error) return '异常'
  if (plugin.off) return '已停用'
  return '已启用'
}

/** 列表字段拼接 */
function listText(value: unknown): string {
  if (Array.isArray(value) && value.length) return value.map(String).join(' / ')
  return '—'
}

/** 规格去掉 scope，便于窄列展示 */
function shortSpec(spec: unknown): string {
  const text = String(spec ?? '')
  const at = text.lastIndexOf('/')
  return at >= 0 ? text.slice(at + 1) : text
}
</script>

<style scoped>
.mg-pl {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mg-pl__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.mg-pl__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.mg-pl__title i {
  margin-left: 4px;
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-secondary, #909399);
}
.mg-pl__ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mg-pl__select {
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
}
.mg-pl__btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12.5px;
  cursor: pointer;
}
.mg-pl__btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.mg-pl__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mg-pl__btn.is-primary {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.mg-pl__hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-pl__hint.is-warn {
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--el-color-warning, #e6a23c);
  background: var(--el-color-warning-light-9, #fdf6ec);
}
.mg-pl__error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}
.mg-pl__tablewrap {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
}
.mg-pl__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.mg-pl__table th,
.mg-pl__table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  white-space: nowrap;
}
.mg-pl__table th {
  font-weight: 600;
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-pl__table tbody tr:last-child td {
  border-bottom: none;
}
.mg-pl__table td.is-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary, #303133);
}
.mg-pl__table td.is-id {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary, #909399);
}
.mg-pl__table td.is-actions,
.mg-pl__table th.is-actions {
  text-align: right;
}
.mg-pl__tag {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11.5px;
  color: var(--el-color-success, #67c23a);
  background: var(--el-color-success-light-9, #f0f9eb);
}
.mg-pl__tag.is-off {
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-pl__tag.is-bad {
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}
.mg-pl__tag.is-new {
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.mg-pl__link {
  padding: 0 6px;
  border: none;
  background: none;
  color: var(--el-color-primary, #409eff);
  font-size: 12.5px;
  cursor: pointer;
}
.mg-pl__link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mg-pl__link.is-danger {
  color: var(--el-color-danger, #f56c6c);
}
.mg-pl__empty,
.mg-pl__empty-cell {
  padding: 18px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-pl__market {
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  padding: 8px 12px 12px;
  background: var(--el-fill-color-blank, #fff);
}
.mg-pl__market-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.mg-pl__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mg-pl__list li {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-pl__list-main {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-width: 200px;
  flex: 1;
}
.mg-pl__list-main b {
  font-size: 12.5px;
  color: var(--el-text-color-primary, #303133);
}
.mg-pl__list-spec {
  font-size: 11.5px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-pl__list-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-pl__form {
  padding-top: 4px;
}
.mg-pl__formhint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
}
</style>
