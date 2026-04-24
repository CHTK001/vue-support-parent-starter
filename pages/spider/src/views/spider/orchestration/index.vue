<template>
  <section class="spider-orchestration">
    <header class="spider-orchestration__hero">
      <div>
        <small>Orchestration</small>
        <h1>编排器工作台骨架</h1>
        <p>当前页面已经接入节点库、示例流程和执行接口位。下一步可以把这里替换成真正的 ScReteEditor 画布。</p>
      </div>
      <div class="spider-orchestration__hero-actions">
        <button type="button" @click="router.push('/spider/manage')">返回管理</button>
        <button type="button" class="is-secondary" @click="loadActiveExampleIntoLab">载入当前示例</button>
      </div>
    </header>

    <div class="spider-orchestration__grid">
      <article class="panel-card">
        <div class="panel-card__head">
          <strong>必选节点</strong>
          <span>开始 / 结束 / 解析 / 下载 / 子流程</span>
        </div>
        <ul>
          <li v-for="item in nodeRequirements" :key="item.type">
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </li>
        </ul>
      </article>

      <article class="panel-card">
        <div class="panel-card__head">
          <strong>每节点设置</strong>
          <span>数据源 / 凭据 / 通知 / 人工介入</span>
        </div>
        <ul>
          <li v-for="item in settings" :key="item.title">
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </li>
        </ul>
      </article>
    </div>

    <div class="spider-orchestration__grid spider-orchestration__grid--wide">
      <article class="panel-card">
        <div class="panel-card__head">
          <strong>节点库</strong>
          <span>当前节点调色板</span>
        </div>
        <div class="node-palette">
          <article
            v-for="item in spiderNodePalette"
            :key="item.type"
            class="node-palette__item"
          >
            <span class="node-palette__tag" :style="{ background: item.color }">
              {{ item.type }}
            </span>
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </article>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-card__head">
          <strong>示例流程</strong>
          <span>百度网盘 / Gitee Explore / Gitee 我的项目</span>
        </div>
        <div class="example-flow-list">
          <button
            v-for="item in exampleFlows"
            :key="item.spiderDefinitionCode"
            type="button"
            class="example-flow-list__item"
            :class="{ 'is-active': item.spiderDefinitionCode === activeFlow.spiderDefinitionCode }"
            @click="selectFlow(item)"
          >
            <strong>{{ item.spiderFlowName }}</strong>
            <small>{{ item.spiderDefinitionCode }}</small>
          </button>
        </div>
      </article>
    </div>

    <article class="panel-card">
      <div class="panel-card__head">
        <strong>当前示例流程预览</strong>
        <span>{{ activeFlow.spiderFlowName }}</span>
      </div>
      <div class="flow-preview">
        <div class="flow-preview__meta">
          <span>流程版本 {{ activeFlow.spiderFlowVersion }}</span>
          <span>节点 {{ activeFlow.nodes.length }}</span>
          <span>边 {{ activeFlow.edges.length }}</span>
          <span>作用域 {{ activeFlow.spiderFlowScope }}</span>
        </div>
        <ul>
          <li v-for="item in activeFlow.nodes" :key="item.id">
            <strong>{{ item.title }}</strong>
            <p>{{ item.type }} · {{ item.position.x }}, {{ item.position.y }}</p>
          </li>
        </ul>
      </div>
    </article>

    <article class="panel-card">
      <div class="panel-card__head">
        <strong>预览与执行追踪</strong>
        <span>保存后可回放当前执行到哪一个节点</span>
      </div>
      <ul>
        <li v-for="item in previewRules" :key="item.title">
          <strong>{{ item.title }}</strong>
          <p>{{ item.detail }}</p>
        </li>
      </ul>
    </article>

    <article class="panel-card">
      <div class="panel-card__head">
        <strong>执行接口位</strong>
        <span>当前已具备的后端接口</span>
      </div>
      <ul>
        <li v-for="item in executionApis" :key="item.title">
          <strong>{{ item.title }}</strong>
          <p>{{ item.detail }}</p>
        </li>
      </ul>
    </article>

    <article class="panel-card">
      <div class="panel-card__head">
        <strong>Runtime 实验区</strong>
        <span>真实调用页面访问和选择器测试接口</span>
      </div>
      <div class="runtime-lab">
        <div class="runtime-lab__form">
          <label>
            <span>访问 URL</span>
            <input v-model="pageAccessForm.spiderUrl" type="text" placeholder="https://example.com" />
          </label>
          <label>
            <span>访问模式</span>
            <select v-model="pageAccessForm.spiderAccessMode">
              <option value="HTTP">HTTP</option>
              <option value="PLAYWRIGHT">PLAYWRIGHT</option>
            </select>
          </label>
          <div class="runtime-lab__actions">
            <button type="button" @click="handlePageAccessTest">测试页面访问</button>
            <button type="button" class="is-secondary" @click="handleFillSelectorHtml">把页面结果载入选择器测试</button>
          </div>
        </div>

        <div class="runtime-lab__result" v-if="pageAccessResult">
          <strong>页面访问结果</strong>
          <p>状态码：{{ pageAccessResult.spiderStatusCode }}</p>
          <p>标题：{{ pageAccessResult.spiderTitle || "无标题" }}</p>
          <textarea :value="pageAccessResult.spiderHtml || ''" readonly rows="8" />
        </div>
      </div>

      <div class="runtime-lab runtime-lab--selector">
        <div class="runtime-lab__form">
          <label>
            <span>基础 URL</span>
            <input v-model="selectorForm.spiderBaseUrl" type="text" placeholder="https://example.com" />
          </label>
          <label>
            <span>选择器类型</span>
            <select v-model="selectorForm.spiderSelectorType">
              <option value="CSS">CSS</option>
              <option value="XPATH">XPATH</option>
              <option value="REGEX">REGEX</option>
            </select>
          </label>
          <label>
            <span>选择器</span>
            <input v-model="selectorForm.spiderSelector" type="text" placeholder="a[href]" />
          </label>
          <label>
            <span>属性名</span>
            <input v-model="selectorForm.spiderAttribute" type="text" placeholder="href / text" />
          </label>
          <label class="is-full">
            <span>HTML</span>
            <textarea v-model="selectorForm.spiderHtml" rows="8" />
          </label>
          <div class="runtime-lab__actions">
            <button type="button" @click="handleSelectorTest">测试选择器</button>
          </div>
        </div>

        <div class="runtime-lab__result" v-if="selectorResult">
          <strong>选择器测试结果</strong>
          <ul>
            <li v-for="(item, index) in selectorResult.spiderValues" :key="`${index}-${item}`">
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <div class="runtime-lab runtime-lab--selector">
        <div class="runtime-lab__form">
          <label>
            <span>URL 解析模式</span>
            <select v-model="urlParseForm.spiderParseMode">
              <option value="AUTO_LINKS">AUTO_LINKS</option>
              <option value="CSS">CSS</option>
              <option value="XPATH">XPATH</option>
              <option value="REGEX">REGEX</option>
            </select>
          </label>
          <label>
            <span>URL 解析选择器</span>
            <input v-model="urlParseForm.spiderSelector" type="text" placeholder="a[href]" />
          </label>
          <div class="runtime-lab__actions">
            <button type="button" @click="handleUrlParseTest">测试 URL 解析</button>
          </div>
        </div>

        <div class="runtime-lab__result" v-if="urlParseResult">
          <strong>URL 解析结果</strong>
          <ul>
            <li v-for="(item, index) in urlParseResult.spiderUrls" :key="`${index}-${item}`">
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <div class="runtime-lab runtime-lab--selector">
        <div class="runtime-lab__form">
          <label class="is-full">
            <span>字段配置 JSON</span>
            <textarea v-model="dataParseFieldJson" rows="8" />
          </label>
          <div class="runtime-lab__actions">
            <button type="button" class="is-secondary" @click="handleApplyDataParseFields">应用字段配置</button>
            <button type="button" @click="handleDataParseTest">测试数据解析</button>
          </div>
        </div>

        <div class="runtime-lab__result" v-if="dataParseResult">
          <strong>数据解析结果</strong>
          <ul>
            <li v-for="(item, key) in dataParseResult.spiderValues" :key="key">
              {{ key }} = {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import {
  baiduPanExampleFlow,
  giteeExploreExampleFlow,
  giteeMineExampleFlow,
  spiderNodePalette,
} from "../../../index";
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  spiderNodeRequirements as nodeRequirements,
  testSpiderDataParse,
  testSpiderPageAccess,
  testSpiderSelector,
  testSpiderUrlParse,
} from "../../../api/spider";
import type {
  SpiderDataParseTestRequest,
  SpiderDataParseTestView,
  SpiderPageAccessRequest,
  SpiderPageAccessView,
  SpiderSelectorTestRequest,
  SpiderSelectorTestView,
  SpiderUrlParseTestRequest,
  SpiderUrlParseTestView,
} from "../../../types/orchestration";

