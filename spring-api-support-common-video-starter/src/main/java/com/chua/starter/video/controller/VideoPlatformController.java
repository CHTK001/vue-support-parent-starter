package com.chua.starter.video.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.video.entity.VideoPlatform;
import com.chua.starter.video.service.VideoPlatformService;
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
 * 视频平台接口
 * @author CH
 * @since 2024/6/21
 */
@RestController
@RequestMapping("v1/video/platform")
@Tag(name = "视频平台接口")
@Api(tags = "视频平台接口")
@RequiredArgsConstructor
@Slf4j
public class VideoPlatformController {
    
    private final VideoPlatformService videoPlatformService;
    
    /**
     * 获取视频平台列表
     *
     * @return 视频平台列表
     */
    @GetMapping("/list")
    @Operation(summary = "获取视频平台列表")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:platform:list", keyGenerator = "customTenantedKeyGenerator")
    public ReturnResult<List<VideoPlatform>> getVideoPlatforms() {
        List<VideoPlatform> platforms = videoPlatformService.getVideoPlatforms();
        return ReturnResult.success(platforms);
    }
    
    /**
     * 分页查询视频平台
     *
     * @param page 页码
     * @param pageSize 每页数量
     * @param keyword 关键词
     * @return 分页结果
     */
    @GetMapping("/page")
    @Operation(summary = "分页查询视频平台")
    public ReturnResult<Page<VideoPlatform>> pageVideoPlatforms(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        
        Page<VideoPlatform> result = videoPlatformService.pageVideoPlatforms(page, pageSize, keyword);
        return ReturnResult.success(result);
    }
    
    /**
     * 获取视频平台详情
     *
     * @param id 视频平台ID
     * @return 视频平台详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取视频平台详情")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:platform:detail", key = "#id", unless = "#result.data == null")
    public ReturnResult<VideoPlatform> getVideoPlatformById(@PathVariable String id) {
        VideoPlatform videoPlatform = videoPlatformService.getVideoPlatformById(id);
        if (videoPlatform == null) {
            return ReturnResult.error("视频平台不存在");
        }
        return ReturnResult.success(videoPlatform);
    }
    
    /**
     * 添加视频平台
     *
     * @param videoPlatform 视频平台信息
     * @return 添加结果
     */
    @PostMapping("/add")
    @Operation(summary = "添加视频平台")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:platform:list", "video:platform:detail"}, allEntries = true)
    public ReturnResult<Boolean> addVideoPlatform(@RequestBody VideoPlatform videoPlatform) {
        boolean result = videoPlatformService.addVideoPlatform(videoPlatform);
        return result ? ReturnResult.success(true) : ReturnResult.error("添加失败");
    }
    
    /**
     * 修改视频平台
     *
     * @param videoPlatform 视频平台信息
     * @return 修改结果
     */
    @PutMapping("/update")
    @Operation(summary = "修改视频平台")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:platform:list", "video:platform:detail"}, allEntries = true)
    public ReturnResult<Boolean> updateVideoPlatform(@RequestBody VideoPlatform videoPlatform) {
        if (videoPlatform.getVideoPlatformId() == null) {
            return ReturnResult.error("视频平台ID不能为空");
        }
        
        boolean result = videoPlatformService.updateVideoPlatform(videoPlatform);
        return result ? ReturnResult.success(true) : ReturnResult.error("修改失败");
    }
    
    /**
     * 删除视频平台
     *
     * @param id 视频平台ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除视频平台")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:platform:list", "video:platform:detail"}, allEntries = true)
    public ReturnResult<Boolean> deleteVideoPlatform(@PathVariable String id) {
        boolean result = videoPlatformService.deleteVideoPlatform(id);
        return result ? ReturnResult.success(true) : ReturnResult.error("删除失败");
    }
    
    /**
     * 批量删除视频平台
     *
     * @param ids 视频平台ID列表
     * @return 删除结果
     */
    @DeleteMapping("/batch")
    @Operation(summary = "批量删除视频平台")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:platform:list", "video:platform:detail"}, allEntries = true)
    public ReturnResult<Boolean> batchDeleteVideoPlatforms(@RequestBody List<String> ids) {
        boolean result = videoPlatformService.batchDeleteVideoPlatforms(ids);
        return result ? ReturnResult.success(true) : ReturnResult.error("批量删除失败");
    }
}