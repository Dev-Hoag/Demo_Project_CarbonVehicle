import React, { useEffect, useState, useCallback } from 'react';
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
  Chip,
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
  VerifiedUser,
  Refresh,
  Schedule,
  FileDownload,
} from '@mui/icons-material';
import { adminReportsApi, type FinancialReport, type TransactionReport, type WalletReport } from '../api/admin-reports';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh] = useState(true);
  
  // Financial Report
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  
  // Transaction Report
  const [transactionReport, setTransactionReport] = useState<TransactionReport[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  
  // Wallet Report
  const [walletReport, setWalletReport] = useState<WalletReport | null>(null);

  // Analytics data
  const [trendData, setTrendData] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    healthScore: 0,
    avgTransactionValue: 0,
    walletGrowthRate: 0,
    activeUserRate: 0,
  });

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  // Calculate system metrics
  const calculateSystemMetrics = useCallback((financial: FinancialReport, transactions: TransactionReport[]) => {
    // Health Score (0-100): Based on net flow, active wallets, transaction volume
    const netFlow = (financial.depositAmount || 0) - (financial.withdrawalAmount || 0);
    const netFlowScore = netFlow > 0 ? 30 : Math.max(0, 30 + (netFlow / 1000000)); // Max 30 points
    const activeWalletScore = Math.min(30, (financial.activeWallets / financial.totalWallets) * 30); // Max 30 points
    const transactionScore = Math.min(40, (financial.totalTransactions / 1000) * 40); // Max 40 points
    const healthScore = Math.round(netFlowScore + activeWalletScore + transactionScore);

    // Average Transaction Value
    const avgTransactionValue = financial.totalTransactions > 0 
      ? (financial.depositAmount + financial.withdrawalAmount) / financial.totalTransactions
      : 0;

    // Wallet Growth Rate (last 7 days vs previous)
    const recentData = transactions.slice(0, 7);
    const previousData = transactions.slice(7, 14);
    const recentTotal = recentData.reduce((sum, t) => sum + t.totalTransactions, 0);
    const previousTotal = previousData.reduce((sum, t) => sum + t.totalTransactions, 0);
    const walletGrowthRate = previousTotal > 0 
      ? ((recentTotal - previousTotal) / previousTotal) * 100
      : 0;

    // Active User Rate
    const activeUserRate = financial.totalWallets > 0
      ? (financial.activeWallets / financial.totalWallets) * 100
      : 0;

    setSystemMetrics({
      healthScore,
      avgTransactionValue,
      walletGrowthRate,
      activeUserRate,
    });
  }, []);

  // Fetch all data for current tab
  const fetchAllData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      if (activeTab === 0) {
        // Fetch both financial and transaction data for analytics
        const [financialData, transactionData] = await Promise.all([
          adminReportsApi.getFinancialReport(),
          adminReportsApi.getTransactionReport({ groupBy: 'day', limit: 30 }),
        ]);
        setFinancialReport(financialData);
        setTrendData(transactionData.reverse()); // Reverse for chronological order
        calculateSystemMetrics(financialData, transactionData);
      } else if (activeTab === 1) {
        const data = await adminReportsApi.getTransactionReport({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          groupBy,
        });
        setTransactionReport(data);
        setTrendData(data.reverse());
      } else if (activeTab === 2) {
        const data = await adminReportsApi.getWalletReport({ limit: 50 });
        setWalletReport(data);
      }
      
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error(error.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, startDate, endDate, groupBy, calculateSystemMetrics]);

  // Initial load
  useEffect(() => {
    fetchAllData(true);
  }, [activeTab]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData(false);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllData]);

  const handleManualRefresh = () => {
    fetchAllData(false);
  };

  const fetchTransactionReport = async () => {
    fetchAllData(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (activeTab === 0 && financialReport) {
      const csvContent = `Financial Report - ${new Date().toLocaleDateString()}\n\n` +
        `Metric,Value\n` +
        `Total Balance,${financialReport.totalBalance}\n` +
        `Locked Balance,${financialReport.totalLockedBalance}\n` +
        `Available Balance,${financialReport.totalAvailableBalance}\n` +
        `Total Wallets,${financialReport.totalWallets}\n` +
        `Active Wallets,${financialReport.activeWallets}\n` +
        `Total Transactions,${financialReport.totalTransactions}\n` +
        `Total Deposits,${financialReport.totalDeposits}\n` +
        `Total Withdrawals,${financialReport.totalWithdrawals}\n` +
        `Deposit Amount,${financialReport.depositAmount}\n` +
        `Withdrawal Amount,${financialReport.withdrawalAmount}\n` +
        `Net Flow,${financialReport.depositAmount - financialReport.withdrawalAmount}\n` +
        `Health Score,${systemMetrics.healthScore}\n`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Report exported successfully');
    } else if (activeTab === 1 && transactionReport.length > 0) {
      const csvContent = `Transaction Report - ${new Date().toLocaleDateString()}\n\n` +
        `Date,Total Transactions,Deposits,Withdrawals,Reserves,Releases,Deposit Amount,Withdrawal Amount\n` +
        transactionReport.map(t => 
          `${t.date},${t.totalTransactions},${t.deposits},${t.withdrawals},${t.reserves},${t.releases},${t.depositAmount},${t.withdrawalAmount}`
        ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Report exported successfully');
    } else if (activeTab === 2 && walletReport) {
      const csvContent = `Wallet Report - ${new Date().toLocaleDateString()}\n\n` +
        `User ID,Balance,Locked Balance,Transaction Count\n` +
        walletReport.topWallets.map(w => 
          `${w.userId},${w.balance},${w.lockedBalance},${w.transactionCount}`
        ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Report exported successfully');
    }
  };

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
  };

  // Format time ago
  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (loading && !financialReport && !transactionReport.length && !walletReport) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
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
          
          {/* Auto-refresh indicator */}
          <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
            <IconButton 
              color="inherit" 
              onClick={handleManualRefresh}
              disabled={refreshing}
              size="small"
            >
              <Refresh className={refreshing ? 'rotating' : ''} />
            </IconButton>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1 }}>
              <Typography variant="caption">
                Updated {getTimeAgo()}
              </Typography>
              {autoRefresh && (
                <Chip 
                  icon={<Schedule />} 
                  label="Auto-refresh: 30s" 
                  size="small" 
                  color="success"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </Box>

          <Typography variant="body2" sx={{ mr: 2 }}>
            {adminUser.email}
          </Typography>
          <Button
            color="inherit"
            startIcon={<VerifiedUser />}
            onClick={() => navigate('/admin/kyc')}
            sx={{ mr: 1 }}
          >
            KYC
          </Button>
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

      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Financial Overview" />
          <Tab label="Transaction Report" />
          <Tab label="Wallet Report" />
        </Tabs>
        <Button 
          variant="contained" 
          startIcon={<FileDownload />}
          onClick={exportToCSV}
          disabled={loading}
        >
          Export CSV
        </Button>
      </Box>

      {/* Financial Overview Tab */}
      {activeTab === 0 && financialReport && (
        <Box>
          {/* System Health Score */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">System Health Score</Typography>
                  <Typography variant="h2" fontWeight={700} sx={{ mt: 1 }}>
                    {systemMetrics.healthScore}/100
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {systemMetrics.healthScore >= 80 ? '🟢 Excellent' : 
                     systemMetrics.healthScore >= 60 ? '🟡 Good' : 
                     systemMetrics.healthScore >= 40 ? '🟠 Fair' : '🔴 Needs Attention'}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" sx={{ mb: 1 }}>Key Metrics:</Typography>
                  <Chip label={`Active Users: ${systemMetrics.activeUserRate.toFixed(1)}%`} sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.2)' }} size="small" />
                  <br />
                  <Chip label={`Growth: ${systemMetrics.walletGrowthRate > 0 ? '+' : ''}${systemMetrics.walletGrowthRate.toFixed(1)}%`} 
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>

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
                    {(financialReport.withdrawalAmount || 0).toLocaleString('vi-VN')} VND
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                    Completed: {financialReport.completedWithdrawals || 0} transactions
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
                    {(financialReport.pendingWithdrawalAmount || 0).toLocaleString('vi-VN')} VND
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {financialReport.pendingWithdrawals || 0} requests
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

            {/* Transaction Distribution Pie Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transaction Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Deposits', value: financialReport.totalDeposits || 0, color: '#4caf50' },
                          { name: 'Withdrawals', value: financialReport.totalWithdrawals || 0, color: '#f44336' },
                          { name: 'Reserves', value: financialReport.totalReserves || 0, color: '#ff9800' },
                          { name: 'Releases', value: financialReport.totalReleases || 0, color: '#2196f3' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Deposits', value: financialReport.totalDeposits || 0, color: '#4caf50' },
                          { name: 'Withdrawals', value: financialReport.totalWithdrawals || 0, color: '#f44336' },
                          { name: 'Reserves', value: financialReport.totalReserves || 0, color: '#ff9800' },
                          { name: 'Releases', value: financialReport.totalReleases || 0, color: '#2196f3' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Money Flow Bar Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Money Flow (VND)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Deposits',
                          amount: financialReport.depositAmount || 0,
                        },
                        {
                          name: 'Withdrawals',
                          amount: financialReport.withdrawalAmount || 0,
                        },
                        {
                          name: 'Reserves',
                          amount: financialReport.reserveAmount || 0,
                        },
                        {
                          name: 'Releases',
                          amount: financialReport.releaseAmount || 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => `${value.toLocaleString('vi-VN')} VND`}
                      />
                      <Legend />
                      <Bar dataKey="amount" fill="#1976d2" name="Amount (VND)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Advanced Analytics Section */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ mr: 1 }} />
                    Advanced System Analytics
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total Transactions</Typography>
                        <Typography variant="h6">{(financialReport.totalTransactions || 0).toLocaleString('vi-VN')}</Typography>
                        <Typography variant="caption" color="primary.main">
                          Avg Value: {systemMetrics.avgTransactionValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VND
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total Wallets</Typography>
                        <Typography variant="h6">{financialReport.totalWallets || 0}</Typography>
                        <Typography variant="caption" color="success.main">
                          {systemMetrics.activeUserRate.toFixed(1)}% Active
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Net Flow (7 days)</Typography>
                        <Typography variant="h6" color={(financialReport.depositAmount || 0) - (financialReport.withdrawalAmount || 0) >= 0 ? 'success.main' : 'error.main'}>
                          {((financialReport.depositAmount || 0) - (financialReport.withdrawalAmount || 0)).toLocaleString('vi-VN')} VND
                        </Typography>
                        <Typography variant="caption" color={systemMetrics.walletGrowthRate >= 0 ? 'success.main' : 'error.main'}>
                          {systemMetrics.walletGrowthRate > 0 ? '+' : ''}{systemMetrics.walletGrowthRate.toFixed(1)}% Growth
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Available Balance</Typography>
                        <Typography variant="h6">{(financialReport.totalAvailableBalance || 0).toLocaleString('vi-VN')} VND</Typography>
                        <Typography variant="caption" color="warning.main">
                          Locked: {((financialReport.totalLockedBalance || 0) / (financialReport.totalBalance || 1) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Transaction Trend Charts */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Transaction Trends (Last 30 Days)</Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f44336" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f44336" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => `${value.toLocaleString('vi-VN')} VND`}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="depositAmount" 
                        stroke="#4caf50" 
                        fillOpacity={1} 
                        fill="url(#colorDeposit)" 
                        name="Deposits"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="withdrawalAmount" 
                        stroke="#f44336" 
                        fillOpacity={1} 
                        fill="url(#colorWithdrawal)" 
                        name="Withdrawals"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Transaction Count Trend */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Transaction Volume Trend</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="deposits" stroke="#4caf50" name="Deposits" strokeWidth={2} />
                      <Line type="monotone" dataKey="withdrawals" stroke="#f44336" name="Withdrawals" strokeWidth={2} />
                      <Line type="monotone" dataKey="reserves" stroke="#ff9800" name="Reserves" strokeWidth={2} />
                      <Line type="monotone" dataKey="releases" stroke="#2196f3" name="Releases" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
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

// Add CSS for rotating animation
const style = document.createElement('style');
style.textContent = `
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .rotating {
    animation: rotate 1s linear infinite;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

export default AdminReportsPage;
