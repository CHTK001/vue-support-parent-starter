/**
 * 搜索处理接口
 * @description 定义不同搜索类型的处理方法
 */
import type { SearchBoxConfig, SearchResult, SearchOptions } from '../types/search';
import { SearchType } from '../types/search';

/**
 * 搜索处理接口
 */
export interface SearchHandler {
  /**
   * 搜索类型
   */
  type: SearchType;
  
  /**
   * 处理搜索
   * @param keyword 搜索关键词
   * @param options 搜索选项
   * @returns 搜索结果
   */
  handleSearch(keyword: string, options: SearchBoxConfig): Promise<SearchResult[]>;
  
  /**
   * 验证输入
   * @param input 用户输入
   * @returns 是否有效
   */
  validateInput?(input: string): boolean;
  
  /**
   * 格式化输入
   * @param input 用户输入
   * @returns 格式化后的输入
   */
  formatInput?(input: string): string;
  
  /**
   * 获取缓存键
   * @param keyword 搜索关键词
   * @param options 搜索选项
   * @returns 缓存键
   */
  getCacheKey(keyword: string, options: SearchOptions): string;
}

/**
 * 搜索处理器工厂
 */
export class SearchHandlerFactory {
  private static handlers: Map<SearchType, SearchHandler> = new Map();
  
  /**
   * 注册搜索处理器
   * @param handler 搜索处理器
   */
  public static registerHandler(handler: SearchHandler): void {
    this.handlers.set(handler.type, handler);
  }
  
  /**
   * 获取搜索处理器
   * @param type 搜索类型
   * @returns 搜索处理器
   */
  public static getHandler(type: SearchType): SearchHandler | undefined {
    return this.handlers.get(type);
  }
  
  /**
   * 是否存在搜索处理器
   * @param type 搜索类型
   * @returns 是否存在
   */
  public static hasHandler(type: SearchType): boolean {
    return this.handlers.has(type);
  }
} 