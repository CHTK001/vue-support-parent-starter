<template>
  <div class="verification-container">
    <input v-for="(code, index) in verificationCodes" :key="index" v-model="verificationCodes[index]" @input="handleInput(index, $event)" @keydown="handleKeyDown(index, $event)" maxlength="1" class="verification-input" />
  </div>
</template>

<script setup>
import { ref, nextTick, defineEmits, defineExpose } from 'vue';
const verificationCodes = ref(['', '', '', '', '', '']);

const emit = defineEmits(['complete', 'change']);

window.addEventListener('paste', e => {
  const clipboardData = event.clipboardData || window.clipboardData;
  const pastedText = clipboardData.getData('text');
  let text = pastedText;
  if (pastedText.length > 6) {
    text = pastedText.substring(0, 6);
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    verificationCodes.value[i] = char;
  }
  const _value = verificationCodes.value.join("");
  if (_value.length == 6) {
    emit("onComplete", _value)
  }
})
const handleInput = (index, event) => {
  const value = event.target.value;
  verificationCodes.value[index] = value;
  const _value = verificationCodes.value.join("");
  // 自动跳到下一个输入框
  if (value && index < verificationCodes.value.length - 1) {
    const nextInput = event.target.nextElementSibling;
    if (nextInput) {
      nextTick(() => {
        emit("onChange", _value)
        nextInput.focus();
      });
    }
    return;
  }
  if (_value.length == 6) {
    console.log("完成" + _value)
    emit("onComplete", _value)

  }

};

const clear = () => {
  verificationCodes.value = ['', '', '', '', '', '']
}
const handleKeyDown = (index, event) => {
  // 处理删除操作
  if (event.key === 'Backspace' && !event.target.value && index > 0) {
    const prevInput = event.target.previousElementSibling;
    if (prevInput) {
      nextTick(() => {
        prevInput.focus();
      });
    }
  }
};

defineExpose({
  clear,
});
</script>

<style lang="scss" scoped>
.verification-container {
  display: flex;
}

.verification-input {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  text-align: center;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.verification-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px #007bff;
}
</style>