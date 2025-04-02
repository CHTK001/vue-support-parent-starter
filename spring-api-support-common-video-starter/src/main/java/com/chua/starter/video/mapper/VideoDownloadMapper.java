package com.chua.starter.video.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.video.entity.VideoDownload;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface VideoDownloadMapper extends BaseMapper<VideoDownload> {
    /**
     * 批量插入或更新视频下载信息
     *
     * @param downloads 视频下载信息列表
     * @return 影响行数
     */
    int batchInsertOrUpdate(@Param("list") List<VideoDownload> downloads);

    /**
     * 根据视频ID查询下载信息
     *
     * @param videoId 视频ID
     * @return 下载信息列表
     */
    List<VideoDownload> findByVideoId(@Param("videoId") String videoId);
}