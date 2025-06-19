/**
 * 串口数据 IndexedDB 操作工具类
 * 提供类似API接口的操作方式
 */

import { indexedDBProxy } from '@repo/utils';

// 数据库配置
const DB_CONFIG = {
  name: 'SerialMonitorDB',
  version: 1,
  stores: {
    serials: 'serialList',
    ports: 'availablePorts',
    logs: 'serialLogs',
    settings: 'serialSettings'
  }
};

// 串口数据接口
export interface SerialData {
  monitorSerialId: string;
  monitorSerialName: string;
  monitorSerialPort: string;
  monitorSerialBaudRate: number;
  monitorSerialDataBits: number;
  monitorSerialStopBits: number;
  monitorSerialParity: string;
  monitorSerialFlowControl: string;
  monitorSerialDescription?: string;
  status?: 'connected' | 'disconnected';
  createTime?: string;
  updateTime?: string;
}

// 分页参数接口
export interface PageParams {
  page: number;
  pageSize: number;
  genId?: number;
}

// 分页结果接口
export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

// API响应接口
export interface ApiResponse<T = any> {
  code: string;
  msg: string;
  data: T;
}

/**
 * 串口数据库操作类
 */
export class SerialDB {
  
  /**
   * 分页查询串口列表
   */
  static async fetchSerialPage(params: PageParams): Promise<ApiResponse<PageResult<SerialData>>> {
    try {
      const allSerials: SerialData[] = await indexedDBProxy.getItem(DB_CONFIG.stores.serials) || [];
      
      // 过滤数据（如果有genId参数）
      let filteredSerials = allSerials;
      if (params.genId) {
        // 这里可以根据genId进行过滤，暂时返回所有数据
        filteredSerials = allSerials;
      }
      
      // 分页处理
      const { page, pageSize } = params;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const records = filteredSerials.slice(start, end);
      
      return {
        code: '00000',
        msg: '查询成功',
        data: {
          records,
          total: filteredSerials.length,
          current: page,
          size: pageSize
        }
      };
    } catch (error) {
      console.error('查询串口列表失败:', error);
      return {
        code: '50000',
        msg: '查询失败',
        data: {
          records: [],
          total: 0,
          current: 1,
          size: 10
        }
      };
    }
  }

