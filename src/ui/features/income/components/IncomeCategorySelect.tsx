import { useMemo } from 'react';
import { ChipAutocomplete } from '../../../shared/components/ChipAutocomplete';
import {
  useGetIncomeCategoriesQuery,
  useCreateIncomeCategoryMutation,
} from '../api/incomeCategoryApi';

interface IncomeCategorySelectProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
}

export function IncomeCategorySelect({
  value,
  onChange,
  disabled = false,
}: IncomeCategorySelectProps) {
  const { data: categories = [] } = useGetIncomeCategoriesQuery();
  const [
    createCategory,
    { isLoading: isCreating, data: newlyCreatedCategory },
  ] = useCreateIncomeCategoryMutation();

  const handleCategoryChange = async (categoryId: string | null) => {
    onChange(categoryId ? Number(categoryId) : null);
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const newCategory = await createCategory({ name }).unwrap();
      if (newCategory) {
        onChange(newCategory.id);
      }
    } catch (error) {
      console.error('Failed to create income category:', error);
    }
  };

  // Include the newly created category in options if it's not yet in the cached list
  const options = useMemo(() => {
    const categoryOptions = categories.map((cat) => ({
      value: cat.id.toString(),
      label: cat.name,
    }));

    // If we just created a category and it's not in the list yet, add it temporarily
    if (
      newlyCreatedCategory &&
      !categories.find((cat) => cat.id === newlyCreatedCategory.id)
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
      disabled={disabled || isCreating}
    />
  );
}