const router = useRouter();
const exampleFlows = [
  baiduPanExampleFlow,
  giteeExploreExampleFlow,
  giteeMineExampleFlow,
];
const activeFlow = ref(exampleFlows[0]);
const selectFlow = (flow: (typeof exampleFlows)[number]) => {
  activeFlow.value = flow;
};
const pageAccessForm = ref<SpiderPageAccessRequest>({
  spiderUrl: activeFlow.value.nodes[0]?.config?.entryUrl as string,
  spiderAccessMode: "HTTP",
});
const selectorForm = ref<SpiderSelectorTestRequest>({
  spiderHtml: "",
  spiderBaseUrl: activeFlow.value.nodes[0]?.config?.entryUrl as string,
  spiderSelector: "a[href]",
  spiderSelectorType: "CSS",
  spiderAttribute: "href",
});
const urlParseForm = ref<SpiderUrlParseTestRequest>({
  spiderHtml: "",
  spiderBaseUrl: activeFlow.value.nodes[0]?.config?.entryUrl as string,
  spiderParseMode: "AUTO_LINKS",
  spiderSelector: "",
});
const dataParseForm = ref<SpiderDataParseTestRequest>({
  spiderHtml: "",
  spiderBaseUrl: activeFlow.value.nodes[0]?.config?.entryUrl as string,
  spiderFields: [
    {
      spiderFieldName: "title",
      spiderSelectorType: "CSS",
      spiderSelector: "title",
    },
  ],
});
const pageAccessResult = ref<SpiderPageAccessView | null>(null);
const selectorResult = ref<SpiderSelectorTestView | null>(null);
const urlParseResult = ref<SpiderUrlParseTestView | null>(null);
const dataParseResult = ref<SpiderDataParseTestView | null>(null);
const dataParseFieldJson = ref(
  JSON.stringify(
    [
      {
        spiderFieldName: "title",
        spiderSelectorType: "CSS",
        spiderSelector: "title",
      },
      {
        spiderFieldName: "repoUrl",
        spiderSelectorType: "REGEX",
        spiderSelector: "https://gitee\\\\.com/[\\\\w\\\\-]+/[\\\\w\\\\-]+",
      },
    ],
    null,
    2,
  ),
);

