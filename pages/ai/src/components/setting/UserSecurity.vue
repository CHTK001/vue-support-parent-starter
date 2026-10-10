<template>
  <div class="security-page">
    <SettingsCard title="修改密码" subtitle="定期更换密码以保障账号安全">
      <SettingsRow label="原密码" description="请输入当前正在使用的密码">
        <el-input
          v-model="passwordForm.oldPassword"
          type="password"
          show-password
          placeholder="请输入原密码"
          class="security-control"
        />
      </SettingsRow>

      <SettingsRow label="新密码" description="至少 6 位，建议字母与数字组合">
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          show-password
          placeholder="请输入新密码"
          class="security-control"
        />
      </SettingsRow>

      <SettingsRow label="确认新密码" description="再次输入新密码以确认">
        <el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
          class="security-control"
          @keyup.enter="handleChangePassword"
        />
      </SettingsRow>
    </SettingsCard>

    <div class="security-actions">
      <el-button @click="resetForm">清空</el-button>
      <el-button type="primary" :loading="changing" @click="handleChangePassword">
        确认修改
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePopup } from '../../composables/usePopup'
import { apiService } from '../../services/ApiService'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

const { toast } = usePopup()

const changing = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function resetForm() {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
}

const handleChangePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value
  if (!oldPassword) { toast.error('请输入原密码'); return }
  if (!newPassword || newPassword.length < 6) {
    toast.error('新密码至少 6 位')
    return
  }
  if (newPassword !== confirmPassword) {
    toast.error('两次输入的新密码不一致')
    return
  }

  changing.value = true
  try {
    await apiService.changePassword(oldPassword, newPassword, confirmPassword)
    resetForm()
    toast.success('密码修改成功')
  } catch (error) {
    toast.error(error.message || '密码修改失败')
  } finally {
    changing.value = false
  }
}

defineExpose({ resetForm })
</script>

<style scoped>
.security-page { max-width: 640px; }
.security-control { width: 260px; max-width: 100%; }

.security-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
</style>
