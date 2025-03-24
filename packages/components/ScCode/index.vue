<template>
  <form class="otp-Form">
    <div class="verification-container flex justify-center inputContainer">
      <input v-for="(code, index) in verificationCodes" :key="index" v-model="verificationCodes[index]" @input="handleInput(index, $event)" @keydown="handleKeyDown(index, $event)" maxlength="1" class="verification-input otp-input" />
    </div>
  </form>
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
    emit("onChange", _value)
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
    emit("onChange", _value)
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
/* From Uiverse.io by vinodjangid07 */ 
.otp-Form {
  background-color: rgb(255, 255, 255);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 15px;
}


.inputContainer {
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.otp-input {
  background-color: rgb(228, 228, 228);
  width: 30px;
  height: 30px;
  text-align: center;
  border: none;
  border-radius: 7px;
  caret-color: rgb(127, 129, 255);
  color: rgb(44, 44, 44);
  outline: none;
  font-weight: 600;
}

.otp-input:focus,
.otp-input:valid {
  background-color: rgba(127, 129, 255, 0.199);
  transition-duration: .3s;
}

.verifyButton {
  width: 100%;
  height: 30px;
  border: none;
  background-color: rgb(127, 129, 255);
  color: white;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  transition-duration: .2s;
}

.verifyButton:hover {
  background-color: rgb(144, 145, 255);
  transition-duration: .2s;
}

.exitBtn {
  position: absolute;
  top: 5px;
  right: 5px;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.171);
  background-color: rgb(255, 255, 255);
  border-radius: 50%;
  width: 25px;
  height: 25px;
  border: none;
  color: black;
  font-size: 1.1em;
  cursor: pointer;
}

.resendNote {
  font-size: 0.7em;
  color: black;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.resendBtn {
  background-color: transparent;
  border: none;
  color: rgb(127, 129, 255);
  cursor: pointer;
  font-size: 1.1em;
  font-weight: 700;
}

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