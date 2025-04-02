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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 视频表
 */
@ApiModel(description="视频表")
@Schema(description="视频表")
@Data
@EqualsAndHashCode(callSuper=true)
@TableName(value = "video_info")
public class VideoInfo extends SysBase {
    /**
     * 视频唯一标识ID
     */
    @TableId(value = "video_id", type = IdType.AUTO)
    @ApiModelProperty(value="视频唯一标识ID")
    @Schema(description="视频唯一标识ID")
    private String videoId;

    /**
     * 视频标题
     */
    @TableField(value = "video_title")
    @ApiModelProperty(value="视频标题")
    @Schema(description="视频标题")
    private String videoTitle;
    /**
     * 视频名称
     */
    @TableField(value = "video_name")
    @ApiModelProperty(value="视频名称")
    @Schema(description="视频名称")
    private String videoName;
    /**
     * 视频别名
     */
    @TableField(value = "video_alias_name")
    @ApiModelProperty(value="视频别名")
    @Schema(description="视频别名")
    private String videoAliasName;

    /**
     * 视频评分
     */
    @TableField(value = "video_score")
    @ApiModelProperty(value="视频评分")
    @Schema(description="视频评分")
    private BigDecimal videoScore;

    /**
     * 视频年份
     */
    @TableField(value = "video_year")
    @ApiModelProperty(value="视频年份")
    @Schema(description="视频年份")
    private Integer videoYear;
    /**
     * 视频所属平台
     */
    @TableField(value = "video_platform")
    @ApiModelProperty(value="视频所属平台")
    @Schema(description="视频所属平台")
    private String videoPlatform;
    /**
     * 视频语言
     */
    @TableField(value = "video_language")
    @ApiModelProperty(value="视频语言")
    @Schema(description="视频语言")
    private String videoLanguage;
    /**
     * 视频清晰度
     */
    @TableField(value = "video_quality")
    @ApiModelProperty(value="视频清晰度")
    @Schema(description="视频清晰度")
    private String videoQuality;

    /**
     * 视频缩略图URL
     */
    @TableField(value = "video_thumbnail")
    @ApiModelProperty(value="视频缩略图URL")
    @Schema(description="视频缩略图URL")
    private String videoThumbnail;

    /**
     * 视频封面URL
     */
    @TableField(value = "video_cover")
    @ApiModelProperty(value="视频封面URL")
    @Schema(description="视频封面URL")
    private String videoCover;

    /**
     * 视频播放地址
     */
    @TableField(value = "video_url")
    @ApiModelProperty(value="视频播放地址")
    @Schema(description="视频播放地址")
    private String videoUrl;

    /**
     * 视频观看次数
     */
    @TableField(value = "video_views")
    @ApiModelProperty(value="视频观看次数")
    @Schema(description="视频观看次数")
    private BigDecimal videoViews;
    /**
     * 视频点赞数
     */
    @TableField(value = "video_likes")
    @ApiModelProperty(value="视频点赞数")
    @Schema(description="视频点赞数")
    private Integer videoLikes;

    /**
     * 视频状态
     */
    @TableField(value = "video_status")
    @ApiModelProperty(value="视频状态是否禁用;0:启用")
    @Schema(description="视频状态")
    private Integer videoStatus;
    /**
     * 视频时长
     */
    @TableField(value = "video_duration")
    @ApiModelProperty(value="视频时长(分)")
    @Schema(description="视频时长")
    private Integer videoDuration;
    /**
     * 豆瓣视频ID
     */
    @TableField(value = "video_dou_ban_id")
    @ApiModelProperty(value="豆瓣视频ID")
    @Schema(description="豆瓣视频ID")
    private String videoDouBanId;

    /**
     * 视频发布日期
     */
    @TableField(value = "video_publish_date")
    @ApiModelProperty(value="视频发布日期")
    @Schema(description="视频发布日期")
    private LocalDateTime videoPublishDate;

    /**
     * 视频类型
     */
    @TableField(value = "video_type")
    @ApiModelProperty(value="视频类型")
    @Schema(description="视频类型")
    private String videoType;
    /**
     * 视频上映日期
     */
    @TableField(value = "video_release")
    @ApiModelProperty(value="视频上映日期")
    @Schema(description="视频上映日期")
    private String videoRelease;
    /**
     * 视频地区
     */
    @TableField(value = "video_district")
    @ApiModelProperty(value="视频地区")
    @Schema(description="视频地区")
    private String videoDistrict;

    /**
     * 视频文件大小
     */
    @TableField(value = "video_size")
    @ApiModelProperty(value="视频文件大小")
    @Schema(description="视频文件大小")
    private String videoSize;

    /**
     * 视频分辨率
     */
    @TableField(value = "video_resolution")
    @ApiModelProperty(value="视频分辨率")
    @Schema(description="视频分辨率")
    private String videoResolution;

    /**
     * 视频作者
     */
    @TableField(value = "video_author")
    @ApiModelProperty(value="视频作者")
    @Schema(description="视频作者")
    private String videoAuthor;
    /**
     * 视频导演
     */
    @TableField(value = "video_director")
    @ApiModelProperty(value="视频导演")
    @Schema(description="视频导演")
    private String videoDirector;
    /**
     * 视频编剧
     */
    @TableField(value = "video_writer")
    @ApiModelProperty(value="视频编剧")
    @Schema(description="视频编剧")
    private String videoWriter;
    /**
     * 视频演员
     */
    @TableField(value = "video_actor")
    @ApiModelProperty(value="视频主演")
    @Schema(description="视频主演")
    private String videoActor;

    /**
     * 视频描述内容
     */
    @TableField(value = "video_description")
    @ApiModelProperty(value="视频描述内容")
    @Schema(description="视频描述内容")
    private String videoDescription;

    /**
     * 视频下载地址
     */
    @TableField(value = "video_download_url")
    @ApiModelProperty(value="视频下载地址")
    @Schema(description="视频下载地址")
    private String videoDownloadUrl;


    /**
     * 视频标签
     */
    @TableField(exist = false)
    @ApiModelProperty(value="视频标签")
    @Schema(description="视频标签")
    private List<VideoMark> videoMarkList;
}