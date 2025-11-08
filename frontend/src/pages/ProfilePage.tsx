import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../shared/contexts/AuthContext';
import MainLayout from '../shared/components/MainLayout';
import { userServiceApi } from '../shared/api/user-service.api';
import type { UserProfile } from '../shared/types/user.types';
import { USER_STATUS_LABELS, KYC_STATUS_LABELS } from '../shared/utils/constants';
import { getStatusColor } from '../shared/utils/formatters';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userServiceApi.getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || '',
        phone: data.phone || '',
      });
    } catch (err: any) {
      setError('Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fullName.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }

    try {
      setSaving(true);
      await userServiceApi.updateProfile(formData);
      setSuccess('Cập nhật thông tin thành công!');
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Hồ sơ cá nhân">
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Hồ sơ cá nhân">
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Thông tin cá nhân
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Read-only info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Email
            </Typography>
            <Typography variant="body1" gutterBottom>
              {user?.email}
            </Typography>

            <Box sx={{ mt: 2, mb: 2 }}>
              <Chip
                label={`Loại tài khoản: ${user?.userType}`}
                color="primary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Chip
                label={USER_STATUS_LABELS[user?.status || 'PENDING']}
                color={getStatusColor(user?.status || 'PENDING')}
                sx={{ mr: 1 }}
              />
              <Chip
                label={KYC_STATUS_LABELS[user?.kycStatus || 'NOT_SUBMITTED']}
                color={getStatusColor(user?.kycStatus || 'NOT_SUBMITTED')}
              />
            </Box>

            <Typography variant="caption" color="text.secondary">
              Email đã xác thực: {user?.isVerified ? '✅ Có' : '❌ Chưa'}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Editable form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>
              Chỉnh sửa thông tin
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              label="Họ và tên"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={saving}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Số điện thoại"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={saving}
              placeholder="Vd: 0901234567"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ mt: 3 }}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </Box>
        </Paper>

        {/* Additional info */}
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Thông tin hệ thống
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              User ID: <strong>{profile?.userId}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Ngày tạo: {profile?.createdAt ? new Date(profile.createdAt).toLocaleString('vi-VN') : 'N/A'}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default ProfilePage;
