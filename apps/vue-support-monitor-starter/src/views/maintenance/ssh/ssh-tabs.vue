<template>
  <a-layout style="padding: 5px 0">
    <a-layout-sider
      theme="light"
      width="200"
      :style="{
        height: `calc(100vh - 10px)`,
        borderRight: '1px solid #e8e8e8',
        overflowX: 'scroll'
      }"
    >
      <!-- 搜索框 -->
      <div style="padding: 8px; border-bottom: 1px solid #e8e8e8">
        <a-input
          v-model:value="searchKeyword"
          placeholder="搜索SSH服务器"
          allow-clear
          @input="onSearchInput"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>
      </div>

      <div style="height: calc(100% - 50px); overflow-y: auto">
        <a-directory-tree
          v-if="filteredTreeList.length"
          v-model:expandedKeys="expandedKeys"
          v-model:selectedKeys="selectedKeys"
          multiple
          default-expand-all
          :tree-data="filteredTreeList"
          :field-names="replaceFields"
          @select="select"
        />
        <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" />
      </div>
    </a-layout-sider>
    <a-layout-content :style="{ padding: '0 5px', height: `calc(100vh - 10px)` }">
      <a-tabs v-if="selectPanes.length" v-model:activeKey="activeKey" type="editable-card" hide-add @edit="onEdit" @change="change">
        <template #rightExtra>
          <a-button type="primary" :disabled="!activeKey" @click="changeFileVisible(activeKey, true)">
            {{ $t("i18n_8780e6b3d1") }}
          </a-button>
        </template>
        <a-tab-pane v-for="pane in selectPanes" :key="pane.id" :ref="`pene-${pane.id}`" :tab="pane.name" :closable="true">
          <div :id="`paneDom${pane.id}`">
            <div v-if="pane.open" :style="{ height: `calc(100vh - 70px) ` }">
              <terminal1 :ssh-id="pane.id" />
            </div>
            <a-result v-else status="warning" :title="$t('i18n_3a71e860a7')">
              <template #extra>
                <a-button type="primary" @click="open(pane.id)">{{ $t("i18n_81301b6813") }}</a-button>
              </template>
            </a-result>
            <!-- 文件管理 -->
            <CustomDrawer
              v-if="pane.openFile"
              :get-container="`#paneDom${pane.id}`"
              :title="`${pane.name}${$t('i18n_8780e6b3d1')}`"
              placement="right"
              width="90vw"
              :open="pane.fileVisible"
              @close="changeFileVisible(pane.id, false)"
            >
              <ssh-file v-if="pane.openFile" :ssh-id="pane.id" />
            </CustomDrawer>
          </div>
        </a-tab-pane>
      </a-tabs>
      <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" :description="$t('i18n_c23fbf156b')" />
    </a-layout-content>
  </a-layout>
</template>
<script>
import { getSshListTree } from "@/api/ssh";
import terminal1 from "./terminal.vue";
import SshFile from "@/views/maintenance/ssh/ssh-file.vue";
import { Empty } from "ant-design-vue";
import { SearchOutlined } from "@ant-design/icons-vue";
export default {
  components: {
    terminal1,
    SshFile,
    SearchOutlined
  },
  data() {
    return {
      Empty,
      activeKey: "",
      selectPanes: [],
      treeList: [],
      searchKeyword: "",
      filteredTreeList: [],
      replaceFields: {
        children: "children",
        title: "name",
        key: "id"
      },
      expandedKeys: [],
      selectedKeys: []
    };
  },
  computed: {},
  created() {
    this.listData();
  },
  methods: {
    findItemById(list, id) {
      // 每次进来使用find遍历一次
      let res = list.find(item => item.id == id);

      if (res) {
        return res;
      } else {
        for (let i = 0; i < list.length; i++) {
          if (list[i].children instanceof Array && list[i].children.length > 0) {
            res = this.findItemById(list[i].children, id);

            if (res) return res;
          }
        }
        return null;
      }
    },
    // 查询树
    listData() {
      getSshListTree().then(res => {
        if (res.code == 200 && res.data) {
          this.treeList = res.data.children || [];
          this.filteredTreeList = [...this.treeList];
          try {
            const cache = JSON.parse(localStorage.getItem("ssh-tabs-cache") || "{}");
            const cacheIds = (cache.selectPanes || []).map(item => item.id);
            this.selectPanes =
              cacheIds
                .map(item => {
                  return this.findItemById(this.treeList, item);
                })
                .filter(item => item)
                .map(item => {
                  // 默认关闭
                  item.open = false;
                  return item;
                }) || [];

            const activeKey = this.selectPanes.find(item => item.id === cache.activeKey);
            if (activeKey) {
              this.activeKey = activeKey.id;
            } else if (this.selectPanes.length) {
              this.activeKey = this.selectPanes[0].id;
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
    },
    // 编辑 tabs
    onEdit(targetKey, action) {
      if (action === "remove") {
        this.selectPanes = this.selectPanes.filter(pane => pane.id !== targetKey);
        if (this.activeKey === targetKey) {
          this.activeKey = this.selectPanes[0] && this.selectPanes[0].id;
        }
        this.cache();
      }
    },
    // 切换
    change() {
      this.cache();
    },
    open(activeKey) {
      this.selectPanes = this.selectPanes.map(item => {
        if (item.id === activeKey) {
          item.open = true;
        }
        return item;
      });
    },
    select(selectedKeys, { node }) {
      if (!node.dataRef.isLeaf) {
        return;
      }
      const findPane = this.selectPanes.find(item => item.id === node.dataRef.id);
      if (findPane) {
        this.activeKey = findPane.id;
      } else {
        const data = { ...node.dataRef, open: true };
        this.selectPanes.push(data);
        this.activeKey = node.dataRef.id;
      }
      this.cache();
    },
    cache() {
      localStorage.setItem(
        "ssh-tabs-cache",
        JSON.stringify({
          activeKey: this.activeKey,
          selectPanes: this.selectPanes
        })
      );
    },
    // 文件管理状态切换
    changeFileVisible(activeKey, value) {
      this.selectPanes = this.selectPanes.map(item => {
        if (item.id === activeKey) {
          item.fileVisible = value;
          if (value && !item.openFile) {
            item.openFile = true;
          }
        }
        return item;
      });
    },
    // 搜索输入处理
    onSearchInput() {
      this.filterTreeData();
    },
    // 过滤树数据
    filterTreeData() {
      if (!this.searchKeyword.trim()) {
        this.filteredTreeList = [...this.treeList];
        return;
      }

      const keyword = this.searchKeyword.toLowerCase();
      this.filteredTreeList = this.filterTreeNodes(this.treeList, keyword);
    },
    // 递归过滤树节点
    filterTreeNodes(nodes, keyword) {
      const filtered = [];

      for (const node of nodes) {
        const nodeMatches = node.name && node.name.toLowerCase().includes(keyword);
        let filteredChildren = [];

        if (node.children && node.children.length > 0) {
          filteredChildren = this.filterTreeNodes(node.children, keyword);
        }

        // 如果节点本身匹配或有匹配的子节点，则包含此节点
        if (nodeMatches || filteredChildren.length > 0) {
          const filteredNode = { ...node };
          if (filteredChildren.length > 0) {
            filteredNode.children = filteredChildren;
          }
          filtered.push(filteredNode);
        }
      }

      return filtered;
    }
  }
};
</script>
