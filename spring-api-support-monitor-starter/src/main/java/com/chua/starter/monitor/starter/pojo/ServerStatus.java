package com.chua.starter.monitor.starter.pojo;

import lombok.Getter;

/**
 * 服务器状态枚举
 * 
 * @author CH
 * @since 2025/01/17
 */
@Getter
public enum ServerStatus {

    /**
     * 已停止
     */
    STOPPED("STOPPED", "已停止", "服务器已停止运行"),

    /**
     * 运行中
     */
    RUNNING("RUNNING", "运行中", "服务器正在运行"),

    /**
     * 启动中
     */
    STARTING("STARTING", "启动中", "服务器正在启动"),

    /**
     * 停止中
     */
    STOPPING("STOPPING", "停止中", "服务器正在停止"),

    /**
     * 异常
     */
    ERROR("ERROR", "异常", "服务器运行异常"),

    /**
     * 未知
     */
    UNKNOWN("UNKNOWN", "未知", "服务器状态未知");

    /**
     * 状态代码
     */
    private final String code;

    /**
     * 状态名称
     */
    private final String name;

    /**
     * 状态描述
     */
    private final String description;

    ServerStatus(String code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }

    /**
     * 根据代码获取状态
     * 
     * @param code 状态代码
     * @return 服务器状态
     */
    public static ServerStatus fromCode(String code) {
        if (code == null) {
            return UNKNOWN;
        }
        for (ServerStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return UNKNOWN;
    }

    /**
     * 是否为运行状态
     * 
     * @return 是否运行中
     */
    public boolean isRunning() {
        return this == RUNNING;
    }

    /**
     * 是否为停止状态
     * 
     * @return 是否已停止
     */
    public boolean isStopped() {
        return this == STOPPED;
    }

    /**
     * 是否为过渡状态（启动中或停止中）
     * 
     * @return 是否为过渡状态
     */
    public boolean isTransitioning() {
        return this == STARTING || this == STOPPING;
    }

    /**
     * 是否为异常状态
     * 
     * @return 是否异常
     */
    public boolean isError() {
        return this == ERROR;
    }

    /**
     * 是否为稳定状态（运行中或已停止）
     * 
     * @return 是否为稳定状态
     */
    public boolean isStable() {
        return this == RUNNING || this == STOPPED;
    }

    /**
     * 是否可以启动
     * 
     * @return 是否可以启动
     */
    public boolean canStart() {
        return this == STOPPED || this == ERROR;
    }

    /**
     * 是否可以停止
     * 
     * @return 是否可以停止
     */
    public boolean canStop() {
        return this == RUNNING || this == ERROR;
    }

    /**
     * 是否可以重启
     * 
     * @return 是否可以重启
     */
    public boolean canRestart() {
        return this == RUNNING || this == STOPPED || this == ERROR;
    }

    @Override
    public String toString() {
        return code;
    }
}
