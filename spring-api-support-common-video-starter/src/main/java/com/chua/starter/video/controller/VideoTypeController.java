package com.chua.starter.video.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.video.entity.VideoType;
import com.chua.starter.video.service.VideoTypeService;
import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.chua.starter.common.support.constant.CacheConstant.REDIS_CACHE_ALWAYS;

/**
 * 视频类型接口
 * @author CH
 * @since 2024/6/21
 */
@RestController
@RequestMapping("v1/video/type")
@Tag(name = "视频类型接口")
@Api(tags = "视频类型接口")
@RequiredArgsConstructor
@Slf4j
public class VideoTypeController {
    
    private final VideoTypeService videoTypeService;
    
    /**
     * 获取视频类型列表
     *
     * @return 视频类型列表
     */
    @GetMapping("/list")
    @Operation(summary = "获取视频类型列表")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:type:list", keyGenerator = "customTenantedKeyGenerator")
    public ReturnResult<List<VideoType>> getVideoTypes() {
        List<VideoType> types = videoTypeService.getVideoTypes();
        return ReturnResult.success(types);
    }
    
    /**
     * 分页查询视频类型
     *
     * @param page 页码
     * @param pageSize 每页数量
     * @param keyword 关键词
     * @return 分页结果
     */
    @GetMapping("/page")
    @Operation(summary = "分页查询视频类型")
    public ReturnResult<Page<VideoType>> pageVideoTypes(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        
        Page<VideoType> result = videoTypeService.pageVideoTypes(page, pageSize, keyword);
        return ReturnResult.success(result);
    }
    
    /**
     * 获取视频类型详情
     *
     * @param id 视频类型ID
     * @return 视频类型详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取视频类型详情")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:type:detail", key = "#id", unless = "#result.data == null")
    public ReturnResult<VideoType> getVideoTypeById(@PathVariable String id) {
        VideoType videoType = videoTypeService.getVideoTypeById(id);
        if (videoType == null) {
            return ReturnResult.error("视频类型不存在");
        }
        return ReturnResult.success(videoType);
    }
    
    /**
     * 添加视频类型
     *
     * @param videoType 视频类型信息
     * @return 添加结果
     */
    @PostMapping("/add")
    @Operation(summary = "添加视频类型")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:type:list", "video:type:detail"}, allEntries = true)
    public ReturnResult<Boolean> addVideoType(@RequestBody VideoType videoType) {
        boolean result = videoTypeService.addVideoType(videoType);
        return result ? ReturnResult.success(true) : ReturnResult.error("添加失败");
    }
    
    /**
     * 修改视频类型
     *
     * @param videoType 视频类型信息
     * @return 修改结果
     */
    @PutMapping("/update")
    @Operation(summary = "修改视频类型")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:type:list", "video:type:detail"}, allEntries = true)
    public ReturnResult<Boolean> updateVideoType(@RequestBody VideoType videoType) {
        if (videoType.getVideoTypeId() == null) {
            return ReturnResult.error("视频类型ID不能为空");
        }
        
        boolean result = videoTypeService.updateVideoType(videoType);
        return result ? ReturnResult.success(true) : ReturnResult.error("修改失败");
    }
    
    /**
     * 删除视频类型
     *
     * @param id 视频类型ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除视频类型")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:type:list", "video:type:detail"}, allEntries = true)
    public ReturnResult<Boolean> deleteVideoType(@PathVariable String id) {
        boolean result = videoTypeService.deleteVideoType(id);
        return result ? ReturnResult.success(true) : ReturnResult.error("删除失败");
    }
    
    /**
     * 批量删除视频类型
     *
     * @param ids 视频类型ID列表
     * @return 删除结果
     */
    @DeleteMapping("/batch")
    @Operation(summary = "批量删除视频类型")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:type:list", "video:type:detail"}, allEntries = true)
    public ReturnResult<Boolean> batchDeleteVideoTypes(@RequestBody List<String> ids) {
        boolean result = videoTypeService.batchDeleteVideoTypes(ids);
        return result ? ReturnResult.success(true) : ReturnResult.error("批量删除失败");
    }
}