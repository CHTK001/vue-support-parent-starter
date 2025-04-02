package com.chua.starter.video.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.video.entity.VideoType;
import com.chua.starter.video.mapper.VideoTypeMapper;
import com.chua.starter.video.service.VideoTypeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 视频类型服务实现
 * @author CH
 */
@Service
@Slf4j
public class VideoTypeServiceImpl extends ServiceImpl<VideoTypeMapper, VideoType> implements VideoTypeService {
    
    @Override
    public List<VideoType> getVideoTypes() {
        // 查询所有启用的视频类型，并按排序字段排序
        LambdaQueryWrapper<VideoType> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(VideoType::getVideoTypeStatus, 1)
                .orderByAsc(VideoType::getVideoTypeSort);
        return this.list(queryWrapper);
    }
    
    @Override
    public Page<VideoType> pageVideoTypes(Integer page, Integer pageSize, String keyword) {
        Page<VideoType> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<VideoType> queryWrapper = new LambdaQueryWrapper<>();
        
        // 关键词查询
        if (keyword != null && !keyword.isEmpty()) {
            queryWrapper.like(VideoType::getVideoTypeName, keyword);
        }
        
        // 按排序字段排序
        queryWrapper.orderByAsc(VideoType::getVideoTypeSort);
        
        return this.page(pageParam, queryWrapper);
    }
    
    @Override
    public VideoType getVideoTypeById(String id) {
        return this.getById(id);
    }
    
    @Override
    public boolean addVideoType(VideoType videoType) {
        return this.save(videoType);
    }
    
    @Override
    public boolean updateVideoType(VideoType videoType) {
        return this.updateById(videoType);
    }
    
    @Override
    public boolean deleteVideoType(String id) {
        return this.removeById(id);
    }
    
    @Override
    public boolean batchDeleteVideoTypes(List<String> ids) {
        return this.removeByIds(ids);
    }
}