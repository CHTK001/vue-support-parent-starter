package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.FileSystemGroup;
import com.chua.starter.monitor.starter.service.FileSystemGroupService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 文件系统分组控制器
 *
 * @author CH
 * @since 2024/12/30
 */
@Slf4j
@RestController
@RequestMapping("/v1/filesystem/group")
@RequiredArgsConstructor
@Validated
@Api(tags = "文件系统分组管理")
@Tag(name = "文件系统分组管理", description = "文件系统分组的增删改查和树形结构管理")
public class FileSystemGroupController {

    private final FileSystemGroupService fileSystemGroupService;

    /**
     * 获取分组树形结构
     *
     * @return 分组树形结构
     */
    @GetMapping("/tree")
    @ApiOperation("获取分组树形结构")
    @Operation(summary = "获取分组树形结构", description = "获取文件系统分组的树形结构，包含文件数量统计")
    public ReturnResult<List<FileSystemGroup>> getGroupTree() {
        try {
            List<FileSystemGroup> tree = fileSystemGroupService.getGroupTree();
            return ReturnResult.ok(tree);
        } catch (Exception e) {
            log.error("获取分组树形结构失败", e);
            return ReturnResult.error("获取分组树形结构失败: " + e.getMessage());
        }
    }

    /**
     * 创建分组
     *
     * @param group 分组信息
     * @return 创建结果
     */
    @PostMapping
    @ApiOperation("创建分组")
    @Operation(summary = "创建分组", description = "创建新的文件系统分组")
    public ReturnResult<FileSystemGroup> createGroup(
            @Valid @RequestBody @ApiParam("分组信息") @Parameter(description = "分组信息") FileSystemGroup group) {
        try {
            FileSystemGroup createdGroup = fileSystemGroupService.createGroup(group);
            return ReturnResult.ok(createdGroup);
        } catch (Exception e) {
            log.error("创建分组失败", e);
            return ReturnResult.error("创建分组失败: " + e.getMessage());
        }
    }

    /**
     * 更新分组
     *
     * @param group 分组信息
     * @return 更新结果
     */
    @PutMapping
    @ApiOperation("更新分组")
    @Operation(summary = "更新分组", description = "更新文件系统分组信息")
    public ReturnResult<FileSystemGroup> updateGroup(
            @Valid @RequestBody @ApiParam("分组信息") @Parameter(description = "分组信息") FileSystemGroup group) {
        try {
            FileSystemGroup updatedGroup = fileSystemGroupService.updateGroup(group);
            return ReturnResult.ok(updatedGroup);
        } catch (Exception e) {
            log.error("更新分组失败", e);
            return ReturnResult.error("更新分组失败: " + e.getMessage());
        }
    }

    /**
     * 删除分组
     *
     * @param groupId 分组ID
     * @return 删除结果
     */
    @DeleteMapping("/{groupId}")
    @ApiOperation("删除分组")
    @Operation(summary = "删除分组", description = "删除文件系统分组（级联删除子分组）")
    public ReturnResult<Boolean> deleteGroup(
            @PathVariable @NotNull @ApiParam("分组ID") @Parameter(description = "分组ID") Integer groupId) {
        try {
            boolean deleted = fileSystemGroupService.deleteGroup(groupId);
            return ReturnResult.ok(deleted);
        } catch (Exception e) {
            log.error("删除分组失败: groupId={}", groupId, e);
            return ReturnResult.error("删除分组失败: " + e.getMessage());
        }
    }

    /**
     * 移动分组
     *
     * @param groupId     分组ID
     * @param newParentId 新父分组ID
     * @return 移动结果
     */
    @PutMapping("/{groupId}/move")
    @ApiOperation("移动分组")
    @Operation(summary = "移动分组", description = "将分组移动到新的父分组下")
    public ReturnResult<Boolean> moveGroup(
            @PathVariable @NotNull @ApiParam("分组ID") @Parameter(description = "分组ID") Integer groupId,
            @RequestParam(required = false) @ApiParam("新父分组ID") @Parameter(description = "新父分组ID") Integer newParentId) {
        try {
            boolean moved = fileSystemGroupService.moveGroup(groupId, newParentId);
            return ReturnResult.ok(moved);
        } catch (Exception e) {
            log.error("移动分组失败: groupId={}, newParentId={}", groupId, newParentId, e);
            return ReturnResult.error("移动分组失败: " + e.getMessage());
        }
    }

