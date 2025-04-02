package com.chua.starter.video.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.video.entity.VideoKeyword;
import com.chua.starter.video.service.VideoKeywordService;
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
 * 视频关键词接口
 * @author CH
 * @since 2024/6/21
 */
@RestController
@RequestMapping("v1/video/keyword")
@Tag(name = "视频关键词接口")
@Api(tags = "视频关键词接口")
@RequiredArgsConstructor
@Slf4j
public class VideoKeywordController {
    
    private final VideoKeywordService videoKeywordService;
    
    /**
     * 获取热门搜索关键词
     *
     * @return 热门搜索关键词列表
     */
    @GetMapping("/hot")
    @Operation(summary = "获取热门搜索关键词")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:keyword:hot", keyGenerator = "customTenantedKeyGenerator")
    public ReturnResult<List<VideoKeyword>> getHotKeywords() {
        List<VideoKeyword> keywords = videoKeywordService.getHotKeywords(10);
        return ReturnResult.success(keywords);
    }
    
    /**
     * 分页查询视频关键词
     *
     * @param page 页码
     * @param pageSize 每页数量
     * @param keyword 关键词
     * @return 分页结果
     */
    @GetMapping("/page")
    @Operation(summary = "分页查询视频关键词")
    public ReturnResult<Page<VideoKeyword>> pageVideoKeywords(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        
        Page<VideoKeyword> result = videoKeywordService.pageVideoKeywords(page, pageSize, keyword);
        return ReturnResult.success(result);
    }
    
    /**
     * 获取视频关键词详情
     *
     * @param id 视频关键词ID
     * @return 视频关键词详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取视频关键词详情")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:keyword:detail", key = "#id", unless = "#result.data == null")
    public ReturnResult<VideoKeyword> getVideoKeywordById(@PathVariable String id) {
        VideoKeyword videoKeyword = videoKeywordService.getVideoKeywordById(id);
        if (videoKeyword == null) {
            return ReturnResult.error("视频关键词不存在");
        }
        return ReturnResult.success(videoKeyword);
    }
    
    /**
     * 添加视频关键词
     *
     * @param videoKeyword 视频关键词信息
     * @return 添加结果
     */
    @PostMapping("/add")
    @Operation(summary = "添加视频关键词")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:keyword:hot", "video:keyword:detail"}, allEntries = true)
    public ReturnResult<Boolean> addVideoKeyword(@RequestBody VideoKeyword videoKeyword) {
        boolean result = videoKeywordService.addVideoKeyword(videoKeyword);
        return result ? ReturnResult.success(true) : ReturnResult.error("添加失败");
    }
    
    /**
     * 修改视频关键词
     *
     * @param videoKeyword 视频关键词信息
     * @return 修改结果
     */
    @PutMapping("/update")
    @Operation(summary = "修改视频关键词")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:keyword:hot", "video:keyword:detail"}, allEntries = true)
    public ReturnResult<Boolean> updateVideoKeyword(@RequestBody VideoKeyword videoKeyword) {
        if (videoKeyword.getVideoKeywordId() == null) {
            return ReturnResult.error("视频关键词ID不能为空");
        }
        
        boolean result = videoKeywordService.updateVideoKeyword(videoKeyword);
        return result ? ReturnResult.success(true) : ReturnResult.error("修改失败");
    }
    
    /**
     * 删除视频关键词
     *
     * @param id 视频关键词ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除视频关键词")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:keyword:hot", "video:keyword:detail"}, allEntries = true)
    public ReturnResult<Boolean> deleteVideoKeyword(@PathVariable String id) {
        boolean result = videoKeywordService.deleteVideoKeyword(id);
        return result ? ReturnResult.success(true) : ReturnResult.error("删除失败");
    }
    
    /**
     * 批量删除视频关键词
     *
     * @param ids 视频关键词ID列表
     * @return 删除结果
     */
    @DeleteMapping("/batch")
    @Operation(summary = "批量删除视频关键词")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:keyword:hot", "video:keyword:detail"}, allEntries = true)
    public ReturnResult<Boolean> batchDeleteVideoKeywords(@RequestBody List<String> ids) {
        boolean result = videoKeywordService.batchDeleteVideoKeywords(ids);
        return result ? ReturnResult.success(true) : ReturnResult.error("批量删除失败");
    }
}