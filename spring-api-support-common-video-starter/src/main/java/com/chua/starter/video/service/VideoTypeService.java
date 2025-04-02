package com.chua.starter.video.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.starter.video.entity.VideoType;

import java.util.List;

/**
 * 视频类型服务接口
 * @author CH
 */
public interface VideoTypeService extends IService<VideoType> {
    
    /**
     * 获取视频类型列表
     *
     * @return 视频类型列表
     */
    List<VideoType> getVideoTypes();
    
    /**
     * 分页查询视频类型
     *
     * @param page 页码
     * @param pageSize 每页数量
     * @param keyword 关键词
     * @return 分页结果
     */
    Page<VideoType> pageVideoTypes(Integer page, Integer pageSize, String keyword);
    
    /**
     * 获取视频类型详情
     *
     * @param id 视频类型ID
     * @return 视频类型详情
     */
    VideoType getVideoTypeById(String id);
    
    /**
     * 添加视频类型
     *
     * @param videoType 视频类型信息
     * @return 添加结果
     */
    boolean addVideoType(VideoType videoType);
    
    /**
     * 修改视频类型
     *
     * @param videoType 视频类型信息
     * @return 修改结果
     */
    boolean updateVideoType(VideoType videoType);
    
    /**
     * 删除视频类型
     *
     * @param id 视频类型ID
     * @return 删除结果
     */
    boolean deleteVideoType(String id);
    
    /**
     * 批量删除视频类型
     *
     * @param ids 视频类型ID列表
     * @return 删除结果
     */
    boolean batchDeleteVideoTypes(List<String> ids);
}