package com.chua.starter.video.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.starter.mybatis.pojo.SysBase;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 视频同步配置
 * @author CH
 * @since 2024/6/21
 */
@EqualsAndHashCode(callSuper = true)
@Data
@TableName("video_sync_config")
@Schema(description = "视频同步配置")
public class VideoSyncConfig extends SysBase {
    
    /**
     * 主键ID
     */
    @TableId(value = "video_sync_config_id", type = IdType.ASSIGN_UUID)
    @Schema(description = "配置ID")
    private String videoSyncConfigId;
    
    /**
     * 同步名称
     */
    @TableField("video_sync_config_name")
    @Schema(description = "同步名称")
    private String videoSyncConfigName;
    
    /**
     * 同步方式
     */
    @TableField("video_sync_config_type")
    @Schema(description = "同步方式")
    private String videoSyncConfigType;
    
    /**
     * 同步地址
     */
    @TableField("video_sync_config_url")
    @Schema(description = "同步地址")
    private String videoSyncConfigUrl;
    
    /**
     * 同步密钥
     */
    @TableField("video_sync_config_key")
    @Schema(description = "同步密钥")
    private String videoSyncConfigKey;
    
    /**
     * 同步Cookie
     */
    @TableField("video_sync_config_cookie")
    @Schema(description = "同步Cookie")
    private String videoSyncConfigCookie;
    
    /**
     * 额外参数(JSON格式)
     */
    @TableField("video_sync_config_extra")
    @Schema(description = "额外参数")
    private String videoSyncConfigExtra;
    
    /**
     * 是否启用
     */
    @TableField("video_sync_config_enabled")
    @Schema(description = "是否启用")
    private Boolean videoSyncConfigEnabled;

    /**
     * 同步来源(用于SPI实现类型)
     */
    @TableField("video_sync_config_source")
    @Schema(description = "同步来源")
    private String videoSyncConfigSource;
}