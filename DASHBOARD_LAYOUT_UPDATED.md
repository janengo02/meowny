# Dashboard Layout System - Row-Based Architecture

## Summary of Changes

The dashboard layout system has been updated from a **column-based** to a **row-based** architecture, providing much more flexibility:

### Key Changes

1. **Layout Structure**: Changed from `{ columns: [] }` to `{ rows: [] }`
2. **Each Row**: Can have 1-3 columns with different widths
3. **Dynamic Columns**: Different rows can have different numbers of columns
4. **Section Placement**: Each column contains exactly one section
5. **Reordering**: Rows can be reordered to change the dashboard layout

## New Data Structure

```typescript
type DashboardLayout = {
  rows: DashboardRow[];
};

type DashboardRow = {
  id: string;
  order: number;
  columns: DashboardColumn[];
};

type DashboardColumn = {
  id: string;
  width: number; // 1-12 (total row width = 12)
  section: DashboardSection;
};

type DashboardSection =
  | { type: 'charts'; items: string[] }
  | { type: 'assetAccounts'; accounts: AssetAccountItem[] }
  | { type: 'expenseAccounts' }
  | { type: 'income' };
```

## Example Layouts

### Default Layout (4 rows, all full-width)

```json
{
  "rows": [
    {
      "id": "row-1",
      "order": 0,
      "columns": [
        { "id": "col-1-1", "width": 12, "section": { "type": "charts", "items": [] } }
      ]
    },
    {
      "id": "row-2",
      "order": 1,
      "columns": [
        { "id": "col-2-1", "width": 12, "section": { "type": "assetAccounts", "accounts": [] } }
      ]
    },
    {
      "id": "row-3",
      "order": 2,
      "columns": [
        { "id": "col-3-1", "width": 12, "section": { "type": "expenseAccounts" } }
      ]
    },
    {
      "id": "row-4",
      "order": 3,
      "columns": [
        { "id": "col-4-1", "width": 12, "section": { "type": "income" } }
      ]
    }
  ]
}
```

### Custom Layout (Mixed column counts)

```json
{
  "rows": [
    {
      "id": "row-1",
      "order": 0,
      "columns": [
        { "id": "col-1-1", "width": 8, "section": { "type": "charts", "items": [] } },
        { "id": "col-1-2", "width": 4, "section": { "type": "income" } }
      ]
    },
    {
      "id": "row-2",
      "order": 1,
      "columns": [
        { "id": "col-2-1", "width": 6, "section": { "type": "assetAccounts", "accounts": [] } },
        { "id": "col-2-2", "width": 6, "section": { "type": "expenseAccounts" } }
      ]
    }
  ]
}
```

## Benefits of Row-Based Layout

1. **Greater Flexibility**: Each row can have its own column configuration
2. **Better Control**: Users can create complex layouts like:
   - Row 1: Charts full-width
   - Row 2: Asset Accounts (50%) + Expense Accounts (50%)
   - Row 3: Income full-width
3. **Easier Reordering**: Move entire rows up/down
4. **Intuitive UI**: Matches how users think about layout (stacked rows)
5. **Responsive**: Can adapt column counts for different screen sizes

## Migration Notes

- Old layouts will need to be migrated to the new structure
- Since this is a new feature, existing users won't have saved layouts yet
- The default layout provides backward-compatible behavior (all sections stacked vertically)
