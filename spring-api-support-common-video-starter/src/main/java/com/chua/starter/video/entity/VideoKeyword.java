package com.chua.starter.video.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.starter.mybatis.pojo.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 视频热门搜索关键词表
 */
@ApiModel(description="视频热门搜索关键词表")
@Schema(description="视频热门搜索关键词表")
@Data
@EqualsAndHashCode(callSuper=true)
@TableName(value = "video_keyword")
public class VideoKeyword extends SysBase {
    
    /**
     * 关键词ID
     */
    @TableId(value = "video_keyword_id", type = IdType.AUTO)
    @ApiModelProperty(value="关键词ID")
    @Schema(description="关键词ID")
    private String videoKeywordId;
    
    /**
     * 关键词内容
     */
    @TableField(value = "video_keyword_content")
    @ApiModelProperty(value="关键词内容")
    @Schema(description="关键词内容")
    private String videoKeywordContent;
    
    /**
     * 关键词热度
     */
    @TableField(value = "video_keyword_hot")
    @ApiModelProperty(value="关键词热度")
    @Schema(description="关键词热度")
    private Integer videoKeywordHot;
    
    /**
     * 关键词排序
     */
    @TableField(value = "video_keyword_sort")
    @ApiModelProperty(value="关键词排序")
    @Schema(description="关键词排序")
    private Integer videoKeywordSort;
    
    /**
     * 关键词状态：0-禁用，1-启用
     */
    @TableField(value = "video_keyword_status")
    @ApiModelProperty(value="关键词状态：0-禁用，1-启用")
    @Schema(description="关键词状态：0-禁用，1-启用")
    private Integer videoKeywordStatus;
}