# Dashboard Layout System Guide

This guide explains how to use the new dashboard layout system that allows users to customize their dashboard with flexible row and column layouts.

## Features

- **Row-based layout**: Dashboard organized in rows, each row can have 1-3 columns
- **Dynamic columns per row**: Different rows can have different numbers of columns
- **Reorderable rows**: Rows can be reordered to change section positions
- **Reorderable sections**: Charts, Asset Accounts, Expense Accounts, and Income sections
- **Reorderable accounts**: Within Asset Accounts, individual accounts can be reordered
- **Reorderable buckets**: Within each account, buckets can be reordered
- **Persistent storage**: Layout preferences are saved to the database
- **Flexible column widths**: Uses a 12-column grid system (like Bootstrap)

## Architecture

### Database Layer

**Table**: `user_preferences`
- Stores user-specific preferences as JSONB
- Key: `dashboard_layout`
- Row-level security ensures data isolation

**Migration**: `supabase/002_user_preferences.sql`

### Backend (Electron)

**Query Functions**: `src/electron/database/queries/userPreferences.ts`
- `getUserPreference()`: Fetch a preference by key
- `upsertUserPreference()`: Create or update a preference

**IPC Handlers**: `src/electron/main.ts`
- `db:getUserPreference`
- `db:upsertUserPreference`

### Frontend (React)

**API Layer**: `src/ui/features/dashboard/api/userPreferencesApi.ts`
- `useGetDashboardLayoutQuery()`: Fetch saved layout
- `useSaveDashboardLayoutMutation()`: Save layout changes

**Context**: `src/ui/features/dashboard/context/`
- `DashboardLayoutContext`: React context for layout state
- `DashboardLayoutProvider`: Provider component with default layout
- `useDashboardLayout()`: Hook to access layout context

**Component**: `src/ui/features/dashboard/components/Dashboard.tsx`
- Renders dashboard based on saved layout
- Supports dynamic column rendering
- Section ordering within columns

## Data Structure

### Layout JSON Structure

The layout is organized as **rows**, where each row can contain 1-3 **columns**, and each column displays one **section**.

```typescript
{
  "dashboard_layout": {
    "rows": [
      {
        "id": "row-1",
        "order": 0,
        "columns": [
          {
            "id": "col-1-1",
            "width": 6,  // Total width = 12 (6 = 50%)
            "section": {
              "type": "charts",
              "items": ["netWorth", "income", "expenses"]
            }
          },
          {
            "id": "col-1-2",
            "width": 6,  // 50%
            "section": {
              "type": "assetAccounts",
              "accounts": [
                {
                  "accountId": 1,
                  "bucketOrder": [10, 12, 11]
                },
                {
                  "accountId": 3,
                  "bucketOrder": [20, 21]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "row-2",
        "order": 1,
        "columns": [
          {
            "id": "col-2-1",
            "width": 12,  // 100% (full width)
            "section": {
              "type": "expenseAccounts"
            }
          }
        ]
      },
      {
        "id": "row-3",
        "order": 2,
        "columns": [
          {
            "id": "col-3-1",
            "width": 12,
            "section": {
              "type": "income"
            }
          }
        ]
      }
    ]
  }
}
```

### Row and Column Examples

**Single column row (full width)**:

```typescript
{
  id: "row-1",
  order: 0,
  columns: [
    { id: "col-1", width: 12, section: { type: "charts", items: [] } }
  ]
}
```

**Two column row (50/50 split)**:

```typescript
{
  id: "row-2",
  order: 1,
  columns: [
    { id: "col-1", width: 6, section: { type: "assetAccounts", accounts: [] } },
    { id: "col-2", width: 6, section: { type: "expenseAccounts" } }
  ]
}
```

**Three column row (equal split)**:

```typescript
{
  id: "row-3",
  order: 2,
  columns: [
    { id: "col-1", width: 4, section: { type: "charts", items: [] } },
    { id: "col-2", width: 4, section: { type: "assetAccounts", accounts: [] } },
    { id: "col-3", width: 4, section: { type: "expenseAccounts" } }
  ]
}
```

### Section Types

1. **charts**: Displays all dashboard charts
2. **assetAccounts**: Shows asset accounts with buckets
3. **expenseAccounts**: Shows expense accounts with buckets
4. **income**: Shows income sources

## Usage Examples

### Basic Usage (Already Implemented)

The Dashboard component automatically uses the layout system:

```typescript
export function Dashboard() {
  return (
    <DashboardErrorProvider>
      <DashboardLayoutProvider>
        <DashboardContent />
      </DashboardLayoutProvider>
    </DashboardErrorProvider>
  );
}
```

### Accessing Layout in Your Components

