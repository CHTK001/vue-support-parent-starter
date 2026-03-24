<template>
  <el-container class="email-container">
    <el-main>
      <h2>写邮件</h2>
      <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
        <el-form-item label="发件账户" prop="accountId">
          <el-select v-model="form.accountId" placeholder="选择发件账户">
            <el-option
              v-for="account in accounts"
              :key="account.id"
              :label="account.displayName || account.emailAddress"
              :value="account.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="收件人" prop="to">
          <el-input
            v-model="form.to"
            placeholder="请输入收件人邮箱，多个用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="抄送">
          <el-input v-model="form.cc" placeholder="抄送邮箱，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="主题" prop="subject">
          <el-input v-model="form.subject" placeholder="请输入邮件主题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="15"
            placeholder="请输入邮件内容"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            multiple
          >
            <el-button>
              <el-icon><Paperclip /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持多个文件，单个文件不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="sendEmail" :loading="sending">
            发送
          </el-button>
          <el-button @click="saveDraft">保存草稿</el-button>
          <el-button @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
} from "element-plus";
import { Paperclip } from "@element-plus/icons-vue";
import {
} from "../../api/email";
import { useEmailStore } from "../../stores/email";

const router = useRouter();
const route = useRoute();
const emailStore = useEmailStore();
const formRef = ref<FormInstance>();
const uploadRef = ref<UploadInstance>();
const sending = ref(false);
const accounts = ref<EmailAccount[]>([]);
const draftId = ref<string>();
const fileList = ref<UploadFile[]>([]);

const form = ref({
});

const rules: FormRules = {
};

const loadAccounts = async () => {
  try {
    const res: any = await accountApi.getAccountList();
    if (res.success) {
      accounts.value = res.data || [];
      // 设置默认账户
      const defaultAccount = accounts.value.find((a) => a.isDefault);
      if (defaultAccount?.id) {
        form.value.accountId = defaultAccount.id;
      }
    }
  } catch (error) {
    ElMessage.error("加载账户列表失败");
  }
};

const loadDraft = () => {
  // 从路由参数加载草稿
  const queryDraftId = route.query.draftId as string;
  if (queryDraftId) {
    draftId.value = queryDraftId;
    const savedDrafts = localStorage.getItem("email_drafts");
    if (savedDrafts) {
      const drafts = JSON.parse(savedDrafts);
      const draft = drafts.find((d: any) => d.id === queryDraftId);
      if (draft) {
        form.value.accountId = draft.accountId || "";
        form.value.to = draft.toAddresses?.join(", ") || "";
        form.value.cc = draft.ccAddresses?.join(", ") || "";
        form.value.subject = draft.subject || "";
        form.value.content = draft.contentText || "";
      }
    }
  }

  // 处理回复
  if (route.query.replyTo) {
    form.value.to = (route.query.to as string) || "";
    form.value.subject = (route.query.subject as string) || "";
  }

  // 处理转发
  if (route.query.forward) {
    form.value.subject = (route.query.subject as string) || "";
    form.value.content = (route.query.content as string) || "";
  }
};

const sendEmail = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      sending.value = true;
      try {
        // 先上传附件
        let attachmentIds: string[] = [];
        if (fileList.value.length > 0) {
          const files = fileList.value.map((f) => f.raw!).filter((f) => f);
          const uploadRes: any = await attachmentApi.uploadAttachments(files);
          if (uploadRes.success) {
            attachmentIds = uploadRes.data.map((a: any) => a.id);
          }
        }

        const emailData = {
          accountId: form.value.accountId,
          toAddresses: form.value.to.split(",").map((s) => s.trim()),
          ccAddresses: form.value.cc
            ? form.value.cc.split(",").map((s) => s.trim())
            : [],
          subject: form.value.subject,
          contentText: form.value.content,
          attachmentIds,
        };

        await emailApi.sendEmail(emailData);
        ElMessage.success("邮件发送成功");

        // 删除草稿（如果是从草稿发送的）
        if (draftId.value) {
          deleteDraftById(draftId.value);
        }

        router.push("/inbox");
      } catch (error: any) {
        ElMessage.error(error.message || "邮件发送失败");
      } finally {
        sending.value = false;
      }
    }
  });
};

const saveDraft = () => {
  try {
    // 从 localStorage 加载现有草稿
    const savedDrafts = localStorage.getItem("email_drafts");
    let drafts = savedDrafts ? JSON.parse(savedDrafts) : [];

    const draft = {
      id: draftId.value || `draft_${Date.now()}`,
      accountId: form.value.accountId,
      toAddresses: form.value.to
        ? form.value.to.split(",").map((s) => s.trim())
        : [],
      ccAddresses: form.value.cc
        ? form.value.cc.split(",").map((s) => s.trim())
        : [],
      subject: form.value.subject,
      contentText: form.value.content,
      updatedAt: new Date(),
    };

    // 如果是更新现有草稿
    if (draftId.value) {
      const index = drafts.findIndex((d: any) => d.id === draftId.value);
      if (index > -1) {
        drafts[index] = draft;
      } else {
        drafts.push(draft);
      }
    } else {
      drafts.push(draft);
      draftId.value = draft.id;
    }

    localStorage.setItem("email_drafts", JSON.stringify(drafts));
    ElMessage.success("草稿已保存");
  } catch (error) {
    ElMessage.error("保存草稿失败");
  }
};

const deleteDraftById = (id: string) => {
  try {
    const savedDrafts = localStorage.getItem("email_drafts");
    if (savedDrafts) {
      let drafts = JSON.parse(savedDrafts);
      drafts = drafts.filter((d: any) => d.id !== id);
      localStorage.setItem("email_drafts", JSON.stringify(drafts));
    }
  } catch (error) {
    console.error("删除草稿失败", error);
  }
};

const cancel = () => {
  router.push("/inbox");
};

const handleFileChange = (file: UploadFile) => {
  // 检查文件大小
  if (file.size && file.size > 10 * 1024 * 1024) {
    ElMessage.error("文件大小不能超过 10MB");
    return false;
  }
};

const handleFileRemove = (file: UploadFile) => {
  const index = fileList.value.findIndex((f) => f.uid === file.uid);
  if (index > -1) {
    fileList.value.splice(index, 1);
  }
};

onMounted(() => {
  loadAccounts();
  loadDraft();
});
</script>

<style scoped>
.email-container {
  height: 100vh;
}
</style>
