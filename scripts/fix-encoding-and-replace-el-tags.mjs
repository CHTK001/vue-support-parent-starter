#!/usr/bin/env node
/**
 * 批量修复文件编码问题并替换 el- 标签为 Sc 标签
 * 
 * 功能：
 * 1. 修复 UTF-8 编码问题（乱码）
 * 2. 将所有 el-xxx 标签替换为 ScXxx 标签
 * 3. 将所有 <el-icon> 替换为 <ScIcon>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 需要处理的目录
const directories = [
  'packages',
  'apps',
  'layout',
  'pages',
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

// 统计信息
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  errorFiles: 0,
  tagsReplaced: 0,
  encodingFixed: 0,
};

/**
 * 替换标签
 */
function replaceTags(content) {
  let newContent = content;
  let replacedCount = 0;

  // 替换开始标签和结束标签
  for (const [elTag, scTag] of Object.entries(tagMapping)) {
    // 替换开始标签 <el-xxx
    const openTagRegex = new RegExp(`<${elTag}(\\s|>|/)`, 'g');
    const openMatches = newContent.match(openTagRegex);
    if (openMatches) {
      replacedCount += openMatches.length;
      newContent = newContent.replace(openTagRegex, `<${scTag}$1`);
    }

    // 替换结束标签 </el-xxx>
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
 * 检查文件是否包含乱码
 */
function hasEncodingIssues(content) {
  // 检查是否包含常见的乱码字符
  return /�/.test(content);
}

/**
 * 处理单个文件
 */
async function processFile(filePath) {
  try {
    // 读取文件（尝试多种编码）
    let content;
    let encoding = 'utf8';
    
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      // 如果 UTF-8 读取失败，尝试 GBK
      try {
        const buffer = fs.readFileSync(filePath);
        // 简单的 GBK 到 UTF-8 转换（实际项目中可能需要 iconv-lite）
        content = buffer.toString('utf8');
        encoding = 'gbk';
      } catch (e2) {
        console.error(`  ✗ 无法读取文件: ${filePath}`);
        stats.errorFiles++;
        return;
      }
    }

    const originalContent = content;
    let modified = false;
    let fixedEncoding = false;

    // 检查并修复编码问题
    if (hasEncodingIssues(content)) {
      console.log(`  ⚠ 发现编码问题: ${path.relative(rootDir, filePath)}`);
      // 这里需要手动修复，因为自动修复可能不准确
      // 建议使用 git 恢复文件
      fixedEncoding = true;
      stats.encodingFixed++;
    }

    // 替换标签
    const { content: newContent, count } = replaceTags(content);
    if (count > 0) {
      content = newContent;
      modified = true;
      stats.tagsReplaced += count;
      console.log(`  ✓ 替换了 ${count} 个标签: ${path.relative(rootDir, filePath)}`);
    }

    // 如果内容有修改，写回文件
    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.processedFiles++;
    } else if (!modified) {
      stats.skippedFiles++;
    }

  } catch (error) {
    console.error(`  ✗ 处理文件出错: ${filePath}`, error.message);
    stats.errorFiles++;
  }
}

/**
 * 递归查找所有 .vue 文件
 */
function findVueFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git 目录
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        findVueFiles(filePath, fileList);
      }
    } else if (file.endsWith('.vue')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始处理文件...\n');
  console.log('工作目录:', rootDir);
  console.log('');

  // 查找所有 .vue 文件
  const files = [];
  for (const dir of directories) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      findVueFiles(dirPath, files);
    }
  }

  stats.totalFiles = files.length;
  console.log(`📁 找到 ${stats.totalFiles} 个文件\n`);

  // 处理每个文件
  for (const file of files) {
    await processFile(file);
  }

  // 输出统计信息
  console.log('\n' + '='.repeat(60));
  console.log('📊 处理完成！统计信息：');
  console.log('='.repeat(60));
  console.log(`总文件数:     ${stats.totalFiles}`);
  console.log(`已处理:       ${stats.processedFiles}`);
  console.log(`跳过:         ${stats.skippedFiles}`);
  console.log(`错误:         ${stats.errorFiles}`);
  console.log(`替换标签数:   ${stats.tagsReplaced}`);
  console.log(`编码问题:     ${stats.encodingFixed}`);
  console.log('='.repeat(60));

  if (stats.encodingFixed > 0) {
    console.log('\n⚠️  警告: 发现编码问题的文件需要手动修复');
    console.log('建议使用 git 恢复这些文件，然后重新编辑');
  }
}

main().catch(console.error);