```typescript
import { useDashboardLayout } from '../hooks/useDashboardLayout';

function MyComponent() {
  const { layout, isLoading, saveLayout, resetToDefault } = useDashboardLayout();

  // Access current layout
  console.log(layout);

  // Save new layout with rows
  const handleSave = async () => {
    const newLayout: DashboardLayout = {
      rows: [
        {
          id: 'row-1',
          order: 0,
          columns: [
            {
              id: 'col-1',
              width: 12,
              section: { type: 'charts', items: [] }
            },
          ],
        },
        {
          id: 'row-2',
          order: 1,
          columns: [
            {
              id: 'col-2-1',
              width: 6,
              section: { type: 'assetAccounts', accounts: [] }
            },
            {
              id: 'col-2-2',
              width: 6,
              section: { type: 'expenseAccounts' }
            },
          ],
        },
      ],
    };
    await saveLayout(newLayout);
  };

  // Reset to default
  const handleReset = () => {
    resetToDefault();
  };

  return <div>...</div>;
}
```

### Creating a Layout Editor

To create a layout editor UI, you would:

1. Use `useDashboardLayout()` to get current layout
2. Create drag-and-drop interface for rows
3. Allow adding/removing rows
4. Allow splitting rows into columns
5. Allow changing section type for each column
6. Call `saveLayout()` to persist changes

Example structure:

```typescript
function LayoutEditor() {
  const { layout, saveLayout } = useDashboardLayout();
  const [editedLayout, setEditedLayout] = useState(layout);

  const handleAddRow = () => {
    // Add new row logic
  };

  const handleReorderRow = (rowIndex: number, newIndex: number) => {
    // Reorder row logic
  };

  const handleSplitRow = (rowIndex: number) => {
    // Split row into columns logic
  };

  const handleSave = async () => {
    if (editedLayout) {
      await saveLayout(editedLayout);
    }
  };

  return (
    <div>
      {/* Layout editor UI - see LayoutSettingsExample.tsx */}
    </div>
  );
}
```

## Default Layout

The default layout is a single column with all sections:

```typescript
{
  columns: [
    {
      id: 'col-1',
      width: 12,
      sections: [
        { type: 'charts', order: 0, items: [] },
        { type: 'assetAccounts', order: 1, accounts: [] },
        { type: 'expenseAccounts', order: 2 },
        { type: 'income', order: 3 },
      ],
    },
  ],
}
```

## Next Steps for UI Implementation

To complete the layout customization feature, you'll need to:

1. **Create a Layout Settings Dialog**
   - Button in Navbar to open settings
   - Modal/Dialog with layout editor

2. **Implement Drag-and-Drop**
   - Use a library like `react-beautiful-dnd` or `@dnd-kit/core`
   - Allow dragging sections between columns
   - Allow reordering sections within columns

3. **Column Management**
   - Add column button
   - Remove column button
   - Adjust column width slider

4. **Account & Bucket Ordering**
   - Drag-and-drop for accounts within assetAccounts section
   - Drag-and-drop for buckets within each account

5. **Chart Selection**
   - Allow users to choose which charts to display
   - Reorder charts within the charts section

## Type Definitions

All types are defined in `types.d.ts`:

- `DashboardLayout`
- `DashboardColumn`
- `DashboardSection`
- `DashboardSectionType`
- `DashboardChartSection`
- `DashboardAssetAccountsSection`
- `DashboardExpenseAccountsSection`
- `DashboardIncomeSection`
- `UserPreference`
- `DashboardLayoutPreference`

## Testing

To test the implementation:

1. **Run the migration**:
   ```bash
   # Apply the migration to your Supabase database
   psql -h your-db-host -d your-db -f supabase/002_user_preferences.sql
   ```

2. **Start the app**:
   ```bash
   npm run dev
   ```

3. **Verify default layout**: Dashboard should render with default single-column layout

4. **Test saving**: Call `saveLayout()` with a custom layout and refresh to verify persistence

## API Reference

### `useDashboardLayout()`

Returns:
- `layout: DashboardLayout | null` - Current dashboard layout
- `isLoading: boolean` - Whether layout is being fetched
- `saveLayout: (layout: DashboardLayout) => Promise<void>` - Save layout to database
- `resetToDefault: () => void` - Reset to default layout

### `useGetDashboardLayoutQuery()`

RTK Query hook to fetch dashboard layout preference.

### `useSaveDashboardLayoutMutation()`

RTK Query mutation hook to save dashboard layout preference.

## Troubleshooting

**Layout not persisting**:
- Check that migration has been applied
- Verify user is authenticated
- Check browser console for errors

**Layout not rendering**:
- Ensure DashboardLayoutProvider wraps your components
- Check that layout structure matches TypeScript types
- Verify sections have valid types

**Performance issues**:
- Consider memoizing layout calculations
- Debounce saveLayout calls if auto-saving
