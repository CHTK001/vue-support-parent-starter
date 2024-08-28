<script setup lang="ts">
import { reactive, ref } from "vue";
import { message } from "@/utils/message";
import { getMine } from "@/api/user";
import { fetchUpdateUser } from "@/api/user";
import type { FormInstance, FormRules } from "element-plus";
import { createFormData, deviceDetection } from "@pureadmin/utils";
import uploadLine from "@iconify-icons/ri/upload-line";
import ScCropper from "@/components/scCropper/index.vue";

defineOptions({
  name: "Profile"
});

const props = defineProps({
  showTitle: {
    type: Boolean,
    default: true
  }
});
const imgSrc = ref("");
const cropperBlob = ref();
const cropperInfo = ref();
const cropRef = ref();
const uploadRef = ref();
const isShow = ref(false);
const userInfoFormRef = ref<FormInstance>();
interface Emits {
  (e: "updated:user", val: any): void;
}

const userInfos = reactive({
  sysUserAvatar: null,
  sysUserId: 0,
  avatar: null,
  sysUserNickname: "",
  sysUserEmail: "",
  sysUserPhone: "",
  description: "",
  updateRole: false
});
const emit = defineEmits<Emits>();

const rules = reactive<FormRules>({});

function queryEmail(queryString, callback) {
  const emailList = [
    { value: "@qq.com" },
    { value: "@gmail.com" },
    { value: "@yahoo.com" },
    { value: "@126.com" },
    { value: "@163.com" }
  ];
  let results = [];
  let queryList = [];
  emailList.map(item =>
    queryList.push({ value: queryString.split("@")[0] + item.value })
  );
  results = queryString
    ? queryList.filter(
        item =>
          item.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
      )
    : queryList;
  callback(results);
}

const onChange = uploadFile => {
  const reader = new FileReader();
  reader.onload = e => {
    imgSrc.value = e.target.result as string;
    isShow.value = true;
  };
  reader.readAsDataURL(uploadFile.raw);
};

const handleClose = () => {
  uploadRef.value.clearFiles();
  isShow.value = false;
};

const cropper = ref(null);
const handleSubmitImage = () => {
  cropper.value.getCropData(
    data => {
      userInfos.sysUserAvatar = data;
      userInfos.avatar = data;
      fetchUpdateUser(userInfos).then(res => {
        message("更新信息成功", { type: "success" });
        isShow.value = false;
      });
      emit("updated:user", userInfos);
    },
    "image/jpeg",
    {
      maxWidth: 100,
      maxHeight: 100
    }
  );
};

// 更新信息
const onSubmit = async (formEl: FormInstance) => {
  await formEl.validate((valid, fields) => {
    if (valid) {
      fetchUpdateUser(userInfos).then(res => {
        message("更新信息成功", { type: "success" });
      });
    } else {
      console.log("error submit!", fields);
    }
  });
};

getMine().then(res => {
  Object.assign(userInfos, res.data);
});
</script>

<template>
  <div
    :class="[
      'min-w-[180px]',
      showTitle
        ? deviceDetection()
          ? 'max-w-[100%]'
          : 'max-w-[70%]'
        : 'max-w-[100%]'
    ]"
  >
    <h3 v-if="showTitle" class="my-8">{{ $t("button.profile") }}</h3>
    <el-form
      ref="userInfoFormRef"
      label-position="top"
      :rules="rules"
      :model="userInfos"
    >
      <el-form-item :label="$t('field.avatar')">
        <el-avatar :size="80" :src="userInfos.avatar" />
        <el-upload
          ref="uploadRef"
          accept="image/*"
          action="#"
          :limit="1"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onChange"
        >
          <el-button plain class="ml-4">
            <IconifyIconOffline :icon="uploadLine" />
            <span class="ml-2">{{ $t("button.updateAvatar") }}</span>
          </el-button>
        </el-upload>
      </el-form-item>
      <el-form-item :label="$t('field.nickname')" prop="sysUserNickname">
        <el-input
          v-model="userInfos.sysUserNickname"
          placeholder="请输入昵称"
        />
      </el-form-item>
      <el-form-item :label="$t('field.email')" prop="sysUserEmail">
        <el-autocomplete
          v-model="userInfos.sysUserEmail"
          :fetch-suggestions="queryEmail"
          :trigger-on-focus="false"
          placeholder="请输入邮箱"
          clearable
          class="w-full"
        />
      </el-form-item>
      <el-form-item :label="$t('field.phone')">
        <el-input
          v-model="userInfos.sysUserPhone"
          placeholder="请输入联系电话"
          clearable
        />
      </el-form-item>
      <el-form-item :label="$t('field.description')">
        <el-input
          v-model="userInfos.description"
          placeholder="请输入简介"
          type="textarea"
          :autosize="{ minRows: 6, maxRows: 8 }"
          maxlength="56"
          show-word-limit
        />
      </el-form-item>
      <el-button type="primary" @click="onSubmit(userInfoFormRef)">
        {{ $t("button.updateInfo") }}
      </el-button>
    </el-form>
    <el-dialog
      v-model="isShow"
      width="40%"
      :title="$t('button.updateAvatar')"
      destroy-on-close
      :closeOnClickModal="false"
      :before-close="handleClose"
      :fullscreen="deviceDetection()"
    >
      <sc-cropper ref="cropper" :src="imgSrc" />
      <template #footer>
        <div class="dialog-footer">
          <el-button bg text @click="handleClose">
            {{ $t("button.cancel") }}
          </el-button>
          <el-button bg text type="primary" @click="handleSubmitImage">
            {{ $t("button.confirm") }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
