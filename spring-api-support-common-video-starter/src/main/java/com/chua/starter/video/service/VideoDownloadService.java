package com.chua.starter.video.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.starter.video.entity.VideoDownload;
import com.chua.starter.video.entity.VideoInfo;

import java.util.List;

/**
 * 视频下载服务接口
 * @author CH
 */
public interface VideoDownloadService extends IService<VideoDownload> {
    
    /**
     * 根据视频ID获取下载信息
     *
     * @param videoId 视频ID
     * @return 下载信息列表
     */
    List<VideoDownload> getDownloadsByVideoId(String videoId);
    
    /**
     * 保存视频下载信息
     *
     * @param videoInfo 视频信息
     * @param downloadUrl 下载地址
     * @param downloadType 下载类型
     * @param quality 视频质量
     * @return 保存的下载信息
     */
    VideoDownload saveDownload(VideoInfo videoInfo, String downloadUrl, String downloadType, String quality);
    
    /**
     * 批量保存视频下载信息
     *
     * @param downloads 下载信息列表
     * @return 是否保存成功
     */
    boolean batchSaveDownloads(List<VideoDownload> downloads);
    
    /**
     * 更新下载状态
     *
     * @param downloadId 下载ID
     * @param status 下载状态
     * @return 是否更新成功
     */
    boolean updateDownloadStatus(String downloadId, Integer status);
}