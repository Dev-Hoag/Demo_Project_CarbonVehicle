import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Alert,
  Stack,
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import adminService from '../../services/admin';

// Use local interface to avoid type import issues
interface UserProfile {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  externalUserId?: string;
  userType: string;
  status: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface UserDetailDialogProps {
  open: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
  open,
  user,
  onClose,
  onUserUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    userType: '',
    status: '',
    kycStatus: '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        userType: user.userType,
        status: user.status,
        kycStatus: user.kycStatus,
      });
      setIsEditing(false);
      setError(null);
      setSuccess(false);
    }
  }, [user]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Only send fields allowed by backend DTO
      const updatePayload = {
        fullName: formData.fullName,
        phone: formData.phone,
        kycStatus: formData.kycStatus,
        // Note: userType and status require separate endpoints (lock/suspend/etc)
      };
      
      await adminService.users.updateUser(user.id, updatePayload);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => {
        onUserUpdated();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        userType: user.userType,
        status: user.status,
        kycStatus: user.kycStatus,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'warning';
      case 'DELETED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getKycColor = (kycStatus: string) => {
    switch (kycStatus) {
      case 'VERIFIED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">User Details</Typography>
          <Box>
            {!isEditing && (
              <IconButton onClick={() => setIsEditing(true)} color="primary" size="small">
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {!user && (
          <Alert severity="info">No user selected</Alert>
        )}
        
        {user && error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {user && success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            User updated successfully!
          </Alert>
        )}

        {user && (

        <Stack spacing={2}>
          {/* Read-only fields */}
          <Typography variant="subtitle2" color="text.secondary">
            Basic Information
          </Typography>
          <Divider />

          <Box display="flex" gap={2}>
            <TextField
              label="User ID"
              value={user.id}
              fullWidth
              disabled
              size="small"
            />
            <TextField
              label="External User ID"
              value={user.externalUserId || 'N/A'}
              fullWidth
              disabled
              size="small"
            />
          </Box>

          <TextField
            label="Email"
            value={user.email}
            fullWidth
            disabled
            size="small"
          />

          {/* Editable fields */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Editable Information
          </Typography>
          <Divider />

          <Box display="flex" gap={2}>
            <TextField
              label="Full Name"
              value={formData.fullName}
              onChange={handleChange('fullName')}
              fullWidth
              disabled={!isEditing}
              size="small"
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              fullWidth
              disabled={!isEditing}
              size="small"
            />
          </Box>

          <Box display="flex" gap={2}>
            <TextField
              select
              label="User Type"
              value={formData.userType}
              onChange={handleChange('userType')}
              fullWidth
              disabled={true}
              size="small"
              helperText="Cannot be changed via this dialog"
            >
              <MenuItem value="EV_OWNER">EV Owner</MenuItem>
              <MenuItem value="BUYER">Buyer</MenuItem>
              <MenuItem value="CVA">CVA</MenuItem>
            </TextField>

            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={handleChange('status')}
              fullWidth
              disabled={true}
              size="small"
              helperText="Use Lock/Suspend actions instead"
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
              <MenuItem value="DELETED">Deleted</MenuItem>
            </TextField>

            <TextField
              select
              label="KYC Status"
              value={formData.kycStatus}
              onChange={handleChange('kycStatus')}
              fullWidth
              disabled={!isEditing}
              size="small"
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="VERIFIED">Verified</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </TextField>
          </Box>

          {/* Status chips for non-edit mode */}
          {!isEditing && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={user.status}
                color={getStatusColor(user.status) as any}
                size="small"
              />
              <Chip
                label={`KYC: ${user.kycStatus}`}
                color={getKycColor(user.kycStatus) as any}
                size="small"
              />
              <Chip label={user.userType} color="primary" size="small" variant="outlined" />
            </Box>
          )}

          {/* Timestamps */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Timestamps
          </Typography>
          <Divider />

          <Box display="flex" gap={2}>
            <TextField
              label="Created At"
              value={new Date(user.createdAt).toLocaleString()}
              fullWidth
              disabled
              size="small"
            />
            <TextField
              label="Updated At"
              value={new Date(user.updatedAt).toLocaleString()}
              fullWidth
              disabled
              size="small"
            />
          </Box>
        </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {isEditing ? (
          <>
            <Button onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailDialog;
