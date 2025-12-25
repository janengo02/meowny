import { useMemo } from 'react';
import { ChipAutocomplete } from '../../../shared/components/form/ChipAutocomplete';
import {
  useGetTaxCategoriesQuery,
  useCreateTaxCategoryMutation,
  useUpdateTaxCategoryMutation,
} from '../api/taxCategoryApi';

interface TaxCategorySelectProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
}

export function TaxCategorySelect({ value, onChange }: TaxCategorySelectProps) {
  const { data: taxCategories = [] } = useGetTaxCategoriesQuery();
  const [
    createTaxCategory,
    { isLoading: isCreating, data: newlyCreatedCategory },
  ] = useCreateTaxCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] =
    useUpdateTaxCategoryMutation();

  const options = useMemo(() => {
    const categoryOptions = taxCategories.map((category) => ({
      value: String(category.id),
      label: category.name,
      color: category.color,
    }));

    // If we just created a category and it's not in the list yet, add it temporarily
    if (
      newlyCreatedCategory &&
      !taxCategories.find((cat) => cat.id === newlyCreatedCategory.id)
    ) {
      categoryOptions.push({
        value: newlyCreatedCategory.id.toString(),
        label: newlyCreatedCategory.name,
        color: newlyCreatedCategory.color,
      });
    }

    return categoryOptions;
  }, [taxCategories, newlyCreatedCategory]);

  const handleChange = (newValue: string | null) => {
    onChange(newValue ? Number(newValue) : null);
  };

  const handleCreate = async (name: string) => {
    try {
      const newCategory = await createTaxCategory({
        name,
        color: 'default',
      }).unwrap();
      onChange(newCategory.id);
    } catch (error) {
      console.error('Failed to create tax category:', error);
    }
  };

  const handleColorChange = async (categoryId: string, color: ColorEnum) => {
    try {
      await updateCategory({
        id: Number(categoryId),
        params: { color },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update tax category color:', error);
    }
  };

  const handleNameChange = async (categoryId: string, newName: string) => {
    try {
      await updateCategory({
        id: Number(categoryId),
        params: { name: newName },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update tax category name:', error);
    }
  };

  return (
    <ChipAutocomplete
      value={value ? String(value) : null}
      options={options}
      onChange={handleChange}
      onCreate={handleCreate}
      onColorChange={handleColorChange}
      onOptionNameChange={handleNameChange}
      size="small"
      variant="outlined"
      placeholder="Search tax categories..."
      label="Tax Category"
      disabled={isCreating || isUpdatingCategory}
    />
  );
}
