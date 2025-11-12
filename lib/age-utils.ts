/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get age from provider profile (computed from DOB or fallback to age field)
 * @param profile - Provider profile object
 * @returns Age in years
 */
export function getProviderAge(profile: { date_of_birth?: string | null; age?: number | null }): number | null {
  if (profile.date_of_birth) {
    return calculateAge(profile.date_of_birth);
  }
  return profile.age || null;
}

/**
 * Validate that date of birth represents someone at least 18 years old
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns true if person is at least 18 years old
 */
export function isAtLeast18(dateOfBirth: string): boolean {
  const age = calculateAge(dateOfBirth);
  return age !== null && age >= 18;
}
