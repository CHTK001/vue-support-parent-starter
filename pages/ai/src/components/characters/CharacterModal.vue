<template>
    <ReDialog v-model="visible" :close-on-click-modal="false" width="900px"
        :style="{ height: '70vh', maxWidth: '90vw' }" class="character-setting-dialog" destroy-on-close append-to-body>
        <template #header>
            <div class="dialog-header">
                <span class="dialog-title">{{ currentCharacter?.id ? t('characters.modal.editTitle') : t('characters.modal.createTitle') }}</span>
            </div>
        </template>

        <div class="dialog-content">
            <CharacterSettingPanel ref="settingPanelRef" :data="currentCharacter" :is-new="!props.characterId" :simple="false" class="flex-1" />
        </div>

        <template #footer>
            <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
            <el-button type="primary" @click="handleSave" :loading="saving" :disabled="!panelHasChanges">{{ t('characters.modal.applyAll') }}</el-button>
        </template>
    </ReDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton } from 'element-plus'
import CharacterSettingPanel from './CharacterSettingPanel.vue'
import { apiService } from '../../services/ApiService'
import { usePopup } from '@/composables/usePopup'
import ReDialog from '@repo/ui/re-dialog'

const { toast } = usePopup()
const { t } = useI18n()

// Props
const props = defineProps<{
    show?: boolean;
    characterId?: string;
}>()

// Emits
const emit = defineEmits<{
    'saved': [character: any]
    'update:show': [show: boolean]
}>()

// 响应式数据
const visible = ref(false)
const saving = ref(false)
const currentCharacter = ref<any>({})
const settingPanelRef = ref<InstanceType<typeof CharacterSettingPanel> | null>(null)
const panelHasChanges = ref(true)

// 监听显示状态
watch(() => props.show, (newVal) => {
    visible.value = newVal
}, { immediate: true })

// 对话框每次打开：清空旧数据 + 重新 fetch（统一入口，避免重复请求）
watch(visible, async (newVal) => {
    if (!newVal) {
        emit('update:show', false)
        return
    }
    currentCharacter.value = {};
    if (props.characterId) {
        try {
            currentCharacter.value = await apiService.fetchCharacter(props.characterId);
        } catch (error) {
            console.error("[CharacterModal] Failed to fetch character:", error);
            currentCharacter.value = {};
        }
    }
})

// 关闭弹窗
const handleClose = (): void => {
    visible.value = false
}

// 同步子组件表单变更状态
watch(() => settingPanelRef.value, (instance) => {
    if (!instance) return;
    watch(() => instance.hasChanges, (val) => {
        panelHasChanges.value = val
    }, { immediate: true })
}, { immediate: true })

// 保存逻辑
const handleSave = async (): Promise<void> => {
    // 触发子组件的验证与数据获取
    if (!settingPanelRef.value) return;

    const isValid = await settingPanelRef.value.validate();
    if (!isValid) return;

    saving.value = true;
    try {
        const data = settingPanelRef.value.getFormData();
        let character: any = null;
        let characterId: any = currentCharacter.value?.id ?? null;
        const { avatarFile, avatarUrl: _avatarUrl, ...characterData } = data;

        if (characterId) {
            // 更新接口返回 boolean（非实体），不能依赖其返回 id
            await apiService.updateCharacter(characterId, characterData);
            character = { ...currentCharacter.value, ...characterData, id: characterId };
        } else {
            character = await apiService.createCharacter(characterData);
            characterId = character?.id ?? null;
        }

        if (avatarFile && characterId) {
            const response = await apiService.uploadAvatar(characterId, avatarFile);
            character.avatarUrl = response.url;
            settingPanelRef.value.clearAvatarFile();
        }

        // 非 build 形态的提示词走独立接口，必须等角色拿到 id 才能写。
        // 失败不阻断角色保存（主体已落库），只提示——否则会出现「角色没存上」的误导。
        const formPromptFailed = characterId
            ? await settingPanelRef.value.flushFormPrompt(characterId)
            : false;

        if (character) {
            currentCharacter.value = character;
        }

        if (formPromptFailed) {
            toast.error('角色已保存，但该形态的提示词保存失败，请重试');
        } else {
            toast.success(t('characters.modal.saveSuccess'));
        }
        emit('saved', currentCharacter.value);
        visible.value = false;
    } catch (error) {
        console.error("角色保存失败:", error);
        toast.error(t('characters.modal.saveFailed'));
    } finally {
        saving.value = false;
    }
}
</script>

<style scoped>
.dialog-header {
    display: flex;
    align-items: center;
    width: 100%;
}

.dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}
</style>

<style>
/* LDialog scoped styles handle dialog body/header — no global overrides needed */
</style>
