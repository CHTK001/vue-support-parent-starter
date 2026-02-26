/**
 * 自动迁移脚本
 * 将所有使用 usePixelUI 的 Element Plus 封装组件迁移到新的 useThemeComponent 系统
 * 
 * 使用方法：
 * node scripts/migrate-to-theme-system.js [--dry-run] [--components ScButton,ScInput]
 * 
 * 选项：
 * --dry-run: 只显示将要修改的内容，不实际修改文件
 * --components: 只迁移指定的组件，用逗号分隔
 * 
 * 示例：
 * node scripts/migrate-to-theme-system.js --dry-run
 * node scripts/migrate-to-theme-system.js --components ScButton,ScInput,ScSelect
 */

const fs = require('fs');
const path = require('path');

// 组件名称映射：主题组件名 -> Element Plus 组件名
const COMPONENT_MAP = {
  PxButton: 'ElButton',
  PxInput: 'ElInput',
  PxSelect: 'ElSelect',
  PxCheckbox: 'ElCheckbox',
  PxRadio: 'ElRadio',
  PxSlider: 'ElSlider',
  PxInputNumber: 'ElInputNumber',
  PxRate: 'ElRate',
  PxColorPicker: 'ElColorPicker',
  PxTimePicker: 'ElTimePicker',
  PxDatePicker: 'ElDatePicker',
  PxCascader: 'ElCascader',
  PxAutocomplete: 'ElAutocomplete',
  PxSwitch: 'ElSwitch',
  PxTag: 'ElTag',
  PxBadge: 'ElBadge',
  PxAlert: 'ElAlert',
  PxLink: 'ElLink',
  PxDivider: 'ElDivider',
  PxAvatar: 'ElAvatar',
  PxProgress: 'ElProgress',
  PxTooltip: 'ElTooltip',
  PxPopover: 'ElPopover',
  PxPopconfirm: 'ElPopconfirm',
  PxForm: 'ElForm',
  PxFormItem: 'ElFormItem',
  PxRow: 'ElRow',
  PxCol: 'ElCol',
  PxTabs: 'ElTabs',
  PxMenu: 'ElMenu',
  PxBreadcrumb: 'ElBreadcrumb',
  PxSteps: 'ElSteps',
  PxDialog: 'ElDialog',
  PxDrawer: 'ElDrawer',
  PxCard: 'ElCard',
  PxTable: 'ElTable',
  PxUpload: 'ElUpload',
  PxImage: 'ElImage',
  PxTree: 'ElTree'
};

/**
 * 迁移单个文件
 */
