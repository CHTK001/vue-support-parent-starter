<template>
     <VueDraggableResizable :id="'VueDraggableResizable' + id" 
        v-if="viliable" 
        classNameDragging="dragging"
        classNameActive="dragging"
        @drag-start.preventDefault="dragStartHandler"
        @dragging.preventDefault="dragHandler"
        @drag-end.preventDefault="dragEndHandler" 
        :initW="initWidth" 
        :initH="initHeight" 
        :height="domHeight"
        :width="domWidth" 
        :x="x" 
        :y="y" 
        :drag-handle="'.el-dialog__header'" 
        :resizable="resizable" 
        :draggable="draggable" 
        :parent="true" 
        @click.preventDefault="doClick"
        :ref="'VueDraggableResizable' + id"
        :style="{'z-index': zIndex}"
        :class="'relative ' + (isDrag ? ' ' : 'dragging')">
        <slot></slot>
    </VueDraggableResizable>
</template>

<script>
import VueDraggableResizable from 'vue3-draggable-resizable'
import Tool from './tool.vue'
window.drag = 10000;
export default {
    components: { VueDraggableResizable, Tool },
    name: 'dialog',
    props: {
        id: {
            type: String,
            default: 'el-dialog'
        },
        title: {
            type: Boolean,
            default: '标题'
        },
        icon: {
            type: String,
            default: 'el-icon-warning'
        },
        value: {
            type: Boolean,
            default: false
        },
        initWidth: {
            type: Number,
            default: 450
        },
        initHeight: {
            type: Number,
            default: 280
        },
        width: {
            type: Number,
            default: 450
        },
        height: {
            type: Number,
            default: 280
        },
        closeable: {
            type: Boolean,
            default: true
        },
        draggable: {
            type: Boolean,
            default: true
        },
        resizable: {
            type: Boolean,
            default: false
        },
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        },
        zIndex: {
            type: Number,
            default: 10000
        }
    },
    data() {
        return {
            name: 'dialog',
            viliable: this.value,
            startTime: 0,
            domWidth : this.width,
            domHeight : this.height,
        }
    },
    watch: {
        value: function (val) {
            this.viliable = val;
        },
        width: function (val) {
            if(val !== 0) {
                return false;
            }
            this.domWidth = val;
            this.$nextTick(() => {
                this.$refs['VueDraggableResizable' + this.id].$el.style.width = this.domWidth + 'px';
            })
        },
        height: function (val) {
            if(val !== 0) {
                return false;
            }
            this.domHeight = val;
            this.$nextTick(() => {
                this.$refs['VueDraggableResizable' + this.id].$el.style.height = this.domHeight + 'px';
            })
        },
    },
    beforeUnmount() {
        this.closeDraggie();
    },
    mounted() {
        this.viliable = this.value;
    },
    methods: {
        closeDraggie() {
            this.viliable = false
            this.$emit("status", false, this.id);

        },
        dragStartHandler: function ({ x, y }) {
            this.startTime = new Date().getTime();
        },
        dragHandler: function ({ x, y }) {
        },
        dragEndHandler: function ({ x, y }) {
            this.$emit("lastPosition", x, y)
            if (!this.isDrag()) {
                //点击
                this.doClick();
                return false;
            }

            var pos;
            if((pos = this.isEdage(x, y))== null) {
                this.doOutEdage();
                return false;
            }

            if(pos === 'l') {
                this.doLeftEdage(x, y);
                return false;
            }

            if(pos === 't') {
                this.doTopEdage(x, y);
                return false;
            }
            return false;
        },
        doOutEdage(){
            this.$emit("outEdage");
        },
        doLeftEdage(x, y) {
            this.$emit("edage", "left", x, y);
        },
        doTopEdage(x, y) {
            this.$emit("edage", "top", x, y);
        },
        isEdage(x, y) {
            if(x == 0) {
                return 'l';
            }

            if(y == 0) {
                return 't';
            }

            return null;
        },
        doClick() {
            if (!this.isDrag()) {
                //点击
                this.$emit("clickEvent");
                window.drag = window.drag + 1;
                this.$nextTick(() => {
                    this.$refs['VueDraggableResizable' + this.id].$el.style['z-index'] = window.drag
                })
                return false;
            }
        },
        isDrag() {
            return new Date().getTime() - this.startTime > 100;
        }
    },
   
}
</script>
<style scoped lang="less">
.dragging {
    z-index: 9999999999 !important
}
.vdr.active:before {
    outline: inherit !important;
}

.is-draggable {
    margin: 0 !important;
    min-height: 200px;
    min-width: 200px;
}

.draggable {
    border-style: inherit !important;
}

.el-dialog__body {
    height: 100%;
}

.resizable {
    z-index: 10000;
}
.el-dialog__headerbtn {
    top: 0
}</style>