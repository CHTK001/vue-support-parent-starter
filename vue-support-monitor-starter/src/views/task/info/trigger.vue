<template>

    <el-dialog model-value="visible">
        11

    </el-dialog>

</template>

<script>
export default {
    props: {
        data: {
            type: Object,
            default: () => {}
        }
    },
    data(){
        return {
            visible: false
        }
    },
    methods: {
        open() {
            this.visible = true;
            debugger
        }
    }
}
</script>