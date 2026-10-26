/**
 * 数据同步「表不存在」报错的分侧判定。
 *
 * <p>抽成独立模块只为可测：这段正则直接决定「弹不弹设计表」，
 * 判错一次就会把用户引向建一张不该建的表（见 {@link shouldOpenTableDesigner}）。
 * 放在 Vue 单文件组件里没法用 node:test 直接断言。</p>
 *
 * <p><b>前后端契约</b>（{@code SyncTaskServiceImpl}）：</p>
 * <ul>
 *   <li>源侧失败：{@code 源表不存在或无法读取: <驱动原文>（源 SQL: ...）}；</li>
 *   <li>目标侧失败：{@code 目标表不存在或没有可读列: <表名>}。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.42
 */

/**
 * 后端约定：源侧读取失败。
 *
 * @param message 错误文案
 * @returns 是源侧失败返回 true
 */
export const isSourceTableMissingError = (message: string): boolean =>
  /源表不存在或无法读取/.test(message);

/**
 * 是否「表不存在」类错误（MySQL / PostgreSQL / Oracle 三种方言 + 后端约定文案）。
 *
 * @param message 错误文案
 * @returns 命中返回 true
 */
export const isTableMissingError = (message: string): boolean =>
  /doesn'?t exist|does not exist|ORA-00942|表不存在|无法读取/i.test(message);

/**
 * 预览失败后是否该打开「设计表」向导。
 *
 * <p>只有目标侧缺表才建表：目标表是本系统要写的，缺了就建是合理补救；
 * 源表不归本系统创建，源侧缺表只能是数据源 / 库名 / 表名配错，
 * 弹出建表框会让人以为该在这里建一张源表，越走越远。</p>
 *
 * <p>注意源侧文案里也含「无法读取」，会命中 {@link isTableMissingError}，
 * 所以必须显式排除源侧，不能只判断「表不存在」。</p>
 *
 * @param message 错误文案
 * @returns 该弹设计表返回 true
 */
export const shouldOpenTableDesigner = (message: string): boolean =>
  isTableMissingError(message) && !isSourceTableMissingError(message);
