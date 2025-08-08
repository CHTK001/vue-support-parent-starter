package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerSetting;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 系统服务器配置设置Mapper接口
 * 
 * @author CH
 * @since 2025/01/17
 */
@Mapper
public interface MonitorSysGenServerSettingMapper extends BaseMapper<MonitorSysGenServerSetting> {

    /**
     * 分页查询配置设置
     * 
     * @param page        分页参数
     * @param serverId    服务器ID
     * @param settingName 配置名称（模糊查询）
     * @param settingType 配置类型
     * @param enabled     是否启用
     * @return 分页结果
     */
    IPage<MonitorSysGenServerSetting> selectPageWithConditions(
            Page<MonitorSysGenServerSetting> page,
            @Param("serverId") Integer serverId,
            @Param("settingName") String settingName,
            @Param("settingType") String settingType,
            @Param("enabled") Boolean enabled
    );

    /**
     * 根据服务器ID查询配置设置列表
     * 
     * @param serverId 服务器ID
     * @return 配置设置列表
     */
    List<MonitorSysGenServerSetting> selectByServerId(@Param("serverId") Integer serverId);

    /**
     * 根据服务器ID查询配置设置列表（按排序顺序）
     * 
     * @param serverId 服务器ID
     * @return 配置设置列表
     */
    List<MonitorSysGenServerSetting> selectByServerIdOrderBySort(@Param("serverId") Integer serverId);

    /**
     * 根据服务器ID查询启用的配置设置列表
     * 
     * @param serverId 服务器ID
     * @return 启用的配置设置列表
     */
    List<MonitorSysGenServerSetting> selectEnabledByServerId(@Param("serverId") Integer serverId);

    /**
     * 根据配置名称查询
     * 
     * @param settingName 配置名称
     * @return 配置设置
     */
    MonitorSysGenServerSetting selectByName(@Param("settingName") String settingName);

    /**
     * 根据配置类型查询列表
     * 
     * @param settingType 配置类型
     * @return 配置设置列表
     */
    List<MonitorSysGenServerSetting> selectByType(@Param("settingType") String settingType);

    /**
     * 根据服务器ID和配置名称查询
     * 
     * @param serverId    服务器ID
     * @param settingName 配置名称
     * @return 配置设置
     */
    MonitorSysGenServerSetting selectByServerIdAndName(@Param("serverId") Integer serverId, @Param("settingName") String settingName);

    /**
     * 根据服务器ID和配置类型查询
     * 
     * @param serverId    服务器ID
     * @param settingType 配置类型
     * @return 配置设置
     */
    MonitorSysGenServerSetting selectByServerIdAndType(@Param("serverId") Integer serverId, @Param("settingType") String settingType);

    /**
     * 更新配置设置启用状态
     * 
     * @param settingId 配置设置ID
     * @param enabled   是否启用
     * @return 更新行数
     */
    int updateEnabled(@Param("settingId") Integer settingId, @Param("enabled") Boolean enabled);

    /**
     * 批量更新配置设置启用状态
     * 
     * @param settingIds 配置设置ID列表
     * @param enabled    是否启用
     * @return 更新行数
     */
    int batchUpdateEnabled(@Param("settingIds") List<Integer> settingIds, @Param("enabled") Boolean enabled);

    /**
     * 更新配置设置排序顺序
     * 
     * @param settingId 配置设置ID
     * @param sortOrder 排序顺序
     * @return 更新行数
     */
    int updateSortOrder(@Param("settingId") Integer settingId, @Param("sortOrder") Integer sortOrder);

    /**
     * 批量更新配置设置排序顺序
     * 
     * @param settingOrders 配置设置排序列表
     * @return 更新行数
     */
    int batchUpdateSortOrder(@Param("settingOrders") List<MonitorSysGenServerSetting> settingOrders);

    /**
     * 更新配置参数
     * 
     * @param settingId 配置设置ID
     * @param config    配置参数
     * @return 更新行数
     */
    int updateConfig(@Param("settingId") Integer settingId, @Param("config") String config);

