<template>
  <div class="protocol-server-page">
    <SettingsCard
      title="聚合协议服务"
      subtitle="对外提供 OpenAI / Claude / Gemini 三协议端点；这里是唯一的配置入口，保存后立即生效"
    >
      <SettingsRow label="启用" description="关闭时三个对外协议入口（Claude Messages / Responses / Gemini）统一回「服务未启用」，已对接的外部软件会调用失败">
        <el-switch
          v-model="enabled"
          :loading="saving"
          :disabled="loading"
          aria-label="是否启用聚合协议服务"
          @change="onSave"
        />
      </SettingsRow>
    </SettingsCard>

    <p class="protocol-server-note">
      <span class="protocol-server-note__icon"><el-icon><InfoFilled /></el-icon></span>
      <span class="protocol-server-note__text">
        字段来自 <b>runtime</b> 分组的 <code>protocol_server_enabled</code>：
        后端 <code>AiProtocolController</code> 在每个协议入口前读它，关闭即不对外服务；
        协议端点挂在应用主端口上，没有独立监听端口（原「端口」项从未被任何代码读取，已删除）。
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * 聚合协议服务设置页（管理员）。
 *
 * <p>只暴露后端真正读取的字段：{@code runtime.protocol_server_enabled}。</p>
 *
 * <p>为什么不用通用 DefaultModelSettings 渲染 protocol-server 分组：
 * 那个分组是「无人读取」的重复定义（host 也没有消费方），已从后端删除；
 * 真实字段挂在 runtime 分组里，而 runtime 的其余 20+ 项属于会话模型，不该出现在本页。
 * 所以这里只做 1 行，读写都走 runtime 分组的全局层。</p>
 */
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { apiService } from '../../services/ApiService'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

/** 后端读取的字段名（见 AiProtocolController#protocolServerEnabled） */
const FIELD_ENABLED = 'protocol_server_enabled'
/** runtime 分组：协议服务只读这一个键 */
const GROUP = 'runtime'

const loading = ref(false)
const saving = ref(false)
// 缺省启用：后端读取时的默认值也是 true（该开关此前未被读取，协议入口一直可用）
const enabled = ref(true)

/**
 * 从 merged 响应里取某个字段的合并结果。
 *
 * <p>响应有两种形状：数组 [{ field, value, defaultValue }] 或扁平 { field: value }，
 * 与 DefaultModelSettings 的处理保持一致，两种都收。</p>
 *
 * @param response fetchMergedGroupSettings 的返回
 * @param field    字段名
 * @returns { value, defaultValue }；取不到时返回 undefined
 */
const pickField = (response: any, field: string): { value?: any; defaultValue?: any } | undefined => {
  const data = response?.data ?? response
  if (Array.isArray(data)) {
    return data.find((item: any) => item?.field === field)
  }
  if (Array.isArray(data?.data)) {
    return data.data.find((item: any) => item?.field === field)
  }
  if (data && typeof data === 'object' && field in data) {
    return { value: data[field], defaultValue: data[field] }
  }
  return undefined
}

const load = async () => {
  loading.value = true
  try {
    const response = await apiService.fetchMergedGroupSettings(GROUP)
    const enabledItem = pickField(response, FIELD_ENABLED)
    // 取不到值视为「启用」：与后端 getBoolean(..., true) 的缺省一致
    const raw = enabledItem?.value ?? enabledItem?.defaultValue
    enabled.value = raw === undefined || raw === null || raw === ''
      ? true
      : String(raw).toLowerCase() === 'true'
  } catch (error: any) {
    console.error('读取聚合协议服务配置失败:', error)
    ElMessage.error('读取聚合协议服务配置失败：' + (error?.message || '请稍后重试'))
  } finally {
    loading.value = false
  }
}

/** 保存到全局层：协议服务运行时只认全局配置，写用户覆盖层会「保存了却不生效」 */
const onSave = async () => {
  saving.value = true
  try {
    await apiService.updateGroupSettings(GROUP, {
      [FIELD_ENABLED]: enabled.value ? 'true' : 'false',
    })
    ElMessage.success('已保存，立即生效')
  } catch (error: any) {
    console.error('保存聚合协议服务配置失败:', error)
    ElMessage.error('保存失败：' + (error?.message || '请稍后重试'))
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.protocol-server-note {
  display: flex;
  gap: 8px;
  margin: 12px 18px 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.protocol-server-note__icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--el-color-primary);
}
.protocol-server-note code {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}
</style>
