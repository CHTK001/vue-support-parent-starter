/**
 * 脚本管理工具函数
 * @author CH
 * @since 2024-12-11
 */

import type { ScriptType, ExecutionStatus } from "../types";

/**
 * 格式化时间
 */
export function formatTime(date: Date | string | undefined): string {
  if (!date) return "未知";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * 格式化持续时间
 */
export function formatDuration(duration: number | null | undefined): string {
  if (!duration) return "未知";

  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else if (duration < 3600000) {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  } else {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}小时${minutes}分`;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 获取脚本类型图标
 */
export function getScriptTypeIcon(type: ScriptType | string): string {
  const iconMap: Record<string, string> = {
    SHELL: "ri:terminal-line",
    PYTHON: "ri:file-code-line",
    JAVASCRIPT: "ri:javascript-line",
    SQL: "ri:database-2-line",
    BATCH: "ri:file-text-line",
    POWERSHELL: "ri:windows-line",
  };
  return iconMap[type] || "ri:file-code-line";
}

/**
 * 获取脚本类型标签类型
 */
export function getScriptTypeTagType(type: ScriptType | string): string {
  const typeMap: Record<string, string> = {
    SHELL: "success",
    PYTHON: "warning",
    JAVASCRIPT: "primary",
    SQL: "info",
    BATCH: "default",
    POWERSHELL: "info",
  };
  return typeMap[type] || "default";
}

/**
 * 获取执行状态图标
 */
export function getExecutionStatusIcon(
  status: ExecutionStatus | string
): string {
  const iconMap: Record<string, string> = {
    PENDING: "ri:time-line",
    RUNNING: "ri:loader-line",
    SUCCESS: "ri:check-line",
    FAILED: "ri:close-line",
    CANCELLED: "ri:stop-line",
  };
  return iconMap[status.toUpperCase()] || "ri:question-line";
}

/**
 * 获取执行状态标签类型
 */
export function getExecutionStatusTagType(
  status: ExecutionStatus | string
): string {
  const typeMap: Record<string, string> = {
    PENDING: "info",
    RUNNING: "warning",
    SUCCESS: "success",
    FAILED: "danger",
    CANCELLED: "info",
  };
  return typeMap[status.toUpperCase()] || "default";
}

/**
 * 获取执行状态文本
 */
export function getExecutionStatusText(
  status: ExecutionStatus | string
): string {
  const textMap: Record<string, string> = {
    PENDING: "等待中",
    RUNNING: "运行中",
    SUCCESS: "成功",
    FAILED: "失败",
    CANCELLED: "已取消",
  };
  return textMap[status.toUpperCase()] || "未知";
}

/**
 * 获取执行状态样式类
 */
export function getExecutionStatusClass(
  status: ExecutionStatus | string
): string {
  const classMap: Record<string, string> = {
    PENDING: "status-pending",
    RUNNING: "status-running",
    SUCCESS: "status-success",
    FAILED: "status-failed",
    CANCELLED: "status-cancelled",
  };
  return classMap[status.toUpperCase()] || "status-unknown";
}

/**
 * 获取脚本模板
 */
export function getScriptTemplate(
  type: ScriptType | string,
  description: string = ""
): string {
  const date = new Date().toLocaleDateString("zh-CN");

  const templates: Record<string, string> = {
    SHELL: `#!/bin/bash

# 脚本描述：${description || "系统维护脚本"}
# 作者：系统管理员
# 创建时间：${date}
# 用途：服务器日常维护和监控

# 设置错误时退出
set -e

# 颜色输出
RED='\x1b[0;31m'
GREEN='\x1b[0;32m'
YELLOW='\x1b[1;33m'
NC='\x1b[0m' # No Color

echo -e "\${GREEN}========================================\${NC}"
echo -e "\${GREEN}  脚本开始执行\${NC}"
echo -e "\${GREEN}========================================\${NC}"

# 示例1: 检查磁盘空间
echo -e "\n\${YELLOW}[1/3] 检查磁盘空间...\${NC}"
df -h | grep -v tmpfs

# 示例2: 检查内存使用
echo -e "\n\${YELLOW}[2/3] 检查内存使用...\${NC}"
free -h

# 示例3: 检查CPU负载
echo -e "\n\${YELLOW}[3/3] 检查CPU负载...\${NC}"
uptime

# 在这里添加你的脚本内容
# ...

echo -e "\n\${GREEN}========================================\${NC}"
echo -e "\${GREEN}  脚本执行完成\${NC}"
echo -e "\${GREEN}========================================\${NC}"`,

    PYTHON: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
脚本描述：${description || "数据处理脚本"}
作者：系统管理员
创建时间：${date}
用途：数据分析和处理
"""

import os
import sys
import json
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """主函数"""
    logger.info("========================================")
    logger.info("  脚本开始执行")
    logger.info("========================================")
    
    try:
        # 示例1: 读取配置文件
        logger.info("[1/3] 读取配置...")
        config = {
            'name': '示例配置',
            'version': '1.0.0',
            'timestamp': datetime.now().isoformat()
        }
        logger.info(f"配置: {json.dumps(config, indent=2, ensure_ascii=False)}")
        
        # 示例2: 数据处理
        logger.info("[2/3] 处理数据...")
        data = list(range(1, 11))
        result = sum(data)
        logger.info(f"数据总和: {result}")
        
        # 示例3: 生成报告
        logger.info("[3/3] 生成报告...")
        report = {
            'status': 'success',
            'data_count': len(data),
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        logger.info(f"报告: {json.dumps(report, indent=2, ensure_ascii=False)}")
        
        # 在这里添加你的脚本内容
        # ...
        
        logger.info("========================================")
        logger.info("  脚本执行完成")
        logger.info("========================================")
        return 0
        
    except Exception as e:
        logger.error(f"脚本执行失败: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())`,

    POWERSHELL: `# 脚本描述：${description || "Windows系统管理脚本"}
# 作者：系统管理员
# 创建时间：${date}
# 用途：Windows服务器管理和维护

# 设置错误处理
$ErrorActionPreference = "Stop"

# 函数：输出带颜色的消息
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "========================================" "Green"
Write-ColorOutput "  脚本开始执行" "Green"
Write-ColorOutput "========================================" "Green"

try {
    # 示例1: 检查系统信息
    Write-ColorOutput "\n[1/3] 检查系统信息..." "Yellow"
    $os = Get-WmiObject Win32_OperatingSystem
    Write-Host "操作系统: $($os.Caption)"
    Write-Host "版本: $($os.Version)"
    
    # 示例2: 检查磁盘空间
    Write-ColorOutput "\n[2/3] 检查磁盘空间..." "Yellow"
    Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -gt 0 } | 
        Select-Object Name, @{Name="Used(GB)";Expression={[math]::Round($_.Used/1GB,2)}}, 
                      @{Name="Free(GB)";Expression={[math]::Round($_.Free/1GB,2)}}
    
    # 示例3: 检查服务状态
    Write-ColorOutput "\n[3/3] 检查关键服务..." "Yellow"
    $services = @('Spooler', 'W32Time', 'Winmgmt')
    foreach ($service in $services) {
        $status = (Get-Service -Name $service -ErrorAction SilentlyContinue).Status
        if ($status -eq 'Running') {
            Write-ColorOutput "  ✓ $service : 运行中" "Green"
        } else {
            Write-ColorOutput "  ✗ $service : 已停止" "Red"
        }
    }
    
    # 在这里添加你的脚本内容
    # ...
    
    Write-ColorOutput "\n========================================" "Green"
    Write-ColorOutput "  脚本执行完成" "Green"
    Write-ColorOutput "========================================" "Green"
    
} catch {
    Write-ColorOutput "\n脚本执行失败: $($_.Exception.Message)" "Red"
    exit 1
}`,

    BATCH: `@echo off
REM 脚本描述：${description || "Windows批处理脚本"}
REM 作者：系统管理员
REM 创建时间：${date}
REM 用途：Windows系统维护

setlocal enabledelayedexpansion

echo ========================================
echo   脚本开始执行
echo ========================================
echo.

REM 示例1: 显示系统信息
echo [1/3] 系统信息:
systeminfo | findstr /C:"OS 名称" /C:"OS 版本" /C:"系统类型"
echo.

REM 示例2: 检查网络连接
echo [2/3] 网络连接测试:
ping -n 1 www.baidu.com >nul
if %errorlevel% equ 0 (
    echo   网络连接: 正常
) else (
    echo   网络连接: 异常
)
echo.

REM 示例3: 显示当前时间
echo [3/3] 当前时间:
echo   %date% %time%
echo.

REM 在这里添加你的脚本内容
REM ...

echo ========================================
echo   脚本执行完成
echo ========================================
pause`,

    JAVASCRIPT: `/**
 * 脚本描述：${description || "Node.js数据处理脚本"}
 * 作者：系统管理员
 * 创建时间：${date}
 * 用途：数据处理和API调用
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
    name: '示例脚本',
    version: '1.0.0',
    timestamp: new Date().toISOString()
};

// 日志函数
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(\`[\${timestamp}] [\${level}] \${message}\`);
}

// 主函数
async function main() {
    log('========================================');
    log('  脚本开始执行');
    log('========================================');
    
    try {
        // 示例1: 读取配置
        log('[1/3] 读取配置...');
        log(\`配置: \${JSON.stringify(config, null, 2)}\`);
        
        // 示例2: 数据处理
        log('[2/3] 处理数据...');
        const data = Array.from({ length: 10 }, (_, i) => i + 1);
        const sum = data.reduce((a, b) => a + b, 0);
        log(\`数据总和: \${sum}\`);
        
        // 示例3: 生成结果
        log('[3/3] 生成结果...');
        const result = {
            status: 'success',
            dataCount: data.length,
            sum: sum,
            timestamp: new Date().toISOString()
        };
        log(\`结果: \${JSON.stringify(result, null, 2)}\`);
        
        // 在这里添加你的脚本内容
        // ...
        
        log('========================================');
        log('  脚本执行完成');
        log('========================================');
        
    } catch (error) {
        log(\`脚本执行失败: \${error.message}\`, 'ERROR');
        process.exit(1);
    }
}

// 执行主函数
main().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
});`,

    SQL: `-- 脚本描述：${description || "数据库维护脚本"}
-- 作者：系统管理员
-- 创建时间：${date}
-- 用途：数据库查询和维护

-- ========================================
-- 脚本开始执行
-- ========================================

-- 示例1: 查询表信息
SELECT 
    '示例1: 查询表信息' AS step,
    COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = DATABASE();

-- 示例2: 查询数据库大小
SELECT 
    '示例2: 数据库大小' AS step,
    table_schema AS database_name,
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
GROUP BY table_schema;

-- 示例3: 查询当前时间
SELECT 
    '示例3: 当前时间' AS step,
    NOW() AS current_time,
    DATABASE() AS current_database,
    USER() AS current_user;

-- 在这里添加你的SQL语句
-- ...

-- ========================================
-- 脚本执行完成
-- ========================================
SELECT 'SQL脚本执行完成' AS message, NOW() AS completed_at;`,
  };

  return templates[type] || templates.SHELL;
}

/**
 * 获取代码编辑器语言模式
 */
export function getEditorLanguage(type: ScriptType | string): string {
  const languageMap: Record<string, string> = {
    SHELL: "shell",
    PYTHON: "python",
    POWERSHELL: "powershell",
    BATCH: "bat",
    JAVASCRIPT: "javascript",
    SQL: "sql",
  };
  return languageMap[type] || "shell";
}

/**
 * 验证脚本名称
 */
export function validateScriptName(name: string): {
  valid: boolean;
  message?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: "脚本名称不能为空" };
  }

  if (name.length < 2) {
    return { valid: false, message: "脚本名称至少需要2个字符" };
  }

  if (name.length > 50) {
    return { valid: false, message: "脚本名称不能超过50个字符" };
  }

  // 检查特殊字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { valid: false, message: "脚本名称包含非法字符" };
  }

  return { valid: true };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();

    if (now - previous > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      func.apply(context, args);
      previous = now;
    } else if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(context, args);
        previous = Date.now();
        timeout = null;
      }, wait);
    }
  };
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}