function migrateFile(filePath) {
  console.log(`处理文件: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // 1. 替换 import
  if (content.includes('usePixelUI')) {
    content = content.replace(
      /import\s+{\s*usePixelUI\s*}\s+from\s+["'].*?usePixelUI["'];?/g,
      'import { useThemeComponent } from "../../hooks/useThemeComponent";'
    );
    modified = true;
    console.log('  ✓ 替换了 import 语句');
  }
  
  // 2. 替换 hook 调用
  // 匹配: const { isPixelTheme, pixelComponent } = usePixelUI("PxSlider");
  const hookCallRegex = /const\s+{\s*isPixelTheme\s*,\s*pixelComponent\s*}\s*=\s*usePixelUI\(["'](\w+)["']\);?/g;
  const hookMatches = [...content.matchAll(hookCallRegex)];
  
  for (const match of hookMatches) {
    const pixelComponentName = match[1]; // 如 "PxSlider"
    const elComponentName = COMPONENT_MAP[pixelComponentName];
    
    if (elComponentName) {
      const oldCode = match[0];
      const newCode = `const { currentComponent } = useThemeComponent("${elComponentName}");`;
      content = content.replace(oldCode, newCode);
      modified = true;
      console.log(`  ✓ 替换了 hook 调用: ${pixelComponentName} -> ${elComponentName}`);
    }
  }
  
  // 3. 删除 currentComponent 的 computed
  // 匹配多行的 computed 定义
  const computedRegex = /const\s+currentComponent\s*=\s*computed\(\(\)\s*=>\s*{\s*if\s*\(isPixelTheme\.value\s*&&\s*pixelComponent\?\.value\)\s*{\s*return\s+pixelComponent\.value;\s*}\s*return\s+(\w+);\s*}\);?/gs;
  
  if (computedRegex.test(content)) {
    content = content.replace(computedRegex, '');
    modified = true;
    console.log('  ✓ 删除了 currentComponent computed');
  }
  
  // 4. 更新模板中的 component
  // 从 <component :is="currentComponent" 改为 <component :is="currentComponent || ElXxx"
  // 需要找到对应的 Element Plus 组件名
  
  // 先找到 import 的 Element Plus 组件
  const elImportRegex = /import\s+{\s*(\w+)\s*}\s+from\s+["']element-plus["'];?/g;
  const elImportMatches = [...content.matchAll(elImportRegex)];
  
  for (const match of elImportMatches) {
    const elComponentName = match[1]; // 如 "ElSlider"
    
    // 替换模板中的 :is="currentComponent"
    const templateRegex = new RegExp(`:is=["']currentComponent["']`, 'g');
    if (templateRegex.test(content)) {
      content = content.replace(templateRegex, `:is="currentComponent || ${elComponentName}"`);
      modified = true;
      console.log(`  ✓ 更新了模板: 添加后备组件 ${elComponentName}`);
    }
  }
  
  // 5. 保存文件
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ 文件已更新\n`);
    return true;
  } else {
    console.log(`  ⏭️  无需修改\n`);
    return false;
  }
}

/**
 * 递归查找所有 .vue 文件
 */
function findVueFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和其他不需要的目录
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        findVueFiles(filePath, fileList);
      }
    } else if (file.endsWith('.vue')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Element Plus 封装组件列表
 * 只迁移这些组件，组合式组件会自动适配
 */
const ELEMENT_PLUS_COMPONENTS = [
  'ScButton', 'ScInput', 'ScSelect', 'ScCheckbox', 'ScRadio', 
  'ScSlider', 'ScInputNumber', 'ScRate', 'ScColorPicker', 
  'ScTimePicker', 'ScDatePicker', 'ScCascader', 'ScAutocomplete', 
  'ScSwitch', 'ScTag', 'ScBadge', 'ScAlert', 'ScLink', 
  'ScDivider', 'ScAvatar', 'ScProgress', 'ScTooltip', 
  'ScPopover', 'ScPopconfirm', 'ScForm', 'ScFormItem', 
  'ScRow', 'ScCol', 'ScTabs', 'ScMenu', 'ScBreadcrumb', 
  'ScSteps', 'ScDialog', 'ScDrawer', 'ScCard', 'ScTable', 
  'ScNumber', 'ScUpload', 'ScImage', 'ScTree'
];

/**
 * 检查文件是否是 Element Plus 封装组件
 */
function isElementPlusComponent(filePath) {
  const componentName = path.basename(path.dirname(path.dirname(filePath)));
  return ELEMENT_PLUS_COMPONENTS.includes(componentName);
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    components: null
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--components' && args[i + 1]) {
      options.components = args[i + 1].split(',').map(c => c.trim());
      i++;
    }
  }
  
  return options;
}

/**
 * 主函数
 */
function main() {
  const options = parseArgs();
  
  console.log('🚀 开始迁移到新的主题系统...\n');
  
  if (options.dryRun) {
    console.log('⚠️  DRY RUN 模式：只显示将要修改的内容，不实际修改文件\n');
  }
  
  if (options.components) {
    console.log(`📦 只迁移指定组件: ${options.components.join(', ')}\n`);
  }
  
  const componentsDir = path.join(__dirname, '..');
  const vueFiles = findVueFiles(componentsDir);
  
  console.log(`找到 ${vueFiles.length} 个 .vue 文件\n`);
  
  let modifiedCount = 0;
  let skippedCount = 0;
  
  vueFiles.forEach(file => {
    // 只处理 Element Plus 封装组件
    if (!isElementPlusComponent(file)) {
      return;
    }
    
    // 如果指定了组件列表，只处理指定的组件
    if (options.components) {
      const componentName = path.basename(path.dirname(path.dirname(file)));
      if (!options.components.includes(componentName)) {
        return;
      }
    }
    
    // 只处理包含 usePixelUI 的文件
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('usePixelUI')) {
      if (options.dryRun) {
        console.log(`[DRY RUN] 将要修改: ${file}`);
        modifiedCount++;
      } else {
        if (migrateFile(file)) {
          modifiedCount++;
        }
      }
    } else {
      // 检查是否已经迁移
      if (content.includes('useThemeComponent')) {
        console.log(`⏭️  已迁移: ${path.basename(path.dirname(path.dirname(file)))}`);
        skippedCount++;
      }
    }
  });
  
  console.log('\n✨ 迁移完成！');
  console.log(`共修改了 ${modifiedCount} 个文件`);
  if (skippedCount > 0) {
    console.log(`跳过了 ${skippedCount} 个已迁移的文件`);
  }
  
  if (!options.dryRun) {
    console.log('\n📝 请手动检查以下内容：');
    console.log('  1. 确认所有组件的后备组件正确');
    console.log('  2. 运行 TypeScript 诊断检查: npm run type-check');
    console.log('  3. 测试主题切换功能');
    console.log('  4. 更新 MIGRATION_STATUS.md');
  } else {
    console.log('\n💡 提示：移除 --dry-run 参数以实际执行迁移');
  }
}

// 运行迁移
main();
