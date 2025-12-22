# Dashboard Drag-and-Drop Guide

## ✨ Features Implemented

I've added a fully functional drag-and-drop system for reordering dashboard sections!

### What You Can Do

1. **Enter Edit Mode**: Click the Edit button (pencil icon) in the top-right corner
2. **Drag Rows**: Grab the 6-dot handle (⋮⋮) on the left side of each row
3. **Reorder Sections**: Drag rows up or down to change the order
4. **Save Changes**: Click the Save button (checkmark icon) to persist your layout
5. **Cancel Changes**: Click the Cancel button (X icon) to discard changes

## 🎯 How It Works

### Edit Mode Button

A floating action button appears in the top-right corner:
- **Edit Icon** (pencil): Enters edit mode
- **Save Icon** (checkmark): Saves the new layout to database
- **Cancel Icon** (X): Discards changes and exits edit mode

### Drag Handle

When in edit mode, each row displays:
- **6-dot handle** (⋮⋮) on the left side
- **Dashed border** around the row
- **Visual feedback** when dragging (opacity change, highlighted border)

### Visual States

1. **Normal Mode**: Clean layout, no handles visible
2. **Edit Mode**:
   - Drag handles appear on the left
   - Rows have dashed borders
   - Content is indented to make room for handles
3. **Dragging State**:
   - Row becomes semi-transparent
   - Border highlights in primary color
   - Cursor changes to "grabbing"

## 🔧 Technical Implementation

### Components

1. **DraggableRow** ([DraggableRow.tsx](src/ui/features/dashboard/components/DraggableRow.tsx))
   - Wraps each row with drag-and-drop functionality
   - Shows/hides drag handle based on edit mode
   - Provides visual feedback during drag

2. **Dashboard** ([Dashboard.tsx](src/ui/features/dashboard/components/Dashboard.tsx))
   - Manages edit mode state
   - Handles drag-and-drop events
   - Saves layout to database

### Libraries Used

- **@dnd-kit/core**: Core drag-and-drop functionality
- **@dnd-kit/sortable**: Sortable list utilities
- **@dnd-kit/utilities**: Helper functions for transforms

### How Dragging Works

```typescript
// 1. User enters edit mode
setIsEditMode(true);

// 2. User drags a row
handleDragEnd(event) {
  // Find old and new positions
  const oldIndex = rows.findIndex(row => row.id === active.id);
  const newIndex = rows.findIndex(row => row.id === over.id);

  // Reorder rows
  const newRows = arrayMove(rows, oldIndex, newIndex);

  // Update order property (0, 1, 2, ...)
  return newRows.map((row, index) => ({ ...row, order: index }));
}

// 3. User saves
await saveLayout({ rows: localRows });
```

## 🎨 Customization

### Drag Handle Position

The drag handle is positioned to the left of the content:
```typescript
sx={{
  position: 'absolute',
  left: -48,  // Adjust this value to move handle
  top: '50%',
  transform: 'translateY(-50%)',
}}
```

### Drag Activation Distance

Requires 8px movement before drag starts (prevents accidental drags):
```typescript
activationConstraint: {
  distance: 8, // Increase for less sensitivity
}
```

### Visual Feedback

Customize the dragging appearance in `DraggableRow.tsx`:
```typescript
sx={{
  opacity: isDragging ? 0.5 : 1,  // Change opacity
  borderColor: isDragging ? 'primary.main' : 'divider',  // Change border color
}}
```

## 📱 Responsive Behavior

- **Desktop**: Full drag-and-drop functionality with handle on the left
- **Mobile**: Same functionality, but may need adjustments for smaller screens
- **Touch**: Fully supported via PointerSensor

## 🚀 Future Enhancements

Potential improvements:

1. **Column Splitting**: Add buttons to split/merge columns within rows
2. **Section Type Selector**: Change what section displays in each column
3. **Column Width Adjustment**: Drag to resize column widths
4. **Undo/Redo**: Keep history of layout changes
5. **Layout Presets**: Save multiple layout configurations
6. **Drag Preview**: Show a preview of where the row will drop

## 🐛 Known Limitations

1. **No nested dragging**: Can't drag individual columns within a row (only entire rows)
2. **Fixed column structure**: Column count per row is fixed (can't drag to change)
3. **No animations between saves**: Layout change is instant, not animated

These can be addressed in future iterations!

## 💡 Usage Tips

1. **Start Simple**: Begin by reordering rows to get familiar
2. **Preview Before Saving**: Drag rows around without saving to preview
3. **Cancel Anytime**: Hit Cancel to revert all changes
4. **Mobile Friendly**: Works on touch devices - just tap and hold the handle

## 🎯 Example Workflows

### Workflow 1: Move Charts to Bottom
```
1. Click Edit button
2. Grab Charts row handle
3. Drag to bottom
4. Click Save
```

### Workflow 2: Reorganize for Focus
```
1. Click Edit button
2. Arrange rows in priority order:
   - Most important sections at top
   - Less critical sections at bottom
3. Click Save
```

### Workflow 3: Experiment and Revert
```
1. Click Edit button
2. Try different arrangements
3. Don't like it? Click Cancel
4. Try again!
```

## 🔗 Related Documentation

- [Row-Based Layout Summary](ROW_BASED_LAYOUT_SUMMARY.md)
- [Dashboard Layout Guide](DASHBOARD_LAYOUT_GUIDE.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

---

Enjoy your customizable dashboard! 🎉
