import { asyncIndexedDB } from "@repo/utils";

const KEY_PREFIX = "sc_filter_";

export default {
  //运算符
  operator: [
    {
      label: "等于",
      value: "="
    },
    {
      label: "不等于",
      value: "!="
    },
    {
      label: "大于",
      value: ">"
    },
    {
      label: "大于等于",
      value: ">="
    },
    {
      label: "小于",
      value: "<"
    },
    {
      label: "小于等于",
      value: "<="
    },
    {
      label: "包含",
      value: "include"
    },
    {
      label: "不包含",
      value: "notinclude"
    }
  ],
  //过滤结果运算符的分隔符
  separator: "|",
  //获取我的常用（从IndexedDB读取）
  getMy: async function (name) {
    try {
      const key = KEY_PREFIX + name;
      const db = asyncIndexedDB();
      const list: any[] = (await db.getItem(key)) || [];
      return list;
    } catch (error) {
      console.error("getMy error", error);
      return [];
    }
  },
  /**
   * 常用保存处理 返回resolve后继续操作
   * @name scFilterBar组件的props->filterName
   * @obj 过滤项整理好的对象
   */
  saveMy: async function (name, obj) {
    try {
      const key = KEY_PREFIX + name;
      const db = asyncIndexedDB();
      const list: any[] = (await db.getItem(key)) || [];
      list.push(obj);
      await db.setItem(key, list);
      return true;
    } catch (error) {
      console.error("saveMy error", error);
      return false;
    }
  },
  /**
   * 常用删除处理 返回resolve后继续操作
   * @name scFilterBar组件的props->filterName
   */
  delMy: async function (name, title) {
    try {
      const key = KEY_PREFIX + name;
      const db = asyncIndexedDB();
      const list: any[] = (await db.getItem(key)) || [];
      const newList = list.filter((it: any) => it.title !== title);
      await db.setItem(key, newList);
      return true;
    } catch (error) {
      console.error("delMy error", error);
      return false;
    }
  }
};
