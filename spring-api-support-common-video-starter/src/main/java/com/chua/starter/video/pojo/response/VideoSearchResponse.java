package com.chua.starter.video.pojo.response;

import com.chua.starter.video.entity.VideoInfo;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 视频搜索响应
 * @author CH
 * @since 2024/6/21
 */
@Data
@ApiModel(description = "视频搜索响应")
public class VideoSearchResponse implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 视频列表数据
     */
    @ApiModelProperty(value = "视频列表数据")
    private List<VideoInfo> data;
    
    /**
     * 总记录数
     */
    @ApiModelProperty(value = "总记录数")
    private Long total;
    
    /**
     * 是否有更多数据
     */
    @ApiModelProperty(value = "是否有更多数据")
    private Boolean hasMore;
    
    /**
     * 计算是否有更多数据
     * @param page 当前页码
     * @param pageSize 每页大小
     * @return 是否有更多数据
     */
    public Boolean calculateHasMore(Integer page, Integer pageSize) {
        if (total == null || page == null || pageSize == null) {
            return false;
        }
        return page * pageSize < total;
    }
}