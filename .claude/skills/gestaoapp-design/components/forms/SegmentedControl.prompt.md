Switches between views of the same data — List / Board / Calendar. Selected item is a white raised pill.

```jsx
<SegmentedControl value={view} onChange={setView} options={[
  { value: 'list', label: 'Lista', icon: 'list' },
  { value: 'board', label: 'Quadro', icon: 'columns-3' },
  { value: 'calendar', label: 'Calendário', icon: 'calendar' }
]} />
```
