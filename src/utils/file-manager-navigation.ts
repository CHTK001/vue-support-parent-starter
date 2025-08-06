/**
 * 文件管理器导航工具函数
 * 用于在新页面中打开文件管理器并传递serverId参数
 */

import { useRouter } from "vue-router";

/**
 * 在新页面中打开文件管理器
 * @param serverId 服务器ID
 */
export function openFileManagerInNewPage(serverId: number | string) {
  const router = useRouter();
  
  // 使用路由跳转到文件管理器页面
  const routeData = router.resolve({
    name: "fileManager",
    params: {
      serverId: String(serverId)
    }
  });
  
  // 在新窗口中打开
  window.open(routeData.href, "_blank");
}

/**
 * 在当前页面中跳转到文件管理器
 * @param serverId 服务器ID
 */
export function navigateToFileManager(serverId: number | string) {
  const router = useRouter();
  
  router.push({
    name: "fileManager",
    params: {
      serverId: String(serverId)
    }
  });
}

/**
 * 检查是否可以打开文件管理器
 * @param server 服务器信息
 * @returns 是否可以打开文件管理器
 */
export function canOpenFileManager(server: any): boolean {
  if (!server) return false;
  
  // 检查服务器是否有文件管理功能
  const fileManagementMode = server.fileManagementMode || server.monitorSysGenServerFileManagementMode;
  
  // 如果文件管理模式为 NONE 或未设置，则不能打开文件管理器
  return fileManagementMode && fileManagementMode !== "NONE";
}

/**
 * 获取文件管理模式的显示文本
 * @param mode 文件管理模式
 * @returns 显示文本
 */
export function getFileManagementModeText(mode: string): string {
  const modeMap: Record<string, string> = {
    LOCAL: "本地连接",
    SSH: "SSH连接", 
    NODE: "NODE客户端",
    API: "API连接",
    NONE: "未启用",
  };
  return modeMap[mode] || mode;
}

/**
 * 示例：在服务器管理页面中使用
 * 
 * 在服务器管理组件中，可以这样使用：
 * 
 * ```vue
 * <template>
 *   <el-button 
 *     @click="handleOpenFileManager(server)"
 *     :disabled="!canOpenFileManager(server)"
 *   >
 *     文件管理
 *   </el-button>
 * </template>
 * 
 * <script setup>
 * import { openFileManagerInNewPage, canOpenFileManager } from "@/utils/file-manager-navigation";
 * 
 * const handleOpenFileManager = (server) => {
 *   if (canOpenFileManager(server)) {
 *     openFileManagerInNewPage(server.monitorSysGenServerId);
 *   } else {
 *     ElMessage.warning("该服务器未启用文件管理功能");
 *   }
 * };
 * </script>
 * ```
 */
