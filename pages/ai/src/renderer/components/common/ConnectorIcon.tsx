/**
 * ConnectorIcon — 按后端下发的 icon 名渲染 @icon-park/react 图标
 *
 * 后端连接器契约里的 icon 是字符串（如 "Cloudy"、"Calculator"），icon-park 没有
 * 运行时按名取组件的入口，只能在这里静态登记一份名字 → 组件的映射。
 * 映射表覆盖内置连接器实际用到的全部图标名；未登记的名字统一回退到 LinkTwo，
 * 保证新增连接器即使忘了登记也不会渲染成空白。
 */
import React from 'react';
import {
  BookOpen,
  Bookshelf,
  Calculator,
  Calendar,
  ChartLine,
  CityOne,
  Cloudy,
  CodeBrackets,
  Exchange,
  Filter,
  Fire,
  Github,
  Install,
  Key,
  Lightning,
  LinkCloud,
  LinkTwo,
  ListNumbers,
  Local,
  LocalPin,
  Lock,
  Mail,
  Movie,
  Music,
  NetworkTree,
  NewspaperFolding,
  Notebook,
  Phone,
  Platte,
  Plug,
  Robot,
  Ruler,
  Search,
  Shield,
  Shuffle,
  Star,
  Sun,
  Text,
  TextRecognition,
  Time,
  Transform,
  Translate,
  Truck,
  Whirlwind,
} from '@icon-park/react';

type IconComponent = typeof LinkTwo;

const ICONS: Record<string, IconComponent> = {
  BookOpen,
  Bookshelf,
  Calculator,
  Calendar,
  ChartLine,
  CityOne,
  Cloudy,
  CodeBrackets,
  Exchange,
  Filter,
  Fire,
  Github,
  Install,
  Key,
  Lightning,
  LinkCloud,
  LinkTwo,
  ListNumbers,
  Local,
  LocalPin,
  Lock,
  Mail,
  Movie,
  Music,
  NetworkTree,
  NewspaperFolding,
  Notebook,
  Phone,
  Platte,
  Plug,
  Robot,
  Ruler,
  Search,
  Shield,
  Shuffle,
  Star,
  Sun,
  Text,
  TextRecognition,
  Time,
  Transform,
  Translate,
  Truck,
  Whirlwind,
};

interface ConnectorIconProps {
  /** 后端连接器契约中的 icon 名 */
  name?: string;
  size?: number;
}

export default function ConnectorIcon({ name, size = 16 }: ConnectorIconProps) {
  const Icon = (name && ICONS[name]) || LinkTwo;
  return <Icon size={size} />;
}
