package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystemPart;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 文件系统分片管理Mapper接口
 *
 * @author CH
 * @since 2025/01/11
 */
@Mapper
public interface MonitorSysGenFileSystemPartMapper extends BaseMapper<MonitorSysGenFileSystemPart> {

    /**
     * 根据文件ID查询分片列表
     *
     * @param fileId 文件ID
     * @return 分片列表
     */
    List<MonitorSysGenFileSystemPart> selectByFileId(@Param("fileId") Integer fileId);

    /**
     * 根据文件ID和分片序号查询分片
     *
     * @param fileId 文件ID
     * @param partIndex 分片序号
     * @return 分片信息
     */
    MonitorSysGenFileSystemPart selectByFileIdAndIndex(@Param("fileId") Integer fileId, @Param("partIndex") Integer partIndex);

    /**
     * 根据文件ID查询已完成的分片数量
     *
     * @param fileId 文件ID
     * @return 已完成分片数量
     */
    Integer countCompletedPartsByFileId(@Param("fileId") Integer fileId);

    /**
     * 根据文件ID查询分片总数
     *
     * @param fileId 文件ID
     * @return 分片总数
     */
    Integer countPartsByFileId(@Param("fileId") Integer fileId);

    /**
     * 更新分片状态
     *
     * @param partId 分片ID
     * @param status 状态
     * @return 影响行数
     */
    int updatePartStatus(@Param("partId") Integer partId, @Param("status") Integer status);

    /**
     * 批量更新分片状态
     *
     * @param fileId 文件ID
     * @param status 状态
     * @return 影响行数
     */
    int batchUpdatePartStatusByFileId(@Param("fileId") Integer fileId, @Param("status") Integer status);

    /**
     * 根据文件ID删除所有分片
     *
     * @param fileId 文件ID
     * @return 影响行数
     */
    int deleteByFileId(@Param("fileId") Integer fileId);

    /**
     * 查询失败的分片列表
     *
     * @param maxRetryCount 最大重试次数
     * @return 分片列表
     */
    List<MonitorSysGenFileSystemPart> selectFailedParts(@Param("maxRetryCount") Integer maxRetryCount);

    /**
     * 增加分片重试次数
     *
     * @param partId 分片ID
     * @return 影响行数
     */
    int incrementRetryCount(@Param("partId") Integer partId);

    /**
     * 根据状态查询分片列表
     *
     * @param status 分片状态
     * @return 分片列表
     */
    List<MonitorSysGenFileSystemPart> selectByStatus(@Param("status") Integer status);

    /**
     * 查询分片上传进度
     *
     * @param fileId 文件ID
     * @return 进度信息
     */
    java.util.Map<String, Object> getUploadProgress(@Param("fileId") Integer fileId);

    /**
     * 批量插入分片记录
     *
     * @param parts 分片列表
     * @return 影响行数
     */
    int batchInsertParts(@Param("parts") List<MonitorSysGenFileSystemPart> parts);
}
