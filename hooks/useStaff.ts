import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface StaffMember {
  id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  is_active: boolean;
  accepted_at: string | null;
  created_at: string;
  display_name?: string;
  email?: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  role: 'manager' | 'staff';
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function useStaff(restaurantId: string | null) {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'owner' | 'manager' | 'staff' | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!restaurantId || restaurantId.length < 10) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch staff members
      const { data: staffData, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Fetch user profiles for each staff member
      let staffWithProfiles: StaffMember[] = [];
      if (staffData && staffData.length > 0) {
        const userIds = staffData.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, email')
          .in('id', userIds);

        staffWithProfiles = staffData.map(s => {
          const profile = profiles?.find(p => p.id === s.user_id);
          return {
            ...s,
            display_name: profile?.display_name || 'Unknown',
            email: profile?.email || '',
          };
        });
      }

      // Fetch pending invitations
      const { data: inviteData, error: inviteError } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (inviteError) throw inviteError;

      setStaff(staffWithProfiles);
      setInvitations(inviteData || []);

      // Find current user's role
      const currentUserStaff = staffData?.find(s => s.user_id === user?.id);
      setUserRole(currentUserStaff?.role || null);

    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, user?.id]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const inviteStaff = async (email: string, role: 'manager' | 'staff') => {
    if (!restaurantId || !user) {
      return { error: new Error('Not authenticated or no restaurant') };
    }

    try {
      const { data, error } = await supabase
        .from('staff_invitations')
        .insert({
          restaurant_id: restaurantId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setInvitations(prev => [...prev, data]);
      return { error: null, invitation: data };
    } catch (err: any) {
      return { error: err };
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('staff_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      setInvitations(prev => prev.filter(i => i.id !== invitationId));
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateStaffRole = async (staffId: string, newRole: 'manager' | 'staff') => {
    try {
      const { error } = await supabase
        .from('restaurant_staff')
        .update({ role: newRole })
        .eq('id', staffId);

      if (error) throw error;

      setStaff(prev => prev.map(s => 
        s.id === staffId ? { ...s, role: newRole } : s
      ));
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const removeStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_staff')
        .update({ is_active: false })
        .eq('id', staffId);

      if (error) throw error;

      setStaff(prev => prev.filter(s => s.id !== staffId));
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const isOwner = userRole === 'owner';
  const isManager = userRole === 'manager' || userRole === 'owner';

  return {
    staff,
    invitations,
    loading,
    userRole,
    isOwner,
    isManager,
    inviteStaff,
    cancelInvitation,
    updateStaffRole,
    removeStaff,
    refetch: fetchStaff,
  };
}

// Hook to accept an invitation
export function useAcceptInvitation() {
  const [loading, setLoading] = useState(false);

  const acceptInvitation = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_staff_invitation', {
        invitation_token: token,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return { error: null, restaurantId: data.restaurant_id };
    } catch (err: any) {
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return { acceptInvitation, loading };
}
