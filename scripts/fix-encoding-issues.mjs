#!/usr/bin/env node
/**
 * 修复编码问题的文件
 * 使用 git 恢复文件，然后重新应用标签替换
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 有编码问题的文件列表
const encodingIssueFiles = [
  'packages/components/AliyunBenefitLayout/index.vue',
  'packages/components/ReDialog/index.vue',
  'packages/components/ReIcon/src/Select.vue',
  'packages/components/ScContextMenu/ScContextMenuExample.vue',
  'packages/components/ScCron/index.vue',
  'packages/components/ScDebugConsole/index.vue',
  'packages/components/ScDictSelect/index.vue',
  'packages/components/ScDrag/ScDragExample.vue',
  'packages/components/ScDymaicTable/columnSetting.vue',
  'packages/components/ScEcharts/ScEchartsExample.vue',
  'packages/components/ScEditor/ScEditorExample.vue',
  'packages/components/ScFilterBar/index.vue',
  'packages/components/ScFilterBar/src/index.vue',
  'packages/components/ScImage/components/ImageEditor.vue',
  'packages/components/ScInput/components/ListInput.vue',
  'packages/components/ScInput/components/SelectInput.vue',
  'packages/components/ScIp/index.vue',
  'packages/components/ScMessageDialog/index.vue',
  'packages/components/ScPromQL/demo.vue',
  'packages/components/ScPromQL/index.vue',
  'packages/components/ScSelect/components/DropdownLayout.vue',
  'packages/components/ScSelect/components/FilterLayout.vue',
  'packages/components/ScSelect/components/ScSelectTreeLayout.vue',
  'packages/components/ScSocketMessageDialog/index-refactored.vue',
  'packages/components/ScSwitch/components/ButtonLayout.vue',
  'packages/components/ScTable/components/GalleryView.vue',
  'packages/components/ScTable/components/TimelineView.vue',
  'packages/components/ScTable/index.vue',
  'packages/components/ScTable/plugins/columnSetting.vue',
  'packages/components/ScTable/plugins/Pagination.vue',
  'packages/components/ScUpload/file.vue',
  'packages/components/ScWorkflow/nodes/approver.vue',
  'packages/components/ScWorkflow/nodes/branch.vue',
  'packages/components/ScWorkflow/nodes/promoter.vue',
  'packages/components/ScWorkflow/nodes/send.vue',
  'packages/components/ScWorkflow/select.vue',
  'packages/module/memory/index.vue',
  'packages/module/time/index.vue',
  'pages/common/home/default/index.vue',
  'pages/common/home/default/layout/CustomLayout.vue',
  'pages/common/home/default/layout/DraggableLayout.vue',
  'pages/common/login/components/ThemeSwitcher.vue',
  'pages/common/page/message/MessageCenter.vue',
  'pages/common/sync-data/components/SyncTaskDesigner.vue',
  'pages/common/template/index.vue',
  'pages/common/template/save.vue',
  'packages/components-standalone/ScLayer/components/BoundaryBreadcrumb.vue',
  'packages/components-standalone/ScLayer/components/BoundaryPanel.vue',
  'packages/components-standalone/ScLayer/components/MarkerDetail.vue',
  'layout/default/src/components/lay-message/index.vue',
  'pages/dict/src/components/layout.vue',
  'pages/doc/src/components/ApiParamsEditor.vue',
  'pages/doc/src/components/NodeSelector.vue',
  'pages/example/src/components/ScCodeExample.vue',
  'pages/example/src/components/ScLoadExample.vue',
  'pages/example/src/components/ScSocketEventProcessExample.vue',
  'pages/example/src/components/ScTreeExample.vue',
  'pages/project/src/views/project/index.vue',
  'pages/project/src/views/project/index20250903.vue',
  'pages/strategy/src/views/limit/LimitConfigurationIndex.vue',
  'pages/strategy/src/views/limit/LimitRecordIndex.vue',
  'pages/system/src/holiday/HolidayIndex.vue',
  'pages/system/src/job/JobIndex.vue',
  'pages/tools/src/plugins/calculator.vue',
  'pages/tools/src/plugins/css-beautify.vue',
  'pages/tools/src/plugins/keycode.vue',
  'pages/tools/src/plugins/meme.vue',
  'pages/tools/src/plugins/pomodoro.vue',
];

// el- 标签到 Sc 标签的映射
const tagMapping = {
  'el-button': 'ScButton',
  'el-input': 'ScInput',
  'el-select': 'ScSelect',
  'el-option': 'ScOption',
  'el-form': 'ScForm',
  'el-form-item': 'ScFormItem',
  'el-table': 'ScTable',
  'el-table-column': 'ScTableColumn',
  'el-dialog': 'ScDialog',
  'el-card': 'ScCard',
  'el-row': 'ScRow',
  'el-col': 'ScCol',
  'el-pagination': 'ScPagination',
  'el-tag': 'ScTag',
  'el-switch': 'ScSwitch',
  'el-checkbox': 'ScCheckbox',
  'el-radio': 'ScRadio',
  'el-date-picker': 'ScDatePicker',
  'el-time-picker': 'ScTimePicker',
  'el-upload': 'ScUpload',
  'el-tree': 'ScTree',
  'el-dropdown': 'ScDropdown',
  'el-dropdown-menu': 'ScDropdownMenu',
  'el-dropdown-item': 'ScDropdownItem',
  'el-menu': 'ScMenu',
  'el-menu-item': 'ScMenuItem',
  'el-submenu': 'ScSubmenu',
  'el-tabs': 'ScTabs',
  'el-tab-pane': 'ScTabPane',
  'el-popover': 'ScPopover',
  'el-tooltip': 'ScTooltip',
  'el-drawer': 'ScDrawer',
  'el-icon': 'ScIcon',
  'el-input-number': 'ScInputNumber',
  'el-cascader': 'ScCascader',
  'el-slider': 'ScSlider',
  'el-rate': 'ScRate',
  'el-color-picker': 'ScColorPicker',
  'el-transfer': 'ScTransfer',
  'el-container': 'ScContainer',
  'el-header': 'ScHeader',
  'el-aside': 'ScAside',
  'el-main': 'ScMain',
  'el-footer': 'ScFooter',
  'el-link': 'ScLink',
  'el-divider': 'ScDivider',
  'el-image': 'ScImage',
  'el-avatar': 'ScAvatar',
  'el-badge': 'ScBadge',
  'el-alert': 'ScAlert',
  'el-breadcrumb': 'ScBreadcrumb',
  'el-breadcrumb-item': 'ScBreadcrumbItem',
  'el-steps': 'ScSteps',
  'el-step': 'ScStep',
  'el-progress': 'ScProgress',
  'el-empty': 'ScEmpty',
  'el-descriptions': 'ScDescriptions',
  'el-descriptions-item': 'ScDescriptionsItem',
  'el-result': 'ScResult',
  'el-skeleton': 'ScSkeleton',
  'el-skeleton-item': 'ScSkeletonItem',
  'el-scrollbar': 'ScScrollbar',
  'el-backtop': 'ScBacktop',
  'el-page-header': 'ScPageHeader',
  'el-calendar': 'ScCalendar',
  'el-timeline': 'ScTimeline',
  'el-timeline-item': 'ScTimelineItem',
  'el-collapse': 'ScCollapse',
  'el-collapse-item': 'ScCollapseItem',
  'el-carousel': 'ScCarousel',
  'el-carousel-item': 'ScCarouselItem',
  'el-autocomplete': 'ScAutocomplete',
  'el-checkbox-group': 'ScCheckboxGroup',
  'el-radio-group': 'ScRadioGroup',
  'el-popconfirm': 'ScPopconfirm',
};

const stats = {
  total: 0,
  restored: 0,
  failed: 0,
  tagsReplaced: 0,
};

/**
 * 替换标签
 */
