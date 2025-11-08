import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import type { SelectChangeEvent } from '@mui/material';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { userServiceApi } from '../../shared/api/user-service.api';
import { UserType } from '../../shared/types/user.types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    userType: UserType.BUYER,
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<UserType>) => {
    setFormData(prev => ({
      ...prev,
      userType: e.target.value as UserType,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      await userServiceApi.register({
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
      });

      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Đăng ký thất bại. Email có thể đã được sử dụng.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Đăng ký tài khoản
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Carbon Credit Marketplace
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

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading || !!success}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="fullName"
              label="Họ và tên"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading || !!success}
            />

            <TextField
              margin="normal"
              fullWidth
              id="phone"
              label="Số điện thoại"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading || !!success}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="userType-label">Loại tài khoản</InputLabel>
              <Select
                labelId="userType-label"
                id="userType"
                name="userType"
                value={formData.userType}
                label="Loại tài khoản"
                onChange={handleSelectChange}
                disabled={loading || !!success}
              >
                <MenuItem value={UserType.BUYER}>Người mua (Buyer)</MenuItem>
                <MenuItem value={UserType.EV_OWNER}>Chủ xe điện (EV Owner)</MenuItem>
                <MenuItem value={UserType.CVA}>Cơ quan xác thực (CVA)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading || !!success}
              helperText="Tối thiểu 6 ký tự"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading || !!success}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !!success}
            >
              {loading ? <CircularProgress size={24} /> : 'Đăng ký'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Đã có tài khoản?{' '}
                <Link component={RouterLink} to="/login">
                  Đăng nhập ngay
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
