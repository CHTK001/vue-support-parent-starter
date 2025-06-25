/**
 * 布局管理组合式函数
 */

import { ref, reactive, computed, watch } from 'vue';
import { message } from '@repo/utils';
import type {
  LayoutItem,
  LayoutConfig,
  LayoutTemplate,
  LayoutHistory,
  LayoutEditorState,
  LayoutValidationResult,
  LayoutExportConfig,
  LayoutImportResult
} from '../types/layout';
import {
  getLayoutTemplates,
  saveLayoutTemplate,
  deleteLayoutTemplate,
  applyLayoutTemplate,
  saveServerLayout,
  getServerLayout
} from '@/api/monitor/gen/server';

export function useLayoutManager() {
  // 响应式状态
  const loading = ref(false);
  const layout = ref<LayoutItem[]>([]);
  const templates = ref<LayoutTemplate[]>([]);
  const currentTemplate = ref<LayoutTemplate | null>(null);
  
  // 编辑器状态
  const editorState = reactive<LayoutEditorState>({
    mode: 'view',
    selectedComponent: undefined,
    clipboard: [],
    history: [],
    historyIndex: -1,
    isDirty: false,
    isLoading: false,
    error: undefined
  });

  // 布局配置
  const layoutConfig = reactive<LayoutConfig>({
    layout: [],
    colNum: 24,
    rowHeight: 30,
    margin: [10, 10],
    containerPadding: [10, 10],
    isDraggable: true,
    isResizable: true,
    isMirrored: false,
    verticalCompact: true,
    useCSSTransforms: true,
    responsive: false
  });

  // 计算属性
  const hasLayout = computed(() => layout.value.length > 0);
  const canUndo = computed(() => editorState.historyIndex > 0);
  const canRedo = computed(() => editorState.historyIndex < editorState.history.length - 1);
  const isEditMode = computed(() => editorState.mode === 'edit');
  const selectedItem = computed(() => 
    layout.value.find(item => item.i === editorState.selectedComponent)
  );

  /**
   * 设置布局
   */
  const setLayout = (newLayout: LayoutItem[]) => {
    layout.value = [...newLayout];
    layoutConfig.layout = [...newLayout];
    addToHistory('update', newLayout);
  };

  /**
   * 添加组件到布局
   */
  const addComponent = (component: Partial<LayoutItem>) => {
    const newItem: LayoutItem = {
      i: component.i || `component_${Date.now()}`,
      x: component.x || 0,
      y: component.y || 0,
      w: component.w || 6,
      h: component.h || 6,
      ...component
    };

    // 查找合适的位置
    const position = findAvailablePosition(newItem.w, newItem.h);
    newItem.x = position.x;
    newItem.y = position.y;

    layout.value.push(newItem);
    addToHistory('add_component', layout.value, `添加组件: ${newItem.i}`);
    editorState.isDirty = true;
    
    return newItem;
  };

  /**
   * 删除组件
   */
  const removeComponent = (componentId: string) => {
    const index = layout.value.findIndex(item => item.i === componentId);
    if (index > -1) {
      const removedItem = layout.value.splice(index, 1)[0];
      addToHistory('remove_component', layout.value, `删除组件: ${componentId}`);
      editorState.isDirty = true;
      
      // 如果删除的是选中的组件，清除选择
      if (editorState.selectedComponent === componentId) {
        editorState.selectedComponent = undefined;
      }
      
      return removedItem;
    }
    return null;
  };

  /**
   * 更新组件
   */
  const updateComponent = (componentId: string, updates: Partial<LayoutItem>) => {
    const item = layout.value.find(item => item.i === componentId);
    if (item) {
      Object.assign(item, updates);
      addToHistory('update', layout.value, `更新组件: ${componentId}`);
      editorState.isDirty = true;
      return item;
    }
    return null;
  };

  /**
   * 查找可用位置
   */
  const findAvailablePosition = (width: number, height: number) => {
    const cols = layoutConfig.colNum;
    const occupied = new Set<string>();
    
    // 标记已占用的位置
    layout.value.forEach(item => {
      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = item.y; y < item.y + item.h; y++) {
          occupied.add(`${x},${y}`);
        }
      }
    });

    // 查找第一个可用位置
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= cols - width; x++) {
        let canPlace = true;
        
        for (let dx = 0; dx < width && canPlace; dx++) {
          for (let dy = 0; dy < height && canPlace; dy++) {
            if (occupied.has(`${x + dx},${y + dy}`)) {
              canPlace = false;
            }
          }
        }
        
        if (canPlace) {
          return { x, y };
        }
      }
    }
    
    return { x: 0, y: 0 };
  };

  /**
   * 添加到历史记录
   */
  const addToHistory = (action: string, layout: LayoutItem[], description?: string) => {
    const historyItem: LayoutHistory = {
      id: `history_${Date.now()}`,
      action: action as any,
      timestamp: Date.now(),
      layout: JSON.parse(JSON.stringify(layout)),
      description
    };

    // 清除当前位置之后的历史记录
    editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
    editorState.history.push(historyItem);
    editorState.historyIndex = editorState.history.length - 1;

    // 限制历史记录数量
    const maxHistory = 50;
    if (editorState.history.length > maxHistory) {
      editorState.history = editorState.history.slice(-maxHistory);
      editorState.historyIndex = editorState.history.length - 1;
    }
  };

  /**
   * 撤销操作
   */
  const undo = () => {
    if (canUndo.value) {
      editorState.historyIndex--;
      const historyItem = editorState.history[editorState.historyIndex];
      layout.value = JSON.parse(JSON.stringify(historyItem.layout));
      editorState.isDirty = true;
    }
  };

  /**
   * 重做操作
   */
  const redo = () => {
    if (canRedo.value) {
      editorState.historyIndex++;
      const historyItem = editorState.history[editorState.historyIndex];
      layout.value = JSON.parse(JSON.stringify(historyItem.layout));
      editorState.isDirty = true;
    }
  };

  /**
   * 复制组件
   */
  const copyComponent = (componentId: string) => {
    const item = layout.value.find(item => item.i === componentId);
    if (item) {
      editorState.clipboard = [JSON.parse(JSON.stringify(item))];
      message.success('组件已复制');
    }
  };

  /**
   * 粘贴组件
   */
  const pasteComponent = () => {
    if (editorState.clipboard.length > 0) {
      const item = JSON.parse(JSON.stringify(editorState.clipboard[0]));
      item.i = `${item.i}_copy_${Date.now()}`;
      
      // 查找新位置
      const position = findAvailablePosition(item.w, item.h);
      item.x = position.x;
      item.y = position.y;
      
      addComponent(item);
      message.success('组件已粘贴');
    }
  };

  /**
   * 验证布局
   */
  const validateLayout = (): LayoutValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 检查重叠
    const overlaps = findOverlaps();
    if (overlaps.length > 0) {
      errors.push(`发现 ${overlaps.length} 个组件重叠`);
    }

    // 检查超出边界
    const outOfBounds = layout.value.filter(item => 
      item.x + item.w > layoutConfig.colNum || item.x < 0 || item.y < 0
    );
    if (outOfBounds.length > 0) {
      errors.push(`${outOfBounds.length} 个组件超出布局边界`);
    }

    // 检查组件数量
    if (layout.value.length === 0) {
      warnings.push('布局中没有组件');
    } else if (layout.value.length > 20) {
      warnings.push('组件数量较多，可能影响性能');
    }

    // 布局密度建议
    const density = calculateLayoutDensity();
    if (density > 0.8) {
      suggestions.push('布局较为密集，建议适当增加间距');
    } else if (density < 0.3) {
      suggestions.push('布局较为稀疏，可以考虑调整组件大小');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  };

  /**
   * 查找重叠的组件
   */
  const findOverlaps = () => {
    const overlaps: Array<{ item1: LayoutItem; item2: LayoutItem }> = [];
    
    for (let i = 0; i < layout.value.length; i++) {
      for (let j = i + 1; j < layout.value.length; j++) {
        const item1 = layout.value[i];
        const item2 = layout.value[j];
        
        if (isOverlapping(item1, item2)) {
          overlaps.push({ item1, item2 });
        }
      }
    }
    
    return overlaps;
  };

  /**
   * 检查两个组件是否重叠
   */
  const isOverlapping = (item1: LayoutItem, item2: LayoutItem) => {
    return !(
      item1.x + item1.w <= item2.x ||
      item2.x + item2.w <= item1.x ||
      item1.y + item1.h <= item2.y ||
      item2.y + item2.h <= item1.y
    );
  };

  /**
   * 计算布局密度
   */
  const calculateLayoutDensity = () => {
    if (layout.value.length === 0) return 0;
    
    const totalArea = layout.value.reduce((sum, item) => sum + item.w * item.h, 0);
    const maxY = Math.max(...layout.value.map(item => item.y + item.h));
    const containerArea = layoutConfig.colNum * maxY;
    
    return containerArea > 0 ? totalArea / containerArea : 0;
  };

  /**
   * 重置布局
   */
  const resetLayout = () => {
    layout.value = [];
    editorState.selectedComponent = undefined;
    editorState.isDirty = false;
    addToHistory('reset', [], '重置布局');
  };

  /**
   * 设置编辑模式
   */
  const setEditMode = (mode: 'view' | 'edit' | 'preview') => {
    editorState.mode = mode;
    if (mode !== 'edit') {
      editorState.selectedComponent = undefined;
    }
  };

  /**
   * 选择组件
   */
  const selectComponent = (componentId?: string) => {
    editorState.selectedComponent = componentId;
  };

  /**
   * 保存布局
   */
  const saveLayout = async (serverId?: number) => {
    try {
      loading.value = true;

      // 验证布局
      const validation = validateLayout();
      if (!validation.valid) {
        message.error('布局验证失败：' + validation.errors.join(', '));
        return false;
      }

      if (serverId) {
        const res = await saveServerLayout(serverId, layout.value);
        if (res.code === '00000') {
          editorState.isDirty = false;
          message.success('布局保存成功');
          return true;
        } else {
          message.error(res.msg || '保存布局失败');
          return false;
        }
      } else {
        editorState.isDirty = false;
        message.success('布局保存成功');
        return true;
      }
    } catch (error) {
      console.error('保存布局失败:', error);
      message.error('保存布局失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载服务器布局
   */
  const loadServerLayout = async (serverId: number) => {
    try {
      loading.value = true;
      const res = await getServerLayout(serverId);

      if (res.code === '00000' && res.data) {
        layout.value = res.data;
        layoutConfig.layout = res.data;
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('加载布局失败:', error);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载布局模板列表
   */
  const loadTemplates = async (category?: string) => {
    try {
      loading.value = true;
      const res = await getLayoutTemplates(category);

      if (res.code === '00000') {
        templates.value = res.data || [];
        return res.data;
      } else {
        message.error(res.msg || '加载模板失败');
        return [];
      }
    } catch (error) {
      console.error('加载模板失败:', error);
      message.error('加载模板失败');
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 保存布局模板
   */
  const saveTemplate = async (template: Partial<LayoutTemplate>) => {
    try {
      loading.value = true;

      const templateData: LayoutTemplate = {
        id: template.id || `template_${Date.now()}`,
        name: template.name || '未命名模板',
        description: template.description,
        category: template.category || 'custom',
        tags: template.tags || [],
        createTime: template.createTime || new Date().toISOString(),
        updateTime: new Date().toISOString(),
        version: template.version || '1.0.0',
        author: template.author,
        isDefault: template.isDefault || false,
        isPublic: template.isPublic || false,
        config: {
          ...layoutConfig,
          layout: [...layout.value]
        },
        components: layout.value.map(item => ({
          id: item.i,
          name: item.i,
          title: item.title || item.i,
          type: item.componentType || 'card',
          position: { x: item.x, y: item.y, w: item.w, h: item.h },
          config: item.config || {}
        }))
      };

      const res = await saveLayoutTemplate(templateData);

      if (res.code === '00000') {
        message.success('模板保存成功');
        await loadTemplates();
        return res.data;
      } else {
        message.error(res.msg || '保存模板失败');
        return null;
      }
    } catch (error) {
      console.error('保存模板失败:', error);
      message.error('保存模板失败');
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除布局模板
   */
  const deleteTemplate = async (templateId: string) => {
    try {
      loading.value = true;
      const res = await deleteLayoutTemplate(templateId);

      if (res.code === '00000') {
        message.success('模板删除成功');
        await loadTemplates();
        return true;
      } else {
        message.error(res.msg || '删除模板失败');
        return false;
      }
    } catch (error) {
      console.error('删除模板失败:', error);
      message.error('删除模板失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 应用布局模板
   */
  const applyTemplate = async (template: LayoutTemplate, serverId?: number) => {
    try {
      loading.value = true;

      // 设置布局
      setLayout(template.config.layout);

      // 如果提供了服务器ID，应用到服务器
      if (serverId) {
        const res = await applyLayoutTemplate(serverId, template.id);
        if (res.code === '00000') {
          message.success('模板应用成功');
          return true;
        } else {
          message.error(res.msg || '应用模板失败');
          return false;
        }
      } else {
        message.success('模板应用成功');
        return true;
      }
    } catch (error) {
      console.error('应用模板失败:', error);
      message.error('应用模板失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 导出布局模板
   */
  const exportTemplate = (template: LayoutTemplate, format: 'json' | 'yaml' = 'json') => {
    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === 'yaml') {
        // 简单的YAML格式化（实际项目中建议使用专门的YAML库）
        content = JSON.stringify(template, null, 2)
          .replace(/"/g, '')
          .replace(/,/g, '')
          .replace(/\{/g, '')
          .replace(/\}/g, '');
        mimeType = 'text/yaml';
        extension = 'yaml';
      } else {
        content = JSON.stringify(template, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name}_layout_template.${extension}`;
      link.click();

      URL.revokeObjectURL(url);
      message.success('模板导出成功');
      return true;
    } catch (error) {
      console.error('导出模板失败:', error);
      message.error('导出模板失败');
      return false;
    }
  };

  /**
   * 导入布局模板
   */
  const importTemplate = (file: File): Promise<LayoutImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          let template: LayoutTemplate;

          // 尝试解析JSON
          try {
            template = JSON.parse(content);
          } catch {
            // 如果JSON解析失败，尝试作为YAML处理（简化处理）
            resolve({
              success: false,
              message: '暂不支持YAML格式，请使用JSON格式',
              errors: ['文件格式不支持']
            });
            return;
          }

          // 验证模板格式
          if (!template.id || !template.name || !template.config) {
            resolve({
              success: false,
              message: '模板格式不正确',
              errors: ['缺少必要字段：id、name、config']
            });
            return;
          }

          // 生成新ID避免冲突
          template.id = `imported_${Date.now()}`;
          template.createTime = new Date().toISOString();
          template.updateTime = new Date().toISOString();

          // 保存模板
          const result = await saveTemplate(template);

          if (result) {
            resolve({
              success: true,
              message: '模板导入成功',
              layout: template
            });
          } else {
            resolve({
              success: false,
              message: '模板保存失败',
              errors: ['保存到服务器失败']
            });
          }
        } catch (error) {
          resolve({
            success: false,
            message: '模板导入失败',
            errors: [error.message]
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: '文件读取失败',
          errors: ['无法读取文件内容']
        });
      };

      reader.readAsText(file);
    });
  };

  /**
   * 复制模板
   */
  const duplicateTemplate = async (template: LayoutTemplate) => {
    const newTemplate: LayoutTemplate = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      name: `${template.name} (副本)`,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      isDefault: false,
      isPublic: false
    };

    return await saveTemplate(newTemplate);
  };

  return {
    // 状态
    loading,
    layout,
    templates,
    currentTemplate,
    editorState,
    layoutConfig,

    // 计算属性
    hasLayout,
    canUndo,
    canRedo,
    isEditMode,
    selectedItem,

    // 基础方法
    setLayout,
    addComponent,
    removeComponent,
    updateComponent,
    findAvailablePosition,
    undo,
    redo,
    copyComponent,
    pasteComponent,
    validateLayout,
    resetLayout,
    setEditMode,
    selectComponent,

    // 布局管理方法
    saveLayout,
    loadServerLayout,

    // 模板管理方法
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    applyTemplate,
    exportTemplate,
    importTemplate,
    duplicateTemplate
  };
}
