# View Counting System - Fixes Applied

## Problems Identified

### 1. **Incorrect View Counting Logic**
**Problem**: The original code was counting ALL view records instead of UNIQUE providers viewed.

**Before**:
```typescript
const { count: dailyViewsCount } = await supabase
  .from('profile_views_tracking')
  .select('*', { count: 'exact', head: true })
  .eq('client_id', user.id)
  .eq('view_date', today);
```

**After**:
```typescript
const { data: viewsData } = await supabase
  .from('profile_views_tracking')
  .select('provider_id')
  .eq('client_id', user.id)
  .eq('view_date', today);

const uniqueProviders = new Set(viewsData?.map(v => v.provider_id) || []);
const viewsCount = uniqueProviders.size;
```

**Why**: We need to count distinct providers, not total view records. If a user refreshes a provider page, it shouldn't count as a new view.

---

### 2. **Race Condition in Access Control**
**Problem**: The access check happened BEFORE tracking the view, allowing users to view one extra profile.

**Before Flow**:
1. User has 2 views → canViewMore = true
2. User clicks 3rd profile
3. Check: canViewMore? YES (still shows 2)
4. Load profile
5. Track view (now 3)
6. User can still click 4th profile before count updates

**After Flow**:
1. User has 2 views
2. User clicks 3rd profile
3. Check if already viewed today? NO
4. Check: canViewMore? YES
5. Load profile
6. Track view (now 3)
7. Next click checks: canViewMore? NO → Block

**Fix**: Check if the specific provider was already viewed today BEFORE checking the limit.

---

### 3. **Infinite Loop in useEffect**
**Problem**: The `useEffect` in ProviderDetail had `subscriptionStatus` as a dependency, causing infinite re-renders.

**Before**:
```typescript
useEffect(() => {
  await trackProfileView(id) // This refreshes subscriptionStatus
}, [id, user, subscriptionStatus]) // ← subscriptionStatus changes, triggers effect again!
```

**After**:
```typescript
useEffect(() => {
  await trackProfileView(id)
}, [id, user]) // ← Only re-run when ID or user changes
```

---

### 4. **Missing Error Handling**
**Problem**: Silent failures in view tracking made debugging difficult.

**Fix**: Added comprehensive logging:
```typescript
console.log('✅ Tracked new view for provider');
console.log('ℹ️ Provider already viewed today');
console.log('📊 Subscription Status Update:', { viewsCount, canViewMore });
```

---

## How View Counting Works Now

### Database Structure
```sql
profile_views_tracking
├── id (UUID)
├── client_id (UUID) → references auth.users
├── provider_id (UUID) → references provider_profiles
├── view_date (DATE) → YYYY-MM-DD format
└── viewed_at (TIMESTAMPTZ)
```

### View Tracking Flow

1. **User clicks on a provider profile**
2. **Check if already viewed today**
3. **If NOT viewed today AND not subscribed → Check limit**
4. **If access allowed → Load profile and track view**
5. **Count unique providers viewed**

---

## Testing the Fix

### Test Scenario 1: Basic View Counting
1. Create a client account (no subscription)
2. Browse to `/browse`
3. You should see the debug card showing "0 / 3" views
4. Click on Provider A → Counter shows "1 / 3"
5. Click on Provider B → Counter shows "2 / 3"
6. Click on Provider C → Counter shows "3 / 3"
7. Click on Provider D → Access Restriction Modal appears
8. ✅ **Expected**: User can view exactly 3 unique providers

### Test Scenario 2: Same Provider Multiple Times
1. View Provider A (count: 1)
2. Go back to browse page
3. View Provider A again
4. ✅ **Expected**: Count stays at 1 (not counted twice)

### Test Scenario 3: Subscription Bypass
1. View 3 providers (limit reached)
2. Subscribe for K100/month
3. Try viewing Provider D
4. ✅ **Expected**: Access granted, photos unblurred

