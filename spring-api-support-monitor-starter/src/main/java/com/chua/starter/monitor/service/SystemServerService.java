package com.chua.starter.monitor.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.starter.monitor.entity.SystemServer;

import java.util.Map;

/**
 * 系统服务器管理服务接口
 *
 * @author CH
 * @since 2025/01/07
 */
public interface SystemServerService extends IService<SystemServer> {

    /**
     * 分页查询服务器列表
     *
     * @param page   分页参数
     * @param entity 查询条件
     * @return 分页结果
     */
    IPage<SystemServer> pageFor(Page<SystemServer> page, SystemServer entity);

    /**
     * 创建服务器
     *
     * @param systemServer 服务器信息
     * @return 创建的服务器
     */
    SystemServer createServer(SystemServer systemServer);

    /**
     * 更新服务器
     *
     * @param systemServer 服务器信息
     * @return 更新的服务器
     */
    SystemServer updateServer(SystemServer systemServer);

    /**
     * 删除服务器
     *
     * @param id 服务器ID
     * @return 删除结果
     */
    boolean deleteServer(Integer id);

    /**
     * 启动服务器
     *
     * @param id 服务器ID
     * @return 启动结果
     */
    boolean startServer(Integer id);

    /**
     * 停止服务器
     *
     * @param id 服务器ID
     * @return 停止结果
     */
    boolean stopServer(Integer id);

    /**
     * 重启服务器
     *
     * @param id 服务器ID
     * @return 重启结果
     */
    boolean restartServer(Integer id);

    /**
     * 获取服务器状态
     *
     * @param id 服务器ID
     * @return 服务器状态
     */
    String getServerStatus(Integer id);

    /**
     * 获取状态统计
     *
     * @return 状态统计
     */
    Map<String, Object> getStatusStatistics();

    /**
     * 获取类型统计
     *
     * @return 类型统计
     */
    Map<String, Object> getTypeStatistics();

    /**
     * 克隆服务器配置
     *
     * @param sourceId 源服务器ID
     * @param newName 新服务器名称
     * @param newPort 新服务器端口
     * @return 克隆的服务器
     */
    SystemServer cloneServer(Integer sourceId, String newName, Integer newPort);

    /**
     * 批量操作服务器
     *
     * @param serverIds 服务器ID列表
     * @param operation 操作类型 (start/stop/restart/delete)
     * @return 操作结果
     */
    boolean batchOperation(String serverIds, String operation);

    /**
     * 自动启动所有配置为自动启动的服务器
     *
     * @return 启动结果
     */
    boolean autoStartServers();

    /**
     * 检查端口是否被占用
     *
     * @param port 端口号
     * @return 是否被占用
     */
    boolean isPortInUse(Integer port);

    /**
     * 检查服务器名称是否已存在
     *
     * @param name 服务器名称
     * @param excludeId 排除的服务器ID（用于更新时检查）
     * @return 是否已存在
     */
    boolean isServerNameExists(String name, Integer excludeId);

    /**
     * 获取服务器健康状态
     *
     * @param id 服务器ID
     * @return 健康状态
     */
    Map<String, Object> getServerHealth(Integer id);

    /**
     * 获取服务器日志
     *
     * @param id 服务器ID
     * @param lines 日志行数
     * @return 日志内容
     */
    String getServerLogs(Integer id, Integer lines);

    /**
     * 清理服务器日志
     *
     * @param id 服务器ID
     * @return 清理结果
     */
    boolean clearServerLogs(Integer id);

    /**
     * 获取服务器配置
     *
     * @param id 服务器ID
     * @return 服务器配置
     */
    Map<String, Object> getServerConfig(Integer id);

    /**
     * 更新服务器配置
     *
     * @param id 服务器ID
     * @param config 配置信息
     * @return 更新结果
     */
    boolean updateServerConfig(Integer id, Map<String, Object> config);

    /**
     * 导出服务器配置
     *
     * @param id 服务器ID
     * @return 配置内容
     */
    String exportServerConfig(Integer id);

    /**
     * 导入服务器配置
     *
     * @param configContent 配置内容
     * @return 导入结果
     */
    SystemServer importServerConfig(String configContent);

    /**
     * 获取服务器性能指标
     *
     * @param id 服务器ID
     * @return 性能指标
     */
    Map<String, Object> getServerMetrics(Integer id);

    /**
     * 获取服务器环境信息
     *
     * @param id 服务器ID
     * @return 环境信息
     */
    Map<String, Object> getServerEnvironment(Integer id);

    /**
     * 测试服务器连接
     *
     * @param id 服务器ID
     * @return 连接测试结果
     */
    Map<String, Object> testServerConnection(Integer id);

    /**
     * 获取服务器进程信息
     *
     * @param id 服务器ID
     * @return 进程信息
     */
    Map<String, Object> getServerProcessInfo(Integer id);

    /**
     * 获取服务器网络信息
     *
     * @param id 服务器ID
     * @return 网络信息
     */
    Map<String, Object> getServerNetworkInfo(Integer id);
}
