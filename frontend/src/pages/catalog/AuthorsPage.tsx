import { CatalogPage } from "./CatalogPage";

export function AuthorsPage() {
  return (
    <CatalogPage
      endpoint="authors"
      title="Authors"
      singularLabel="Author"
      searchPlaceholder="Search authors..."
    />
  );
}
