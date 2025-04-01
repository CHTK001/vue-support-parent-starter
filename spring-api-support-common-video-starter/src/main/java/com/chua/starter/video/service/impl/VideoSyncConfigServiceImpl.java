package com.chua.starter.video.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.video.entity.VideoSyncConfig;
import com.chua.starter.video.mapper.VideoSyncConfigMapper;
import com.chua.starter.video.service.VideoSyncConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 视频同步配置服务实现
 * @author CH
 * @since 2024/6/21
 */
@Service
@Slf4j
public class VideoSyncConfigServiceImpl extends ServiceImpl<VideoSyncConfigMapper, VideoSyncConfig> implements VideoSyncConfigService {
    
    @Override
    public List<VideoSyncConfig> getAllConfigs() {
        return this.list(
                Wrappers.<VideoSyncConfig>lambdaQuery()
                        .eq(VideoSyncConfig::getVideoSyncConfigEnabled, true)
        );
    }
    
    @Override
    public VideoSyncConfig getConfigById(String id) {
        return this.getById(id);
    }
    
    @Override
    public boolean addConfig(VideoSyncConfig config) {
        if (config == null) {
            return false;
        }
        
        // 设置默认值
        if (config.getVideoSyncConfigEnabled() == null) {
            config.setVideoSyncConfigEnabled(true);
        }
        
        config.setCreateTime(LocalDateTime.now());
        config.setUpdateTime(LocalDateTime.now());
        
        return this.save(config);
    }
    
    @Override
    public boolean updateConfig(VideoSyncConfig config) {
        if (config == null || config.getVideoSyncConfigId() == null) {
            return false;
        }
        
        config.setUpdateTime(LocalDateTime.now());
        
        return this.updateById(config);
    }
    
    @Override
    public boolean deleteConfig(String id) {
        if (id == null) {
            return false;
        }
        
        return this.removeById(id);
    }
}