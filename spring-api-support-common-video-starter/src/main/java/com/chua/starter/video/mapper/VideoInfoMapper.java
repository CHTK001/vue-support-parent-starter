package com.chua.starter.video.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.chua.starter.video.entity.VideoInfo;
import com.chua.starter.video.pojo.request.VideoSearchRequest;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 视频信息Mapper
 * @author CH
 */
public interface VideoInfoMapper extends BaseMapper<VideoInfo> {
    
    /**
     * 搜索视频
     *
     * @param page 分页参数
     * @param request 搜索请求
     * @return 视频列表
     */
    List<VideoInfo> searchVideos(Page<VideoInfo> page, @Param("request") VideoSearchRequest request);
}