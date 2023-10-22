<template>
    <el-container style="background-color: #ccc; position: relative;">
      <el-header>
          <div class="left-panel">
              <el-button type="primary" icon="el-icon-refresh" @click="afterPropertiesSet"></el-button>
          </div>
          <div class="right-panel">
              
          </div>
      </el-header>
      <el-main class="nopadding">
          <div ref="table"  :style="{ 'height': _table_height, 'background' : 'rgb(226 232 240 / 30%)' }">
            <el-row :gutter="15">
                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in list" :key="item.taskId"
                    class="demo-progress">
                    <el-card class="task task-item" shadow="hover">
                        <h2>{{ item.taskName }} <el-tag>{{ item.createName }}</el-tag></h2>
                        <el-row>
                            <el-col :span="16">
                                <ul>
                                    <li>
                                        <h4>任务类型</h4>
                                        <p>{{ item.taskType }}</p>
                                    </li>
                                    <li>
                                        <h4>任务编号</h4>
                                        <p>{{ item.taskTid }} </p>
                                    </li>
                                </ul>
                            </el-col>
                            <el-col :span="8" class="progress">
                                <el-progress :stroke-width="10" :striped="true" :striped-flow="true"
                                    :indeterminate="true" :color="customColor" type="circle"
                                    :percentage="Math.min(((item.taskCurrent / item.taskTotal) * 100).toFixed(2), 100)">
                                    <template #default="{ percentage }">
                                        <span class="percentage-value">{{ percentage }}%</span>
                                        <span class="percentage-label" v-if="item.taskStatus == 3">正在运行</span>
                                        <span class="percentage-label" v-if="item.taskStatus == 2">已暂停</span>
                                        <span class="percentage-label" v-if="item.taskStatus == 1">已完成</span>
                                        <span class="percentage-label" v-if="item.taskStatus == 0">未开始</span>
                                    </template>
                                </el-progress>
                            </el-col>
                        </el-row>
                        <div class="bottom" v-role="['ADMIN', 'OPS']">
                            <div class="state">
                                <div v-if="item.taskStatus == 3">
                                    <el-tag size="small">正在运行 </el-tag>({{ item.taskCurrent }} / {{ item.taskTotal }})
                                </div>
                                <div v-if="item.taskStatus == 2">
                                    <el-tag size="small" type="info">已暂停</el-tag>({{ item.taskCurrent }} /
                                    {{ item.taskTotal }})
                                </div>
                                <div v-if="item.taskStatus == 1">
                                    <el-tag  size="small" type="success">已完成</el-tag>
                                    <el-tag  size="small" >{{ item.taskCost }} ms</el-tag>
                                </div>
                                <div v-if="item.taskStatus == 0">
                                    <el-tag size="small" type="info">未开始</el-tag>({{ item.taskCurrent }} /
                                    {{ item.taskTotal }})
                                </div>
                            </div>
                            <div class="handler">
                                <el-popconfirm title="确定立即执行吗？" v-if="item.taskStatus == 2 || item.taskStatus == 0"
                                    @confirm="run(item)">
                                    <template #reference="scope">
                                        <el-button v-if="item.taskStatus == 2 || item.taskStatus == 0" type="primary"
                                            icon="el-icon-caret-right" circle></el-button>
                                    </template>
                                </el-popconfirm>
                                <el-popconfirm title="确定立即暂停吗？" v-if="item.taskStatus == 3" @confirm="onPause(item)">
                                    <template #reference="scope">
                                        <el-button v-if="item.taskStatus == 3" type="primary" icon="el-icon-loading"
                                            circle></el-button>
                                    </template>
                                </el-popconfirm>
                                <el-dropdown trigger="click">
                                    <el-button type="primary" icon="el-icon-more" circle plain></el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item v-if="item.taskStatus != 3 || item.taskStatus != 1"
                                                @click="edit(item)">编辑</el-dropdown-item>
                                            <el-dropdown-item @click="logs(item)">日志</el-dropdown-item>
                                            <el-dropdown-item @click="del(item)" divided>删除</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                    <el-card class="task task-add" shadow="never" @click="doSave">
                        <el-icon><el-icon-plus /></el-icon>
                        <p>添加计划任务</p>
                    </el-card>
                </el-col>
            </el-row>
          </div>
          <el-pagination style="bottom: 10px; left: 4px" class="absolute" :page-size="form.pageSize"  background layout="total, sizes, prev, pager, next" :small="true" @current-change="paginationChange" @update:page-size="pageSizeChange"  :total="returnTotal" ></el-pagination>
      </el-main>
  </el-container>

  <save-dialog ref="saveDialog" v-if="saveDialogStatus"/>
