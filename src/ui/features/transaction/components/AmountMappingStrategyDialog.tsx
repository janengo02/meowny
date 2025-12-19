import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Card,
  CardActionArea,
  CardContent,
  Radio,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useState } from 'react';
import type { AmountMappingStrategy } from '../schemas/transaction.schema';

interface AmountMappingStrategyDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectStrategy: (strategy: AmountMappingStrategy) => void;
}

export function AmountMappingStrategyDialog({
  open,
  onClose,
  onSelectStrategy,
}: AmountMappingStrategyDialogProps) {
  const [selectedStrategy, setSelectedStrategy] =
    useState<AmountMappingStrategy>('single_transaction');

  const handleSubmit = () => {
    onSelectStrategy(selectedStrategy);
  };

  const strategies: Array<{
    value: AmountMappingStrategy;
    title: string;
    description: string;
    csvExample:
      | { type: 'single'; headers: string[]; rows: string[] }
      | {
          type: 'dual';
          headers: string[];
          rows: Array<{ deposit: string; withdrawal: string }>;
        }
      | {
          type: 'category';
          headers: string[];
          rows: Array<{ amount: string; type: string }>;
        };
    previewExample: {
      headers: string[];
      rows: Array<{ amount: string; color: 'success' | 'error' }>;
    };
  }> = [
    {
      value: 'single_transaction',
      title: 'Single Transaction Amount',
      description:
        'Use one column containing transaction amounts. Supports both signed (±) and unsigned values.',
      csvExample: {
        type: 'single',
        headers: ['Amount'],
        rows: ['1000', '-500'],
      },
      previewExample: {
        headers: ['Amount'],
        rows: [
          { amount: '1,000', color: 'success' },
          { amount: '500', color: 'error' },
        ],
      },
    },
    {
      value: 'deposit_withdrawal',
      title: 'Separate Deposit & Withdrawal Columns',
      description:
        'Use two columns: one for deposits, one for withdrawals. Each row has a value in only one column.',
      csvExample: {
        type: 'dual',
        headers: ['Deposit', 'Withdrawal'],
        rows: [
          { deposit: '1000', withdrawal: '' },
          { deposit: '', withdrawal: '500' },
        ],
      },
      previewExample: {
        headers: ['Amount'],
        rows: [
          { amount: '1,000', color: 'success' },
          { amount: '500', color: 'error' },
        ],
      },
    },
    {
      value: 'transaction_with_category',
      title: 'Transaction Amount with Category',
      description:
        'Use one amount column and one category column. You\'ll specify which category values mean "Deposit" vs "Withdrawal".',
      csvExample: {
        type: 'category',
        headers: ['Amount', 'Type'],
        rows: [
          { amount: '1000', type: 'Deposit' },
          { amount: '500', type: 'Withdrawal' },
        ],
      },
      previewExample: {
        headers: ['Amount'],
        rows: [
          { amount: '1,000', color: 'success' },
          { amount: '500', color: 'error' },
        ],
      },
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        Select Transaction Amount Importing Strategy
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>How Import Works:</strong> Meowny tracks money movement
            using a single transaction amount rather than separate
            withdraw/deposit steps. To ensure compatibility with common
            financial reports, all CSV formats are normalized and colored to
            help you distinguish transaction types: green = deposits, red =
            withdrawals.
          </Typography>
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose how your CSV file represents transaction amounts:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {strategies.map((strategy) => (
            <Card
              key={strategy.value}
              variant="outlined"
              sx={{
                bgcolor:
                  selectedStrategy === strategy.value
                    ? 'action.selected'
                    : 'background.paper',
                border: '1px solid',
                borderColor:
                  selectedStrategy === strategy.value
                    ? 'primary.main'
                    : 'divider',
              }}
            >
              <CardActionArea
                onClick={() => setSelectedStrategy(strategy.value)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Radio
                      checked={selectedStrategy === strategy.value}
                      onChange={() => setSelectedStrategy(strategy.value)}
                      sx={{ mt: -0.5, mr: 1 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="h6">{strategy.title}</Typography>
                        <Tooltip
                          title={
                            <Box sx={{ p: 1 }}>
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr auto 1fr',
                                  gap: 2,
                                  alignItems: 'center',
                                }}
                              >
                                {/* CSV Format */}
                                <Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 500,
                                      mb: 0.5,
                                      display: 'block',
                                    }}
                                  >
                                    Your CSV Format:
                                  </Typography>
                                  <Table
                                    size="small"
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      bgcolor: 'background.paper',
                                      '& td, & th': {
                                        fontSize: '0.7rem',
                                        p: 0.5,
                                      },
                                    }}
                                  >
                                    <TableHead>
                                      <TableRow>
                                        {strategy.csvExample.headers.map(
                                          (h, i) => (
                                            <TableCell key={i} align="center">
                                              {h}
                                            </TableCell>
                                          ),
                                        )}
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {strategy.csvExample.type === 'single' &&
                                        strategy.csvExample.rows.map(
                                          (row, i) => (
                                            <TableRow key={i}>
                                              <TableCell align="center">
                                                {row}
                                              </TableCell>
                                            </TableRow>
                                          ),
                                        )}
                                      {strategy.csvExample.type === 'dual' &&
                                        strategy.csvExample.rows.map(
                                          (row, i) => (
                                            <TableRow key={i}>
                                              <TableCell align="center">
                                                {row.deposit || '—'}
                                              </TableCell>
                                              <TableCell align="center">
                                                {row.withdrawal || '—'}
                                              </TableCell>
                                            </TableRow>
                                          ),
                                        )}
                                      {strategy.csvExample.type ===
                                        'category' &&
                                        strategy.csvExample.rows.map(
                                          (row, i) => (
                                            <TableRow key={i}>
                                              <TableCell align="center">
                                                {row.amount}
                                              </TableCell>
                                              <TableCell align="center">
                                                {row.type}
                                              </TableCell>
                                            </TableRow>
                                          ),
                                        )}
                                    </TableBody>
                                  </Table>
                                </Box>

                                {/* Arrow */}
                                <Typography
                                  variant="h5"
                                  color="text.secondary"
                                  sx={{ opacity: 0.5 }}
                                >
                                  →
                                </Typography>

                                {/* Preview Format */}
                                <Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 500,
                                      mb: 0.5,
                                      display: 'block',
                                    }}
                                  >
                                    Import Preview:
                                  </Typography>
                                  <Table
                                    size="small"
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      bgcolor: 'background.paper',
                                      '& td, & th': {
                                        fontSize: '0.7rem',
                                        p: 0.5,
                                      },
                                    }}
                                  >
                                    <TableHead>
                                      <TableRow>
                                        <TableCell align="center">
                                          Amount
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {strategy.previewExample.rows.map(
                                        (row, i) => (
                                          <TableRow key={i}>
                                            <TableCell
                                              align="center"
                                              sx={{
                                                color:
                                                  row.color === 'success'
                                                    ? 'success.main'
                                                    : 'error.main',
                                                fontWeight: 500,
                                              }}
                                            >
                                              {row.amount}
                                            </TableCell>
                                          </TableRow>
                                        ),
                                      )}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Box>
                            </Box>
                          }
                          arrow
                          placement="right"
                        >
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              cursor: 'help',
                              color: 'text.secondary',
                              '&:hover': {
                                color: 'primary.main',
                              },
                            }}
                          >
                            <Typography variant="caption">Example</Typography>
                            <HelpOutlineIcon sx={{ fontSize: 16 }} />
                          </Box>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {strategy.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Next
        </Button>
      </DialogActions>
    </Dialog>
  );
}
