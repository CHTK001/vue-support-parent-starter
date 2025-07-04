package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerComponent;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerComponentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 服务器组件配置控制器
 *
 * @author CH
 * @since 2025/01/03
 */
@RestController
@RequestMapping("v1/gen/server/component")
@Tag(name = "服务器组件管理")
@RequiredArgsConstructor
@Slf4j
public class MonitorSysGenServerComponentController {

    private final MonitorSysGenServerComponentService componentService;

    /**
     * 根据服务器ID获取组件列表
     *
     * @param serverId 服务器ID
     * @return 组件列表
     */
    @GetMapping("/list/{serverId}")
    @Operation(summary = "获取服务器组件列表")
    public ReturnResult<List<MonitorSysGenServerComponent>> getComponentsByServerId(
            @Parameter(description = "服务器ID") @PathVariable Integer serverId) {
        return componentService.getComponentsByServerId(serverId);
    }

    /**
     * 初始化服务器固定组件
     *
     * @param serverId 服务器ID
     * @return 操作结果
     */
    @PostMapping("/init/{serverId}")
    @Operation(summary = "初始化服务器固定组件")
    public ReturnResult<Boolean> initFixedComponents(
            @Parameter(description = "服务器ID") @PathVariable Integer serverId) {
        return componentService.initFixedComponents(serverId);
    }

    /**
     * 创建组件配置
     *
     * @param component 组件配置
     * @return 操作结果
     */
    @PostMapping
    @Operation(summary = "创建组件配置")
    public ReturnResult<MonitorSysGenServerComponent> createComponent(
            @RequestBody MonitorSysGenServerComponent component) {
        return componentService.saveComponent(component);
    }

    /**
     * 更新组件配置
     *
     * @param componentId 组件ID
     * @param component 组件配置
     * @return 操作结果
     */
    @PutMapping("/{componentId}")
    @Operation(summary = "更新组件配置")
    public ReturnResult<Boolean> updateComponent(
            @Parameter(description = "组件ID") @PathVariable Integer componentId,
            @RequestBody MonitorSysGenServerComponent component) {
        component.setMonitorSysGenServerComponentId(componentId);
        return componentService.updateComponent(component);
    }

    /**
     * 删除组件配置
     *
     * @param componentId 组件ID
     * @return 操作结果
     */
    @DeleteMapping("/{componentId}")
    @Operation(summary = "删除组件配置")
    public ReturnResult<Boolean> deleteComponent(
            @Parameter(description = "组件ID") @PathVariable Integer componentId) {
        return componentService.deleteComponent(componentId);
    }

    /**
     * 获取组件详情
     *
     * @param componentId 组件ID
     * @return 组件详情
     */
    @GetMapping("/{componentId}")
    @Operation(summary = "获取组件详情")
    public ReturnResult<MonitorSysGenServerComponent> getComponentById(
            @Parameter(description = "组件ID") @PathVariable Integer componentId) {
        return componentService.getComponentById(componentId);
    }

    /**
     * 批量更新组件位置
     *
     * @param serverId 服务器ID
     * @param components 组件列表
     * @return 操作结果
     */
    @PutMapping("/positions/{serverId}")
    @Operation(summary = "批量更新组件位置")
    public ReturnResult<Boolean> updateComponentPositions(
            @Parameter(description = "服务器ID") @PathVariable Integer serverId,
            @RequestBody List<MonitorSysGenServerComponent> components) {
        return componentService.updateComponentPositions(serverId, components);
    }

    /**
     * 获取共享组件列表
     *
     * @return 共享组件列表
     */
    @GetMapping("/shared")
    @Operation(summary = "获取共享组件列表")
    public ReturnResult<List<MonitorSysGenServerComponent>> getSharedComponents() {
        return componentService.getSharedComponents();
    }

    /**
     * 设置组件为共享
     *
     * @param componentId 组件ID
     * @return 操作结果
     */
    @PutMapping("/share/{componentId}")
    @Operation(summary = "设置组件为共享")
    public ReturnResult<Boolean> shareComponent(
            @Parameter(description = "组件ID") @PathVariable Integer componentId) {
        return componentService.shareComponent(componentId);
    }

    /**
     * 复制共享组件到指定服务器
     *
     * @param serverId 目标服务器ID
     * @param sourceComponentId 源组件ID
     * @return 操作结果
     */
    @PostMapping("/copy/{serverId}/{sourceComponentId}")
    @Operation(summary = "复制共享组件")
    public ReturnResult<MonitorSysGenServerComponent> copySharedComponent(
            @Parameter(description = "目标服务器ID") @PathVariable Integer serverId,
            @Parameter(description = "源组件ID") @PathVariable Integer sourceComponentId) {
        return componentService.copySharedComponent(serverId, sourceComponentId);
    }

    /**
     * 根据组件类型获取组件列表
     *
     * @param componentType 组件类型
     * @return 组件列表
     */
    @GetMapping("/type/{componentType}")
    @Operation(summary = "根据类型获取组件列表")
    public ReturnResult<List<MonitorSysGenServerComponent>> getComponentsByType(
            @Parameter(description = "组件类型") @PathVariable String componentType) {
        return componentService.getComponentsByType(componentType);
    }

    /**
     * 检查组件是否可以删除
     *
     * @param componentId 组件ID
     * @return 检查结果
     */
    @GetMapping("/can-delete/{componentId}")
    @Operation(summary = "检查组件是否可删除")
    public ReturnResult<Boolean> canDeleteComponent(
            @Parameter(description = "组件ID") @PathVariable Integer componentId) {
        return componentService.canDeleteComponent(componentId);
    }

    /**
     * 获取服务器布局配置
     *
     * @param serverId 服务器ID
     * @return 布局配置
     */
    @GetMapping("/layout/{serverId}")
    @Operation(summary = "获取服务器布局配置")
    public ReturnResult<String> getServerLayout(
            @Parameter(description = "服务器ID") @PathVariable Integer serverId) {
        return componentService.getServerLayout(serverId);
    }

    /**
     * 保存服务器布局配置
     *
     * @param serverId 服务器ID
     * @param layoutConfig 布局配置
     * @return 操作结果
     */
    @PostMapping("/layout/{serverId}")
    @Operation(summary = "保存服务器布局配置")
    public ReturnResult<Boolean> saveServerLayout(
            @Parameter(description = "服务器ID") @PathVariable Integer serverId,
            @RequestBody String layoutConfig) {
        return componentService.saveServerLayout(serverId, layoutConfig);
    }
}
