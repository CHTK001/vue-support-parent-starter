package com.chua.starter.video.service.impl;

import com.chua.common.support.spi.ServiceProvider;
import com.chua.starter.video.entity.VideoDownload;
import com.chua.starter.video.entity.VideoInfo;
import com.chua.starter.video.entity.VideoSyncConfig;
import com.chua.starter.video.mapper.VideoInfoMapper;
import com.chua.starter.video.provider.VideoSourceProvider;
import com.chua.starter.video.service.VideoDownloadService;
import com.chua.starter.video.service.VideoSyncConfigService;
import com.chua.starter.video.service.VideoSyncTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

/**
 * 视频同步任务服务实现
 * @author CH
 * @since 2024/6/21
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class VideoSyncTaskServiceImpl implements VideoSyncTaskService {

    private final VideoSyncConfigService videoSyncConfigService;
    private final VideoInfoMapper videoInfoMapper;
    private final VideoDownloadService videoDownloadService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int syncByConfig(VideoSyncConfig config) {
        if (config == null || !Boolean.TRUE.equals(config.getVideoSyncConfigEnabled())) {
            return 0;
        }
        
        log.info("开始同步配置[{}]的视频信息", config.getVideoSyncConfigName());
        AtomicInteger syncCount = new AtomicInteger(0);
        
        try {
            // 根据配置获取视频列表
            fetchVideosFromSource(config, video -> {
                    // 设置来源信息
                    video.setVideoPlatform(config.getVideoSyncConfigSource());

                    // 如果没有ID，生成一个
                    if (!StringUtils.hasText(video.getVideoId())) {
                        video.setVideoId(UUID.randomUUID().toString().replace("-", ""));
                    }

                    // 保存或更新视频信息
                    boolean saved = saveOrUpdateVideo(video);

                    if (saved) {
                        // 处理下载地址
                        processDownloadUrls(video, config);
                        syncCount.incrementAndGet();
                    }
            });
            


            log.info("配置[{}]同步完成，共同步{}个视频", config.getVideoSyncConfigName(), syncCount);
        } catch (Exception e) {
            log.error("同步配置[{}]视频信息失败: {}", config.getVideoSyncConfigName(), e.getMessage(), e);
        }
        
        return syncCount;
    }
    
    @Override
    public int syncAllEnabledConfigs() {
        int totalCount = 0;
        
        List<VideoSyncConfig> configs = videoSyncConfigService.getAllConfigs();
        
        log.info("开始同步所有启用的配置，共{}个配置", configs.size());
        
        for (VideoSyncConfig config : configs) {
            int count = syncByConfig(config);
            totalCount += count;
        }
        
        log.info("所有配置同步完成，共同步{}个视频", totalCount);
        
        return totalCount;
    }
    
    /**
     * 从数据源获取视频列表
     *
     * @param config 同步配置
     * @return 视频列表
     */
    private void fetchVideosFromSource(VideoSyncConfig config, Consumer<VideoInfo> consumer) {
        String source = config.getVideoSyncConfigSource();
        if (!StringUtils.hasText(source)) {
            log.warn("配置[{}]未指定同步来源", config.getVideoSyncConfigName());
            return;
        }
        
        // 通过ServiceProvider获取对应的视频源提供者
        VideoSourceProvider provider = ServiceProvider.of(VideoSourceProvider.class).getNewExtension(source);
        if (provider == null) {
            log.warn("未找到同步来源[{}]的提供者", source);
            return;
        }
        
        // 调用提供者获取视频列表
        provider.fetchVideos(config, consumer);
    }
    
    /**
     * 获取视频下载地址
     *
     * @param video 视频信息
     * @param config 同步配置
     * @return 下载地址列表
     */
    private List<String> getVideoDownloadUrls(VideoInfo video, VideoSyncConfig config) {
        String source = config.getVideoSyncConfigSource();
        if (!StringUtils.hasText(source)) {
            log.warn("配置[{}]未指定同步来源", config.getVideoSyncConfigName());
            return new ArrayList<>();
        }
        
        // 通过ServiceProvider获取对应的视频源提供者
        VideoSourceProvider provider = ServiceProvider.of(VideoSourceProvider.class).getNewExtension(source);
        if (provider == null) {
            log.warn("未找到同步来源[{}]的提供者", source);
            return new ArrayList<>();
        }
        
        // 调用提供者获取下载地址
        return provider.getDownloadUrls(video, config);
    }
    
    /**
     * 保存或更新视频信息
     *
     * @param video 视频信息
     * @return 是否成功
     */
    private boolean saveOrUpdateVideo(VideoInfo video) {
        try {
            // 检查视频是否已存在
            VideoInfo existingVideo = videoInfoMapper.selectById(video.getVideoId());
            
            if (existingVideo != null) {
                // 更新视频信息
                video.setUpdateTime(LocalDateTime.now());
                return videoInfoMapper.updateById(video) > 0;
            } else {
                // 新增视频信息
                video.setCreateTime(LocalDateTime.now());
                video.setUpdateTime(LocalDateTime.now());
                return videoInfoMapper.insert(video) > 0;
            }
        } catch (Exception e) {
            log.error("保存或更新视频信息失败: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 处理下载地址
     *
     * @param video 视频信息
     * @param config 同步配置
     */
    private void processDownloadUrls(VideoInfo video, VideoSyncConfig config) {
        try {
            // 获取下载地址
            List<String> downloadUrls = getVideoDownloadUrls(video, config);
            
            if (downloadUrls.isEmpty()) {
                log.info("视频[{}]没有可用的下载地址", video.getVideoTitle());
                return;
            }
            
            // 保存下载信息
            for (String downloadUrl : downloadUrls) {
                String downloadType = getDownloadType(downloadUrl);
                String quality = determineQuality(downloadUrl);
                
                VideoDownload download = new VideoDownload();
                download.setVideoId(video.getVideoId());
                download.setDownloadUrl(downloadUrl);
                download.setDownloadType(downloadType);
                download.setDownloadQuality(quality);
                download.setDownloadStatus(1); // 默认可用状态
                download.setCreateTime(LocalDateTime.now());
                download.setUpdateTime(LocalDateTime.now());
                
                videoDownloadService.saveOrUpdate(download);
            }
            
            log.info("视频[{}]的下载地址处理完成，共{}个地址", video.getVideoTitle(), downloadUrls.size());
        } catch (Exception e) {
            log.error("处理视频[{}]下载地址失败: {}", video.getVideoTitle(), e.getMessage(), e);
        }
    }
    
    /**
     * 根据URL获取下载类型
     *
     * @param url 下载URL
     * @return 下载类型
     */
    private String getDownloadType(String url) {
        if (!StringUtils.hasText(url)) {
            return "unknown";
        }
        
        if (url.endsWith(".mp4")) {
            return "mp4";
        } else if (url.endsWith(".flv")) {
            return "flv";
        } else if (url.endsWith(".m3u8")) {
            return "m3u8";
        } else if (url.contains("quality=")) {
            // 根据自定义的URL参数判断
            return "mp4"; // 默认为mp4
        } else {
            // 尝试从URL中提取类型
            int lastDotIndex = url.lastIndexOf(".");
            if (lastDotIndex > 0 && lastDotIndex < url.length() - 1) {
                return url.substring(lastDotIndex + 1);
            }
        }
        
        return "unknown";
    }
    
    /**
     * 确定视频质量
     *
     * @param url 下载URL
     * @return 视频质量
     */
    private String determineQuality(String url) {
        if (!StringUtils.hasText(url)) {
            return "标清";
        }
        
        if (url.contains("quality=standard")) {
            return "标清";
        } else if (url.contains("quality=high")) {
            return "高清";
        } else if (url.contains("quality=super")) {
            return "超清";
        } else if (url.contains("1080p")) {
            return "超清";
        } else if (url.contains("720p")) {
            return "高清";
        } else if (url.contains("480p")) {
            return "标清";
        }
        
        return "标清"; // 默认标清
    }
}