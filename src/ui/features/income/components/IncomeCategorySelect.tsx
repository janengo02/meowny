import { memo, useMemo } from 'react';
import { ChipAutocomplete } from '../../../shared/components/form/ChipAutocomplete';
import {
  useGetIncomeCategoriesQuery,
  useCreateIncomeCategoryMutation,
  useUpdateIncomeCategoryMutation,
  useDeleteIncomeCategoryMutation,
} from '../api/incomeCategoryApi';
import { useUpdateIncomeHistoryMutation } from '../api/incomeHistoryApi';

interface IncomeCategorySelectProps {
  value: number | null;
  historyId: number;
  disabled?: boolean;
}

function IncomeCategorySelectComponent({
  value,
  historyId,
  disabled = false,
}: IncomeCategorySelectProps) {
  const { data: categories = [] } = useGetIncomeCategoriesQuery();
  const [
    createCategory,
    { isLoading: isCreating, data: newlyCreatedCategory },
  ] = useCreateIncomeCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] =
    useUpdateIncomeCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCategory }] =
    useDeleteIncomeCategoryMutation();
  const [updateIncomeHistory, { isLoading: isUpdating }] =
    useUpdateIncomeHistoryMutation();

  const handleCategoryChange = async (categoryId: string | null) => {
    try {
      await updateIncomeHistory({
        id: historyId,
        params: { income_category_id: categoryId ? Number(categoryId) : null },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update income category:', error);
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const newCategory = await createCategory({ name }).unwrap();
      if (newCategory) {
        await updateIncomeHistory({
          id: historyId,
          params: { income_category_id: newCategory.id },
        }).unwrap();
      }
    } catch (error) {
      console.error('Failed to create income category:', error);
    }
  };

  const handleColorChange = async (categoryId: string, color: ColorEnum) => {
    try {
      await updateCategory({
        id: Number(categoryId),
        params: { color },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update category color:', error);
    }
  };

  const handleNameChange = async (categoryId: string, newName: string) => {
    try {
      await updateCategory({
        id: Number(categoryId),
        params: { name: newName },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update category name:', error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteCategory(Number(categoryId)).unwrap();
      // If the deleted category was selected, clear the selection
      if (value === Number(categoryId)) {
        await updateIncomeHistory({
          id: historyId,
          params: { income_category_id: null },
        }).unwrap();
      }
    } catch (error) {
      console.error('Failed to delete income category:', error);
    }
  };

  // Include the newly created category in options if it's not yet in the cached list
  const options = useMemo(() => {
    const categoryOptions = categories.map((cat) => ({
      value: cat.id.toString(),
      label: cat.name,
      color: cat.color,
    }));

    // If we just created a category and it's not in the list yet, add it temporarily
    if (
      newlyCreatedCategory &&
      !categories.find((cat) => cat.id === newlyCreatedCategory.id)
    ) {
      categoryOptions.push({
        value: newlyCreatedCategory.id.toString(),
        label: newlyCreatedCategory.name,
        color: newlyCreatedCategory.color,
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
      onColorChange={handleColorChange}
      onOptionNameChange={handleNameChange}
      onOptionDelete={handleDelete}
      label="Category"
      placeholder="Search categories..."
      variant="outlined"
      disabled={disabled || isCreating || isUpdating || isUpdatingCategory || isDeletingCategory}
    />
  );
}

export const IncomeCategorySelect = memo(IncomeCategorySelectComponent);
