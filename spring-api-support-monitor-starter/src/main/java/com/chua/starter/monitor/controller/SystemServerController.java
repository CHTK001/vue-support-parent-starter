package com.chua.starter.monitor.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.chua.common.support.lang.code.ReturnPageResult;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.entity.SystemServer;
import com.chua.starter.monitor.service.SystemServerService;
import com.chua.starter.mybatis.entity.Query;
import com.chua.starter.mybatis.utils.PageResultUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 系统服务器管理控制器
 *
 * @author CH
 * @since 2025/01/07
 */
@RestController
@RequestMapping("/system/server")
@Tag(name = "系统服务器管理", description = "系统服务器管理API")
@RequiredArgsConstructor
@Slf4j
public class SystemServerController {

    private final SystemServerService systemServerService;

    /**
     * 获取所有可用的服务器类型
     *
     * @return 服务器类型列表
     */
    @Operation(summary = "获取所有可用的服务器类型")
    @GetMapping("/types")
    public ReturnResult<List<String>> getAvailableServerTypes() {
        try {
            log.info("获取所有可用的服务器类型");

            List<String> serverTypes = Arrays.asList(
                    "TOMCAT", "JETTY", "UNDERTOW", "NETTY",
                    "SPRING_BOOT", "NGINX", "APACHE", "NODEJS", "CUSTOM");

            return ReturnResult.ok(serverTypes);
        } catch (Exception e) {
            log.error("获取服务器类型失败", e);
            return ReturnResult.error("获取服务器类型失败: " + e.getMessage());
        }
    }

    /**
     * 分页查询服务器列表
     *
     * @param query 查询条件
     * @return 分页结果
     */
    @Operation(summary = "分页查询服务器列表")
    @GetMapping("/page")
    public ReturnPageResult<SystemServer> page(Query<SystemServer> query) {
        try {
            log.info("分页查询服务器列表: page={}, size={}", query.getPage(), query.getSize());

            IPage<SystemServer> page = systemServerService.pageFor(query.getPage(), query.getEntity());
            return PageResultUtils.ok(page);
        } catch (Exception e) {
            log.error("分页查询服务器列表失败", e);
            return PageResultUtils.error("查询失败: " + e.getMessage());
        }
    }

    /**
     * 获取服务器统计信息
     *
     * @return 统计信息
     */
    @Operation(summary = "获取服务器统计信息")
    @GetMapping("/statistics")
    public ReturnResult<Map<String, Object>> getStatistics() {
        try {
            log.info("获取服务器统计信息");

            Map<String, Object> statusStats = systemServerService.getStatusStatistics();
            Map<String, Object> typeStats = systemServerService.getTypeStatistics();

            statusStats.putAll(typeStats);

            return ReturnResult.ok(statusStats);
        } catch (Exception e) {
            log.error("获取服务器统计信息失败", e);
            return ReturnResult.error("获取统计信息失败: " + e.getMessage());
        }
    }

    /**
     * 根据ID获取服务器信息
     *
     * @param id 服务器ID
     * @return 服务器信息
     */
    @Operation(summary = "根据ID获取服务器信息")
    @GetMapping("/{id}")
    public ReturnResult<SystemServer> getById(@Parameter(description = "服务器ID") @PathVariable Integer id) {
        try {
            log.info("根据ID获取服务器信息: id={}", id);

            SystemServer server = systemServerService.getById(id);
            if (server == null) {
                return ReturnResult.error("服务器不存在");
            }

            return ReturnResult.ok(server);
        } catch (Exception e) {
            log.error("获取服务器信息失败: id={}", id, e);
            return ReturnResult.error("获取服务器信息失败: " + e.getMessage());
        }
    }

    /**
     * 创建服务器
     *
     * @param systemServer 服务器信息
     * @return 创建结果
     */
    @Operation(summary = "创建服务器")
    @PostMapping
    public ReturnResult<SystemServer> create(@Validated @RequestBody SystemServer systemServer) {
        try {
            log.info("创建服务器: name={}, type={}, port={}",
                    systemServer.getSystemServerName(),
                    systemServer.getSystemServerType(),
                    systemServer.getSystemServerPort());

            SystemServer createdServer = systemServerService.createServer(systemServer);
            return ReturnResult.ok(createdServer);
        } catch (Exception e) {
            log.error("创建服务器失败: name={}", systemServer.getSystemServerName(), e);
            return ReturnResult.error("创建服务器失败: " + e.getMessage());
        }
    }

    /**
     * 更新服务器
     *
     * @param id           服务器ID
     * @param systemServer 服务器信息
     * @return 更新结果
     */
    @Operation(summary = "更新服务器")
    @PutMapping("/{id}")
    public ReturnResult<SystemServer> update(@Parameter(description = "服务器ID") @PathVariable Integer id,
            @Validated @RequestBody SystemServer systemServer) {
        try {
            log.info("更新服务器: id={}, name={}", id, systemServer.getSystemServerName());

            systemServer.setSystemServerId(id);
            SystemServer updatedServer = systemServerService.updateServer(systemServer);
            return ReturnResult.ok(updatedServer);
        } catch (Exception e) {
            log.error("更新服务器失败: id={}", id, e);
            return ReturnResult.error("更新服务器失败: " + e.getMessage());
        }
    }

