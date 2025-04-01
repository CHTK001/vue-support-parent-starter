package com.chua.starter.video.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.starter.mybatis.pojo.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 视频评分
 */
@ApiModel(description="视频评分")
@Schema(description="视频评分")
@Data
@EqualsAndHashCode(callSuper=true)
@TableName(value = "video_mark")
public class VideoMark extends SysBase {
    @TableId(value = "video_mark_id", type = IdType.AUTO)
    @ApiModelProperty(value="")
    @Schema(description="")
    private Integer videoMarkId;

    /**
     * 视频ID
     */
    @TableField(value = "video_id")
    @ApiModelProperty(value="视频ID")
    @Schema(description="视频ID")
    private Integer videoId;

    /**
     * 评分类型
     */
    @TableField(value = "video_mark_type")
    @ApiModelProperty(value="评分类型")
    @Schema(description="评分类型")
    private String videoMarkType;

    /**
     * 评分
     */
    @TableField(value = "video_mark_score")
    @ApiModelProperty(value="评分")
    @Schema(description="评分")
    private BigDecimal videoMarkScore;

    /**
     * 人数
     */
    @TableField(value = "video_mark_people")
    @ApiModelProperty(value="人数")
    @Schema(description="人数")
    private Integer videoMarkPeople;
}