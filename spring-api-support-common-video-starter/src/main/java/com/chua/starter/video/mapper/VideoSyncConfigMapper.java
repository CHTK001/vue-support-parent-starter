package com.chua.starter.video.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.video.entity.VideoSyncConfig;
import org.apache.ibatis.annotations.Mapper;

/**
 * 视频同步配置Mapper
 * @author CH
 * @since 2024/6/21
 */
@Mapper
public interface VideoSyncConfigMapper extends BaseMapper<VideoSyncConfig> {
}