import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ChipAutocomplete } from '../../../shared/components/form/ChipAutocomplete';
import { useUpdateBucketMutation } from '../api/bucketApi';
import { useCreateBucketCategoryMutation } from '../api/bucketCategoryApi';
import { selectAllBucketCategories } from '../../account/selectors/accountSelectors';
import type { RootState } from '../../../store/store';

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
  const categories = useSelector((state: RootState) => selectAllBucketCategories(state));
  const [updateBucket, { isLoading: isUpdating }] = useUpdateBucketMutation();
  const [
    createCategory,
    { isLoading: isCreating, data: newlyCreatedCategory },
  ] = useCreateBucketCategoryMutation();

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

  // Include the newly created category in options if it's not yet in the cached list
  const options = useMemo(() => {
    const categoryOptions = categories.map((cat: BucketCategory) => ({
      value: cat.id.toString(),
      label: cat.name,
    }));

    // If we just created a category and it's not in the list yet, add it temporarily
    if (
      newlyCreatedCategory &&
      !categories.find((cat: BucketCategory) => cat.id === newlyCreatedCategory.id)
    ) {
      categoryOptions.push({
        value: newlyCreatedCategory.id.toString(),
        label: newlyCreatedCategory.name,
      });
    }

    return categoryOptions;
  }, [categories, newlyCreatedCategory]);

  return (
    <ChipAutocomplete
      value={value?.toString() ?? null}
      options={options}
      onChange={handleCategoryChange}
      onCreate={handleCreateCategory}
      label="Category"
      placeholder="Search categories..."
      variant="outlined"
      disabled={disabled || isUpdating || isCreating}
    />
  );
}
