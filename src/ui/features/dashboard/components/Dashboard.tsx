import { Box, Container, Alert, Grid } from '@mui/material';
import { Navbar } from './Navbar';
import { AccountList } from '../../account/components/AccountList';
import { DashboardErrorProvider } from '../context/DashboardErrorProvider';
import { useDashboardError } from '../hooks/useDashboardError';
import { IncomeList } from '../../income/components/IncomeList';
import { AssetsOverTimeChart } from './AssetsOverTimeChart';
import { ExpensePieChart } from './ExpensePieChart';
import { BucketGoalsChart } from './BucketGoalsChart';
import { IncomeOverTimeChart } from './IncomeOverTimeChart';
import { IncomeVsSavingsChart } from './IncomeVsSavingsChart';
import { useGetAccountsWithBucketsQuery } from '../../account/api/accountApi';

// Fixed layout structure
const FIXED_LAYOUT: DashboardLayout = {
  rows: [
    {
      id: 'row-1',
      order: 0,
      columns: [
        {
          id: 'col-1-1',
          width: 12,
          sections: [{ type: 'assetsOverTimeChart' }],
        },
      ],
    },
    {
      id: 'row-2',
      order: 1,
      columns: [
        {
          id: 'col-2-1',
          width: 12,
          sections: [{ type: 'assetAccounts', accounts: [] }],
        },
      ],
    },
    {
      id: 'row-3',
      order: 2,
      columns: [
        {
          id: 'col-3-1',
          width: 6,
          sections: [{ type: 'expensePieChart' }],
        },
        {
          id: 'col-3-2',
          width: 6,
          sections: [{ type: 'bucketGoalsChart' }],
        },
      ],
    },
    {
      id: 'row-4',
      order: 3,
      columns: [
        {
          id: 'col-4-1',
          width: 12,
          sections: [{ type: 'expenseAccounts' }],
        },
      ],
    },
    {
      id: 'row-5',
      order: 4,
      columns: [
        {
          id: 'col-5-1',
          width: 6,
          sections: [{ type: 'incomeOverTimeChart' }],
        },
        {
          id: 'col-5-2',
          width: 6,
          sections: [{ type: 'incomeVsSavingsChart' }],
        },
      ],
    },
    {
      id: 'row-6',
      order: 5,
      columns: [
        {
          id: 'col-6-1',
          width: 12,
          sections: [{ type: 'income' }],
        },
      ],
    },
  ],
};

type DashboardSectionProps = {
  section: DashboardSection;
};

function DashboardSection({ section }: DashboardSectionProps) {
  switch (section.type) {
    case 'assetsOverTimeChart':
      return <AssetsOverTimeChart />;

    case 'expensePieChart':
      return <ExpensePieChart />;

    case 'bucketGoalsChart':
      return <BucketGoalsChart />;

    case 'incomeOverTimeChart':
      return <IncomeOverTimeChart />;

    case 'incomeVsSavingsChart':
      return <IncomeVsSavingsChart />;

    case 'assetAccounts':
      return <AccountList type="asset" />;

    case 'expenseAccounts':
      return <AccountList type="expense" />;

    case 'income':
      return <IncomeList />;

    default:
      return null;
  }
}

function DashboardContent() {
  const { error } = useDashboardError();

  // Fetch all accounts with their buckets to populate the store
  useGetAccountsWithBucketsQuery();

  // Use fixed layout
  const sortedRows = FIXED_LAYOUT.rows;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />
      <Container
        maxWidth="xl"
        sx={{
          flexShrink: 0,
          flexGrow: 0,
          width: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          px: 4,
          py: 2,
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Render rows with fixed layout */}
        {sortedRows.map((row) => (
          <Grid container spacing={3} key={row.id}>
            {row.columns.map((column) => (
              <Grid key={column.id} size={{ xs: 12, md: column.width }}>
                <Box>
                  {column.sections.map((section, sectionIndex) => (
                    <Box
                      key={sectionIndex}
                      sx={{
                        mb: 3,
                      }}
                    >
                      <DashboardSection section={section} />
                    </Box>
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        ))}
      </Container>
    </Box>
  );
}

export function Dashboard() {
  return (
    <DashboardErrorProvider>
      <DashboardContent />
    </DashboardErrorProvider>
  );
}
