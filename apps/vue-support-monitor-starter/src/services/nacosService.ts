import { message } from "@repo/utils";
import { NacosClientManager, DataSource, NacosClient } from "@/utils/nacos/nacosClient";

/**
 * 配置查询参数
 */
export interface ConfigQueryParams {
  dataId?: string;
  group?: string;
  namespace?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 配置保存参数
 */
export interface ConfigSaveParams {
  dataId: string;
  group: string;
  namespace?: string;
  content: string;
  type?: string;
}

/**
 * 命名空间参数
 */
export interface NamespaceParams {
  namespaceId: string;
  namespaceName: string;
  namespaceDesc?: string;
}

/**
 * 服务查询参数
 */
export interface ServiceQueryParams {
  serviceName?: string;
  groupName?: string;
  namespace?: string;
  pageNum?: number;
  pageSize?: number;
}

/**
 * 实例查询参数
 */
export interface InstanceQueryParams {
  serviceName: string;
  groupName?: string;
  namespace?: string;
  clusters?: string;
}

/**
 * Nacos服务类
 * 用于处理Nacos配置中心和服务发现相关的操作
 */
class NacosService {
  /**
   * 获取配置列表
   * @param dataSource 数据源信息
   * @param params 查询参数
   * @returns 配置列表结果
   */
  async getConfigList(dataSource: DataSource, params: ConfigQueryParams = {}) {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) return { pageItems: [], totalCount: 0 };

      const { dataId, group, namespace, pageNum = 1, pageSize = 20 } = params;

      // 构建查询参数
      const queryParams = {
        tenant: namespace,
        dataId: dataId || "",
        group: group || "",
        pageNo: pageNum,
        pageSize,
      };

      // 调用Nacos SDK获取配置列表
      const result = await client.config.getConfigList(queryParams);

      // 为每个配置项添加类型信息
      if (result && result.pageItems) {
        result.pageItems.forEach((item: any) => {
          item.type = this.getConfigType(item.dataId);
        });
      }

