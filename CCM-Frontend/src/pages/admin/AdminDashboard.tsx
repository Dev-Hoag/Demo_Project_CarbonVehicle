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
  // Overview
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  evOwners: number;
  buyers: number;
  verifiers: number;
  
  // Credits
  totalCreditsIssued: number;
  totalCreditsTraded: number;
  totalCo2Reduced: number;
  
  // Financial
  totalRevenue: number;
  totalFeeCollected: number;
  totalTransactions: number;
  
  // Pending items (from other APIs)
  pendingKYC: number;
  pendingWithdrawals: number;
  
  timestamp: string;
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
    activeUsers: 0,
    suspendedUsers: 0,
    evOwners: 0,
    buyers: 0,
    verifiers: 0,
    totalCreditsIssued: 0,
    totalCreditsTraded: 0,
    totalCo2Reduced: 0,
    totalRevenue: 0,
    totalFeeCollected: 0,
    totalTransactions: 0,
    pendingKYC: 0,
    pendingWithdrawals: 0,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard summary
      const dashboardData = await adminService.reports.getDashboardSummary();
      
      // Try to fetch pending counts (don't fail if endpoints don't exist)
      let pendingKYC = 0;
      let pendingWithdrawals = 0;
      
      try {
        const kycData = await adminService.kyc.getAllDocuments({ page: 1, limit: 1, status: 'PENDING' });
        pendingKYC = kycData.total || 0;
      } catch (e) {
        console.log('KYC endpoint not available or error:', e);
      }
      
      try {
        const withdrawalData = await adminService.withdrawals.getPendingWithdrawals();
        pendingWithdrawals = Array.isArray(withdrawalData) ? withdrawalData.length : withdrawalData.total || 0;
      } catch (e) {
        console.log('Withdrawal endpoint not available or error:', e);
      }

      setStats({
        // Overview from dashboard API
        totalUsers: dashboardData.overview?.totalUsers || 0,
        activeUsers: dashboardData.overview?.activeUsers || 0,
        suspendedUsers: dashboardData.overview?.suspendedUsers || 0,
        evOwners: dashboardData.overview?.evOwners || 0,
        buyers: dashboardData.overview?.buyers || 0,
        verifiers: dashboardData.overview?.verifiers || 0,
        
        // Credits
        totalCreditsIssued: dashboardData.credits?.totalIssued || 0,
        totalCreditsTraded: dashboardData.credits?.totalTraded || 0,
        totalCo2Reduced: dashboardData.credits?.totalCo2Reduced || 0,
        
        // Financial
        totalRevenue: dashboardData.financial?.totalRevenue || 0,
        totalFeeCollected: dashboardData.financial?.totalFeeCollected || 0,
        totalTransactions: dashboardData.financial?.totalTransactions || 0,
        
        // Pending items
        pendingKYC,
        pendingWithdrawals,
        
        timestamp: dashboardData.timestamp || new Date().toISOString(),
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

        {/* Active Users */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers.toLocaleString()}
            icon={<VerifiedIcon fontSize="large" />}
            color="success"
            subtitle="Currently active"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>

        {/* Suspended Users */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Suspended Users"
            value={stats.suspendedUsers.toLocaleString()}
            icon={<MoneyIcon fontSize="large" />}
            color="warning"
            subtitle="Suspended accounts"
            onClick={() => navigate('/admin/users')}
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

        {/* Total Revenue */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Revenue"
            value={`${(stats.totalRevenue / 1000000).toFixed(1)}M VND`}
            icon={<TrendingIcon fontSize="large" />}
            color="secondary"
            subtitle="Platform revenue"
            onClick={() => navigate('/admin/reports')}
          />
        </Grid>

        {/* Total Fee Collected */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Fee Collected"
            value={`${(stats.totalFeeCollected / 1000000).toFixed(1)}M VND`}
            icon={<WalletIcon fontSize="large" />}
            color="success"
            subtitle="Transaction fees"
            onClick={() => navigate('/admin/reports')}
          />
        </Grid>

        {/* Pending KYC */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Pending KYC"
            value={stats.pendingKYC}
            icon={<VerifiedIcon fontSize="large" />}
            color="error"
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

        {/* Credits Statistics - if available */}
        {stats.totalCreditsIssued > 0 && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              title="Credits Issued"
              value={stats.totalCreditsIssued.toLocaleString()}
              icon={<TrendingIcon fontSize="large" />}
              color="primary"
              subtitle="Total carbon credits"
            />
          </Grid>
        )}
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

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/management')}>
              <CardContent>
                <Typography variant="body2" fontWeight={600}>
                  Admin Management
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage admin users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/audit-logs')}>
              <CardContent>
                <Typography variant="body2" fontWeight={600}>
                  Audit Logs
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  System activity logs
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/override-requests')}>
              <CardContent>
                <Typography variant="body2" fontWeight={600}>
                  Override Requests
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Review special requests
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
