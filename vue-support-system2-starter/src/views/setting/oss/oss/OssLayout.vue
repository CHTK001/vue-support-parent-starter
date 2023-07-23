<template>
  <el-container>
    <!-- <el-aside width="220px">
			<el-tree ref="category" class="menu" node-key="label" :data="category" :default-expanded-keys="['系统日志']"
				current-node-key="系统日志" :highlight-current="true" :expand-on-click-node="false">
			</el-tree>
		</el-aside> -->
    <el-container>
      <el-main class="nopadding">
        <el-container>
          <el-header>
            <div class="right-panel">
              <div class="right-panel-search">
                <!-- <el-select v-model="search.logStatus" clearable>
                  <el-option :value="1" label="成功"></el-option>
                  <el-option :value="0" label="失败"></el-option>
                </el-select>
                <el-input v-model="search.keyword" placeholder="关键词" clearable></el-input>
                <el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button> -->
                <el-button type="primary" icon="el-icon-plus" @click="addData"></el-button>
              </div>
            </div>
          </el-header>
          <el-main class="nopadding">
            <scTable ref="table" :apiObj="apiObj" stripe highlightCurrentRow @row-click="rowClick">
              <el-table-column prop="ossBucket" label="Bucket" />
              <el-table-column prop="ossType" label="类型" />
              <el-table-column prop="ossPath" show-overflow-tooltip label="oss路径" />
              <el-table-column prop="ossNameStrategy" label="命名策略" width="200" />
              <el-table-column prop="ossRejectStrategy" label="拒绝策略" width="200" />
              <el-table-column prop="ossCovering" label="重名覆盖">
                <template #default="scope">
                  <el-tag v-if="scope.row.ossCovering">覆盖</el-tag>
                  <el-tag v-else>不覆盖</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="ossStatus" label="是否禁用">
                <template #default="scope">
                  <el-switch @change="submitFormUpdate(scope.row)" v-model="scope.row.ossStatus" class="ml-2"
                    :active-value="1" :inactive-value="0"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" />
                </template>
              </el-table-column>
              <el-table-column prop="ossBuffer" label="传输字节" />
              <el-table-column prop="ossAppKey" label="appKey" />
              <el-table-column prop="ossAppSecret" label="appSecret" width="120" />
              <el-table-column prop="ossProperties" label="额外参数" />
              <el-table-column prop="ossPlugins" label="插件" show-overflow-tooltip />
              <el-table-column label="操作" width="240" style="z-index: 10000">
                <template #default="scope">
                  <el-button type="info" text :icon="Edit" @click.stop="onUpdate(scope.row)" size="small" />
                  <el-popconfirm title="确定删除吗？" @confirm="onDelete(scope.row, scope.$index)">
                    <template #reference>
                      <el-button text type="primary" :icon="Delete" size="small"></el-button>
                    </template>
                  </el-popconfirm>
                  <!-- <el-button type="danger"  text :icon="Upload" @click.stop="onUpload(scope.row)" size="small" /> -->
                  <el-button type="success" text :icon="PictureFilled" @click.stop="onView(scope.row)" size="small" />
                </template>
              </el-table-column>
            </scTable>
          </el-main>
        </el-container>
      </el-main>
    </el-container>
  </el-container>
  <save-dialog v-if="dialog.save" ref="saveDialog" @success="handleSaveSuccess"
    @closed="dialog.save = false"></save-dialog>
</template>

<script>
import { Delete, Edit, Search, Share, Upload,PictureFilled } from '@element-plus/icons-vue'
import saveDialog from './OssLayoutSave.vue'
export default {
  name: 'OssLayout',
  components: {
    saveDialog
  },
  computed: {
    Upload() {
      return Upload
    },
    Edit() {
      return Edit
    },
    Delete() {
      return Delete
    },
    PictureFilled() {
      return PictureFilled
    }
  },
  data() {
    return {
      dialog: {
        save: false
      },
      apiObj: this.$API.system.oss.page,
      search: {
        keyword: ""
      }
    }
  },
  methods: {

    //本地更新数据
    handleSaveSuccess(data, mode) {
      if (mode == 'add') {
        this.$refs.table.refresh()
      } else if (mode == 'edit') {
        this.$refs.table.refresh()
      }
    },
    upsearch() {
      if (this.date.length) {
        this.search.startTime = this.date[0];
        this.search.endTime = this.date[1];
      }
      this.$refs.table.reload(this.search)
    },
    addData: function () {
      this.dialog.save = true
      this.$nextTick(() => {
        this.$refs.saveDialog.open('add').setData({})
      })
    },
    //编辑
    onUpdate(row) {
      this.dialog.save = true
      this.$nextTick(() => {
        this.$refs.saveDialog.open('edit').setData(row)
      })
    },
    //删除
    async onDelete(row) {
      var reqData = { ossId: row.ossId }
      this.$API.system.oss.delete.get(reqData).then(res => {
        if (res.code == '00000') {
          this.$refs.table.refresh()
          this.$notify.success({ title: '提示', message: "操作成功" })
        } else {
          this.$notify.error({ title: '提示', message: res.msg })
        }
      })

    },
  }
}
</script>

<style></style>
