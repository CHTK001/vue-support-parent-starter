import type { CategoryEntity, CategoryTreeEntity } from "../entity/category";
import type { MallCategory } from "../data/catalog";

/** 后端 CategoryEntity → 前端 MallCategory */
export const toMallCategory = (entity: CategoryEntity): MallCategory => ({
  id: entity.id,
  label: entity.name,
  description: entity.description,
  accent: entity.colorAccent ?? "#c96c2d",
});

export const toMallCategoryList = (entities: CategoryEntity[]): MallCategory[] =>
  entities.map(toMallCategory);

/** 树节点扁平化 */
export const flattenCategoryTree = (
  nodes: CategoryTreeEntity[],
  result: CategoryEntity[] = [],
): CategoryEntity[] => {
  for (const node of nodes) {
    const { children, ...entity } = node;
    result.push(entity);
    if (children?.length) {
      flattenCategoryTree(children, result);
    }
  }
  return result;
};
