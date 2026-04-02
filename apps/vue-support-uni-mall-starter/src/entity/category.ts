/** 商品分类实体（后端响应原始结构） */
export interface CategoryEntity {
  id: string;
  name: string;
  description: string;
  icon?: string;
  sort?: number;
  /** 品类主色（十六进制） */
  colorAccent?: string;
  parentId?: string;
  /** 是否启用 */
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 分类树节点 */
export interface CategoryTreeEntity extends CategoryEntity {
  children?: CategoryTreeEntity[];
}
