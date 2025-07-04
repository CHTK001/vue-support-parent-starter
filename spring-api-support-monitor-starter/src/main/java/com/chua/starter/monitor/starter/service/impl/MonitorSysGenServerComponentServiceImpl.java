package com.chua.starter.monitor.starter.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.common.support.json.Json;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.common.support.utils.StringUtils;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerComponent;
import com.chua.starter.monitor.starter.mapper.MonitorSysGenServerComponentMapper;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerComponentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * 服务器组件配置服务实现类
 *
 * @author CH
 * @since 2025/01/03
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MonitorSysGenServerComponentServiceImpl 
        extends ServiceImpl<MonitorSysGenServerComponentMapper, MonitorSysGenServerComponent>
        implements MonitorSysGenServerComponentService {

    @Override
    public ReturnResult<List<MonitorSysGenServerComponent>> getComponentsByServerId(Integer serverId) {
        if (serverId == null) {
            return ReturnResult.error("服务器ID不能为空");
        }

        try {
            List<MonitorSysGenServerComponent> components = baseMapper.selectByServerId(serverId);
            return ReturnResult.ok(components);
        } catch (Exception e) {
            log.error("获取服务器组件列表失败: serverId={}", serverId, e);
            return ReturnResult.error("获取组件列表失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> initFixedComponents(Integer serverId) {
        if (serverId == null) {
            return ReturnResult.error("服务器ID不能为空");
        }

        try {
            // 检查是否已经初始化过固定组件
            LambdaQueryWrapper<MonitorSysGenServerComponent> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(MonitorSysGenServerComponent::getMonitorSysGenServerId, serverId)
                       .eq(MonitorSysGenServerComponent::getMonitorSysGenServerComponentFixed, 1);
            
            List<MonitorSysGenServerComponent> existingComponents = this.list(queryWrapper);
            if (!existingComponents.isEmpty()) {
                log.info("服务器固定组件已存在，跳过初始化: serverId={}", serverId);
                return ReturnResult.ok(true);
            }

            // 创建5个固定组件
            List<MonitorSysGenServerComponent> fixedComponents = createFixedComponents(serverId);
            
            // 批量保存
            boolean result = this.saveBatch(fixedComponents);
            
            if (result) {
                log.info("服务器固定组件初始化成功: serverId={}, count={}", serverId, fixedComponents.size());
                return ReturnResult.ok(true);
            } else {
                return ReturnResult.error("保存固定组件失败");
            }
        } catch (Exception e) {
            log.error("初始化服务器固定组件失败: serverId={}", serverId, e);
            return ReturnResult.error("初始化固定组件失败: " + e.getMessage());
        }
    }

    /**
     * 创建固定组件列表
     */
    private List<MonitorSysGenServerComponent> createFixedComponents(Integer serverId) {
        List<MonitorSysGenServerComponent> components = new ArrayList<>();
        
        // CPU使用率组件
        components.add(createFixedComponent(serverId, "CPU使用率", "cpu", 
            createPosition(0, 0, 6, 8), createCpuConfig(), 1));
        
        // 内存使用率组件
        components.add(createFixedComponent(serverId, "内存使用率", "memory", 
            createPosition(6, 0, 6, 8), createMemoryConfig(), 2));
        
        // 磁盘使用情况组件
        components.add(createFixedComponent(serverId, "磁盘使用情况", "disk", 
            createPosition(12, 0, 6, 8), createDiskConfig(), 3));
        
        // 网络流量组件
        components.add(createFixedComponent(serverId, "网络流量", "network", 
            createPosition(18, 0, 6, 8), createNetworkConfig(), 4));
        
        // 系统信息组件
        components.add(createFixedComponent(serverId, "系统信息", "system", 
            createPosition(0, 8, 12, 8), createSystemConfig(), 5));
        
        return components;
    }

    /**
     * 创建固定组件
     */
    private MonitorSysGenServerComponent createFixedComponent(Integer serverId, String name, String type, 
                                                            String position, String config, Integer sort) {
        MonitorSysGenServerComponent component = new MonitorSysGenServerComponent();
        component.setMonitorSysGenServerId(serverId);
        component.setMonitorSysGenServerComponentName(name);
        component.setMonitorSysGenServerComponentType(type);
        component.setMonitorSysGenServerComponentPosition(position);
        component.setMonitorSysGenServerComponentConfig(config);
        component.setMonitorSysGenServerComponentFixed(1);
        component.setMonitorSysGenServerComponentStatus(1);
        component.setMonitorSysGenServerComponentShared(0);
        component.setMonitorSysGenServerComponentRefreshInterval(5);
        component.setMonitorSysGenServerComponentSort(sort);
        component.setMonitorSysGenServerComponentDescription("系统固定组件");
        return component;
    }

    /**
     * 创建位置配置
     */
    private String createPosition(int x, int y, int w, int h) {
        Map<String, Object> position = new HashMap<>();
        position.put("x", x);
        position.put("y", y);
        position.put("w", w);
        position.put("h", h);
        position.put("i", String.format("%d_%d_%d_%d", x, y, w, h));
        return Json.toJson(position);
    }

    /**
     * 创建CPU组件配置
     */
    private String createCpuConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("chartType", "gauge");
        config.put("title", "CPU使用率");
        config.put("unit", "%");
        config.put("thresholds", Map.of(
            "normal", 70,
            "warning", 85,
            "critical", 95
        ));
        return Json.toJson(config);
    }

    /**
     * 创建内存组件配置
     */
    private String createMemoryConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("chartType", "gauge");
        config.put("title", "内存使用率");
        config.put("unit", "%");
        config.put("thresholds", Map.of(
            "normal", 70,
            "warning", 85,
            "critical", 95
        ));
        return Json.toJson(config);
    }

    /**
     * 创建磁盘组件配置
     */
    private String createDiskConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("chartType", "list");
        config.put("title", "磁盘使用情况");
        config.put("showPartitions", true);
        config.put("maxHeight", 400);
        return Json.toJson(config);
    }

    /**
     * 创建网络组件配置
     */
    private String createNetworkConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("chartType", "line");
        config.put("title", "网络流量");
        config.put("unit", "MB/s");
        config.put("showInOut", true);
        return Json.toJson(config);
    }

    /**
     * 创建系统信息组件配置
     */
    private String createSystemConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("chartType", "info");
        config.put("title", "系统信息");
        config.put("showFields", List.of("osName", "osVersion", "hostname", "uptime", "loadAverage", "processCount"));
        return Json.toJson(config);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<MonitorSysGenServerComponent> saveComponent(MonitorSysGenServerComponent component) {
        if (component == null) {
            return ReturnResult.error("组件配置不能为空");
        }

        try {
            // 设置默认值
            if (component.getMonitorSysGenServerComponentStatus() == null) {
                component.setMonitorSysGenServerComponentStatus(1);
            }
            if (component.getMonitorSysGenServerComponentShared() == null) {
                component.setMonitorSysGenServerComponentShared(0);
            }
            if (component.getMonitorSysGenServerComponentFixed() == null) {
                component.setMonitorSysGenServerComponentFixed(0);
            }
            if (component.getMonitorSysGenServerComponentRefreshInterval() == null) {
                component.setMonitorSysGenServerComponentRefreshInterval(5);
            }

            boolean result = this.saveOrUpdate(component);
            if (result) {
                log.info("保存组件配置成功: componentId={}", component.getMonitorSysGenServerComponentId());
                return ReturnResult.ok(component);
            } else {
                return ReturnResult.error("保存组件配置失败");
            }
        } catch (Exception e) {
            log.error("保存组件配置失败: component={}", component, e);
            return ReturnResult.error("保存组件配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> deleteComponent(Integer componentId) {
        if (componentId == null) {
            return ReturnResult.error("组件ID不能为空");
        }

        try {
            // 检查组件是否存在
            MonitorSysGenServerComponent component = this.getById(componentId);
            if (component == null) {
                return ReturnResult.error("组件不存在");
            }

            // 检查是否为固定组件
            if (component.getMonitorSysGenServerComponentFixed() != null && 
                component.getMonitorSysGenServerComponentFixed() == 1) {
                return ReturnResult.error("固定组件不能删除");
            }

            boolean result = this.removeById(componentId);
            if (result) {
                log.info("删除组件配置成功: componentId={}", componentId);
                return ReturnResult.ok(true);
            } else {
                return ReturnResult.error("删除组件配置失败");
            }
        } catch (Exception e) {
            log.error("删除组件配置失败: componentId={}", componentId, e);
            return ReturnResult.error("删除组件配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> updateComponentPositions(Integer serverId, List<MonitorSysGenServerComponent> components) {
        if (serverId == null || components == null || components.isEmpty()) {
            return ReturnResult.error("参数不能为空");
        }

        try {
            // 验证所有组件都属于指定服务器
            for (MonitorSysGenServerComponent component : components) {
                if (!serverId.equals(component.getMonitorSysGenServerId())) {
                    return ReturnResult.error("组件不属于指定服务器");
                }
            }

            // 批量更新位置信息
            int updateCount = baseMapper.batchUpdatePosition(components);

            log.info("批量更新组件位置成功: serverId={}, updateCount={}", serverId, updateCount);
            return ReturnResult.ok(true);
        } catch (Exception e) {
            log.error("批量更新组件位置失败: serverId={}", serverId, e);
            return ReturnResult.error("更新组件位置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenServerComponent>> getSharedComponents() {
        try {
            List<MonitorSysGenServerComponent> sharedComponents = baseMapper.selectSharedComponents();
            return ReturnResult.ok(sharedComponents);
        } catch (Exception e) {
            log.error("获取共享组件列表失败", e);
            return ReturnResult.error("获取共享组件列表失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> shareComponent(Integer componentId) {
        if (componentId == null) {
            return ReturnResult.error("组件ID不能为空");
        }

        try {
            MonitorSysGenServerComponent component = this.getById(componentId);
            if (component == null) {
                return ReturnResult.error("组件不存在");
            }

            component.setMonitorSysGenServerComponentShared(1);
            boolean result = this.updateById(component);

            if (result) {
                log.info("设置组件共享成功: componentId={}", componentId);
                return ReturnResult.ok(true);
            } else {
                return ReturnResult.error("设置组件共享失败");
            }
        } catch (Exception e) {
            log.error("设置组件共享失败: componentId={}", componentId, e);
            return ReturnResult.error("设置组件共享失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<MonitorSysGenServerComponent> copySharedComponent(Integer serverId, Integer sourceComponentId) {
        if (serverId == null || sourceComponentId == null) {
            return ReturnResult.error("参数不能为空");
        }

        try {
            // 获取源组件
            MonitorSysGenServerComponent sourceComponent = this.getById(sourceComponentId);
            if (sourceComponent == null) {
                return ReturnResult.error("源组件不存在");
            }

            if (sourceComponent.getMonitorSysGenServerComponentShared() == null ||
                sourceComponent.getMonitorSysGenServerComponentShared() != 1) {
                return ReturnResult.error("源组件不是共享组件");
            }

            // 创建新组件
            MonitorSysGenServerComponent newComponent = new MonitorSysGenServerComponent();
            newComponent.setMonitorSysGenServerId(serverId);
            newComponent.setMonitorSysGenServerComponentName(sourceComponent.getMonitorSysGenServerComponentName());
            newComponent.setMonitorSysGenServerComponentType(sourceComponent.getMonitorSysGenServerComponentType());
            newComponent.setMonitorSysGenServerComponentConfig(sourceComponent.getMonitorSysGenServerComponentConfig());
            newComponent.setMonitorSysGenServerComponentShared(0); // 复制的组件不是共享组件
            newComponent.setMonitorSysGenServerComponentSourceServerId(sourceComponent.getMonitorSysGenServerId());
            newComponent.setMonitorSysGenServerComponentRefreshInterval(sourceComponent.getMonitorSysGenServerComponentRefreshInterval());
            newComponent.setMonitorSysGenServerComponentStatus(1);
            newComponent.setMonitorSysGenServerComponentFixed(0);
            newComponent.setMonitorSysGenServerComponentDescription("从共享组件复制");

            // 生成新的位置信息
            String newPosition = generateNewPosition(serverId);
            newComponent.setMonitorSysGenServerComponentPosition(newPosition);

            boolean result = this.save(newComponent);
            if (result) {
                log.info("复制共享组件成功: sourceComponentId={}, newComponentId={}",
                        sourceComponentId, newComponent.getMonitorSysGenServerComponentId());
                return ReturnResult.ok(newComponent);
            } else {
                return ReturnResult.error("复制共享组件失败");
            }
        } catch (Exception e) {
            log.error("复制共享组件失败: serverId={}, sourceComponentId={}", serverId, sourceComponentId, e);
            return ReturnResult.error("复制共享组件失败: " + e.getMessage());
        }
    }

    /**
     * 生成新的位置信息
     */
    private String generateNewPosition(Integer serverId) {
        // 获取服务器现有组件的位置信息，找到空闲位置
        List<MonitorSysGenServerComponent> existingComponents = baseMapper.selectByServerId(serverId);

        // 简单实现：在最后一行添加新组件
        int maxY = 0;
        for (MonitorSysGenServerComponent component : existingComponents) {
            if (StringUtils.isNotEmpty(component.getMonitorSysGenServerComponentPosition())) {
                try {
                    Map<String, Object> position = Json.fromJson(component.getMonitorSysGenServerComponentPosition(), Map.class);
                    Integer y = (Integer) position.get("y");
                    Integer h = (Integer) position.get("h");
                    if (y != null && h != null) {
                        maxY = Math.max(maxY, y + h);
                    }
                } catch (Exception e) {
                    log.warn("解析组件位置信息失败: {}", component.getMonitorSysGenServerComponentPosition());
                }
            }
        }

        return createPosition(0, maxY, 12, 8);
    }

    @Override
    public ReturnResult<MonitorSysGenServerComponent> getComponentById(Integer componentId) {
        if (componentId == null) {
            return ReturnResult.error("组件ID不能为空");
        }

        try {
            MonitorSysGenServerComponent component = this.getById(componentId);
            if (component == null) {
                return ReturnResult.error("组件不存在");
            }
            return ReturnResult.ok(component);
        } catch (Exception e) {
            log.error("获取组件详情失败: componentId={}", componentId, e);
            return ReturnResult.error("获取组件详情失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> updateComponent(MonitorSysGenServerComponent component) {
        if (component == null || component.getMonitorSysGenServerComponentId() == null) {
            return ReturnResult.error("组件配置不能为空");
        }

        try {
            boolean result = this.updateById(component);
            if (result) {
                log.info("更新组件配置成功: componentId={}", component.getMonitorSysGenServerComponentId());
                return ReturnResult.ok(true);
            } else {
                return ReturnResult.error("更新组件配置失败");
            }
        } catch (Exception e) {
            log.error("更新组件配置失败: component={}", component, e);
            return ReturnResult.error("更新组件配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenServerComponent>> getComponentsByType(String componentType) {
        if (StringUtils.isEmpty(componentType)) {
            return ReturnResult.error("组件类型不能为空");
        }

        try {
            List<MonitorSysGenServerComponent> components = baseMapper.selectByComponentType(componentType);
            return ReturnResult.ok(components);
        } catch (Exception e) {
            log.error("根据类型获取组件列表失败: componentType={}", componentType, e);
            return ReturnResult.error("获取组件列表失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> canDeleteComponent(Integer componentId) {
        if (componentId == null) {
            return ReturnResult.error("组件ID不能为空");
        }

        try {
            MonitorSysGenServerComponent component = this.getById(componentId);
            if (component == null) {
                return ReturnResult.error("组件不存在");
            }

            // 固定组件不能删除
            if (component.getMonitorSysGenServerComponentFixed() != null &&
                component.getMonitorSysGenServerComponentFixed() == 1) {
                return ReturnResult.ok(false);
            }

            return ReturnResult.ok(true);
        } catch (Exception e) {
            log.error("检查组件是否可删除失败: componentId={}", componentId, e);
            return ReturnResult.error("检查失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<String> getServerLayout(Integer serverId) {
        if (serverId == null) {
            return ReturnResult.error("服务器ID不能为空");
        }

        try {
            List<MonitorSysGenServerComponent> components = baseMapper.selectByServerId(serverId);

            // 构建布局配置
            List<Map<String, Object>> layout = new ArrayList<>();
            for (MonitorSysGenServerComponent component : components) {
                if (StringUtils.isNotEmpty(component.getMonitorSysGenServerComponentPosition())) {
                    try {
                        Map<String, Object> position = Json.fromJson(component.getMonitorSysGenServerComponentPosition(), Map.class);
                        position.put("componentId", component.getMonitorSysGenServerComponentId());
                        position.put("type", component.getMonitorSysGenServerComponentType());
                        position.put("name", component.getMonitorSysGenServerComponentName());
                        layout.add(position);
                    } catch (Exception e) {
                        log.warn("解析组件位置信息失败: componentId={}", component.getMonitorSysGenServerComponentId());
                    }
                }
            }

            return ReturnResult.ok(Json.toJson(layout));
        } catch (Exception e) {
            log.error("获取服务器布局配置失败: serverId={}", serverId, e);
            return ReturnResult.error("获取布局配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> saveServerLayout(Integer serverId, String layoutConfig) {
        if (serverId == null || StringUtils.isEmpty(layoutConfig)) {
            return ReturnResult.error("参数不能为空");
        }

        try {
            // 解析布局配置
            List<Map<String, Object>> layout = Json.fromJson(layoutConfig, List.class);

            // 更新组件位置信息
            for (Map<String, Object> item : layout) {
                Integer componentId = (Integer) item.get("componentId");
                if (componentId != null) {
                    MonitorSysGenServerComponent component = this.getById(componentId);
                    if (component != null && serverId.equals(component.getMonitorSysGenServerId())) {
                        // 移除componentId等非位置信息
                        Map<String, Object> position = new HashMap<>(item);
                        position.remove("componentId");
                        position.remove("type");
                        position.remove("name");

                        component.setMonitorSysGenServerComponentPosition(Json.toJson(position));
                        this.updateById(component);
                    }
                }
            }

            log.info("保存服务器布局配置成功: serverId={}", serverId);
            return ReturnResult.ok(true);
        } catch (Exception e) {
            log.error("保存服务器布局配置失败: serverId={}", serverId, e);
            return ReturnResult.error("保存布局配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Object> getComponentData(Integer componentId, Long startTime, Long endTime, Integer step) {
        log.debug("开始查询组件数据, componentId: {}, startTime: {}, endTime: {}, step: {}",
            componentId, startTime, endTime, step);

        if (componentId == null) {
            log.warn("查询组件数据失败, 组件ID为空");
            return ReturnResult.error("组件ID不能为空");
        }

        try {
            MonitorSysGenServerComponent component = getById(componentId);
            if (component == null) {
                log.warn("查询组件数据失败, 组件不存在, componentId: {}", componentId);
                return ReturnResult.error("组件不存在");
            }

            // 设置默认时间范围（最近30分钟）
            if (startTime == null || endTime == null) {
                long now = System.currentTimeMillis() / 1000;
                endTime = endTime != null ? endTime : now;
                startTime = startTime != null ? startTime : (now - 30 * 60);
            }

            // 根据组件的表达式类型调用不同的查询服务
            String expressionType = component.getMonitorSysGenServerComponentExpressionType();
            String expression = component.getMonitorSysGenServerComponentExpression();

            Map<String, Object> timeRange = Map.of(
                "startTime", startTime,
                "endTime", endTime,
                "step", step != null ? step : 60
            );

            if ("PROMETHEUS".equalsIgnoreCase(expressionType)) {
                return executePrometheusQuery(component.getMonitorSysGenServerId(), expression, timeRange);
            } else if ("SQL".equalsIgnoreCase(expressionType)) {
                return executeSqlQuery(component.getMonitorSysGenServerId(), expression, timeRange);
            } else {
                // 组件选择类型，返回模拟数据
                log.debug("查询组件数据成功, componentId: {}, 类型: 组件选择", componentId);
                return ReturnResult.ok(Map.of(
                    "type", "component",
                    "componentId", componentId,
                    "data", generateMockData(startTime, endTime, step != null ? step : 60),
                    "timeRange", timeRange
                ));
            }
        } catch (Exception e) {
            log.error("查询组件数据失败, componentId: {}", componentId, e);
            return ReturnResult.error("查询组件数据失败: " + e.getMessage());
        }
    }

    /**
     * 生成模拟数据
     */
    private Object generateMockData(Long startTime, Long endTime, Integer step) {
        List<Map<String, Object>> data = new ArrayList<>();
        long current = startTime;
        Random random = new Random();

        while (current <= endTime) {
            Map<String, Object> point = new HashMap<>();
            point.put("timestamp", current);
            point.put("value", 50 + random.nextDouble() * 50); // 50-100之间的随机值
            data.add(point);
            current += step;
        }

        return data;
    }
}
