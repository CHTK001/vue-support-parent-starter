package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerAlertSetting;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 服务器告警设置Mapper接口
 *
 * @author CH
 * @since 2024/12/27
 */
@Mapper
public interface MonitorSysGenServerAlertSettingMapper extends BaseMapper<MonitorSysGenServerAlertSetting> {

    /**
     * 根据服务器ID获取启用的告警设置
     *
     * @param serverId 服务器ID
     * @return 启用的告警设置列表
     */
    @Select("SELECT * FROM monitor_sys_gen_server_alert_setting " +
            "WHERE monitor_sys_gen_server_id = #{serverId} " +
            "AND monitor_sys_gen_server_alert_setting_enabled = 1 " +
            "ORDER BY monitor_sys_gen_server_alert_setting_priority ASC")
    List<MonitorSysGenServerAlertSetting> selectEnabledByServerId(@Param("serverId") Integer serverId);

    /**
     * 根据服务器ID和通知类型获取告警设置
     *
     * @param serverId         服务器ID
     * @param notificationType 通知类型
     * @return 告警设置
     */
    @Select("SELECT * FROM monitor_sys_gen_server_alert_setting " +
            "WHERE monitor_sys_gen_server_id = #{serverId} " +
            "AND monitor_sys_gen_server_alert_setting_notification_type = #{notificationType} " +
            "LIMIT 1")
    MonitorSysGenServerAlertSetting selectByServerIdAndType(@Param("serverId") Integer serverId, 
                                                           @Param("notificationType") String notificationType);

    /**
     * 批量插入告警设置
     *
     * @param settings 告警设置列表
     * @return 插入数量
     */
    int batchInsert(@Param("settings") List<MonitorSysGenServerAlertSetting> settings);

    /**
     * 根据服务器ID删除告警设置
     *
     * @param serverId 服务器ID
     * @return 删除数量
     */
    int deleteByServerId(@Param("serverId") Integer serverId);

    /**
     * 更新测试结果
     *
     * @param settingId   告警设置ID
     * @param testResult  测试结果
     * @param testError   测试错误信息
     * @param testTime    测试时间
     * @return 更新数量
     */
    int updateTestResult(@Param("settingId") Long settingId,
                        @Param("testResult") Integer testResult,
                        @Param("testError") String testError,
                        @Param("testTime") java.time.LocalDateTime testTime);

    /**
     * 获取告警设置统计信息
     *
     * @param serverId 服务器ID
     * @return 统计信息
     */
    @Select("SELECT " +
            "COUNT(*) as total_count, " +
            "SUM(CASE WHEN monitor_sys_gen_server_alert_setting_enabled = 1 THEN 1 ELSE 0 END) as enabled_count, " +
            "SUM(CASE WHEN monitor_sys_gen_server_alert_setting_enabled = 0 THEN 1 ELSE 0 END) as disabled_count, " +
            "SUM(CASE WHEN monitor_sys_gen_server_alert_setting_last_test_result = 1 THEN 1 ELSE 0 END) as success_count, " +
            "SUM(CASE WHEN monitor_sys_gen_server_alert_setting_last_test_result = 0 THEN 1 ELSE 0 END) as failed_count " +
            "FROM monitor_sys_gen_server_alert_setting " +
            "WHERE monitor_sys_gen_server_id = #{serverId}")
    java.util.Map<String, Object> selectStatisticsByServerId(@Param("serverId") Integer serverId);
}
