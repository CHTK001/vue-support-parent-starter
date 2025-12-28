import { useNav } from "./useNav";
import { useI18n, type Composer } from "vue-i18n";
import { useRoute, type RouteLocationNormalizedLoaded } from "vue-router";
import { watch, onBeforeMount, type Ref } from "vue";

interface TranslationLangReturn {
  t: Composer['t'];
  route: RouteLocationNormalizedLoaded;
  locale: Composer['locale'];
  translationCh: () => void;
  translationEn: () => void;
}

export function useTranslationLang(ref?: Ref): TranslationLangReturn {
  const { $storage, changeTitle, handleResize } = useNav();
  const { locale, t } = useI18n();
  const route = useRoute();

  function translationCh() {
    $storage.locale = { locale: "zh-CN" };
    locale.value = "zh-CN";
    ref && handleResize(ref.value);
  }

  function translationEn() {
    $storage.locale = { locale: "en-US" };
    locale.value = "en-US";
    ref && handleResize(ref.value);
  }

  watch(
    () => locale.value,
    () => {
      changeTitle(route.meta);
    }
  );

  onBeforeMount(() => {
    locale.value = $storage.locale?.locale ?? "zh-CN";
  });

  return {
    t,
    route,
    locale,
    translationCh,
    translationEn,
  };
}
