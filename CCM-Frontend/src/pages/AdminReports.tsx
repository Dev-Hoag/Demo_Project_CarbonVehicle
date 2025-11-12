import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid as Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Assessment,
  People,
  ArrowBack,
  Logout,
} from '@mui/icons-material';
import { adminReportsApi, type FinancialReport, type TransactionReport, type WalletReport } from '../api/admin-reports';
import toast from 'react-hot-toast';

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // Financial Report
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  
  // Transaction Report
  const [transactionReport, setTransactionReport] = useState<TransactionReport[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  
  // Wallet Report
  const [walletReport, setWalletReport] = useState<WalletReport | null>(null);

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  useEffect(() => {
    fetchFinancialReport();
  }, []);

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      const data = await adminReportsApi.getFinancialReport();
      setFinancialReport(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load financial report');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionReport = async () => {
    try {
      setLoading(true);
      const data = await adminReportsApi.getTransactionReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        groupBy,
      });
      setTransactionReport(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load transaction report');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletReport = async () => {
    try {
      setLoading(true);
      const data = await adminReportsApi.getWalletReport({ limit: 50 });
      setWalletReport(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load wallet report');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 1 && transactionReport.length === 0) {
      fetchTransactionReport();
    } else if (newValue === 2 && !walletReport) {
      fetchWalletReport();
    }
  };

  if (loading && !financialReport) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <AccountBalance sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard - Financial Reports
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {adminUser.email}
          </Typography>
          <Button
            color="inherit"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin/withdrawals')}
            sx={{ mr: 1 }}
          >
            Withdrawals
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/admin/wallets')}
            sx={{ mr: 1 }}
          >
            All Wallets
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/admin/transactions')}
            sx={{ mr: 1 }}
          >
            All Transactions
          </Button>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Financial Reports & Analytics
        </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Financial Overview" />
        <Tab label="Transaction Report" />
        <Tab label="Wallet Report" />
      </Tabs>

      {/* Financial Overview Tab */}
      {activeTab === 0 && financialReport && (
        <Box>
          <Grid container spacing={3}>
            {/* Total Balance Card */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AccountBalanceWallet sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Total Balance</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={600}>
                    {(financialReport.totalBalance || 0).toLocaleString('vi-VN')} VND
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                    Locked: {(financialReport.totalLockedBalance || 0).toLocaleString('vi-VN')} VND
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Deposited Card */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TrendingUp sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Total Deposited</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={600}>
                    {(financialReport.depositAmount || 0).toLocaleString('vi-VN')} VND
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                    Active Wallets: {financialReport.activeWallets || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Withdrawn Card */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TrendingDown sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Total Withdrawn</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={600}>
                    {financialReport.withdrawalAmount.toLocaleString('vi-VN')} VND
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                    Completed: {financialReport.completedWithdrawals} transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Pending Withdrawals Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AccountBalance sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="subtitle2">Pending Withdrawals</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600} color="warning.main">
                    {financialReport.pendingWithdrawalAmount.toLocaleString('vi-VN')} VND
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {financialReport.pendingWithdrawals} requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Wallets Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <People sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2">Active Wallets</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={600} color="primary.main">
                    {financialReport.activeWallets}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Summary Info */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Health
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Total Transactions: {financialReport.totalTransactions.toLocaleString('vi-VN')}
                    </Typography>
                    <Typography variant="body2">
                      Net Flow: {(financialReport.depositAmount - financialReport.withdrawalAmount).toLocaleString('vi-VN')} VND
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Transaction Report Tab */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filter Transactions
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  select
                  label="Group By"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                  SelectProps={{ native: true }}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </TextField>
                <Button variant="contained" onClick={fetchTransactionReport}>
                  Apply Filter
                </Button>
              </Box>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Deposits</TableCell>
                  <TableCell align="right">Withdrawals</TableCell>
                  <TableCell align="right">Reserves</TableCell>
                  <TableCell align="right">Releases</TableCell>
                  <TableCell align="right">Total Transactions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : transactionReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No data available. Click "Apply Filter" to load data.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionReport && transactionReport.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell align="right">
                        <Typography color="success.main">
                          {row.depositAmount.toLocaleString('vi-VN')} VND ({row.deposits})
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="error.main">
                          {row.withdrawalAmount.toLocaleString('vi-VN')} VND ({row.withdrawals})
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {row.reserveAmount.toLocaleString('vi-VN')} VND ({row.reserves})
                      </TableCell>
                      <TableCell align="right">
                        {row.releaseAmount.toLocaleString('vi-VN')} VND ({row.releases})
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600}>
                          {row.totalTransactions}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Wallet Report Tab */}
      {activeTab === 2 && walletReport && (
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Total Wallets</Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {walletReport.totalWallets}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Active: {walletReport.activeWallets}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Total Balance</Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {walletReport.totalBalance.toLocaleString('vi-VN')} VND
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Locked Balance</Typography>
                  <Typography variant="h5" fontWeight={600} color="warning.main">
                    {walletReport.totalLockedBalance.toLocaleString('vi-VN')} VND
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Average Balance</Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {walletReport.averageBalance.toLocaleString('vi-VN')} VND
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Wallets Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Wallets</Typography>
            </CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User ID</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell align="right">Locked Balance</TableCell>
                    <TableCell align="right">Transaction Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : !walletReport.topWallets || walletReport.topWallets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No wallets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    walletReport.topWallets.map((wallet) => (
                      <TableRow key={wallet.userId}>
                        <TableCell>{wallet.userId}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>
                            {wallet.balance.toLocaleString('vi-VN')} VND
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="warning.main">
                            {wallet.lockedBalance.toLocaleString('vi-VN')} VND
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{wallet.transactionCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}
      </Box>
    </Box>
  );
};
