# Handsontable Migration Guide
## Converting input tables in static apps to Handsontable (HOT)

Reference implementation: `app_anova/static/` — fully completed.  
Use this guide to apply the same pattern to the other apps.

---

## 1. CDN Setup (index.html `<head>`)

Add these two lines — they must come **before** `app.js`:

```html
<link  rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable@14.6.0/dist/handsontable.full.min.css">
<script src="https://cdn.jsdelivr.net/npm/handsontable@14.6.0/dist/handsontable.full.min.js"></script>
```

---

## 2. State Object — what to add per table

For every HOT table you add, register two fields in the `state` object:

```javascript
const state = {
    // ... existing fields ...
    hot:  null,   hot CellClasses:  {},   // HOT3 — main deviation/calc table
    hot2: null,   hot2CellClasses: {},    // HOT2 — group means table
    hot4: null,   hot4CellClasses: {},    // HOT4 — SS table
    hot5: null,   hot5CellClasses: {},    // HOT5 — ANOVA results table
};
```

`hotCellClasses` is a plain object keyed by `"row-col"` strings, value is `'correct'` | `'incorrect'` | `undefined`.

---

## 3. HTML Placeholder (index.html)

Replace the old `<table>` / `<input>` block with a plain container div + feedback divs:

```html
<!-- OLD (remove all of this): -->
<table class="calc-table"> ... <input> fields ... </table>
<div id="table-feedback"></div>

<!-- NEW (replace with these three lines): -->
<div id="hot3-container" class="hot-table-container"></div>
<div class="section-summary" id="feedback-deel3"></div>
<div class="feedback-panel"  id="feedback-detail-deel3"></div>
```

The pattern is always:
1. `<div id="hotN-container">` — HOT mounts here
2. `<div class="section-summary" id="feedback-deelN">` — green/yellow score badge
3. `<div class="feedback-panel"  id="feedback-detail-deelN">` — red panel with per-field hints

---

## 4. CSS (style.css) — shared classes to add/check

### Container centering

```css
/* All HOT containers: allow horizontal scroll, top margin */
#hot-container,
#hot2-container,
#hot4-container,
#hot5-container {
    margin-top: 10px;
    overflow: auto;
}

/* Tables that should be centered (fixed width + auto margins) */
#hot-container,
#hot2-container,
#hot4-container,
#hot5-container {
    margin-left: auto;
    margin-right: auto;
    max-width: 100%;
}
```

### Header row styling

```css
#hot-container  .handsontable th,
#hot2-container .handsontable th,
#hot4-container .handsontable th,
#hot5-container .handsontable th {
    background: #eff6ff;
    color: var(--blue);
    font-weight: 600;
    text-align: center;
    font-size: 0.82rem;
    white-space: normal;
    line-height: 1.25;
}
```

### Correct / Incorrect cell highlight

```css
.handsontable td.htCorrect {
    background: #f0fdf4 !important;
    outline: 2px solid #16a34a;
    outline-offset: -2px;
}
.handsontable td.htIncorrect {
    background: #fef2f2 !important;
    outline: 2px solid #dc2626;
    outline-offset: -2px;
}
```

### Special cell types

```css
/* Read-only / not-applicable cells (e.g. F for Binnen in ANOVA table) */
.handsontable td.hot-dimmed-cell {
    background: #f1f5f9 !important;
    color: #94a3b8 !important;
    pointer-events: none;
}

/* Computed/display cells (SS values auto-filled from previous section) */
.handsontable td.hot-ss-cell {
    background: #eff6ff !important;
    color: #1e3a8a !important;
    font-weight: 600;
}

/* Grand mean row separator */
.handsontable td.hot-grand-mean-cell {
    background: #fafbff !important;
    font-weight: 600;
    border-top: 2px solid #94a3b8 !important;
}
```

### Feedback panel (red, R-style)

```css
.feedback-panel {
    display: none;
    margin-top: 12px;
    padding: 10px 14px;
    border-radius: 10px;
    background: #fff5f5;
    border-left: 4px solid #d50000;
    font-size: 12.5px;
    line-height: 1.55;
}
.feedback-panel.visible { display: block; }
.feedback-panel-title { font-weight: 700; color: #7a1020; margin-bottom: 8px; font-size: 13px; }
.feedback-detail-item { margin-top: 8px; padding-top: 8px; border-top: 1px solid #f2c7cf; }
.feedback-detail-item:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }
.feedback-detail-label { font-weight: 700; color: #7a1020; margin-bottom: 3px; font-size: 12px; }
```

