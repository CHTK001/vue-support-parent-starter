<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">系统环境</h1>
        <p class="page-desc">管理 Java / Python / Node.js / Go / Rust / .NET 等 SDK 版本</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="env-tabs">
      <el-tab-pane label="Java" name="java">
        <SdkTable :sdks="filtered('java')" type="java" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label="Python" name="python">
        <SdkTable :sdks="filtered('python')" type="python" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label="Node.js" name="node">
        <SdkTable :sdks="filtered('node')" type="node" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label="Go" name="go">
        <SdkTable :sdks="filtered('go')" type="go" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label="Rust" name="rust">
        <SdkTable :sdks="filtered('rust')" type="rust" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label=".NET" name="dotnet">
        <SdkTable :sdks="filtered('dotnet')" type="dotnet" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label="Flutter/Dart" name="dart">
        <SdkTable :sdks="filtered('dart')" type="dart" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label="Ruby" name="ruby">
        <SdkTable :sdks="filtered('ruby')" type="ruby" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label="PHP" name="php">
        <SdkTable :sdks="filtered('php')" type="php" :loading="loading" @switch="handleSwitch" />
      </el-tab-pane>
      <el-tab-pane label="环境变量" name="env">
        <div class="seg">
          <h2 class="seg-title">系统环境变量</h2>
          <p class="seg-desc">当前 PATH 中包含以下 SDK 路径</p>
          <div v-if="sdks.length" class="env-list">
            <div v-for="sdk in sdks" :key="sdk.name + sdk.version" class="env-item">
              <div class="env-left">
                <span class="env-badge" :class="'b-' + sdk.type">{{ sdk.type.toUpperCase().slice(0, 4) }}</span>
                <div>
                  <div class="env-name">{{ sdk.name }}</div>
                  <div class="env-path">{{ sdk.installPath }}</div>
                </div>
              </div>
              <div class="env-right">
                <span v-if="sdk.active" class="tag-on">当前使用</span>
                <span v-else class="tag-off">未激活</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="未检测到 SDK" :image-size="40" class="mt-4" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSdks, switchSdk } from '@/api/software'
import SdkTable from '@/components/SdkTable.vue'

const sdks = ref<any[]>([])
const loading = ref(false)
const activeTab = ref('java')
const filtered = (type: string) => sdks.value.filter(s => s.type === type)

async function load() {
  loading.value = true
  try { sdks.value = await getSdks() }
  catch { ElMessage.error('加载 SDK 信息失败') }
  finally { loading.value = false }
}

async function handleSwitch(sdk: any) {
  try {
    const res = await switchSdk(sdk.type, sdk.version, sdk.installPath)
    if (res.success) { ElMessage.success(`已切换到 ${sdk.name} ${sdk.version}`); await load() }
    else { ElMessage.error('切换失败') }
  } catch { ElMessage.error('切换请求失败') }
}

onMounted(() => { load() })
</script>

<style scoped>
.page-head { margin-bottom: 28px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.env-tabs { --el-tabs-header-height: 44px; }

.seg { background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 14px; padding: 24px; }
.seg-title { font-size: 16px; font-weight: 600; }
.seg-desc { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px; margin-bottom: 16px; }

.env-list { display: flex; flex-direction: column; gap: 8px; }

.env-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  transition: background 0.12s;
}
.env-item:hover { background: var(--el-color-primary-light-9); }

.env-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.env-badge {
  width: 44px; height: 26px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
  flex-shrink: 0;
}
.b-java { background: #fef3c7; color: #92400e; }
.b-python { background: #dbeafe; color: #1e40af; }
.b-node { background: #dcfce7; color: #166534; }
.b-go { background: #e0f7fe; color: #0369a1; }
.b-rust { background: #fee2e2; color: #b91c1c; }
.b-dotnet { background: #ede9fe; color: #5b21b6; }
.b-dart { background: #e0f2fe; color: #0369a1; }
.b-ruby { background: #fee2e2; color: #991b1b; }
.b-php { background: #e0e7ff; color: #4338ca; }

.env-name { font-size: 14px; font-weight: 500; }
.env-path { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px; }

.env-right { flex-shrink: 0; }
.tag-on { font-size: 12px; padding: 2px 10px; border-radius: 100px; background: rgb(var(--el-color-primary)); color: #fff; font-weight: 500; }
.tag-off { font-size: 12px; padding: 2px 10px; border-radius: 100px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); }
</style>
