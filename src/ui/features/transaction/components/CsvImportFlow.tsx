import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Papa from 'papaparse';
import { ColumnMappingDialog } from './ColumnMappingDialog';
import { TransactionPreviewDialog } from './TransactionPreviewDialog';
import { sanitizeMoneyInput } from '../../../shared/utils/formatMoney';
import { formatToDateTimeLocal } from '../../../shared/utils/dateTime';
import type {
  ImportStatus,
  MappedTransaction,
} from '../schemas/transaction.schema';
import { createSelector } from '@reduxjs/toolkit';
import { useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store/store';

interface CsvRow {
  [key: string]: string;
}

// Memoized selector to only extract bucket name and id from the normalized account state
// This prevents unnecessary re-renders when bucket balances change
// We use a custom equality check to deeply compare the extracted fields
const selectBucketNameAndId = createSelector(
  [(state: RootState) => state.account.buckets.byId],
  (bucketsById) => {
    return Object.values(bucketsById).map(({ name, id }) => ({ name, id }));
  },
  {
    memoizeOptions: {
      // Custom equality function that compares the actual bucket names/ids
      resultEqualityCheck: (
        prev: { name: string; id: number }[],
        next: { name: string; id: number }[],
      ) => {
        if (prev.length !== next.length) return false;
        return prev.every(
          (p, i) => p.id === next[i].id && p.name === next[i].name,
        );
      },
    },
  },
);

export function CsvImportFlow() {
  const buckets = useAppSelector(selectBucketNameAndId);
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
    Map<string, number>
  >(new Map());

  // Load all keyword mappings in the background when component mounts
  useEffect(() => {
    const loadKeywordMappings = async () => {
      try {
        const mappings = await window.electron.getKeywordBucketMappings();
        const cache = new Map<string, number>();

        // Build a cache of keyword -> best bucket ID
        mappings.forEach((mapping) => {
          // Find the bucket with the highest count for each keyword
          const bestAssignment = mapping.bucket_assign_count.reduce(
            (best, current) => (current.count > best.count ? current : best),
          );
          cache.set(mapping.keyword, bestAssignment.bucket_id);
        });

        setKeywordMappingsCache(cache);
      } catch (error) {
        console.error('Error preloading keyword mappings:', error);
      }
    };

    loadKeywordMappings();
  }, []);

  // Create a map of bucket name (lowercase) to bucket ID for quick lookup
  const bucketNameToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    buckets.forEach((bucket) => {
      map.set(bucket.name.toLowerCase().trim(), bucket.id);
    });
    return map;
  }, [buckets]);
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
    transactionAmount: string;
    notes: string;
    bucket: string;
  }) => {
    // Map CSV data to transactions based on column mapping
    const mapped = csvData.map((row) => {
      const notes = row[mapping.notes] || '';
      const transactionAmount = sanitizeMoneyInput(
        row[mapping.transactionAmount] || '',
      );
      const bucketName = (row[mapping.bucket] || '').toLowerCase().trim();
      let bucketId = bucketNameToIdMap.get(bucketName);

      // If no bucket from name, use preloaded keyword mapping cache
      if (!bucketId && notes) {
        // Process notes as a single keyword, removing all numbers (same logic as backend)
        const keyword = notes.replace(/\d/g, '').trim();
        if (keyword) {
          // Check preloaded cache
          const cachedBucketId = keywordMappingsCache.get(keyword);
          if (cachedBucketId) {
            bucketId = cachedBucketId;
          }
        }
      }

      const bucketIdStr = bucketId ? bucketId.toString() : '';

      return {
        transaction_date: formatToDateTimeLocal(
          row[mapping.transactionDate] || '',
        ),
        amount: Math.abs(transactionAmount),
        notes: notes,
        from_bucket_id: transactionAmount < 0 ? bucketIdStr : '', // Will be auto-mapped in preview dialog from bucket name or keyword suggestion
        to_bucket_id: transactionAmount > 0 ? bucketIdStr : '', // Will be auto-mapped in preview dialog from bucket name or keyword suggestion
        import_status: 'validating' as ImportStatus,
        should_import: true,
      };
    });

    setMappedTransactions(mapped);
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
        buckets={buckets}
        onClose={handlePreviewClose}
      />
    </>
  );
}
