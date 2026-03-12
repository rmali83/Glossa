# QA System Integration Guide for CATProjectView.jsx

## Step 1: Add Imports (at the top of the file)

Add these imports after the existing imports:

```javascript
import { runQAChecks, getQASummary, autoFixIssues, getSeverityIcon, getSeverityColor } from '../services/qaEngine';
import QAPanel from '../components/QAPanel';
```

## Step 2: Add State Variables (after existing state declarations)

Add these state variables after the annotation state:

```javascript
// QA state
const [qaIssues, setQaIssues] = useState([]);
const [isRunningQA, setIsRunningQA] = useState(false);
```

## Step 3: Add QA Functions (after saveAnnotation function)

Add these functions:

```javascript
// QA Functions
const runQA = () => {
    if (!segments[activeSegmentIndex]) return;
    
    setIsRunningQA(true);
    try {
        const issues = runQAChecks(
            segments[activeSegmentIndex].source,
            segments[activeSegmentIndex].target,
            {
                maxLength: 1000,
                warnThreshold: 0.8
            }
        );
        setQaIssues(issues);
        console.log('QA check complete:', issues.length, 'issues found');
    } catch (err) {
        console.error('QA check error:', err);
    } finally {
        setIsRunningQA(false);
    }
};

const handleAutoFix = () => {
    if (!segments[activeSegmentIndex] || qaIssues.length === 0) return;
    
    const fixed = autoFixIssues(segments[activeSegmentIndex].target, qaIssues);
    handleSegmentChange(fixed);
    
    // Re-run QA after fix
    setTimeout(() => runQA(), 100);
};

// Run QA automatically when target changes
useEffect(() => {
    if (segments[activeSegmentIndex]?.target) {
        const timer = setTimeout(() => {
            runQA();
        }, 1000); // Debounce 1 second
        
        return () => clearTimeout(timer);
    } else {
        setQaIssues([]);
    }
}, [segments[activeSegmentIndex]?.target, activeSegmentIndex]);
```

## Step 4: Update handleConfirmAndNext (add QA check before confirming)

Replace the existing `handleConfirmAndNext` function with this:

```javascript
const handleConfirmAndNext = async () => {
    // Check for QA errors before confirming
    const errorCount = qaIssues.filter(i => i.severity === 'error').length;
    
    if (errorCount > 0) {
        const confirmed = window.confirm(
            `⚠️ This segment has ${errorCount} QA error(s).\n\n` +
            `Errors:\n${qaIssues.filter(i => i.severity === 'error').map(i => `• ${i.message}`).join('\n')}\n\n` +
            `Do you want to confirm anyway?`
        );
        
        if (!confirmed) {
            // Switch to QA tab to show issues
            setActiveTab('qa');
            return;
        }
    }
    
    const newSegments = [...segments];
    newSegments[activeSegmentIndex].status = 'confirmed';
    setSegments(newSegments);
    
    // Save to database
    await saveSegmentToDatabase(newSegments[activeSegmentIndex]);
    
    // Check if all segments are confirmed
    const allConfirmed = newSegments.every(seg => seg.status === 'confirmed');
    if (allConfirmed && !isReviewer) {
        // Update project status to translation_completed
        await updateProjectStatus('translation_completed');
    }
    
    if (activeSegmentIndex < segments.length - 1) {
        setActiveSegmentIndex(activeSegmentIndex + 1);
    }
};
```

## Step 5: Add QA Tab Button (in the tabs section)

Find this section (around line 1215):

```javascript
<button 
    onClick={() => setActiveTab('annotation')}
    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 flex items-center justify-center gap-1 ${
        activeTab === 'annotation' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
    }`}
>
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
    </svg>
    QA
</button>
```

Add this NEW button AFTER the annotation button:

```javascript
<button 
    onClick={() => setActiveTab('qa')}
    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 flex items-center justify-center gap-1 ${
        activeTab === 'qa' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
    }`}
>
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    QA
    {qaIssues.length > 0 && (
        <span style={{
            background: qaIssues.some(i => i.severity === 'error') ? '#ef4444' : '#f59e0b',
            color: '#fff',
            fontSize: '0.6rem',
            padding: '0.1rem 0.3rem',
            borderRadius: '9999px',
            fontWeight: 'bold',
            minWidth: '1rem',
            textAlign: 'center'
        }}>
            {qaIssues.length}
        </span>
    )}
</button>
```

## Step 6: Add QA Tab Content (after annotation tab content)

Find the annotation tab content (around line 1380) and add this AFTER it:

```javascript
{activeTab === 'qa' && (
    <QAPanel 
        issues={qaIssues}
        onRunQA={runQA}
        onAutoFix={handleAutoFix}
        isRunning={isRunningQA}
    />
)}
```

## Step 7: Add QA Warning Badge (below target textarea)

Find the target textarea section (around line 1000) and add this AFTER the textarea but BEFORE the "Confirmed" badge:

