package com.chua.starter.monitor.starter.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystemSetting;

import java.util.List;

/**
 * 文件系统配置管理服务接口
 *
 * @author CH
 * @since 2025/01/11
 */
public interface MonitorSysGenFileSystemSettingService extends IService<MonitorSysGenFileSystemSetting> {

    /**
     * 根据配置键获取配置值
     *
     * @param key 配置键
     * @return 配置值
     */
    ReturnResult<String> getSettingValue(String key);

    /**
     * 根据配置键获取配置值（带默认值）
     *
     * @param key          配置键
     * @param defaultValue 默认值
     * @return 配置值
     */
    String getSettingValue(String key, String defaultValue);

    /**
     * 根据配置键获取整数配置值
     *
     * @param key          配置键
     * @param defaultValue 默认值
     * @return 配置值
     */
    Integer getIntegerSetting(String key, Integer defaultValue);

    /**
     * 根据配置键获取布尔配置值
     *
     * @param key          配置键
     * @param defaultValue 默认值
     * @return 配置值
     */
    Boolean getBooleanSetting(String key, Boolean defaultValue);

    /**
     * 设置配置值
     *
     * @param key   配置键
     * @param value 配置值
     * @return 设置结果
     */
    ReturnResult<Boolean> setSettingValue(String key, String value);

    /**
     * 批量设置配置
     *
     * @param settings 配置列表
     * @return 设置结果
     */
    ReturnResult<Boolean> batchSetSettings(List<MonitorSysGenFileSystemSetting> settings);

    /**
     * 根据分组获取配置列表
     *
     * @param group 配置分组
     * @return 配置列表
     */
    ReturnResult<List<MonitorSysGenFileSystemSetting>> getSettingsByGroup(String group);

    /**
     * 获取所有启用的配置
     *
     * @return 配置列表
     */
    ReturnResult<List<MonitorSysGenFileSystemSetting>> getAllEnabledSettings();

    /**
     * 重置配置为默认值
     *
     * @param key 配置键
     * @return 重置结果
     */
    ReturnResult<Boolean> resetToDefault(String key);

    /**
     * 批量重置配置为默认值
     *
     * @param keys 配置键列表
     * @return 重置结果
     */
    ReturnResult<Boolean> batchResetToDefault(List<String> keys);

    /**
     * 获取配置分组列表
     *
     * @return 分组列表
     */
    ReturnResult<List<String>> getSettingGroups();

    /**
     * 获取配置统计信息
     *
     * @return 统计信息
     */
    ReturnResult<java.util.Map<String, Object>> getSettingStatistics();

    /**
     * 初始化默认配置
     *
     * @return 初始化结果
     */
    ReturnResult<Boolean> initDefaultSettings();

    /**
     * 验证配置值
     *
     * @param key   配置键
     * @param value 配置值
     * @return 验证结果
     */
    ReturnResult<Boolean> validateSettingValue(String key, String value);

    /**
     * 刷新配置缓存
     *
     * @return 刷新结果
     */
    ReturnResult<Boolean> refreshCache();

    /**
     * 获取合并任务数量配置
     *
     * @return 合并任务数量
     */
    Integer getMergeTaskCount();

    /**
     * 是否开启手动合并
     *
     * @return 是否开启
     */
    Boolean isManualMergeEnabled();

    /**
     * 是否开启分片上传
     *
     * @return 是否开启
     */
    Boolean isChunkUploadEnabled();

    /**
     * 获取文件类型白名单
     *
     * @return 文件类型列表
     */
    List<String> getFileTypeWhitelist();

    /**
     * 是否开启文件下载
     *
     * @return 是否开启
     */
    Boolean isFileDownloadEnabled();

    /**
     * 是否开启HTTP访问
     *
     * @return 是否开启
     */
    Boolean isHttpAccessEnabled();

    /**
     * 获取分片大小配置
     *
     * @return 分片大小（字节）
     */
    Long getChunkSize();

    /**
     * 获取最大文件大小配置
     *
     * @return 最大文件大小（字节）
     */
    Long getMaxFileSize();
}
