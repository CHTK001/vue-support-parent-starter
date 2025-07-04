package com.chua.starter.monitor.starter.pojo;

import com.chua.starter.monitor.starter.enums.AlertLevel;
import com.chua.starter.monitor.starter.enums.AlertType;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 告警通知请求实体类
 *
 * @author CH
 * @since 2024/12/27
 */
@ApiModel(description = "告警通知请求")
@Schema(description = "告警通知请求")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertNotificationRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 服务器ID
     */
    @ApiModelProperty(value = "服务器ID")
    @Schema(description = "服务器ID")
    private Integer serverId;

    /**
     * 服务器名称
     */
    @ApiModelProperty(value = "服务器名称")
    @Schema(description = "服务器名称")
    private String serverName;

    /**
     * 服务器主机地址
     */
    @ApiModelProperty(value = "服务器主机地址")
    @Schema(description = "服务器主机地址")
    private String serverHost;

    /**
     * 告警类型
     */
    @ApiModelProperty(value = "告警类型")
    @Schema(description = "告警类型")
    private AlertType alertType;

    /**
     * 告警级别
     */
    @ApiModelProperty(value = "告警级别")
    @Schema(description = "告警级别")
    private AlertLevel alertLevel;

    /**
     * 告警标题
     */
    @ApiModelProperty(value = "告警标题")
    @Schema(description = "告警标题")
    private String title;

    /**
     * 告警消息
     */
    @ApiModelProperty(value = "告警消息")
    @Schema(description = "告警消息")
    private String message;

    /**
     * 当前值
     */
    @ApiModelProperty(value = "当前值")
    @Schema(description = "当前值")
    private BigDecimal currentValue;

    /**
     * 阈值
     */
    @ApiModelProperty(value = "阈值")
    @Schema(description = "阈值")
    private BigDecimal thresholdValue;

    /**
     * 单位
     */
    @ApiModelProperty(value = "单位")
    @Schema(description = "单位")
    private String unit;

    /**
     * 告警时间
     */
    @ApiModelProperty(value = "告警时间")
    @Schema(description = "告警时间")
    private LocalDateTime alertTime;

    /**
     * 是否为恢复通知
     */
    @ApiModelProperty(value = "是否为恢复通知")
    @Schema(description = "是否为恢复通知")
    private Boolean isRecovery;

    /**
     * 告警指纹（用于去重）
     */
    @ApiModelProperty(value = "告警指纹")
    @Schema(description = "告警指纹")
    private String fingerprint;

    /**
     * 扩展属性
     */
    @ApiModelProperty(value = "扩展属性")
    @Schema(description = "扩展属性")
    private Map<String, Object> extraProperties;

    /**
     * 通知地址（邮箱、手机号、Webhook URL等）
     */
    @ApiModelProperty(value = "通知地址")
    @Schema(description = "通知地址")
    private String notificationAddress;

    /**
     * 获取格式化的告警消息
     *
     * @return 格式化的告警消息
     */
    public String getFormattedMessage() {
        StringBuilder sb = new StringBuilder();
        
        if (isRecovery != null && isRecovery) {
            sb.append("【告警恢复】");
        } else {
            sb.append("【").append(alertLevel != null ? alertLevel.getDescription() : "告警").append("】");
        }
        
        sb.append("\n服务器: ").append(serverName != null ? serverName : "未知");
        sb.append("\n主机: ").append(serverHost != null ? serverHost : "未知");
        sb.append("\n类型: ").append(alertType != null ? alertType.getDescription() : "未知");
        
        if (currentValue != null) {
            sb.append("\n当前值: ").append(currentValue);
            if (unit != null) {
                sb.append(unit);
            }
        }
        
        if (thresholdValue != null && !Boolean.TRUE.equals(isRecovery)) {
            sb.append("\n阈值: ").append(thresholdValue);
            if (unit != null) {
                sb.append(unit);
            }
        }
        
        if (message != null) {
            sb.append("\n详情: ").append(message);
        }
        
        sb.append("\n时间: ").append(alertTime != null ? alertTime.toString() : LocalDateTime.now().toString());
        
        return sb.toString();
    }

    /**
     * 获取简短的告警消息
     *
     * @return 简短的告警消息
     */
    public String getShortMessage() {
        StringBuilder sb = new StringBuilder();
        
        if (isRecovery != null && isRecovery) {
            sb.append("恢复: ");
        }
        
        sb.append(serverName != null ? serverName : "未知服务器");
        sb.append(" - ");
        sb.append(alertType != null ? alertType.getDescription() : "告警");
        
        if (currentValue != null) {
            sb.append(": ").append(currentValue);
            if (unit != null) {
                sb.append(unit);
            }
        }
        
        return sb.toString();
    }

    /**
     * 获取告警颜色（用于富文本通知）
     *
     * @return 告警颜色
     */
    public String getAlertColor() {
        if (isRecovery != null && isRecovery) {
            return "#52c41a"; // 绿色
        }
        
        if (alertLevel == null) {
            return "#faad14"; // 橙色
        }
        
        switch (alertLevel) {
            case INFO:
                return "#1890ff"; // 蓝色
            case WARNING:
                return "#faad14"; // 橙色
            case ERROR:
                return "#ff4d4f"; // 红色
            case CRITICAL:
                return "#a8071a"; // 深红色
            default:
                return "#faad14"; // 橙色
        }
    }
}
