<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getKeys, saveKey, delKey, getIdentities, saveIdentity, delIdentity, generateKeyPair } from '../api';

/** SSH 密钥（脱敏返回：无私钥/口令字段） */
interface KeyRow {
  id: number;
  msServerKeyName: string;
  msServerKeyType?: string;
  msServerKeyPublicKey?: string;
}

/** 登录身份（脱敏返回） */
interface IdentityRow {
  id: number;
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityKeyId?: number | null;
}

/** 密钥与身份数据 */
const keys = ref<KeyRow[]>([]);
const identities = ref<IdentityRow[]>([]);

/** 密钥表单对话框 */
const keyFormVisible = ref(false);
const editingKeyId = ref<number | null>(null);
const keyForm = ref({ msServerKeyName: '', msServerKeyType: 'RSA', msServerKeyPublicKey: '', msServerKeyPrivateKey: '', msServerKeyPassword: '' });

/** 身份表单对话框 */
const identityFormVisible = ref(false);
const editingIdentityId = ref<number | null>(null);
const identityForm = ref({
  msServerIdentityName: '',
  msServerIdentityAuthType: 'PASSWORD',
  msServerIdentityUsername: 'root',
  msServerIdentityPassword: '',
  msServerIdentityKeyId: null as number | null,
});

/** 生成密钥对话框 */
const genFormVisible = ref(false);
const genForm = ref({ name: '', type: 'RSA', password: '', remark: '' });
const genResult = ref<{ publicKey: string; privateKey: string } | null>(null);
const genLoading = ref(false);

async function openGenForm() {
  genForm.value = { name: '', type: 'RSA', password: '', remark: '' };
  genResult.value = null;
  genFormVisible.value = true;
}

async function doGenerate() {
  if (!genForm.value.name.trim()) {
    ElMessage.warning('密钥名称不能为空');
    return;
  }
  genLoading.value = true;
  try {
    genResult.value = await generateKeyPair(genForm.value.name, genForm.value.type, genForm.value.password || undefined, genForm.value.remark || undefined);
    ElMessage.success('密钥已生成并保存');
    refresh();
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    genLoading.value = false;
  }
}

onMounted(refresh);

/**
 * 刷新密钥与身份列表
 */