### Section summary badge

```css
.section-summary { font-size: 12px; border-radius: 5px; min-height: 0; line-height: 1.4; }
.section-summary.ok      { padding: 5px 10px; background: #dcfce7; color: #166534; border: 1px solid #86efac; }
.section-summary.partial { padding: 5px 10px; background: #fef9c3; color: #713f12; border: 1px solid #fde047; }
```

---

## 5. Helper Functions (app.js)

### humanizeGroup / humanizeLabel
Converts camelCase scenario labels to readable words:
```javascript
function humanizeGroup(g) {
    return String(g)
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .trim();
}
```

### Subscript numerals (for group mean labels like Ȳ₁)
```javascript
const toSub = n => String(n).split('').map(d =>
    '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'[+d]
).join('');
// Usage: `${humanizeGroup(g)} (\u0232${toSub(i + 1)})`
// Produces e.g. "Geen Programma (Ȳ₁)"
```

### debounce
Wrap `validateAll` in a debounce so it fires 250 ms after the last keypress:
```javascript
function debounce(fn, ms) {
    let timer;
    return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), ms); };
}
// Usage at top of every render function:
const hotValidate = debounce(validateAll, 250);
```

---

## 6. Render Function Template

One render function per HOT table. Always:
1. Get container, bail if absent
2. Destroy previous HOT instance and clear cell-class map
3. Build `tableData` (2-D array)
4. Compute **dynamic column widths** from scenario content
5. Create `new Handsontable(...)` with `licenseKey: 'non-commercial-and-evaluation'`
6. Hook `afterChange` → `hotValidate()`

### Dynamic width calculation (critical — prevents column overflow)

```javascript
// Example for a table with entity, group, Y columns + 4 fixed formula columns
const totalN      = state.data.length;
const entityLong  = [sc.entity + ' ' + totalN, 'Eenheid'].reduce((a,b) => a.length >= b.length ? a : b);
const groupLong   = ['Groep', ...sc.groups].reduce((a,b) => a.length >= b.length ? a : b);
const w0 = Math.max(70,  Math.ceil(entityLong.length * 7) + 16);   // entity col
const w1 = Math.max(90,  Math.ceil(groupLong.length  * 7) + 16);   // group col
const w2 = Math.max(65,  Math.ceil(sc.yName.length   * 7) + 16);   // Y variable col
const wF = 88;                                                       // formula cols (fixed)
const tableWidth = w0 + w1 + w2 + wF * 4;
```

Rule of thumb: `charCount * 7 + 16` pixels for proportional-font text. Adjust multiplier if labels use wider characters.

### Minimal HOT config

```javascript
state.hotN = new Handsontable(container, {
    data: tableData,
    licenseKey: 'non-commercial-and-evaluation',
    colHeaders: ['Col A', 'Col B'],
    columns: [
        { type: 'text',    readOnly: true },
        { type: 'numeric', numericFormat: { pattern: '0.0000' } }
    ],
    colWidths: [w0, 150],
    rowHeaders: false,
    width: w0 + 150,        // exact sum — no stretch
    height: 'auto',
    stretchH: 'none',       // IMPORTANT: never use 'last' — it balloons the last column
    cells(row, col) {
        const key = `${row}-${col}`;
        const cls = state.hotNCellClasses[key];
        const classes = [col === 0 ? 'htLeft' : 'htCenter'];
        if (cls === 'correct')   classes.push('htCorrect');
        if (cls === 'incorrect') classes.push('htIncorrect');
        return { className: classes.join(' ') };
    },
    afterChange(changes, source) {
        if (source === 'loadData') return;   // skip programmatic loads
        hotValidate();
    }
});
```

**Key HOT config decisions:**
| Setting | Value | Reason |
|---|---|---|
| `stretchH` | `'none'` | Prevents last column from stretching to fill container width |
| `width` | exact pixel sum of `colWidths` | Keeps table tight; combined with `margin: auto` for centering |
| `licenseKey` | `'non-commercial-and-evaluation'` | Required for community edition |
| `rowHeaders` | `false` | Hides row numbers |
| `afterChange` skips `'loadData'` | yes | Prevents validation firing on initial data load |

