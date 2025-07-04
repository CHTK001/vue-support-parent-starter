package com.chua.starter.monitor.starter.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerComponent;

import java.util.List;

/**
 * 服务器组件配置服务接口
 *
 * @author CH
 * @since 2025/01/03
 */
public interface MonitorSysGenServerComponentService extends IService<MonitorSysGenServerComponent> {

    /**
     * 根据服务器ID获取组件列表
     *
     * @param serverId 服务器ID
     * @return 组件列表
     */
    ReturnResult<List<MonitorSysGenServerComponent>> getComponentsByServerId(Integer serverId);

    /**
     * 初始化服务器的固定组件
     *
     * @param serverId 服务器ID
     * @return 操作结果
     */
    ReturnResult<Boolean> initFixedComponents(Integer serverId);

    /**
     * 保存组件配置
     *
     * @param component 组件配置
     * @return 操作结果
     */
    ReturnResult<MonitorSysGenServerComponent> saveComponent(MonitorSysGenServerComponent component);

    /**
     * 删除组件配置
     *
     * @param componentId 组件ID
     * @return 操作结果
     */
    ReturnResult<Boolean> deleteComponent(Integer componentId);

    /**
     * 批量更新组件位置
     *
     * @param serverId 服务器ID
     * @param components 组件列表
     * @return 操作结果
     */
    ReturnResult<Boolean> updateComponentPositions(Integer serverId, List<MonitorSysGenServerComponent> components);

    /**
     * 获取共享组件列表
     *
     * @return 共享组件列表
     */
    ReturnResult<List<MonitorSysGenServerComponent>> getSharedComponents();

    /**
     * 设置组件为共享
     *
     * @param componentId 组件ID
     * @return 操作结果
     */
    ReturnResult<Boolean> shareComponent(Integer componentId);

    /**
     * 复制共享组件到指定服务器
     *
     * @param serverId 目标服务器ID
     * @param sourceComponentId 源组件ID
     * @return 操作结果
     */
    ReturnResult<MonitorSysGenServerComponent> copySharedComponent(Integer serverId, Integer sourceComponentId);

    /**
     * 获取组件配置详情
     *
     * @param componentId 组件ID
     * @return 组件配置
     */
    ReturnResult<MonitorSysGenServerComponent> getComponentById(Integer componentId);

    /**
     * 更新组件配置
     *
     * @param component 组件配置
     * @return 操作结果
     */
    ReturnResult<Boolean> updateComponent(MonitorSysGenServerComponent component);

    /**
     * 根据组件类型获取组件列表
     *
     * @param componentType 组件类型
     * @return 组件列表
     */
    ReturnResult<List<MonitorSysGenServerComponent>> getComponentsByType(String componentType);

    /**
     * 检查组件是否可以删除
     *
     * @param componentId 组件ID
     * @return 检查结果
     */
    ReturnResult<Boolean> canDeleteComponent(Integer componentId);

    /**
     * 获取服务器的布局配置
     *
     * @param serverId 服务器ID
     * @return 布局配置
     */
    ReturnResult<String> getServerLayout(Integer serverId);

    /**
     * 保存服务器的布局配置
     *
     * @param serverId 服务器ID
     * @param layoutConfig 布局配置
     * @return 操作结果
     */
    ReturnResult<Boolean> saveServerLayout(Integer serverId, String layoutConfig);
}
