package com.chua.starter.monitor.starter.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystemPart;

import java.util.List;

/**
 * 文件系统分片管理服务接口
 *
 * @author CH
 * @since 2025/01/11
 */
public interface MonitorSysGenFileSystemPartService extends IService<MonitorSysGenFileSystemPart> {

    /**
     * 根据文件ID查询分片列表
     *
     * @param fileId 文件ID
     * @return 分片列表
     */
    ReturnResult<List<MonitorSysGenFileSystemPart>> getPartsByFileId(Integer fileId);

    /**
     * 根据文件ID和分片序号查询分片
     *
     * @param fileId    文件ID
     * @param partIndex 分片序号
     * @return 分片信息
     */
    ReturnResult<MonitorSysGenFileSystemPart> getPartByFileIdAndIndex(Integer fileId, Integer partIndex);

    /**
     * 创建分片记录
     *
     * @param fileId     文件ID
     * @param chunkTotal 分片总数
     * @param chunkSize  分片大小
     * @return 创建结果
     */
    ReturnResult<Boolean> createParts(Integer fileId, Integer chunkTotal, Long chunkSize);

    /**
     * 更新分片状态
     *
     * @param partId 分片ID
     * @param status 状态
     * @return 更新结果
     */
    ReturnResult<Boolean> updatePartStatus(Integer partId, Integer status);

    /**
     * 批量更新分片状态
     *
     * @param fileId 文件ID
     * @param status 状态
     * @return 更新结果
     */
    ReturnResult<Boolean> batchUpdatePartStatus(Integer fileId, Integer status);

    /**
     * 检查文件所有分片是否上传完成
     *
     * @param fileId 文件ID
     * @return 是否完成
     */
    ReturnResult<Boolean> checkAllPartsCompleted(Integer fileId);

    /**
     * 获取文件上传进度
     *
     * @param fileId 文件ID
     * @return 上传进度
     */
    ReturnResult<java.util.Map<String, Object>> getUploadProgress(Integer fileId);

    /**
     * 删除文件的所有分片
     *
     * @param fileId 文件ID
     * @return 删除结果
     */
    ReturnResult<Boolean> deletePartsByFileId(Integer fileId);

    /**
     * 获取失败的分片列表
     *
     * @param maxRetryCount 最大重试次数
     * @return 失败分片列表
     */
    ReturnResult<List<MonitorSysGenFileSystemPart>> getFailedParts(Integer maxRetryCount);

    /**
     * 重试失败的分片
     *
     * @param partId 分片ID
     * @return 重试结果
     */
    ReturnResult<Boolean> retryFailedPart(Integer partId);

    /**
     * 获取分片统计信息
     *
     * @param fileId 文件ID
     * @return 统计信息
     */
    ReturnResult<java.util.Map<String, Object>> getPartStatistics(Integer fileId);

    /**
     * 验证分片完整性
     *
     * @param fileId 文件ID
     * @return 验证结果
     */
    ReturnResult<Boolean> validatePartIntegrity(Integer fileId);

    /**
     * 清理孤立的分片记录
     *
     * @return 清理结果
     */
    ReturnResult<Integer> cleanOrphanParts();
}
