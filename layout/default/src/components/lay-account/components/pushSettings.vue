<template>
  <div>
    <h3 class="my-8">{{ $t("buttons.pushSettings") }}</h3>
    <ScForm ref="form" label-width="180px" label-position="left" style="margin-top: 20px">
      <ScFormItem label="有新的待办">
        <ScCheckbox v-model="form.new">短信推送</ScCheckbox>
        <ScCheckbox v-model="form.new_wx">微信推送</ScCheckbox>
      </ScFormItem>
      <ScFormItem label="待办有效时剩24小时">
        <ScCheckbox v-model="form.timeout">短信推送</ScCheckbox>
        <ScCheckbox v-model="form.timeout_wx">微信推送</ScCheckbox>
      </ScFormItem>
    </ScForm>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        new: true,
        timeout: true
      }
    };
  }
};
</script>

<style></style>
