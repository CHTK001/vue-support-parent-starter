package com.chua.starter.video.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.video.entity.VideoSyncConfig;
import com.chua.starter.video.service.VideoSyncConfigService;
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
 * 视频同步配置接口
 * @author CH
 * @since 2024/6/21
 */
@RestController
@RequestMapping("v1/video/sync/config")
@Tag(name = "视频同步配置接口")
@Api(tags = "视频同步配置接口")
@RequiredArgsConstructor
@Slf4j
public class VideoSyncConfigController {
    
    private final VideoSyncConfigService videoSyncConfigService;
    
    /**
     * 获取所有同步配置
     *
     * @return 同步配置列表
     */
    @GetMapping("/list")
    @Operation(summary = "获取所有同步配置")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:sync:config:list", unless = "#result.data == null")
    public ReturnResult<List<VideoSyncConfig>> getAllConfigs() {
        List<VideoSyncConfig> configs = videoSyncConfigService.getAllConfigs();
        return ReturnResult.success(configs);
    }
    
    /**
     * 获取同步配置详情
     *
     * @param id 配置ID
     * @return 同步配置详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取同步配置详情")
    @Cacheable(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = "video:sync:config:detail", key = "#id", unless = "#result.data == null")
    public ReturnResult<VideoSyncConfig> getConfigById(@PathVariable String id) {
        VideoSyncConfig config = videoSyncConfigService.getConfigById(id);
        if (config == null) {
            return ReturnResult.error("同步配置不存在");
        }
        return ReturnResult.success(config);
    }
    
    /**
     * 添加同步配置
     *
     * @param config 同步配置
     * @return 添加结果
     */
    @PostMapping("/add")
    @Operation(summary = "添加同步配置")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:sync:config:list", "video:sync:config:detail"}, allEntries = true)
    public ReturnResult<Boolean> addConfig(@RequestBody VideoSyncConfig config) {
        boolean result = videoSyncConfigService.addConfig(config);
        return result ? ReturnResult.success(true) : ReturnResult.error("添加失败");
    }
    
    /**
     * 修改同步配置
     *
     * @param config 同步配置
     * @return 修改结果
     */
    @PutMapping("/update")
    @Operation(summary = "修改同步配置")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:sync:config:list", "video:sync:config:detail"}, allEntries = true)
    public ReturnResult<Boolean> updateConfig(@RequestBody VideoSyncConfig config) {
        if (config.getVideoSyncConfigId() == null) {
            return ReturnResult.error("配置ID不能为空");
        }
        
        boolean result = videoSyncConfigService.updateConfig(config);
        return result ? ReturnResult.success(true) : ReturnResult.error("修改失败");
    }
    
    /**
     * 删除同步配置
     *
     * @param id 配置ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除同步配置")
    @CacheEvict(cacheManager = REDIS_CACHE_ALWAYS, cacheNames = {"video:sync:config:list", "video:sync:config:detail"}, allEntries = true)
    public ReturnResult<Boolean> deleteConfig(@PathVariable String id) {
        boolean result = videoSyncConfigService.deleteConfig(id);
        return result ? ReturnResult.success(true) : ReturnResult.error("删除失败");
    }
}