/**
 * 组件配置管理组合式函数
 */

import { ref, reactive, computed } from 'vue';
import { message } from '@repo/utils';
import type { 
  ServerDetailComponent,
  ComponentConfigForm,
  ComponentTemplate,
  ComponentValidationResult,
  ComponentType,
  DataSourceType,
  ExpressionType,
  ChartConfig
} from '../types/component';
import {
  getEnabledServerDetailComponents,
  saveServerDetailComponent,
  updateServerDetailComponent,
  deleteServerDetailComponent,
  batchUpdateComponentPosition,
  initDefaultComponentsForServer
} from '@/api/monitor/gen/server';

export function useComponentConfig() {
  // 响应式状态
  const loading = ref(false);
  const components = ref<ServerDetailComponent[]>([]);
  const templates = ref<ComponentTemplate[]>([]);
  const currentComponent = ref<ServerDetailComponent | null>(null);
  
  // 表单状态
  const formData = reactive<ComponentConfigForm>({
    name: '',
    title: '',
    type: 'card' as ComponentType,
    dataSourceType: 'sql' as DataSourceType,
    expressionType: 'sql' as ExpressionType,
    expression: '',
    description: '',
    refreshInterval: 30,
    enabled: true,
    sortOrder: 0,
    position: { x: 0, y: 0, w: 6, h: 6 },
    chartConfig: {}
  });

  // 验证状态
  const validationResult = ref<ComponentValidationResult>({
    valid: true,
    errors: [],
    warnings: []
  });

  // 计算属性
  const hasComponents = computed(() => components.value.length > 0);
  const enabledComponents = computed(() => 
    components.value.filter(c => c.monitorSysGenServerDetailComponentEnabled === 1)
  );
  const componentsByType = computed(() => {
    const result: Record<string, ServerDetailComponent[]> = {};
    components.value.forEach(component => {
      const type = component.monitorSysGenServerDetailComponentType;
      if (!result[type]) {
        result[type] = [];
      }
      result[type].push(component);
    });
    return result;
  });

  /**
   * 加载组件列表
   */
  const loadComponents = async (serverId: number) => {
    try {
      loading.value = true;
      const res = await getEnabledServerDetailComponents(serverId);
      
      if (res.code === '00000') {
        components.value = res.data || [];
        return res.data;
      } else {
        message.error(res.msg || '加载组件列表失败');
        return [];
      }
    } catch (error) {
      console.error('加载组件列表失败:', error);
      message.error('加载组件列表失败');
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 保存组件配置
   */
  const saveComponent = async (serverId: number, isUpdate = false) => {
    try {
      loading.value = true;
      
      // 验证表单
      const validation = validateComponent();
      if (!validation.valid) {
        message.error('配置验证失败：' + validation.errors.join(', '));
        return null;
      }

      const componentData = {
        monitorSysGenServerId: serverId,
        monitorSysGenServerDetailComponentName: formData.name,
        monitorSysGenServerDetailComponentTitle: formData.title,
        monitorSysGenServerDetailComponentType: formData.type,
        monitorSysGenServerDetailComponentExpressionType: formData.expressionType,
        monitorSysGenServerDetailComponentExpression: formData.expression,
        monitorSysGenServerDetailComponentDesc: formData.description,
        monitorSysGenServerDetailComponentRefreshInterval: formData.refreshInterval,
        monitorSysGenServerDetailComponentEnabled: formData.enabled ? 1 : 0,
        monitorSysGenServerDetailComponentSortOrder: formData.sortOrder,
        monitorSysGenServerDetailComponentPosition: JSON.stringify(formData.position),
        monitorSysGenServerDetailComponentChartConfig: JSON.stringify(formData.chartConfig),
        ...(isUpdate && currentComponent.value && {
          monitorSysGenServerDetailComponentId: currentComponent.value.monitorSysGenServerDetailComponentId
        })
      };

      const res = isUpdate 
        ? await updateServerDetailComponent(componentData)
        : await saveServerDetailComponent(componentData);
      
      if (res.code === '00000') {
        message.success(isUpdate ? '更新成功' : '保存成功');
        await loadComponents(serverId);
        return res.data;
      } else {
        message.error(res.msg || (isUpdate ? '更新失败' : '保存失败'));
        return null;
      }
    } catch (error) {
      console.error('保存组件配置失败:', error);
      message.error(isUpdate ? '更新失败' : '保存失败');
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除组件
   */
  const deleteComponent = async (componentId: number, serverId: number) => {
    try {
      loading.value = true;
      const res = await deleteServerDetailComponent(componentId);
      
      if (res.code === '00000') {
        message.success('删除成功');
        await loadComponents(serverId);
        return true;
      } else {
        message.error(res.msg || '删除失败');
        return false;
      }
    } catch (error) {
      console.error('删除组件失败:', error);
      message.error('删除失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 批量更新组件位置
   */
  const updateComponentPositions = async (updatedComponents: ServerDetailComponent[]) => {
    try {
      loading.value = true;
      const res = await batchUpdateComponentPosition(updatedComponents);
      
      if (res.code === '00000') {
        message.success('布局保存成功');
        return true;
      } else {
        message.error(res.msg || '布局保存失败');
        return false;
      }
    } catch (error) {
      console.error('更新组件位置失败:', error);
      message.error('布局保存失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 初始化默认组件
   */
  const initDefaultComponents = async (serverId: number) => {
    try {
      loading.value = true;
      const res = await initDefaultComponentsForServer(serverId);
      
      if (res.code === '00000') {
        message.success('初始化默认组件成功');
        await loadComponents(serverId);
        return true;
      } else {
        message.error(res.msg || '初始化失败');
        return false;
      }
    } catch (error) {
      console.error('初始化默认组件失败:', error);
      message.error('初始化失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 验证组件配置
   */
  const validateComponent = (): ComponentValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填字段验证
    if (!formData.name.trim()) {
      errors.push('组件名称不能为空');
    }
    if (!formData.title.trim()) {
      errors.push('组件标题不能为空');
    }
    if (!formData.expression.trim()) {
      errors.push('数据表达式不能为空');
    }

    // 刷新间隔验证
    if (formData.refreshInterval < 5) {
      warnings.push('刷新间隔建议不少于5秒');
    }

    // 位置验证
    if (formData.position.w < 1 || formData.position.h < 1) {
      errors.push('组件尺寸必须大于0');
    }

    // 表达式验证
    if (formData.expressionType === 'sql' && !formData.expression.toLowerCase().includes('select')) {
      warnings.push('SQL表达式建议包含SELECT语句');
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings
    };

    validationResult.value = result;
    return result;
  };

  /**
   * 重置表单
   */
  const resetForm = () => {
    Object.assign(formData, {
      name: '',
      title: '',
      type: 'card' as ComponentType,
      dataSourceType: 'sql' as DataSourceType,
      expressionType: 'sql' as ExpressionType,
      expression: '',
      description: '',
      refreshInterval: 30,
      enabled: true,
      sortOrder: 0,
      position: { x: 0, y: 0, w: 6, h: 6 },
      chartConfig: {}
    });
    currentComponent.value = null;
    validationResult.value = { valid: true, errors: [], warnings: [] };
  };

  /**
   * 设置表单数据
   */
  const setFormData = (component: ServerDetailComponent) => {
    currentComponent.value = component;
    
    let position = { x: 0, y: 0, w: 6, h: 6 };
    let chartConfig = {};
    
    try {
      if (component.monitorSysGenServerDetailComponentPosition) {
        position = JSON.parse(component.monitorSysGenServerDetailComponentPosition);
      }
    } catch (e) {
      console.warn('解析组件位置失败:', e);
    }
    
    try {
      if (component.monitorSysGenServerDetailComponentChartConfig) {
        chartConfig = JSON.parse(component.monitorSysGenServerDetailComponentChartConfig);
      }
    } catch (e) {
      console.warn('解析图表配置失败:', e);
    }

    Object.assign(formData, {
      name: component.monitorSysGenServerDetailComponentName,
      title: component.monitorSysGenServerDetailComponentTitle,
      type: component.monitorSysGenServerDetailComponentType as ComponentType,
      dataSourceType: 'sql' as DataSourceType, // 默认值，可根据实际情况调整
      expressionType: component.monitorSysGenServerDetailComponentExpressionType as ExpressionType,
      expression: component.monitorSysGenServerDetailComponentExpression,
      description: component.monitorSysGenServerDetailComponentDesc || '',
      refreshInterval: component.monitorSysGenServerDetailComponentRefreshInterval || 30,
      enabled: component.monitorSysGenServerDetailComponentEnabled === 1,
      sortOrder: component.monitorSysGenServerDetailComponentSortOrder || 0,
      position,
      chartConfig
    });
  };

  /**
   * 获取组件模板
   */
  const getComponentTemplates = () => {
    // 这里可以从API获取模板，暂时返回默认模板
    const defaultTemplates: ComponentTemplate[] = [
      {
        id: 'cpu-usage-card',
        name: 'CPU使用率卡片',
        description: '显示服务器CPU使用率的卡片组件',
        type: 'card',
        category: '系统监控',
        tags: ['cpu', '监控', '卡片'],
        config: {
          name: 'cpu_usage',
          title: 'CPU使用率',
          type: 'card',
          dataSourceType: 'sql',
          expressionType: 'sql',
          expression: 'SELECT cpu_usage FROM server_metrics WHERE server_id = ${serverId} ORDER BY collect_time DESC LIMIT 1',
          refreshInterval: 30,
          enabled: true,
          sortOrder: 0,
          position: { x: 0, y: 0, w: 6, h: 4 },
          chartConfig: {
            card: {
              showIcon: true,
              icon: 'ri:cpu-line',
              iconColor: '#409eff',
              valueFormat: '0.1%',
              unit: '%'
            }
          }
        }
      }
    ];
    
    templates.value = defaultTemplates;
    return defaultTemplates;
  };

  return {
    // 状态
    loading,
    components,
    templates,
    currentComponent,
    formData,
    validationResult,
    
    // 计算属性
    hasComponents,
    enabledComponents,
    componentsByType,
    
    // 方法
    loadComponents,
    saveComponent,
    deleteComponent,
    updateComponentPositions,
    initDefaultComponents,
    validateComponent,
    resetForm,
    setFormData,
    getComponentTemplates
  };
}
