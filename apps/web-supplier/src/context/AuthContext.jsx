import { createContext, useState, useEffect, useCallback } from 'react';
import { getSupplierProfile } from '../services/profileService';

export const AuthContext = createContext({
  profileData: null,
  isLoading: true,
  error: null,
  refreshProfile: () => {},
});

// Fetches the logged-in supplier's own profile once at the app root,
// instead of every page/modal that needs it firing its own duplicate
// GET /api/supplier/me request.
export function AuthProvider({ children }) {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSupplierProfile();
      setProfileData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ profileData, isLoading, error, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
