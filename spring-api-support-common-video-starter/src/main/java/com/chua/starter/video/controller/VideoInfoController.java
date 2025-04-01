package com.chua.starter.video.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.video.entity.VideoDownload;
import com.chua.starter.video.entity.VideoInfo;
import com.chua.starter.video.pojo.request.VideoSearchRequest;
import com.chua.starter.video.pojo.response.VideoDetailResponse;
import com.chua.starter.video.pojo.response.VideoSearchResponse;
import com.chua.starter.video.service.VideoDownloadService;
import com.chua.starter.video.service.VideoInfoService;
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
 * 视频信息接口
 * @author CH
 * @since 2024/6/21
 */
@RestController
@RequestMapping("v1/video/info")
@Tag(name = "视频信息接口")
@Api(tags = "视频信息接口")
@RequiredArgsConstructor
@Slf4j
public class VideoInfoController {
    
    private final VideoInfoService videoInfoService;
    private final VideoDownloadService videoDownloadService;
    
    /**
     * 视频搜索与分页查询
     *
     * @param request 搜索参数
     * @return 搜索结果
     */
    @PostMapping("/search")
    @Operation(summary = "视频搜索与分页查询")
    public ReturnResult<VideoSearchResponse> searchVideos(@RequestBody VideoSearchRequest request) {
        VideoSearchResponse response = videoInfoService.searchVideos(request);
        return ReturnResult.success(response);
    }
    
    /**
     * 获取视频详情
     *
     * @param id 视频ID
     * @return 视频详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取视频详情")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:info:detail", key = "#id", unless = "#result.data == null")
    public ReturnResult<VideoDetailResponse> getVideoById(@PathVariable String id) {
        VideoInfo videoInfo = videoInfoService.getVideoById(id);
        if (videoInfo == null) {
            return ReturnResult.error("视频不存在");
        }
        
        // 获取视频下载信息
        List<VideoDownload> downloads = videoDownloadService.getDownloadsByVideoId(id);
        
        // 构建详情响应
        VideoDetailResponse response = VideoDetailResponse.fromVideoInfo(videoInfo, downloads);
        
        return ReturnResult.success(response);
    }
    
    /**
     * 添加视频
     *
     * @param videoInfo 视频信息
     * @return 添加结果
     */
    @PostMapping("/add")
    @Operation(summary = "添加视频")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:info:list", "video:info:detail"}, allEntries = true)
    public ReturnResult<Boolean> addVideo(@RequestBody VideoInfo videoInfo) {
        boolean result = videoInfoService.addVideo(videoInfo);
        return result ? ReturnResult.success(true) : ReturnResult.error("添加失败");
    }
    
    /**
     * 修改视频
     *
     * @param videoInfo 视频信息
     * @return 修改结果
     */
    @PutMapping("/update")
    @Operation(summary = "修改视频")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:info:list", "video:info:detail"}, allEntries = true)
    public ReturnResult<Boolean> updateVideo(@RequestBody VideoInfo videoInfo) {
        if (videoInfo.getVideoId() == null) {
            return ReturnResult.error("视频ID不能为空");
        }
        
        boolean result = videoInfoService.updateVideo(videoInfo);
        return result ? ReturnResult.success(true) : ReturnResult.error("修改失败");
    }
    
    /**
     * 删除视频
     *
     * @param videoId 视频ID
     * @return 删除结果
     */
    @DeleteMapping("/{videoId}")
    @Operation(summary = "删除视频")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:info:list", "video:info:detail"}, allEntries = true)
    public ReturnResult<Boolean> deleteVideo(@PathVariable String videoId) {
        boolean result = videoInfoService.deleteVideo(videoId);
        return result ? ReturnResult.success(true) : ReturnResult.error("删除失败");
    }
}
