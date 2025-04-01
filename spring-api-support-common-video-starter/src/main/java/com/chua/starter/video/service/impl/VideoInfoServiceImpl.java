package com.chua.starter.video.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.video.entity.VideoInfo;
import com.chua.starter.video.mapper.VideoInfoMapper;
import com.chua.starter.video.pojo.request.VideoSearchRequest;
import com.chua.starter.video.pojo.response.VideoSearchResponse;
import com.chua.starter.video.service.VideoInfoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 视频信息服务实现
 * @author CH
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class VideoInfoServiceImpl extends ServiceImpl<VideoInfoMapper, VideoInfo> implements VideoInfoService {
    
    @Override
    public VideoSearchResponse searchVideos(VideoSearchRequest request) {
        // 使用自定义Mapper方法进行查询
        Page<VideoInfo> page = new Page<>(request.getPage(), request.getPageSize());
        List<VideoInfo> records = baseMapper.searchVideos(page, request);
        
        // 构建返回结果
        VideoSearchResponse response = new VideoSearchResponse();
        response.setData(records);
        response.setTotal(page.getTotal());
        response.setHasMore(response.calculateHasMore(request.getPage(), request.getPageSize()));
        
        return response;
    }
    
    @Override
    public VideoInfo getVideoById(String id) {
        return this.getById(id);
    }
    
    @Override
    public boolean addVideo(VideoInfo videoInfo) {
        return this.save(videoInfo);
    }
    
    @Override
    public boolean updateVideo(VideoInfo videoInfo) {
        return this.updateById(videoInfo);
    }
    
    @Override
    public boolean deleteVideo(String id) {
        return this.removeById(id);
    }
}
