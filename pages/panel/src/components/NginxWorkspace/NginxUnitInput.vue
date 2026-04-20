<template>
  <div class="nginx-unit-input">
    <ElInputNumber
      v-model="numberValue"
      class="nginx-unit-input__number"
      :min="min"
      :max="max"
      :step="step"
      controls-position="right"
      :placeholder="placeholder"
    />
    <ElSelect v-model="unitValue" class="nginx-unit-input__select">
      <ElOption v-for="item in units" :key="item.value" :label="item.label" :value="item.value" />
    </ElSelect>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElInputNumber, ElOption, ElSelect } from "element-plus";

type UnitOption = {
  label: string;
  value: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    units: UnitOption[];
    defaultUnit?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
  }>(),
  {
    modelValue: "",
    defaultUnit: "",
    placeholder: "",
    min: 0,
    step: 1,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const numberValue = ref<number | null>(null);
const unitValue = ref("");
const syncing = ref(false);

const resolvedDefaultUnit = computed(() => props.defaultUnit || props.units[0]?.value || "");

const parseValue = (value?: string) => {
  const text = String(value ?? "").trim();
  if (!text) {
    return { number: null, unit: resolvedDefaultUnit.value };
  }

  const orderedUnits = [...props.units].sort((a, b) => b.value.length - a.value.length);
  for (const unit of orderedUnits) {
    if (!unit.value) continue;
    if (text.endsWith(unit.value)) {
      const raw = text.slice(0, -unit.value.length).trim();
      const numeric = Number(raw);
      if (!Number.isNaN(numeric)) {
        return { number: numeric, unit: unit.value };
      }
    }
  }

  const match = text.match(/^(-?\d+(?:\.\d+)?)([a-zA-Z/%]+)?$/);
  if (match) {
    return {
      number: Number(match[1]),
      unit: match[2] ?? resolvedDefaultUnit.value,
    };
  }

  return { number: null, unit: resolvedDefaultUnit.value };
};

const syncFromModel = (value?: string) => {
  syncing.value = true;
  const parsed = parseValue(value);
  numberValue.value = parsed.number;
  unitValue.value = parsed.unit;
  queueMicrotask(() => {
    syncing.value = false;
  });
};

watch(
  () => props.modelValue,
  value => syncFromModel(value),
  { immediate: true }
);

watch([numberValue, unitValue], () => {
  if (syncing.value) return;
  if (numberValue.value === null || numberValue.value === undefined) {
    emit("update:modelValue", "");
    return;
  }
  emit("update:modelValue", `${numberValue.value}${unitValue.value}`);
});
</script>

<style scoped lang="scss">
.nginx-unit-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px;
  gap: 8px;
  width: 100%;
}

.nginx-unit-input__number,
.nginx-unit-input__select {
  width: 100%;
}
</style>
