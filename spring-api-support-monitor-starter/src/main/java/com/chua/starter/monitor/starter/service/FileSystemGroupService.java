package com.chua.starter.monitor.starter.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.starter.monitor.starter.entity.FileSystemGroup;

import java.util.List;

/**
 * 文件系统分组服务接口
 *
 * @author CH
 * @since 2024/12/30
 */
public interface FileSystemGroupService extends IService<FileSystemGroup> {

    /**
     * 获取分组树形结构（包含文件数量统计）
     *
     * @return 分组树形结构
     */
    List<FileSystemGroup> getGroupTree();

    /**
     * 创建分组
     *
     * @param group 分组信息
     * @return 创建的分组
     */
    FileSystemGroup createGroup(FileSystemGroup group);

    /**
     * 更新分组
     *
     * @param group 分组信息
     * @return 更新的分组
     */
    FileSystemGroup updateGroup(FileSystemGroup group);

    /**
     * 删除分组（级联删除子分组）
     *
     * @param groupId 分组ID
     * @return 是否删除成功
     */
    boolean deleteGroup(Integer groupId);

    /**
     * 移动分组到新的父分组下
     *
     * @param groupId       分组ID
     * @param newParentId   新父分组ID
     * @return 是否移动成功
     */
    boolean moveGroup(Integer groupId, Integer newParentId);

    /**
     * 获取或创建默认分组
     *
     * @return 默认分组
     */
    FileSystemGroup getOrCreateDefaultGroup();

    /**
     * 根据分组ID获取该分组及其所有子分组的ID列表
     *
     * @param groupId 分组ID
     * @return 分组ID列表
     */
    List<Integer> getGroupAndChildrenIds(Integer groupId);

    /**
     * 迁移文件到指定分组
     *
     * @param fileIds       文件ID列表
     * @param targetGroupId 目标分组ID
     * @return 迁移成功的文件数量
     */
    int migrateFilesToGroup(List<Integer> fileIds, Integer targetGroupId);

    /**
     * 初始化默认分组
     */
    void initDefaultGroups();

    /**
     * 根据文件类型自动分配分组
     *
     * @param fileExtension 文件扩展名
     * @return 分组ID
     */
    Integer getGroupByFileType(String fileExtension);

    /**
     * 更新分组的树链路路径
     *
     * @param groupId 分组ID
     */
    void updateTreePath(Integer groupId);

    /**
     * 批量更新子分组的树链路路径
     *
     * @param parentId 父分组ID
     */
    void updateChildrenTreePath(Integer parentId);
}
