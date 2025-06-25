/**
 * 文件管理组合式函数
 */

import { ref, reactive } from 'vue';
import { message } from '@repo/utils';
import type { FileItem, FilePermissions } from '../../../shared/types/file';
import {
  getServerFiles,
  uploadServerFile,
  downloadServerFile,
  deleteServerFile,
  createServerDirectory,
  readServerFileContent,
  saveServerFileContent,
  renameServerFile
} from '@/api/monitor/gen/server';

export function useFileManager() {
  // 响应式状态
  const loading = ref(false);
  const fileList = ref<FileItem[]>([]);
  const currentPath = ref('/');
  const selectedFiles = ref<FileItem[]>([]);
  
  // 权限状态
  const permissions = reactive<FilePermissions>({
    canRead: true,
    canWrite: false,
    canUpload: false,
    canDownload: true,
    canDelete: false,
    canCreateFolder: false,
    canRename: false,
  });

  /**
   * 检查用户权限
   */
  const checkPermissions = () => {
    // 这里可以根据用户角色、服务器配置等来设置权限
    // 暂时使用默认权限，实际项目中应该从后端获取
    const userRole = localStorage.getItem('userRole') || 'user';
    
    if (userRole === 'admin') {
      // 管理员拥有所有权限
      Object.assign(permissions, {
        canRead: true,
        canWrite: true,
        canUpload: true,
        canDownload: true,
        canDelete: true,
        canCreateFolder: true,
        canRename: true,
      });
    } else if (userRole === 'operator') {
      // 操作员有部分权限
      Object.assign(permissions, {
        canRead: true,
        canWrite: true,
        canUpload: true,
        canDownload: true,
        canDelete: false,
        canCreateFolder: true,
        canRename: false,
      });
    } else {
      // 普通用户只有查看权限
      Object.assign(permissions, {
        canRead: true,
        canWrite: false,
        canUpload: false,
        canDownload: true,
        canDelete: false,
        canCreateFolder: false,
        canRename: false,
      });
    }
  };

  /**
   * 加载文件列表
   */
  const loadFileList = async (serverId: number, path: string = '/') => {
    try {
      loading.value = true;
      currentPath.value = path;
      
      const res = await getServerFiles(serverId, path);
      
      if (res.code === '00000') {
        fileList.value = res.data || [];
        return res.data;
      } else {
        message.error(res.msg || '加载文件列表失败');
        return [];
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
      message.error('加载文件列表失败');
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建目录
   */
  const createDirectory = async (serverId: number, path: string) => {
    try {
      loading.value = true;
      const res = await createServerDirectory(serverId, path);
      
      if (res.code === '00000') {
        message.success('创建文件夹成功');
        return true;
      } else {
        message.error(res.msg || '创建文件夹失败');
        return false;
      }
    } catch (error) {
      console.error('创建文件夹失败:', error);
      message.error('创建文件夹失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 上传文件
   */
  const uploadFile = async (serverId: number, path: string, file: File) => {
    try {
      loading.value = true;
      const res = await uploadServerFile(serverId, path, file);
      
      if (res.code === '00000') {
        message.success('文件上传成功');
        return true;
      } else {
        message.error(res.msg || '文件上传失败');
        return false;
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 下载文件
   */
  const downloadFile = async (serverId: number, path: string) => {
    try {
      loading.value = true;
      const res = await downloadServerFile(serverId, path);
      
      if (res.code === '00000') {
        // 创建下载链接
        const blob = new Blob([res.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = path.split('/').pop() || 'download';
        link.click();
        window.URL.revokeObjectURL(url);
        
        message.success('文件下载成功');
        return true;
      } else {
        message.error(res.msg || '文件下载失败');
        return false;
      }
    } catch (error) {
      console.error('文件下载失败:', error);
      message.error('文件下载失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除文件
   */
  const deleteFile = async (serverId: number, path: string) => {
    try {
      loading.value = true;
      const res = await deleteServerFile(serverId, path);
      
      if (res.code === '00000') {
        message.success('删除成功');
        return true;
      } else {
        message.error(res.msg || '删除失败');
        return false;
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      message.error('删除失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重命名文件
   */
  const renameFile = async (serverId: number, oldPath: string, newPath: string) => {
    try {
      loading.value = true;
      const res = await renameServerFile(serverId.toString(), oldPath, newPath);
      
      if (res.code === '00000') {
        message.success('重命名成功');
        return true;
      } else {
        message.error(res.msg || '重命名失败');
        return false;
      }
    } catch (error) {
      console.error('重命名文件失败:', error);
      message.error('重命名失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 读取文件内容
   */
  const readFileContent = async (serverId: number, path: string): Promise<string | null> => {
    try {
      loading.value = true;
      const res = await readServerFileContent(serverId, path);
      
      if (res.code === '00000') {
        return res.data || '';
      } else {
        message.error(res.msg || '读取文件失败');
        return null;
      }
    } catch (error) {
      console.error('读取文件失败:', error);
      message.error('读取文件失败');
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 保存文件内容
   */
  const saveFileContent = async (serverId: number, path: string, content: string) => {
    try {
      loading.value = true;
      const res = await saveServerFileContent(serverId, path, content);
      
      if (res.code === '00000') {
        message.success('文件保存成功');
        return true;
      } else {
        message.error(res.msg || '文件保存失败');
        return false;
      }
    } catch (error) {
      console.error('文件保存失败:', error);
      message.error('文件保存失败');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取文件类型
   */
  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (!ext) return 'unknown';
    
    // 图片类型
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return 'image';
    }
    
    // 文本类型
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'vue', 'log', 'conf', 'config', 'yml', 'yaml'].includes(ext)) {
      return 'text';
    }
    
    // 文档类型
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      return 'document';
    }
    
    // 压缩包类型
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return 'archive';
    }
    
    // 视频类型
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv'].includes(ext)) {
      return 'video';
    }
    
    // 音频类型
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
      return 'audio';
    }
    
    return 'unknown';
  };

  /**
   * 检查文件是否可编辑
   */
  const isEditable = (fileName: string): boolean => {
    return getFileType(fileName) === 'text';
  };

  /**
   * 检查文件是否可预览
   */
  const isPreviewable = (fileName: string): boolean => {
    const type = getFileType(fileName);
    return ['image', 'text'].includes(type);
  };

  /**
   * 格式化文件大小
   */
  const formatFileSize = (size: number): string => {
    if (size === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * 清空选择
   */
  const clearSelection = () => {
    selectedFiles.value = [];
  };

  /**
   * 刷新文件列表
   */
  const refresh = async (serverId: number) => {
    await loadFileList(serverId, currentPath.value);
  };

  return {
    // 状态
    loading,
    fileList,
    currentPath,
    selectedFiles,
    permissions,
    
    // 方法
    checkPermissions,
    loadFileList,
    createDirectory,
    uploadFile,
    downloadFile,
    deleteFile,
    renameFile,
    readFileContent,
    saveFileContent,
    getFileType,
    isEditable,
    isPreviewable,
    formatFileSize,
    clearSelection,
    refresh
  };
}
