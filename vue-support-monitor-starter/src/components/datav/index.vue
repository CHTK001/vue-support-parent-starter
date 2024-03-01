<template>
    <div v-if="type === 7">
        <dv-border-box7 backgroundColor="transparent" :animate="false" :title="attribute.title" v-if="status" :id="attribute.id" :style="{ width: attribute.width + 'px', height: attribute.height + 'px' }" :class="styleClass + ' el-dialog is-datav '" tabindex="-1">
            <div class="el-dialog__header" v-if="attribute.title" style="opacity: 1;">
                <span role="heading" aria-level="2" class="el-dialog__title">
                </span>
            </div>
            <div id="el-id-7111-11" class="el-dialog__body">
                <slot></slot>
            </div>
        </dv-border-box7>
    </div>
    <div v-if="type === 10">
        <dv-border-box10 backgroundColor="transparent" :animate="false" :title="attribute.title" v-if="status" :id="attribute.id" :style="{ width: attribute.width + 'px', height: attribute.height + 'px' }" :class="styleClass + ' el-dialog is-datav '" tabindex="-1">
            <div class="el-dialog__header" v-if="attribute.title" style="opacity: 1;">
                <span role="heading" aria-level="2" class="el-dialog__title">
                </span>
            </div>
            <div id="el-id-7111-11" class="el-dialog__body">
                <slot></slot>
            </div>
        </dv-border-box10>
    </div>
</template>

<script>
import VueDraggableResizable from "vue3-draggable-resizable";

export default {
    components: { VueDraggableResizable },
    name: "dialog",
    props: {
        styleClass: {
            type: String,
            default: "el-dialog",
        },
        type: {
            type: Number,
            default: 7,
        },
        value: {
            type: Boolean,
            default: false,
        },
        id: {
            type: String,
            default: "el-dialog",
        },
        title: {
            type: String,
            default: "",
        },
        width: {
            type: Number,
            default: 400,
        },
        height: {
            type: Number,
            default: 280,
        },
        closeable: {
            type: Boolean,
            default: true,
        },
        draggable: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            name: "dialog",
            viliable: this.value,
            draggie: null,
            attribute: {
                id: this.id,
                title: this.title,
                width: this.width,
                height: this.height,
                icon: this.icon,
                x: 0,
                y: 0,
            },
            minWidth: 54,
            minHeight: 40,
            status: true,
            store: {
                sourceX: null,
                sourceY: null,
            },
            parentWidth: null, // 初始化为null或其他默认值
            parentHeight: null,
            currentX: null,
            currentY: null,
            parent: {
                offsetTop: 0,
                offsetLeft: 0,
                clientWidth: 0,
                clientHeight: 0,
            },
            isMove: false,
        };
    },
    watch: {
        value: function (val) {
            this.viliable = val;
            this.afterPropertiesSet();
        },
    },
    beforeUnmount() {
        this.closeDraggie();
    },
    mounted() {
        this.viliable = this.value;
        this.afterPropertiesSet();
    },
    methods: {
        afterPropertiesSet() {
            this.$nextTick(() => {
                const doc = document.getElementById(
                    "VueDraggableResizable" + this.attribute.id
                );
                if (doc?.parentElement) {
                    this.parentWidth = doc.parentElement.offsetWidth;
                    this.parentHeight = doc.parentElement.offsetHeight;
                    doc.style.width = this.parentWidth - 8 - +"px";
                    doc.style.height = this.parentHeight - 8 + "px";
                    const dialog = document.getElementById("min-dialog");
                    this.viliable = true;
                }
            });
        },
        closeDraggie() {
            this.viliable = false;
            this.$emit("status", false, this.attribute.id);
        },
        dragStartHandle: function ({ x, y }) {
            if (!this.status) {
                return;
            }
            this.store.sourceX = x;
            this.store.sourceY = y;
        },
        dragHandle: function ({ x, y }) {
            this.isMove = true;
            if (this.currentX == x && this.currentY == y) {
                this.isMove = false;
            }
            this.currentX = x;
            this.currentY = y;
        },
        doDragEnd: function ({ x, y }) {
            if (!this.min) {
                return;
            }
            var pos = this.isEdage(x, y);
            if (pos) {
                this.doEdage(pos, x, y);
                this.doHide();
                return;
            }
            this.isMove = false;
            if (!this.status) {
                this.doShow();
            }
        },
        doShow() {
            if (this.isMove) {
                this.isMove = false;
                return;
            }
            this.status = true;
            this.attribute.width = this.width;
            this.attribute.height = this.height;
            this.attribute.x = this.store.sourceX;
            this.attribute.y = this.store.sourceY;
            this.store.sourceX = null;
            this.store.sourceY = null;
        },
        doHide() {
            this.status = false;
            this.attribute.width = 0;
            this.attribute.height = 0;
            //  this.$nextTick(() => {
            //     const doc = document.getElementById('VueDraggableResizable' + this.attribute.id);
            //     doc.style.width = 'px'
            //     doc.style.height = '0px'
            // })
        },
        doEdage(pos, x, y) {
            if (!this.status) {
                return;
            }
            if (pos === "r") {
                this.doRightEdage(x, y);
                return;
            }

            if (pos === "b") {
                this.doButtonEdage(x, y);
            }
        },
        doButtonEdage(x, y) {
            this.$nextTick(() => {
                const min = document.getElementById("min-dialog");
                min.style.top = this.height - min.offsetHeight + "px";
            });
        },
        doRightEdage(x, y) {
            this.$nextTick(() => {
                const min = document.getElementById("min-dialog");
                min.style.left = this.width - min.offsetWidth + "px";
            });
        },
        isEdage(x, y) {
            if (x == 0) {
                return "l";
            }

            if (y == 0) {
                return "t";
            }

            if (x + this.width + 8 >= this.parentWidth) {
                return "r";
            }

            if (y + this.height + 8 >= this.parentHeight) {
                return "b";
            }

            return null;
        },
    },
};
</script>
<style scoped lang="less">
.vdr.active:before {
    outline: inherit !important;
}

.el-dialog__body {
    height: 100%;
    opacity: 1;
}

.el-dialog__body>div {
    overflow: auto;
}

.is-datav {
    margin: 0 !important;
    width: 100% !important;
    margin-top: 10px !important;
}

.el-dialog {
    box-shadow: inherit;
}

.draggable {
    border-style: inherit !important;
}
.el-dialog__headerbtn {
    top: 0
}
.resizable {
    z-index: 10000;
}</style>
