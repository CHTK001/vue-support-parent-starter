/**
 * AiConsoleSidebar — AI 控制台左侧菜单
 *
 * 分组：会话 / 生成 / 视觉管线 / 模型 / 用量 / 系统。
 * 文生图、文生视频、OCR、布局、人脸识别、图片识别 均从后端管线目录拉取动态渲染，
 * 与后端 /v2/ai/pipelines 保持单一事实来源。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Application,
  Box,
  Comment,
  DataAll,
  EveryUser,
  FaceRecognition,
  FileText,
  FileWord,
  IdCard,
  LinkTwo,
  Pic,
  Puzzle,
  Server,
  SettingOne,
  TextRecognition,
  Tool,
  User,
  VideoTwo,
} from '@icon-park/react';
import { pipelineApi, PipelineDef } from '@/renderer/services/api/aiConsoleApi';

interface MenuEntry {
  key: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  pipelineCode?: string;
}

interface MenuGroup {
  title: string;
  entries: MenuEntry[];
}

const BASE_ICON_PROPS = { theme: 'outline' as const, size: 16, strokeWidth: 4, fill: 'currentColor' as const };

/** 静态入口（Bot 会话 / 模型 / 用量 / 系统） */
const STATIC_GROUPS: MenuGroup[] = [
  {
    title: 'console.nav.chat',
    entries: [
      { key: 'bots-users', path: '/bots/users', label: 'console.nav.botUsers', icon: <EveryUser {...BASE_ICON_PROPS} /> },
      { key: 'bots-im', path: '/bots/im', label: 'console.nav.botIm', icon: <Comment {...BASE_ICON_PROPS} /> },
    ],
  },
  {
    title: 'console.nav.models',
    entries: [
      { key: 'model-manage', path: '/models', label: 'console.nav.modelManage', icon: <Box {...BASE_ICON_PROPS} /> },
    ],
  },
  {
    title: 'console.nav.agents',
    entries: [
      { key: 'agent-manage', path: '/agents', label: 'console.nav.agentManage', icon: <User {...BASE_ICON_PROPS} /> },
    ],
  },
  {
    title: 'console.nav.services',
    entries: [
      { key: 'service-manage', path: '/services', label: 'console.nav.serviceManage', icon: <Server {...BASE_ICON_PROPS} /> },
    ],
  },
  {
    title: 'console.nav.extensions',
    entries: [
      { key: 'skills-manage', path: '/skills', label: 'console.nav.skillsManage', icon: <Tool {...BASE_ICON_PROPS} /> },
      { key: 'roles-manage', path: '/roles', label: 'console.nav.rolesManage', icon: <IdCard {...BASE_ICON_PROPS} /> },
      { key: 'mcp-manage', path: '/mcp', label: 'console.nav.mcpManage', icon: <LinkTwo {...BASE_ICON_PROPS} /> },
      { key: 'plugins-manage', path: '/plugins', label: 'console.nav.pluginsManage', icon: <Puzzle {...BASE_ICON_PROPS} /> },
    ],
  },
  {
    title: 'console.nav.usage',
    entries: [
      { key: 'usage-manage', path: '/usage', label: 'console.nav.usageManage', icon: <DataAll {...BASE_ICON_PROPS} /> },
      { key: 'usage-sync-logs', path: '/usage/sync-logs', label: 'console.nav.usageSyncLogs', icon: <FileText {...BASE_ICON_PROPS} /> },
    ],
  },
  {
    title: 'console.nav.system',
    entries: [
      { key: 'system-settings', path: '/settings', label: 'console.nav.systemSettings', icon: <SettingOne {...BASE_ICON_PROPS} /> },
    ],
  },
];

/** 管线 → 图标 映射 */
const PIPELINE_ICONS: Record<string, React.ReactNode> = {
  'text-to-image': <Pic {...BASE_ICON_PROPS} />,
  'text-to-video': <VideoTwo {...BASE_ICON_PROPS} />,
  ocr: <TextRecognition {...BASE_ICON_PROPS} />,
  layout: <FileWord {...BASE_ICON_PROPS} />,
  face: <FaceRecognition {...BASE_ICON_PROPS} />,
  image: <Application {...BASE_ICON_PROPS} />,
};

