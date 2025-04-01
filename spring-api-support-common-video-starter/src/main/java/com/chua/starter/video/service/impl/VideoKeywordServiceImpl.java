package com.chua.starter.video.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.video.entity.VideoKeyword;
import com.chua.starter.video.mapper.VideoKeywordMapper;
import com.chua.starter.video.service.VideoKeywordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 视频关键词服务实现
 * @author CH
 */
@Service
@Slf4j
public class VideoKeywordServiceImpl extends ServiceImpl<VideoKeywordMapper, VideoKeyword> implements VideoKeywordService {
    
    @Override
    public List<VideoKeyword> getHotKeywords(int limit) {
        // 查询所有启用的热门关键词，按热度和排序字段排序
        LambdaQueryWrapper<VideoKeyword> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(VideoKeyword::getVideoKeywordStatus, 1)
                .orderByDesc(VideoKeyword::getVideoKeywordHot)
                .orderByAsc(VideoKeyword::getVideoKeywordSort)
                .last("LIMIT " + limit); // 限制返回数量
        return this.list(queryWrapper);
    }
    
    @Override
    public Page<VideoKeyword> pageVideoKeywords(Integer page, Integer pageSize, String keyword) {
        Page<VideoKeyword> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<VideoKeyword> queryWrapper = new LambdaQueryWrapper<>();
        
        // 关键词查询
        if (keyword != null && !keyword.isEmpty()) {
            queryWrapper.like(VideoKeyword::getVideoKeywordContent, keyword);
        }
        
        // 按热度和排序字段排序
        queryWrapper.orderByDesc(VideoKeyword::getVideoKeywordHot)
                .orderByAsc(VideoKeyword::getVideoKeywordSort);
        
        return this.page(pageParam, queryWrapper);
    }
    
    @Override
    public VideoKeyword getVideoKeywordById(String id) {
        return this.getById(id);
    }
    
    @Override
    public boolean addVideoKeyword(VideoKeyword videoKeyword) {
        return this.save(videoKeyword);
    }
    
    @Override
    public boolean updateVideoKeyword(VideoKeyword videoKeyword) {
        return this.updateById(videoKeyword);
    }
    
    @Override
    public boolean deleteVideoKeyword(String id) {
        return this.removeById(id);
    }
    
    @Override
    public boolean batchDeleteVideoKeywords(List<String> ids) {
        return this.removeByIds(ids);
    }
}