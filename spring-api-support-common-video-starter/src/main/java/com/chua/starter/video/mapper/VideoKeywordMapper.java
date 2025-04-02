package com.chua.starter.video.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.video.entity.VideoKeyword;
import org.apache.ibatis.annotations.Mapper;

/**
 * 视频热门搜索关键词Mapper接口
 */
@Mapper
public interface VideoKeywordMapper extends BaseMapper<VideoKeyword> {
}