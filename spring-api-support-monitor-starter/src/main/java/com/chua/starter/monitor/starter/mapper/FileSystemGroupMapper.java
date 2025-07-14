package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.FileSystemGroup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 文件系统分组Mapper接口
 *
 * @author CH
 * @since 2024/12/30
 */
@Mapper
public interface FileSystemGroupMapper extends BaseMapper<FileSystemGroup> {

    /**
     * 查询所有根分组（父ID为null的分组）
     *
     * @return 根分组列表
     */
    List<FileSystemGroup> selectRootGroups();

    /**
     * 根据父ID查询子分组
     *
     * @param parentId 父分组ID
     * @return 子分组列表
     */
    List<FileSystemGroup> selectByParentId(@Param("parentId") Integer parentId);

    /**
     * 查询分组树形结构（包含文件数量统计）
     *
     * @return 分组树形结构
     */
    List<FileSystemGroup> selectGroupTreeWithFileCount();

    /**
     * 根据完整路径查询分组
     *
     * @param fullPath 完整路径
     * @return 分组信息
     */
    FileSystemGroup selectByFullPath(@Param("fullPath") String fullPath);

    /**
     * 查询指定分组及其所有子分组的ID列表
     *
     * @param groupId 分组ID
     * @return 分组ID列表（包含自身和所有子分组）
     */
    List<Integer> selectGroupAndChildrenIds(@Param("groupId") Integer groupId);

    /**
     * 更新分组的完整路径
     *
     * @param groupId  分组ID
     * @param fullPath 完整路径
     * @return 更新行数
     */
    int updateFullPath(@Param("groupId") Integer groupId, @Param("fullPath") String fullPath);

    /**
     * 查询默认分组
     *
     * @return 默认分组
     */
    FileSystemGroup selectDefaultGroup();

    /**
     * 统计分组下的文件数量
     *
     * @param groupId 分组ID
     * @return 文件数量
     */
    Long countFilesByGroupId(@Param("groupId") Integer groupId);
}
