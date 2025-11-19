# Admin Panel Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Panel (/admin)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              AdminLayout.tsx                        │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │         Sidebar Navigation                    │  │    │
│  │  │  • Dashboard                                  │  │    │
│  │  │  • Users                                      │  │    │
│  │  │  • Providers                                  │  │    │
│  │  │  • Subscriptions                              │  │    │
│  │  │  • Payments                                   │  │    │
│  │  │  • Withdrawals                                │  │    │
│  │  │  • Referrals                                  │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │         Main Content Area (Outlet)            │  │    │
│  │  │                                               │  │    │
│  │  │  [Dynamic content based on route]            │  │    │
│  │  │                                               │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.tsx
└── Route: /admin
    └── AdminLayout.tsx
        ├── Sidebar
        │   ├── Logo
        │   ├── Navigation Links
        │   └── User Profile + Logout
        │
        └── Outlet (Main Content)
            ├── /admin → Dashboard.tsx
            ├── /admin/users → UsersManagement.tsx
            ├── /admin/providers → ProvidersManagement.tsx
            ├── /admin/subscriptions → SubscriptionsManagement.tsx
            ├── /admin/payments → PaymentsManagement.tsx
            ├── /admin/withdrawals → WithdrawalsManagement.tsx
            └── /admin/referrals → ReferralRewardsAdmin.tsx
```

## Data Flow

```
┌──────────────┐
│   Admin UI   │
└──────┬───────┘
       │
       │ 1. User Action
       ↓
┌──────────────────┐
│  React Component │
└──────┬───────────┘
       │
       │ 2. Supabase Query
       ↓
┌──────────────────┐
│  Supabase Client │
└──────┬───────────┘
       │
       │ 3. Database Query
       ↓
┌──────────────────┐
│  PostgreSQL DB   │
│  + RLS Policies  │
└──────┬───────────┘
       │
       │ 4. Check Admin Role
       ↓
┌──────────────────┐
│  is_admin()      │
│  Function        │
└──────┬───────────┘
       │
       │ 5. Return Data
       ↓
┌──────────────────┐
│  React Component │
│  (Update State)  │
└──────┬───────────┘
       │
       │ 6. Render UI
       ↓
┌──────────────────┐
│   Admin UI       │
└──────────────────┘
```

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Tables                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Authentication & Users                                      │
│  ├── auth.users                                             │
│  ├── provider_profiles                                      │
│  └── client_profiles                                        │
│                                                              │
│  Financial System                                            │
│  ├── subscriptions                                          │
│  ├── payments                                               │
│  ├── contact_unlocks                                        │
│  └── withdrawal_requests                                    │
│                                                              │
│  Referral System                                             │
│  ├── referral_codes                                         │
│  ├── referrals                                              │
│  ├── referral_rewards                                       │
│  ├── referral_stats                                         │
│  └── provider_referral_access                               │
│                                                              │
│  Analytics & Services                                        │
│  ├── profile_views                                          │
│  ├── profile_views_tracking                                 │
│  └── provider_services                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Access Control Flow

```
┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│  Check user_metadata.role   │
└────────┬────────────────────┘
         │
         ├─── role === 'admin' ──→ ┌──────────────────┐
         │                          │  Grant Access    │
         │                          │  to Admin Panel  │
         │                          └──────────────────┘
         │
         └─── role !== 'admin' ──→ ┌──────────────────┐
                                    │  Show Access     │
                                    │  Denied Message  │
                                    └──────────────────┘
