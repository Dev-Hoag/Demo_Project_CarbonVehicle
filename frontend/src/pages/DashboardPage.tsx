import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useAuth } from '../shared/contexts/AuthContext';
import MainLayout from '../shared/components/MainLayout';
import { KYC_STATUS_LABELS, USER_STATUS_LABELS } from '../shared/utils/constants';
import { getStatusColor } from '../shared/utils/formatters';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Hồ sơ cá nhân',
      description: 'Xem và cập nhật thông tin cá nhân',
      icon: <AccountCircleIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/profile'),
      color: '#1976d2',
    },
    {
      title: 'KYC / Xác thực',
      description: 'Nộp và theo dõi hồ sơ xác thực danh tính',
      icon: <VerifiedIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/kyc'),
      color: '#2e7d32',
    },
    {
      title: 'Thanh toán',
      description: 'Tạo thanh toán và xem lịch sử giao dịch',
      icon: <PaymentIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/payment'),
      color: '#ed6c02',
    },
    {
      title: 'Tài liệu',
      description: 'Hướng dẫn sử dụng và chính sách',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/docs'),
      color: '#9c27b0',
    },
  ];

  return (
    <MainLayout title="Dashboard">
      <Container maxWidth="lg">
        {/* User Info */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Xin chào, {user?.email}!
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip
              label={`Trạng thái: ${USER_STATUS_LABELS[user?.status || 'PENDING']}`}
              color={getStatusColor(user?.status || 'PENDING')}
              sx={{ mr: 1 }}
            />
            <Chip
              label={`KYC: ${KYC_STATUS_LABELS[user?.kycStatus || 'NOT_SUBMITTED']}`}
              color={getStatusColor(user?.kycStatus || 'NOT_SUBMITTED')}
              sx={{ mr: 1 }}
            />
            <Chip
              label={user?.isVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}
              color={user?.isVerified ? 'success' : 'warning'}
            />
          </Box>
        </Paper>

        {/* KYC Warning */}
        {user?.kycStatus === 'NOT_SUBMITTED' && (
          <Paper elevation={2} sx={{ p: 2, mb: 4, bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              ⚠️ Bạn chưa hoàn thành xác thực KYC
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Vui lòng hoàn thành xác thực danh tính để sử dụng đầy đủ tính năng
            </Typography>
            <Button 
              variant="contained" 
              size="small" 
              onClick={() => navigate('/kyc')}
              sx={{ mt: 1 }}
            >
              Xác thực ngay
            </Button>
          </Paper>
        )}

        {/* Menu Cards */}
        <Box sx={{ mt: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            flexWrap="wrap"
            useFlexGap
          >
            {menuItems.map((item, index) => (
              <Card 
                key={index}
                sx={{ 
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ color: item.color, mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={item.action}
                  >
                    Xem chi tiết
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Quick Stats */}
        <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Thống kê nhanh
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mt: 1 }}
            divider={<Box sx={{ display: { xs: 'none', sm: 'block' }, width: 1, borderRight: 1, borderColor: 'divider' }} />}
          >
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">0</Typography>
              <Typography variant="body2" color="text.secondary">Giao dịch</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">0 ₫</Typography>
              <Typography variant="body2" color="text.secondary">Tổng thanh toán</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">0</Typography>
              <Typography variant="body2" color="text.secondary">Tài liệu KYC</Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default DashboardPage;
