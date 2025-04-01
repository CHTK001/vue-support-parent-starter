package com.chua.starter.video.pojo.response;

import com.chua.starter.video.entity.VideoDownload;
import com.chua.starter.video.entity.VideoInfo;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 视频详情响应
 * @author CH
 * @since 2024/6/21
 */
@Data
@ApiModel(description = "视频详情响应")
public class VideoDetailResponse implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @ApiModelProperty(value = "视频ID")
    private String videoId;
    
    @ApiModelProperty(value = "视频标题")
    private String videoTitle;
    
    @ApiModelProperty(value = "视频描述")
    private String videoDescription;
    
    @ApiModelProperty(value = "视频URL")
    private String videoUrl;
    
    @ApiModelProperty(value = "视频封面")
    private String videoCover;
    
    @ApiModelProperty(value = "视频作者")
    private String videoAuthor;
    
    @ApiModelProperty(value = "视频类型")
    private String videoType;
    
    @ApiModelProperty(value = "视频平台")
    private String videoPlatform;
    
    @ApiModelProperty(value = "视频时长(秒)")
    private Integer videoDuration;
    
    @ApiModelProperty(value = "观看次数")
    private Integer videoViews;
    
    @ApiModelProperty(value = "点赞数")
    private Integer videoLikes;
    
    @ApiModelProperty(value = "视频状态(0:未审核,1:已审核)")
    private Integer videoStatus;
    
    @ApiModelProperty(value = "创建时间")
    private LocalDateTime createTime;
    
    @ApiModelProperty(value = "更新时间")
    private LocalDateTime updateTime;
    
    @ApiModelProperty(value = "下载信息列表")
    private List<VideoDownload> downloadList;
    
    /**
     * 从VideoInfo构建响应
     *
     * @param videoInfo 视频信息
     * @param downloads 下载信息列表
     * @return 视频详情响应
     */
    public static VideoDetailResponse fromVideoInfo(VideoInfo videoInfo, List<VideoDownload> downloads) {
        VideoDetailResponse response = new VideoDetailResponse();
        response.setVideoId(videoInfo.getVideoId());
        response.setVideoTitle(videoInfo.getVideoTitle());
        response.setVideoDescription(videoInfo.getVideoDescription());
        response.setVideoUrl(videoInfo.getVideoUrl());
        response.setVideoCover(videoInfo.getVideoCover());
        response.setVideoAuthor(videoInfo.getVideoAuthor());
        response.setVideoType(videoInfo.getVideoType());
        response.setVideoPlatform(videoInfo.getVideoPlatform());
        response.setVideoDuration(videoInfo.getVideoDuration());
        response.setVideoViews(videoInfo.getVideoViews());
        response.setVideoLikes(videoInfo.getVideoLikes());
        response.setVideoStatus(videoInfo.getVideoStatus());
        response.setCreateTime(videoInfo.getCreateTime());
        response.setUpdateTime(videoInfo.getUpdateTime());
        response.setDownloadList(downloads);
        return response;
    }
}