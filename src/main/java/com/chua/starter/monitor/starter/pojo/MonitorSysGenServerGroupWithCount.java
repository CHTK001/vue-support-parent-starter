package com.chua.starter.monitor.starter.pojo;

import com.chua.starter.monitor.starter.entity.MonitorSysGenServerGroup;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 服务器分组（包含服务器数量）
 *
 * @author CH
 * @since 2025/01/11
 */
@Data
@EqualsAndHashCode(callSuper = true)
@ApiModel(value = "MonitorSysGenServerGroupWithCount", description = "服务器分组（包含服务器数量）")
@Schema(description = "服务器分组（包含服务器数量）")
public class MonitorSysGenServerGroupWithCount extends MonitorSysGenServerGroup {

    /**
     * 分组下的服务器数量
     */
    @ApiModelProperty(value = "服务器数量")
    @Schema(description = "分组下的服务器数量")
    private Integer serverCount;

    /**
     * 构造函数
     */
    public MonitorSysGenServerGroupWithCount() {
        super();
        this.serverCount = 0;
    }

    /**
     * 从基础分组对象构造
     *
     * @param group 基础分组对象
     */
    public MonitorSysGenServerGroupWithCount(MonitorSysGenServerGroup group) {
        super();
        if (group != null) {
            this.setMonitorSysGenServerGroupId(group.getMonitorSysGenServerGroupId());
            this.setMonitorSysGenServerGroupName(group.getMonitorSysGenServerGroupName());
            this.setMonitorSysGenServerGroupDesc(group.getMonitorSysGenServerGroupDesc());
            this.setMonitorSysGenServerGroupColor(group.getMonitorSysGenServerGroupColor());
            this.setMonitorSysGenServerGroupIcon(group.getMonitorSysGenServerGroupIcon());
            this.setMonitorSysGenServerGroupStatus(group.getMonitorSysGenServerGroupStatus());
            this.setMonitorSysGenServerGroupIsDefault(group.getMonitorSysGenServerGroupIsDefault());
            this.setMonitorSysGenServerGroupSort(group.getMonitorSysGenServerGroupSort());
            this.setMonitorSysGenServerGroupRemark(group.getMonitorSysGenServerGroupRemark());
            this.setCreateTime(group.getCreateTime());
            this.setUpdateTime(group.getUpdateTime());
        }
        this.serverCount = 0;
    }
}
