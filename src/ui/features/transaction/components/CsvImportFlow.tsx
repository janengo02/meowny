import { useState, useRef } from 'react';
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
    const mapped = await Promise.all(
      csvData.map(async (row) => {
        const notes = row[mapping.notes] || '';
        const bucketName = row[mapping.bucket] || '';

        // Try keyword-based bucket mapping if no bucket name provided
        let suggestedBucketId: number | null = null;
        if (!bucketName && notes) {
          try {
            suggestedBucketId = await window.electron.getBucketFromKeywords(notes);
          } catch (error) {
            console.error('Error getting bucket from keywords:', error);
          }
        }

        return {
          transaction_date: formatToDateTimeLocal(
            row[mapping.transactionDate] || '',
          ),
          amount: sanitizeMoneyInput(row[mapping.transactionAmount] || ''),
          notes: notes,
          bucket: bucketName,
          from_bucket_id: '', // Will be auto-mapped in preview dialog from bucket name or keyword suggestion
          to_bucket_id: '', // Will be auto-mapped in preview dialog from bucket name or keyword suggestion
          suggested_bucket_id: suggestedBucketId, // Pass keyword suggestion to preview
          import_status: 'validating' as ImportStatus,
          should_import: true,
        };
      }),
    );

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
        transactions={mappedTransactions}
        onClose={handlePreviewClose}
      />
    </>
  );
}
