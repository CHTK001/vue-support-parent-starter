<!--
  http.useQuery / useMutation 运行时验证台

  目的：不依赖任何后端，验证 `http.get(url).useQuery(key)` 与 `.useMutation()`
  在真实链路里的行为 —— 走的是 @repo/utils 的 Http + unwrapResult + vue-query，
  只把 axios 的 adapter 换成内存假实现（可控延迟、可控失败、可数请求次数）。

  验收点：
    1. 首次挂载发 1 次请求，isPending → data
    2. 相同 queryKey 的两个组件共享缓存，只发 1 次请求（去重）
    3. staleTime 内再次挂载不再请求
    4. mutate 后 invalidateQueries 能让列表重新取数
-->
<template>
  <div class="qlab">
    <h1 class="qlab__title">http.useQuery / useMutation 运行时验证</h1>
    <p class="qlab__sub">
      底层完全走 <code>@repo/utils</code> 的 <code>Http</code>（unwrapResult 解信封、拦截器链路保留），
      仅把 axios adapter 换成内存假实现，因此不依赖后端即可验证缓存 / 去重 / 失效。
    </p>

    <div class="qlab__row">
      <el-button data-ql="refetch" @click="refetchAll">手动 refetch</el-button>
      <el-button data-ql="invalidate" @click="invalidate">invalidateQueries(['demo','list'])</el-button>
      <el-button data-ql="add" type="primary" @click="addItem">mutate 新增一条</el-button>
      <el-button data-ql="toggle" @click="showTwin = !showTwin">
        第二个同 key 组件：{{ showTwin ? "开" : "关" }}
      </el-button>
    </div>

    <div class="qlab__stat" data-ql="stat">
      真实请求次数（同 key 去重后）:<b>{{ requestCount }}</b>
    </div>

    <div class="qlab__grid">
      <section class="qlab__card">
        <h2>组件 A · useQuery(['demo','list'])</h2>
        <p data-ql="a-status">
          status=<b>{{ qa.isPending.value ? "pending" : qa.isError.value ? "error" : "success" }}</b>
          isFetching=<b>{{ qa.isFetching.value }}</b>
          staleTime={{ STALE }}ms
        </p>
        <ul v-if="qa.data.value">
          <li v-for="it in qa.data.value.list" :key="it.id" :data-ql-row="it.id">
            #{{ it.id }} {{ it.name }}
          </li>
        </ul>
        <p v-else-if="qa.isError.value" class="qlab__err">{{ qa.error.value?.message }}</p>
        <p v-else>加载中…</p>
      </section>

      <section v-if="showTwin" class="qlab__card">
        <h2>组件 B · 同一个 key</h2>
        <p data-ql="b-count">B 看到的条数:<b>{{ qb.data.value?.list?.length ?? "-" }}</b></p>
        <p class="qlab__hint">与 A 共享缓存：两个组件只触发一次真实请求。</p>
      </section>
    </div>

    <section class="qlab__card">
      <h2>useMutation</h2>
      <p data-ql="mut">
        提交中=<b>{{ m.isPending.value }}</b> 上次结果=<b>{{ lastMut }}</b>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 用内存 adapter 模拟后端：把 axios 的传输层换掉，其余（拦截器/信封/useQuery）全走真实代码。
 */
import { ref, shallowRef } from "vue";
import axios from "axios";
import { useQueryClient } from "@tanstack/vue-query";
import { createHttp, unwrapResult } from "@repo/utils";

/** staleTime：演示「期内不重复请求」 */
const STALE = 30_000;

/** 假后端数据（可变，供 mutate 演示） */
let seq = 3;
const rows = [
  { id: 1, name: "alpha" },
  { id: 2, name: "beta" },
  { id: 3, name: "gamma" },
];

/** 真实发出的请求次数（用来证明去重生效） */
const requestCount = ref(0);

/** 造一个内存 axios 实例：所有请求立即返回统一信封，不碰网络 */
const memoryInstance = axios.create({
  adapter: async (config) => {
    requestCount.value += 1;
    // 模拟 120ms 网络延迟，让 isPending 可见
    await new Promise((r) => setTimeout(r, 120));
    const body =
      config.method === "get"
        ? { code: "00000", data: { list: rows.map((r) => ({ ...r })) } }
        : { code: "00000", data: { ok: true } };
    return { data: body, status: 200, statusText: "OK", headers: {}, config };
  },
});

/** 复用真实 Http：拦截器链、unwrapResult、链式 API 全部生效 */
const http = createHttp({ baseUrl: "", instance: memoryInstance });

const queryClient = useQueryClient();
const showTwin = ref(true);
const lastMut = shallowRef<string | null>(null);

/** 组件 A：列表查询 */
const qa = http.get("/demo/list").useQuery<{ list: Array<{ id: number; name: string }> }>(
  ["demo", "list"],
  { staleTime: STALE },
);

/** 同一个 key 的第二个订阅者 —— 应为 0 次额外请求 */
const qb = http.get("/demo/list").useQuery<{ list: Array<{ id: number; name: string }> }>(
  ["demo", "list"],
  { staleTime: STALE },
);

/** 写操作：成功后让列表失效重取 */
const m = http
  .post("/demo/add")
  .noToast(true)
  .useMutation<{ ok: boolean }, { name: string }>({
    onSuccess: () => {
      lastMut.value = new Date().toLocaleTimeString();
      void queryClient.invalidateQueries({ queryKey: ["demo", "list"] });
    },
  });

function addItem() {
  seq += 1;
  rows.push({ id: seq, name: `item-${seq}` });
  m.mutate({ name: `item-${seq}` });
}

function refetchAll() {
  void qa.refetch();
}

function invalidate() {
  void queryClient.invalidateQueries({ queryKey: ["demo", "list"] });
}

// unwrapResult 是 http.ts 的导出，这里显式引用一次确保类型/运行都链到它
void unwrapResult;
</script>

<style scoped>
.qlab {
  padding: 24px 28px 40px;
  max-width: 1180px;
  margin: 0 auto;
  color: var(--el-text-color-primary);
}

.qlab__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
}

.qlab__sub {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.qlab__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.qlab__stat {
  margin-bottom: 16px;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-color-primary) 5%, var(--el-bg-color-overlay));
  font-size: 13px;
}

.qlab__stat b {
  margin-left: 6px;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}

.qlab__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.qlab__card {
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
}

.qlab__card h2 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.qlab__card ul {
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.9;
}

.qlab__hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.qlab__err {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-color-danger);
}

code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-size: 12px;
}
</style>
