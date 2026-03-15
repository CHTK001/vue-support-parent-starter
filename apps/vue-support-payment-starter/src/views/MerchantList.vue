<template>
  <div class="merchant-list">
    <ScCard>
      <template #header>
        <div class="card-header">
          <span>商户管理</span>
          <ScButton type="primary" @click="showCreateDialog">添加商户</ScButton>
        </div>
      </template>

      <!-- 商户列表 -->
      <ScTable :data="merchantList" border stripe v-loading="loading">
        <ScTableColumn prop="merchantName" label="商户名称" />
        <ScTableColumn prop="provider" label="支付提供商" width="120">
          <template #default="{ row }">
            <ScTag>{{ getProviderLabel(row.provider) }}</ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="appId" label="AppID" width="200" />
        <ScTableColumn prop="mchId" label="商户号" width="150" />
        <ScTableColumn prop="enabled" label="状态" width="100">
          <template #default="{ row }">
            <ScSwitch v-model="row.enabled" @change="handleToggleStatus(row)" />
          </template>
        </ScTableColumn>
        <ScTableColumn prop="sandbox" label="沙箱模式" width="100">
          <template #default="{ row }">
            <ScTag :type="row.sandbox ? 'warning' : 'success'">
              {{ row.sandbox ? '是' : '否' }}
            </ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="createTime" label="创建时间" width="180" />
        <ScTableColumn label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <ScButton size="small" @click="handleEdit(row)">编辑</ScButton>
            <ScButton size="small" type="primary" @click="handleTest(row)">测试</ScButton>
            <ScButton size="small" type="danger" @click="handleDelete(row)">删除</ScButton>
          </template>
        </ScTableColumn>
      </ScTable>

      <!-- 分页 -->
      <ScPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </ScCard>

    <!-- 创建/编辑商户对话框 -->
    <ScDialog v-model="dialogVisible" :title="isEdit ? '编辑商户' : '添加商户'" width="700px">
      <ScForm :model="form" :rules="rules" ref="formRef" label-width="120px">
        <ScFormItem label="商户名称" prop="merchantName">
          <ScInput v-model="form.merchantName" placeholder="请输入商户名称" />
        </ScFormItem>
        <ScFormItem label="支付提供商" prop="provider">
          <ScSelect v-model="form.provider" placeholder="请选择支付提供商">
            <ScOption label="微信支付" value="wechat" />
            <ScOption label="支付宝支付" value="alipay" />
            <ScOption label="聚合支付" value="ijpay" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="AppID" prop="appId">
          <ScInput v-model="form.appId" placeholder="请输入AppID" />
        </ScFormItem>
        <ScFormItem label="商户号" prop="mchId" v-if="form.provider === 'wechat'">
          <ScInput v-model="form.mchId" placeholder="请输入商户号" />
        </ScFormItem>
        <ScFormItem label="API密钥" prop="apiKey">
          <ScInput v-model="form.apiKey" type="password" placeholder="请输入API密钥" show-password />
        </ScFormItem>
        <ScFormItem label="证书路径" prop="certPath" v-if="form.provider === 'wechat'">
          <ScInput v-model="form.certPath" placeholder="请输入证书路径（可选）" />
        </ScFormItem>
        <ScFormItem label="支付宝公钥" prop="alipayPublicKey" v-if="form.provider === 'alipay'">
          <ScInput v-model="form.alipayPublicKey" type="textarea" :rows="3" placeholder="请输入支付宝公钥" />
        </ScFormItem>
        <ScFormItem label="回调地址" prop="notifyUrl">
          <ScInput v-model="form.notifyUrl" placeholder="请输入回调地址" />
        </ScFormItem>
        <ScFormItem label="返回地址" prop="returnUrl">
          <ScInput v-model="form.returnUrl" placeholder="请输入返回地址（可选）" />
        </ScFormItem>
        <ScFormItem label="沙箱模式" prop="sandbox">
          <ScSwitch v-model="form.sandbox" />
        </ScFormItem>
        <ScFormItem label="启用状态" prop="enabled">
          <ScSwitch v-model="form.enabled" />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="dialogVisible = false">取消</ScButton>
        <ScButton type="primary" @click="handleSubmit" :loading="submitting">确定</ScButton>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  getMerchantList,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  testMerchantConnection,
} from '../api/payment';
import type { MerchantConfig } from '../types/payment';

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 商户列表
const merchantList = ref<MerchantConfig[]>([]);
const loading = ref(false);

// 对话框
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

// 表单
const form = reactive<Partial<MerchantConfig>>({
  merchantName: '',
  provider: 'wechat',
  appId: '',
  mchId: '',
  apiKey: '',
  certPath: '',
  notifyUrl: '',
  returnUrl: '',
  alipayPublicKey: '',
  sandbox: false,
  enabled: true,
});

const rules: FormRules = {
  merchantName: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择支付提供商', trigger: 'change' }],
  appId: [{ required: true, message: '请输入AppID', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API密钥', trigger: 'blur' }],
  notifyUrl: [{ required: true, message: '请输入回调地址', trigger: 'blur' }],
};

// 加载商户列表
const loadMerchantList = async () => {
  loading.value = true;
  try {
    const res = await getMerchantList({
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    merchantList.value = res.data.list;
    pagination.total = res.data.total;
  } catch (error) {
    ElMessage.error('加载商户列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取提供商标签
const getProviderLabel = (provider: string) => {
  const map: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    ijpay: '聚合支付',
  };
  return map[provider] || provider;
};

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 编辑商户
const handleEdit = (merchant: MerchantConfig) => {
  isEdit.value = true;
  Object.assign(form, merchant);
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submitting.value = true;
    try {
      if (isEdit.value && form.id) {
        await updateMerchant(form.id, form);
        ElMessage.success('商户更新成功');
      } else {
        await createMerchant(form);
        ElMessage.success('商户创建成功');
      }
      dialogVisible.value = false;
      loadMerchantList();
    } catch (error) {
      ElMessage.error(isEdit.value ? '商户更新失败' : '商户创建失败');
    } finally {
      submitting.value = false;
    }
  });
};

// 切换状态
const handleToggleStatus = async (merchant: MerchantConfig) => {
  try {
    await updateMerchant(merchant.id!, { enabled: merchant.enabled });
    ElMessage.success('状态更新成功');
  } catch (error) {
    ElMessage.error('状态更新失败');
    merchant.enabled = !merchant.enabled;
  }
};

// 测试连接
const handleTest = async (merchant: MerchantConfig) => {
  try {
    const res = await testMerchantConnection(merchant.id!);
    if (res.data) {
      ElMessage.success('连接测试成功');
    } else {
      ElMessage.error('连接测试失败');
    }
  } catch (error) {
    ElMessage.error('连接测试失败');
  }
};

// 删除商户
const handleDelete = async (merchant: MerchantConfig) => {
  try {
    await ElMessageBox.confirm('确定要删除该商户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    await deleteMerchant(merchant.id!);
    ElMessage.success('商户删除成功');
    loadMerchantList();
  } catch (error) {
    // 用户取消操作
  }
};

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    merchantName: '',
    provider: 'wechat',
    appId: '',
    mchId: '',
    apiKey: '',
    certPath: '',
    notifyUrl: '',
    returnUrl: '',
    alipayPublicKey: '',
    sandbox: false,
    enabled: true,
  });
};

// 分页变化
const handleSizeChange = () => {
  loadMerchantList();
};

const handleCurrentChange = () => {
  loadMerchantList();
};

onMounted(() => {
  loadMerchantList();
});
</script>

<style scoped>
.merchant-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
