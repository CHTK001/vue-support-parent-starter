package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.starter.mybatis.pojo.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * 文件系统分组实体 用于管理文件的分组分类
 *
 * @author CH
 * @since 2024/12/30
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("file_system_group")
@ApiModel(description = "文件系统分组")
@Schema(description = "文件系统分组")
public class FileSystemGroup extends SysBase {

    private static final long serialVersionUID = 1L;

    /**
     * 分组ID
     */
    @TableId(value = "file_system_group_id")
    @ApiModelProperty(value = "分组ID")
    @Schema(description = "分组ID")
    private Integer fileSystemGroupId;

    /**
     * 分组名称
     */
    @TableField(value = "file_system_group_name")
    @ApiModelProperty(value = "分组名称")
    @Schema(description = "分组名称")
    @NotBlank(message = "分组名称不能为空")
    @Size(max = 100, message = "分组名称最大长度要小于 100")
    private String fileSystemGroupName;

    /**
     * 父分组ID
     */
    @TableField(value = "file_system_group_parent_id")
    @ApiModelProperty(value = "父分组ID")
    @Schema(description = "父分组ID")
    private Integer fileSystemGroupParentId;

    /**
     * 分组目录路径（相对路径）
     */
    @TableField(value = "file_system_group_path")
    @ApiModelProperty(value = "分组目录路径")
    @Schema(description = "分组目录路径")
    @NotBlank(message = "分组目录路径不能为空")
    @Size(max = 500, message = "分组目录路径最大长度要小于 500")
    private String fileSystemGroupPath;

    /**
     * 分组完整路径（从根目录到当前目录的完整路径）
     */
    @TableField(value = "file_system_group_full_path")
    @ApiModelProperty(value = "分组完整路径")
    @Schema(description = "分组完整路径")
    @Size(max = 1000, message = "分组完整路径最大长度要小于 1000")
    private String fileSystemGroupFullPath;

    /**
     * 分组层级深度
     */
    @TableField(value = "file_system_group_level")
    @ApiModelProperty(value = "分组层级深度")
    @Schema(description = "分组层级深度")
    private Integer fileSystemGroupLevel;

    /**
     * 树链路ID（存储从根节点到当前节点的所有ID路径，用逗号分隔，如：1,3,5）
     */
    @TableField(value = "file_system_group_tree_path")
    @ApiModelProperty(value = "树链路ID")
    @Schema(description = "树链路ID，存储从根节点到当前节点的所有ID路径")
    @Size(max = 1000, message = "树链路ID最大长度要小于 1000")
    private String fileSystemGroupTreePath;

    /**
     * 分组描述
     */
    @TableField(value = "file_system_group_description")
    @ApiModelProperty(value = "分组描述")
    @Schema(description = "分组描述")
    @Size(max = 500, message = "分组描述最大长度要小于 500")
    private String fileSystemGroupDescription;

    /**
     * 是否为默认分组
     */
    @TableField(value = "file_system_group_is_default")
    @ApiModelProperty(value = "是否为默认分组")
    @Schema(description = "是否为默认分组")
    private Boolean fileSystemGroupIsDefault;

    /**
     * 分组排序
     */
    @TableField(value = "file_system_group_sort")
    @ApiModelProperty(value = "分组排序")
    @Schema(description = "分组排序")
    private Integer fileSystemGroupSort;

    /**
     * 分组状态：0-禁用，1-启用
     */
    @TableField(value = "file_system_group_status")
    @ApiModelProperty(value = "分组状态：0-禁用，1-启用")
    @Schema(description = "分组状态：0-禁用，1-启用")
    private Integer fileSystemGroupStatus;

    /**
     * 分组图标
     */
    @TableField(value = "file_system_group_icon")
    @ApiModelProperty(value = "分组图标")
    @Schema(description = "分组图标")
    @Size(max = 100, message = "分组图标最大长度要小于 100")
    private String fileSystemGroupIcon;

    /**
     * 分组颜色
     */
    @TableField(value = "file_system_group_color")
    @ApiModelProperty(value = "分组颜色")
    @Schema(description = "分组颜色")
    @Size(max = 20, message = "分组颜色最大长度要小于 20")
    private String fileSystemGroupColor;

    /**
     * 子分组列表（用于树形结构，不存储在数据库）
     */
    @TableField(exist = false)
    @ApiModelProperty(value = "子分组列表")
    @Schema(description = "子分组列表")
    private List<FileSystemGroup> children;

    /**
     * 文件数量（统计字段，不存储在数据库）
     */
    @TableField(exist = false)
    @ApiModelProperty(value = "文件数量")
    @Schema(description = "文件数量")
    private Long fileCount;

    /**
     * 分组状态枚举
     */
    public static class GroupStatus {
        public static final int DISABLED = 0; // 禁用
        public static final int ENABLED = 1; // 启用
    }

    /**
     * 默认分组类型
     */
    public static class DefaultGroupType {
        public static final String IMAGE = "图片";
        public static final String VIDEO = "视频";
        public static final String DOCUMENT = "文档";
        public static final String DEFAULT = "默认";
    }
}
