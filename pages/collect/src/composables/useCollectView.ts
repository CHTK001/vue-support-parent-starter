/**
 * 采集控制台视图的公共装载逻辑。
 *
 * 登录态由框架的路由守卫保证（未登录根本进不了页面，令牌过期由接口层跳登录页），
 * 这里只负责取数的 loading/错误提示，以及确认框与操作执行的收敛封装。
 */
import { onMounted, ref } from "vue";
import { msgBox, msgError } from "@repo/core";

/** 取接口错误文案，后端 400/409 的 msg 都是可直接展示的中文 */
export function errText(error: unknown): string {
  return (error as Error)?.message || "操作失败";
}

/** 确认框：msgBox 取消时是 reject，这里统一收敛成 false */
export async function confirmAction(message: string, title = "请确认"): Promise<boolean> {
  try {
    return await msgBox(message, title);
  } catch {
    return false;
  }
}

/** 带提示地执行一次操作，返回是否成功 */
export async function runQuiet(action: () => Promise<unknown>): Promise<boolean> {
  try {
    await action();
    return true;
  } catch (error) {
    msgError(errText(error));
    return false;
  }
}

/**
 * 声明一个采集视图的数据装载。
 *
 * @param load 取数函数（内部自行写响应式数据）
 * @returns loading 标记、reload 手动重载
 */
export function useCollectView(load: () => Promise<unknown>) {
  const loading = ref(false);

  async function reload(): Promise<void> {
    loading.value = true;
    try {
      await load();
    } catch (error) {
      msgError(errText(error));
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void reload();
  });

  return { loading, reload };
}
