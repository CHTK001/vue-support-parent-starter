package com.chua.starter.video.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.starter.video.entity.VideoKeyword;

import java.util.List;

/**
 * 视频关键词服务接口
 * @author CH
 */
public interface VideoKeywordService extends IService<VideoKeyword> {
    
    /**
     * 获取热门搜索关键词
     *
     * @param limit 限制数量
     * @return 热门搜索关键词列表
     */
    List<VideoKeyword> getHotKeywords(int limit);
    
    /**
     * 分页查询视频关键词
     *
     * @param page 页码
     * @param pageSize 每页数量
     * @param keyword 关键词
     * @return 分页结果
     */
    Page<VideoKeyword> pageVideoKeywords(Integer page, Integer pageSize, String keyword);
    
    /**
     * 获取视频关键词详情
     *
     * @param id 视频关键词ID
     * @return 视频关键词详情
     */
    VideoKeyword getVideoKeywordById(String id);
    
    /**
     * 添加视频关键词
     *
     * @param videoKeyword 视频关键词信息
     * @return 添加结果
     */
    boolean addVideoKeyword(VideoKeyword videoKeyword);
    
    /**
     * 修改视频关键词
     *
     * @param videoKeyword 视频关键词信息
     * @return 修改结果
     */
    boolean updateVideoKeyword(VideoKeyword videoKeyword);
    
    /**
     * 删除视频关键词
     *
     * @param id 视频关键词ID
     * @return 删除结果
     */
    boolean deleteVideoKeyword(String id);
    
    /**
     * 批量删除视频关键词
     *
     * @param ids 视频关键词ID列表
     * @return 删除结果
     */
    boolean batchDeleteVideoKeywords(List<String> ids);
}