### Test Scenario 4: Daily Reset
1. View 3 providers today
2. Wait until tomorrow (or manually change date in DB)
3. Try viewing a new provider
4. ✅ **Expected**: Counter resets to 0, access granted

---

## Debug Tools

### ViewCountDebug Component
A debug card is now displayed on the browse page for clients:

```
┌─────────────────────────────┐
│ 👁️ View Count Debug         │
├─────────────────────────────┤
│ Subscription Status: Free   │
│ Views Today: 2 / 3          │
│ Views Remaining: 1          │
│ Can View More: ✅ Yes       │
└─────────────────────────────┘
```

**Location**: Top of `/browse` page (only visible to clients)

**To Remove**: Delete or comment out in `BrowseList.tsx`:
```typescript
{user && userRole === "client" && (
  <ViewCountDebug />
)}
```

### Console Logs
Open browser DevTools Console to see:
- `✅ Tracked new view for provider [id]`
- `ℹ️ Provider [id] already viewed today`
- `📊 Subscription Status Update: { viewsCount, canViewMore, ... }`

---

## Files Modified

1. **`src/hooks/useSubscription.ts`**
   - Fixed view counting to use unique providers
   - Added comprehensive logging
   - Improved error handling

2. **`src/pages/browse/ProviderDetail.tsx`**
   - Fixed race condition in access control
   - Removed infinite loop dependency
   - Check if provider already viewed before limiting

3. **`src/pages/browse/BrowseList.tsx`**
   - Added ViewCountDebug component
   - Fixed TypeScript type error with blurred prop

4. **`src/components/ViewCountDebug.tsx`** (NEW)
   - Debug component for testing view counts

5. **`lib/types.ts`**
   - Added `contact_number` field to ProviderProfile

---

## Common Issues & Solutions

### Issue: Counter not updating
**Solution**: Check browser console for errors. Ensure RLS policies allow inserts to `profile_views_tracking`.

### Issue: Can view more than 3 profiles
**Solution**: 
1. Check if views are being tracked (console logs)
2. Verify `view_date` is correct format (YYYY-MM-DD)
3. Clear any test data: `DELETE FROM profile_views_tracking WHERE client_id = 'your-user-id'`

### Issue: Modal appears on first view
**Solution**: Check subscription status. Ensure `canViewMore` is calculated correctly.

### Issue: Views not resetting daily
**Solution**: The `view_date` field uses DATE type. Ensure your queries use:
```typescript
new Date().toISOString().split('T')[0] // Returns "2025-01-10"
```

---

## Database Queries for Testing

### Check current views for a user
```sql
SELECT 
  pv.view_date,
  pv.provider_id,
  pp.name as provider_name,
  pv.viewed_at
FROM profile_views_tracking pv
JOIN provider_profiles pp ON pp.id = pv.provider_id
WHERE pv.client_id = 'your-user-id'
ORDER BY pv.viewed_at DESC;
```

### Count unique providers viewed today
```sql
SELECT COUNT(DISTINCT provider_id) as unique_views
FROM profile_views_tracking
WHERE client_id = 'your-user-id'
  AND view_date = CURRENT_DATE;
```

### Reset views for testing
```sql
DELETE FROM profile_views_tracking
WHERE client_id = 'your-user-id'
  AND view_date = CURRENT_DATE;
```

### Check subscription status
```sql
SELECT 
  active,
  plan,
  start_date,
  end_date,
  end_date > NOW() as is_valid
FROM subscriptions
WHERE user_id = 'your-user-id';
```

---

## Summary

The view counting system now:
- ✅ Counts unique providers (not total views)
- ✅ Prevents race conditions
- ✅ Avoids infinite loops
- ✅ Provides detailed logging
- ✅ Includes debug tools
- ✅ Properly enforces 3-view limit
- ✅ Allows re-viewing same provider without penalty
- ✅ Resets daily automatically

**Next Steps**:
1. Test the system with the debug component
2. Monitor console logs during testing
3. Remove debug component before production
4. Consider adding analytics to track conversion rates
