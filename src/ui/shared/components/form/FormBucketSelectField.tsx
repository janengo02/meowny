import { useFormContext, Controller } from 'react-hook-form';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  type SelectProps,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAppSelector } from '../../../store/hooks';
import { selectAllAccountsWithBuckets } from '../../../features/account/selectors/accountSelectors';

export interface FormBucketSelectFieldProps
  extends Omit<SelectProps, 'error' | 'name'> {
  name: string;
  label: string;
  includeNone?: boolean;
  noneLabel?: string;
}

export function FormBucketSelectField({
  name,
  label,
  includeNone = true,
  noneLabel = 'None',
  ...props
}: FormBucketSelectFieldProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const accountsWithBuckets = useAppSelector(selectAllAccountsWithBuckets);
  const categoriesById = useAppSelector(
    (state) => state.account.categories.byId,
  );
  const bucketsById = useAppSelector((state) => state.account.buckets.byId);
  const error = errors[name]?.message as string | undefined;

  // Helper to group buckets by category within an account
  const getBucketsByCategory = (buckets: Bucket[]) => {
    const withCategory: Bucket[] = [];
    const withoutCategory: Bucket[] = [];

    buckets.forEach((bucket) => {
      if (bucket.bucket_category_id !== null) {
        withCategory.push(bucket);
      } else {
        withoutCategory.push(bucket);
      }
    });

    const categorized = withCategory.reduce(
      (acc, bucket) => {
        const categoryId = bucket.bucket_category_id!;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(bucket);
        return acc;
      },
      {} as Record<number, Bucket[]>,
    );

    return { categorized, withoutCategory };
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selectedBucket = field.value
          ? bucketsById[Number(field.value)]
          : null;
        const bucketType = selectedBucket?.type;
        const outlineColor =
          bucketType === 'saving'
            ? 'primary'
            : bucketType === 'investment'
              ? 'warning'
              : undefined;

        return (
          <FormControl
            fullWidth
            error={Boolean(error)}
            color={outlineColor}
            sx={
              bucketType === 'expense'
                ? {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'grey.500',
                      },
                      '&:hover fieldset': {
                        borderColor: 'grey.500',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'grey.500',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'grey.500',
                      '&.Mui-focused': {
                        color: 'grey.500',
                      },
                    },
                  }
                : outlineColor
                  ? {
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: `${outlineColor}.main`,
                        },
                        '&:hover fieldset': {
                          borderColor: `${outlineColor}.main`,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: `${outlineColor}.main`,
                        },
                      },
                    }
                  : undefined
            }
          >
            <InputLabel color={outlineColor}>{label}</InputLabel>
            <Select
              {...field}
              {...props}
              label={label}
              color={outlineColor}
              disabled={props.disabled ?? isSubmitting}
              value={field.value ?? ''}
              renderValue={(value) => {
                if (!value) return <em>{noneLabel}</em>;
                const bucket = bucketsById[Number(value)];
                return bucket?.name || value;
              }}
              MenuProps={{
                ...props.MenuProps,
                sx: {
                  maxHeight: 400,
                },
              }}
            >
              {includeNone && (
                <MenuItem
                  value=""
                  onClick={() => field.onChange('')}
                  sx={{ color: 'text.secondary' }}
                >
                  {noneLabel}
                </MenuItem>
              )}

              {accountsWithBuckets.map((account) => {
                const { categorized, withoutCategory } = getBucketsByCategory(
                  account.buckets,
                );
                const hasBuckets =
                  Object.keys(categorized).length > 0 ||
                  withoutCategory.length > 0;

                if (!hasBuckets) return null;

                return (
                  <Box key={`account-${account.id}`} sx={{ width: '100%' }}>
                    <Accordion
                      defaultExpanded
                      disableGutters
                      elevation={0}
                      sx={{
                        backgroundColor: 'transparent',
                        '&:before': { display: 'none' },
                        '& .MuiAccordionSummary-root': {
                          minHeight: 32,
                          padding: '0 16px',
                          backgroundColor: 'action.hover',
                          '&:hover': {
                            backgroundColor: 'action.selected',
                          },
                        },
                        '& .MuiAccordionSummary-content': {
                          margin: '4px 0',
                        },
                        '& .MuiAccordionDetails-root': {
                          padding: 0,
                          display: 'flex',
                          flexDirection: 'column',
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon fontSize="small" />}
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                        }}
                      >
                        {account.name}
                      </AccordionSummary>
                      <AccordionDetails>
                        {/* Uncategorized buckets */}
                        {withoutCategory.map((bucket) => (
                          <MenuItem
                            key={`bucket-${bucket.id}`}
                            value={String(bucket.id)}
                            onClick={() => field.onChange(String(bucket.id))}
                            sx={{ pl: 4 }}
                          >
                            {bucket.name}
                          </MenuItem>
                        ))}

                        {/* Categories */}
                        {Object.entries(categorized).map(
                          ([categoryId, buckets]) => {
                            const category = categoriesById[Number(categoryId)];
                            if (!category) return null;

                            return (
                              <Accordion
                                key={`category-${categoryId}`}
                                disableGutters
                                elevation={0}
                                sx={{
                                  backgroundColor: 'transparent',
                                  '&:before': { display: 'none' },
                                  '& .MuiAccordionSummary-root': {
                                    minHeight: 28,
                                    padding: '0 16px 0 32px',
                                    '&:hover': {
                                      backgroundColor: 'action.hover',
                                    },
                                  },
                                  '& .MuiAccordionSummary-content': {
                                    margin: '2px 0',
                                  },
                                  '& .MuiAccordionDetails-root': {
                                    padding: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                  },
                                }}
                              >
                                <AccordionSummary
                                  expandIcon={
                                    <ExpandMoreIcon
                                      fontSize="small"
                                      sx={{ fontSize: '1rem' }}
                                    />
                                  }
                                  sx={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    color: 'text.secondary',
                                  }}
                                >
                                  {category.name}
                                </AccordionSummary>
                                <AccordionDetails>
                                  {buckets.map((bucket) => (
                                    <MenuItem
                                      key={`bucket-${bucket.id}`}
                                      value={String(bucket.id)}
                                      onClick={() =>
                                        field.onChange(String(bucket.id))
                                      }
                                      sx={{ pl: 8 }}
                                    >
                                      {bucket.name}
                                    </MenuItem>
                                  ))}
                                </AccordionDetails>
                              </Accordion>
                            );
                          },
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                );
              })}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );
      }}
    />
  );
}
