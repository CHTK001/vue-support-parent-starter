package com.chua.starter.video.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.video.entity.VideoPlatform;
import org.apache.ibatis.annotations.Mapper;

/**
 * 视频平台Mapper接口
 */
@Mapper
public interface VideoPlatformMapper extends BaseMapper<VideoPlatform> {
}