async function refresh(): Promise<void> {
  try {
    const [keyList, identityList] = await Promise.all([getKeys(), getIdentities()]);
    keys.value = keyList ?? [];
    identities.value = identityList ?? [];
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

/**
 * 打开密钥表单
 *
 * @param row 编辑中的密钥，null 表示新增
 */
function openKeyForm(row?: KeyRow): void {
  editingKeyId.value = row?.id ?? null;
  keyForm.value = {
    msServerKeyName: row?.msServerKeyName ?? '',
    msServerKeyType: row?.msServerKeyType ?? 'RSA',
    msServerKeyPublicKey: row?.msServerKeyPublicKey ?? '',
    // 编辑时私钥/口令留空表示"保持不变"
    msServerKeyPrivateKey: '',
    msServerKeyPassword: '',
  };
  keyFormVisible.value = true;
}

/**
 * 提交密钥表单
 */
async function submitKey(): Promise<void> {
  if (!keyForm.value.msServerKeyName.trim()) {
    ElMessage.warning('名称不能为空');
    return;
  }
  try {
    await saveKey(editingKeyId.value, { ...keyForm.value });
    ElMessage.success('已保存');
    keyFormVisible.value = false;
    refresh();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

/**
 * 删除密钥
 *
 * @param row 密钥
 */
async function deleteKey(row: KeyRow): Promise<void> {
  await ElMessageBox.confirm(`确认删除密钥 ${row.msServerKeyName}?`, '删除', { type: 'warning' });
  await delKey(row.id);
  ElMessage.success('已删除');
  refresh();
}

/**
 * 打开身份表单
 *
 * @param row 编辑中的身份，null 表示新增
 */
function openIdentityForm(row?: IdentityRow): void {
  editingIdentityId.value = row?.id ?? null;
  identityForm.value = {
    msServerIdentityName: row?.msServerIdentityName ?? '',
    msServerIdentityAuthType: row?.msServerIdentityAuthType ?? 'PASSWORD',
    msServerIdentityUsername: row?.msServerIdentityUsername ?? 'root',
    msServerIdentityPassword: '',
    msServerIdentityKeyId: row?.msServerIdentityKeyId ?? null,
  };
  identityFormVisible.value = true;
}

/**
 * 提交身份表单
 */
async function submitIdentity(): Promise<void> {
  if (!identityForm.value.msServerIdentityName.trim()) {
    ElMessage.warning('名称不能为空');
    return;
  }
  try {
    await saveIdentity(editingIdentityId.value, { ...identityForm.value });
    ElMessage.success('已保存');
    identityFormVisible.value = false;
    refresh();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

/**
 * 删除身份
 *
 * @param row 身份
 */
async function deleteIdentity(row: IdentityRow): Promise<void> {
  await ElMessageBox.confirm(`确认删除身份 ${row.msServerIdentityName}?`, '删除', { type: 'warning' });
  await delIdentity(row.id);
  ElMessage.success('已删除');
  refresh();
}
</script>

<template>
  <div class="credential-tab sc-page">
    <el-row :gutter="16">
      <!-- SSH 密钥库 -->
      <el-col :span="12">
        <div class="panel">
          <div class="panel-head">
            <h4>SSH 密钥库</h4>
            <div style="display: flex; gap: 6px;">
              <el-button size="small" @click="openGenForm()">生成密钥</el-button>
              <el-button type="primary" size="small" @click="openKeyForm()">新增密钥</el-button>
            </div>
          </div>
          <el-table :data="keys" size="small" border>
            <el-table-column prop="msServerKeyName" label="名称" min-width="120" />
            <el-table-column prop="msServerKeyType" label="类型" width="90" />
            <el-table-column label="操作" width="130">
              <template #default="{ row }">
                <el-button link size="small" @click="openKeyForm(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deleteKey(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <!-- 登录身份 -->
      <el-col :span="12">
        <div class="panel">
          <div class="panel-head">
            <h4>登录身份</h4>
            <el-button type="primary" size="small" @click="openIdentityForm()">新增身份</el-button>
          </div>
          <el-table :data="identities" size="small" border>
            <el-table-column prop="msServerIdentityName" label="名称" min-width="110" />
            <el-table-column prop="msServerIdentityUsername" label="用户名" width="100" />
            <el-table-column prop="msServerIdentityAuthType" label="认证" width="100" />
            <el-table-column label="操作" width="130">
              <template #default="{ row }">
                <el-button link size="small" @click="openIdentityForm(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deleteIdentity(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <!-- 密钥表单 -->
    <el-dialog v-model="keyFormVisible" :title="editingKeyId ? '编辑密钥' : '新增密钥'" width="520px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="keyForm.msServerKeyName" placeholder="如 ubuntu-prod-key" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="keyForm.msServerKeyType" style="width: 100%">
            <el-option value="RSA" label="RSA" />
            <el-option value="ED25519" label="ED25519" />
            <el-option value="ECDSA" label="ECDSA" />
          </el-select>
        </el-form-item>
        <el-form-item label="公钥">
          <el-input v-model="keyForm.msServerKeyPublicKey" type="textarea" :rows="3" placeholder="ssh-rsa AAAA..." />
        </el-form-item>
        <el-form-item label="私钥">
          <el-input
            v-model="keyForm.msServerKeyPrivateKey"
            type="textarea"
            :rows="5"
            :placeholder="editingKeyId ? '留空保持不变；粘贴 PEM 私钥内容以更新' : '-----BEGIN OPENSSH PRIVATE KEY-----'"
          />
        </el-form-item>
        <el-form-item label="口令">
          <el-input v-model="keyForm.msServerKeyPassword" type="password" show-password placeholder="私钥口令，可空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="keyFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitKey">保存</el-button>
      </template>
    </el-dialog>

    <!-- 身份表单 -->
    <el-dialog v-model="identityFormVisible" :title="editingIdentityId ? '编辑身份' : '新增身份'" width="480px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="identityForm.msServerIdentityName" placeholder="如 root@prod" />
        </el-form-item>
        <el-form-item label="认证类型">
          <el-radio-group v-model="identityForm.msServerIdentityAuthType">
            <el-radio value="PASSWORD">密码</el-radio>
            <el-radio value="PUBLIC_KEY">公钥</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="identityForm.msServerIdentityUsername" />
        </el-form-item>
        <el-form-item v-if="identityForm.msServerIdentityAuthType === 'PASSWORD'" label="密码">
          <el-input
            v-model="identityForm.msServerIdentityPassword"
            type="password"
            show-password
            :placeholder="editingIdentityId ? '留空保持不变' : '登录密码'"
          />
        </el-form-item>
        <el-form-item v-else label="引用密钥">
          <el-select v-model="identityForm.msServerIdentityKeyId" style="width: 100%" placeholder="选择密钥库条目">
            <el-option v-for="k in keys" :key="k.id" :value="k.id" :label="k.msServerKeyName" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="identityFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitIdentity">保存</el-button>
      </template>
    </el-dialog>

    <!-- 生成密钥对话框 -->
    <el-dialog v-model="genFormVisible" title="生成SSH密钥对" width="640px" append-to-body>
      <template v-if="!genResult">
        <el-form label-width="80px">
          <el-form-item label="名称" required>
            <el-input v-model="genForm.name" placeholder="如 prod-key-2026" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="genForm.type" style="width: 100%">
              <el-option value="RSA" label="RSA (4096位)" />
              <el-option value="ED25519" label="ED25519" />
              <el-option value="ECDSA" label="ECDSA (256位)" />
            </el-select>
          </el-form-item>
          <el-form-item label="口令">
            <el-input v-model="genForm.password" type="password" show-password placeholder="私钥加密口令，可空" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="genForm.remark" type="textarea" :rows="2" placeholder="可选备注" />
          </el-form-item>
        </el-form>
      </template>
        <template v-else>
        <el-alert title="密钥已生成并保存到密钥库" type="success" :closable="false" show-icon style="margin-bottom: 12px" />
        <el-form label-width="80px">
          <el-form-item label="公钥">
            <el-input :model-value="genResult.publicKey" type="textarea" :rows="4" readonly />
          </el-form-item>
          <el-form-item label="私钥">
            <el-input :model-value="genResult.privateKey" type="textarea" :rows="8" readonly />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button v-if="!genResult" @click="genFormVisible = false">取消</el-button>
        <el-button v-if="!genResult" type="primary" @click="doGenerate" :loading="genLoading">生成</el-button>
        <el-button v-else @click="genFormVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.credential-tab {
  .panel {
    background: var(--el-bg-color);
    border-radius: 8px;
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h4 {
      margin: 0;
      font-size: 14px;
    }
  }
}
</style>
