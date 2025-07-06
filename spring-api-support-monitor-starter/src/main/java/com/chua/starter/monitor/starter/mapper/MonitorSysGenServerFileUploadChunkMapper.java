package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerFileUploadChunk;
import org.apache.ibatis.annotations.Mapper;

/**
 * 服务器文件上传分片记录Mapper接口
 *
 * @author CH
 * @since 2025/01/06
 */
@Mapper
public interface MonitorSysGenServerFileUploadChunkMapper extends BaseMapper<MonitorSysGenServerFileUploadChunk> {
}
