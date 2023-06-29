<template>
  <el-skeleton :loading="loading" animated :rows="10">
    <div class="common-layout">
      <el-container style="height: 100%;">
        <el-aside width="218px" class="aside">
          <div class="panel-header">
            <div class="panel-title panel-with-icon">数据库选择</div>
            <div class="panel-icon ">
              <el-icon>
                <Link />
              </el-icon>
            </div>
            <div class="panel-tool">
              <a>
                <el-icon>
                  <DArrowLeft />
                </el-icon>
              </a>
            </div>
          </div>

          <div class="common-layout-padding">
            <el-select v-model="datasource" class="m-2" placeholder="请选择..." @change="changeDatabase">
              <el-option v-for="item in options" :key="item.configId" :label="item.configName" :value="item.configId" />
            </el-select>
          </div>

          <div class="panel-header">
            <div class="panel-title panel-with-icon">数据库</div>
            <div class="panel-icon ">
              <el-icon>
                <Histogram />
              </el-icon>
            </div>
            <div class="panel-tool">
              <a>
                <el-icon class="cursor-point" @click="openOrCloseMulti">
                  <Switch />
                </el-icon>
              </a>
              <a>
                <el-icon class="cursor-point" @click="changeDatabase">
                  <RefreshRight />
                </el-icon>
              </a>
            </div>
          </div>

          <el-skeleton :loading="tableLoading" animated>
            <div class="common-layout-padding common-layout-padding1">
              <el-table :data="treeData" style="width: 100%; margin-bottom: 20px; " row-key="id" border default-expand-all
                @row-contextmenu="rightclick" @selection-change="handleSelectionChange">
                <el-table-column type="selection" v-if="showMulti" width="35" />
                <el-table-column prop="name" label="详情" show-overflow-tooltip style="font-size: 21px; cursor: none">
                  <template #default="scope">
                    <span class="l-btn-icon icon-berlin-calendar" v-if="scope.row.icon === 'TABLE'"></span>
                    <span class="l-btn-icon icon-application-view-icons" v-else-if="scope.row.icon === 'VIEW'"></span>
                    <span class="l-btn-icon icon-hamburg-database " v-else></span>

                    <el-text v-if="scope.row.type === 'TABLE' || scope.row.type === 'VIEW'"
                      style="cursor: pointer; margin-left: 18px" @click="handleSql(scope.row)">
                      {{ scope.row.name }}
                    </el-text>
                    <el-text style="margin-left: 18px" v-else>{{ scope.row.name }}
                    </el-text>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 右键菜单 -->
              <right-menu :class-index="0" :rightclickInfo="rightclickInfo" @onOpenTable="openTable"
                @onClearTable="clearTable" @onCopy="onCopy" @onCreateTable="onCreateTable" @onDesignTable="onDesignTable"
                @onDeleteTable="onDeleteTable" @onInfoTable="onInfoTable" @onBackupTable="onBackupTable"
                @onCopyTable="onCopyTable" @onRenameTable="onRenameTable" @onExport="onExport"></right-menu>
            </div>
          </el-skeleton>
        </el-aside>
        <drag-layout id="vertical-drag-bar"></drag-layout>
        <el-main>
          <el-header height="30px">
            <div class="page-tabs-index">
              <el-tabs v-model="activeRoute" type="card" @tab-remove='closeTab' :closable="closable" @tab-click="tabClick"
                @edit="handleTabsEdit" height="30">
                <el-tab-pane :key="item.id" v-for="(item, index) in tabs" :label="item.label" :name="item.id"
                  :closable="item.close">
                  <template #label v-if="item.type === 'HOME'">
                    <span class="custom-tabs-label">
                      <span><span class="margin-5 l-btn-icon panel-icon icon-berlin-home"></span>{{ item.label }}</span>
                    </span>
                  </template>
                  <template #label v-if="item.type === 'DATABASE'">
                    <span class="custom-tabs-label">
                      <span> <span class="margin-5 l-btn-icon panel-icon icon-hamburg-database"></span>{{ item.label
                      }}</span>
                    </span>
                  </template>

                  <template #label v-if="item.type === 'TABLE'">
                    <span class="custom-tabs-label">
                      <span> <span class="margin-5 l-btn-icon panel-icon icon-berlin-calendar"></span>{{ item.label
                      }}</span>
                    </span>
                  </template>
                  <home v-if="item.type === 'HOME'" ref="home" :current-database-data="currentDatasource"
                    :loading="loading" :current-table-data="currentTable" :watch-data="watchData" @event="onEvent"></home>
                  <database v-if="item.type === 'WEB-DATABASE'" :watch-data="watchData"></database>
                  <div v-if="item.type === 'TABLE' && item.action === 'OPEN'">
                    <open-table v-if="currentDatasource.configType !== 'ZOOKEEPER'" :watch-data="watchData"
                      :config="currentDatasource" :table="currentTable"></open-table>

                    <zookeeper v-if="currentDatasource.configType === 'ZOOKEEPER'" :watch-data="watchData"
                      :config="currentDatasource" :table="currentTable">

                    </zookeeper>
                  </div>

                  <div v-if="item.type === 'DesignTable' && item.action === 'OPEN'">
                    <design-table :watch-data="watchData" :config="currentDatasource"
                      :table="currentTable"></design-table>
                  </div>
                  <div v-if="item.type === 'CreateTable' && item.action === 'OPEN'">
                    <create-table :watch-data="watchData" :config="currentDatasource"
                      :table="currentTable"></create-table>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-header>
        </el-main>
      </el-container>
    </div>
  </el-skeleton>

  <el-dialog v-model="exportVisible" :close-on-click-modal="false" draggable title="代码生成器">

    <div style="height: 80px">
      <el-steps :active="active" finish-status="success">
        <el-step title="基本信息" />
        <el-step title="基础信息" />
        <el-step title="包信息" />
      </el-steps>
    </div>
    <el-form :model="generator" label-width="120px">
      <div v-if="active === 0">
        <el-form-item label="表名" v-for="it in tables">
          <el-input disabled readonly :model-value="it" />
        </el-form-item>

        <el-form-item label="实体开启lombok">
          <el-checkbox v-model="generator.entity.lombok" />
        </el-form-item>

        <el-form-item label="实体开启chain">
          <el-checkbox v-model="generator.entity.chain" />
        </el-form-item>
      </div>

      <div v-if="active === 1">
        <el-form-item label="表名">
          <el-input v-model="generator.author" />
        </el-form-item>

        <el-form-item label="Kotlin">
          <el-checkbox v-model="generator.kotlin" />
        </el-form-item>

        <el-form-item label="swagger">
          <el-checkbox v-model="generator.swagger" />
        </el-form-item>

        <el-form-item label="springdoc">
          <el-checkbox v-model="generator.springdoc" />
        </el-form-item>

        <el-form-item label="schema">
          <el-checkbox v-model="generator.enableSchema" />
        </el-form-item>
      </div>

      <div v-if="active === 2">
        <el-form-item label="父包名">
          <el-input v-model="generator.packages.parent" />
        </el-form-item>
        <el-form-item label="父包模块名">
          <el-input v-model="generator.packages.moduleName" />
        </el-form-item>
        <el-form-item label="Entity包名">
          <el-input v-model="generator.packages.entity" />
        </el-form-item>
        <el-form-item label="Service包名">
          <el-input v-model="generator.packages.service" />
        </el-form-item>
        <el-form-item label="ServiceImpl包名">
          <el-input v-model="generator.packages.serviceImpl" />
        </el-form-item>
        <el-form-item label="Mapper包名">
          <el-input v-model="generator.packages.mapper" />
        </el-form-item>
        <el-form-item label="XML包名">
          <el-input v-model="generator.packages.xml" />
        </el-form-item>
        <el-form-item label="Controller包名">
          <el-input v-model="generator.packages.controller" />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button style="margin-top: 12px" @click="doPrev" v-if="active > 0" size="small" type="default">上一步
      </el-button>
      <el-button style="margin-top: 12px" @click="doNext" v-if="active < 2" size="small" type="default">下一步
      </el-button>
      <el-button style="margin-top: 12px" @click="doFinish" v-if="active === 2" size="small" type="primary">提交
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="renameVisible" title="重命名" draggable :destroy-on-close="false" width="300px">
    <el-form>
      <el-form-item label="表名">
        <el-input v-model="renameTable.newName" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button style="margin-top: 12px" @click="doFinishRename" size="small" type="primary">提交
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import request from '@/utils/request'
import URL from "@/config/sql-edit-url"
import { sformat } from '@/utils/Utils'
import { ElMessage, ElMessageBox } from "element-plus";
import '@/style/easy.css'
import Home from "@/components/home/home.vue";
import Database from "@/components/database/database.vue";
import Zookeeper from "@/components/zookeeper/Zookeeper.vue";
import OpenTable from "@/components/table/OpenTable.vue";
import RightMenu from "@/components/menu/RightMenu.vue";
import DesignTable from "@/components/table/DesignTable.vue";
import CreateTable from "@/components/table/CreateTable.vue";
import '@/assets/icons/icon-berlin.css'
import '@/assets/icons/icon-hamburg.css'
import '@/assets/icons/icon-standard.css'
import DragLayout from "@/components/drag/DragLayout.vue";

