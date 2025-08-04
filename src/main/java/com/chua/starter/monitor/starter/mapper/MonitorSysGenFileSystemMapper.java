package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 文件系统管理Mapper接口
 *
 * @author CH
 * @since 2025/01/11
 */
@Mapper
public interface MonitorSysGenFileSystemMapper extends BaseMapper<MonitorSysGenFileSystem> {

    /**
     * 根据MD5查询文件
     *
     * @param md5 文件MD5
     * @return 文件信息
     */
    MonitorSysGenFileSystem selectByMd5(@Param("md5") String md5);

    /**
     * 根据状态查询文件列表
     *
     * @param status 文件状态
     * @return 文件列表
     */
    List<MonitorSysGenFileSystem> selectByStatus(@Param("status") Integer status);

    /**
     * 查询待合并的文件列表
     *
     * @param limit 限制数量
     * @return 文件列表
     */
    List<MonitorSysGenFileSystem> selectPendingMergeFiles(@Param("limit") Integer limit);

    /**
     * 更新文件状态
     *
     * @param fileId 文件ID
     * @param status 状态
     * @return 影响行数
     */
    int updateFileStatus(@Param("fileId") Integer fileId, @Param("status") Integer status);

    /**
     * 更新已上传分片数
     *
     * @param fileId 文件ID
     * @param uploadedCount 已上传分片数
     * @return 影响行数
     */
    int updateChunkUploaded(@Param("fileId") Integer fileId, @Param("uploadedCount") Integer uploadedCount);

    /**
     * 增加下载次数
     *
     * @param fileId 文件ID
     * @return 影响行数
     */
    int incrementDownloadCount(@Param("fileId") Integer fileId);

    /**
     * 根据文件类型查询文件数量
     *
     * @param fileType 文件类型
     * @return 文件数量
     */
    Long countByFileType(@Param("fileType") String fileType);

    /**
     * 查询文件大小统计
     *
     * @return 统计信息
     */
    java.util.Map<String, Object> getFileSizeStatistics();

    /**
     * 根据上传用户查询文件列表
     *
     * @param uploadUser 上传用户
     * @return 文件列表
     */
    List<MonitorSysGenFileSystem> selectByUploadUser(@Param("uploadUser") String uploadUser);

    /**
     * 查询热门下载文件
     *
     * @param limit 限制数量
     * @return 文件列表
     */
    List<MonitorSysGenFileSystem> selectPopularFiles(@Param("limit") Integer limit);

    /**
     * 批量删除文件
     *
     * @param fileIds 文件ID列表
     * @return 影响行数
     */
    int batchDeleteFiles(@Param("fileIds") List<Integer> fileIds);

    /**
     * 清理过期文件
     *
     * @param days 过期天数
     * @return 影响行数
     */
    int cleanExpiredFiles(@Param("days") Integer days);
}
