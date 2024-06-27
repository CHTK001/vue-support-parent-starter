<template>
    <div class="screen1080B">
        <div :class="`area-box area-${area.name}`" v-for="area in areas" :key="area.id">
            <el-card shadow="never" :header="item.title" class="portlet-wrapper" v-for="item in area.portlets" :key="item.id" :span="8" :body-style="{height:'100%', width:'100%', boxSizing:'border-box'}">
                <component v-if="item.border" :is='item.border' :config="getConfig(item)">
                    <panelTitleA1 v-if="!item.hideTitle" :config="panelTitleConfig">{{ item.title }}</panelTitleA1>
                    <component :is='switchComponent(comps[item.component])' :data="data[terminal.terminalId] ? data[terminal.terminalId][item.name] : null"></component>
                </component>
                <template v-else>
                    <component :is='item.component'></component>
                    <i>{{ item.component }}</i>
                </template>
            </el-card>
        </div>
    </div>
</template>

<script>
import MemLayout from './mem.vue';
import CpuLayout from './cpu.vue';
import BaseLayout from './base.vue';
import DiskLayout from './disk.vue';
import { inject, markRaw, ref } from 'vue'
export default {
    props: {
        terminal: {
                type: Object,
                default: () => ({})
            }
    },
    data() {
        return {
            systemTitleConfig: {
                width: 500
            },
            panelTitleConfig: {
                width: 260,
            },
            dialogConfig: {
                show: false,
                width: '60%',
                height: '60%',
                title: "对话框标题",
                titleWidth: 350,
            },
            areas: [
                {
                    name: "left", portlets: [
                        { id: "l4", title: "系统磁盘", component: "DiskLayout", border: "aYinTechBorderA1", hideTitle: true , name: 'disk'},
                    ]
                },
                {
                    name: "center", portlets: [
                        { id: "l1", title: "系统CPU", component: "CpuLayout", border: "aYinTechBorderA1", hideTitle: true, name: 'cpu-io' },
                    ]
                },
                {
                    name: "right", portlets: [
                        { id: "l2", title: "系统内存", component: "MemLayout", border: "aYinTechBorderA1", hideTitle: true, name: 'mem' },
                    ]
                },

            ]
            ,
            comps: {
                MemLayout,
                DiskLayout,
                CpuLayout,
                BaseLayout,
            },
            data: {},
            visible: false,
            title: '指标',
            terminalId: '',
            socket: inject('socket'),
        }
    },
    beforeUnmount() {
        this.closeSocket();
    },
    mounted() {
        this.terminalId = this.terminal.terminalId;
        this.openSocket();
        this.refreshIndicator();
    },
    methods: {
        refreshIndicator(){
            this.$API.terminal.indicator.get({id: this.terminal.terminalId}).then(res => {
                if(res.code == '00000') {
                    this.$message.success("刷新成功");
                    return;
                }
            });
        },
        switchComponent(item){
            return markRaw(item);
        },
        getConfig(item) {
            const { id } = item
            if (id.includes("l")) {
                return {
                    title: item.title,
                    titleWidth: 120,
                    decoration: false,
                    decorationAlt: true,
                    rotate: "y",
                    opacity: 0.5
                }
            } else if (id == 'c2') {
                return {
                    title: item.title,
                    rotate: "y",
                    opacity: 1,
                    decoration: false,
                }
            } else {
                return {
                    title: item.title,
                    titleWidth: 120,
                    decoration: false,
                    opacity: .5
                }
            }
        },
        openSocket() {
            const _this = this;
            this.socket.on("terminal-report-" + this.terminalId, (it) => {
                if (!this.data[this.terminalId]) {
                    this.data[this.terminalId] = {};
                }
                if (Array.isArray(it) && it.length > 0) {
                    this.data[this.terminalId][it[0]?.type] = it;
                    return;
                }
                this.data[this.terminalId][it?.type] = it;
            })
        },
        closeSocket() {
            if(!this.socket) {
                return;
            }
            this.socket.off("terminal-report-" + this.terminalId);
        }
    },
}
</script>
<style lang="less">
::deep(.el-card__body) {
    height: 100%;
}
.el-card-auto {
  min-height: 100%;
  height: 100%;
}
.el-card-auto  .el-card__body {
  height: 100%;
}
.screen1080B{ z-index: 1;padding:60px 30px 30px 30px; height: 100%; //url(../common/images/bg.png) 
  .techButtonA2 {z-index: 10; .poa; bottom:20px; left:50%; .fixc("x");}
.i(){.poa; bottom:0; right:10px; font-size: 12px; opacity: .1; .fc(@wh); z-index: 10;}
  display: grid; grid-template-columns: repeat(24,1fr); grid-template-rows:repeat(24,1fr); grid-gap: 30px;
  .area-box{.bdr(5px);  pointer-events: visible; position: relative; z-index: 10; 
    .board-3d-wrap{ .poa; .fullbox;

    }
    //<row-start> / <column-start> / <row-end> / <column-end>;
    .blank,
    .portlet-wrapper{.por;
      >i{.i;}
      
    }
    .border-content{>i{.i;}}
    &.area-left{ grid-area: 1 / 1 / 14 / 8; }
    &.area-center{grid-area: 1 / 8 / 14 / 17; }
    &.area-right{ grid-area: 1 / 17 / 14 / 25; }
    &.area-left,
    &.area-right,
    &.area-center{ display: grid; grid-template-columns: repeat(1,1fr); grid-template-rows:repeat(4,1fr); grid-gap: 20px;
      .portlet-wrapper{
        &:nth-child(1){grid-area: 1 / 1 / 4 / 1;}
        &:nth-child(2){grid-area: 16 / 1 / 32 / 1;}
        &:nth-child(3){grid-area: 32 / 1 / 48 / 1;}
      }
    }
    &.area-center{grid-template-columns: repeat(2,1fr);
      .portlet-wrapper{
        &:nth-child(1){grid-area: 1 / 1 / 4 / 3;}
        &:nth-child(2){grid-area: 8 / 1 / 15 / 2;}
        &:nth-child(3){grid-area: 8/ 2 / 15 / 3;}
        &:nth-child(4){grid-area: 15 / 1 / 25 / 3;}
      }
    }
    
  }
  .content-tabs{.poa;  top:-40px; left:80px; right:80px; text-align: center; height: 40px;
    &:before{content:" "; .bdb(var(--button-bd_hov));left:0; right:0; bottom:10px;.poa; z-index: 1;}
    .tabs-item{display:inline-block; padding:0 10px; .ff("cn1"); .fc(var(--font-normal)); height: 30px;line-height: 30px; cursor: pointer; .ani; z-index: 2; .por;
      &:before{content:" "; .bgc(var(--button-bd_hov)); .poa; .fullbox; opacity: 0;}
      &:hover{&:before{opacity: .3;}}
      &.active{ .bdb(var(--font-strong)); .fc(var(--font-strong));}
    }
  }
}
</style>