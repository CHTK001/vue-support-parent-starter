<template>
  <div class="sc-form-example">
    <DemoBlock title="基础表单" :code="codes.basic">
      <ScForm
        :model="form"
        label-width="90px"
        size="default"
        class="demo-form"
      >
        <ScRow :gutter="16">
          <ScCol :span="12">
            <ScFormItem label="用户名">
              <ScInput v-model="form.username" placeholder="请输入用户名" />
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="年龄">
              <ScInputNumber v-model="form.age" :min="0" :max="120" />
            </ScFormItem>
          </ScCol>
        </ScRow>

        <ScRow :gutter="16">
          <ScCol :span="12">
            <ScFormItem label="性别">
              <ScRadioGroup v-model="form.gender">
                <ScRadio label="male">男</ScRadio>
                <ScRadio label="female">女</ScRadio>
              </ScRadioGroup>
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="兴趣爱好">
              <ScCheckboxGroup v-model="form.hobbies">
                <ScCheckbox label="code">编程</ScCheckbox>
                <ScCheckbox label="music">音乐</ScCheckbox>
                <ScCheckbox label="sport">运动</ScCheckbox>
              </ScCheckboxGroup>
            </ScFormItem>
          </ScCol>
        </ScRow>

        <ScFormItem label="所在地区">
          <ScRegion v-model="form.region" />
        </ScFormItem>

        <ScFormItem>
          <ScButton type="primary">提交</ScButton>
          <ScButton type="default" style="margin-left: 8px">重置</ScButton>
        </ScFormItem>
      </ScForm>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import {
  ScButton,
  ScCheckbox,
  ScCheckboxGroup,
  ScForm,
  ScFormItem,
  ScInput,
  ScInputNumber,
  ScRadio,
  ScRadioGroup,
  ScRegion,
  ScRow,
  ScCol,
} from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const form = reactive({
  username: "",
  age: 26,
  gender: "male",
  hobbies: ["code"],
  region: [],
});

const codes = {
  basic: `<ScForm :model="form" label-width="90px">
  <ScRow :gutter="16">
    <ScCol :span="12">
      <ScFormItem label="用户名">
        <ScInput v-model="form.username" placeholder="请输入用户名" />
      </ScFormItem>
    </ScCol>
    <ScCol :span="12">
      <ScFormItem label="年龄">
        <ScInputNumber v-model="form.age" :min="0" :max="120" />
      </ScFormItem>
    </ScCol>
  </ScRow>
  <ScRow :gutter="16">
    <ScCol :span="12">
      <ScFormItem label="性别">
        <ScRadioGroup v-model="form.gender">
          <ScRadio label="male">男</ScRadio>
          <ScRadio label="female">女</ScRadio>
        </ScRadioGroup>
      </ScFormItem>
    </ScCol>
    <ScCol :span="12">
      <ScFormItem label="兴趣爱好">
        <ScCheckboxGroup v-model="form.hobbies">
          <ScCheckbox label="code">编程</ScCheckbox>
          <ScCheckbox label="music">音乐</ScCheckbox>
          <ScCheckbox label="sport">运动</ScCheckbox>
        </ScCheckboxGroup>
      </ScFormItem>
    </ScCol>
  </ScRow>
  <ScFormItem label="所在地区">
    <ScRegion v-model="form.region" />
  </ScFormItem>
  <ScFormItem>
    <ScButton type="primary">提交</ScButton>
    <ScButton type="default" style="margin-left: 8px">重置</ScButton>
  </ScFormItem>
</ScForm>`,
};
</script>

<style scoped lang="scss">
.sc-form-example {
  padding: 20px;

  .demo-form {
    max-width: 820px;
  }
}
</style>


