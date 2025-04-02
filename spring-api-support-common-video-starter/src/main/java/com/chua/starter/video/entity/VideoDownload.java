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
 * 视频下载链接表
 */
@ApiModel(description = "视频下载链接表")
@Schema(description = "视频下载链接表")
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "video_download")
public class VideoDownload extends SysBase {
    /**
     * 下载ID
     */
    @TableId(value = "video_download_id", type = IdType.AUTO)
    @ApiModelProperty(value = "下载ID")
    @Schema(description = "下载ID")
    private String videoDownloadId;

    /**
     * 视频ID
     */
    @TableField(value = "video_download_video_id")
    @ApiModelProperty(value = "视频ID")
    @Schema(description = "视频ID")
    private String videoDownloadVideoId;

    /**
     * 下载地址
     */
    @TableField(value = "video_download_url")
    @ApiModelProperty(value = "下载地址")
    @Schema(description = "下载地址")
    private String videoDownloadUrl;
    /**
     * 下载名称
     */
    @TableField(value = "video_download_name")
    @ApiModelProperty(value = "下载名称")
    @Schema(description = "下载名称")
    private String videoDownloadName;

    /**
     * 下载类型
     */
    @TableField(value = "video_download_type")
    @ApiModelProperty(value = "下载类型")
    @Schema(description = "下载类型")
    private String videoDownloadType;

    /**
     * 视频质量(标清/高清/超清)
     */
    @TableField(value = "video_download_quality")
    @ApiModelProperty(value = "视频质量(标清/高清/超清)")
    @Schema(description = "视频质量(标清/高清/超清)")
    private String videoDownloadQuality;

    /**
     * 文件大小(字节)
     */
    @TableField(value = "video_download_size")
    @ApiModelProperty(value = "文件大小")
    @Schema(description = "文件大小")
    private String videoDownloadSize;
    /**
     * 磁力链接
     */
    @TableField(value = "video_download_magnetic")
    @ApiModelProperty(value = "磁力链接")
    @Schema(description = "磁力链接")
    private String videoDownloadMagnetic;

    /**
     * 下载状态(1:可用,0:不可用)
     */
    @TableField(value = "video_download_status")
    @ApiModelProperty(value = "下载状态(1:可用,0:不可用)")
    @Schema(description = "下载状态(1:可用,0:不可用)")
    private Byte videoDownloadStatus;

    /**
     * 下载次数
     */
    @TableField(value = "video_download_count")
    @ApiModelProperty(value = "下载次数")
    @Schema(description = "下载次数")
    private Integer videoDownloadCount;

    /**
     * 分享时间
     */
    @TableField(value = "video_download_share_time")
    @ApiModelProperty(value = "分享时间")
    @Schema(description = "分享时间")
    private String videoDownloadShareTime;
}