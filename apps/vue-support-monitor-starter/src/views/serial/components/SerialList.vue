<template>
  <div class="serial-list-container">
    <div class="serial-list-header flex justify-between items-center p-4 border-b border-[var(--el-border-color-light)]">
      <h3 class="text-lg font-medium">串口列表</h3>
      <div class="flex gap-2">
        <el-button type="primary" size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" size="small" @click="handleAddSerial">
          <IconifyIconOnline icon="ep:plus" class="mr-1" />
          添加
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="serial-list-loading p-4 flex justify-center">
      <el-skeleton :rows="5" animated />
    </div>

    <el-empty v-else-if="!serialList || serialList.length === 0" description="暂无串口配置" class="mt-8" />

    <div v-else class="serial-list-content p-2">
      <el-card v-for="item in serialList" :key="item.monitorSerialId" class="serial-item mb-3 cursor-pointer" :class="{ 'serial-item-active': selectedSerialId === item.monitorSerialId }" @click="selectSerial(item.monitorSerialId)" shadow="hover">
        <div class="flex justify-between items-center">
          <div class="serial-info">
            <div class="serial-name font-medium text-base mb-1">{{ item.monitorSerialName || "未命名串口" }}</div>
            <div class="serial-port text-[var(--el-text-color-regular)] text-sm">{{ item.monitorSerialPort || "COM1" }} - {{ item.monitorSerialBaudRate || "9600" }}波特</div>
          </div>
          <div class="serial-actions">
            <el-dropdown trigger="click" @command="handleCommand($event, item)">
              <el-button type="primary" text>
                <IconifyIconOnline icon="ep:more-filled" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <IconifyIconOnline icon="ep:edit" class="mr-1" />
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <IconifyIconOnline icon="ep:delete" class="mr-1" />
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑串口对话框 -->
    <sc-dialog v-model="dialogVisible" :title="isEdit ? '编辑串口' : '添加串口'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px" :rules="rules">
        <el-form-item label="串口名称" prop="monitorSerialName">
          <el-input v-model="form.monitorSerialName" placeholder="请输入串口名称" />
        </el-form-item>

        <el-form-item label="串口" prop="monitorSerialPort">
          <div class="flex gap-2 w-full">
            <el-select v-model="form.monitorSerialPort" placeholder="选择串口端口" class="flex-1" filterable allow-create :loading="loadingPorts" @focus="handleRefreshPorts">
              <el-option v-for="port in availablePorts" :key="port" :label="port" :value="port" />
            </el-select>
            <el-button size="default" @click="handleRefreshPorts" :loading="loadingPorts" title="刷新可用串口">
              <IconifyIconOnline icon="ep:refresh" />
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="波特率" prop="monitorSerialBaudRate">
          <el-select v-model="form.monitorSerialBaudRate" placeholder="请选择波特率" class="w-full">
            <el-option :value="110" label="110" />
            <el-option :value="300" label="300" />
            <el-option :value="1200" label="1200" />
            <el-option :value="2400" label="2400" />
            <el-option :value="4800" label="4800" />
            <el-option :value="9600" label="9600" />
            <el-option :value="14400" label="14400" />
            <el-option :value="19200" label="19200" />
            <el-option :value="38400" label="38400" />
            <el-option :value="57600" label="57600" />
            <el-option :value="115200" label="115200" />
            <el-option :value="230400" label="230400" />
            <el-option :value="460800" label="460800" />
            <el-option :value="921600" label="921600" />
          </el-select>
        </el-form-item>

        <el-form-item label="数据位" prop="monitorSerialDataBits">
          <el-select v-model="form.monitorSerialDataBits" placeholder="请选择数据位" class="w-full">
            <el-option :value="5" label="5" />
            <el-option :value="6" label="6" />
            <el-option :value="7" label="7" />
            <el-option :value="8" label="8" />
          </el-select>
        </el-form-item>

        <el-form-item label="停止位" prop="monitorSerialStopBits">
          <el-select v-model="form.monitorSerialStopBits" placeholder="请选择停止位" class="w-full">
            <el-option :value="1" label="1" />
            <el-option :value="1.5" label="1.5" />
            <el-option :value="2" label="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="校验位" prop="monitorSerialParity">
          <el-select v-model="form.monitorSerialParity" placeholder="请选择校验位" class="w-full">
            <el-option value="none" label="无校验" />
            <el-option value="even" label="偶校验" />
            <el-option value="odd" label="奇校验" />
            <el-option value="mark" label="标记校验" />
            <el-option value="space" label="空格校验" />
          </el-select>
        </el-form-item>

        <el-form-item label="流控制" prop="monitorSerialFlowControl">
          <el-select v-model="form.monitorSerialFlowControl" placeholder="请选择流控制" class="w-full">
            <el-option value="none" label="无" />
            <el-option value="hardware" label="硬件流控" />
            <el-option value="software" label="软件流控" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="form.monitorSerialDescription" type="textarea" :rows="3" placeholder="请输入串口描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </span>
      </template>
    </sc-dialog>

    <!-- 删除确认对话框 -->
    <sc-dialog v-model="deleteDialogVisible" title="删除确认" width="400px">
      <div class="delete-confirm">
        <IconifyIconOnline icon="ep:warning" class="text-warning text-xl mr-2" />
        <span>确定要删除此串口配置吗？此操作不可恢复。</span>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleting">确定</el-button>
        </span>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { message } from "@repo/utils";

