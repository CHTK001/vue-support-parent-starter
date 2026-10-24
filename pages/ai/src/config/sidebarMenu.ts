import { ref, type Component } from 'vue'
import {
  AddSquare20Regular, ContactCard20Regular, ChatMultiple24Regular, BookSearch20Regular,
  Apps20Regular, ImageMultiple20Regular, Image20Regular, Person20Regular, ImageSearch20Regular,
  DocumentText20Regular, DesktopSpeaker24Regular, Headphones24Regular, BrainCircuit20Regular,
  DataBarVertical20Regular, PlugConnected20Regular, ClockAlarm20Regular, Fingerprint24Regular,
} from '@vicons/fluent'

/**
 * 侧栏菜单项的**唯一清单**。
 *
 * <p>为什么抽出来：菜单既要在侧栏渲染（GlobalSidebar），又要在「配置中心 → 菜单管理」
 * 里列出并逐项开关（MenuDisplaySettings）。两处各写一份必然漂移——加了新菜单却忘了
 * 加开关，用户就永远关不掉它。这里做单一数据源。</p>
 *
 * <p>{@code showKey} 是 localStorage {@code menuDisplaySettings} 里的键；
 * 没有 showKey 的项恒显示（{@code alwaysShow} 用于会话/酒馆这类主入口）。</p>
 */
export interface SidebarMenuItem {
  /** 稳定标识 */
  key: string
  /** 显示名（可能是 i18n 结果） */
  label: string
  /** 图标组件 */
  icon?: Component
  /** 分组标题（缺省归入「主导航」） */
  section?: string
  /** 显示控制的 localStorage 键；缺省表示不可关闭 */
  showKey?: string
  /** 恒显示（不提供开关） */
  alwaysShow?: boolean
  /** 仅管理员可见 */
  adminOnly?: boolean
  /** 快捷键提示 */
  shortcut?: string
  /** 状态徽标（未配置 / 未注册） */
  badge?: string
  /** 徽标说明 */
  badgeTip?: string
  /** 子项（可折叠分组） */
  children?: SidebarMenuItem[]
}

/**
 * 构建菜单清单所需的上下文。
 */
export interface SidebarMenuContext {
  /** i18n 函数 */
  t: (key: string) => string
  /** 是否 Electron 壳（决定快捷键文案） */
  isElectron: boolean
  /** 模型门禁 store（提供各能力就绪状态） */
  modelConfig: {
    faceReady: boolean
    imageReady: boolean
    colorizeReady: boolean
    ocrReady: boolean
    asrReady: boolean
    ttsReady: boolean
    unregisteredConfigured: unknown[]
  }
}

/**
 * 菜单显示配置在 localStorage 里的键。
 */
const STORAGE_KEY = 'menuDisplaySettings'

/**
 * 变更版本号：写配置后自增，侧栏 computed 依赖它即可即时刷新（无需整页重载）。
 */
export const menuDisplayVersion = ref(0)

/**
 * 读取菜单显示配置（默认全部显示）。
 *
 * @returns showKey → 是否显示
 */
export function readMenuSettings(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * 设置某个菜单的显示状态并持久化。
 *
 * @param showKey 菜单显示键
 * @param visible 是否显示
 */
export function setMenuVisible(showKey: string, visible: boolean): void {
  const settings = readMenuSettings()
  settings[showKey] = visible
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // 隐私模式等写不进去：本次仍生效（版本号递增），只是刷新后回退
  }
  menuDisplayVersion.value += 1
}

/**
 * 构建侧栏菜单清单。
 *
 * @param ctx 上下文（i18n / electron / 模型门禁）
 * @returns 菜单项数组
 */
