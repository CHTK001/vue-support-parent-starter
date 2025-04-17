/**
 * ScInput默认图标配置
 */
import { InputType } from './types';

/**
 * 各输入类型对应的默认图标
 */
export const defaultPrefixIcons = {
  [InputType.TEXT]: 'ep:edit',
  [InputType.TEXTAREA]: 'ep:edit',
  [InputType.NUMBER]: 'ep:odometer',
  [InputType.PASSWORD]: 'ep:lock',
  [InputType.SEARCH]: 'ep:search',
  [InputType.EMAIL]: 'ep:message',
  [InputType.TEL]: 'ep:phone',
  [InputType.URL]: 'ep:link',
  [InputType.DATE]: 'ep:calendar',
  [InputType.DATETIME]: 'ep:timer',
  [InputType.MONTH]: 'ep:calendar',
  [InputType.WEEK]: 'ep:calendar',
  [InputType.TIME]: 'ep:clock',
  [InputType.COLOR]: 'ep:brush',
  [InputType.IP]: 'ep:connection',
  [InputType.BOOLEAN]: 'ep:switch',
  [InputType.DICT]: 'ep:document',
  [InputType.CAPTCHA]: 'ep:key',
  'select': 'ep:select'
};

/**
 * 获取特定输入类型的默认图标
 * @param type 输入类型
 * @returns 默认图标
 */
export const getDefaultIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    [InputType.TEXT]: 'ri:text',
    [InputType.TEXTAREA]: 'ri:file-text-line',
    [InputType.NUMBER]: 'ri:number-1',
    [InputType.PASSWORD]: 'ri:lock-line',
    [InputType.SEARCH]: 'ri:search-line',
    [InputType.EMAIL]: 'ri:mail-line',
    [InputType.TEL]: 'ri:phone-line',
    [InputType.URL]: 'ri:link',
    [InputType.DATE]: 'ri:calendar-line',
    [InputType.DATETIME]: 'ri:calendar-check-line',
    [InputType.MONTH]: 'ri:calendar-line',
    [InputType.WEEK]: 'ri:calendar-line',
    [InputType.TIME]: 'ri:time-line',
    [InputType.YEAR]: 'ri:calendar-2-line',
    [InputType.DATETIME_RANGE]: 'ri:calendar-event-line',
    [InputType.DATE_RANGE]: 'ri:calendar-todo-line',
    [InputType.MONTH_RANGE]: 'ri:calendar-2-line',
    [InputType.WEEK_RANGE]: 'ri:calendar-2-line',
    [InputType.TIME_RANGE]: 'ri:time-line',
    [InputType.COLOR]: 'ri:palette-line',
    [InputType.IP]: 'ri:global-line',
    [InputType.BOOLEAN]: 'ri:toggle-line',
    [InputType.DICT]: 'ri:book-3-line',
    [InputType.CARD]: 'ri:bank-card-line',
    [InputType.CAPTCHA]: 'ri:shield-keyhole-line',
    [InputType.SELECT]: 'ri:list-check',
    [InputType.TOTP]: 'ri:shield-check-line'
  };

  return iconMap[type] || 'ri:text';
};

/**
 * 获取输入类型显示名称
 * @param type 输入类型
 * @returns 显示名称
 */
export const getTypeName = (type: string): string => {
  const typeNames = {
    [InputType.TEXT]: '文本',
    [InputType.TEXTAREA]: '文本域',
    [InputType.NUMBER]: '数字',
    [InputType.PASSWORD]: '密码',
    [InputType.SEARCH]: '搜索',
    [InputType.EMAIL]: '邮箱',
    [InputType.TEL]: '电话',
    [InputType.URL]: '网址',
    [InputType.DATE]: '日期',
    [InputType.DATETIME]: '日期时间',
    [InputType.MONTH]: '月份',
    [InputType.WEEK]: '周',
    [InputType.TIME]: '时间',
    [InputType.YEAR]: '年份',
    [InputType.DATETIME_RANGE]: '日期时间范围',
    [InputType.DATE_RANGE]: '日期范围',
    [InputType.MONTH_RANGE]: '月份范围',
    [InputType.WEEK_RANGE]: '周范围',
    [InputType.TIME_RANGE]: '时间范围',
    [InputType.COLOR]: '颜色',
    [InputType.IP]: 'IP地址',
    [InputType.BOOLEAN]: '布尔值',
    [InputType.DICT]: '字典',
    [InputType.CARD]: '卡片',
    [InputType.CAPTCHA]: '验证码',
    [InputType.SELECT]: '选择框',
    [InputType.TOTP]: 'TOTP验证码'
  };
  
  return typeNames[type as InputType] || '未知';
}; 