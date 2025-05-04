// 初始化网格
const initGrid = async (): Promise<void> => {
  if (gridTool) return;
  
  try {
    // 延迟加载 L
    if (!L) {
      L = (await import('leaflet')).default;
    }
    
    // 创建网格工具，使用符合国标的配置
    gridTool = new Grid(mapInstance.value, {
      // 遵循《地球空间网格编码规则》(GB/T 40087-2021)标准
      level: 3,
      color: '#3388ff',
      weight: 1,
      opacity: 0.6,
      fillColor: '#3388ff',
      fillOpacity: 0.1,
      showCode: true,
      codeColor: '#333',
      codeSize: 12,
      interactive: true,
      gridType: 'rect' // 默认使用矩形网格
    });
    
    addLog('网格工具初始化成功');
    info('网格工具初始化成功');
  } catch (e) {
    error('网格工具初始化失败:', e);
    addLog('网格工具初始化失败', e);
  }
};

// 启用网格显示
const enableGrid = async (): Promise<void> => {
  if (!mapInstance.value) return;
  
  try {
    // 确保网格工具已初始化
    if (!gridTool) {
      await initGrid();
    }
    
    // 显示网格
    if (gridTool) {
      gridTool.show();
      addLog('网格已启用');
      info('网格已启用');
    }
  } catch (e) {
    error('启用网格失败:', e);
    addLog('启用网格失败', e);
  }
};

// 禁用网格显示
const disableGrid = (): void => {
  if (!gridTool) return;
  
  try {
    // 隐藏网格
    gridTool.hide();
    addLog('网格已禁用');
    info('网格已禁用');
  } catch (e) {
    error('禁用网格失败:', e);
    addLog('禁用网格失败', e);
  }
};

// 切换网格类型（矩形/蜂窝）
const toggleGridType = (): void => {
  if (!gridTool) return;
  
  try {
    const currentType = gridTool.getType();
    const newType = currentType === 'rect' ? 'hex' : 'rect';
    gridTool.setType(newType);
    addLog(`网格类型已切换为: ${newType}`);
    info(`网格类型已切换为: ${newType}`);
  } catch (e) {
    error('切换网格类型失败:', e);
    addLog('切换网格类型失败', e);
  }
};

// 设置网格级别
const setGridLevel = (level: number): void => {
  if (!gridTool) return;
  
  try {
    gridTool.setLevel(level);
    addLog(`网格级别已设置为: ${level}`);
    info(`网格级别已设置为: ${level}`);
  } catch (e) {
    error('设置网格级别失败:', e);
    addLog('设置网格级别失败', e);
  }
}; 