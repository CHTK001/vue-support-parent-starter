package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerComponent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 服务器组件配置Mapper接口
 *
 * @author CH
 * @since 2025/01/03
 */
@Mapper
public interface MonitorSysGenServerComponentMapper extends BaseMapper<MonitorSysGenServerComponent> {

    /**
     * 根据服务器ID获取组件列表
     *
     * @param serverId 服务器ID
     * @return 组件列表
     */
    List<MonitorSysGenServerComponent> selectByServerId(@Param("serverId") Integer serverId);

    /**
     * 根据组件类型获取组件列表
     *
     * @param componentType 组件类型
     * @return 组件列表
     */
    List<MonitorSysGenServerComponent> selectByComponentType(@Param("componentType") String componentType);

    /**
     * 获取共享组件列表
     *
     * @return 共享组件列表
     */
    List<MonitorSysGenServerComponent> selectSharedComponents();

    /**
     * 根据服务器ID获取固定组件列表
     *
     * @param serverId 服务器ID
     * @return 固定组件列表
     */
    List<MonitorSysGenServerComponent> selectFixedComponentsByServerId(@Param("serverId") Integer serverId);

    /**
     * 根据服务器ID和组件类型获取组件
     *
     * @param serverId 服务器ID
     * @param componentType 组件类型
     * @return 组件信息
     */
    MonitorSysGenServerComponent selectByServerIdAndType(@Param("serverId") Integer serverId, 
                                                        @Param("componentType") String componentType);

    /**
     * 批量更新组件位置信息
     *
     * @param components 组件列表
     * @return 更新数量
     */
    int batchUpdatePosition(@Param("components") List<MonitorSysGenServerComponent> components);

    /**
     * 根据来源服务器ID获取共享组件列表
     *
     * @param sourceServerId 来源服务器ID
     * @return 共享组件列表
     */
    List<MonitorSysGenServerComponent> selectBySourceServerId(@Param("sourceServerId") Integer sourceServerId);
}
