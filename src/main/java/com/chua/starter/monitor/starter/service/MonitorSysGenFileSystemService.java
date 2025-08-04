package com.chua.starter.monitor.starter.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystem;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 文件系统管理服务接口
 *
 * @author CH
 * @since 2025/01/11
 */
public interface MonitorSysGenFileSystemService extends IService<MonitorSysGenFileSystem> {

    /**
     * 分页查询文件列表
     *
     * @param page   分页参数
     * @param entity 查询条件
     * @return 分页结果
     */
    IPage<MonitorSysGenFileSystem> pageFor(IPage<MonitorSysGenFileSystem> page, MonitorSysGenFileSystem entity);

    /**
     * 初始化分片上传
     *
     * @param fileName 文件名
     * @param fileSize 文件大小
     * @param fileMd5  文件MD5
     * @param uploadUser 上传用户
     * @return 初始化结果
     */
    ReturnResult<java.util.Map<String, Object>> initChunkUpload(String fileName, Long fileSize, String fileMd5, String uploadUser);

    /**
     * 上传文件分片
     *
     * @param fileId    文件ID
     * @param partIndex 分片序号
     * @param partMd5   分片MD5
     * @param file      分片文件
     * @return 上传结果
     */
    ReturnResult<Boolean> uploadChunk(Integer fileId, Integer partIndex, String partMd5, MultipartFile file);

    /**
     * 检查分片上传状态
     *
     * @param fileId 文件ID
     * @return 上传状态
     */
    ReturnResult<java.util.Map<String, Object>> checkUploadStatus(Integer fileId);

    /**
     * 手动触发文件合并
     *
     * @param fileId 文件ID
     * @return 合并结果
     */
    ReturnResult<Boolean> manualMergeFile(Integer fileId);

    /**
     * 下载文件
     *
     * @param fileId 文件ID
     * @return 文件信息
     */
    ReturnResult<MonitorSysGenFileSystem> downloadFile(Integer fileId);

    /**
     * 删除文件
     *
     * @param fileId 文件ID
     * @return 删除结果
     */
    ReturnResult<Boolean> deleteFile(Integer fileId);

    /**
     * 批量删除文件
     *
     * @param fileIds 文件ID列表
     * @return 删除结果
     */
    ReturnResult<Boolean> batchDeleteFiles(List<Integer> fileIds);

    /**
     * 根据MD5查询文件
     *
     * @param md5 文件MD5
     * @return 文件信息
     */
    ReturnResult<MonitorSysGenFileSystem> getFileByMd5(String md5);

    /**
     * 获取文件统计信息
     *
     * @return 统计信息
     */
    ReturnResult<java.util.Map<String, Object>> getFileStatistics();

    /**
     * 获取热门下载文件
     *
     * @param limit 限制数量
     * @return 文件列表
     */
    ReturnResult<List<MonitorSysGenFileSystem>> getPopularFiles(Integer limit);

    /**
     * 根据用户查询文件列表
     *
     * @param uploadUser 上传用户
     * @return 文件列表
     */
    ReturnResult<List<MonitorSysGenFileSystem>> getFilesByUser(String uploadUser);

    /**
     * 清理过期文件
     *
     * @param days 过期天数
     * @return 清理结果
     */
    ReturnResult<Integer> cleanExpiredFiles(Integer days);

    /**
     * 获取文件HTTP访问URL
     *
     * @param fileId 文件ID
     * @return HTTP访问URL
     */
    ReturnResult<String> getFileHttpUrl(Integer fileId);

    /**
     * 设置文件HTTP访问权限
     *
     * @param fileId     文件ID
     * @param httpAccess 是否允许HTTP访问
     * @return 设置结果
     */
    ReturnResult<Boolean> setFileHttpAccess(Integer fileId, Integer httpAccess);

    /**
     * 验证文件类型是否允许
     *
     * @param fileExtension 文件扩展名
     * @return 是否允许
     */
    ReturnResult<Boolean> validateFileType(String fileExtension);

    /**
     * 获取上传进度
     *
     * @param fileId 文件ID
     * @return 上传进度
     */
    ReturnResult<java.util.Map<String, Object>> getUploadProgress(Integer fileId);
}
