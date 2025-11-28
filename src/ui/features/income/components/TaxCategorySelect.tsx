import { ChipAutocomplete } from '../../../shared/components/ChipAutocomplete';
import {
  useGetTaxCategoriesQuery,
  useCreateTaxCategoryMutation,
} from '../api/taxCategoryApi';

interface TaxCategorySelectProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
}

export function TaxCategorySelect({
  value,
  onChange,
}: TaxCategorySelectProps) {
  const { data: taxCategories = [] } = useGetTaxCategoriesQuery();
  const [createTaxCategory] = useCreateTaxCategoryMutation();

  const options = taxCategories.map((category) => ({
    value: String(category.id),
    label: category.name,
  }));

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

  return (
    <ChipAutocomplete
      value={value ? String(value) : null}
      options={options}
      onChange={handleChange}
      onCreate={handleCreate}
      color="secondary"
      size="small"
      variant="outlined"
      placeholder="Search tax categories..."
      label="Tax Category"
    />
  );
}
