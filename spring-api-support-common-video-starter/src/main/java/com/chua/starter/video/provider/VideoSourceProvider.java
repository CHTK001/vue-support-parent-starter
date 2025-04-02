package com.chua.starter.video.provider;

import com.chua.starter.video.entity.VideoInfo;
import com.chua.starter.video.entity.VideoSyncConfig;

import java.util.List;
import java.util.function.Consumer;

/**
 * 视频源提供者接口
 * 不同的视频源实现该接口以提供视频数据
 * 
 * @author CH
 * @since 2024/6/21
 */
public interface VideoSourceProvider {


    String COVER_PATH = "./video/cover";
    /**
     * 获取提供者名称
     * 
     * @return 提供者名称，与VideoSyncConfig.videoSyncConfigSource对应
     */
    String getProviderName();
    
    /**
     * 从视频源获取视频列表
     * 
     * @param config 同步配置
     * @param consumer 视频信息消费
     * @return 视频列表
     */
    List<VideoInfo> fetchVideos(VideoSyncConfig config,  Consumer<VideoInfo> consumer);
    
    /**
     * 获取视频下载地址
     * 
     * @param videoInfo 视频信息
     * @param config 同步配置
     * @return 下载地址列表
     */
    List<String> getDownloadUrls(VideoInfo videoInfo, VideoSyncConfig config);

}