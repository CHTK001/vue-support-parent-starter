/**
 * 采集控制台视图的公共装载逻辑。
 *
 * 三件事统一做掉，避免每个页面重复：
 * 1. 等鉴权状态就绪再首次取数——否则未登录时每个接口各报一次 401；
 * 2. 登录成功（epoch 自增）后自动重载当前页；
 * 3. 集中把 ConsoleError 转成一条中文提示。
 */
import { computed, onMounted, ref, watch } from "vue";
import type { ComputedRef } from "vue";
import { msgBox, msgError } from "@repo/core";
import { bootstrap, state } from "./useCollectAuth";

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
    void bootstrap().then(reload);
  });

  watch(
    () => state.epoch,
    () => {
      if (state.authenticated) {
        void reload();
      }
    },
  );

  return { loading, reload };
}

/**
 * 登录浮层是否已让开界面。
 *
 * ReTable 这类"挂载即自取数"的组件用它做 `v-if`，否则未登录时会各自报一次 401。
 * 状态查询失败时算 ready——鉴权未启用的部署不该被门挡住。
 */
export function useCollectGated(): { ready: ComputedRef<boolean> } {
  const ready = computed(() => state.ready && !state.needLogin);
  onMounted(() => {
    void bootstrap();
  });
  return { ready };
}