    /**
     * 删除服务器
     *
     * @param id 服务器ID
     * @return 删除结果
     */
    @Operation(summary = "删除服务器")
    @DeleteMapping("/{id}")
    public ReturnResult<Boolean> delete(@Parameter(description = "服务器ID") @PathVariable Integer id) {
        try {
            log.info("删除服务器: id={}", id);

            boolean result = systemServerService.deleteServer(id);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("删除服务器失败: id={}", id, e);
            return ReturnResult.error("删除服务器失败: " + e.getMessage());
        }
    }

    /**
     * 启动服务器
     *
     * @param id 服务器ID
     * @return 启动结果
     */
    @Operation(summary = "启动服务器")
    @PostMapping("/{id}/start")
    public ReturnResult<Boolean> start(@Parameter(description = "服务器ID") @PathVariable Integer id) {
        try {
            log.info("启动服务器: id={}", id);

            boolean result = systemServerService.startServer(id);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("启动服务器失败: id={}", id, e);
            return ReturnResult.error("启动服务器失败: " + e.getMessage());
        }
    }

    /**
     * 停止服务器
     *
     * @param id 服务器ID
     * @return 停止结果
     */
    @Operation(summary = "停止服务器")
    @PostMapping("/{id}/stop")
    public ReturnResult<Boolean> stop(@Parameter(description = "服务器ID") @PathVariable Integer id) {
        try {
            log.info("停止服务器: id={}", id);

            boolean result = systemServerService.stopServer(id);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("停止服务器失败: id={}", id, e);
            return ReturnResult.error("停止服务器失败: " + e.getMessage());
        }
    }

    /**
     * 重启服务器
     *
     * @param id 服务器ID
     * @return 重启结果
     */
    @Operation(summary = "重启服务器")
    @PostMapping("/{id}/restart")
    public ReturnResult<Boolean> restart(@Parameter(description = "服务器ID") @PathVariable Integer id) {
        try {
            log.info("重启服务器: id={}", id);

            boolean result = systemServerService.restartServer(id);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("重启服务器失败: id={}", id, e);
            return ReturnResult.error("重启服务器失败: " + e.getMessage());
        }
    }

    /**
     * 获取服务器状态
     *
     * @param id 服务器ID
     * @return 服务器状态
     */
    @Operation(summary = "获取服务器状态")
    @GetMapping("/{id}/status")
    public ReturnResult<String> getStatus(@Parameter(description = "服务器ID") @PathVariable Integer id) {
        try {
            log.info("获取服务器状态: id={}", id);

            String status = systemServerService.getServerStatus(id);
            return ReturnResult.ok(status);
        } catch (Exception e) {
            log.error("获取服务器状态失败: id={}", id, e);
            return ReturnResult.error("获取服务器状态失败: " + e.getMessage());
        }
    }

    /**
     * 克隆服务器配置
     *
     * @param id      源服务器ID
     * @param newName 新服务器名称
     * @param newPort 新服务器端口
     * @return 克隆结果
     */
    @Operation(summary = "克隆服务器配置")
    @PostMapping("/{id}/clone")
    public ReturnResult<SystemServer> clone(@Parameter(description = "源服务器ID") @PathVariable Integer id,
            @Parameter(description = "新服务器名称") @RequestParam String newName,
            @Parameter(description = "新服务器端口") @RequestParam Integer newPort) {
        try {
            log.info("克隆服务器配置: sourceId={}, newName={}, newPort={}", id, newName, newPort);

            SystemServer clonedServer = systemServerService.cloneServer(id, newName, newPort);
            return ReturnResult.ok(clonedServer);
        } catch (Exception e) {
            log.error("克隆服务器配置失败: sourceId={}", id, e);
            return ReturnResult.error("克隆服务器配置失败: " + e.getMessage());
        }
    }

    /**
     * 批量操作服务器
     *
     * @param serverIds 服务器ID列表（逗号分隔）
     * @param operation 操作类型
     * @return 操作结果
     */
    @Operation(summary = "批量操作服务器")
    @PostMapping("/batch")
    public ReturnResult<Boolean> batchOperation(@Parameter(description = "服务器ID列表") @RequestParam String serverIds,
            @Parameter(description = "操作类型") @RequestParam String operation) {
        try {
            log.info("批量操作服务器: serverIds={}, operation={}", serverIds, operation);

            boolean result = systemServerService.batchOperation(serverIds, operation);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("批量操作服务器失败: serverIds={}, operation={}", serverIds, operation, e);
            return ReturnResult.error("批量操作失败: " + e.getMessage());
        }
    }

    /**
     * 自动启动所有配置为自动启动的服务器
     *
     * @return 启动结果
     */
    @Operation(summary = "自动启动所有配置为自动启动的服务器")
    @PostMapping("/auto-start")
    public ReturnResult<Boolean> autoStart() {
        try {
            log.info("自动启动所有配置为自动启动的服务器");

            boolean result = systemServerService.autoStartServers();
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("自动启动服务器失败", e);
            return ReturnResult.error("自动启动失败: " + e.getMessage());
        }
    }
}
