package com.chua.starter.monitor.starter.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystemPart;
import com.chua.starter.monitor.starter.mapper.MonitorSysGenFileSystemPartMapper;
import com.chua.starter.monitor.starter.service.MonitorSysGenFileSystemPartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 文件系统分片管理服务实现类
 *
 * @author CH
 * @since 2024/12/30
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorSysGenFileSystemPartServiceImpl extends ServiceImpl<MonitorSysGenFileSystemPartMapper, MonitorSysGenFileSystemPart> 
        implements MonitorSysGenFileSystemPartService {

    @Override
    public List<MonitorSysGenFileSystemPart> findByFileId(Integer fileId) {
        log.debug("根据文件ID查询所有分片: fileId={}", fileId);
        return baseMapper.findByFileId(fileId);
    }

    @Override
    public MonitorSysGenFileSystemPart findByFileIdAndChunkNumber(Integer fileId, Integer chunkNumber) {
        log.debug("根据文件ID和分片序号查询分片: fileId={}, chunkNumber={}", fileId, chunkNumber);
        return baseMapper.findByFileIdAndChunkNumber(fileId, chunkNumber);
    }

    @Override
    public int countCompletedChunks(Integer fileId) {
        log.debug("统计文件已完成的分片数: fileId={}", fileId);
        return baseMapper.countCompletedChunks(fileId);
    }

    @Override
    public boolean updateStatus(Integer partId, Integer status) {
        log.debug("更新分片状态: partId={}, status={}", partId, status);
        return baseMapper.updateStatus(partId, status) > 0;
    }

    @Override
    public boolean updateStatusByFileId(Integer fileId, Integer status) {
        log.debug("批量更新文件的所有分片状态: fileId={}, status={}", fileId, status);
        return baseMapper.updateStatusByFileId(fileId, status) > 0;
    }

    @Override
    public boolean deleteByFileId(Integer fileId) {
        log.debug("根据文件ID删除所有分片: fileId={}", fileId);
        return baseMapper.deleteByFileId(fileId) >= 0;
    }

    @Override
    public List<MonitorSysGenFileSystemPart> findPendingChunks(Integer limit) {
        log.debug("查询待处理的分片: limit={}", limit);
        return baseMapper.findPendingChunks(limit);
    }

    @Override
    public List<MonitorSysGenFileSystemPart> findFailedChunksForRetry(Integer maxRetryCount, Integer limit) {
        log.debug("查询失败的分片(可重试): maxRetryCount={}, limit={}", maxRetryCount, limit);
        return baseMapper.findFailedChunksForRetry(maxRetryCount, limit);
    }

    @Override
    public boolean incrementRetryCount(Integer partId) {
        log.debug("增加重试次数: partId={}", partId);
        return baseMapper.incrementRetryCount(partId) > 0;
    }
}