  /**
   * 保存串口数据
   */
  static async fetchSerialSave(data: Omit<SerialData, 'monitorSerialId'>): Promise<ApiResponse<SerialData>> {
    try {
      const allSerials: SerialData[] = await indexedDBProxy.getItem(DB_CONFIG.stores.serials) || [];
      
      // 生成唯一ID
      const newSerial: SerialData = {
        ...data,
        monitorSerialId: 'serial_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        status: 'disconnected',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };
      
      // 检查端口是否已存在
      const existingSerial = allSerials.find(s => s.monitorSerialPort === data.monitorSerialPort);
      if (existingSerial) {
        return {
          code: '40000',
          msg: `串口端口 ${data.monitorSerialPort} 已存在`,
          data: null
        };
      }
      
      allSerials.push(newSerial);
      await indexedDBProxy.setItem(DB_CONFIG.stores.serials, allSerials);
      
      return {
        code: '00000',
        msg: '保存成功',
        data: newSerial
      };
    } catch (error) {
      console.error('保存串口数据失败:', error);
      return {
        code: '50000',
        msg: '保存失败',
        data: null
      };
    }
  }

  /**
   * 更新串口数据
   */
  static async fetchSerialUpdate(data: SerialData): Promise<ApiResponse<SerialData>> {
    try {
      const allSerials: SerialData[] = await indexedDBProxy.getItem(DB_CONFIG.stores.serials) || [];
      
      const index = allSerials.findIndex(s => s.monitorSerialId === data.monitorSerialId);
      if (index === -1) {
        return {
          code: '40000',
          msg: '串口设备不存在',
          data: null
        };
      }
      
      // 检查端口是否被其他设备占用
      const existingSerial = allSerials.find(s => 
        s.monitorSerialPort === data.monitorSerialPort && 
        s.monitorSerialId !== data.monitorSerialId
      );
      if (existingSerial) {
        return {
          code: '40000',
          msg: `串口端口 ${data.monitorSerialPort} 已被其他设备占用`,
          data: null
        };
      }
      
      // 更新数据
      const updatedSerial: SerialData = {
        ...allSerials[index],
        ...data,
        updateTime: new Date().toISOString()
      };
      
      allSerials[index] = updatedSerial;
      await indexedDBProxy.setItem(DB_CONFIG.stores.serials, allSerials);
      
      return {
        code: '00000',
        msg: '更新成功',
        data: updatedSerial
      };
    } catch (error) {
      console.error('更新串口数据失败:', error);
      return {
        code: '50000',
        msg: '更新失败',
        data: null
      };
    }
  }

  /**
   * 删除串口数据
   */
  static async fetchSerialDelete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const allSerials: SerialData[] = await indexedDBProxy.getItem(DB_CONFIG.stores.serials) || [];
      
      const index = allSerials.findIndex(s => s.monitorSerialId === id);
      if (index === -1) {
        return {
          code: '40000',
          msg: '串口设备不存在',
          data: false
        };
      }
      
      allSerials.splice(index, 1);
      await indexedDBProxy.setItem(DB_CONFIG.stores.serials, allSerials);
      
      return {
        code: '00000',
        msg: '删除成功',
        data: true
      };
    } catch (error) {
      console.error('删除串口数据失败:', error);
      return {
        code: '50000',
        msg: '删除失败',
        data: false
      };
    }
  }

  /**
   * 启动串口连接
   */
  static async fetchSerialStart(id: string): Promise<ApiResponse<boolean>> {
    try {
      const allSerials: SerialData[] = await indexedDBProxy.getItem(DB_CONFIG.stores.serials) || [];
      
      const index = allSerials.findIndex(s => s.monitorSerialId === id);
      if (index === -1) {
        return {
          code: '40000',
          msg: '串口设备不存在',
          data: false
        };
      }
      
      // 更新状态为已连接
      allSerials[index].status = 'connected';
      allSerials[index].updateTime = new Date().toISOString();
      await indexedDBProxy.setItem(DB_CONFIG.stores.serials, allSerials);
      
      return {
        code: '00000',
        msg: '连接成功',
        data: true
      };
    } catch (error) {
      console.error('启动串口连接失败:', error);
      return {
        code: '50000',
        msg: '连接失败',
        data: false
      };
    }
  }

  /**
   * 停止串口连接
   */
  static async fetchSerialStop(id: string): Promise<ApiResponse<boolean>> {
    try {
      const allSerials: SerialData[] = await indexedDBProxy.getItem(DB_CONFIG.stores.serials) || [];
      
      const index = allSerials.findIndex(s => s.monitorSerialId === id);
      if (index === -1) {
        return {
          code: '40000',
          msg: '串口设备不存在',
          data: false
        };
      }
      
      // 更新状态为已断开
      allSerials[index].status = 'disconnected';
      allSerials[index].updateTime = new Date().toISOString();
      await indexedDBProxy.setItem(DB_CONFIG.stores.serials, allSerials);
      
      return {
        code: '00000',
        msg: '断开成功',
        data: true
      };
    } catch (error) {
      console.error('停止串口连接失败:', error);
      return {
        code: '50000',
        msg: '断开失败',
        data: false
      };
    }
  }

  /**
   * 获取可用串口列表
   */
  static async fetchSerialAvailablePorts(): Promise<ApiResponse<string[]>> {
    try {
      // 尝试从缓存获取
      const cachedPorts: string[] = await indexedDBProxy.getItem(DB_CONFIG.stores.ports) || [];
      
      // 如果有缓存且不超过5分钟，直接返回
      const cacheTime = await indexedDBProxy.getItem('portsUpdateTime');
      const now = Date.now();
      if (cacheTime && (now - cacheTime) < 5 * 60 * 1000 && cachedPorts.length > 0) {
        return {
          code: '00000',
          msg: '获取成功',
          data: cachedPorts
        };
      }
      
      // 生成默认端口列表
      const defaultPorts = this.getDefaultPorts();
      
      // 更新缓存
      await indexedDBProxy.setItem(DB_CONFIG.stores.ports, defaultPorts);
      await indexedDBProxy.setItem('portsUpdateTime', now);
      
      return {
        code: '00000',
        msg: '获取成功',
        data: defaultPorts
      };
    } catch (error) {
      console.error('获取可用串口失败:', error);
      return {
        code: '50000',
        msg: '获取失败',
        data: this.getDefaultPorts()
      };
    }
  }

  /**
   * 获取默认串口列表
   */
  private static getDefaultPorts(): string[] {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows') || userAgent.includes('win32') || userAgent.includes('win64')) {
      return ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8'];
    } else if (userAgent.includes('mac') || userAgent.includes('darwin')) {
      return ['/dev/tty.usbserial', '/dev/tty.usbmodem', '/dev/tty.SLAB_USBtoUART'];
    } else {
      return ['/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyACM0', '/dev/ttyACM1', '/dev/ttyS0', '/dev/ttyS1'];
    }
  }

  /**
   * 清空所有数据
   */
  static async clearAllData(): Promise<void> {
    await Promise.all([
      indexedDBProxy.removeItem(DB_CONFIG.stores.serials),
      indexedDBProxy.removeItem(DB_CONFIG.stores.ports),
      indexedDBProxy.removeItem(DB_CONFIG.stores.logs),
      indexedDBProxy.removeItem(DB_CONFIG.stores.settings),
      indexedDBProxy.removeItem('portsUpdateTime')
    ]);
  }
}

export default SerialDB;
