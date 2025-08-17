<template>
  <el-dialog
    v-model="visibleInner"
    title="动态表达式过滤器配置"
    width="980px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dynamic-config-container thin-scrollbar">
      <!-- 基础配置 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          基础配置
        </h4>
        <div class="config-grid">
          <el-form-item label="启用状态">
            <el-switch v-model="config.enabled" />
          </el-form-item>
          <el-form-item label="表达式类型">
            <el-select v-model="config.type" style="width: 180px">
              <el-option label="Java" value="java" />
              <el-option label="Groovy" value="groovy" />
              <el-option label="JavaScript" value="js" />
            </el-select>
          </el-form-item>
          <el-form-item label="指纹(可选)">
            <el-input v-model="config.fingerprint" placeholder="用于热重载比对的标识，可留空自动生成" />
          </el-form-item>
        </div>
      </div>

      <!-- 源码编辑器 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:code-s-slash-line" />
          源码
        </h4>
        <div class="editor-wrapper">
          <CodeEditor
            v-model:content="config.source"
            :showTool="true"
            :height="'420px'"
            :options="{ mode: editorMode }"
            :placeholder="placeholderText"
          />
        </div>
        <div class="tips">
          <el-text type="info" size="small">
            要求实现 ServletFilter 接口（或可适配），保存后会热重载到运行中的服务器。
          </el-text>
        </div>
      </div>

      <!-- 配置预览 -->
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:eye-line" />
          配置预览
        </h4>
        <el-card class="config-preview thin-scrollbar">
          <pre>{{ JSON.stringify(previewConfig, null, 2) }}</pre>
        </el-card>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存配置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import CodeEditor from '@/components/codeEditor/index.vue'
import { getServletFilterConfig, saveServletFilterConfig } from '@/api/system-server-setting'

interface Props { visible: boolean; serverId: number; filterSettingId: number }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:visible': [boolean]; success: [] }>()

const visibleInner = ref(false)
const loading = ref(false)

const config = reactive({
  enabled: false,
  type: 'java' as 'java' | 'groovy' | 'js' | string,
  source: '',
  fingerprint: ''
})

const editorMode = computed(() => {
  const t = (config.type || '').toLowerCase()
  if (t === 'java' || t === 'groovy') return 'text/x-java'
  if (t === 'js' || t === 'javascript') return 'javascript'
  return 'text/plain'
})

const placeholderText = computed(() => {
  if (config.type === 'java') {
    return '示例：\npublic class MyFilter implements com.chua.common.support.protocol.filter.ServletFilter {\n  @Override\n  public void doFilter(com.chua.common.support.protocol.request.ServletRequest request, com.chua.common.support.protocol.request.ServletResponse response, com.chua.common.support.protocol.server.ServletFilterChain chain) throws Exception {\n    // TODO\n    chain.doFilter(request, response);\n  }\n}';
  }
  if (config.type === 'groovy') {
    return '// Groovy 示例\nclass MyFilter implements com.chua.common.support.protocol.filter.ServletFilter {\n  void doFilter(request, response, chain) {\n    chain.doFilter(request, response)\n  }\n}';
  }
  if (config.type === 'js') {
    return '// JS 示例（需适配器支持）\nfunction doFilter(request, response, chain) {\n  chain.doFilter(request, response)\n}';
  }
  return '在此粘贴或编写源码...'
})

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) await loadData() }, { immediate: true })
watch(visibleInner, v => emit('update:visible', v))

const previewConfig = computed(() => ({ enabled: config.enabled, type: config.type, fingerprint: config.fingerprint }))

async function loadData() {
  try {
    const res = await getServletFilterConfig(props.filterSettingId)
    if (res.success && res.data) {
      config.enabled = !!res.data.enabled
      config.type = (res.data.type || 'java')
      config.source = res.data.source || ''
      config.fingerprint = res.data.fingerprint || ''
    }
  } catch (e) {
    // ignore
  }
}

async function handleSave() {
  if (!config.source || !config.source.trim()) {
    ElMessage.warning('请填写源码')
    return
  }
  loading.value = true
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, {
      enabled: config.enabled,
      type: config.type,
      source: config.source,
      fingerprint: config.fingerprint || undefined
    })
    if (res.success) {
      ElMessage.success('动态表达式配置已保存并热应用')
      emit('success')
      visibleInner.value = false
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

function handleClose() { visibleInner.value = false }
</script>

<style scoped>
.dynamic-config-container {
  max-height: 70vh;
  overflow-y: auto;
}
.config-section { margin-bottom: 24px; padding: 16px; border: 1px solid #e4e7ed; border-radius: 8px; background: #fafafa; }
.section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #303133; }
.config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.editor-wrapper { border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden; }
.config-preview { max-height: 240px; overflow: auto; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; }
</style>
