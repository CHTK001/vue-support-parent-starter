<template>
  <div>
    <!-- 布局 -->
    <a-layout class="file-layout">
      <!-- 目录树 -->
      <a-layout-sider theme="light" class="sider" width="25%">
        <div class="dir-container">
          <template v-if="temp.projectList && temp.cacheData">
            <a-form layout="inline" autocomplete="off">
              <a-form-item :label="$t('i18n_3bf3c0a8d6')">
                <a-select
                  :value="`${temp.cacheData.useNodeId},${temp.cacheData.useProjectId}`"
                  style="width: 200px"
                  :placeholder="$t('i18n_f8a613d247')"
                  @change="nodeChange"
                >
                  <a-select-option v-for="item in temp.projectList" :key="`${item.nodeId},${item.projectId}`">
                    {{ nodeName[item.nodeId] && nodeName[item.nodeId].name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-form>
          </template>
          <!-- <a-button size="small" type="primary" @click="loadFileData">刷新目录</a-button> -->
        </div>

        <a-directory-tree
          v-model:expandedKeys="expandedKeys"
          v-model:selectedKeys="selectedKeys"
          :field-names="treeReplaceFields"
          :load-data="onTreeData"
          :tree-data="treeList"
          @select="nodeClick"
        >
        </a-directory-tree>
      </a-layout-sider>
      <!-- 表格 -->
      <a-layout-content class="file-content">
        <div v-if="temp.cacheData" class="log-filter">
          <a-space direction="vertical" style="width: 100%">
            <!-- direction="vertical" -->
            <a-form layout="inline" autocomplete="off">
              <a-space direction="vertical" style="width: 100%">
                <a-space>
                  <a-form-item :label="$t('i18n_5349f417e9')">
                    <!-- 关键词： -->
                    <!-- ^.*\d+.*$ -->
                    <!-- .*(0999996|0999995).*   .*(a|b).* -->
                    <a-tooltip placement="right" :title="$t('i18n_e5ae5b36db')">
                      <a-input
                        v-model:value="temp.cacheData.keyword"
                        :placeholder="$t('i18n_2d05c9d012')"
                        :style="`width: 250px`"
                        @press-enter="sendSearchLog"
                      >
                      </a-input>
                    </a-tooltip>
                  </a-form-item>
                  <a-form-item :label="$t('i18n_a20341341b')">
                    <a-input-number
                      id="inputNumber"
                      v-model:value="temp.cacheData.beforeCount"
                      :min="0"
                      :max="1000"
                      @press-enter="sendSearchLog"
                    />
                  </a-form-item>
                  <a-form-item :label="$t('i18n_10d6dfd112')">
                    <a-input-number
                      id="inputNumber"
                      v-model:value="temp.cacheData.afterCount"
                      :min="0"
                      :max="1000"
                      @press-enter="sendSearchLog"
                    />
                  </a-form-item>
                  <a-popover :title="$t('i18n_108d492247')">
                    <template #content>
                      <ul>
                        <li><b>^.*\d+.*$</b> - {{ $t('i18n_66c15f2815') }}</li>
                        <li><b>.*(a|b).*</b> - {{ $t('i18n_a1638e78e8') }}</li>
                        <li>
                          <b>.*({{ $t('i18n_c195df6308') }}).*</b> -
                          {{ $t('i18n_346008472d') }}
                        </li>
                      </ul>
                    </template>
                    <a-button type="link" style="padding: 0"
                      ><UnorderedListOutlined /><span style="margin-left: 2px">{{
                        $t('i18n_be5b6463cf')
                      }}</span></a-button
                    >
                  </a-popover>
                </a-space>
                <a-space>
                  <a-form-item :label="$t('i18n_ff9dffec4d')">
                    <!--  -->
                    <a-tooltip placement="right" :title="$t('i18n_a9463d0f1a')">
                      <a-select
                        :style="`width: 250px`"
                        :value="temp.cacheData.first"
                        @change="
                          (value) => {
                            const cacheData = { ...temp.cacheData, first: value }
                            temp = { ...temp, cacheData: cacheData }
                            sendSearchLog()
                          }
                        "
                      >
                        <a-select-option value="false">{{ $t('i18n_518df98392') }}</a-select-option>
                        <a-select-option value="true">{{ $t('i18n_9914219dd1') }} </a-select-option>
                      </a-select>
                    </a-tooltip>
                  </a-form-item>
                  <a-form-item :label="$t('i18n_d82ab35b27')">
                    <a-input-number
                      id="inputNumber"
                      v-model:value="temp.cacheData.head"
                      :min="0"
                      :max="1000"
                      @press-enter="sendSearchLog"
                    />
                  </a-form-item>
                  <a-form-item :label="$t('i18n_10145884ba')">
                    <a-input-number
                      id="inputNumber"
                      v-model:value="temp.cacheData.tail"
                      :min="0"
                      :max="1000"
                      @press-enter="sendSearchLog"
                    />
                  </a-form-item>
                  <a-popover :title="$t('i18n_257dc29ef7')">
                    <template #content>
                      <ul>
                        <li>
                          <b>{{ $t('i18n_625aa478e2') }}</b> -
                          {{ $t('i18n_cb25f04b46') }}
                        </li>
                        <li>
                          <b>{{ $t('i18n_704f33fc74') }}</b> -
                          {{ $t('i18n_7d3f2fd640') }}
                        </li>
                        <li>
                          <b>{{ $t('i18n_5d414afd86') }}</b> -
                          {{ $t('i18n_4effdeb1ff') }}
                        </li>
                        <li>
                          <b>{{ $t('i18n_8ea4c3f537') }}</b> -
                          {{ $t('i18n_9b0bc05511') }}
                        </li>
                        <li>
                          <b>{{ $t('i18n_758edf4666') }}</b> -
                          {{ $t('i18n_3f2d5bd6cc') }}
                        </li>
                        <li>
                          <b>{{ $t('i18n_6e2d78a20e') }}</b> -
                          {{ $t('i18n_59d20801e9') }}
                        </li>
                        <li>
                          <b>{{ $t('i18n_abba4043d8') }}</b> -
                          {{ $t('i18n_4bbc09fc55') }}
                        </li>
                      </ul>
                    </template>
                    <a-button type="link" style="padding: 0"
                      ><UnorderedListOutlined /><span style="margin-left: 2px">{{
                        $t('i18n_62170d5b0a')
                      }}</span></a-button
                    >
                  </a-popover>
                </a-space></a-space
              >
            </a-form>
          </a-space>
        </div>

        <a-tabs v-if="temp.cacheData" v-model:activeKey="activeTagKey" :tab-bar-style="{ marginBottom: 0 }">
          <template v-for="item in temp.projectList">
            <a-tab-pane v-if="nodeName[item.nodeId]" :key="`${item.nodeId},${item.projectId}`" force-render>
              <template #tab>
                【{{ nodeName[item.nodeId] && nodeName[item.nodeId].name }}】
                {{
                  nodeProjectList[item.nodeId] &&
                  nodeProjectList[item.nodeId].projects &&
                  nodeProjectList[item.nodeId].projects.filter((item1) => item1.projectId === item.projectId)[0].name
                }}
              </template>
              <viewPre
                :id="`pre-dom-${item.nodeId},${item.projectId}`"
                :ref="`pre-dom-${item.nodeId},${item.projectId}`"
                height="calc(100vh - 80px - 85px - 43px)"
                :config="{
                  logScroll: true,
                  logShowLine: 5000,
                  searchValue: ''
                }"
              ></viewPre>
            </a-tab-pane>
          </template>
        </a-tabs>
      </a-layout-content>
    </a-layout>
  </div>
</template>
<script>
import { getNodeListAll, getProjectListAll } from '@/api/node'
import { getFileList } from '@/api/node-project'
import { itemGroupBy } from '@/utils/const'
import { getWebSocketUrl } from '@/api/config'

import viewPre from '@/components/logView/view-pre.vue'
import { updateCache } from '@/api/log-read'

export default {
  components: {
    viewPre
  },
  props: {
    data: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  emits: ['changeTitle'],
  data() {
    return {
      treeReplaceFields: {
        title: 'filename',
        isLeaf: 'isDirectory',
        key: 'key'
      },
      tempNode: {},
      tempFileNode: {},
      treeList: [],
      activeTagKey: '',

      nodeProjectList: {},
      nodeList: [],
      nodeName: {},
      temp: {},
      socketCache: {},
      expandedKeys: [],
      selectedKeys: []
    }
  },
  computed: {
    
    
    selectPath() {
      if (!Object.keys(this.tempNode).length) {
        return ''
      }
      if (this.tempNode.level === 1) {
        return ''
      } else {
        return (this.tempNode.levelName || '') + '/' + this.tempNode.filename
      }
    },
    selectFilePath() {
      if (!Object.keys(this.tempFileNode).length) {
        return ''
      }
      if (this.tempFileNode.level === 1) {
        return ''
      } else {
        return (this.tempFileNode.levelName || '') + '/' + this.tempFileNode.filename
      }
    }
  },
  created() {
    this.temp = { ...this.data }

    const cacheData = this.temp.cacheData
    cacheData.useProjectId = this.temp.projectList[0].projectId
    cacheData.useNodeId = this.temp.projectList[0].nodeId
    cacheData.beforeCount = cacheData.beforeCount || 0
    cacheData.afterCount = cacheData.afterCount || 10
    cacheData.head = cacheData.head || 0
    cacheData.tail = cacheData.tail || 100
    cacheData.first = cacheData.first === undefined ? 'false' : cacheData.first + ''
    this.temp = { ...this.temp, cacheData: cacheData }
    this.loadNodeList().then(() => {
      this.loadFileData()
      //   console.log(this.nodeProjectList);
      this.temp.projectList.forEach((item) => {
        const itemProjectData = this.nodeProjectList[item.nodeId]?.projects?.filter((projectData) => {
          return item.projectId === projectData.projectId
        })[0]
        const socketUrl = getWebSocketUrl(
          '/socket/console',
          `id=${itemProjectData?.id}&nodeId=${
            item.nodeId
          }&type=console`
        )
        const domId = `pre-dom-${item.nodeId},${item.projectId}`
        this.socketCache = { ...this.socketCache, [domId]: {} }
        const socket = this.initWebSocket(domId, socketUrl, item)

        this.socketCache = {
          ...this.socketCache,
          [domId]: {
            socket: socket,
            projectId: item.projectId,
            nodeId: item.nodeId
          }
        }

        // 连接成功后
        socket.onopen = () => {
          if (cacheData.logFile) {
            // 之前已经打开的
            this.sendMsg(domId, 'showlog', this.temp.cacheData)
          }
        }
      })
      //
    })
    this.activeTagKey = this.temp.cacheData.useNodeId + ',' + this.temp.cacheData.useProjectId
    // console.log(cacheData);
    // 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
    window.onbeforeunload = () => {
      this.close()
    }
  },
  beforeUnmount() {
    this.close()
  },
  methods: {
    close() {
      Object.keys(this.socketCache).forEach((item) => {
        clearInterval(this.socketCache[item].heart)
        this.socketCache[item].socket?.close()
      })
    },
    initWebSocket(id, url, item) {
      const socket = new WebSocket(url)

      socket.onerror = (err) => {
        console.error(err)
        $notification.error({
          key: 'log-read-error',
          message: `web socket ${this.$t('i18n_7030ff6470')},${this.$t('i18n_226a6f9cdd')}`
        })
        clearInterval(this.socketCache[id].heart)
      }
      socket.onclose = (err) => {
        //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
        console.error(err)
        $notification.info({
          key: 'log-read-close',
          message:
            ((this.nodeName[item.nodeId] && this.nodeName[item.nodeId].name) || '') +
            ` ${this.$t('i18n_ab3725d06b')}[tail-log]`
        })
        clearInterval(this.socketCache[id].heart)
      }
      socket.onmessage = (msg) => {
        //console.log(msg);
        this.$refs[id][0].appendLine(msg.data)

        clearInterval(this.socketCache[id].heart)
        // 创建心跳，防止掉线
        this.socketCache[id].heart = setInterval(() => {
          this.sendMsg(id, 'heart')
          // this.loadFileSize();
        }, 5000)
      }

      return socket
    },
    // 发送消息
    sendMsg(id, op, other) {
      const cacheData = this.socketCache[id]
      //   console.log(cacheData, id);
      const data = {
        op: op,
        projectId: cacheData.projectId,
        search: true
      }
      cacheData.socket.send(JSON.stringify(Object.assign({}, data, other)))
    },
    // appendLine(id, data) {},
    // 加载节点以及项目
    loadNodeList() {
      return new Promise((resolve) => {
        this.loadNodeList2().then(() => {
          this.getProjectListAll().then(() => {
            resolve()
          })
        })
      })
    },
    // 加载节点以及项目
    loadNodeList2() {
      return new Promise((resolve) => {
        getNodeListAll().then((res) => {
          if (res.code === 200) {
            this.nodeList = res.data
            this.nodeName = res.data.groupBy((item) => item.id)
            resolve()
          }
        })
      })
    },
    // 加载用户列表
    getProjectListAll() {
      return new Promise((resolve) => {
        getProjectListAll().then((res) => {
          if (res.code === 200) {
            this.nodeProjectList = itemGroupBy(res.data, 'nodeId', 'id', 'projects').groupBy((item) => item.id)
            resolve()
            // console.log(this.nodeList);
            // console.log(this.nodeProjectList);
          }
        })
      })
    },
    nodeChange(value) {
      const keyArray = value.split(',')

      const cacheData = {
        ...this.temp.cacheData,
        useNodeId: keyArray[0],
        useProjectId: keyArray[1]
      }
      this.temp = { ...this.temp, cacheData: cacheData }
      this.loadFileData()
      //
      this.activeTagKey = value
    },
    // 点击树节点
    nodeClick(selectedKeys, { node }) {
      if (node.dataRef.isDirectory) {
        this.tempNode = node.dataRef
        //this.loadFileList();
      } else {
        if (node.dataRef.textFileEdit) {
          this.tempFileNode = node.dataRef
          // let cacheData = ;
          const cacheData = {
            ...this.temp.cacheData,
            logFile: this.selectFilePath
          }
          this.temp = { ...this.temp, cacheData: cacheData }
          this.$emit('changeTitle', this.selectFilePath)
          //
          this.sendSearchLog()
        } else {
          //
          $message.error(this.$t('i18n_765d09eea5'))
        }
      }
    },
    onTreeData(treeNode) {
      return new Promise((resolve) => {
        if (treeNode.dataRef.children || !treeNode.dataRef.isDirectory) {
          resolve()
          return
        }
        this.loadNode(treeNode.dataRef, resolve)
      })
    },
    // 加载数据
    loadFileData() {
      const key = 'root-' + new Date().getTime()
      const temp = this.temp
      const projectName = this.nodeProjectList[temp.cacheData.useNodeId]?.projects?.filter(
        (item) => item.projectId === temp.cacheData.useProjectId
      )[0].name
      this.treeList = [
        {
          filename: projectName,
          level: 1,
          isDirectory: true,
          key: key,
          isLeaf: false
        }
      ]

      // 设置默认展开第一个
      setTimeout(() => {
        this.tempNode = this.treeList[0]
        //this.expandKeys = [key];
        //this.loadFileList();
      }, 1000)
    },
    // 加载子节点
    loadNode(data, resolve) {
      this.tempNode = data
      if (data.children) {
        resolve()
        return
      }
      // 如果是目录
      if (data.isDirectory) {
        // 请求参数
        const cacheData = this.temp.cacheData

        const params = {
          nodeId: cacheData.useNodeId,
          id: cacheData.useProjectId,
          path: this.selectPath
        }

        // 加载文件
        getFileList(params).then((res) => {
          if (res.code === 200) {
            data.children = res.data.map((ele) => {
              ele.isLeaf = !ele.isDirectory
              ele.key = ele.filename + '-' + new Date().getTime()
              //ele.disabled = ele.textFileEdit;

              return ele
            })

            this.treeList = [...this.treeList]

            resolve()
          } else {
            resolve()
          }
        })
      } else {
        resolve()
      }
    },
    sendSearchLog() {
      if (this.temp?.cacheData?.logFile) {
        // 先更新缓存再请求搜索，避免长loading
        updateCache(Object.assign({}, this.temp.cacheData, { id: this.temp.id })).then(() => {
          Object.keys(this.socketCache).forEach((item) => {
            this.$refs[item][0].clearLogCache()
            this.sendMsg(item, 'showlog', this.temp.cacheData)
          })
        })
      }
      //
    }
  }
}
</script>
<style scoped>
.sider {
  border: 1px solid #e2e2e2;
  height: calc(100vh - 80px);
  overflow-y: auto;
}
.dir-container {
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.file-content {
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 0 10px;
  /* background-color: #fff; */
}
.log-filter {
  padding: 0 10px 10px;
  line-height: 0;
  border-bottom: 1px solid #eee;
}
</style>
