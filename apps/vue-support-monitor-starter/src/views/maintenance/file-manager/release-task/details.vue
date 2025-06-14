<template>
  <div>
    <a-form :model="temp" :label-col="{ span: 2 }" :wrapper-col="{ span: 20 }">
      <a-form-item :label="$t('i18n_ce23a42b47')" name="name">
        <a-input :placeholder="$t('i18n_5f4c724e61')" :disabled="true" :value="temp.taskData && temp.taskData.name" />
      </a-form-item>

      <a-form-item :label="$t('i18n_f98994f7ec')" name="taskType">
        <a-radio-group :value="temp.taskData && temp.taskData.taskType" :disabled="true">
          <a-radio :value="0"> SSH </a-radio>
          <a-radio :value="1"> {{ $t('i18n_3bf3c0a8d6') }} </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item name="releasePath" :label="$t('i18n_dbb2df00cf')">
        <a-input
          :placeholder="$t('i18n_5f4c724e61')"
          :disabled="true"
          :value="temp.taskData && temp.taskData.releasePath"
        />
      </a-form-item>
      <a-form-item name="releasePath" :label="$t('i18n_3fea7ca76c')" :help="temp.taskData && temp.taskData.statusMsg">
        {{ statusMap[temp.taskData && temp.taskData.status] || $t('i18n_1622dc9b6b') }}
      </a-form-item>

      <a-form-item :label="$t('i18n_c84ddfe8a6')">
        <a-tabs :active-key="activeKey" @change="tabCallback">
          <a-tab-pane v-for="item in temp.taskList" :key="item.id">
            <template #tab>
              <LoadingOutlined v-if="!logMap[item.id] || logMap[item.id].run" type="loading" />
              <template v-if="temp.taskData && temp.taskData.taskType === 0">
                {{
                  sshList.filter((item2) => {
                    return item2.id === item.taskDataId
                  })[0] &&
                  sshList.filter((item2) => {
                    return item2.id === item.taskDataId
                  })[0].name
                }}
              </template>
              <template v-else-if="temp.taskData && temp.taskData.taskType === 1">
                {{
                  nodeList.filter((item2) => {
                    return item2.id === item.taskDataId
                  })[0] &&
                  nodeList.filter((item2) => {
                    return item2.id === item.taskDataId
                  })[0].name
                }}
              </template>
              <a-tooltip v-if="item.statusMsg" :title="item.statusMsg"><InfoCircleOutlined /></a-tooltip>
            </template>
            <log-view1 :ref="`logView-${item.id}`" height="60vh" />
          </a-tab-pane>
        </a-tabs>
      </a-form-item>
      <a-form-item :label="$t('i18n_cfb00269fd')" name="releaseBeforeCommand">
        <a-tabs tab-position="right">
          <a-tab-pane key="before" :tab="$t('i18n_d0c879f900')">
            <code-editor
              height="40vh"
              :content="temp.taskData && temp.taskData.beforeScript"
              :options="{
                mode: 'shell',
                readOnly: true
              }"
            ></code-editor>
          </a-tab-pane>
          <a-tab-pane key="after" :tab="$t('i18n_9b1c5264a0')">
            <code-editor
              height="40vh"
              :content="temp.taskData && temp.taskData.afterScript"
              :options="{
                mode: 'shell',
                readOnly: true
              }"
            ></code-editor>
          </a-tab-pane>
        </a-tabs>
      </a-form-item>
    </a-form>
  </div>
</template>
<script>
import { taskDetails, statusMap, taskLogInfoList } from '@/api/file-manager/release-task-log'
import LogView1 from '@/components/logView/index2.vue'
import codeEditor from '@/components/codeEditor/index.vue'
import { getSshListAll } from '@/api/ssh'
import { getNodeListAll } from '@/api/node'

export default {
  components: {
    LogView1,
    codeEditor
  },
  props: {
    taskId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      statusMap,
      logList: [],
      activeKey: '',
      logTimerMap: {},
      logMap: {},
      temp: {},
      sshList: [],
      nodeList: []
    }
  },
  beforeUnmount() {
    if (this.logTimerMap) {
      this.temp.taskList?.forEach((item) => {
        clearInterval(this.logTimerMap[item.id])
      })
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    // 加载日志内容
    loadData() {
      this.activeKey = this.temp.id || ''
      taskDetails({
        id: this.taskId
      }).then((res) => {
        if (res.code === 200) {
          this.temp = res.data
          if (this.temp.taskData?.taskType === 0) {
            this.loadSshList()
          } else if (this.temp.taskData?.taskType === 1) {
            this.loadNodeList()
          }

          if (!this.activeKey) {
            this.activeKey = this.temp.taskList && this.temp.taskList[0].id
          }
          this.tabCallback(this.activeKey)
        }
      })
    },
    // 加载 SSH 列表
    loadSshList() {
      return new Promise((resolve) => {
        this.sshList = []
        getSshListAll().then((res) => {
          if (res.code === 200) {
            this.sshList = res.data
            resolve()
          }
        })
      })
    },
    // 加载节点
    loadNodeList() {
      getNodeListAll().then((res) => {
        if (res.code === 200) {
          this.nodeList = res.data
        }
      })
    },
    initItemTimer(item) {
      if (!item) {
        return
      }
      // 加载构建日志
      this.logMap[item.id] = {
        line: 1,
        run: true
      }
      this.pullLog(item)
      this.logTimerMap[item.id] = setInterval(() => {
        this.pullLog(item)
      }, 2000)
    },
    pullLog(item) {
      const params = {
        id: item.id,
        line: this.logMap[item.id].line,
        tryCount: 0
      }

      taskLogInfoList(params).then((res) => {
        if (res.code === 200) {
          if (!res.data) {
            $notification.warning({
              message: res.msg
            })
            if (res.data.status !== 0) {
              // 还未开始的不计算次数
              this.logMap[item.id].tryCount = this.logMap[item.id].tryCount + 1
              if (this.logMap[item.id].tryCount > 10) {
                clearInterval(this.logTimerMap[item.id])
              }
            }
            return false
          }
          // 停止请求
          if (!res.data.run) {
            clearInterval(this.logTimerMap[item.id])
          }
          this.logMap[item.id].run = res.data.run
          // 更新日志

          this.$refs[`logView-${item.id}`][0]?.appendLine(res.data.dataLines)

          this.logMap[item.id].line = res.data.line

          this.logMap = { ...this.logMap }
        }
      })
    },
    tabCallback(key) {
      if (!key) {
        return
      }
      this.activeKey = key
      // console.log(this.$refs);
      if (this.logTimerMap[key]) {
        return
      }
      this.$nextTick(() => {
        const data = this.temp.taskList?.filter((item1) => {
          return item1.id === key
        })[0]
        this.initItemTimer(data)
      })
    }
  }
}
</script>
