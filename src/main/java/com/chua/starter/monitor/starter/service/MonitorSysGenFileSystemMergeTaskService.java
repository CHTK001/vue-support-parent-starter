package com.chua.starter.monitor.starter.service;

import com.chua.common.support.lang.code.ReturnResult;

import java.util.List;

/**
 * 文件系统合并任务服务接口
 *
 * @author CH
 * @since 2025/01/11
 */
public interface MonitorSysGenFileSystemMergeTaskService {

    /**
     * 启动合并任务
     *
     * @return 启动结果
     */
    ReturnResult<Boolean> startMergeTasks();

    /**
     * 停止合并任务
     *
     * @return 停止结果
     */
    ReturnResult<Boolean> stopMergeTasks();

    /**
     * 检查合并任务状态
     *
     * @return 任务状态
     */
    ReturnResult<java.util.Map<String, Object>> getMergeTaskStatus();

    /**
     * 手动触发合并任务
     *
     * @param fileId 文件ID
     * @return 合并结果
     */
    ReturnResult<Boolean> triggerMergeTask(Integer fileId);

    /**
     * 执行文件合并
     *
     * @param fileId 文件ID
     * @return 合并结果
     */
    ReturnResult<Boolean> mergeFile(Integer fileId);

    /**
     * 获取待合并的文件列表
     *
     * @param limit 限制数量
     * @return 文件列表
     */
    ReturnResult<List<com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystem>> getPendingMergeFiles(Integer limit);

    /**
     * 处理合并队列
     *
     * @return 处理结果
     */
    ReturnResult<Integer> processMergeQueue();

    /**
     * 重试失败的合并任务
     *
     * @return 重试结果
     */
    ReturnResult<Integer> retryFailedMergeTasks();

    /**
     * 清理合并临时文件
     *
     * @return 清理结果
     */
    ReturnResult<Integer> cleanMergeTempFiles();

    /**
     * 获取合并任务统计信息
     *
     * @return 统计信息
     */
    ReturnResult<java.util.Map<String, Object>> getMergeTaskStatistics();

    /**
     * 验证文件合并完整性
     *
     * @param fileId 文件ID
     * @return 验证结果
     */
    ReturnResult<Boolean> validateMergedFile(Integer fileId);

    /**
     * 设置合并任务数量
     *
     * @param taskCount 任务数量
     * @return 设置结果
     */
    ReturnResult<Boolean> setMergeTaskCount(Integer taskCount);

    /**
     * 获取当前运行的合并任务数量
     *
     * @return 任务数量
     */
    ReturnResult<Integer> getRunningMergeTaskCount();

    /**
     * 强制停止指定的合并任务
     *
     * @param fileId 文件ID
     * @return 停止结果
     */
    ReturnResult<Boolean> forceStopMergeTask(Integer fileId);
}
