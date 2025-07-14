package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystem;
import com.chua.starter.monitor.starter.service.MonitorSysGenFileSystemMergeTaskService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 文件系统合并任务控制器
 *
 * @author CH
 * @since 2025/01/11
 */
@Slf4j
@RestController
@RequestMapping("/v1/filesystem/merge-task")
@RequiredArgsConstructor
@Api(tags = "文件系统合并任务管理")
@Tag(name = "文件系统合并任务管理", description = "文件分片合并任务的管理操作")
public class MonitorSysGenFileSystemMergeTaskController {

    private final MonitorSysGenFileSystemMergeTaskService mergeTaskService;

    /**
     * 启动合并任务
     */
    @PostMapping("/start")
    @ApiOperation(value = "启动合并任务")
    @Operation(summary = "启动合并任务", description = "启动文件分片合并任务")
    public ReturnResult<Boolean> startMergeTasks() {
        return mergeTaskService.startMergeTasks();
    }

    /**
     * 停止合并任务
     */
    @PostMapping("/stop")
    @ApiOperation(value = "停止合并任务")
    @Operation(summary = "停止合并任务", description = "停止文件分片合并任务")
    public ReturnResult<Boolean> stopMergeTasks() {
        return mergeTaskService.stopMergeTasks();
    }

    /**
     * 检查合并任务状态
     */
    @GetMapping("/status")
    @ApiOperation(value = "检查合并任务状态")
    @Operation(summary = "检查合并任务状态", description = "获取合并任务的运行状态")
    public ReturnResult<java.util.Map<String, Object>> getMergeTaskStatus() {
        return mergeTaskService.getMergeTaskStatus();
    }

    /**
     * 手动触发合并任务
     */
    @PostMapping("/trigger/{fileId}")
    @ApiOperation(value = "手动触发合并任务")
    @Operation(summary = "手动触发合并任务", description = "手动触发指定文件的合并任务")
    public ReturnResult<Boolean> triggerMergeTask(
            @Parameter(description = "文件ID") @PathVariable Integer fileId) {
        return mergeTaskService.triggerMergeTask(fileId);
    }

    /**
     * 获取待合并的文件列表
     */
    @GetMapping("/pending")
    @ApiOperation(value = "获取待合并的文件列表")
    @Operation(summary = "获取待合并的文件列表", description = "获取等待合并的文件列表")
    public ReturnResult<List<MonitorSysGenFileSystem>> getPendingMergeFiles(
            @Parameter(description = "限制数量") @RequestParam(defaultValue = "10") Integer limit) {
        return mergeTaskService.getPendingMergeFiles(limit);
    }

    /**
     * 处理合并队列
     */
    @PostMapping("/process-queue")
    @ApiOperation(value = "处理合并队列")
    @Operation(summary = "处理合并队列", description = "手动处理合并队列中的任务")
    public ReturnResult<Integer> processMergeQueue() {
        return mergeTaskService.processMergeQueue();
    }

    /**
     * 重试失败的合并任务
     */
    @PostMapping("/retry-failed")
    @ApiOperation(value = "重试失败的合并任务")
    @Operation(summary = "重试失败的合并任务", description = "重试所有失败的合并任务")
    public ReturnResult<Integer> retryFailedMergeTasks() {
        return mergeTaskService.retryFailedMergeTasks();
    }

    /**
     * 清理合并临时文件
     */
    @PostMapping("/clean-temp")
    @ApiOperation(value = "清理合并临时文件")
    @Operation(summary = "清理合并临时文件", description = "清理合并过程中产生的临时文件")
    public ReturnResult<Integer> cleanMergeTempFiles() {
        return mergeTaskService.cleanMergeTempFiles();
    }

    /**
     * 获取合并任务统计信息
     */
    @GetMapping("/statistics")
    @ApiOperation(value = "获取合并任务统计信息")
    @Operation(summary = "获取合并任务统计信息", description = "获取合并任务的统计信息")
    public ReturnResult<java.util.Map<String, Object>> getMergeTaskStatistics() {
        return mergeTaskService.getMergeTaskStatistics();
    }

    /**
     * 验证文件合并完整性
     */
    @PostMapping("/validate/{fileId}")
    @ApiOperation(value = "验证文件合并完整性")
    @Operation(summary = "验证文件合并完整性", description = "验证指定文件的合并完整性")
    public ReturnResult<Boolean> validateMergedFile(
            @Parameter(description = "文件ID") @PathVariable Integer fileId) {
        return mergeTaskService.validateMergedFile(fileId);
    }

    /**
     * 设置合并任务数量
     */
    @PutMapping("/task-count")
    @ApiOperation(value = "设置合并任务数量")
    @Operation(summary = "设置合并任务数量", description = "设置并发执行的合并任务数量")
    public ReturnResult<Boolean> setMergeTaskCount(
            @Parameter(description = "任务数量") @RequestParam Integer taskCount) {
        return mergeTaskService.setMergeTaskCount(taskCount);
    }

    /**
     * 获取当前运行的合并任务数量
     */
    @GetMapping("/running-count")
    @ApiOperation(value = "获取当前运行的合并任务数量")
    @Operation(summary = "获取当前运行的合并任务数量", description = "获取当前正在运行的合并任务数量")
    public ReturnResult<Integer> getRunningMergeTaskCount() {
        return mergeTaskService.getRunningMergeTaskCount();
    }

    /**
     * 强制停止指定的合并任务
     */
    @PostMapping("/force-stop/{fileId}")
    @ApiOperation(value = "强制停止指定的合并任务")
    @Operation(summary = "强制停止指定的合并任务", description = "强制停止指定文件的合并任务")
    public ReturnResult<Boolean> forceStopMergeTask(
            @Parameter(description = "文件ID") @PathVariable Integer fileId) {
        return mergeTaskService.forceStopMergeTask(fileId);
    }
}