export default function AiConsoleSidebar() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pipelines, setPipelines] = useState<PipelineDef[]>([]);

  useEffect(() => {
    let alive = true;
    pipelineApi
      .list()
      .then((list) => {
        if (alive) setPipelines(list.filter((p) => p.kind === 'pipeline'));
      })
      .catch(() => {
        /* 后端不可达时保持默认静态管线列表 */
        setPipelines(DEFAULT_PIPELINES);
      });
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo<MenuGroup[]>(() => {
    const gen = pipelines.filter((p) => p.configGroup === 'generate');
    const vision = pipelines.filter((p) => ['ocr', 'layout', 'face', 'image'].includes(p.configGroup));
    const dynamicGroups: MenuGroup[] = [];
    if (gen.length > 0) {
      dynamicGroups.push({
        title: 'console.nav.generation',
        entries: gen.map((p) => ({
          key: `pipeline-${p.code}`,
          path: `/capabilities/${p.code}`,
          label: p.name,
          icon: PIPELINE_ICONS[p.code] ?? <Pic {...BASE_ICON_PROPS} />,
          pipelineCode: p.code,
        })),
      });
    }
    if (vision.length > 0) {
      dynamicGroups.push({
        title: 'console.nav.vision',
        entries: vision.map((p) => ({
          key: `pipeline-${p.code}`,
          path: `/capabilities/${p.code}`,
          label: p.name,
          icon: PIPELINE_ICONS[p.code] ?? <Application {...BASE_ICON_PROPS} />,
          pipelineCode: p.code,
        })),
      });
    }
    return [...dynamicGroups, ...STATIC_GROUPS];
  }, [pipelines]);

  const isActive = (path: string): boolean => {
    if (path === '/bots/users' && pathname === '/') return true;
    if (path === '/settings') return pathname.startsWith('/settings');
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="ai-sidebar" aria-label={t('console.nav.title', 'AI 控制台')}>
      <div className="ai-sidebar-brand">
        <span className="logo">
          <RobotIcon />
        </span>
        <span className="name">{t('console.nav.title', 'AI 控制台')}</span>
      </div>
      <nav className="ai-sidebar-nav">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="ai-sidebar-group-title">{t(group.title)}</div>
            {group.entries.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={`ai-sidebar-item${isActive(entry.path) ? ' active' : ''}`}
                onClick={() => navigate(entry.path)}
                aria-current={isActive(entry.path) ? 'page' : undefined}
              >
                <span className="ai-sidebar-ico">{entry.icon}</span>
                <span className="ai-sidebar-txt">{entry.label.startsWith('console.') ? t(entry.label) : entry.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="ai-sidebar-foot">
        <span className="dot" />
        <span>{t('console.nav.online', '服务已连接')}</span>
      </div>
    </aside>
  );
}

/** 兜底管线（后端不可达时仍可展示菜单） */
const DEFAULT_PIPELINES: PipelineDef[] = [
  { code: 'text-to-image', name: '文生图', group: 'generate', tag: 'text-to-image', required: ['text-to-image'], optional: ['image-generate'], description: '基于提示词生成图像', route: '/capabilities/text-to-image', configGroup: 'generate', kind: 'pipeline' },
  { code: 'text-to-video', name: '文生视频', group: 'generate', tag: 'text-to-video', required: ['text-to-video'], optional: [], description: '基于提示词生成视频', route: '/capabilities/text-to-video', configGroup: 'generate', kind: 'pipeline' },
  { code: 'ocr', name: 'OCR 文字识别', group: 'ocr', tag: 'ocr', required: ['ocr'], optional: ['layout'], description: '文字检测→矫正→识别管线', route: '/capabilities/ocr', configGroup: 'ocr', kind: 'pipeline' },
  { code: 'layout', name: '版面布局分析', group: 'layout', tag: 'layout', required: ['layout'], optional: ['ocr'], description: '文档版面分析，识别标题/表格/图片等区域', route: '/capabilities/layout', configGroup: 'layout', kind: 'pipeline' },
  { code: 'face', name: '人脸识别', group: 'face', tag: 'face', required: ['detect', 'face-recognize'], optional: ['eye-detect', 'smile-detect', 'face-quality', 'liveness'], description: '人脸检测+识别管线', route: '/capabilities/face', configGroup: 'face', kind: 'pipeline' },
  { code: 'image', name: '图片识别', group: 'image', tag: 'image', required: ['classify', 'image-detect'], optional: ['segment', 'enhance', 'captioning', 'depth', 'image-quality', 'pedestrian', 'plate-detect', 'plate-recognize', 'feature'], description: '图像分类/目标检测管线', route: '/capabilities/image', configGroup: 'image', kind: 'pipeline' },
];

function RobotIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2a2 2 0 0 0-2 2v1H8a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4h-2V4a2 2 0 0 0-2-2Zm-4.5 8h9a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Zm2.5 7.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm4.5 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
