# Location Hierarchy Implementation

## Overview
Changed both **provider** and **client** location systems from free-text input to a structured hierarchical selection system with **Country → City → Area**.

## Changes Made

### 1. Database Migrations

**Provider Profiles:** `supabase/migrations/20250112_provider_location_hierarchy.sql`
- Added three new columns to `provider_profiles` table:
  - `country` (TEXT) - Country code (e.g., "ZM", "ZA")
  - `city` (TEXT) - City name (e.g., "Lusaka", "Johannesburg")
  - `area` (TEXT) - Area/neighborhood (user-entered with suggestions)
- Created indexes for efficient querying
- Kept legacy `location` field for backward compatibility

**Client Profiles:** `supabase/migrations/20250112_client_location_hierarchy.sql`
- Added same three columns to `client_profiles` table
- Created matching indexes
- Maintained backward compatibility with legacy `location` field

### 2. Location Data Constants
**File:** `lib/location-data.ts`
- **Primary Focus: Zambia** with comprehensive coverage:
  - **10 cities**: Lusaka (50 areas), Kitwe (17 areas), Ndola (14 areas), Livingstone (9 areas), Kabwe, Chingola, Mufulira, Luanshya, Solwezi, Kasama
  - Covers major urban centers, Copperbelt towns, and provincial capitals
- **Other African countries** (simplified coverage):
  - South Africa, Kenya, Tanzania, Uganda, Zimbabwe, Malawi, Botswana
  - 1-3 cities per country with 2-4 area suggestions each
- Each city includes predefined area suggestions
- **Area input allows custom entries** - users can type their own if not listed
- Helper functions:
  - `getCountryByCode()` - Get country details
  - `getCitiesByCountry()` - Get cities for a country
  - `getAreasByCity()` - Get area suggestions for a city
  - `formatLocation()` - Format location as "Area, City, Country"

### 3. Type Definitions
**File:** `lib/types.ts`
- Updated `ProviderProfile` interface to include:
  - `country?: string | null`
  - `city?: string | null`
  - `area?: string | null`
- Updated `ClientProfile` interface with same fields
- Kept `location` field in both for backward compatibility

### 4. Profile Forms

**Provider Profile Form:** `components/provider-profile-form.tsx`
- Replaced single location input with cascading selects:
  1. **Country Select** - Dropdown with flag emojis
  2. **City Select** - Appears after country selection
  3. **Area Input** - Free text with datalist suggestions
- Cascading behavior:
  - Selecting a country resets city and area
  - Selecting a city resets area
- Area field uses HTML5 datalist for autocomplete suggestions
- Saves both new hierarchical fields and legacy `location` field

**Client Profile Form:** `components/client-profile-form.tsx`
- Identical implementation to provider form
- Same cascading country → city → area selection
- Custom area entry supported

### 5. Display Components Updated

**Provider Pages:**
- `src/pages/provider/Profile.tsx` - Provider's own profile view
- `src/pages/provider/Dashboard.tsx` - Provider dashboard
- `src/pages/browse/ProviderDetail.tsx` - Public provider detail page
- `components/provider-card.tsx` - Provider card in browse listing

**Client Pages:**
- `src/pages/client/Profile.tsx` - Client's own profile view

**Display Logic (all pages):**
- If `country` and `city` exist: Display formatted hierarchical location
- Otherwise: Fall back to legacy `location` field
- Format: "Area, City, Country" (e.g., "Woodlands, Lusaka, Zambia")

## User Experience

### For Providers & Clients (Creating/Editing Profile)
1. Select country from dropdown (with flag emojis)
2. Select city from filtered list based on country
3. Enter area/neighborhood with autocomplete suggestions
   - Can type custom area if not in suggestions
   - Suggestions appear as user types
   - **Custom areas are fully supported** - not restricted to predefined list

### For All Users (Viewing Profiles)
- See formatted location: "Area, City, Country"
- More structured and consistent location display
- Easier to filter and search (future enhancement)

## Migration Strategy

### Backward Compatibility
- Legacy `location` field is maintained and auto-populated
- Existing profiles will continue to work
- New profiles use hierarchical system
- Display logic handles both old and new formats

### Data Migration
- Existing location values are copied to `country` field
- Providers can update their profiles to use new system
- No data loss during transition

## Future Enhancements

### Potential Additions
1. **Location-based Filtering**
   - Filter providers by country
   - Filter by city within country
   - Filter by area within city

2. **Location Search**
   - Search providers by location
   - Distance-based search (if coordinates added)

3. **More Countries**
   - Expand location data to more African countries
   - Add other regions as needed

4. **Area Management**
   - Admin panel to manage areas
   - User-submitted areas for approval
   - Popular areas highlighted

## Testing Checklist

### Database
- [ ] Run provider migration: `20250112_provider_location_hierarchy.sql`
- [ ] Run client migration: `20250112_client_location_hierarchy.sql`

### Provider Profiles
- [ ] Create new provider profile with hierarchical location
- [ ] Edit existing provider profile
- [ ] Verify location display on provider profile page
- [ ] Verify location display on provider dashboard
- [ ] Verify location display on browse page
- [ ] Verify location display on provider detail page

### Client Profiles
- [ ] Create new client profile with hierarchical location
- [ ] Edit existing client profile
- [ ] Verify location display on client profile page

### Functionality
- [ ] Test cascading behavior (country → city → area)
- [ ] Test area autocomplete suggestions
- [ ] Test custom area entry (type area not in list)
- [ ] Verify backward compatibility with existing profiles
- [ ] Test with Zambian locations (comprehensive data)
- [ ] Test with other country locations (simplified data)

## Notes

- Area field is optional but recommended for better location specificity
- **Both providers and clients** can enter custom areas not in the predefined list
- **Zambia has comprehensive coverage** with 10 cities and 100+ areas
- Other countries have simplified data (easily expandable)
- The system is designed to be easily extensible with more countries/cities
- All location data is stored in a single TypeScript file (`lib/location-data.ts`) for easy maintenance
- Same UX and implementation for both provider and client profiles