function replaceTags(content) {
  let newContent = content;
  let replacedCount = 0;

  for (const [elTag, scTag] of Object.entries(tagMapping)) {
    const openTagRegex = new RegExp(`<${elTag}(\\s|>|/)`, 'g');
    const openMatches = newContent.match(openTagRegex);
    if (openMatches) {
      replacedCount += openMatches.length;
      newContent = newContent.replace(openTagRegex, `<${scTag}$1`);
    }

    const closeTagRegex = new RegExp(`</${elTag}>`, 'g');
    const closeMatches = newContent.match(closeTagRegex);
    if (closeMatches) {
      replacedCount += closeMatches.length;
      newContent = newContent.replace(closeTagRegex, `</${scTag}>`);
    }
  }

  return { content: newContent, count: replacedCount };
}

/**
 * 处理单个文件
 */
function processFile(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  
  try {
    // 1. 使用 git 恢复文件
    console.log(`  📝 恢复文件: ${relativePath}`);
    try {
      execSync(`git checkout HEAD -- "${relativePath}"`, { 
        cwd: rootDir,
        stdio: 'pipe'
      });
    } catch (gitError) {
      console.log(`  ⚠️  Git 恢复失败，尝试直接处理: ${relativePath}`);
    }

    // 2. 读取文件
    if (!fs.existsSync(filePath)) {
      console.log(`  ✗ 文件不存在: ${relativePath}`);
      stats.failed++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // 3. 替换标签
    const { content: newContent, count } = replaceTags(content);
    
    if (count > 0) {
      // 4. 写回文件
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  ✓ 成功修复并替换了 ${count} 个标签: ${relativePath}`);
      stats.restored++;
      stats.tagsReplaced += count;
    } else {
      console.log(`  ✓ 成功恢复（无需替换标签）: ${relativePath}`);
      stats.restored++;
    }

  } catch (error) {
    console.error(`  ✗ 处理失败: ${relativePath}`, error.message);
    stats.failed++;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔧 开始修复编码问题的文件...\n');
  console.log('工作目录:', rootDir);
  console.log(`总文件数: ${encodingIssueFiles.length}\n`);

  stats.total = encodingIssueFiles.length;

  // 处理每个文件
  for (const file of encodingIssueFiles) {
    processFile(file);
  }

  // 输出统计信息
  console.log('\n' + '='.repeat(60));
  console.log('📊 修复完成！统计信息：');
  console.log('='.repeat(60));
  console.log(`总文件数:     ${stats.total}`);
  console.log(`成功修复:     ${stats.restored}`);
  console.log(`失败:         ${stats.failed}`);
  console.log(`替换标签数:   ${stats.tagsReplaced}`);
  console.log('='.repeat(60));

  if (stats.failed > 0) {
    console.log('\n⚠️  部分文件修复失败，请手动检查');
  } else {
    console.log('\n✅ 所有文件已成功修复！');
  }
}

main();
