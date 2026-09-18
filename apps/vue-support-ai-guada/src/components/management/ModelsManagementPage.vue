<template>
  <div class="models-management-page">
    <div class="page-header">
      <h2>模型管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模型名称/编码/别名"
          clearable
          style="width: 280px; margin-right: 12px"
          @keyup.enter="loadModels"
          @clear="loadModels"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 新增模型
        </el-button>
        <el-button @click="loadModels">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <!-- 模型列表表格 -->
    <el-table :data="filteredModels" v-loading="loading" border stripe style="width: 100%">
      <el-table-column prop="modelName" label="模型名称" min-width="180">
        <template #default="{ row }">
          <div class="model-name-cell">
            <span class="model-name">{{ row.modelName }}</span>
            <el-tag v-if="row.modelEnabled" type="success" size="small" style="margin-left: 8px">启用</el-tag>
            <el-tag v-else type="info" size="small" style="margin-left: 8px">禁用</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="modelCode" label="模型编码" min-width="150" />
      <el-table-column prop="modelAliases" label="别名" min-width="150">
        <template #default="{ row }">
          <div class="aliases-cell">
            <el-tag
              v-for="(alias, idx) in parseAliases(row.modelAliases)"
              :key="idx"
              size="small"
              type="warning"
              style="margin: 2px"
            >
              {{ alias }}
            </el-tag>
            <span v-if="!parseAliases(row.modelAliases)?.length" class="text-muted">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="modelProviderId" label="提供商" min-width="120" />
      <el-table-column prop="modelCapabilities" label="能力" min-width="150">
        <template #default="{ row }">
          <el-tag
            v-for="(cap, idx) in parseCapabilities(row.modelCapabilities)"
            :key="idx"
            size="small"
            style="margin: 2px"
          >
            {{ cap }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="延迟" width="140" align="center">
        <template #default="{ row }">
          <div v-if="row.modelLastLatency" class="latency-cell">
            <span :class="getLatencyClass(row.modelLastLatency)">
              {{ row.modelLastLatency }}ms
            </span>
            <span class="latency-time">{{ formatTime(row.modelLastTestTime) }}</span>
          </div>
          <span v-else class="text-muted">未测试</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="testLatency(row)" :loading="row.testing">
            <el-icon><Timer /></el-icon> 测试延迟
          </el-button>
          <el-button size="small" type="primary" link @click="openEditDialog(row)">
            <el-icon><Edit /></el-icon> 编辑
          </el-button>
          <el-button size="small" type="danger" link @click="deleteModel(row)">
            <el-icon><Delete /></el-icon> 删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="models.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑模型' : '新增模型'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型编码" prop="modelCode">
          <el-input v-model="form.modelCode" placeholder="请输入模型编码（如 gpt-4）" />
        </el-form-item>
        <el-form-item label="提供商" prop="modelProviderId">
          <el-select v-model="form.modelProviderId" placeholder="请选择提供商" style="width: 100%">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="Ollama" value="ollama" />
            <el-option label="ONNX" value="onnx" />
            <el-option label="Python" value="python" />
            <el-option label="PyTorch" value="pytorch" />
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="Qwen" value="qwen" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型别名">
          <div class="aliases-input">
            <el-tag
              v-for="(alias, idx) in form.aliasesList"
              :key="idx"
              closable
              style="margin: 2px"
              @close="removeAlias(idx)"
            >
              {{ alias }}
            </el-tag>
            <el-input
              v-model="newAlias"
              placeholder="输入别名后按回车添加"
              size="small"
              style="width: 200px; margin-left: 8px"
              @keyup.enter="addAlias"
            />
          </div>
          <div class="form-tip">别名用于通过多个名称调用同一模型，多个别名用逗号分隔</div>
        </el-form-item>
        <el-form-item label="模型能力">
          <el-select v-model="form.capabilitiesList" multiple placeholder="选择模型能力" style="width: 100%">
            <el-option label="聊天(chat)" value="chat" />
            <el-option label="视觉语言(vlm)" value="vlm" />
            <el-option label="补全(completion)" value="completion" />
            <el-option label="文生图(text-to-image)" value="text-to-image" />
            <el-option label="文生视频(text-to-video)" value="text-to-video" />
            <el-option label="OCR" value="ocr" />
            <el-option label="布局分析(layout)" value="layout" />
            <el-option label="人脸检测(face-detect)" value="face-detect" />
            <el-option label="人脸识别(face)" value="face" />
            <el-option label="图像识别(image)" value="image" />
            <el-option label="超分辨率(super-resolution)" value="super-resolution" />
            <el-option label="动漫化(anime)" value="anime" />
            <el-option label="嵌入(embedding)" value="embedding" />
            <el-option label="语音识别(asr)" value="asr" />
            <el-option label="语音合成(tts)" value="tts" />
            <el-option label="深度思考(thinking)" value="thinking" />
            <el-option label="网页搜索(web-search)" value="web-search" />
          </el-select>
        </el-form-item>
        <el-form-item label="必填管线">
        <el-form-item label="上下文窗口">
          <el-input-number v-model="form.contextWindow" :min="0" :step="1024" placeholder="如 128000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大输出长度">
          <el-input-number v-model="form.maxTokens" :min="1" :step="128" placeholder="如 4096" style="width: 100%" />
        </el-form-item>
        <el-form-item label="温度">
          <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" :precision="1" placeholder="如 0.7" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Top P">
          <el-input-number v-model="form.topP" :min="0" :max="1" :step="0.1" :precision="1" placeholder="如 0.9" style="width: 100%" />
        </el-form-item>
        <el-form-item label="频率惩罚">
          <el-input-number v-model="form.frequencyPenalty" :min="-2" :max="2" :step="0.1" :precision="1" placeholder="如 0.0" style="width: 100%" />
        </el-form-item>
          <el-select v-model="form.requiredPipelinesList" multiple placeholder="选择必填管线" style="width: 100%">
            <el-option label="文生图" value="text-to-image" />
            <el-option label="文生视频" value="text-to-video" />
            <el-option label="OCR" value="ocr" />
            <el-option label="布局分析" value="layout" />
            <el-option label="人脸识别" value="face" />
            <el-option label="图片识别" value="image-recognition" />
          </el-select>
        </el-form-item>
        <el-form-item label="非必填管线">
          <el-select v-model="form.optionalPipelinesList" multiple placeholder="选择非必填管线" style="width: 100%">
            <el-option label="文生图" value="text-to-image" />
            <el-option label="文生视频" value="text-to-video" />
            <el-option label="OCR" value="ocr" />
            <el-option label="布局分析" value="layout" />
            <el-option label="人脸识别" value="face" />
            <el-option label="图片识别" value="image-recognition" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型描述">
          <el-input v-model="form.modelDescription" type="textarea" :rows="2" placeholder="请输入模型描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.modelSort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.modelEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh, Edit, Delete, Timer } from '@element-plus/icons-vue';
import { modelApi } from '@/services/javaApi';

const loading = ref(false);
const models = ref<any[]>([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();
const newAlias = ref('');

const defaultForm = () => ({
  modelId: '',
  modelName: '',
  modelCode: '',
  modelProviderId: '',
  modelAliases: '',
  aliasesList: [] as string[],
  modelCapabilities: '',
  capabilitiesList: [] as string[],
  modelRequiredPipelines: '',
  requiredPipelinesList: [] as string[],
  modelOptionalPipelines: '',
  optionalPipelinesList: [] as string[],
  modelDescription: '',
  modelSort: 0,
  modelEnabled: true,
});

const form = ref(defaultForm());

const rules = {
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  modelCode: [{ required: true, message: '请输入模型编码', trigger: 'blur' }],
  modelProviderId: [{ required: true, message: '请选择提供商', trigger: 'change' }],
};

const filteredModels = computed(() => {
  let result = models.value;
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase();
    result = result.filter((m) =>
      m.modelName?.toLowerCase().includes(kw) ||
      m.modelCode?.toLowerCase().includes(kw) ||
      m.modelAliases?.toLowerCase().includes(kw)
    );
  }
  const start = (currentPage.value - 1) * pageSize.value;
  return result.slice(start, start + pageSize.value);
});

const parseAliases = (aliases: string) => {
  if (!aliases) return [];
  try {
    if (typeof aliases === 'string') {
      return aliases.split(',').map((a) => a.trim()).filter(Boolean);
    }
    return Array.isArray(aliases) ? aliases : [];
  } catch {
    return [];
  }
};

const parseCapabilities = (caps: string) => {
  if (!caps) return [];
  try {
    if (typeof caps === 'string') {
      return caps.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return Array.isArray(caps) ? caps : [];
  } catch {
    return [];
  }
};

const getLatencyClass = (latency: number) => {
  if (latency < 500) return 'latency-fast';
  if (latency < 2000) return 'latency-medium';
  return 'latency-slow';
};

const formatTime = (time: string) => {
  if (!time) return '';
  try {
    const d = new Date(time);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const loadModels = async () => {
  loading.value = true;
  try {
    const res: any = await modelApi.list();
    models.value = res?.data || res?.records || res || [];
  } catch (e: any) {
    ElMessage.error('加载模型列表失败: ' + (e.message || ''));
    models.value = [];
  } finally {
    loading.value = false;
  }
};

const addAlias = () => {
  if (newAlias.value.trim() && !form.value.aliasesList.includes(newAlias.value.trim())) {
    form.value.aliasesList.push(newAlias.value.trim());
    newAlias.value = '';
  }
};

const removeAlias = (idx: number) => {
  form.value.aliasesList.splice(idx, 1);
};

const openCreateDialog = () => {
  isEdit.value = false;
  form.value = defaultForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: any) => {
  isEdit.value = true;
  form.value = {
    ...defaultForm(),
    ...row,
    aliasesList: parseAliases(row.modelAliases),
    capabilitiesList: parseCapabilities(row.modelCapabilities),
    requiredPipelinesList: parseCapabilities(row.modelRequiredPipelines),
    optionalPipelinesList: parseCapabilities(row.modelOptionalPipelines),
  };
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const payload = {
        modelName: form.value.modelName,
        modelCode: form.value.modelCode,
        modelProviderId: form.value.modelProviderId,
        modelAliases: form.value.aliasesList.join(','),
        modelCapabilities: form.value.capabilitiesList.join(','),
        modelRequiredPipelines: form.value.requiredPipelinesList.join(','),
        modelOptionalPipelines: form.value.optionalPipelinesList.join(','),
        modelDescription: form.value.modelDescription,
        contextWindow: form.value.contextWindow,
        maxTokens: form.value.maxTokens,
        temperature: form.value.temperature,
        topP: form.value.topP,
        frequencyPenalty: form.value.frequencyPenalty,
        modelSort: form.value.modelSort,
        modelEnabled: form.value.modelEnabled,
      };
      if (isEdit.value) {
        await modelApi.update(form.value.modelId, payload);
        ElMessage.success('模型更新成功');
      } else {
        await modelApi.create(payload);
        ElMessage.success('模型创建成功');
      }
      dialogVisible.value = false;
      loadModels();
    } catch (e: any) {
      ElMessage.error('保存失败: ' + (e.message || ''));
    } finally {
      submitting.value = false;
    }
  });
};

const deleteModel = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除模型「${row.modelName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    await modelApi.delete(row.modelId);
    ElMessage.success('删除成功');
    loadModels();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败: ' + (e.message || ''));
    }
  }
};

const testLatency = async (row: any) => {
  row.testing = true;
  try {
    const res: any = await modelApi.testLatency(row.modelId);
    const latency = res?.data?.latency || res?.latency || res?.data;
    if (latency) {
      row.modelLastLatency = latency;
      row.modelLastTestTime = new Date().toISOString();
      ElMessage.success(`延迟测试完成: ${latency}ms`);
    } else {
      ElMessage.success('延迟测试完成');
      loadModels();
    }
  } catch (e: any) {
    ElMessage.error('延迟测试失败: ' + (e.message || ''));
  } finally {
    row.testing = false;
  }
};

const handlePageChange = () => {
  // 分页由computed处理
};

onMounted(() => {
  loadModels();
});
</script>

<style scoped>
.models-management-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
}

.model-name-cell {
  display: flex;
  align-items: center;
}

.model-name {
  font-weight: 500;
}

.aliases-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.aliases-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.latency-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.latency-fast {
  color: #67c23a;
  font-weight: 600;
}

.latency-medium {
  color: #e6a23c;
  font-weight: 600;
}

.latency-slow {
  color: #f56c6c;
  font-weight: 600;
}

.latency-time {
  font-size: 11px;
  color: #909399;
}

.text-muted {
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
