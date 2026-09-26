<template>
  <div class="skills-source">
    <div class="skills-head">
      <div>
        <h2 class="skills-h-title">Skills 来源配置</h2>
        <p class="skills-h-sub">控制「安装技能 → 检索安装」中可检索与安装的来源，开关保存后立即生效。</p>
      </div>
      <el-button type="primary" size="small" :loading="saving" @click="handleSave">保存</el-button>
    </div>

    <div v-if="loading" class="skills-loading">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
    </div>

    <template v-else>
      <!-- 在线市场 -->
      <SettingsCard title="在线市场">
        <SettingsRow label="官网市场（ai.dingd.cn）" description="内置分类市场，支持 ZIP 直装。">
          <el-switch v-model="draft.market" />
        </SettingsRow>
      </SettingsCard>

      <!-- 本地工具来源 -->
      <SettingsCard title="本地工具来源" :subtitle="`${installedLocalCount} 个已安装`">
        <SettingsRow v-for="item in config.local" :key="item.key">
          <template #label>
            <span class="loc-name">{{ item.name }}</span>
            <el-tag :type="item.installed ? 'success' : 'info'" size="small" effect="plain">
              {{ item.installed ? '已安装' : '未安装' }}
            </el-tag>
            <span v-if="item.installed && item.count" class="loc-count">{{ item.count }} 个技能</span>
          </template>
          <el-switch v-model="draft[item.key]" :disabled="!item.installed" />
        </SettingsRow>
      </SettingsCard>

      <!-- 在线聚合源 -->
      <SettingsCard
        title="在线聚合源"
        subtitle="聚合第三方技能索引（如 skills.sh），仅用于检索；实际安装需回源到对应仓库，受网络环境限制。"
      >
        <SettingsRow v-for="item in config.aggregators" :key="item.key" :label="item.name">
          <el-switch v-model="draft[item.key]" />
        </SettingsRow>
      </SettingsCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

interface LocalSource {
  key: string
  tool: string
  name: string
  installed: boolean
  enabled: boolean
  count: number
}
interface AggregatorSource {
  key: string
  source: string
  name: string
  enabled: boolean
}
interface CatalogConfig {
  local: LocalSource[]
  market: { key: string; enabled: boolean }
  aggregators: AggregatorSource[]
}

const loading = ref(true)
const saving = ref(false)
const config = ref<CatalogConfig>({ local: [], market: { key: 'market', enabled: true }, aggregators: [] })
const draft = ref<Record<string, boolean>>({})

const installedLocalCount = computed(() => config.value.local.filter(i => i.installed).length)

async function loadConfig() {
  loading.value = true
  try {
    const data = await apiService.fetchSkillCatalogConfig()
    config.value = {
      local: Array.isArray(data?.local) ? data.local : [],
      market: data?.market || { key: 'market', enabled: true },
      aggregators: Array.isArray(data?.aggregators) ? data.aggregators : [],
    }
    const d: Record<string, boolean> = {}
    d.market = !!config.value.market.enabled
    config.value.local.forEach(i => { d[i.key] = !!i.enabled })
    config.value.aggregators.forEach(i => { d[i.key] = !!i.enabled })
    draft.value = d
  } catch (err: any) {
    ElMessage.error(err.message || '加载 Skills 来源配置失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    await apiService.updateSkillCatalogConfig({ ...draft.value })
    ElMessage.success('已保存')
    await loadConfig()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.skills-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px; margin-bottom: 18px;
}
.skills-h-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); }
.skills-h-sub { margin: 5px 0 0; font-size: 12.5px; color: var(--el-text-color-secondary); }
.skills-loading { padding: 40px 0; text-align: center; color: var(--el-text-color-secondary); }

.loc-name {
  font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.loc-count { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; }
</style>