```

## Page Structure Pattern

Each admin page follows this structure:

```typescript
┌─────────────────────────────────────────┐
│          Admin Page Component            │
├─────────────────────────────────────────┤
│                                          │
│  1. State Management                     │
│     • Data state                         │
│     • Loading state                      │
│     • Filter/Search state                │
│     • Dialog state                       │
│                                          │
│  2. Data Fetching (useEffect)            │
│     • Fetch from Supabase                │
│     • Process data                       │
│     • Update state                       │
│                                          │
│  3. Event Handlers                       │
│     • Search/Filter                      │
│     • CRUD operations                    │
│     • Dialog open/close                  │
│                                          │
│  4. UI Rendering                         │
│     ├── Header (Title + Description)     │
│     ├── Stats Cards (optional)           │
│     ├── Filters/Search Bar               │
│     ├── Data Table                       │
│     └── Dialogs/Modals                   │
│                                          │
└─────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────┐
│         Security Architecture            │
├─────────────────────────────────────────┤
│                                          │
│  Layer 1: Frontend Route Protection      │
│  • AdminLayout checks user role          │
│  • Redirects non-admins                  │
│                                          │
│  Layer 2: Component-Level Checks         │
│  • Each component verifies admin access  │
│  • Shows appropriate error messages      │
│                                          │
│  Layer 3: Supabase RLS Policies          │
│  • Database-level access control         │
│  • is_admin() function verification      │
│  • Row-level security on all tables      │
│                                          │
│  Layer 4: API-Level Security             │
│  • Supabase Auth checks                  │
│  • JWT token validation                  │
│  • Session management                    │
│                                          │
└─────────────────────────────────────────┘
```

## Feature Matrix

| Feature | Dashboard | Users | Providers | Subscriptions | Payments | Withdrawals | Referrals |
|---------|-----------|-------|-----------|---------------|----------|-------------|-----------|
| View List | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Search | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Filter | - | - | - | ✓ | ✓ | ✓ | ✓ |
| View Details | - | ✓ | ✓ | - | - | - | ✓ |
| Statistics | ✓ | - | ✓ | ✓ | ✓ | ✓ | ✓ |
| Actions | - | - | - | - | - | ✓ | ✓ |
| Export | - | - | - | - | - | - | - |

## State Management Pattern

```typescript
// Typical state structure in admin components
interface ComponentState {
  // Data
  items: Item[]
  filteredItems: Item[]
  
  // UI State
  loading: boolean
  error: string | null
  
  // Filter State
  searchTerm: string
  filterStatus: 'all' | 'active' | 'inactive'
  
  // Dialog State
  showDialog: boolean
  selectedItem: Item | null
  
  // Form State (if applicable)
  formData: FormData
  processing: boolean
}
```

## API Integration Pattern

```typescript
// Standard data fetching pattern
const fetchData = async () => {
  try {
    setLoading(true)
    
    // 1. Fetch main data
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // 2. Enrich data (if needed)
    const enrichedData = await Promise.all(
      data.map(async (item) => {
        // Fetch related data
        return { ...item, ...additionalData }
      })
    )
    
    // 3. Update state
    setItems(enrichedData)
    
  } catch (error) {
    console.error('Error:', error)
    toast({ title: 'Error', description: error.message })
  } finally {
    setLoading(false)
  }
}
```

## Responsive Design Breakpoints

```
Mobile:    < 640px   (sm)
Tablet:    640-1024px (md-lg)
Desktop:   > 1024px   (lg+)

Sidebar:
  Mobile:  Hidden (hamburger menu)
  Desktop: Always visible

Tables:
  Mobile:  Horizontal scroll
  Desktop: Full width

Cards:
  Mobile:  1 column
  Tablet:  2 columns
  Desktop: 4 columns
```

## Performance Considerations

```
┌─────────────────────────────────────────┐
│      Performance Optimizations           │
├─────────────────────────────────────────┤
│                                          │
│  Current:                                │
│  • useEffect for data fetching           │
│  • Local state management                │
│  • Client-side filtering                 │
│  • Promise.all for parallel requests     │
│                                          │
│  Future Enhancements:                    │
│  • Pagination (limit queries)            │
│  • Virtual scrolling (large lists)       │
│  • React Query (caching)                 │
│  • Debounced search                      │
│  • Lazy loading                          │
│  • Memoization (useMemo, useCallback)    │
│                                          │
└─────────────────────────────────────────┘
```

## Error Handling Strategy

```
┌─────────────────────────────────────────┐
│         Error Handling Flow              │
├─────────────────────────────────────────┤
│                                          │
│  1. Try-Catch Blocks                     │
│     • Wrap async operations              │
│     • Log errors to console              │
│                                          │
│  2. Error State                          │
│     • Store error messages               │
│     • Display to user                    │
│                                          │
│  3. Toast Notifications                  │
│     • User-friendly messages             │
│     • Success/Error variants             │
│                                          │
│  4. Fallback UI                          │
│     • Loading states                     │
│     • Empty states                       │
│     • Error states                       │
│                                          │
└─────────────────────────────────────────┘
```

## Deployment Checklist

```
Pre-Deployment:
□ Run all migrations
□ Create admin user
□ Test all features
□ Verify RLS policies
□ Check environment variables
□ Test on mobile devices
□ Review security settings

Post-Deployment:
□ Verify admin access
□ Test in production
□ Monitor error logs
□ Check performance
□ Set up monitoring
□ Document admin procedures
```

This architecture provides a scalable, secure, and maintainable admin panel that can grow with your platform's needs.