const settings = [
  {
    title: "数据库 / 数据池",
    detail: "支持账号密码池、Cookie 池、代理池、验证码结果池，并允许 AI 辅助选择可用凭据。",
  },
  {
    title: "短信 / 验证码提示",
    detail: "节点可声明需要短信、人机验证或人工确认，并触发 lay-message、lay-task、ScOverlayTask。",
  },
  {
    title: "节点通知",
    detail: "成功、失败、待人工处理都需要细分通知策略，避免只有任务级粗粒度告警。",
  },
];

const previewRules = [
  {
    title: "执行路径高亮",
    detail: "预览时要高亮成功节点与已走过的边，不能只看最终结果。",
  },
  {
    title: "人工介入态显式标记",
    detail: "短信、验证码、扫码登录等节点必须有显眼状态，方便人工接手处理。",
  },
  {
    title: "链路快照持久化",
    detail: "每次执行的节点输入、输出、异常、人工动作、通知动作都要持久化保存。",
  },
];

const executionApis = [
  {
    title: "POST /spider/executions/preview",
    detail: "创建预览执行、节点步骤、人工任务和派生步骤。",
  },
  {
    title: "POST /spider/executions/run",
    detail: "创建真实执行任务并进入运行态。",
  },
  {
    title: "GET /spider/executions/detail",
    detail: "读取执行详情、步骤状态、人工任务状态。",
  },
  {
    title: "POST /spider/executions/manual-task/submit",
    detail: "提交人工结果并恢复当前执行。",
  },
];

const loadActiveExampleIntoLab = () => {
  const entryUrl = String(activeFlow.value.nodes[0]?.config?.entryUrl || "");
  pageAccessForm.value.spiderUrl = entryUrl;
  selectorForm.value.spiderBaseUrl = entryUrl;
  urlParseForm.value.spiderBaseUrl = entryUrl;
  dataParseForm.value.spiderBaseUrl = entryUrl;
};

const handlePageAccessTest = async () => {
  pageAccessResult.value = await testSpiderPageAccess(pageAccessForm.value);
};

const handleFillSelectorHtml = () => {
  if (pageAccessResult.value?.spiderHtml) {
    selectorForm.value.spiderHtml = pageAccessResult.value.spiderHtml;
    selectorForm.value.spiderBaseUrl = pageAccessResult.value.spiderUrl;
    urlParseForm.value.spiderHtml = pageAccessResult.value.spiderHtml;
    urlParseForm.value.spiderBaseUrl = pageAccessResult.value.spiderUrl;
    dataParseForm.value.spiderHtml = pageAccessResult.value.spiderHtml;
    dataParseForm.value.spiderBaseUrl = pageAccessResult.value.spiderUrl;
  }
};