export function createSidebarMenuItems(ctx: SidebarMenuContext): SidebarMenuItem[] {
  const { t, isElectron, modelConfig } = ctx
  return [
    {
      key: 'chat',
      label: '会话',
      icon: AddSquare20Regular,
      shortcut: isElectron ? 'Ctrl N' : 'Ctrl Alt N',
      alwaysShow: true,
    },
    {
      key: 'characters',
      label: t('ui.sidebar.navCharacters'),
      icon: ContactCard20Regular,
      showKey: 'showCharactersMenu',
    },
    {
      key: 'tavern',
      label: '酒馆',
      icon: ChatMultiple24Regular,
      alwaysShow: true,
    },
    {
      key: 'knowledge-base',
      label: t('ui.sidebar.navKnowledgeBase'),
      icon: BookSearch20Regular,
      showKey: 'showKnowledgeBaseMenu',
    },
    {
      key: 'plugins',
      label: t('ui.sidebar.navPlugins'),
      icon: Apps20Regular,
      showKey: 'showPluginsMenu',
    },
    // 图像类不再做成二级菜单：与「音频」同款扁平分组（section 标题 + 平级菜单项）。
    // 折叠父项多一次点击、且父项本身不可达，用户明确要求不要二级菜单。
    {
      key: 'image-generate',
      label: '图像生成',
      icon: Image20Regular,
      section: '图像',
      showKey: 'showImageGenerateMenu',
    },
    {
      key: 'face-search',
      label: '人脸识别',
      icon: Person20Regular,
      section: '图像',
      showKey: 'showFaceSearchMenu',
      // 底库按账号隔离，不再标 adminOnly；模型配置仍是全局的（仅管理员可改）
      badge: modelConfig.unregisteredConfigured.length ? '未注册'
        : modelConfig.faceReady ? '' : '未配置',
      badgeTip: modelConfig.unregisteredConfigured.length
        ? '人脸检测/特征模型已配置但未在后端注册，识别与登记不可用'
        : '人脸检测模型 / 人脸特征模型未配置，识别不可用',
    },
    {
      // 人脸重识别：与人脸识别并列的另一条业务 —— 跨摄像头/跨帧追踪同一个人。
      // 徽标沿用模型门禁：检测/特征模型没配时同样不可用。
      key: 'face-reid',
      label: '人脸重识别',
      icon: Fingerprint24Regular,
      section: '图像',
      showKey: 'showFaceReidMenu',
      badge: modelConfig.unregisteredConfigured.length ? '未注册'
        : modelConfig.faceReady ? '' : '未配置',
      badgeTip: modelConfig.unregisteredConfigured.length
        ? '人脸检测/特征模型已配置但未在后端注册，重识别不可用'
        : '人脸检测模型 / 人脸特征模型未配置，重识别不可用',
    },
    {
      key: 'image-search',
      label: '以图搜图',
      icon: ImageSearch20Regular,
      section: '图像',
      showKey: 'showImageSearchMenu',
      badge: modelConfig.imageReady ? '' : '未配置',
      badgeTip: '图像特征模型未配置，以图搜图不可用',
    },
    {
      key: 'image-colorize',
      label: '图像上色',
      icon: Image20Regular,
      section: '图像',
      showKey: 'showImageColorizeMenu',
      badge: modelConfig.colorizeReady ? '' : '未配置',
      badgeTip: '上色模型未配置，图像上色不可用',
    },
    {
      key: 'ocr',
      label: 'OCR 识别',
      icon: DocumentText20Regular,
      section: '图像',
      showKey: 'showOcrMenu',
      badge: modelConfig.ocrReady ? '' : '未配置',
      badgeTip: '文字检测模型或文字识别模型未配置，OCR 不可用',
    },
    {
      key: 'audio-recognition',
      label: '音频识别',
      icon: DesktopSpeaker24Regular,
      section: '音频',
      badge: modelConfig.asrReady ? '' : '未配置',
      badgeTip: 'ASR 默认模型未配置，音频识别不可用',
    },
    {
      key: 'text-to-speech',
      label: '语音合成',
      icon: Headphones24Regular,
      section: '音频',
      badge: modelConfig.ttsReady ? '' : '未配置',
      badgeTip: 'TTS 默认模型未配置，语音合成不可用',
    },
    {
      key: 'models',
      label: '模型管理',
      icon: BrainCircuit20Regular,
      section: 'AI 配置',
      showKey: 'showModelsMenu',
      // ONNX 只能管理员增删改查，入口也只给管理员，避免普通用户点进去一堆 403
      adminOnly: true,
    },
    {
      key: 'usage',
      label: '用量管理',
      icon: DataBarVertical20Regular,
      section: '用量统计',
      showKey: 'showUsageMenu',
    },
    {
      key: 'connectors',
      label: '连接器',
      icon: PlugConnected20Regular,
      showKey: 'showConnectorsMenu',
    },
    {
      key: 'scheduler',
      label: t('ui.sidebar.navScheduler'),
      icon: ClockAlarm20Regular,
      showKey: 'showSchedulerMenu',
      adminOnly: true,
    },
  ]
}

