package com.chua.starter.video.pojo.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;

/**
 * 视频搜索请求
 * @author CH
 * @since 2024/6/21
 */
@Data
@ApiModel(description = "视频搜索请求")
public class VideoSearchRequest implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 关键词
     */
    @ApiModelProperty(value = "关键词")
    private String keyword;
    
    /**
     * 选中的视频类型ID
     */
    @ApiModelProperty(value = "选中的视频类型ID")
    private String selectedType;
    
    /**
     * 平台ID
     */
    @ApiModelProperty(value = "平台ID")
    private String platformId;
    
    /**
     * 年份筛选
     */
    @ApiModelProperty(value = "年份筛选，多个用逗号分隔")
    private String yearFilter;
    
    /**
     * 地区筛选
     */
    @ApiModelProperty(value = "地区筛选，多个用逗号分隔")
    private String regionFilter;
    
    /**
     * 语言筛选
     */
    @ApiModelProperty(value = "语言筛选，多个用逗号分隔")
    private String languageFilter;
    
    /**
     * 排序方式
     */
    @ApiModelProperty(value = "排序方式：newest(最新上线)、popular(最热门)、rating(评分最高)")
    private String sortBy = "newest";
    
    /**
     * 页码
     */
    @ApiModelProperty(value = "页码", example = "1")
    private Integer page = 1;
    
    /**
     * 每页大小
     */
    @ApiModelProperty(value = "每页大小", example = "10")
    private Integer pageSize = 10;
}