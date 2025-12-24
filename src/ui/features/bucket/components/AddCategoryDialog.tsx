import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState, useMemo } from 'react';
import { useCreateBucketMutation } from '../api/bucketApi';
import { useCreateBucketCategoryMutation } from '../api/bucketCategoryApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import { useAppSelector } from '../../../store/hooks';
import { selectAllBucketCategories } from '../../account/selectors/accountSelectors';

interface AddCategoryDialogProps {
  account: Account;
  open: boolean;
  onClose: () => void;
}

export function AddCategoryDialog({
  account,
  open,
  onClose,
}: AddCategoryDialogProps) {
  const [bucketName, setBucketName] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const categories = useAppSelector(selectAllBucketCategories);
  const [createBucket, { isLoading: isCreatingBucket }] =
    useCreateBucketMutation();
  const [createCategory, { isLoading: isCreatingCategory }] =
    useCreateBucketCategoryMutation();
  const { setError } = useDashboardError();

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
    );
  }, [categories, categorySearch]);

  const hasExactMatch = useMemo(() => {
    return filteredCategories.some(
      (cat) => cat.name.toLowerCase() === categorySearch.toLowerCase(),
    );
  }, [filteredCategories, categorySearch]);

  const showCreateOption = categorySearch.trim() !== '' && !hasExactMatch;

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId,
  );

  const handleSubmit = async () => {
    if (!bucketName.trim()) return;

    try {
      let categoryId = selectedCategoryId;

      // Create category if it doesn't exist and user is creating a new one
      if (showCreateOption && categorySearch.trim()) {
        const newCategory = await createCategory({
          name: categorySearch.trim(),
        }).unwrap();
        categoryId = newCategory.id;
      }

      // Create bucket
      await createBucket({
        name: bucketName.trim(),
        type: 'expense',
        notes: '',
        account_id: account.id,
        bucket_category_id: categoryId ?? null,
      }).unwrap();

      handleClose();
    } catch (error) {
      setError('Failed to create bucket. Please try again.');
      console.error('Failed to create bucket:', error);
    }
  };

  const handleClose = () => {
    setBucketName('');
    setCategorySearch('');
    setSelectedCategoryId(null);
    setShowCategoryMenu(false);
    onClose();
  };

  const handleSelectCategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setCategorySearch(category.name);
    }
    setShowCategoryMenu(false);
  };

  const handleCreateCategory = () => {
    setShowCategoryMenu(false);
  };

  const isLoading = isCreatingBucket || isCreatingCategory;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Category with Bucket</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label="Category"
              value={categorySearch}
              onChange={(e) => {
                setCategorySearch(e.target.value);
                setShowCategoryMenu(true);
              }}
              onFocus={() => setShowCategoryMenu(true)}
              disabled={isLoading}
              placeholder="Search or create category..."
              helperText={
                selectedCategory ? `Selected: ${selectedCategory.name}` : ''
              }
            />

            {showCategoryMenu && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1300,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mt: 0.5,
                  maxHeight: 300,
                  overflow: 'auto',
                  boxShadow: 3,
                }}
              >
                {filteredCategories.length > 0
                  ? filteredCategories.map((category) => (
                      <MenuItem
                        key={category.id}
                        selected={category.id === selectedCategoryId}
                        onClick={() => handleSelectCategory(category.id)}
                      >
                        {category.name}
                      </MenuItem>
                    ))
                  : !showCreateOption && (
                      <MenuItem disabled>No categories found</MenuItem>
                    )}
                {showCreateOption && (
                  <>
                    {filteredCategories.length > 0 && <Divider />}
                    <MenuItem onClick={handleCreateCategory}>
                      <ListItemIcon>
                        <AddIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Create "{categorySearch}"</ListItemText>
                    </MenuItem>
                  </>
                )}
              </Box>
            )}
          </Box>
          <TextField
            autoFocus
            fullWidth
            label="Bucket Name *"
            value={bucketName}
            onChange={(e) => setBucketName(e.target.value)}
            disabled={isLoading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!bucketName.trim() || isLoading}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