      return result;
    } catch (error: any) {
      message(`获取配置列表失败: ${error.message}`, { type: "error" });
      console.error("获取配置列表失败:", error);
      return { pageItems: [], totalCount: 0 };
    }
  }

  /**
   * 获取配置详情
   * @param dataSource 数据源信息
   * @param params 查询参数
   * @returns 配置详情
   */
  async getConfigDetail(dataSource: DataSource, params: { dataId: string; group: string; namespace?: string }) {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) return null;

      const { dataId, group, namespace } = params;

      if (!dataId || !group) {
        message("配置ID和分组不能为空", { type: "warning" });
        return null;
      }

      // 调用Nacos SDK获取配置内容
      // 使用any类型断言，因为SDK接口可能会变化
      const configClient = client.config as any;
      let content;

      if (typeof configClient.getConfig === "function") {
        // 检查参数数量决定调用方式
        if (configClient.getConfig.length >= 2) {
          content = await configClient.getConfig(dataId, group, namespace);
        } else {
          content = await configClient.getConfig({
            dataId,
            group,
            tenant: namespace,
          });
        }
      } else {
        message("Nacos SDK没有可用的获取配置方法", { type: "error" });
        return null;
      }

      return {
        dataId,
        group,
        namespace,
        content,
        type: this.getConfigType(dataId),
      };
    } catch (error: any) {
      message(`获取配置详情失败: ${error.message}`, { type: "error" });
      console.error("获取配置详情失败:", error);
      return null;
    }
  }

  /**
   * 保存配置
   * @param dataSource 数据源信息
   * @param params 配置参数
   * @returns 是否保存成功
   */
  async saveConfig(dataSource: DataSource, params: ConfigSaveParams): Promise<boolean> {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) {
        message("Nacos客户端连接失败", { type: "error" });
        return false;
      }

      const { dataId, group, namespace, content } = params;

      if (!dataId || !group || !content) {
        message("配置ID、分组和内容不能为空", { type: "warning" });
        return false;
      }

      // 调用Nacos SDK发布配置
      const result = await client.config.publishConfig({
        dataId,
        group,
        content,
        tenant: namespace,
      });

      if (!result) {
        message("保存配置失败", { type: "error" });
        return false;
      }

      return true;
    } catch (error: any) {
      message(`保存配置失败: ${error.message}`, { type: "error" });
      console.error("保存配置失败:", error);
      return false;
    }
  }

  /**
   * 删除配置
   * @param dataSource 数据源信息
   * @param params 配置参数
   * @returns 是否删除成功
   */
  async deleteConfig(dataSource: DataSource, params: { dataId: string; group: string; namespace?: string }): Promise<boolean> {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) {
        message("Nacos客户端连接失败", { type: "error" });
        return false;
      }

      const { dataId, group, namespace } = params;

      if (!dataId || !group) {
        message("配置ID和分组不能为空", { type: "warning" });
        return false;
      }

      // 调用Nacos SDK删除配置
      const result = await client.config.removeConfig({
        dataId,
        group,
        tenant: namespace,
      });

      if (!result) {
        message("删除配置失败", { type: "error" });
        return false;
      }

      return true;
    } catch (error: any) {
      message(`删除配置失败: ${error.message}`, { type: "error" });
      console.error("删除配置失败:", error);
      return false;
    }
  }

  /**
   * 获取命名空间列表
   * @param dataSource 数据源信息
   * @returns 命名空间列表
   */
  async getNamespaces(dataSource: DataSource): Promise<any[]> {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) {
        return [{ id: "public", name: "默认命名空间", configCount: 0 }];
      }

      // 调用Nacos SDK获取命名空间列表
      const namespaces = await client.namespace.getNamespaceList();

      if (!namespaces || !Array.isArray(namespaces)) {
        return [{ id: "public", name: "默认命名空间", configCount: 0 }];
      }

      return namespaces;
    } catch (error: any) {
      message(`获取命名空间列表失败: ${error.message}`, { type: "error" });
      console.error("获取命名空间列表失败:", error);
      return [{ id: "public", name: "默认命名空间", configCount: 0 }];
    }
  }

  /**
   * 创建命名空间
   * @param dataSource 数据源信息
   * @param params 命名空间参数
   * @returns 是否创建成功
   */
  async createNamespace(dataSource: DataSource, params: NamespaceParams): Promise<boolean> {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) {
        message("Nacos客户端连接失败", { type: "error" });
        return false;
      }

      const { namespaceId, namespaceName, namespaceDesc } = params;

      if (!namespaceId || !namespaceName) {
        message("命名空间ID和名称不能为空", { type: "warning" });
        return false;
      }

      // 调用Nacos SDK创建命名空间，使用新的方法签名
      const result = await client.namespace.createNamespace(namespaceId, namespaceName, namespaceDesc);

      if (!result) {
        message("创建命名空间失败", { type: "error" });
        return false;
      }

      return true;
    } catch (error: any) {
      message(`创建命名空间失败: ${error.message}`, { type: "error" });
      console.error("创建命名空间失败:", error);
      return false;
    }
  }

  /**
   * 删除命名空间
   * @param dataSource 数据源信息
   * @param namespaceId 命名空间ID
   * @returns 是否删除成功
   */
  async deleteNamespace(dataSource: DataSource, namespaceId: string): Promise<boolean> {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) {
        message("Nacos客户端连接失败", { type: "error" });
        return false;
      }

      if (!namespaceId) {
        message("命名空间ID不能为空", { type: "warning" });
        return false;
      }

      // 调用Nacos SDK删除命名空间
      const result = await client.namespace.deleteNamespace(namespaceId);

      if (!result) {
        message("删除命名空间失败", { type: "error" });
        return false;
      }

      return true;
    } catch (error: any) {
      message(`删除命名空间失败: ${error.message}`, { type: "error" });
      console.error("删除命名空间失败:", error);
      return false;
    }
  }

  /**
   * 获取服务列表
   * @param dataSource 数据源信息
   * @param params 查询参数
   * @returns 服务列表结果
   */
  async getServiceList(dataSource: DataSource, params: ServiceQueryParams = {}): Promise<{ doms: any[]; count: number }> {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) return { doms: [], count: 0 };

      const { serviceName, groupName, namespace, pageNum = 1, pageSize = 20 } = params;

      // 调用Nacos SDK获取服务列表
      try {
        // 使用SDK的服务列表获取方法
        // 使用any类型断言，因为SDK接口可能会变化
        const namingClient = client.naming as any;

        // 尝试调用getServiceList方法
        if (typeof namingClient.getServiceList === "function") {
          const result = await namingClient.getServiceList({
            pageNo: pageNum,
            pageSize,
            groupName: groupName || "",
            namespaceId: namespace,
            serviceName: serviceName || "",
          });
          return result;
        }

        // 尝试调用getServicesOfServer方法（如果有）
        if (typeof namingClient.getServicesOfServer === "function") {
          const result = await namingClient.getServicesOfServer({
            pageNo: pageNum,
            pageSize,
            groupName: groupName || "",
            namespaceId: namespace,
          });

          // 过滤服务名称（如果提供了）
          let filteredDoms = result.dom || [];
          if (serviceName) {
            filteredDoms = filteredDoms.filter((dom: any) => dom.name && dom.name.toLowerCase().includes(serviceName.toLowerCase()));
          }

          return {
            doms: filteredDoms,
            count: filteredDoms.length,
          };
        }

        // 如果都没有可用的方法，返回空结果
        console.warn("Nacos SDK没有可用的服务列表获取方法");
        return { doms: [], count: 0 };
      } catch (err) {
        console.error("调用Nacos服务列表API失败:", err);
        return { doms: [], count: 0 };
      }
    } catch (error: any) {
      message(`获取服务列表失败: ${error.message}`, { type: "error" });
      console.error("获取服务列表失败:", error);
      return { doms: [], count: 0 };
    }
  }

  /**
   * 获取服务实例列表
   * @param dataSource 数据源信息
   * @param params 查询参数
   * @returns 实例列表
   */
  async getInstanceList(dataSource: DataSource, params: InstanceQueryParams): Promise<any[]> {
    try {
      const client = NacosClientManager.getClient(dataSource);
      if (!client) return [];

      const { serviceName, groupName, namespace, clusters } = params;

      if (!serviceName) {
        message("服务名称不能为空", { type: "warning" });
        return [];
      }

      // 调用Nacos SDK获取服务实例列表
      try {
        // 使用any类型断言，因为SDK接口可能会变化
        const namingClient = client.naming as any;

        // 尝试使用不同的方法调用
        if (typeof namingClient.getAllInstances === "function") {
          // 判断方法签名以决定如何调用
          const funcLength = namingClient.getAllInstances.length;

          if (funcLength >= 2) {
            // 假设方法签名为 getAllInstances(serviceName, groupName, clusters, subscribe)
            return await namingClient.getAllInstances(serviceName, groupName || "DEFAULT_GROUP", clusters || undefined, true);
          } else {
            // 假设方法签名为 getAllInstances(params)
            return await namingClient.getAllInstances({
              serviceName,
              groupName: groupName || "DEFAULT_GROUP",
              clusters: clusters || "",
              namespaceId: namespace,
              subscribe: true,
            });
          }
        }

        // 如果没有找到方法，返回空数组
        console.warn("Nacos SDK没有可用的实例列表获取方法");
        return [];
      } catch (err) {
        console.error("调用Nacos实例列表API失败:", err);
        return [];
      }
    } catch (error: any) {
      message(`获取服务实例列表失败: ${error.message}`, { type: "error" });
      console.error("获取服务实例列表失败:", error);
      return [];
    }
  }

  /**
   * 根据文件名获取配置类型
   * @param fileName 文件名
   * @returns 配置类型
   */
  getConfigType(fileName: string): string {
    if (!fileName) return "text";

    if (fileName.endsWith(".properties") || fileName.endsWith(".prop")) {
      return "properties";
    } else if (fileName.endsWith(".json")) {
      return "json";
    } else if (fileName.endsWith(".xml")) {
      return "xml";
    } else if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
      return "yaml";
    } else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
      return "html";
    } else {
      return "text";
    }
  }
}

export default new NacosService();