```javascript
{/* QA Warning Badge */}
{qaIssues.length > 0 && (
    <div style={{
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        display: 'flex',
        gap: '0.5rem',
        flexDirection: 'column',
        alignItems: 'flex-end'
    }}>
        {qaIssues.slice(0, 3).map((issue, index) => (
            <div
                key={index}
                style={{
                    position: 'relative',
                    cursor: 'pointer'
                }}
                className="qa-warning-badge"
                title={`${issue.message}\n${issue.suggestion}`}
            >
                <div style={{
                    padding: '0.5rem',
                    background: getSeverityColor(issue.severity) + '20',
                    border: `2px solid ${getSeverityColor(issue.severity)}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: getSeverityColor(issue.severity),
                    boxShadow: `0 2px 8px ${getSeverityColor(issue.severity)}40`
                }}>
                    <span style={{ fontSize: '1rem' }}>{getSeverityIcon(issue.severity)}</span>
                    <span>{issue.type.replace(/_/g, ' ')}</span>
                </div>
            </div>
        ))}
        {qaIssues.length > 3 && (
            <div style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(100, 116, 139, 0.2)',
                border: '1px solid #64748b',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: '#94a3b8'
            }}>
                +{qaIssues.length - 3} more
            </div>
        )}
    </div>
)}
```

## Step 8: Add QA Summary in Segment List (optional)

In the segment list item (around line 950), add QA badge:

```javascript
<div className="flex justify-between items-start mb-1">
    <span className={`text-[10px] font-bold uppercase tracking-wider ${
        activeSegmentIndex === segments.indexOf(seg) ? 'text-primary-500' : 'text-slate-400'
    }`}>
        Segment #{seg.id}
    </span>
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <span 
            className="status-dot" 
            style={{ backgroundColor: getStatusColor(seg.status) }}
            title={seg.status}
        ></span>
        {/* Add QA indicator here if you want */}
    </div>
</div>
```

## Step 9: Add CSS for Hover Tooltips

Add this CSS to your `CATProjectWorkspace.css` file:

```css
/* QA Warning Badge Hover Effect */
.qa-warning-badge {
    transition: transform 0.2s ease;
}

.qa-warning-badge:hover {
    transform: scale(1.05);
    z-index: 10;
}

.qa-warning-badge:hover::after {
    content: attr(title);
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 0.5rem;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.95);
    color: #fff;
    border-radius: 8px;
    font-size: 0.75rem;
    white-space: pre-line;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 1000;
    pointer-events: none;
}
```

## Step 10: Add Inline QA Warning Below Editor (alternative to badges)

Add this section AFTER the target textarea and BEFORE the editor controls:

```javascript
{/* Inline QA Warnings */}
{qaIssues.length > 0 && (
    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {qaIssues.filter(i => i.severity === 'error').slice(0, 2).map((issue, index) => (
            <div
                key={index}
                style={{
                    padding: '0.75rem',
                    background: getSeverityColor(issue.severity) + '10',
                    border: `1px solid ${getSeverityColor(issue.severity)}40`,
                    borderLeft: `3px solid ${getSeverityColor(issue.severity)}`,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.875rem'
                }}
            >
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                    {getSeverityIcon(issue.severity)}
                </span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: getSeverityColor(issue.severity), marginBottom: '0.25rem' }}>
                        {issue.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {issue.suggestion}
                    </div>
                </div>
                <button
                    onClick={() => setActiveTab('qa')}
                    style={{
                        padding: '0.25rem 0.75rem',
                        background: 'transparent',
                        border: `1px solid ${getSeverityColor(issue.severity)}`,
                        borderRadius: '4px',
                        color: getSeverityColor(issue.severity),
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    View All
                </button>
            </div>
        ))}
    </div>
)}
```

---

## Complete Integration Checklist

- [ ] Step 1: Add imports
- [ ] Step 2: Add state variables
- [ ] Step 3: Add QA functions
- [ ] Step 4: Update handleConfirmAndNext
- [ ] Step 5: Add QA tab button
- [ ] Step 6: Add QA tab content
- [ ] Step 7: Add QA warning badges
- [ ] Step 8: Add QA summary in segment list (optional)
- [ ] Step 9: Add CSS for hover tooltips
- [ ] Step 10: Add inline QA warnings (optional)

---

## Testing

After integration, test:

1. ✅ Type in target field → QA runs automatically after 1 second
2. ✅ Click QA tab → See all issues
3. ✅ Hover over warning badge → See tooltip
4. ✅ Click "Confirm & Next" with errors → See warning dialog
5. ✅ Click "Fix All" → Auto-fix whitespace issues
6. ✅ Add numbers in source → Missing number error appears

---

## Visual Result

```
┌─────────────────────────────────────────────┐
│ Target Language (Urdu)                      │
│ ┌─────────────────────────────────────┐ ⚠️ │ ← Warning badge
│ │ یہ ہے ترجمہ                          │ ❌ │ ← Error badge
│ │                                     │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ ⚠️ Trailing space detected                  │ ← Inline warning
│    Remove space at end                      │
│                                             │
│ [Previous] [Next] [AI Translate]            │
│ [Draft] [Confirm & Next]                    │
└─────────────────────────────────────────────┘
```

---

## Notes

- QA runs automatically 1 second after typing stops
- Errors block confirmation (with warning dialog)
- Warnings don't block but show alerts
- Auto-fix works for whitespace and capitalization
- Hover tooltips show full error details
- QA tab shows all issues grouped by category