const handleSelectorTest = async () => {
  selectorResult.value = await testSpiderSelector(selectorForm.value);
};

const handleUrlParseTest = async () => {
  urlParseResult.value = await testSpiderUrlParse(urlParseForm.value);
};

const handleApplyDataParseFields = () => {
  try {
    const parsed = JSON.parse(dataParseFieldJson.value);
    dataParseForm.value.spiderFields = Array.isArray(parsed) ? parsed : [];
  } catch {
    dataParseForm.value.spiderFields = [];
  }
};

const handleDataParseTest = async () => {
  dataParseResult.value = await testSpiderDataParse(dataParseForm.value);
};
</script>

<style scoped lang="scss">
.spider-orchestration {
  min-height: 100%;
  padding: 24px 12px;
  display: grid;
  gap: 18px;
  background:
    radial-gradient(circle at right top, rgba(59, 130, 246, 0.12), transparent 25%),
    linear-gradient(180deg, #f7f8fc 0%, #edf1f8 100%);
}

.spider-orchestration__hero,
.panel-card {
  padding: 22px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.spider-orchestration__hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;

  small {
    color: #1d4ed8;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 8px 0;
    font-size: 28px;
    color: #111827;
  }

  p {
    margin: 0;
    color: #475569;
    line-height: 1.8;
  }

  button {
    height: 42px;
    padding: 0 16px;
    border: 0;
    border-radius: 999px;
    background: #0f172a;
    color: #fff;
    cursor: pointer;
  }
}

.spider-orchestration__hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.spider-orchestration__hero-actions .is-secondary {
  background: #dbeafe;
  color: #1e3a8a;
}

.spider-orchestration__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.spider-orchestration__grid--wide {
  align-items: start;
}

.panel-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  strong {
    color: #111827;
    font-size: 16px;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.panel-card ul {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.panel-card li {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;

  strong {
    display: block;
    color: #0f172a;
  }

  p {
    margin: 8px 0 0;
    color: #475569;
    line-height: 1.8;
  }
}

.node-palette {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.node-palette__item,
.example-flow-list__item {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
}

.node-palette__tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.node-palette__item strong,
.example-flow-list__item strong {
  display: block;
  margin-top: 10px;
  color: #0f172a;
}

.node-palette__item p,
.example-flow-list__item small {
  display: block;
  margin-top: 8px;
  color: #475569;
  line-height: 1.7;
}

.example-flow-list {
  display: grid;
  gap: 12px;
}

.example-flow-list__item {
  text-align: left;
  border: 1px solid transparent;
  cursor: pointer;
}

.example-flow-list__item.is-active {
  border-color: rgba(37, 99, 235, 0.3);
  background: #eff6ff;
}

.flow-preview {
  display: grid;
  gap: 14px;
}

.flow-preview__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  span {
    display: inline-flex;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1e3a8a;
    font-size: 12px;
    font-weight: 600;
  }
}

.runtime-lab {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 16px;
  margin-top: 16px;
}

.runtime-lab--selector {
  margin-top: 22px;
}

.runtime-lab__form {
  display: grid;
  gap: 12px;
}

.runtime-lab__form label {
  display: grid;
  gap: 6px;
}

.runtime-lab__form label span {
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.runtime-lab__form input,
.runtime-lab__form select,
.runtime-lab__form textarea {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 14px;
  padding: 10px 12px;
  background: #fff;
  color: #0f172a;
}

.runtime-lab__form label.is-full {
  grid-column: 1 / -1;
}

.runtime-lab__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.runtime-lab__actions button {
  height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #0f172a;
  color: #fff;
  cursor: pointer;
}

.runtime-lab__actions .is-secondary {
  background: #dbeafe;
  color: #1e3a8a;
}

.runtime-lab__result {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;

  strong {
    display: block;
    color: #0f172a;
  }

  p {
    margin: 8px 0 0;
    color: #475569;
  }

  textarea {
    width: 100%;
    margin-top: 12px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 14px;
    padding: 10px 12px;
    background: #fff;
  }

  ul {
    margin-top: 10px;
  }
}

@media (max-width: 720px) {
  .spider-orchestration__hero {
    flex-direction: column;
  }

  .spider-orchestration__grid {
    grid-template-columns: 1fr;
  }

  .node-palette {
    grid-template-columns: 1fr;
  }

  .runtime-lab {
    grid-template-columns: 1fr;
  }
}
</style>
