import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  UserPlus,
  Mail,
  Crown,
  Shield,
  User,
  Trash2,
  Copy,
  ChevronDown,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useStaff } from '@/hooks/useStaff';
import { useRestaurant } from '@/contexts/RestaurantContext';
import AuthGuard from '@/components/AuthGuard';

export default function StaffManagementScreen() {
  const router = useRouter();
  const { restaurant } = useRestaurant();
  const {
    staff,
    invitations,
    loading,
    isOwner,
    inviteStaff,
    cancelInvitation,
    updateStaffRole,
    removeStaff,
  } = useStaff(restaurant?.id || null);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'staff'>('staff');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setInviting(true);
    const { error, invitation } = await inviteStaff(inviteEmail, inviteRole);
    setInviting(false);

    if (error) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } else {
      Alert.alert(
        'Invitation Sent',
        `An invitation has been created for ${inviteEmail}. Share the invite link with them.`,
        [
          { text: 'Copy Link', onPress: () => copyInviteLink(invitation?.token) },
          { text: 'OK' },
        ]
      );
      setInviteEmail('');
      setShowInviteForm(false);
    }
  };

  const copyInviteLink = async (token?: string) => {
    if (!token) return;
    const link = `unbottl://invite/${token}`;
    try {
      await Share.share({
        message: `You've been invited to join ${restaurant?.name} on Unbottl! Open this link to accept: ${link}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleRemoveStaff = (staffId: string, name: string) => {
    Alert.alert(
      'Remove Staff',
      `Are you sure you want to remove ${name} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await removeStaff(staffId);
            if (error) Alert.alert('Error', error.message);
          },
        },
      ]
    );
  };

  const handleCancelInvite = (inviteId: string, email: string) => {
    Alert.alert(
      'Cancel Invitation',
      `Cancel invitation for ${email}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const { error } = await cancelInvitation(inviteId);
            if (error) Alert.alert('Error', error.message);
          },
        },
      ]
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'manager': return Shield;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return '#F59E0B';
      case 'manager': return '#3B82F6';
      default: return Colors.textMuted;
    }
  };

  return (
    <AuthGuard requiredUserType="restaurant_owner">
      {loading ? (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Team Management</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Staff */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Team Members ({staff.length})</Text>

              {staff.map((member) => {
                const RoleIcon = getRoleIcon(member.role);
                const roleColor = getRoleColor(member.role);
                const displayName = member.display_name || 'Unknown';
                const email = member.email || '';

                return (
                  <View key={member.id} style={styles.staffCard}>
                    <View style={[styles.roleIcon, { backgroundColor: roleColor + '20' }]}>
                      <RoleIcon size={20} color={roleColor} />
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{displayName}</Text>
                      <Text style={styles.staffEmail}>{email}</Text>
                      <Text style={[styles.staffRole, { color: roleColor }]}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Text>
                    </View>
                    {isOwner && member.role !== 'owner' && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveStaff(member.id, displayName)}
                      >
                        <Trash2 size={18} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Invitations ({invitations.length})</Text>

                {invitations.map((invite) => (
                  <View key={invite.id} style={styles.inviteCard}>
                    <View style={[styles.roleIcon, { backgroundColor: Colors.secondary + '20' }]}>
                      <Mail size={20} color={Colors.secondary} />
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{invite.email}</Text>
                      <Text style={styles.staffRole}>
                        Invited as {invite.role}
                      </Text>
                    </View>
                    <View style={styles.inviteActions}>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => copyInviteLink(invite.token)}
                      >
                        <Copy size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleCancelInvite(invite.id, invite.email)}
                      >
                        <Trash2 size={18} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Invite Form */}
            {isOwner && (
              <View style={styles.section}>
                {!showInviteForm ? (
                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={() => setShowInviteForm(true)}
                  >
                    <UserPlus size={20} color={Colors.white} />
                    <Text style={styles.inviteButtonText}>Invite Team Member</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inviteForm}>
                    <Text style={styles.formTitle}>Invite New Member</Text>

                    <View style={styles.inputContainer}>
                      <Mail size={20} color={Colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        value={inviteEmail}
                        onChangeText={setInviteEmail}
                        placeholder="Email address"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.roleSelector}>
                      <TouchableOpacity
                        style={[
                          styles.roleOption,
                          inviteRole === 'manager' && styles.roleOptionActive,
                        ]}
                        onPress={() => setInviteRole('manager')}
                      >
                        <Shield size={18} color={inviteRole === 'manager' ? Colors.primary : Colors.textMuted} />
                        <Text style={[
                          styles.roleOptionText,
                          inviteRole === 'manager' && styles.roleOptionTextActive,
                        ]}>Manager</Text>
                        <Text style={styles.roleDesc}>Can edit inventory</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleOption,
                          inviteRole === 'staff' && styles.roleOptionActive,
                        ]}
                        onPress={() => setInviteRole('staff')}
                      >
                        <User size={18} color={inviteRole === 'staff' ? Colors.primary : Colors.textMuted} />
                        <Text style={[
                          styles.roleOptionText,
                          inviteRole === 'staff' && styles.roleOptionTextActive,
                        ]}>Staff</Text>
                        <Text style={styles.roleDesc}>View only</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowInviteForm(false);
                          setInviteEmail('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sendButton, inviting && styles.sendButtonDisabled]}
                        onPress={handleInvite}
                        disabled={inviting}
                      >
                        {inviting ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <Text style={styles.sendButtonText}>Send Invite</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      )}
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  staffEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  staffRole: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  copyButton: {
    padding: 8,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  inviteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  inviteForm: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
    marginLeft: 12,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  roleOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 8,
  },
  roleOptionTextActive: {
    color: Colors.primary,
  },
  roleDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sendButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomPadding: {
    height: 40,
  },
});
