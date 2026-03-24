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
  translation: (langCode: string) => void;
}

export function useTranslationLang(ref?: Ref): TranslationLangReturn {
  const { $storage, changeTitle, handleResize } = useNav();
  const { locale, t } = useI18n();
  const route = useRoute();

  /**
   * 通用的语言切换函数
   * @param langCode - 语言代码
   */
  function translation(langCode: string) {
    $storage.locale = { locale: langCode };
    locale.value = langCode;
    ref && handleResize(ref.value);
  }

  function translationCh() {
    translation("zh-CN");
  }

  function translationEn() {
    translation("en-US");
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
    translation,
  };
}
