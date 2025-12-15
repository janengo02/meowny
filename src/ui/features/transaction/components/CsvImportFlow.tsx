import { useState, useRef, useEffect } from 'react';
import { Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import { ColumnMappingDialog } from './ColumnMappingDialog';
import { TransactionPreviewDialog } from './TransactionPreviewDialog';
import { sanitizeMoneyInput } from '../../../shared/utils/formatMoney';
import { formatToDateTimeLocal } from '../../../shared/utils/dateTime';
import type {
  ImportStatus,
  MappedTransaction,
} from '../schemas/transaction.schema';
interface CsvRow {
  [key: string]: string;
}

export function CsvImportFlow() {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [mappedTransactions, setMappedTransactions] = useState<
    MappedTransaction[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Preload keyword-bucket mappings in the background
  const [keywordMappingsCache, setKeywordMappingsCache] = useState<
    Map<string, { from_bucket_id: number | null; to_bucket_id: number | null }>
  >(new Map());

  // Load all keyword mappings in the background when component mounts
  useEffect(() => {
    const loadKeywordMappings = async () => {
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
        console.log('Preloaded keyword mappings:', cache);

        setKeywordMappingsCache(cache);
      } catch (error) {
        console.error('Error preloading keyword mappings:', error);
      }
    };
    if (showMappingDialog) {
      loadKeywordMappings();
    }
  }, [showMappingDialog]);
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        complete: (results) => {
          if (results.data.length > 0) {
            const headers = Object.keys(results.data[0]);
            setCsvHeaders(headers);
            setCsvData(results.data);
            setShowMappingDialog(true);
          }
        },
        error: (error: Error) => {
          console.error('Error parsing CSV:', error);
        },
      });
    };

    reader.readAsArrayBuffer(file);

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleMappingComplete = async (mapping: {
    transactionDate: string;
    depositAmount?: string;
    withdrawalAmount?: string;
    notes: string;
  }) => {
    // Map CSV data to transactions based on column mapping
    const mapped = csvData.map((row) => {
      const notes = row[mapping.notes] || '';

      // Calculate transaction amount from deposit/withdrawal columns
      let transactionAmount: number;
      let isDeposit = false;

      const depositValue = mapping.depositAmount
        ? sanitizeMoneyInput(row[mapping.depositAmount] || '')
        : 0;
      const withdrawalValue = mapping.withdrawalAmount
        ? sanitizeMoneyInput(row[mapping.withdrawalAmount] || '')
        : 0;

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

      let fromBucketId: number | null = null;
      let toBucketId: number | null = null;

      // Use keyword mapping cache to assign buckets based on notes
      if (notes) {
        // Process notes as a single keyword, removing all numbers (same logic as backend)
        const keyword = notes.replace(/\d/g, '').trim();
        if (keyword) {
          // Check preloaded cache for bucket pair
          const cachedBucketPair = keywordMappingsCache.get(keyword);
          if (cachedBucketPair) {
            fromBucketId = cachedBucketPair.from_bucket_id;
            toBucketId = cachedBucketPair.to_bucket_id;
          }
        }
      }

      const fromBucketIdStr = fromBucketId ? fromBucketId.toString() : '';
      const toBucketIdStr = toBucketId ? toBucketId.toString() : '';

      return {
        transaction_date: formatToDateTimeLocal(
          row[mapping.transactionDate] || '',
        ),
        amount: Math.abs(transactionAmount),
        notes: notes,
        from_bucket_id: fromBucketIdStr, // Will be auto-suggested from keyword mapping
        to_bucket_id: toBucketIdStr, // Will be auto-suggested from keyword mapping
        import_status: 'validating' as ImportStatus,
        should_import: true,
        is_deposit: isDeposit,
      };
    });

    // Sort by transaction_date in ascending order
    const sortedMapped = [...mapped].sort((a, b) => {
      return dayjs(a.transaction_date).diff(dayjs(b.transaction_date));
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
        startIcon={<UploadFileIcon />}
        onClick={handleImportClick}
      >
        Import CSV
      </Button>

      <ColumnMappingDialog
        open={showMappingDialog}
        headers={csvHeaders}
        onClose={() => setShowMappingDialog(false)}
        onComplete={handleMappingComplete}
      />

      <TransactionPreviewDialog
        open={showPreviewDialog}
        initialMappedTransactions={mappedTransactions}
        onClose={handlePreviewClose}
      />
    </>
  );
}
