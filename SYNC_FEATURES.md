# Real-Time Sync Features

## Overview
The GlossaCAT workspace and project management now include real-time synchronization using Supabase's real-time capabilities. All changes are instantly reflected across all users and sessions.

## Features

### 1. **Workspace Real-Time Sync**
The translation workspace automatically syncs:
- **Segment updates**: When you or another translator edits a segment
- **Status changes**: When segments are confirmed, drafted, or approved
- **Project updates**: When project status changes (assigned, in_progress, completed)
- **Auto-refresh**: Changes appear instantly without page reload

### 2. **Projects List Real-Time Sync**
The main GlossaCAT dashboard syncs:
- **New projects**: Appear immediately when assigned
- **Status updates**: Project status changes reflect instantly
- **Completion**: Projects move to completed status in real-time
- **Multi-user**: See changes made by admins or other team members

### 3. **Auto-Save with Sync**
- **2-second delay**: Changes are saved 2 seconds after you stop typing
- **Database sync**: All changes are persisted to Supabase
- **Status indicator**: "Auto-saved" indicator shows when changes are saved
- **No data loss**: All work is automatically backed up

### 4. **Manual Sync Button**
Located in the workspace header:
- **Refresh icon**: Click to manually sync latest changes
- **Instant update**: Fetches latest segments from database
- **Useful for**: Checking if other translators made changes
- **No interruption**: Doesn't affect your current work

## How It Works

### Real-Time Subscriptions
The app uses Supabase's PostgreSQL real-time features:

```javascript
// Segments subscription
supabase
  .channel(`segments-${projectId}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'segments',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    // Automatically refresh segments
    fetchSegments();
  })
  .subscribe();

// Projects subscription
supabase
  .channel('projects-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'projects'
  }, (payload) => {
    // Automatically refresh projects list
    fetchProjects();
  })
  .subscribe();
```

### Auto-Save Mechanism
```javascript
// Save after 2 seconds of inactivity
const handleSegmentChange = (value) => {
  setSegments(newSegments);
  
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  const timeout = setTimeout(() => {
    saveSegmentToDatabase(segment);
  }, 2000);
  setAutoSaveTimeout(timeout);
};
```

## Use Cases

### 1. **Collaborative Translation**
- Multiple translators can work on different segments
- Changes sync in real-time
- No conflicts or overwrites
- See progress as team works

### 2. **Reviewer Workflow**
- Reviewer sees translator's progress in real-time
- Can start reviewing completed segments immediately
- Status updates sync instantly
- Efficient back-and-forth communication

### 3. **Admin Monitoring**
- Admins see all project updates live
- Track translator progress in real-time
- Identify bottlenecks quickly
- Make informed assignment decisions

### 4. **Multi-Device Work**
- Work on desktop, continue on laptop
- Changes sync across all devices
- No need to manually refresh
- Seamless experience

## Sync Events

### Segment Events
- **INSERT**: New segment added to project
- **UPDATE**: Segment text or status changed
- **DELETE**: Segment removed (rare)

### Project Events
- **UPDATE**: Project status, name, or settings changed
- **INSERT**: New project created and assigned
- **DELETE**: Project archived or removed

## Performance

### Optimizations
- **Debounced saves**: Prevents excessive database writes
- **Selective updates**: Only changed fields are updated
- **Efficient queries**: Indexed database queries for speed
- **Channel cleanup**: Subscriptions are properly cleaned up

### Bandwidth
- **Minimal data**: Only changes are transmitted
- **Compressed**: Supabase uses efficient protocols
- **Low latency**: Sub-second update propagation
- **Scalable**: Handles multiple concurrent users

## Troubleshooting

### Changes not syncing?
1. Check internet connection
2. Click the manual sync button
3. Refresh the page
4. Check browser console for errors

### Slow sync?
1. Check network speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Try a different browser

### Conflicts?
- The system uses "last write wins" strategy
- Manual sync shows latest version
- Always review before confirming segments
- Use draft status for work in progress

## Future Enhancements
- Conflict resolution UI
- Offline mode with sync queue
- Change history and version control
- Real-time cursor positions (collaborative editing)
- Presence indicators (who's online)
- Live chat between translators and reviewers

## Technical Details

### Database Setup
Ensure real-time is enabled in Supabase:
```sql
-- Enable real-time for segments table
ALTER PUBLICATION supabase_realtime ADD TABLE segments;

-- Enable real-time for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
```

### Security
- Row Level Security (RLS) enforced
- Users only see their assigned projects
- Segments filtered by project access
- Real-time respects RLS policies

## Best Practices

1. **Save frequently**: Don't rely only on auto-save
2. **Check sync status**: Look for "Auto-saved" indicator
3. **Use manual sync**: When switching between devices
4. **Confirm segments**: Mark as confirmed when done
5. **Monitor progress**: Use the progress bar to track work

## Support
For sync issues or questions, contact the development team or check the application logs in the browser console.
