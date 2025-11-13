import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError(''); // Clear error when user types
  };

  const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = () => {
    if (!formData.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!formData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }
    if (formData.newPassword === formData.currentPassword) {
      setError('New password must be different from current password');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.changePassword(formData.currentPassword, formData.newPassword);
      toast.success('Password changed successfully! Please login again.');
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Close dialog and logout user for security
      onClose();
      
      // Optional: Force logout
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to change password';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Current Password"
          type={showPasswords.current ? 'text' : 'password'}
          value={formData.currentPassword}
          onChange={handleChange('currentPassword')}
          margin="normal"
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => toggleShowPassword('current')}
                  edge="end"
                >
                  {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="New Password"
          type={showPasswords.new ? 'text' : 'password'}
          value={formData.newPassword}
          onChange={handleChange('newPassword')}
          margin="normal"
          disabled={loading}
          helperText="Must be at least 8 characters"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => toggleShowPassword('new')}
                  edge="end"
                >
                  {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Confirm New Password"
          type={showPasswords.confirm ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          margin="normal"
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => toggleShowPassword('confirm')}
                  edge="end"
                >
                  {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
