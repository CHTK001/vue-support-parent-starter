package com.chua.starter.monitor.starter.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.monitor.starter.entity.FileSystem;
import com.chua.starter.monitor.starter.entity.FileSystemGroup;
import com.chua.starter.monitor.starter.mapper.FileSystemGroupMapper;
import com.chua.starter.monitor.starter.mapper.FileSystemMapper;
import com.chua.starter.monitor.starter.service.FileSystemGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 文件系统分组服务实现
 *
 * @author CH
 * @since 2024/12/30
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileSystemGroupServiceImpl extends ServiceImpl<FileSystemGroupMapper, FileSystemGroup>
        implements FileSystemGroupService {

    private final FileSystemMapper fileSystemMapper;

    /**
     * 图片文件扩展名
     */
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico",
            "tiff", "tga");

    /**
     * 视频文件扩展名
     */
    private static final Set<String> VIDEO_EXTENSIONS = Set.of("mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "m4v",
            "3gp", "rmvb", "rm");

    @Override
    public List<FileSystemGroup> getGroupTree() {
        // 获取所有分组（包含文件数量统计）
        List<FileSystemGroup> allGroups = baseMapper.selectGroupTreeWithFileCount();

        // 构建树形结构
        return buildTree(allGroups);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FileSystemGroup createGroup(FileSystemGroup group) {
        // 设置默认值
        if (group.getFileSystemGroupStatus() == null) {
            group.setFileSystemGroupStatus(FileSystemGroup.GroupStatus.ENABLED);
        }
        if (group.getFileSystemGroupSort() == null) {
            group.setFileSystemGroupSort(0);
        }
        if (group.getFileSystemGroupIsDefault() == null) {
            group.setFileSystemGroupIsDefault(false);
        }

        // 计算层级和路径
        calculateGroupPaths(group);

        // 保存分组
        save(group);

        // 创建物理目录
        createPhysicalDirectory(group);

        log.info("创建文件分组成功: {}", group.getFileSystemGroupName());
        return group;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FileSystemGroup updateGroup(FileSystemGroup group) {
        FileSystemGroup existingGroup = getById(group.getFileSystemGroupId());
        if (existingGroup == null) {
            throw new RuntimeException("分组不存在");
        }

        // 如果父分组发生变化，需要重新计算路径
        if (!Objects.equals(existingGroup.getFileSystemGroupParentId(), group.getFileSystemGroupParentId())) {
            calculateGroupPaths(group);
            // 更新所有子分组的路径
            updateChildrenTreePath(group.getFileSystemGroupId());
        }

        updateById(group);
        log.info("更新文件分组成功: {}", group.getFileSystemGroupName());
        return group;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteGroup(Integer groupId) {
        FileSystemGroup group = getById(groupId);
        if (group == null) {
            return false;
        }

        // 检查是否有文件在此分组下
        Long fileCount = baseMapper.countFilesByGroupId(groupId);
        if (fileCount > 0) {
            throw new RuntimeException("分组下还有文件，无法删除");
        }

        // 获取所有子分组ID
        List<Integer> childrenIds = getGroupAndChildrenIds(groupId);

        // 检查子分组是否有文件
        for (Integer childId : childrenIds) {
            if (!childId.equals(groupId)) {
                Long childFileCount = baseMapper.countFilesByGroupId(childId);
                if (childFileCount > 0) {
                    throw new RuntimeException("子分组下还有文件，无法删除");
                }
            }
        }

        // 删除所有子分组
        removeByIds(childrenIds);

        log.info("删除文件分组成功: {}", group.getFileSystemGroupName());
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean moveGroup(Integer groupId, Integer newParentId) {
        FileSystemGroup group = getById(groupId);
        if (group == null) {
            return false;
        }

        // 检查是否形成循环引用
        if (newParentId != null && isCircularReference(groupId, newParentId)) {
            throw new RuntimeException("不能移动到自己的子分组下");
        }

        group.setFileSystemGroupParentId(newParentId);
        calculateGroupPaths(group);
        updateById(group);

        // 更新所有子分组的路径
        updateChildrenTreePath(groupId);

        log.info("移动文件分组成功: {} -> {}", groupId, newParentId);
        return true;
    }

    @Override
    public FileSystemGroup getOrCreateDefaultGroup() {
        FileSystemGroup defaultGroup = baseMapper.selectDefaultGroup();
        if (defaultGroup == null) {
            // 创建默认分组
            defaultGroup = new FileSystemGroup();
            defaultGroup.setFileSystemGroupName(FileSystemGroup.DefaultGroupType.DEFAULT);
            defaultGroup.setFileSystemGroupPath("default");
            defaultGroup.setFileSystemGroupDescription("默认分组");
            defaultGroup.setFileSystemGroupIsDefault(true);
            defaultGroup.setFileSystemGroupStatus(FileSystemGroup.GroupStatus.ENABLED);
            defaultGroup.setFileSystemGroupSort(999);
            defaultGroup.setFileSystemGroupIcon("ri:folder-line");
            defaultGroup.setFileSystemGroupColor("#909399");

            createGroup(defaultGroup);
        }
        return defaultGroup;
    }

    @Override
    public List<Integer> getGroupAndChildrenIds(Integer groupId) {
        return baseMapper.selectGroupAndChildrenIds(groupId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int migrateFilesToGroup(List<Integer> fileIds, Integer targetGroupId) {
        if (CollectionUtils.isEmpty(fileIds)) {
            return 0;
        }

        // 验证目标分组是否存在
        FileSystemGroup targetGroup = getById(targetGroupId);
        if (targetGroup == null) {
            throw new RuntimeException("目标分组不存在");
        }

        // 批量更新文件的分组ID
        LambdaUpdateWrapper<FileSystem> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.in(FileSystem::getFileSystemId, fileIds).set(FileSystem::getFileSystemGroupId, targetGroupId)
                .set(FileSystem::getUpdateTime, LocalDateTime.now());

        int updatedCount = fileSystemMapper.update(null, updateWrapper);
        log.info("迁移文件到分组成功: {} 个文件迁移到分组 {}", updatedCount, targetGroup.getFileSystemGroupName());

        return updatedCount;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void initDefaultGroups() {
        // 检查是否已经初始化
        long count = count();
        if (count > 0) {
            log.info("文件分组已存在，跳过初始化");
            return;
        }

        List<FileSystemGroup> defaultGroups = Arrays.asList(
                createDefaultGroup(FileSystemGroup.DefaultGroupType.IMAGE, "images", "图片文件分组", "ri:image-line",
                        "#67C23A", 1),
                createDefaultGroup(FileSystemGroup.DefaultGroupType.VIDEO, "videos", "视频文件分组", "ri:video-line",
                        "#E6A23C", 2),
                createDefaultGroup(FileSystemGroup.DefaultGroupType.DOCUMENT, "documents", "文档文件分组",
                        "ri:file-text-line", "#409EFF", 3),
                createDefaultGroup(FileSystemGroup.DefaultGroupType.DEFAULT, "default", "默认分组", "ri:folder-line",
                        "#909399", 4));

        // 设置默认分组标记
        defaultGroups.get(3).setFileSystemGroupIsDefault(true);

        saveBatch(defaultGroups);

        // 为每个分组创建物理目录
        defaultGroups.forEach(this::createPhysicalDirectory);

        log.info("初始化默认文件分组成功");
    }

    @Override
    public Integer getGroupByFileType(String fileExtension) {
        if (!StringUtils.hasText(fileExtension)) {
            return getOrCreateDefaultGroup().getFileSystemGroupId();
        }

        String ext = fileExtension.toLowerCase();

        // 查找对应类型的分组
        LambdaQueryWrapper<FileSystemGroup> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(FileSystemGroup::getFileSystemGroupStatus, FileSystemGroup.GroupStatus.ENABLED);

        if (IMAGE_EXTENSIONS.contains(ext)) {
            queryWrapper.eq(FileSystemGroup::getFileSystemGroupName, FileSystemGroup.DefaultGroupType.IMAGE);
        } else if (VIDEO_EXTENSIONS.contains(ext)) {
            queryWrapper.eq(FileSystemGroup::getFileSystemGroupName, FileSystemGroup.DefaultGroupType.VIDEO);
        } else {
            queryWrapper.eq(FileSystemGroup::getFileSystemGroupName, FileSystemGroup.DefaultGroupType.DOCUMENT);
        }

        FileSystemGroup group = getOne(queryWrapper);
        return group != null ? group.getFileSystemGroupId() : getOrCreateDefaultGroup().getFileSystemGroupId();
    }

    @Override
    public void updateTreePath(Integer groupId) {
        FileSystemGroup group = getById(groupId);
        if (group == null) {
            return;
        }

        calculateGroupPaths(group);
        updateById(group);
    }

    @Override
    public void updateChildrenTreePath(Integer parentId) {
        List<FileSystemGroup> children = baseMapper.selectByParentId(parentId);
        for (FileSystemGroup child : children) {
            calculateGroupPaths(child);
            updateById(child);
            // 递归更新子分组
            updateChildrenTreePath(child.getFileSystemGroupId());
        }
    }

    /**
     * 构建树形结构
     */
    private List<FileSystemGroup> buildTree(List<FileSystemGroup> allGroups) {
        Map<Integer, FileSystemGroup> groupMap = allGroups.stream()
                .collect(Collectors.toMap(FileSystemGroup::getFileSystemGroupId, group -> group));

        List<FileSystemGroup> rootGroups = new ArrayList<>();

        for (FileSystemGroup group : allGroups) {
            if (group.getFileSystemGroupParentId() == null) {
                rootGroups.add(group);
            } else {
                FileSystemGroup parent = groupMap.get(group.getFileSystemGroupParentId());
                if (parent != null) {
                    if (parent.getChildren() == null) {
                        parent.setChildren(new ArrayList<>());
                    }
                    parent.getChildren().add(group);
                }
            }
        }

        return rootGroups;
    }

    /**
     * 计算分组的路径信息
     */
    private void calculateGroupPaths(FileSystemGroup group) {
        if (group.getFileSystemGroupParentId() == null) {
            // 根分组
            group.setFileSystemGroupLevel(1);
            group.setFileSystemGroupFullPath(group.getFileSystemGroupPath());
            group.setFileSystemGroupTreePath(group.getFileSystemGroupId().toString());
        } else {
            // 子分组
            FileSystemGroup parent = getById(group.getFileSystemGroupParentId());
            if (parent != null) {
                group.setFileSystemGroupLevel(parent.getFileSystemGroupLevel() + 1);
                group.setFileSystemGroupFullPath(
                        parent.getFileSystemGroupFullPath() + "/" + group.getFileSystemGroupPath());
                group.setFileSystemGroupTreePath(
                        parent.getFileSystemGroupTreePath() + "," + group.getFileSystemGroupId());
            }
        }
    }

    /**
     * 检查是否形成循环引用
     */
    private boolean isCircularReference(Integer groupId, Integer newParentId) {
        List<Integer> childrenIds = getGroupAndChildrenIds(groupId);
        return childrenIds.contains(newParentId);
    }

    /**
     * 创建默认分组
     */
    private FileSystemGroup createDefaultGroup(String name, String path, String description, String icon, String color,
            int sort) {
        FileSystemGroup group = new FileSystemGroup();
        group.setFileSystemGroupName(name);
        group.setFileSystemGroupPath(path);
        group.setFileSystemGroupDescription(description);
        group.setFileSystemGroupIcon(icon);
        group.setFileSystemGroupColor(color);
        group.setFileSystemGroupSort(sort);
        group.setFileSystemGroupStatus(FileSystemGroup.GroupStatus.ENABLED);
        group.setFileSystemGroupIsDefault(false);
        group.setFileSystemGroupLevel(1);
        group.setFileSystemGroupFullPath(path);

        return group;
    }

    /**
     * 创建物理目录
     */
    private void createPhysicalDirectory(FileSystemGroup group) {
        try {
            String fullPath = group.getFileSystemGroupFullPath();
            if (StringUtils.hasText(fullPath)) {
                File directory = new File(fullPath);
                if (!directory.exists()) {
                    boolean created = directory.mkdirs();
                    if (created) {
                        log.info("创建分组物理目录成功: {}", fullPath);
                    } else {
                        log.warn("创建分组物理目录失败: {}", fullPath);
                    }
                }
            }
        } catch (Exception e) {
            log.error("创建分组物理目录异常: {}", group.getFileSystemGroupFullPath(), e);
        }
    }
}