const props = defineProps({
  serialList: {
    type: Array,
    default: () => [],
  },
  selectedSerialId: {
    type: String,
    default: "",
  },
  availablePorts: {
    type: Array,
    default: () => [],
  },
  loadingPorts: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select-serial", "add-serial", "edit-serial", "delete-serial", "refresh", "refresh-ports"]);

// 状态
const loading = ref(false);
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const currentSerialId = ref("");

// 表单
const formRef = ref();
const form = reactive({
  monitorSerialId: "",
  monitorSerialName: "",
  monitorSerialPort: "",
  monitorSerialBaudRate: 9600,
  monitorSerialDataBits: 8,
  monitorSerialStopBits: 1,
  monitorSerialParity: "none",
  monitorSerialFlowControl: "none",
  monitorSerialDescription: "",
});

// 表单验证规则
const rules = {
  monitorSerialName: [{ required: true, message: "请输入串口名称", trigger: "blur" }],
  monitorSerialPort: [{ required: true, message: "请输入串口", trigger: "blur" }],
  monitorSerialBaudRate: [{ required: true, message: "请选择波特率", trigger: "change" }],
  monitorSerialDataBits: [{ required: true, message: "请选择数据位", trigger: "change" }],
  monitorSerialStopBits: [{ required: true, message: "请选择停止位", trigger: "change" }],
  monitorSerialParity: [{ required: true, message: "请选择校验位", trigger: "change" }],
  monitorSerialFlowControl: [{ required: true, message: "请选择流控制", trigger: "change" }],
};

// 选择串口
const selectSerial = (serialId) => {
  emit("select-serial", serialId);
};

// 处理刷新
const handleRefresh = () => {
  emit("refresh");
};

// 处理刷新可用串口
const handleRefreshPorts = () => {
  emit("refresh-ports");
};

// 处理添加串口
const handleAddSerial = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 处理下拉菜单命令
const handleCommand = (command, item) => {
  if (command === "edit") {
    handleEditSerial(item);
  } else if (command === "delete") {
    handleDeleteSerial(item);
  }
};

// 处理编辑串口
const handleEditSerial = (item) => {
  isEdit.value = true;
  resetForm();

  // 填充表单数据
  Object.keys(form).forEach((key) => {
    if (item[key] !== undefined) {
      form[key] = item[key];
    }
  });

  dialogVisible.value = true;
};

// 处理删除串口
const handleDeleteSerial = (item) => {
  currentSerialId.value = item.monitorSerialId;
  deleteDialogVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
  try {
    deleting.value = true;
    emit("delete-serial", currentSerialId.value);
    deleteDialogVisible.value = false;
  } catch (error) {
    console.error("删除串口失败:", error);
    message.error("删除串口失败");
  } finally {
    deleting.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    if (isEdit.value) {
      emit("edit-serial", { ...form });
    } else {
      emit("add-serial", { ...form });
    }

    dialogVisible.value = false;
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    submitting.value = false;
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }

  form.monitorSerialId = "";
  form.monitorSerialName = "";
  form.monitorSerialPort = "";
  form.monitorSerialBaudRate = 9600;
  form.monitorSerialDataBits = 8;
  form.monitorSerialStopBits = 1;
  form.monitorSerialParity = "none";
  form.monitorSerialFlowControl = "none";
  form.monitorSerialDescription = "";
};
</script>

<style scoped lang="scss">
.serial-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.serial-list-header {
  flex-shrink: 0;
}

.serial-list-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.serial-item {
  transition: all 0.3s;
  border-left: 3px solid transparent;

  &:hover {
    transform: translateY(-2px);
  }

  &-active {
    border-left-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

.serial-list-loading {
  flex: 1;
}

.delete-confirm {
  display: flex;
  align-items: center;
  padding: 10px 0;
}
</style>
