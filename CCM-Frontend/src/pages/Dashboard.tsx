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
  AccountBalanceWallet,
  Payment,
  TrendingUp,
  Receipt,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { walletApi } from '../api/wallet';
import { paymentApi } from '../api/payment';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    balance: 0 as number,
    totalPayments: 0,
    totalTransactions: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch wallet balance
        const walletData = await walletApi.getBalance();
        
        // Fetch payment history
        const paymentData = await paymentApi.getPaymentHistory({ limit: 100 });

        // Ensure balance is a number (API might return string)
        const balance = typeof walletData.balance === 'number' 
          ? walletData.balance 
          : parseFloat(String(walletData.balance)) || 0;

        setStats({
          balance,
          totalPayments: paymentData.total || 0,
          totalTransactions: 0, // Will be implemented with real API
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards: StatCard[] = [
    {
      title: 'Wallet Balance',
      value: `$${stats.balance.toFixed(2)}`,
      icon: <AccountBalanceWallet sx={{ fontSize: 40 }} />,
      color: '#2E7D32',
    },
    {
      title: 'Total Payments',
      value: stats.totalPayments,
      icon: <Payment sx={{ fontSize: 40 }} />,
      color: '#1976D2',
    },
    {
      title: 'Transactions',
      value: stats.totalTransactions,
      icon: <Receipt sx={{ fontSize: 40 }} />,
      color: '#F57C00',
    },
    {
      title: 'Credits Earned',
      value: 0,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Welcome back, {user?.fullName}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <Typography color="text.secondary">
                No recent activity to display
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Typography color="text.secondary">
                Quick actions will be available here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
