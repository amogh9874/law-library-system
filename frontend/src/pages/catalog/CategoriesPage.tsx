import { CatalogPage } from "./CatalogPage";

export function CategoriesPage() {
  return (
    <CatalogPage
      endpoint="categories"
      title="Categories"
      singularLabel="Category"
      searchPlaceholder="Search categories..."
    />
  );
}
