import { useState, useRef, useCallback } from 'react';
import {
  Button,
  Backdrop,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import { AmountMappingStrategyDialog } from './AmountMappingStrategyDialog';
import { ColumnMappingDialog } from './ColumnMappingDialog';
import { TransactionPreviewDialog } from './TransactionPreviewDialog';
import { sanitizeMoneyInput } from '../../../shared/utils/formatMoney';
import { formatToDateTimeLocal } from '../../../shared/utils/dateTime';
import type {
  ImportStatus,
  MappedTransaction,
  AmountMappingStrategy,
  ColumnMappingFormData,
} from '../schemas/transaction.schema';
interface CsvRow {
  [key: string]: string;
}

export function CsvImportFlow() {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedStrategy, setSelectedStrategy] =
    useState<AmountMappingStrategy>('single_transaction');
  const [mappedTransactions, setMappedTransactions] = useState<
    MappedTransaction[]
  >([]);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Preload keyword-bucket mappings in the background
  const [keywordMappingsCache, setKeywordMappingsCache] = useState<
    Map<string, { from_bucket_id: number | null; to_bucket_id: number | null }>
  >(new Map());

  // Load keyword mappings function - returns the cache for immediate use
  const loadKeywordMappings = useCallback(async () => {
    try {
      const mappings = await window.electron.getKeywordBucketMappings();
      const cache = new Map<
        string,
        { from_bucket_id: number | null; to_bucket_id: number | null }
      >();

      // Build a cache of keyword -> best bucket pair
      mappings.forEach((mapping) => {
        // Find the bucket pair with the highest count for each keyword
        const bestAssignment = mapping.bucket_assign_count.reduce(
          (best, current) => (current.count > best.count ? current : best),
        );
        cache.set(mapping.keyword, {
          from_bucket_id: bestAssignment.from_bucket_id,
          to_bucket_id: bestAssignment.to_bucket_id,
        });
      });
      setKeywordMappingsCache(cache);
      return cache;
    } catch (error) {
      console.error('Error preloading keyword mappings:', error);
      return new Map();
    }
  }, []);

  // Find matching CSV template based on headers
  const findMatchingTemplate = async (
    headers: string[],
  ): Promise<CsvImportTemplate | null> => {
    try {
      // Get all saved templates from user preferences
      const templatesPref = await window.electron.getUserPreference({
        preference_key: 'csv_templates',
      });

      if (!templatesPref) {
        return null;
      }

      const templates = templatesPref.preference_value as CsvImportTemplate[];

      if (!templates || templates.length === 0) {
        return null;
      }

      // Find templates that match the CSV headers
      const matchingTemplates = templates.filter((template) => {
        // Check if all template headers exist in CSV headers
        return template.csv_headers.every((header) => headers.includes(header));
      });

      if (matchingTemplates.length === 0) {
        return null;
      }

      // Return the most recently created template
      const sortedTemplates = matchingTemplates.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return sortedTemplates[0];
    } catch (error) {
      console.error('Error finding matching template:', error);
      return null;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show loading indicator
    setIsLoadingCsv(true);

    // Read the file as ArrayBuffer to detect encoding
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      // Try to decode with proper encoding detection
      let text: string;

      // Check for UTF-8 BOM (EF BB BF)
      const hasUtf8Bom =
        uint8Array.length >= 3 &&
        uint8Array[0] === 0xef &&
        uint8Array[1] === 0xbb &&
        uint8Array[2] === 0xbf;

      if (hasUtf8Bom) {
        // If UTF-8 BOM is present, decode as UTF-8 and skip BOM
        const decoder = new TextDecoder('utf-8');
        text = decoder.decode(uint8Array.slice(3));
      } else {
        // Try UTF-8 first (most common for Vietnamese and modern files)
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          text = decoder.decode(uint8Array);
        } catch {
          // Fall back to Shift-JIS for Japanese files
          try {
            const decoder = new TextDecoder('shift-jis');
            text = decoder.decode(uint8Array);
          } catch {
            // Final fallback to UTF-8 without fatal flag
            const decoder = new TextDecoder('utf-8');
            text = decoder.decode(uint8Array);
          }
        }
      }

      // Parse the decoded text
      Papa.parse<CsvRow>(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data.length > 0) {
            const headers = Object.keys(results.data[0]);
            setCsvHeaders(headers);
            setCsvData(results.data);

            // Load keyword mappings and find template in parallel
            const [matchingTemplate, loadedCache] = await Promise.all([
              findMatchingTemplate(headers),
              loadKeywordMappings(),
            ]);

            if (matchingTemplate) {
              // Auto-apply the matching template
              setSelectedStrategy(matchingTemplate.strategy);

              // Create column mapping from template
              const mapping: ColumnMappingFormData = {
                strategy: matchingTemplate.strategy,
                transactionDate:
                  matchingTemplate.column_mapping.transactionDate,
                ...(matchingTemplate.column_mapping.transactionAmount && {
                  transactionAmount:
                    matchingTemplate.column_mapping.transactionAmount,
                }),
                ...(matchingTemplate.column_mapping.depositAmount && {
                  depositAmount: matchingTemplate.column_mapping.depositAmount,
                }),
                ...(matchingTemplate.column_mapping.withdrawalAmount && {
                  withdrawalAmount:
                    matchingTemplate.column_mapping.withdrawalAmount,
                }),
                ...(matchingTemplate.column_mapping.categoryColumn && {
                  categoryColumn:
                    matchingTemplate.column_mapping.categoryColumn,
                }),
                ...(matchingTemplate.column_mapping.depositValue && {
                  depositValue: matchingTemplate.column_mapping.depositValue,
                }),
                ...(matchingTemplate.column_mapping.withdrawalValue && {
                  withdrawalValue:
                    matchingTemplate.column_mapping.withdrawalValue,
                }),
                ...(matchingTemplate.column_mapping.notes && {
                  notes: matchingTemplate.column_mapping.notes,
                }),
                ...(matchingTemplate.column_mapping.units && {
                  units: matchingTemplate.column_mapping.units,
                }),
              } as ColumnMappingFormData;

              // Skip to preview directly - pass the data and cache directly to avoid state timing issues
              await handleMappingComplete(mapping, results.data, loadedCache);
              setIsLoadingCsv(false);
            } else {
              // No matching template, show strategy dialog
              setShowStrategyDialog(true);
              setIsLoadingCsv(false);
            }
          } else {
            setIsLoadingCsv(false);
          }
        },
        error: (error: Error) => {
          console.error('Error parsing CSV:', error);
          setIsLoadingCsv(false);
        },
      });
    };

    reader.readAsArrayBuffer(file);

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleStrategySelect = (strategy: AmountMappingStrategy) => {
    setSelectedStrategy(strategy);
    setShowStrategyDialog(false);
    setShowMappingDialog(true);
  };

  const handleMappingBack = () => {
    setShowMappingDialog(false);
    setShowStrategyDialog(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleMappingComplete = async (
    mapping: ColumnMappingFormData,
    data?: CsvRow[],
    cache?: Map<
      string,
      { from_bucket_id: number | null; to_bucket_id: number | null }
    >,
  ) => {
    // Use provided data or fall back to state
    const dataToProcess = data || csvData;
    // Use provided cache or fall back to state
    const cacheToUse = cache || keywordMappingsCache;

    // Map CSV data to transactions based on column mapping and strategy
    const mapped = dataToProcess.map((row) => {
      const notes =
        'notes' in mapping && mapping.notes ? row[mapping.notes] || '' : '';

      // Parse units if column is mapped (use sanitizeMoneyInput to handle commas)
      const defaultUnit =
        'units' in mapping && mapping.units
          ? sanitizeMoneyInput(row[mapping.units] || '0') || null
          : null;

      // Calculate transaction amount and deposit flag based on strategy
      let transactionAmount: number;
      let isDeposit = true;

      switch (mapping.strategy) {
        case 'single_transaction': {
          // Option 1: Single transaction column (positive = deposit, negative = withdrawal)
          const value = sanitizeMoneyInput(
            row[mapping.transactionAmount] || '',
          );
          transactionAmount = Math.abs(value);
          isDeposit = value >= 0;
          break;
        }

        case 'deposit_withdrawal': {
          // Option 2: Separate deposit/withdrawal columns
          const depositValue = sanitizeMoneyInput(
            row[mapping.depositAmount] || '',
          );
          const withdrawalValue = sanitizeMoneyInput(
            row[mapping.withdrawalAmount] || '',
          );

          // Use whichever has a value (they should be mutually exclusive)
          if (depositValue > 0) {
            transactionAmount = depositValue;
            isDeposit = true;
          } else if (withdrawalValue > 0) {
            transactionAmount = withdrawalValue;
            isDeposit = false;
          } else {
            transactionAmount = 0;
          }
          break;
        }

        case 'transaction_with_category': {
          // Option 3: Transaction amount + category column
          const value = sanitizeMoneyInput(
            row[mapping.transactionAmount] || '',
          );
          transactionAmount = Math.abs(value);

          const categoryValue = row[mapping.categoryColumn] || '';
          isDeposit = categoryValue !== mapping.withdrawalValue;
          break;
        }
      }

      let fromBucketId: number | null = null;
      let toBucketId: number | null = null;

      // Use keyword mapping cache to assign buckets based on notes
      if (notes) {
        // Process notes as a single keyword, removing all numbers (same logic as backend)
        const keyword = notes.replace(/\d/g, '').trim();
        if (keyword) {
          // Check preloaded cache for bucket pair
          const cachedBucketPair = cacheToUse.get(keyword);
          if (cachedBucketPair) {
            fromBucketId = cachedBucketPair.from_bucket_id;
            toBucketId = cachedBucketPair.to_bucket_id;
          }
        }
      }

      const fromBucketIdStr = fromBucketId ? fromBucketId.toString() : '';
      const toBucketIdStr = toBucketId ? toBucketId.toString() : '';

      const dateString = formatToDateTimeLocal(
        row[mapping.transactionDate] || '',
      );
      return {
        transaction_date: dayjs(dateString),
        amount: Math.abs(transactionAmount),
        notes: notes,
        from_bucket_id: fromBucketIdStr, // Will be auto-suggested from keyword mapping
        to_bucket_id: toBucketIdStr, // Will be auto-suggested from keyword mapping
        import_status: 'validating' as ImportStatus,
        should_import: true,
        is_deposit: isDeposit,
        from_units: null,
        to_units: null,
        default_unit: defaultUnit,
      };
    });

    // Sort by transaction_date in ascending order
    const sortedMapped = [...mapped].sort((a, b) => {
      return a.transaction_date.diff(b.transaction_date);
    });

    setMappedTransactions(sortedMapped);
    setShowMappingDialog(false);
    setShowPreviewDialog(true);
  };

  const handlePreviewClose = () => {
    setShowPreviewDialog(false);
    setCsvData([]);
    setCsvHeaders([]);
    setMappedTransactions([]);
  };

  const handlePreviewBack = () => {
    setShowPreviewDialog(false);
    setShowMappingDialog(true);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={<UploadFileIcon />}
        onClick={handleImportClick}
      >
        Import Transaction CSV
      </Button>

      <AmountMappingStrategyDialog
        open={showStrategyDialog}
        onClose={() => setShowStrategyDialog(false)}
        onSelectStrategy={handleStrategySelect}
      />

      <ColumnMappingDialog
        open={showMappingDialog}
        headers={csvHeaders}
        csvData={csvData}
        strategy={selectedStrategy}
        onClose={() => setShowMappingDialog(false)}
        onBack={handleMappingBack}
        onComplete={handleMappingComplete}
      />

      <TransactionPreviewDialog
        open={showPreviewDialog}
        initialMappedTransactions={mappedTransactions}
        onClose={handlePreviewClose}
        onBack={handlePreviewBack}
      />

      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
        open={isLoadingCsv}
      >
        <CircularProgress color="inherit" />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6">Processing CSV file...</Typography>
          <Typography variant="body2">
            Reading file and looking up templates
          </Typography>
        </Box>
      </Backdrop>
    </>
  );
}
