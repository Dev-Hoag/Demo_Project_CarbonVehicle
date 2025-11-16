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
  Tabs,
  Tab,
  IconButton,
  Card,
  CardContent,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  Assessment as StatsIcon,
  Undo as ReverseIcon,
  Done as CompleteIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import adminService from '../../services/admin';
import type { WalletFilters } from '../../services/admin';

interface WalletTransaction {
  id: string;
  userId: string | number;
  amount: number;
  type: string;
  status?: string;
  description?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  createdAt: string;
  confirmedAt?: string;
  reversedAt?: string;
}

interface WalletTransactionListResponse {
  data: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'REVERSED';

const AdminWithdrawals: React.FC = () => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('WITHDRAWAL');

  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    reversed: 0,
  });

  // Action dialogs
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [reverseDialog, setReverseDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const filters: WalletFilters = {
        page: page + 1,
        limit,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        type: transactionTypeFilter || undefined,
      };

      const response: WalletTransactionListResponse = await adminService.wallets.getAllTransactions(filters);
      setTransactions(response.data);
      setTotal(response.total);

      // Calculate statistics
      calculateStatistics(response.data);
    } catch (error: any) {
      console.error('Failed to load transactions:', error);
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (txs: WalletTransaction[]) => {
    setStatistics({
      total: txs.length,
      pending: txs.filter(t => t.status === 'PENDING').length,
      confirmed: txs.filter(t => t.status === 'CONFIRMED').length,
      reversed: txs.filter(t => t.status === 'REVERSED').length,
    });
  };

  // Load statistics from API
  const loadStatistics = async () => {
    try {
      const stats = await adminService.withdrawals.getStatistics();
      setStatistics({
        total: stats.total || 0,
        pending: stats.pending || 0,
        confirmed: stats.confirmed || 0,
        reversed: stats.reversed || 0,
      });
    } catch (error: any) {
      console.error('Failed to load withdrawal statistics:', error);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadStatistics();
  }, [page, limit, statusFilter, transactionTypeFilter]);

  // Handle confirm
  const handleConfirmClick = (tx: WalletTransaction) => {
    setSelectedTransaction(tx);
    setReason('');
    setConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedTransaction) return;

    setProcessingId(selectedTransaction.id);
    try {
      await adminService.wallets.confirmTransaction(selectedTransaction.id, reason || 'Approved by admin');
      toast.success('Transaction confirmed successfully');
      setConfirmDialog(false);
      setSelectedTransaction(null);
      setReason('');
      loadTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm transaction');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reverse
  const handleReverseClick = (tx: WalletTransaction) => {
    setSelectedTransaction(tx);
    setReason('');
    setReverseDialog(true);
  };

  const handleReverseSubmit = async () => {
    if (!selectedTransaction || !reason.trim()) {
      toast.error('Please provide a reason for reversal');
      return;
    }

    setProcessingId(selectedTransaction.id);
    try {
      await adminService.wallets.reverseTransaction(selectedTransaction.id, reason);
      toast.success('Transaction reversed successfully');
      setReverseDialog(false);
      setSelectedTransaction(null);
      setReason('');
      loadTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reverse transaction');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle complete withdrawal
  const handleCompleteClick = (tx: WalletTransaction) => {
    setSelectedTransaction(tx);
    setTransactionHash('');
    setCompleteDialog(true);
  };

  const handleCompleteSubmit = async () => {
    if (!selectedTransaction || !transactionHash.trim()) {
      toast.error('Please provide transaction hash');
      return;
    }

    setProcessingId(selectedTransaction.id);
    try {
      await adminService.withdrawals.completeWithdrawal(selectedTransaction.id.toString(), transactionHash);
      toast.success('Withdrawal completed successfully');
      setCompleteDialog(false);
      setSelectedTransaction(null);
      setTransactionHash('');
      loadTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      PENDING: 'warning',
      CONFIRMED: 'success',
      REVERSED: 'error',
      FAILED: 'error',
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
        <Typography variant="h4">Withdrawal & Wallet Management</Typography>
        <IconButton onClick={loadTransactions} color="primary" title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Statistics Cards */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
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
        <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
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
        <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
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
        <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StatsIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">{statistics.reversed}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Reversed
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Transaction Type</InputLabel>
            <Select
              value={transactionTypeFilter}
              onChange={(e) => {
                setTransactionTypeFilter(e.target.value);
                setPage(0);
              }}
              label="Transaction Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
              <MenuItem value="DEPOSIT">Deposit</MenuItem>
              <MenuItem value="PAYMENT">Payment</MenuItem>
              <MenuItem value="REFUND">Refund</MenuItem>
            </Select>
          </FormControl>

          <Tabs
            value={statusFilter}
            onChange={(_, newValue) => {
              setStatusFilter(newValue);
              setPage(0);
            }}
          >
            <Tab label="Pending" value="PENDING" />
            <Tab label="All" value="ALL" />
            <Tab label="Confirmed" value="CONFIRMED" />
            <Tab label="Reversed" value="REVERSED" />
          </Tabs>
        </Stack>
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
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Bank Details</TableCell>
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
                      <Chip label={tx.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <Chip label={tx.status || 'N/A'} color={getStatusColor(tx.status || '')} size="small" />
                    </TableCell>
                    <TableCell>
                      {tx.bankAccountName && (
                        <Box>
                          <Typography variant="body2">{tx.bankAccountName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tx.bankName} - {tx.bankAccountNumber}
                          </Typography>
                        </Box>
                      )}
                      {!tx.bankAccountName && '-'}
                    </TableCell>
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    <TableCell align="right">
                      {tx.status === 'PENDING' && (
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
                              <ApproveIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReverseClick(tx)}
                            disabled={processingId === tx.id}
                            title="Reject"
                          >
                            <RejectIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      {tx.status === 'CONFIRMED' && tx.type === 'WITHDRAWAL' && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleCompleteClick(tx)}
                            disabled={processingId === tx.id}
                            title="Complete Withdrawal"
                          >
                            <CompleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleReverseClick(tx)}
                            disabled={processingId === tx.id}
                            title="Reverse"
                          >
                            <ReverseIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      {tx.status === 'CONFIRMED' && tx.type !== 'WITHDRAWAL' && (
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleReverseClick(tx)}
                          disabled={processingId === tx.id}
                          title="Reverse"
                        >
                          <ReverseIcon fontSize="small" />
                        </IconButton>
                      )}
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

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Transaction</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Transaction ID:</strong> {selectedTransaction.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {selectedTransaction.type}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Confirmation Note (optional)"
                type="text"
                fullWidth
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add any notes about this confirmation..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmSubmit}
            color="success"
            variant="contained"
            disabled={processingId !== null}
          >
            {processingId ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reverse Dialog */}
      <Dialog open={reverseDialog} onClose={() => setReverseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reverse Transaction</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will reverse the transaction and refund the amount to the user's wallet.
              </Alert>
              <Typography variant="body1" gutterBottom>
                <strong>Transaction ID:</strong> {selectedTransaction.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Reason for Reversal"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed reason for reversing this transaction..."
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReverseDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReverseSubmit}
            color="error"
            variant="contained"
            disabled={!reason.trim() || processingId !== null}
          >
            {processingId ? <CircularProgress size={20} /> : 'Reverse'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Withdrawal Dialog */}
      <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Withdrawal</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Mark this withdrawal as completed by providing the blockchain transaction hash.
              </Alert>
              <Typography variant="body1" gutterBottom>
                <strong>Transaction ID:</strong> {selectedTransaction.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                <strong>Bank:</strong> {selectedTransaction.bankName} - {selectedTransaction.bankAccountNumber}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Transaction Hash"
                type="text"
                fullWidth
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                placeholder="Enter blockchain transaction hash..."
                required
                helperText="Provide the blockchain transaction hash as proof of transfer"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCompleteSubmit}
            color="primary"
            variant="contained"
            disabled={!transactionHash.trim() || processingId !== null}
          >
            {processingId ? <CircularProgress size={20} /> : 'Complete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminWithdrawals;
