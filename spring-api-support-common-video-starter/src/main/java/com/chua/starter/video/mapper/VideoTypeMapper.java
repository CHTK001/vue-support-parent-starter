package com.chua.starter.video.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.video.entity.VideoType;
import org.apache.ibatis.annotations.Mapper;

/**
 * 视频类型Mapper接口
 */
@Mapper
public interface VideoTypeMapper extends BaseMapper<VideoType> {
}