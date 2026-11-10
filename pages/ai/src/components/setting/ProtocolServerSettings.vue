<template>
  <div class="protocol-server-page">
    <SettingsCard
      title="聚合协议服务"
      subtitle="对外提供 OpenAI / Claude / Gemini 三协议端点；这里是唯一的配置入口，改完需重启服务生效"
    >
      <SettingsRow label="启用" description="关闭时协议服务不监听端口，已对接的外部软件会连接失败">
        <el-switch
          v-model="enabled"
          :loading="saving"
          :disabled="loading"
          aria-label="是否启用聚合协议服务"
          @change="onSave"
        />
      </SettingsRow>

      <SettingsRow label="端口" description="三种协议共用同一个端口；改端口后需要重启服务才会换监听">
        <el-input-number
          v-model="port"
          :min="1"
          :max="65535"
          :disabled="loading"
          controls-position="right"
          aria-label="聚合协议服务端口"
          @change="onSave"
        />
      </SettingsRow>
    </SettingsCard>

    <p class="protocol-server-note">
      <span class="protocol-server-note__icon"><el-icon><InfoFilled /></el-icon></span>
      <span class="protocol-server-note__text">
        字段来自 <b>runtime</b> 分组的 <code>protocol_server_enabled</code> /
        <code>protocol_server_port</code> —— 后端协议服务（AiGlobalSettingServiceImpl
        的字段映射）只读这两项。原先「默认模型」页里的同名重复分组
        （protocol-server：enabled/port/host）没有任何消费方，已删除。
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * 聚合协议服务设置页（管理员）。
 *
 * <p>只暴露后端真正读取的两个字段：{@code runtime.protocol_server_enabled} /
 * {@code runtime.protocol_server_port}。</p>
 *
 * <p>为什么不用通用 DefaultModelSettings 渲染 protocol-server 分组：
 * 那个分组是「无人读取」的重复定义（host 也没有消费方），已从后端删除；
 * 真实字段挂在 runtime 分组里，而 runtime 的其余 20+ 项属于会话模型，不该出现在本页。
 * 所以这里只做 2 行，读写都走 runtime 分组的全局层。</p>
 */
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { apiService } from '../../services/ApiService'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

/** 后端读取的字段名（见 AiGlobalSettingServiceImpl 的 fieldMapping） */
const FIELD_ENABLED = 'protocol_server_enabled'
const FIELD_PORT = 'protocol_server_port'
/** runtime 分组：协议服务只读这两个键 */
const GROUP = 'runtime'
/** 端口默认值：与后端定义 defaultValue 对齐 */
const DEFAULT_PORT = 8090

const loading = ref(false)
const saving = ref(false)
const enabled = ref(false)
const port = ref(DEFAULT_PORT)

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
    enabled.value = String(enabledItem?.value ?? enabledItem?.defaultValue ?? '').toLowerCase() === 'true'
    const portItem = pickField(response, FIELD_PORT)
    const parsed = Number(portItem?.value ?? portItem?.defaultValue)
    port.value = Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : DEFAULT_PORT
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
      [FIELD_PORT]: String(port.value),
    })
    ElMessage.success('已保存，重启服务后生效')
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
