import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  VerifiedUser as VerifiedIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as TrendingIcon,
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as TransactionIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/admin';

interface DashboardStats {
  totalUsers: number;
  pendingKYC: number;
  pendingWithdrawals: number;
  totalTransactions: number;
  totalWalletBalance: number;
  monthlyRevenue: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}> = ({ title, value, icon, color, subtitle, onClick }) => (
  <Card 
    sx={{ 
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="text.secondary" variant="caption" display="block" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            p: 1.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingKYC: 0,
    pendingWithdrawals: 0,
    totalTransactions: 0,
    totalWalletBalance: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call real Admin API
      const data = await adminService.reports.getDashboardSummary();
      
      // API returns nested structure: { overview: {...}, credits: {...}, financial: {...} }
      setStats({
        totalUsers: data.overview?.totalUsers || 0,
        pendingKYC: 0, // TODO: Get from KYC service
        pendingWithdrawals: 0, // TODO: Get from withdrawal service
        totalTransactions: data.financial?.totalTransactions || 0,
        totalWalletBalance: 0, // TODO: Get from wallet service
        monthlyRevenue: data.financial?.totalRevenue || 0,
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome to admin dashboard. Monitor and manage your platform.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Total Users */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<PeopleIcon fontSize="large" />}
            color="primary"
            subtitle="Registered accounts"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>

        {/* Pending KYC */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Pending KYC"
            value={stats.pendingKYC}
            icon={<VerifiedIcon fontSize="large" />}
            color="warning"
            subtitle="Awaiting verification"
            onClick={() => navigate('/admin/kyc')}
          />
        </Grid>

        {/* Pending Withdrawals */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Pending Withdrawals"
            value={stats.pendingWithdrawals}
            icon={<MoneyIcon fontSize="large" />}
            color="error"
            subtitle="Awaiting approval"
            onClick={() => navigate('/admin/withdrawals')}
          />
        </Grid>

        {/* Total Transactions */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions.toLocaleString()}
            icon={<TransactionIcon fontSize="large" />}
            color="info"
            subtitle="All time"
            onClick={() => navigate('/admin/transactions')}
          />
        </Grid>

        {/* Total Wallet Balance */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Wallet Balance"
            value={`${(stats.totalWalletBalance / 1000000).toFixed(1)}M VND`}
            icon={<WalletIcon fontSize="large" />}
            color="success"
            subtitle="Platform-wide"
            onClick={() => navigate('/admin/wallets')}
          />
        </Grid>

        {/* Monthly Revenue */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Monthly Revenue"
            value={`${(stats.monthlyRevenue / 1000000).toFixed(1)}M VND`}
            icon={<TrendingIcon fontSize="large" />}
            color="secondary"
            subtitle="This month"
            onClick={() => navigate('/admin/reports')}
          />
        </Grid>
      </Grid>

      {/* Quick Actions or Recent Activity can be added here */}
      <Box mt={4}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/kyc')}>
              <CardContent>
                <Typography variant="body2" fontWeight={600}>
                  Review KYC Documents
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.pendingKYC} pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/withdrawals')}>
              <CardContent>
                <Typography variant="body2" fontWeight={600}>
                  Approve Withdrawals
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.pendingWithdrawals} pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/users')}>
              <CardContent>
                <Typography variant="body2" fontWeight={600}>
                  Manage Users
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  View all users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/reports')}>
              <CardContent>
                <Typography variant="body2" fontWeight={600}>
                  View Reports
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Analytics & insights
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
