<template>
    <div>
        <el-dialog v-model="showBackupDialog" draggable title="备份数据" width="60%" @close="handleClose">
            <ul v-if="data.length">
                <li v-for="item in data">
                    {{ item }}
                </li>
            </ul>
            <el-empty v-else/>
        </el-dialog>
    </div>
</template>
<script lang="ts" setup>
import { ref, watch, defineEmits, defineProps } from 'vue'

const emit = defineEmits(['update:visibe', 'close']);
const showBackupDialog = ref(false);
const data = ref([]);
const props = defineProps<{
    visibe:  boolean;
    data: any;
}>();

const handleClose = () => {
    showBackupDialog.value = false;
    emit("close");
};

watch(() => props.visibe, (val) => {
    showBackupDialog.value = val;
});
watch(() => props.data, (val) => {
    data.value = val;
});
</script>