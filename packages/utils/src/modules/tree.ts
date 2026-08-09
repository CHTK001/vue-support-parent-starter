/**
 * 树形结构工具（迁移自 koi/utils/index.ts 中无 i18n 依赖的部分）
 */

/** 路径匹配器（支持 * / ** 通配） */
export function isPathMatch(pattern: string, path: string): boolean {
  const regexPattern = pattern
    .replace(/\//g, "\\/")
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "[^\\/]*")
    .replace(/__DOUBLE_STAR__/g, ".*");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * 构造树型结构数据
 * @param data 数据源
 * @param id id 字段 默认 'id'
 * @param parentId 父节点字段 默认 'parentId'
 * @param children 孩子节点字段 默认 'children'
 */
export function handleTree(data: any, id?: any, parentId?: any, children?: any) {
  const config = {
    id: id || "id",
    parentId: parentId || "parentId",
    childrenList: children || "children",
  };

  const childrenListMap: any = {};
  const nodeIds: any = {};
  const tree: any = [];

  for (const d of data) {
    const pId = d[config.parentId];
    if (childrenListMap[pId] == null) {
      childrenListMap[pId] = [];
    }
    nodeIds[d[config.id]] = d;
    childrenListMap[pId].push(d);
  }

  for (const d of data) {
    const pId = d[config.parentId];
    if (nodeIds[pId] == null) {
      tree.push(d);
    }
  }

  for (const t of tree) {
    adaptToChildrenList(t);
  }

  function adaptToChildrenList(o: any) {
    if (childrenListMap[o[config.id]] !== null) {
      o[config.childrenList] = childrenListMap[o[config.id]];
    }
    if (o[config.childrenList]) {
      for (const c of o[config.childrenList]) {
        adaptToChildrenList(c);
      }
    }
  }

  return tree;
}

/** 将扁平列表转换为树形结构 */
export function handleToTree(data: any, id?: any, parentId?: any, children?: any) {
  const config = {
    id: id || "id",
    parentId: parentId || "parentId",
    childrenList: children || "children",
  };

  const map = new Map();
  const tree: any = [];

  data.forEach((item: any) => {
    const node = { ...item };
    node[config.childrenList] = [];
    map.set(String(node[config.id]), node);
  });

  data.forEach((item: any) => {
    const node = map.get(String(item[config.id]));
    const pId = String(item[config.parentId]);
    if (pId !== "null" && pId !== "undefined" && map.has(pId)) {
      map.get(pId)[config.childrenList].push(node);
    } else {
      tree.push(node);
    }
  });

  return tree;
}

/** 把日期范围构造成 beginTime AND endTime */
export function koiDatePicker(searchParams: object, dateRange: any, propName1?: string, propName2?: string) {
  searchParams = typeof searchParams === "object" && searchParams !== null && !Array.isArray(searchParams) ? searchParams : {};
  dateRange = Array.isArray(dateRange) ? dateRange : [];
  if (propName1 != null && propName1 != "" && propName2 != null && propName2 != "") {
    const dataParams: any = {};
    dataParams[propName1] = dateRange[0];
    dataParams[propName2] = dateRange[1];
    return Object.assign({}, searchParams, dataParams);
  }
  const dataParams = {
    beginTime: dateRange[0],
    endTime: dateRange[1],
  };
  return Object.assign({}, searchParams, dataParams);
}

/** 回显数据字典，进行状态翻译（数组对象） */
export function selectDictLabel(dataList: any, value: any) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  const actions = [];
  Object.keys(dataList).forEach((key) => {
    if (dataList[key].dictValue === "" + value) {
      actions.push(dataList[key].dictLabel);
    }
  });
  if (actions.length === 0) {
    actions.push(value);
  }
  return actions.join("");
}

/** 使用递归过滤出需要渲染在左侧菜单动态数据的列表（剔除 isVisible == 0 隐藏菜单） */
export function getShowStaticAndDynamicMenuList(menuList: any) {
  const newMenuList: any = JSON.parse(JSON.stringify(menuList));
  return newMenuList.filter((item: any) => {
    const v = item.isVisible !== undefined ? item.isVisible : item.meta?.isVisible;
    if (v == null) return true;
    return v == 1 || v === true;
  });
}

/** 使用递归找出所有面包屑存储到 pinia 中 */
export const getAllBreadcrumbList = (menuList: any, parent = [], result: { [key: string]: any } = {}) => {
  for (const item of menuList) {
    result[item.path] = [...parent, item];
    if (item.children) getAllBreadcrumbList(item.children, result[item.path], result);
  }
  return result;
};

/** 根据 activeMenu 找到所有层级面包屑 */
export const findRouteByActiveMenu = (routes: any, activeMenu: any) => {
  const dfs = (node: any, path: any) => {
    const currentNode = { ...node };
    delete currentNode.children;
    const currentPath = [...path, currentNode];
    if (node.path === activeMenu) {
      return currentPath;
    }
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const result: any = dfs(child, currentPath);
        if (result) return result;
      }
    }
    return null;
  };
  for (const route of routes) {
    const result = dfs(route, []);
    if (result) return result;
  }
  return null;
};

/** 根据 activeMenu 找到所有层级面包屑和里面的 children */
export const findRouteChildrenByActiveMenu = (routes: any, activeMenu: any) => {
  const dfs = (node: any, path: any) => {
    const currentNode = { ...node };
    const currentPath = [...path, currentNode];
    if (node.path === activeMenu) {
      return currentPath;
    }
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const result: any = dfs(child, currentPath);
        if (result) return result;
      }
    }
    return null;
  };
  for (const route of routes) {
    const result = dfs(route, []);
    if (result) return result;
  }
  return null;
};
