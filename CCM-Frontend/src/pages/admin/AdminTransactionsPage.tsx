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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assessment as StatsIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import adminService from '../../services/admin';
import type { TransactionFilters } from '../../services/admin';

interface Transaction {
  id: number;
  userId: number;
  listingId?: number;
  amount: number;
  status: string;
  transactionType?: string;
  description?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

interface TransactionListResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [listingIdFilter, setListingIdFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });

  // Action dialogs (command dialogs disabled - read-only mode)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [actionHistory, setActionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const filters: TransactionFilters = {
        page: page + 1,
        limit,
      };

      // Map filters to match backend expectations
      // Backend uses: status, transactionType, sellerId, buyerId, fromDate, toDate
      if (statusFilter) filters.status = statusFilter;
      if (userIdFilter) filters.buyerId = userIdFilter; // Map userId to buyerId
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;

      console.log('Transaction filters:', filters); // Debug log

      const response: TransactionListResponse = await adminService.transactions.getAllTransactions(filters);
      setTransactions(response.data || []);
      setTotal(response.total || 0);

      // Calculate statistics
      calculateStatistics(response.data || []);
    } catch (error: any) {
      console.error('Failed to load transactions:', error);
      toast.error(error.response?.data?.message || 'Failed to load transactions');
      
      // Fallback: set empty data
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (txs: Transaction[]) => {
    setStatistics({
      total: txs.length,
      pending: txs.filter(t => t.status === 'PENDING').length,
      confirmed: txs.filter(t => t.status === 'CONFIRMED').length,
      cancelled: txs.filter(t => t.status === 'CANCELLED').length,
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
    setStatusFilter('');
    setUserIdFilter('');
    setListingIdFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
    loadTransactions();
  };

  // View action history
  const handleViewHistory = async (tx: Transaction) => {
    setSelectedTransaction(tx);
    setHistoryDialog(true);
    setLoadingHistory(true);
    setActionHistory([]);

    try {
      const history = await adminService.transactions.getTransactionActionHistory(tx.id, 1, 50);
      setActionHistory(history.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load action history');
      setActionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewDetails = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setDetailDialog(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
      PENDING: 'warning',
      CONFIRMED: 'success',
      CANCELLED: 'error',
      REFUNDED: 'info',
      DISPUTED: 'error',
    };
    return colors[status] || 'default';
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
        <Typography variant="h4">Transaction Management</Typography>
        <IconButton onClick={loadTransactions} color="primary" title="Refresh">
          <RefreshIcon />
        </IconButton>
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
                <StatsIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.pending}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.confirmed}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Confirmed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.cancelled}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Cancelled
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
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
                <MenuItem value="DISPUTED">Disputed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              type="number"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Listing ID"
              value={listingIdFilter}
              onChange={(e) => setListingIdFilter(e.target.value)}
              type="number"
            />
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
            No transactions found
          </Alert>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Listing ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.id}</TableCell>
                    <TableCell>{tx.userId}</TableCell>
                    <TableCell>{tx.listingId || '-'}</TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <Chip label={tx.status} color={getStatusColor(tx.status)} size="small" />
                    </TableCell>
                    <TableCell>{tx.transactionType || '-'}</TableCell>
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="info" onClick={() => handleViewDetails(tx)} title="View">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="default" onClick={() => handleViewHistory(tx)} title="Action History">
                        <HistoryIcon fontSize="small" />
                      </IconButton>

                      {/* Admin command buttons disabled - Transaction_Service doesn't implement these endpoints */}
                      {/* {tx.status === 'PENDING' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleConfirmClick(tx)}
                            disabled={processingId === tx.id}
                            title="Confirm"
                          >
                            {processingId === tx.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <ConfirmIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelClick(tx)}
                            disabled={processingId === tx.id}
                            title="Cancel"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}

                      {tx.status === 'CONFIRMED' && (
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleRefundClick(tx)}
                          disabled={processingId === tx.id}
                          title="Refund"
                        >
                          <RefundIcon fontSize="small" />
                        </IconButton>
                      )}

                      {tx.status === 'DISPUTED' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleResolveClick(tx)}
                          disabled={processingId === tx.id}
                          title="Resolve Dispute"
                        >
                          <ResolveIcon fontSize="small" />
                        </IconButton>
                      )} */}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Transaction ID:</strong> {selectedTransaction.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>User ID:</strong> {selectedTransaction.userId}
              </Typography>
              {selectedTransaction.listingId && (
                <Typography variant="body1" gutterBottom>
                  <strong>Listing ID:</strong> {selectedTransaction.listingId}
                </Typography>
              )}
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Typography component="span" variant="body1">
                  <strong>Status:</strong>{' '}
                </Typography>
                <Chip label={selectedTransaction.status} color={getStatusColor(selectedTransaction.status)} size="small" />
              </Box>
              {selectedTransaction.transactionType && (
                <Typography variant="body1" gutterBottom>
                  <strong>Type:</strong> {selectedTransaction.transactionType}
                </Typography>
              )}
              {selectedTransaction.description && (
                <Typography variant="body1" gutterBottom>
                  <strong>Description:</strong> {selectedTransaction.description}
                </Typography>
              )}
              <Typography variant="body1" gutterBottom>
                <strong>Created At:</strong> {formatDate(selectedTransaction.createdAt)}
              </Typography>
              {selectedTransaction.confirmedAt && (
                <Typography variant="body1" gutterBottom>
                  <strong>Confirmed At:</strong> {formatDate(selectedTransaction.confirmedAt)}
                </Typography>
              )}
              {selectedTransaction.cancelledAt && (
                <Typography variant="body1" gutterBottom>
                  <strong>Cancelled At:</strong> {formatDate(selectedTransaction.cancelledAt)}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Admin command dialogs removed - Transaction_Service doesn't implement these endpoints */}
      {/* Confirm, Cancel, Refund, and Resolve Dispute dialogs disabled */}

      {/* Action History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Transaction Action History</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                <strong>Transaction ID:</strong> {selectedTransaction.id}
              </Typography>

              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : actionHistory.length === 0 ? (
                <Alert severity="info">No action history found for this transaction.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Admin</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actionHistory.map((action, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(action.createdAt || action.timestamp).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Chip label={action.action || action.actionType} size="small" color="primary" />
                        </TableCell>
                        <TableCell>{action.adminId || action.performedBy || 'System'}</TableCell>
                        <TableCell>
                          {action.reason || action.notes || action.details || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTransactionsPage;
