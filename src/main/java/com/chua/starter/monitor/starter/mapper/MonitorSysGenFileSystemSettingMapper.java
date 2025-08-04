package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystemSetting;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 文件系统配置管理Mapper接口
 *
 * @author CH
 * @since 2025/01/11
 */
@Mapper
public interface MonitorSysGenFileSystemSettingMapper extends BaseMapper<MonitorSysGenFileSystemSetting> {

    /**
     * 根据配置键查询配置
     *
     * @param key 配置键
     * @return 配置信息
     */
    MonitorSysGenFileSystemSetting selectByKey(@Param("key") String key);

    /**
     * 根据配置分组查询配置列表
     *
     * @param group 配置分组
     * @return 配置列表
     */
    List<MonitorSysGenFileSystemSetting> selectByGroup(@Param("group") String group);

    /**
     * 根据状态查询配置列表
     *
     * @param status 状态
     * @return 配置列表
     */
    List<MonitorSysGenFileSystemSetting> selectByStatus(@Param("status") Integer status);

    /**
     * 更新配置值
     *
     * @param key 配置键
     * @param value 配置值
     * @return 影响行数
     */
    int updateValueByKey(@Param("key") String key, @Param("value") String value);

    /**
     * 批量更新配置
     *
     * @param settings 配置列表
     * @return 影响行数
     */
    int batchUpdateSettings(@Param("settings") List<MonitorSysGenFileSystemSetting> settings);

    /**
     * 根据配置键检查是否存在
     *
     * @param key 配置键
     * @return 是否存在
     */
    boolean existsByKey(@Param("key") String key);

    /**
     * 获取所有启用的配置
     *
     * @return 配置列表
     */
    List<MonitorSysGenFileSystemSetting> selectAllEnabled();

    /**
     * 根据配置类型查询配置列表
     *
     * @param type 配置类型
     * @return 配置列表
     */
    List<MonitorSysGenFileSystemSetting> selectByType(@Param("type") String type);

    /**
     * 查询配置分组列表
     *
     * @return 分组列表
     */
    List<String> selectDistinctGroups();

    /**
     * 重置配置为默认值
     *
     * @param key 配置键
     * @return 影响行数
     */
    int resetToDefault(@Param("key") String key);

    /**
     * 批量重置配置为默认值
     *
     * @param keys 配置键列表
     * @return 影响行数
     */
    int batchResetToDefault(@Param("keys") List<String> keys);

    /**
     * 查询配置统计信息
     *
     * @return 统计信息
     */
    java.util.Map<String, Object> getSettingStatistics();
}
