package com.chua.starter.video.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.video.entity.VideoDownload;
import com.chua.starter.video.entity.VideoInfo;
import com.chua.starter.video.mapper.VideoDownloadMapper;
import com.chua.starter.video.service.VideoDownloadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * 视频下载服务实现
 * @author CH
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class VideoDownloadServiceImpl extends ServiceImpl<VideoDownloadMapper, VideoDownload> implements VideoDownloadService {
    
    @Override
    public List<VideoDownload> getDownloadsByVideoId(String videoId) {
        return baseMapper.findByVideoId(videoId);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public VideoDownload saveDownload(VideoInfo videoInfo, String downloadUrl, String downloadType, String quality) {
        // 检查是否已存在相同URL的下载记录
        LambdaQueryWrapper<VideoDownload> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(VideoDownload::getVideoId, videoInfo.getVideoId())
                .eq(VideoDownload::getDownloadUrl, downloadUrl);
        
        VideoDownload existingDownload = this.getOne(queryWrapper);
        
        if (existingDownload != null) {
            // 更新已存在的记录
            existingDownload.setDownloadType(downloadType);
            existingDownload.setDownloadQuality(quality);
            existingDownload.setDownloadPlatform(videoInfo.getVideoPlatform());
            this.updateById(existingDownload);
            return existingDownload;
        } else {
            // 创建新记录
            VideoDownload download = new VideoDownload();
            download.setDownloadId(UUID.randomUUID().toString().replace("-", ""));
            download.setVideoId(videoInfo.getVideoId());
            download.setDownloadUrl(downloadUrl);
            download.setDownloadType(downloadType);
            download.setDownloadStatus(0); // 未下载
            download.setDownloadPlatform(videoInfo.getVideoPlatform());
            download.setDownloadQuality(quality);
            
            this.save(download);
            return download;
        }
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean batchSaveDownloads(List<VideoDownload> downloads) {
        if (downloads == null || downloads.isEmpty()) {
            return false;
        }
        
        try {
            return baseMapper.batchInsertOrUpdate(downloads) > 0;
        } catch (Exception e) {
            log.error("批量保存视频下载信息失败", e);
            return false;
        }
    }
    
    @Override
    public boolean updateDownloadStatus(String downloadId, Integer status) {
        VideoDownload download = this.getById(downloadId);
        if (download != null) {
            download.setDownloadStatus(status);
            return this.updateById(download);
        }
        return false;
    }
}