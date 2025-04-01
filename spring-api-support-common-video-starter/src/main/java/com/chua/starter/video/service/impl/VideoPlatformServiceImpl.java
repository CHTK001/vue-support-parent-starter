package com.chua.starter.video.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.video.entity.VideoPlatform;
import com.chua.starter.video.mapper.VideoPlatformMapper;
import com.chua.starter.video.service.VideoPlatformService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 视频平台服务实现
 * @author CH
 */
@Service
@Slf4j
public class VideoPlatformServiceImpl extends ServiceImpl<VideoPlatformMapper, VideoPlatform> implements VideoPlatformService {
    
    @Override
    public List<VideoPlatform> getVideoPlatforms() {
        // 查询所有启用的视频平台，并按排序字段排序
        LambdaQueryWrapper<VideoPlatform> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(VideoPlatform::getVideoPlatformStatus, 1)
                .orderByAsc(VideoPlatform::getVideoPlatformSort);
        return this.list(queryWrapper);
    }
    
    @Override
    public Page<VideoPlatform> pageVideoPlatforms(Integer page, Integer pageSize, String keyword) {
        Page<VideoPlatform> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<VideoPlatform> queryWrapper = new LambdaQueryWrapper<>();
        
        // 关键词查询
        if (keyword != null && !keyword.isEmpty()) {
            queryWrapper.like(VideoPlatform::getVideoPlatformName, keyword);
        }
        
        // 按排序字段排序
        queryWrapper.orderByAsc(VideoPlatform::getVideoPlatformSort);
        
        return this.page(pageParam, queryWrapper);
    }
    
    @Override
    public VideoPlatform getVideoPlatformById(String id) {
        return this.getById(id);
    }
    
    @Override
    public boolean addVideoPlatform(VideoPlatform videoPlatform) {
        return this.save(videoPlatform);
    }
    
    @Override
    public boolean updateVideoPlatform(VideoPlatform videoPlatform) {
        return this.updateById(videoPlatform);
    }
    
    @Override
    public boolean deleteVideoPlatform(String id) {
        return this.removeById(id);
    }
    
    @Override
    public boolean batchDeleteVideoPlatforms(List<String> ids) {
        return this.removeByIds(ids);
    }
}