export default {
  name: "WebSql",
  components: { DragLayout, Home, Database, OpenTable, RightMenu, Zookeeper, CreateTable, DesignTable },
  data() {
    return {
      showMulti: !1,
      active: 0,
      exportVisible: !1,
      exportTableName: '',
      loading: true,
      watchData: [],
      renameTable: {
        realName: undefined,
        newName: undefined,
      },
      tableLoading: false,
      datasource: '',
      currentDatasource: undefined,
      closable: false,
      activeRoute: 'HOME',
      currentTable: undefined,
      renameVisible: !1,
      rightclickInfo: {},
      tabs: [
        {
          id: 'HOME',
          label: '运行及展示',
          icon: 'HOME',
          type: 'HOME',
          close: false
        }
      ],
      treeData: [],
      options: [],
      tables: [],
      generator: {
        include: undefined,
        name: undefined,
        author: 'CH',
        kotlin: false,
        swagger: true,
        springdoc: false,
        enableSchema: true,
        entity: {
          lombok: true,
          chain: true
        },
        packages: {
          parent: "com.chua",
          moduleName: "",
          entity: "entity",
          service: "service",
          serviceImpl: "service.impl",
          mapper: "mapper",
          xml: "mapper",
          controller: "controller"
        }

      },
    }
  },
  mounted() {
    this.loading = !0;
    request.get(URL.LIST_DATASOURCE)
      .then(({ data }) => {
        this.options.length = 0;
        if (data.code === '00000') {
          data.data.forEach((item, index) => {
            this.options.push(item)
          })
        }

        if (this.options.length > 0) {
          this.datasource = this.options[0].configId;
          this.changeDatabase();
        }
      }).finally(() => {
        this.loading = !1
      });

  },
  methods: {
    /**
     * 重命名表
     */
    doFinishRename: function () {
      if(this.renameTable.realName === this.renameTable.newName) {
        this.renameVisible = false;
        this.renameTable = {};
        return !1;
      }
      request.get(sformat(URL.RENAME_TABLE, this.currentDatasource, this.renameTable))
        .then(({ data }) => {
          let type = 'success';
          if (data.code !== '00000') {
            type = 'error';
          }
          if ('success' === type) {
            this.changeDatabase();
            this.renameVisible = false;
          }
          layx.notice({
            title: '消息提示',
            type: type,
            message: data.msg
          });
        }).catch(res => {
          const msg = res.response.data.msg;
          this.$message.error(msg);
          this.watchData.push(msg)
        })
    },
    /**
     * 代码生成器
     */
    doFinish: function () {
      if (this.tables.length === 0) {
        this.$message.error('请选择表');
        return !1;
      }
      this.generator.include = this.tables.join(',');
      request.post(URL.GENERATOR, this.generator, { responseType: "blob" }).then(data => {
        if (data.status === 200) {
          const blob = data.data;
          let fileName = ''
          const contentDisposition = data.headers['content-disposition']
          if (contentDisposition) {
            fileName = window.decodeURI(
              data.headers['content-disposition'].split('=')[1]
            )
          }
          this.downFile(blob, fileName)
          this.generator = {};
          this.exportVisible = !this.exportVisible;
          return !1;
        }
        ElMessage({
          type: 'error',
          message: '下载失败'
        })
      })
    },
    downFile(blob, fileName) {
      // 非IE下载
      if ('download' in document.createElement('a')) {
        let link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob) // 创建下载的链接
        link.download = fileName // 下载后文件名
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click() // 点击下载
        window.URL.revokeObjectURL(link.href) // 释放掉blob对象
        document.body.removeChild(link) // 下载完成移除元素
      } else {
        // IE10+下载
        window.navigator.msSaveBlob(blob, fileName)
      }
    },

    doNext: function () {
      this.active++;
    },
    doPrev: function () {
      this.active--;
    },
    onEvent: function (item) {
      this.handleTabsEdit(item, "add");
    },
    openOrCloseMulti: function () {
      this.showMulti = !this.showMulti;
    },
    changeDatabase: function () {
      const item = this.datasource;
      this.tableLoading = true;
      this.treeData.length = 0;
      this.currentDatasource = this.options.filter(it => it.configId === item)[0];
      this.generator.name = this.currentDatasource.configId;
      this.tabs.forEach(item => {
        if (item.id === 'HOME') {
          return !1;
        }
        this.closeTab(item.id);
      })
      request.get(sformat(URL.GET_TABLE_INFO, this.currentDatasource))
        .then(({ data }) => {
          if (data.code === '00000') {
            this.treeData.push(data.data);
          } else {
            ElMessage({
              type: 'error',
              message: data.msg
            });
            this.treeData.length = 0;
          }
        }).catch(xhr => {
          ElMessage({
            type: 'error',
            message: '请求失败'
          });
          this.treeData.length = 0;
        }).finally(() => this.tableLoading = false)
    },
    handleSql(item, action) {
      this.currentTable = item;
      if (item.action === 'OPEN') {
        this.handleTabsEdit({
          id: item.id + item.name,
          name: item.id,
          label: item.name,
          realName: item.realName,
          type: item.type,
          path: item.path,
          close: !0,
          action: item.action
        }, 'add')
        return;
      }

      try {
        this.$refs.home[0].setSql(item);
      } catch (e) {
      }
    },
    // 增删tabs
    handleTabsEdit(item, action) {
      console.log('tab增删:', item, action);
      if (action === 'remove') {
        return false;
      }
      let tab = this.tabs.find(tab => tab.id === (item.id + item.label));
      if (!tab) {
        this.tabs.push({
          id: item.id + item.label,
          name: item.id,
          label: item.label,
          type: item.type,
          close: !0,
          action: item.action
        })
      }
      this.activeRoute = item.id + item.label
    },
    closeTab(targetname) {
      console.log(targetname)
      let tabs = this.tabs;
      let activeitem = this.activeRoute
      if (activeitem == targetname) {
        tabs.forEach((tab, index) => {
          if (tab.id == targetname) {
            let nexttab = tabs[index - 1] || tabs[index + 1]
            if (nexttab) {
              console.log(nexttab)
              activeitem = nexttab.id
            }
          }
        })
      }
      this.activeRoute = activeitem;
      this.tabs = tabs.filter(tab => tab.id !== targetname.toString())
    },
    tabClick(tab) {
      console.log(tab)
      const item = this.tabs.filter(tab => tab.id !== tab.index)

    },
    clearTable(params) {
      ElMessageBox.confirm(
        '您确定要清空表【' + params.row.name + '】吗？e?',
        'Warning', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
      ).then(() => {
        request.get(sformat(URL.CLEAR_TABLE, params.row, this.currentDatasource))
          .then(({ data }) => {
            let type = 'success';
            if (data.code !== '00000') {
              type = 'error';
            }
            layx.notice({
              title: '消息提示',
              type: type,
              message: data.msg
            });
          })
      }).catch(() => {
        layx.notice({
          title: '消息提示',
          type: 'error',
          message: '操作失败'
        });
      })
    },
    onCopy(params) {
      this.$copyText(params.row.name).then(
        e => {
          layx.notice({
            title: '消息提示',
            message: params.row.name + '复制成功'
          });
        },
        e => {
          layx.notice({
            title: '消息提示',
            type: 'warn',
            message: '复制失败'
          });
        }
      )
    },
    openTable(params) {
      const item = params.row;
      this.currentTable = item;
      if (item) {
        if (!item.children || item.children == 0) {
          this.handleTabsEdit({
            id: item.id + "",
            name: item.id,
            label: item.name,
            type: item.type,
            path: item.path,
            close: !0,
            action: 'OPEN'
          }, 'add')
          return !0;
        }
      }
      ElMessage({
        type: 'error',
        message: '不支持打开'
      })
    },
    onDeleteTable(params) {
      ElMessageBox.confirm(
        '您确定要刪除表【' + params.row.name + '】吗?',
        'Warning', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
      ).then(() => {
        request.get(sformat(URL.DELETE_TABLE, params.row, this.currentDatasource))
          .then(({ data }) => {
            let type = 'success';
            if (data.code !== '00000') {
              type = 'error';
            }
            if ('success' === type) {
              this.changeDatabase();
            }
            layx.notice({
              title: '消息提示',
              type: type,
              message: data.msg
            });
          }).catch(res => {
            const msg = res.response.data.msg;
            this.$message.error(msg);
            this.watchData.push(msg)
          })
      });

    },
    onInfoTable(params) {
      ElMessage({
        type: 'error',
        message: '未实现表信息'
      })
    },
    onBackupTable(params) {
      ElMessage({
        type: 'error',
        message: '未实现表备份'
      })
    },
    onCopyTable(params) {
      request.get(sformat(URL.COPY_TABLE, params.row, this.currentDatasource))
        .then(({ data }) => {
          let type = 'success';
          if (data.code !== '00000') {
            type = 'error';
          }
          if ('success' === type) {
            this.changeDatabase();
          }
          layx.notice({
            title: '消息提示',
            type: type,
            message: data.msg
          });
        }).catch(res => {
          const msg = res.response.data.msg;
          this.$message.error(msg);
          this.watchData.push(msg)
        })
    },
    onExport(params) {
      this.exportVisible = !this.exportVisible;
      this.exportTableName = params.row.realName;
      if (!this.showMulti) {
        this.tables.length = 0;
        this.tables.push(this.exportTableName);
      }

      if (this.tables.length === 0) {
        this.$message.error('请选择表');
        return !1;
      }
      this.active = 0;
    },
    onRenameTable(params) {
      this.renameVisible = !this.renameVisible;
      this.renameTable.realName = params.row.realName;
      this.renameTable.newName = params.row.realName;
    },
    onDesignTable(params) {
      const item = params.row;
      this.currentTable = item;
      if (item) {
        if (!item.children || item.children === 0) {
          this.handleTabsEdit({
            id: item.id + "DesignTable",
            name: item.id,
            label: item.name,
            type: 'DesignTable',
            path: item.path,
            close: !0,
            action: 'OPEN'
          }, 'add')
          return !0;
        }
      }
      ElMessage({
        type: 'error',
        message: '不支持打开'
      })
    },
    onCreateTable(params) {
      const item = params.row;
      this.currentTable = item;
      if (item) {
        if (!item.children || item.children == 0) {
          this.handleTabsEdit({
            id: item.id + "CreateTable",
            name: item.id,
            label: item.name,
            type: 'CreateTable',
            path: item.path,
            close: !0,
            action: 'OPEN'
          }, 'add')
          return !0;
        }
      }
      ElMessage({
        type: 'error',
        message: '不支持打开'
      })
    },

    handleSelectionChange: function (row) {
      row.forEach(item => {
        if (item.realName && item.type === 'TABLE') {
          this.tables.push(item.realName);
        }
      })
    },
    rightclick(row, column, event) {
      if ((!!row.children && row.children.length > 0) || row.action == 'OPEN') {
        this.rightclickInfo = {};
        return !0;
      }
      this.rightclickInfo = {
        position: {
          x: event.clientX,
          y: event.clientY,
        },
        menulists: [
          {
            fnName: "onCopy",
            params: { row, column, event },
            icoName: "menu-icon icon-table-multiple",
            btnName: "复 制",
          }, {
            fnName: "onOpenTable",
            params: { row, column, event },
            icoName: "menu-icon  icon-table-edit",
            btnName: "打开表",
          }, {
            fnName: "onDesignTable",
            params: { row, column, event },
            icoName: "menu-icon icon-table-gear",
            btnName: "设计表(建筑)",
          }, {
            fnName: "onCreateTable",
            params: { row, column, event },
            icoName: "menu-icon icon-table-add",
            btnName: "新建表(建筑)",
          }, {
            fnName: "onBackupTable",
            params: { row, column, event },
            icoName: "menu-icon icon-table-go",
            btnName: "备份表(建筑)",
          }, {
            fnName: "onCopyTable",
            params: { row, column, event },
            icoName: "menu-icon icon-table-lightning",
            btnName: "复制表(仅结构)",
          }, {
            fnName: "onRenameTable",
            params: { row, column, event },
            icoName: "menu-icon icon-table-relationship",
            btnName: "重命名",
          }, {
            fnName: "onDeleteTable",
            params: { row, column, event },
            icoName: "menu-icon  icon-table-delete",
            btnName: "删除表",
            group: true
          }, {
            fnName: "onClearTable",
            params: { row, column, event },
            icoName: "menu-icon  icon-table-row-delete",
            btnName: "清空表",
          }, {
            fnName: "onExport",
            params: { row, column, event },
            icoName: "menu-icon  icon-table-refresh",
            btnName: "代码生成",
          }, {
            fnName: "onInfoTable",
            params: { row, column, event },
            icoName: "menu-icon  icon-table-gear",
            btnName: "表信息(建筑)",
          }
        ],
      };
      event.preventDefault(); // 阻止默认的鼠标右击事件
    },
  }
}
</script>