</template>
<script>
import SaveDialog from './save.vue'
export default {
  components: {
      SaveDialog
  },
  data(){
      return {
          saveDialogStatus: false,
          deleteStatus: false,
          form: {
              page: 1,
              pageSize: 10,
          },
          height: '100%',
          lineNum: 6,
          returnData: [],
          returnTotal: 0,
          apiObj: this.$API.device.cloud.platform.page
      }
  },
  computed: {
      _height() {
          return Number(this.height) ? Number(this.height) + 'px' : this.height
      },
      _table_height() {
          return "calc(100% - 50px)"
      }
  },
  mounted() {
      this.afterPropertiesSet();
  },

  methods: {
      //分页点击
      paginationChange(page) {
          this.form.page = page;
          this.afterPropertiesSet();
      },
      //条数变化
      pageSizeChange(size) {
          this.form.pageSize = size;
          this.afterPropertiesSet();
      },
      doSave() {
          this.saveDialogStatus = true;
          this.$nextTick(() => {
              this.$refs.saveDialog.open('add').setData({});
          });
      },
      doDelete(item) {
          this.$API.device.manufacturer.delete.delete({id: item.devicePlatformId}).then(res => {
              if(res.code != '00000') {
                  this.$message.error(res.msg);
                  return;
              }
              this.returnData = this.returnData.filter(it => it.devicePlatformId != item.devicePlatformId);
              this.returnTotal = this.returnData.length;
          })
      },
      doEdit(item) {
          this.saveDialogStatus = true;
          this.$nextTick(() => {
              this.$refs.saveDialog.open('edit').setData(item);
          });
      },
      afterPropertiesSet() {
          this.apiObj.get(this.form).then(res => {
              if(res.code == '00000') {
                  this.returnData = res.data.data;
                  this.returnTotal = res.data.total;
              }
          })
      },
  }
}
</script>

<style scoped>
.task {
	height: 210px;
}

.task-item h2 {
	font-size: 15px;
	color: #3c4a54;
	padding-bottom: 15px;
}

.task-item li {
	list-style-type: none;
	margin-bottom: 10px;
}

.task-item li h4 {
	font-size: 12px;
	font-weight: normal;
	color: #999;
}

.task-item li p {
	margin-top: 5px;
}

.task-item .bottom {
	border-top: 1px solid #EBEEF5;
	text-align: right;
	padding-top: 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.task-add {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	cursor: pointer;
	color: #999;
}

.task-add:hover {
	color: #409EFF;
}

.task-add i {
	font-size: 30px;
}

.task-add p {
	font-size: 12px;
	margin-top: 20px;
}

.dark .task-item .bottom {
	border-color: var(--el-border-color-light);
}

.progress {
	margin-top: -45px
}

.percentage-value {
	display: block;
	margin-top: 10px;
	font-size: 18px;
}

.percentage-label {
	display: block;
	margin-top: 10px;
	font-size: 12px;
}

.demo-progress .el-progress--line {
	margin-bottom: 15px;
	width: 350px;
}

.demo-progress .el-progress--circle {
	margin-right: 15px;
}</style>
