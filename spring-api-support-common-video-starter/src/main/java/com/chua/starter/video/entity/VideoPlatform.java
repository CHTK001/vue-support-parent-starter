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
 * 视频平台表
 */
@ApiModel(description="视频平台表")
@Schema(description="视频平台表")
@Data
@EqualsAndHashCode(callSuper=true)
@TableName(value = "video_platform")
public class VideoPlatform extends SysBase {
    
    /**
     * 视频平台ID
     */
    @TableId(value = "video_platform_id", type = IdType.AUTO)
    @ApiModelProperty(value="视频平台ID")
    @Schema(description="视频平台ID")
    private String videoPlatformId;
    
    /**
     * 视频平台名称
     */
    @TableField(value = "video_platform_name")
    @ApiModelProperty(value="视频平台名称")
    @Schema(description="视频平台名称")
    private String videoPlatformName;
    
    /**
     * 视频平台图标
     */
    @TableField(value = "video_platform_icon")
    @ApiModelProperty(value="视频平台图标")
    @Schema(description="视频平台图标")
    private String videoPlatformIcon;
    
    /**
     * 视频平台排序
     */
    @TableField(value = "video_platform_sort")
    @ApiModelProperty(value="视频平台排序")
    @Schema(description="视频平台排序")
    private Integer videoPlatformSort;
    
    /**
     * 视频平台状态：0-禁用，1-启用
     */
    @TableField(value = "video_platform_status")
    @ApiModelProperty(value="视频平台状态：0-禁用，1-启用")
    @Schema(description="视频平台状态：0-禁用，1-启用")
    private Integer videoPlatformStatus;
}