---

## 7. The `cells()` Callback — how coloring works

`cells(row, col)` is called by HOT for every cell on every render. It must return `{ className: '...' }`.

```javascript
cells(row, col) {
    const key = `${row}-${col}`;
    const cls = state.hotNCellClasses[key];   // 'correct' | 'incorrect' | undefined

    const classes = [];

    // Text alignment (always set one)
    classes.push(col === 0 ? 'htLeft' : 'htCenter');

    // Special row styling
    if (row === grandMeanRow) classes.push('hot-grand-mean-cell');

    // Dimmed (not-applicable) cells
    if (DIMMED_CELLS.has(key)) {
        classes.push('hot-dimmed-cell');
        return { readOnly: true, type: 'text', className: classes.join(' ') };
    }

    // Correct / incorrect highlight
    if (cls === 'correct')   classes.push('htCorrect');
    if (cls === 'incorrect') classes.push('htIncorrect');

    return { className: classes.join(' ') };
}
```

To force a re-render after updating `hotNCellClasses`:
```javascript
state.hotNCellClasses = newClasses;
if (state.hotN) state.hotN.render();
```

---

## 8. Validation System

### The `feedbackStore`
A module-level plain object that collects all per-field feedback messages:
```javascript
const feedbackStore = {};  // key = msgId string, value = HTML string | null
```

### `chkHot()` — validate one HOT cell

```javascript
function chkHot(hotCellClasses, row, col, expected, rawVal, msgId, fieldKey) {
    totalFields++;
    const str = rawVal == null ? '' : String(rawVal).trim();

    // Empty — clear state, don't count
    if (!str || str === 'null') {
        delete hotCellClasses[`${row}-${col}`];
        feedbackStore[msgId] = null;
        return 'empty';
    }

    const num = parseFloat(str.replace(',', '.'));

    // Not a number
    if (isNaN(num)) {
        hotCellClasses[`${row}-${col}`] = 'incorrect';
        feedbackStore[msgId] = 'Geen geldig getal.';
        return 'incorrect';
    }

    // Correct (tolerance: 0.0001 after rounding to 4 decimals)
    if (Math.abs(r4(num) - r4(expected)) < 0.0001) {
        correctFields++;
        hotCellClasses[`${row}-${col}`] = 'correct';
        feedbackStore[msgId] = null;
        return 'correct';
    }

    // Incorrect — look up a diagnostic hint
    hotCellClasses[`${row}-${col}`] = 'incorrect';
    feedbackStore[msgId] = getFeedbackMsg(fieldKey, str, truth);
    return 'incorrect';
}
```

### Calling pattern inside `validateAll()`

```javascript
function validateAll() {
    const { truth, scenario: sc } = state;
    if (!truth || !sc) return;

    let totalFields = 0, correctFields = 0;

    // ... (chk / chkHot calls for every section) ...

    // After each section, update HOT colors + section badge + detail panel:
    state.hotNCellClasses = newHotNClasses;
    if (state.hotN) state.hotN.render();

    updateSectionSummary(
        'feedback-deelN',
        sectionCorrect, sectionTotal,
        'Alle velden correct',        // label when 100%
        'controleer je antwoorden'    // label when partial
    );

    renderFeedbackPanel('feedback-detail-deelN', {
        'Field label 1': 'msgId1',
        'Field label 2': 'msgId2',
    });
}
```

### `updateSectionSummary()`

```javascript
function updateSectionSummary(divId, correct, total, labelOk, labelPartial) {
    const el = document.getElementById(divId);
    if (!el) return;
    if (total === 0) { el.innerHTML = ''; el.className = 'section-summary'; return; }
    if (correct === total) {
        el.innerHTML = `✅ ${labelOk} (${correct}/${total})`;
        el.className = 'section-summary ok';
    } else {
        el.innerHTML = `${correct}/${total} correct — ${labelPartial}`;
        el.className = 'section-summary partial';
    }
}
```

### `renderFeedbackPanel()`

