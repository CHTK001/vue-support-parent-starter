<template>
    <div v-if="viliable" style="position: relative" :id="'el-' + attribute.id">
        <VueDraggableResizable  v-if="viliable1" :x="attribute.x" :y="attribute.y" 
        @drag-start="dragStartHandle"
        @dragging="dragHandle"
        @drag-end="doDragEnd" :w="attribute.width" :h="attribute.height" :drag-handle="'.el-dialog__header'" 
            :resizable="false" :parent="true" class="relative">
            <div v-if="status" :id="attribute.id" :style="{'width': attribute.width + 'px', 'height': attribute.height + 'px'}" :class="styleClass + ' el-dialog is-draggable'" tabindex="-1" >
                <div class="el-dialog__header">
                    <span role="heading" aria-level="2" class="el-dialog__title">
                        {{ attribute.title }}
                    </span>
                    <button aria-label="el.dialog.close" class="el-dialog__headerbtn" type="button">
                        <el-icon>
                            <component is="el-icon-close" @click="closeDraggie()" />
                        </el-icon>
                    </button>
                </div>
                <div id="el-id-7111-11" class="el-dialog__body">
                    {{ currentX }}  {{ currentY }}
                   <p> {{ parentWidth }} x {{ parentHeight }}</p>
                </div>
            </div>
            <div v-else @click="doShow" id="min-dialog" class="absolute">
                <el-button size="large" :icon="attribute.icon"></el-button>
            </div>
        </VueDraggableResizable>
    </div>
</template>

<script>
import VueDraggableResizable from 'vue3-draggable-resizable'
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'


export default {
    components: {VueDraggableResizable},
    name: 'dialog',
    props: {
        styleClass: {
            type: String,
            default: 'el-dialog'
        },
        onlyParent: {
            type: Boolean,
            default: true
        },
        icon: {
            type: String,
            default: 'el-icon-message'
        },
        viliable: {
            type: Boolean,
            default: false
        },
        id: {
            type: String,
            default: 'el-dialog'
        },
        title: {
            type: String,
            default: '标题'
        },
        width: {
            type: Number,
            default: 500
        },
        height: {
            type: Number,
            default: 300
        },
    },
    data() {
        return {
            name: 'dialog',
            viliable: false,
            viliable1: false,
            draggie: null,
            attribute: {
                id: this.id,
                title: this.title,
                width: this.width,
                height: this.height,
                icon: this.icon,
                x: 0,
                y: 0
            },
            status: true,
            store: {
                sourceX: null,
                sourceY: null
            },
            parentWidth: null, // 初始化为null或其他默认值
            parentHeight: null,
            currentX: null,
            currentY: null,
            parent: {
                offsetTop: 0,
                offsetLeft: 0,
                clientWidth: 0,
                clientHeight: 0
            }
        }
    },
    beforeUnmount() {
        this.closeDraggie();
    },
    created() {
        this.getParentSize();
        window.addEventListener('resize', () => {
            this.getParentSize();
        });
    },
    methods: {
        getParentSize() {
            this.viliable = true;
            this.$nextTick(() => {
                const doc = document.getElementById('el-' + this.attribute.id);
                if (doc.parentElement) {
                    this.parentWidth = doc.parentElement.offsetWidth;
                    this.parentHeight = doc.parentElement.offsetHeight;
                    doc.style.width = this.parentWidth - 8 - + 'px';
                    doc.style.height = this.parentHeight - 8+ 'px';
                    this.attribute.x = (this.parentWidth - this.width) / 2
                    this.attribute.y = (this.parentHeight - this.height) / 3 
                    this.viliable1 = true;
                } else {
                    console.error("无法获取父元素大小");
                }
            })
        },
        closeDraggie(){
            this.viliable = false
        },
        dragStartHandle: function({ x, y} ) {
            if(!this.status) {
                return;
            }
            this.store.sourceX = x;
            this.store.sourceY = y;
        },
        dragHandle: function( { x, y}) {
            this.currentX = x;
            this.currentY = y;
        },
        doDragEnd: function( { x, y}) {
            var pos = this.isEdage(x, y);
            if(pos  && this.status) {
                this.doStatus();
                this.doEdage(pos, x, y);
                return;
            }
            
        },
        doShow(){
            this.status = true;        
        },
        doStatus(){
             this.status = false;        
        },
        doEdage(pos, x, y) {
            if(pos === 'r') {
                this.doRightEdage(x, y);
                return;
            }

            if(pos === 'b') {
                this.doButtonEdage(x, y);
            }

        },
        doButtonEdage(x, y) {
            this.$nextTick(() => {
                const min = document.getElementById('min-dialog');
                min.style.top = (this.height - min.offsetHeight) + 'px'
            })
        },
        doRightEdage(x, y){
            this.$nextTick(() => {
                const min = document.getElementById('min-dialog');
                min.style.left = (this.width - min.offsetWidth) + 'px'
            })
        },
        isEdage(x, y) {
            if(x == 0) {
                return 'l';
            }

            if(y == 0) {
                return 't';
            }

            if((x + this.width + 8) >= this.parentWidth) {
                return "r";
            }

            if( (y + this.height + 8) >= this.parentHeight) {
                return 'b';
            }

            return null;
        }
    },
}
</script>
<stype lang="less">
    .vdr.active:before{
        outline: inherit !important;
    }
    .is-draggable{
        margin: 0 !important;
        min-height: 200px;
        min-width: 200px;
    }
    .draggable {
        border-style: inherit !important;
    }
</stype>