<style scoped>
.aside {
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}

.common-layout-padding {
  padding: 10px;
}

.common-layout {
  width: 100%;
  height: 100%;
  min-height: 700px;
}

el-container {
  height: 100%;
}

.panel-with-icon {
  padding-left: 18px;
}

.panel-icon {
  left: 5px;
  width: 16px;
}

.panel-tool el-icon {
  height: 16px;
  width: 16px;
  opacity: .6;
  color: blue;
}

.panel-icon,
.panel-tool {
  position: absolute;
  top: 50%;
  margin-top: -8px;
  height: 16px;
  overflow: hidden;
  right: 8px;
}


.panel-tool a {
  display: inline-block;
  width: 16px;
  height: 16px;
  opacity: 0.6;
  filter: alpha(opacity=60);
  margin: 0 0 0 2px;
  vertical-align: top;
}

.panel-header {
  background-color: #ffffff;
}

.tabStyle {
  display: block;
  height: 65px;
}

.el-icon-basic-home {
  display: inline-block;
  width: 16px;
  height: 16px;
  position: relative;
  top: 4px;
  background: url('@/assets/icons/icon-standard/16x16/application-home.png') no-repeat top;
}

.panel-header,
.panel-body {
  border-color: #ddd;
}

.panel-header {
  padding: 5px;
  position: relative;
}

.panel-header,
.panel-body {
  border-width: 1px;
  border-style: solid;
}

.panel-title {
  font-size: 12px;
  font-weight: bold;
  color: #777;
  height: 16px;
  line-height: 16px;
}

.el-tabs__header {
  height: 28px !important;
  font-size: 10px;
  line-height: 28px;
  margin: 0 !important;

}

.custom-tabs-label>span {
  margin-left: 6px;
}

.el-tabs {
  --el-tabs-header-height: 28px;
  --el-font-size-base: 12px;
}

.margin-5 {
  margin-right: 5px;
}

.margin-l-5 {
  margin-left: 20px;
}

.cursor-point {
  cursor: pointer;
}

.common-layout-padding1 {
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.el-tab-pane {
  height: calc(100vh - 50px);
}

.el-main {
  padding: 0 !important;
}

.aside {
  overflow: hidden;
}

.el-dialog__header {
  height: 56px !important;
}

.el-dialog__body {
  padding-top: 0;
  padding-bottom: 0;
}
</style>