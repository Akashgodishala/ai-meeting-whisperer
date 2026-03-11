import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isRetailer, setIsRetailer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserRole();
    } else {
      setRole(null);
      setIsRetailer(false);
      setLoading(false);
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (error) throw error;

      const userRoles = data?.map(d => d.role) || [];
      
      if (userRoles.includes('retailer')) {
        setRole('retailer');
        setIsRetailer(true);
      } else if (userRoles.includes('admin')) {
        setRole('admin');
        setIsRetailer(false);
      } else {
        setRole('customer');
        setIsRetailer(false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setRole('customer');
      setIsRetailer(false);
    } finally {
      setLoading(false);
    }
  };

  return { role, isRetailer, loading, checkUserRole };
}