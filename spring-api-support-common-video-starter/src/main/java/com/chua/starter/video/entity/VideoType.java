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
 * 视频类型表
 */
@ApiModel(description="视频类型表")
@Schema(description="视频类型表")
@Data
@EqualsAndHashCode(callSuper=true)
@TableName(value = "video_type")
public class VideoType extends SysBase {
    
    /**
     * 视频类型ID
     */
    @TableId(value = "video_type_id", type = IdType.AUTO)
    @ApiModelProperty(value="视频类型ID")
    @Schema(description="视频类型ID")
    private String videoTypeId;
    
    /**
     * 视频类型名称
     */
    @TableField(value = "video_type_name")
    @ApiModelProperty(value="视频类型名称")
    @Schema(description="视频类型名称")
    private String videoTypeName;
    
    /**
     * 视频类型排序
     */
    @TableField(value = "video_type_sort")
    @ApiModelProperty(value="视频类型排序")
    @Schema(description="视频类型排序")
    private Integer videoTypeSort;
    
    /**
     * 视频类型状态：0-禁用，1-启用
     */
    @TableField(value = "video_type_status")
    @ApiModelProperty(value="视频类型状态：0-禁用，1-启用")
    @Schema(description="视频类型状态：0-禁用，1-启用")
    private Integer videoTypeStatus;
}