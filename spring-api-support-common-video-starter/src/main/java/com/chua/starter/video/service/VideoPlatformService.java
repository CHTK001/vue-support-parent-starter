package com.chua.starter.video.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.starter.video.entity.VideoPlatform;

import java.util.List;

/**
 * 视频平台服务接口
 * @author CH
 */
public interface VideoPlatformService extends IService<VideoPlatform> {
    
    /**
     * 获取视频平台列表
     *
     * @return 视频平台列表
     */
    List<VideoPlatform> getVideoPlatforms();
    
    /**
     * 分页查询视频平台
     *
     * @param page 页码
     * @param pageSize 每页数量
     * @param keyword 关键词
     * @return 分页结果
     */
    Page<VideoPlatform> pageVideoPlatforms(Integer page, Integer pageSize, String keyword);
    
    /**
     * 获取视频平台详情
     *
     * @param id 视频平台ID
     * @return 视频平台详情
     */
    VideoPlatform getVideoPlatformById(String id);
    
    /**
     * 添加视频平台
     *
     * @param videoPlatform 视频平台信息
     * @return 添加结果
     */
    boolean addVideoPlatform(VideoPlatform videoPlatform);
    
    /**
     * 修改视频平台
     *
     * @param videoPlatform 视频平台信息
     * @return 修改结果
     */
    boolean updateVideoPlatform(VideoPlatform videoPlatform);
    
    /**
     * 删除视频平台
     *
     * @param id 视频平台ID
     * @return 删除结果
     */
    boolean deleteVideoPlatform(String id);
    
    /**
     * 批量删除视频平台
     *
     * @param ids 视频平台ID列表
     * @return 删除结果
     */
    boolean batchDeleteVideoPlatforms(List<String> ids);
}