    /**
     * 获取分组及其子分组的ID列表
     *
     * @param groupId 分组ID
     * @return 分组ID列表
     */
    @GetMapping("/{groupId}/children-ids")
    @ApiOperation("获取分组及其子分组的ID列表")
    @Operation(summary = "获取分组及其子分组的ID列表", description = "获取指定分组及其所有子分组的ID列表")
    public ReturnResult<List<Integer>> getGroupAndChildrenIds(
            @PathVariable @NotNull @ApiParam("分组ID") @Parameter(description = "分组ID") Integer groupId) {
        try {
            List<Integer> ids = fileSystemGroupService.getGroupAndChildrenIds(groupId);
            return ReturnResult.ok(ids);
        } catch (Exception e) {
            log.error("获取分组及其子分组ID列表失败: groupId={}", groupId, e);
            return ReturnResult.error("获取分组及其子分组ID列表失败: " + e.getMessage());
        }
    }

    /**
     * 迁移文件到指定分组
     *
     * @param fileIds       文件ID列表
     * @param targetGroupId 目标分组ID
     * @return 迁移结果
     */
    @PutMapping("/migrate-files")
    @ApiOperation("迁移文件到指定分组")
    @Operation(summary = "迁移文件到指定分组", description = "将指定的文件迁移到目标分组")
    public ReturnResult<Integer> migrateFilesToGroup(
            @RequestParam @NotEmpty @ApiParam("文件ID列表") @Parameter(description = "文件ID列表") List<Integer> fileIds,
            @RequestParam @NotNull @ApiParam("目标分组ID") @Parameter(description = "目标分组ID") Integer targetGroupId) {
        try {
            int migratedCount = fileSystemGroupService.migrateFilesToGroup(fileIds, targetGroupId);
            return ReturnResult.ok(migratedCount);
        } catch (Exception e) {
            log.error("迁移文件到分组失败: fileIds={}, targetGroupId={}", fileIds, targetGroupId, e);
            return ReturnResult.error("迁移文件到分组失败: " + e.getMessage());
        }
    }

    /**
     * 初始化默认分组
     *
     * @return 初始化结果
     */
    @PostMapping("/init-default")
    @ApiOperation("初始化默认分组")
    @Operation(summary = "初始化默认分组", description = "初始化系统默认的文件分组（图片、视频、文档、默认）")
    public ReturnResult<String> initDefaultGroups() {
        try {
            fileSystemGroupService.initDefaultGroups();
            return ReturnResult.ok("初始化默认分组成功");
        } catch (Exception e) {
            log.error("初始化默认分组失败", e);
            return ReturnResult.error("初始化默认分组失败: " + e.getMessage());
        }
    }

    /**
     * 根据文件类型获取推荐分组
     *
     * @param fileExtension 文件扩展名
     * @return 推荐分组ID
     */
    @GetMapping("/recommend")
    @ApiOperation("根据文件类型获取推荐分组")
    @Operation(summary = "根据文件类型获取推荐分组", description = "根据文件扩展名自动推荐合适的分组")
    public ReturnResult<Integer> getRecommendedGroup(
            @RequestParam @ApiParam("文件扩展名") @Parameter(description = "文件扩展名") String fileExtension) {
        try {
            Integer groupId = fileSystemGroupService.getGroupByFileType(fileExtension);
            return ReturnResult.ok(groupId);
        } catch (Exception e) {
            log.error("获取推荐分组失败: fileExtension={}", fileExtension, e);
            return ReturnResult.error("获取推荐分组失败: " + e.getMessage());
        }
    }

    /**
     * 获取默认分组
     *
     * @return 默认分组
     */
    @GetMapping("/default")
    @ApiOperation("获取默认分组")
    @Operation(summary = "获取默认分组", description = "获取或创建默认分组")
    public ReturnResult<FileSystemGroup> getDefaultGroup() {
        try {
            FileSystemGroup defaultGroup = fileSystemGroupService.getOrCreateDefaultGroup();
            return ReturnResult.ok(defaultGroup);
        } catch (Exception e) {
            log.error("获取默认分组失败", e);
            return ReturnResult.error("获取默认分组失败: " + e.getMessage());
        }
    }
}
