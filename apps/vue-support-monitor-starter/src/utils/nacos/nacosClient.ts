import { NacosConfigClient, NacosNamingClient } from "nacos";
import { message } from "@repo/utils";

/**
 * 数据源接口定义
 */
export interface DataSource {
  genId: string;
  config?: {
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    namespace?: string;
  };
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  namespace?: string;
}

/**
 * Nacos 客户端接口
 */
export interface NacosClient {
  config: NacosConfigClient;
  naming: NacosNamingClient;
  namespace: {
    getNamespaceList(): Promise<any[]>;
    createNamespace(namespaceId: string, namespaceName: string, namespaceDesc?: string): Promise<boolean>;
    deleteNamespace(namespaceId: string): Promise<boolean>;
  };
}

/**
 * Nacos 客户端配置接口
 */
interface NacosClientConfig {
  serverList: string;
  namespace?: string;
  username?: string;
  password?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  ssl?: boolean;
}

/**
 * Nacos客户端管理器
 * 用于管理多个Nacos客户端实例
 */
class NacosClientManagerClass {
  private clients: Map<string, NacosClient>;

  constructor() {
    // 使用Map存储客户端实例，键为数据源ID
    this.clients = new Map<string, NacosClient>();
  }

  /**
   * 获取Nacos客户端实例
   * @param dataSource 数据源信息
   * @returns Nacos客户端实例或null
   */
  getClient(dataSource: DataSource): NacosClient | null {
    if (!dataSource || !dataSource.genId) {
      console.error("数据源信息不完整");
      return null;
    }

    const { genId } = dataSource;

    // 如果已存在客户端实例，直接返回
    if (this.clients.has(genId)) {
      return this.clients.get(genId) || null;
    }

    try {
      // 从数据源中获取Nacos服务器信息
      const { host, port, username, password, namespace } = this.parseDataSource(dataSource);

      if (!host || !port) {
        message("Nacos服务器地址或端口不能为空", { type: "error" });
        return null;
      }

      // 创建Nacos客户端配置
      const config: NacosClientConfig = {
        serverList: `${host}:${port}`,
        namespace: namespace || "public",
      };

      // 如果提供了用户名和密码，添加到配置中
      if (username && password) {
        config.username = username;
        config.password = password;
      }

      // 创建Nacos配置客户端
      const configClient = new NacosConfigClient(config);

      // 创建Nacos命名服务客户端
      const namingClient = new NacosNamingClient({
        ...config,
        logger: console,
      });

      // 确保客户端准备就绪
      namingClient.ready().catch((err) => {
        console.error("Nacos命名服务客户端初始化失败:", err);
      });

      // 创建组合客户端
      const client: NacosClient = {
        config: configClient,
        naming: namingClient,
        namespace: {
          /**
           * 获取命名空间列表
           */
          getNamespaceList: async (): Promise<any[]> => {
            // 实现获取命名空间列表的方法
            try {
              const result = await configClient.getNamespaceList();
              return Array.isArray(result) ? result : [];
            } catch (error) {
              console.error("获取命名空间列表失败:", error);
              return [];
            }
          },

          /**
           * 创建命名空间
           * @param namespaceId 命名空间ID
           * @param namespaceName 命名空间名称
           * @param namespaceDesc 命名空间描述
           */
          createNamespace: async (namespaceId: string, namespaceName: string, namespaceDesc?: string): Promise<boolean> => {
            try {
              // 使用 any 类型断言处理不同的 API 版本
              const client = configClient as any;

              // 检查方法签名
              if (typeof client.createNamespace === "function") {
                // 检查参数数量来判断调用方式
                if (client.createNamespace.length >= 2) {
                  // 如果方法接受多个参数
                  return await client.createNamespace(namespaceId, namespaceName, namespaceDesc || "");
                } else {
                  // 如果方法接受一个对象参数
                  return await client.createNamespace({
                    customNamespaceId: namespaceId,
                    namespaceName,
                    namespaceDesc: namespaceDesc || "",
                  });
                }
              }

              console.warn("Nacos SDK 没有可用的创建命名空间方法");
              return false;
            } catch (error) {
              console.error("创建命名空间失败:", error);
              return false;
            }
          },

          /**
           * 删除命名空间
           * @param namespaceId 命名空间ID
           */
          deleteNamespace: async (namespaceId: string): Promise<boolean> => {
            try {
              return await configClient.deleteNamespace(namespaceId);
            } catch (error) {
              console.error("删除命名空间失败:", error);
              return false;
            }
          },
        },
      };

      // 存储客户端实例
      this.clients.set(genId, client);

      console.log(`Nacos客户端创建成功: ${host}:${port}`);
      return client;
    } catch (error: any) {
      console.error("创建Nacos客户端失败:", error);
      message(`创建Nacos客户端失败: ${error.message}`, { type: "error" });
      return null;
    }
  }

  /**
   * 解析数据源信息
   * @param dataSource 数据源信息
   * @returns 解析后的信息
   */
  private parseDataSource(dataSource: DataSource): {
    host: string | undefined;
    port: string | undefined;
    username: string | undefined;
    password: string | undefined;
    namespace: string | undefined;
  } {
    // 这里根据实际数据源结构进行解析
    // 假设数据源有一个config字段，包含了Nacos服务器的配置信息
    const config = dataSource.config || {};

    return {
      host: config.host || dataSource.host,
      port: config.port || dataSource.port || "8848",
      username: config.username || dataSource.username,
      password: config.password || dataSource.password,
      namespace: config.namespace || dataSource.namespace,
    };
  }

  /**
   * 移除客户端实例
   * @param genId 数据源ID
   */
  removeClient(genId: string): void {
    if (this.clients.has(genId)) {
      this.clients.delete(genId);
      console.log(`Nacos客户端已移除: ${genId}`);
    }
  }

  /**
   * 清除所有客户端实例
   */
  clear(): void {
    this.clients.clear();
    console.log("所有Nacos客户端已清除");
  }
}

// 创建单例实例
export const NacosClientManager = new NacosClientManagerClass();
