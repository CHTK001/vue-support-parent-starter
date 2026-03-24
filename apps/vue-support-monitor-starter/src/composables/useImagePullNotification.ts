import { ElNotification } from 'element-plus'
import { h, VNode } from 'vue'

// 存储当前活跃的通知实例
const activeNotifications = new Map<string, any>()

/**
 * 镜像拉取进度通知管理
 */
export function useImagePullNotification() {
  /**
   * 创建或更新拉取进度通知
   */
  const showPullProgress = (data: {
    operationId: string
    imageName: string
    imageTag?: string
    progress: number
    status: string
    message: string
  }) => {
    const { operationId, imageName, imageTag, progress, status, message } = data
    const fullImageName = imageTag ? `${imageName}:${imageTag}` : imageName
    
    // 如果通知已存在，关闭旧的
    if (activeNotifications.has(operationId)) {
      const oldNotification = activeNotifications.get(operationId)
      if (oldNotification && oldNotification.close) {
        oldNotification.close()
      }
    }

    // 根据进度和状态生成图标和类型
    let icon = '⏬'
    let type: 'success' | 'warning' | 'info' | 'error' = 'info'
    let title = '正在拉取镜像'
    
    if (progress >= 100 || status === 'completed') {
      icon = '✅'
      type = 'success'
      title = '镜像拉取完成'
    } else if (status === 'error' || status === 'failed') {
      icon = '❌'
      type = 'error'
      title = '镜像拉取失败'
    } else if (progress > 0) {
      icon = '📥'
      type = 'info'
      title = `正在拉取镜像 (${progress.toFixed(0)}%)`
    }

    // 创建进度条HTML
    const createProgressBar = (progress: number): VNode => {
      return h('div', { style: { marginTop: '10px' } }, [
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            fontSize: '12px',
            color: '#606266'
          }
        }, [
          h('span', `${fullImageName}`),
          h('span', { style: { fontWeight: 'bold', color: '#409eff' } }, `${progress.toFixed(0)}%`)
        ]),
        h('div', {
          style: {
            height: '6px',
            backgroundColor: '#e4e7ed',
            borderRadius: '3px',
            overflow: 'hidden'
          }
        }, [
          h('div', {
            style: {
              height: '100%',
              width: `${progress}%`,
              backgroundColor: progress >= 100 ? '#67c23a' : '#409eff',
              transition: 'width 0.3s ease',
              borderRadius: '3px'
            }
          })
        ]),
        h('div', {
          style: {
            marginTop: '8px',
            fontSize: '12px',
            color: '#909399'
          }
        }, message || '正在处理...')
      ])
    }

    // 创建通知
    const notification = ElNotification({
      title: `${icon} ${title}`,
      message: createProgressBar(progress),
      type,
      duration: progress >= 100 || status === 'error' ? 3000 : 0, // 完成或失败时3秒后自动关闭
      position: 'bottom-right',
      offset: 50,
      dangerouslyUseHTMLString: false,
      showClose: true,
      onClose: () => {
        activeNotifications.delete(operationId)
      }
    })

    // 保存通知实例
    activeNotifications.set(operationId, notification)

    return notification
  }

  /**
   * 显示拉取成功通知
   */
  const showPullSuccess = (imageName: string, imageTag?: string) => {
    const fullImageName = imageTag ? `${imageName}:${imageTag}` : imageName
    
    ElNotification.success({
      title: '✅ 镜像拉取成功',
      message: `镜像 ${fullImageName} 已成功拉取到服务器`,
      duration: 3000,
      position: 'bottom-right',
      offset: 50
    })
  }

  /**
   * 显示拉取失败通知
   */
  const showPullError = (imageName: string, error: string, imageTag?: string) => {
    const fullImageName = imageTag ? `${imageName}:${imageTag}` : imageName
    
    ElNotification.error({
      title: '❌ 镜像拉取失败',
      message: `镜像 ${fullImageName} 拉取失败：${error}`,
      duration: 5000,
      position: 'bottom-right',
      offset: 50
    })
  }

  /**
   * 显示拉取开始通知
   */
  const showPullStart = (imageName: string, imageTag?: string, serverId?: number) => {
    const fullImageName = imageTag ? `${imageName}:${imageTag}` : imageName
    
    ElNotification.info({
      title: '📥 开始拉取镜像',
      message: `正在从远程仓库拉取镜像 ${fullImageName}，请在右下角查看实时进度`,
      duration: 3000,
      position: 'bottom-right',
      offset: 50
    })
  }

  /**
   * 关闭指定的通知
   */
  const closeNotification = (operationId: string) => {
    const notification = activeNotifications.get(operationId)
    if (notification && notification.close) {
      notification.close()
      activeNotifications.delete(operationId)
    }
  }

  /**
   * 关闭所有通知
   */
  const closeAllNotifications = () => {
    activeNotifications.forEach((notification) => {
      if (notification && notification.close) {
        notification.close()
      }
    })
    activeNotifications.clear()
  }

  return {
    showPullProgress,
    showPullSuccess,
    showPullError,
    showPullStart,
    closeNotification,
    closeAllNotifications
  }
}