```javascript
function renderFeedbackPanel(panelId, fieldMap) {
    // fieldMap: { 'Human label': 'feedbackStore key' }
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const items = Object.entries(fieldMap)
        .filter(([, msgId]) => feedbackStore[msgId])
        .map(([label, msgId]) => ({ label, html: feedbackStore[msgId] }));
    if (!items.length) { panel.innerHTML = ''; panel.className = 'feedback-panel'; return; }
    let html = '<div class="feedback-panel-title">Uitgebreide feedback:</div>';
    items.forEach(item => {
        html += `<div class="feedback-detail-item">
            <div class="feedback-detail-label">${item.label}</div>
            <div>${item.html}</div>
        </div>`;
    });
    panel.innerHTML = html;
    panel.className = 'feedback-panel visible';
}
```

---

## 9. `resetAllInputs()` — HOT tables

When the user resets, load blank data back (keep row labels intact):

```javascript
if (state.hotN && state.scenario) {
    const emptyData = state.scenario.groups.map((g, i) => [
        `${humanizeGroup(g)} (\u0232${toSub(i + 1)})`, null
    ]);
    emptyData.push(['Grootgemiddelde (\u0232..)', null]);
    state.hotN.loadData(emptyData);
    state.hotNCellClasses = {};
}
```

---

## 10. `autoFillAnswers()` — HOT tables

```javascript
if (state.hotN) {
    const fillData = sc.groups.map((g, i) => [
        `${humanizeGroup(g)} (\u0232${toSub(i + 1)})`,
        truth.grpMeans[g]
    ]);
    fillData.push(['Grootgemiddelde (\u0232..)', truth.grandMean]);
    state.hotN.loadData(fillData);
}
```

---

## 11. Merged Cells (for grouped rows)

When the same value spans all rows of a group (like (Ȳⱼ − Ȳ..) in HOT3):

```javascript
const mergeCells = [];
let rowIdx = 0;
sc.groups.forEach(g => {
    const n = data.filter(d => d.group === g).length;
    mergeCells.push({ row: rowIdx, col: 5, rowspan: n, colspan: 1 });
    mergeCells.push({ row: rowIdx, col: 6, rowspan: n, colspan: 1 });
    rowIdx += n;
});
// Pass to HOT: mergeCells: mergeCells
```

Validation: only check these cells for the **first row** of each group block:
```javascript
const groupFirstRow = {};
let lastGroup = null;
data.forEach((d, i) => {
    if (d.group !== lastGroup) { groupFirstRow[d.group] = i; lastGroup = d.group; }
});
// then: if (groupFirstRow[data[i].group] === i) { /* validate col 5 and 6 */ }
```

---

## 12. Common Pitfalls

| Pitfall | Fix |
|---|---|
| Last column balloons to fill width | Use `stretchH: 'none'` and set `width` to exact sum of `colWidths` |
| `cells()` returns wrong class after reset | Always reassign `state.hotNCellClasses = {}` before calling `loadData()` |
| Validation fires on initial data load | Check `if (source === 'loadData') return;` in `afterChange` |
| Two feedback messages shown for same section | Only use `updateSectionSummary` — remove any old `.innerHTML` writes to old DOM feedback divs |
| Column too narrow for scenario variable name | Use dynamic width formula: `Math.ceil(text.length * 7) + 16` |
| HOT instance not cleaned up on re-generate | Always call `state.hotN.destroy(); state.hotN = null;` before re-creating |
| Computed/display cells accept user input | Set `readOnly: true` inside `cells()` callback for those cells, not in `columns[]` |

---

## 13. Apps Still To Migrate

| App folder | Tables to convert | Notes |
|---|---|---|
| `app_correlatie_regressie/` | Scatter data input, regression table | Similar to HOT3 pattern |
| `app_meervoudige_regressie/` | Coefficient table | Similar to HOT5 pattern |
| `app_meervoudige_regressie_interactie/` | Coefficient + interaction table | HOT5 + dimmed cells |
| `app_partiele_correlatie/` | Correlation matrix input | Square symmetric table |

Apply in this order per app:
1. Add CDN links to `index.html`
2. Replace `<table>` blocks with container divs + feedback divs
3. Add HOT state fields
4. Add render functions with dynamic widths
5. Add CSS classes (copy from `app_anova/static/style.css` — section "HOT classes")
6. Wire `validateAll()` → `chkHot()` + `updateSectionSummary()` + `renderFeedbackPanel()`
7. Update `resetAllInputs()` and `autoFillAnswers()`
8. Test with each scenario: verify widths, merged cells, correct/incorrect coloring
