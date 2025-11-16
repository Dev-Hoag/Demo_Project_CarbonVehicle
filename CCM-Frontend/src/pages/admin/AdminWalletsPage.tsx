import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Assessment as StatsIcon,
  AccountBalanceWallet as WalletIcon,
  AddCircle as AddIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import adminService from '../../services/admin';
import type { WalletFilters } from '../../services/admin';
import UserWalletDetailDialog from '../../components/admin/UserWalletDetailDialog';

interface WalletTransaction {
  id: string;
  walletId?: string;
  userId: string | number;
  type: string;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  status?: string;
  description?: string;
  referenceId?: string;
  metadata?: any;
  createdAt: string;
}

interface WalletTransactionListResponse {
  data: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

export const AdminWalletsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [userIdFilter, setUserIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [statistics, setStatistics] = useState({
    total: 0,
    deposits: 0,
    withdrawals: 0,
    payments: 0,
  });

  // Adjust Balance Dialog
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Wallet Detail Dialog
  const [walletDetailDialog, setWalletDetailDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const filters: WalletFilters = {
        page: page + 1,
        limit,
        userId: userIdFilter || undefined,
        status: statusFilter || undefined,
        type: transactionTypeFilter || undefined,
        startDate: fromDate || undefined,
        endDate: toDate || undefined,
      };

      const response: WalletTransactionListResponse = await adminService.wallets.getAllTransactions(filters);
      setTransactions(response.data);
      setTotal(response.total);

      // Calculate statistics
      calculateStatistics(response.data);
    } catch (error: any) {
      console.error('Failed to load transactions:', error);
      toast.error(error.response?.data?.message || 'Failed to load wallet transactions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (txs: WalletTransaction[]) => {
    setStatistics({
      total: txs.length,
      deposits: txs.filter(t => t.type === 'DEPOSIT').length,
      withdrawals: txs.filter(t => t.type === 'WITHDRAWAL').length,
      payments: txs.filter(t => t.type === 'PAYMENT').length,
    });
  };

  useEffect(() => {
    loadTransactions();
  }, [page, limit]);

  const handleApplyFilters = () => {
    setPage(0);
    loadTransactions();
  };

  const handleClearFilters = () => {
    setUserIdFilter('');
    setStatusFilter('');
    setTransactionTypeFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
    loadTransactions();
  };

  // Handle adjust balance
  const handleOpenAdjustDialog = () => {
    setAdjustUserId('');
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustDialog(true);
  };

  const handleAdjustBalance = async () => {
    if (!adjustUserId || !adjustAmount || !adjustReason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    setProcessing(true);
    try {
      await adminService.wallets.adjustBalance(adjustUserId, amount, adjustReason);
      toast.success('Balance adjusted successfully');
      setAdjustDialog(false);
      loadTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to adjust balance');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      PENDING: 'warning',
      CONFIRMED: 'success',
      FAILED: 'error',
      REVERSED: 'error',
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'warning' | 'info'> = {
      DEPOSIT: 'primary',
      WITHDRAWAL: 'secondary',
      PAYMENT: 'warning',
      REFUND: 'info',
    };
    return colors[type] || 'default';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Wallet Management</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdjustDialog}>
            Adjust Balance
          </Button>
          <IconButton onClick={loadTransactions} color="primary" title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* Statistics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.total}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WalletIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.deposits}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Deposits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WalletIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.withdrawals}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Withdrawals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WalletIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.payments}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="REVERSED">Reversed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="DEPOSIT">Deposit</MenuItem>
                <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
                <MenuItem value="PAYMENT">Payment</MenuItem>
                <MenuItem value="REFUND">Refund</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button variant="contained" onClick={handleApplyFilters} fullWidth>
              Apply Filters
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button variant="outlined" onClick={handleClearFilters} fullWidth>
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            No wallet transactions found
          </Alert>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.id}</TableCell>
                    <TableCell>{tx.userId}</TableCell>
                    <TableCell>
                      <Chip label={tx.type} color={getTypeColor(tx.type) as any} size="small" />
                    </TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <Chip label={tx.status || 'N/A'} color={getStatusColor(tx.status || '')} size="small" />
                    </TableCell>
                    <TableCell>{tx.description || '-'}</TableCell>
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    <TableCell align="right">
                      {/* Note: View button disabled - transaction userId is string username, not numeric ID */}
                      {/* Backend wallet endpoint requires numeric userId which we don't have in transaction list */}
                      {/* Use AdminUsersPage to view wallet details instead */}
                      -
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={limit}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </TableContainer>

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialog} onClose={() => setAdjustDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust User Balance</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will add the specified amount to the user's wallet balance.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="User ID"
            type="text"
            fullWidth
            value={adjustUserId}
            onChange={(e) => setAdjustUserId(e.target.value)}
            placeholder="Enter user ID..."
            required
          />
          <TextField
            margin="dense"
            label="Amount (VND)"
            type="number"
            fullWidth
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            placeholder="Enter amount to add..."
            required
            inputProps={{ min: 0, step: 1000 }}
          />
          <TextField
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Provide a reason for this adjustment..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAdjustBalance}
            color="primary"
            variant="contained"
            disabled={!adjustUserId || !adjustAmount || !adjustReason.trim() || processing}
          >
            {processing ? <CircularProgress size={20} /> : 'Adjust Balance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wallet Detail Dialog */}
      <UserWalletDetailDialog
        open={walletDetailDialog}
        onClose={() => {
          setWalletDetailDialog(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId || ''}
      />
    </Box>
  );
};

export default AdminWalletsPage;
