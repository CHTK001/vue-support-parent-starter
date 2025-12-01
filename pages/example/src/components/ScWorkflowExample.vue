<template>
  <div class="workflow-example">
    <el-container>
      <el-header>
        <el-page-header :content="data.name"></el-page-header>
        <div class="do">
          <el-button type="primary" @click="exportJson">导出 JSON</el-button>
        </div>
      </el-header>
      <el-main>
        <sc-workflow v-model="data.nodeConfig"></sc-workflow>
      </el-main>
    </el-container>

    <!-- 代码示例 -->
    <div class="code-section">
      <CodePreview :tabs="codeTabs" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { ElMessage } from "element-plus";
import scWorkflow from "@repo/components/ScWorkflow/index.vue";
import CodePreview from "./CodePreview.vue";

// 代码示例标签页
const codeTabs = [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<template>
  <sc-workflow v-model="nodeConfig" />
</template>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { reactive } from "vue";
import scWorkflow from "@repo/components/ScWorkflow/index.vue";

const data = reactive({
  name: "请假审批",
  nodeConfig: {
    nodeName: "发起人",
    type: 0,
    nodeRoleList: [],
    childNode: {
      nodeName: "条件路由",
      type: 4,
      conditionNodes: [
        {
          nodeName: "长期",
          type: 3,
          priorityLevel: 1,
          conditionList: [
            { label: "请假天数", field: "day", operator: ">", value: "7" }
          ],
          childNode: {
            nodeName: "领导审批",
            type: 1,
            setType: 1,
            nodeUserList: [{ id: "1", name: "张三" }]
          }
        }
      ]
    }
  }
});`,
  },
];

/**
 * 用户信息接口
 * @author CH
 * @version 1.0.0
 */
interface UserInfo {
  /** 用户ID */
  id: string;
  /** 用户姓名 */
  name: string;
}

/**
 * 条件配置接口
 * @author CH
 * @version 1.0.0
 */
interface ConditionConfig {
  /** 条件标签 */
  label: string;
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator: string;
  /** 条件值 */
  value: string;
}

/**
 * 工作流节点接口
 * @author CH
 * @version 1.0.0
 */
interface WorkflowNode {
  /** 节点名称 */
  nodeName: string;
  /** 节点类型 */
  type: number;
  /** 节点角色列表 */
  nodeRoleList: any[];
  /** 优先级 */
  priorityLevel?: number;
  /** 条件模式 */
  conditionMode?: number;
  /** 条件列表 */
  conditionList?: ConditionConfig[];
  /** 设置类型 */
  setType?: number;
  /** 节点用户列表 */
  nodeUserList?: UserInfo[];
  /** 审批级别 */
  examineLevel?: number;
  /** 主管级别 */
  directorLevel?: number;
  /** 选择模式 */
  selectMode?: number;
  /** 是否自动终止 */
  termAuto?: boolean;
  /** 期限 */
  term?: number;
  /** 期限模式 */
  termMode?: number;
  /** 审批模式 */
  examineMode?: number;
  /** 主管模式 */
  directorMode?: number;
  /** 用户选择标志 */
  userSelectFlag?: boolean;
  /** 子节点 */
  childNode?: WorkflowNode;
  /** 条件节点列表 */
  conditionNodes?: WorkflowNode[];
}

/**
 * 工作流数据接口
 * @author CH
 * @version 1.0.0
 */
interface WorkflowData {
  /** 工作流ID */
  id: number;
  /** 工作流名称 */
  name: string;
  /** 节点配置 */
  nodeConfig: WorkflowNode;
}

/**
 * 工作流数据
 * @author CH
 * @version 1.0.0
 */
const data = reactive<WorkflowData>({
  id: 1,
  name: "请假审批",
  nodeConfig: {
    nodeName: "发起人",
    type: 0,
    nodeRoleList: [],
    childNode: {
      nodeName: "条件路由",
      type: 4,
      nodeRoleList: [],
      conditionNodes: [
        {
          nodeName: "长期",
          type: 3,
          priorityLevel: 1,
          conditionMode: 1,
          nodeRoleList: [],
          conditionList: [
            {
              label: "请假天数",
              field: "day",
              operator: ">",
              value: "7",
            },
          ],
          childNode: {
            nodeName: "领导审批",
            type: 1,
            setType: 1,
            nodeUserList: [
              {
                id: "360000197302144442",
                name: "何敏",
              },
            ],
            nodeRoleList: [],
            examineLevel: 1,
            directorLevel: 1,
            selectMode: 1,
            termAuto: false,
            term: 0,
            termMode: 1,
            examineMode: 1,
            directorMode: 0,
          },
        },
        {
          nodeName: "短期",
          type: 3,
          priorityLevel: 2,
          conditionMode: 1,
          nodeRoleList: [],
          conditionList: [],
          childNode: {
            nodeName: "直接主管审批",
            type: 1,
            setType: 2,
            nodeUserList: [],
            nodeRoleList: [],
            examineLevel: 1,
            directorLevel: 1,
            selectMode: 1,
            termAuto: false,
            term: 0,
            termMode: 1,
            examineMode: 1,
            directorMode: 0,
          },
        },
      ],
      childNode: {
        nodeName: "抄送人",
        type: 2,
        userSelectFlag: true,
        nodeRoleList: [],
        nodeUserList: [
          {
            id: "220000200908305857",
            name: "何秀英",
          },
        ],
      },
    },
  },
});

/**
 * 导出JSON数据
 * @author CH
 * @version 1.0.0
 */
const exportJson = (): void => {
  ElMessage("返回值请查看F12控制台console.log()");
  console.log(data);
};
</script>

<style scoped lang="scss">
.workflow-example {
  padding: 20px;
}

.code-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.do {
  display: flex;
  gap: 8px;
}
</style>
