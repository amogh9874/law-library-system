import { CatalogPage } from "./CatalogPage";

export function PublishersPage() {
  return (
    <CatalogPage
      endpoint="publishers"
      title="Publishers"
      singularLabel="Publisher"
      searchPlaceholder="Search publishers..."
    />
  );
}
