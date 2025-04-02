package com.chua.starter.video.service;

import com.chua.starter.video.entity.VideoSyncConfig;

/**
 * 视频同步任务服务
 * @author CH
 * @since 2024/6/21
 */
public interface VideoSyncTaskService {
    
    /**
     * 根据同步配置执行同步任务
     *
     * @param config 同步配置
     * @return 同步的视频数量
     */
    int syncByConfig(VideoSyncConfig config);
    
    /**
     * 同步所有启用的配置
     *
     * @return 同步的视频总数
     */
    int syncAllEnabledConfigs();
}