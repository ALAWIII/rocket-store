import { CategoryResponseDto } from 'src/modules/categories/dto/category-response.dto';
import { CategoriesControllerTest } from '../controllers/categories.controller-test';

export async function createRandomCategoryTree(categoryController: CategoriesControllerTest) {
  const cats: CategoryResponseDto[] = [];
  for (let i = 0; i < 4; i++) cats.push((await categoryController.create()).body!);

  const lvl0 = cats[0];
  const lvl0Child1 = (await categoryController.move(cats[1].id, { parentId: lvl0.id })).body!;
  const lvl0Child2 = (await categoryController.move(cats[2].id, { parentId: lvl0.id })).body!;
  const lvl1C1Child1 = (await categoryController.move(cats[3].id, { parentId: cats[1].id })).body!;
  expect(lvl0Child1.parentId).toBe(lvl0.id);
  expect(lvl0Child2.parentId).toBe(lvl0.id);
  expect(lvl1C1Child1.path).toEqual([lvl0.id, lvl0Child1.id, lvl1C1Child1.id]);
  expect(lvl1C1Child1.parentId).toBe(lvl0Child1.id);
  return { lvl0, lvl0Child1, lvl0Child2, lvl1C1Child1 };
}
