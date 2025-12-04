<template>
  <div class="test-component-fields">
    <el-card>
      <template #header>
        <h3>组件字段映射测试</h3>
      </template>
      
      <el-space direction="vertical" size="large" style="width: 100%">
        <!-- 测试数据显示 -->
        <el-card>
          <template #header>
            <h4>测试数据</h4>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="前端字段 (enabled)">
              <el-tag :type="testFormData.monitorSysGenServerComponentEnabled ? 'success' : 'danger'">
                {{ testFormData.monitorSysGenServerComponentEnabled ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="后端字段 (status)">
              <el-tag :type="testApiData.monitorSysGenServerComponentStatus === 1 ? 'success' : 'danger'">
                {{ testApiData.monitorSysGenServerComponentStatus === 1 ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="组件名称">
              {{ testFormData.monitorSysGenServerComponentName }}
            </el-descriptions-item>
            <el-descriptions-item label="组件类型">
              <el-tag :type="getComponentTypeTagColor(testFormData.monitorSysGenServerComponentType)">
                {{ getComponentTypeDisplayName(testFormData.monitorSysGenServerComponentType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="表达式类�?>
              <el-tag type="info">
                {{ getExpressionTypeDisplayName(testFormData.monitorSysGenServerComponentExpressionType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="表达�?>
              {{ testFormData.monitorSysGenServerComponentExpression || '未设�? }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        
        <!-- 转换测试 -->
        <el-card>
          <template #header>
            <h4>字段转换测试</h4>
          </template>
          
          <el-space>
            <el-button type="primary" @click="testFormToApi">
              前端 �?后端转换
            </el-button>
            <el-button type="success" @click="testApiToForm">
              后端 �?前端转换
            </el-button>
            <el-button @click="resetTestData">
              重置测试数据
            </el-button>
          </el-space>
          
          <el-divider />
          
          <!-- 转换结果 -->
          <div v-if="conversionResult">
            <h5>转换结果:</h5>
            <pre>{{ JSON.stringify(conversionResult, null, 2) }}</pre>
          </div>
        </el-card>
        
        <!-- 验证测试 -->
        <el-card>
          <template #header>
            <h4>数据验证测试</h4>
          </template>
          
          <el-button type="warning" @click="testValidation">
            验证数据完整�?
          </el-button>
          
          <div v-if="validationResult" style="margin-top: 16px">
            <el-alert
              :type="validationResult.isValid ? 'success' : 'error'"
              :title="validationResult.isValid ? '验证通过' : '验证失败'"
              :description="validationResult.isValid ? '数据完整性验证通过' : validationResult.errors.join(', ')"
              show-icon
            />
          </div>
        </el-card>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import {
  convertFormDataToApiData,
  convertApiDataToFormData,
  validateComponentData,
  getComponentTypeDisplayName,
  getComponentTypeTagColor,
  getExpressionTypeDisplayName,
  type ComponentFormData
} from '@/utils/component-field-mapping';
import type { ServerComponent } from '@/api/server';

// 测试数据
const testFormData = reactive<ComponentFormData>({
  monitorSysGenServerId: 1,
  monitorSysGenServerComponentName: '测试组件',
  monitorSysGenServerComponentType: 'card',
  monitorSysGenServerComponentExpressionType: 'PROMETHEUS',
  monitorSysGenServerComponentExpression: 'up{job="node"}',
  monitorSysGenServerComponentUnit: '%',
  monitorSysGenServerComponentDescription: '这是一个测试组�?,
  monitorSysGenServerComponentEnabled: true
});

const testApiData = reactive<ServerComponent>({
  monitorSysGenServerComponentId: 1,
  monitorSysGenServerId: 1,
  monitorSysGenServerComponentName: '测试组件',
  monitorSysGenServerComponentType: 'card',
  monitorSysGenServerComponentStatus: 1,
  monitorSysGenServerComponentDescription: '这是一个测试组�?
});

const conversionResult = ref<any>(null);
const validationResult = ref<any>(null);

/**
 * 测试前端到后端转�?
 */
const testFormToApi = () => {
  try {
    const result = convertFormDataToApiData(testFormData);
    conversionResult.value = result;
    ElMessage.success('前端到后端转换成�?);
  } catch (error) {
    console.error('转换失败:', error);
    ElMessage.error('转换失败');
  }
};

/**
 * 测试后端到前端转�?
 */
const testApiToForm = () => {
  try {
    const result = convertApiDataToFormData(testApiData);
    conversionResult.value = result;
    ElMessage.success('后端到前端转换成�?);
  } catch (error) {
    console.error('转换失败:', error);
    ElMessage.error('转换失败');
  }
};

/**
 * 测试数据验证
 */
const testValidation = () => {
  try {
    const result = validateComponentData(testFormData);
    validationResult.value = result;
    
    if (result.isValid) {
      ElMessage.success('数据验证通过');
    } else {
      ElMessage.error('数据验证失败');
    }
  } catch (error) {
    console.error('验证失败:', error);
    ElMessage.error('验证失败');
  }
};

/**
 * 重置测试数据
 */
const resetTestData = () => {
  Object.assign(testFormData, {
    monitorSysGenServerId: 1,
    monitorSysGenServerComponentName: '测试组件',
    monitorSysGenServerComponentType: 'card',
    monitorSysGenServerComponentExpressionType: 'PROMETHEUS',
    monitorSysGenServerComponentExpression: 'up{job="node"}',
    monitorSysGenServerComponentUnit: '%',
    monitorSysGenServerComponentDescription: '这是一个测试组�?,
    monitorSysGenServerComponentEnabled: true
  });
  
  Object.assign(testApiData, {
    monitorSysGenServerComponentId: 1,
    monitorSysGenServerId: 1,
    monitorSysGenServerComponentName: '测试组件',
    monitorSysGenServerComponentType: 'card',
    monitorSysGenServerComponentStatus: 1,
    monitorSysGenServerComponentDescription: '这是一个测试组�?
  });
  
  conversionResult.value = null;
  validationResult.value = null;
  
  ElMessage.info('测试数据已重�?);
};
</script>

<style lang="scss" scoped>
.test-component-fields {
  padding: 20px;
}

pre {
  background: var(--el-bg-color-overlay);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style>