    /**
     * 更新配置状态
     * 
     * @param settingId 配置设置ID
     * @param status    配置状态
     * @return 更新行数
     */
    int updateStatus(@Param("settingId") Integer settingId, @Param("status") String status);

    /**
     * 更新最后应用时间
     * 
     * @param settingId        配置设置ID
     * @param lastAppliedTime  最后应用时间
     * @return 更新行数
     */
    int updateLastAppliedTime(@Param("settingId") Integer settingId, @Param("lastAppliedTime") java.time.LocalDateTime lastAppliedTime);

    /**
     * 增加应用次数
     * 
     * @param settingId 配置设置ID
     * @return 更新行数
     */
    int incrementApplyCount(@Param("settingId") Integer settingId);

    /**
     * 更新配置错误信息
     * 
     * @param settingId    配置设置ID
     * @param errorMessage 错误信息
     * @return 更新行数
     */
    int updateErrorMessage(@Param("settingId") Integer settingId, @Param("errorMessage") String errorMessage);

    /**
     * 根据服务器ID删除所有配置设置
     * 
     * @param serverId 服务器ID
     * @return 删除行数
     */
    int deleteByServerId(@Param("serverId") Integer serverId);

    /**
     * 批量删除配置设置
     * 
     * @param settingIds 配置设置ID列表
     * @return 删除行数
     */
    int batchDeleteByIds(@Param("settingIds") List<Integer> settingIds);

    /**
     * 查询指定服务器的配置设置数量
     * 
     * @param serverId 服务器ID
     * @return 配置设置数量
     */
    int countByServerId(@Param("serverId") Integer serverId);

    /**
     * 查询指定类型的配置设置数量
     * 
     * @param settingType 配置类型
     * @return 配置设置数量
     */
    int countByType(@Param("settingType") String settingType);

    /**
     * 查询启用的配置设置数量
     * 
     * @param serverId 服务器ID
     * @return 启用的配置设置数量
     */
    int countEnabledByServerId(@Param("serverId") Integer serverId);

    /**
     * 查询所有可用的配置类型
     * 
     * @return 配置类型列表
     */
    List<String> selectDistinctTypes();

    /**
     * 查询所有可用的配置分组
     * 
     * @return 配置分组列表
     */
    List<String> selectDistinctGroups();

    /**
     * 获取指定服务器的下一个排序顺序
     * 
     * @param serverId 服务器ID
     * @return 下一个排序顺序
     */
    Integer getNextSortOrder(@Param("serverId") Integer serverId);

    /**
     * 重置配置为默认值
     * 
     * @param settingId 配置设置ID
     * @return 更新行数
     */
    int resetToDefault(@Param("settingId") Integer settingId);

    /**
     * 批量重置配置为默认值
     * 
     * @param settingIds 配置设置ID列表
     * @return 更新行数
     */
    int batchResetToDefault(@Param("settingIds") List<Integer> settingIds);

    /**
     * 根据配置类型和服务器ID统计数量
     * 
     * @return 类型统计结果
     */
    List<java.util.Map<String, Object>> countByTypeAndServerId();

    /**
     * 根据配置状态统计数量
     * 
     * @return 状态统计结果
     */
    List<java.util.Map<String, Object>> countByStatus();

    /**
     * 查询最近应用的配置设置
     * 
     * @param limit 限制数量
     * @return 最近应用的配置设置列表
     */
    List<MonitorSysGenServerSetting> selectRecentlyApplied(@Param("limit") Integer limit);

    /**
     * 查询应用次数最多的配置设置
     * 
     * @param limit 限制数量
     * @return 应用次数最多的配置设置列表
     */
    List<MonitorSysGenServerSetting> selectMostApplied(@Param("limit") Integer limit);

    /**
     * 查询有错误的配置设置
     * 
     * @return 有错误的配置设置列表
     */
    List<MonitorSysGenServerSetting> selectWithErrors();
}
