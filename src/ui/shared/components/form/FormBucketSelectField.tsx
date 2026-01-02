import { useFormContext, Controller } from 'react-hook-form';
import { useState } from 'react';
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
  Tooltip,
  TextField,
  InputAdornment,
  ListSubheader,
  type SelectProps,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAppSelector } from '../../../store/hooks';
import { selectAllAccountsWithBuckets } from '../../../features/account/selectors/accountSelectors';
import { CreateBucketDialog } from '../../../features/bucket/components/CreateBucketDialog';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);

  const {
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const accountsWithBuckets = useAppSelector(selectAllAccountsWithBuckets);
  const categoriesById = useAppSelector(
    (state) => state.account.categories.byId,
  );
  const bucketsById = useAppSelector((state) => state.account.buckets.byId);
  const error = errors[name]?.message as string | undefined;

  // Helper to filter buckets based on search query
  const filterBuckets = (buckets: Bucket[]) => {
    if (!searchQuery.trim()) return buckets;
    const query = searchQuery.toLowerCase();
    return buckets.filter((bucket) =>
      bucket.name.toLowerCase().includes(query),
    );
  };

  // Check if there are any matching buckets across all accounts
  const hasMatchingBuckets = () => {
    return accountsWithBuckets.some((account) => {
      const { categorized, withoutCategory } = getBucketsByCategory(
        account.buckets,
      );
      return Object.keys(categorized).length > 0 || withoutCategory.length > 0;
    });
  };

  // Helper to group buckets by category within an account
  const getBucketsByCategory = (buckets: Bucket[]) => {
    const filteredBuckets = filterBuckets(buckets);
    const withCategory: Bucket[] = [];
    const withoutCategory: Bucket[] = [];

    filteredBuckets.forEach((bucket) => {
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
    <>
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

          const getTooltipTitle = () => {
            if (!selectedBucket) return '';

            const typeLabels: Record<string, string> = {
              expense: 'Expense',
              saving: 'Saving',
              investment: 'Investment',
            };

            const bucketTypeLabel = typeLabels[bucketType || ''] || '';

            // Find the account that contains this bucket
            const account = accountsWithBuckets.find((acc) =>
              acc.buckets.some((b) => b.id === selectedBucket.id),
            );

            const accountName = account?.name || '';

            // Get category name if bucket has a category
            const categoryName = selectedBucket.bucket_category_id
              ? categoriesById[selectedBucket.bucket_category_id]?.name || ''
              : '';

            // Build the tooltip string
            const parts = [bucketTypeLabel, accountName];
            if (categoryName) {
              parts.push(categoryName);
            }

            return parts.filter(Boolean).join(' - ');
          };

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
              <InputLabel color={outlineColor} size={props.size}>
                {label}
              </InputLabel>
              <Tooltip
                title={getTooltipTitle()}
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      fontSize: '0.75rem',
                    },
                  },
                }}
              >
                <Select
                  {...field}
                  {...props}
                  label={label}
                  color={outlineColor}
                  disabled={props.disabled ?? isSubmitting}
                  value={field.value ?? ''}
                  open={selectOpen}
                  onOpen={() => setSelectOpen(true)}
                  onClose={() => {
                    setSearchQuery('');
                    setSelectOpen(false);
                  }}
                  renderValue={(value) => {
                    if (!value) return <em>{noneLabel}</em>;
                    const bucket = bucketsById[Number(value)];
                    return bucket?.name || value;
                  }}
                  MenuProps={{
                    ...props.MenuProps,
                    autoFocus: false,
                    sx: {
                      maxHeight: 400,
                    },
                  }}
                >
                  <ListSubheader
                    component="div"
                    sx={{
                      pt: 1,
                      pb: 1,
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'background.paper',
                      zIndex: 1,
                      pointerEvents: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Search buckets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                      }}
                      autoFocus
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {/* Create new bucket option when search has no results */}
                    {searchQuery.trim() && !hasMatchingBuckets() && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectOpen(false);
                          setCreateDialogOpen(true);
                        }}
                        sx={{
                          color: 'primary.main',
                          fontWeight: 500,
                          width: 'fit-content',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <AddIcon fontSize="small" sx={{ mr: 1 }} />
                        Create &quot;{searchQuery.trim()}&quot;
                      </Button>
                    )}
                  </ListSubheader>
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
                    const { categorized, withoutCategory } =
                      getBucketsByCategory(account.buckets);
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
                                onClick={() =>
                                  field.onChange(String(bucket.id))
                                }
                                sx={{ pl: 4 }}
                              >
                                {bucket.name}
                              </MenuItem>
                            ))}

                            {/* Categories */}
                            {Object.entries(categorized).map(
                              ([categoryId, buckets]) => {
                                const category =
                                  categoriesById[Number(categoryId)];
                                if (!category) return null;

                                return (
                                  <Accordion
                                    key={`category-${categoryId}`}
                                    defaultExpanded
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
              </Tooltip>
              {error && <FormHelperText>{error}</FormHelperText>}
            </FormControl>
          );
        }}
      />

      <CreateBucketDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        initialName={searchQuery.trim()}
        onSuccess={(bucketId) => {
          setValue(name, String(bucketId));
        }}
      />
    </>
  );
}
