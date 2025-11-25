import { ChipAutocomplete } from '../../../shared/components/ChipAutocomplete';
import { useUpdateBucketMutation } from '../api/bucketApi';
import {
  useGetBucketCategoriesQuery,
  useCreateBucketCategoryMutation,
} from '../api/bucketCategoryApi';

interface BucketCategorySelectProps {
  bucketId: number;
  value: number | null;
  disabled?: boolean;
}

export function BucketCategorySelect({
  bucketId,
  value,
  disabled = false,
}: BucketCategorySelectProps) {
  const { data: categories = [] } = useGetBucketCategoriesQuery();
  const [updateBucket, { isLoading: isUpdating }] = useUpdateBucketMutation();
  const [createCategory, { isLoading: isCreating }] =
    useCreateBucketCategoryMutation();

  const handleCategoryChange = async (categoryId: string | null) => {
    try {
      await updateBucket({
        id: bucketId,
        params: { bucket_category_id: categoryId ? Number(categoryId) : null },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update bucket category:', error);
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const newCategory = await createCategory({ name }).unwrap();
      if (newCategory) {
        await updateBucket({
          id: bucketId,
          params: { bucket_category_id: newCategory.id },
        }).unwrap();
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  return (
    <ChipAutocomplete
      value={value?.toString() ?? null}
      options={categories.map((cat) => ({
        value: cat.id.toString(),
        label: cat.name,
      }))}
      onChange={handleCategoryChange}
      onCreate={handleCreateCategory}
      label="Category"
      placeholder="Search categories..."
      variant="outlined"
      disabled={disabled || isUpdating || isCreating}
    />
  );
}
