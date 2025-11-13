import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { userApi, type UpdateProfileData } from '../api/user';
import toast from 'react-hot-toast';
import { ChangePasswordDialog } from '../components/ChangePasswordDialog';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth || '',
    },
  });

  // Fetch fresh profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const freshProfile = await userApi.getProfile();
        setUser(freshProfile);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
      });
    }
  }, [user, reset]);

  const handleUpdateProfile = async (data: UpdateProfileData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await userApi.updateProfile(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth || '',
    });
    setEditMode(false);
    setError(null);
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: 48,
                    bgcolor: 'primary.main',
                    mb: 2,
                  }}
                >
                  {user.fullName?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {user.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    mt: 1,
                  }}
                >
                  {user.userType}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Status:</strong> {user.status}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Email Verified:</strong> {user.isEmailVerified ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Member Since:</strong>{' '}
                  {user.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Personal Information
                </Typography>
                {!editMode && (
                  <Button startIcon={<Edit />} onClick={() => setEditMode(true)}>
                    Edit Profile
                  </Button>
                )}
              </Box>

              <form onSubmit={handleSubmit(handleUpdateProfile)}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('fullName', { required: 'Full name is required' })}
                      fullWidth
                      label="Full Name"
                      disabled={!editMode}
                      error={!!errors.fullName}
                      helperText={errors.fullName?.message}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={user.email}
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('phoneNumber', { required: 'Phone number is required' })}
                      fullWidth
                      label="Phone Number"
                      disabled={!editMode}
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber?.message}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('dateOfBirth')}
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      disabled={!editMode}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      {...register('address')}
                      fullWidth
                      label="Address"
                      disabled={!editMode}
                      multiline
                      rows={2}
                    />
                  </Grid>

                  {editMode && (
                    <Grid size={{ xs: 12 }}>
                      <Box display="flex" gap={2} justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<Save />}
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </form>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Account Security
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Last password change:</strong>{' '}
                {user.passwordChangedAt
                  ? new Date(user.passwordChangedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Never'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </Box>
  );
};

export default ProfilePage;
