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
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  Assessment as StatsIcon,
  Done as CompleteIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import adminService from '../../services/admin';

interface Withdrawal {
  id: string;
  userId: number;
  walletId: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch?: string;
  status: string;
  notes?: string;
  rejectionReason?: string;
  approvedBy?: number;
  approvedAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');

  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Action dialogs
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load withdrawals
  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      let data: Withdrawal[];
      
      if (statusFilter === 'ALL') {
        data = await adminService.withdrawals.getAllWithdrawals();
      } else if (statusFilter === 'PENDING') {
        data = await adminService.withdrawals.getPendingWithdrawals();
      } else {
        data = await adminService.withdrawals.getAllWithdrawals(statusFilter);
      }

      setWithdrawals(data);

      // Calculate statistics
      calculateStatistics(data);
    } catch (error: any) {
      console.error('Failed to load withdrawals:', error);
      toast.error(error.response?.data?.message || 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (withdrawals: Withdrawal[]) => {
    setStatistics({
      total: withdrawals.length,
      pending: withdrawals.filter(w => w.status === 'PENDING').length,
      approved: withdrawals.filter(w => w.status === 'APPROVED').length,
      rejected: withdrawals.filter(w => w.status === 'REJECTED').length,
    });
  };

  // Load statistics from API
  const loadStatistics = async () => {
    try {
      // Since statistics endpoint may not exist, we calculate from data
      // const stats = await adminService.withdrawals.getStatistics();
      // For now, statistics will be calculated from loaded withdrawals
      // in the calculateStatistics function
      if (withdrawals.length > 0) {
        calculateStatistics(withdrawals);
      }
    } catch (error: any) {
      console.error('Failed to load withdrawal statistics:', error);
      // Fallback: calculate from loaded data
      if (withdrawals.length > 0) {
        calculateStatistics(withdrawals);
      }
    }
  };

  useEffect(() => {
    loadWithdrawals();
    loadStatistics();
  }, [statusFilter]);

  // Handle approve
  const handleApproveClick = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setReason('');
    setApproveDialog(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedWithdrawal) return;

    setProcessingId(selectedWithdrawal.id);
    try {
      await adminService.withdrawals.approveWithdrawal(selectedWithdrawal.id, reason || undefined);
      toast.success('Withdrawal approved successfully');
      setApproveDialog(false);
      setSelectedWithdrawal(null);
      setReason('');
      loadWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const handleRejectClick = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setReason('');
    setRejectDialog(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedWithdrawal || !reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessingId(selectedWithdrawal.id);
    try {
      await adminService.withdrawals.rejectWithdrawal(selectedWithdrawal.id, reason);
      toast.success('Withdrawal rejected successfully');
      setRejectDialog(false);
      setSelectedWithdrawal(null);
      setReason('');
      loadWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle complete withdrawal
  const handleCompleteClick = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setTransactionHash('');
    setCompleteDialog(true);
  };

  const handleCompleteSubmit = async () => {
    if (!selectedWithdrawal || !transactionHash.trim()) {
      toast.error('Please provide transaction hash');
      return;
    }

    setProcessingId(selectedWithdrawal.id);
    try {
      await adminService.withdrawals.completeWithdrawal(selectedWithdrawal.id, transactionHash);
      toast.success('Withdrawal completed successfully');
      setCompleteDialog(false);
      setSelectedWithdrawal(null);
      setTransactionHash('');
      loadWithdrawals();
      loadStatistics();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      COMPLETED: 'success',
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
        <Typography variant="h4">Withdrawal Management</Typography>
        <IconButton onClick={loadWithdrawals} color="primary" title="Refresh">
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
              Total Withdrawals
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
              <Typography variant="h6">{statistics.approved}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Approved
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StatsIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">{statistics.rejected}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Rejected
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Tabs
          value={statusFilter}
          onChange={(_, newValue) => {
            setStatusFilter(newValue);
          }}
        >
          <Tab label="Pending" value="PENDING" />
          <Tab label="All" value="ALL" />
          <Tab label="Approved" value="APPROVED" />
          <Tab label="Rejected" value="REJECTED" />
        </Tabs>
      </Paper>

      {/* Withdrawals Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : withdrawals.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            No withdrawals found
          </Alert>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Bank Info</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell align="right">Net Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                    <TableCell>{withdrawal.userId}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{withdrawal.bankName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {withdrawal.bankAccountNumber} - {withdrawal.bankAccountName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(withdrawal.amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(withdrawal.fee)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{formatCurrency(withdrawal.netAmount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={withdrawal.status} color={getStatusColor(withdrawal.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {withdrawal.notes || withdrawal.rejectionReason || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {withdrawal.status === 'PENDING' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApproveClick(withdrawal)}
                            disabled={processingId === withdrawal.id}
                            title="Approve"
                          >
                            {processingId === withdrawal.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <ApproveIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRejectClick(withdrawal)}
                            disabled={processingId === withdrawal.id}
                            title="Reject"
                          >
                            <RejectIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      {withdrawal.status === 'APPROVED' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleCompleteClick(withdrawal)}
                          disabled={processingId === withdrawal.id}
                          title="Complete Withdrawal"
                        >
                          <CompleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </TableContainer>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Withdrawal</DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>User ID:</strong> {selectedWithdrawal.userId}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Net Amount:</strong> {formatCurrency(selectedWithdrawal.netAmount)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Bank:</strong> {selectedWithdrawal.bankName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Account:</strong> {selectedWithdrawal.bankAccountNumber} - {selectedWithdrawal.bankAccountName}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Admin Note (optional)"
                type="text"
                fullWidth
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add any notes about this approval..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button
            onClick={handleApproveSubmit}
            color="success"
            variant="contained"
            disabled={processingId !== null}
          >
            {processingId ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Withdrawal</DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will reject the withdrawal request.
              </Alert>
              <Typography variant="body1" gutterBottom>
                <strong>User ID:</strong> {selectedWithdrawal.userId}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Reason for Rejection"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed reason for rejecting this withdrawal..."
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRejectSubmit}
            color="error"
            variant="contained"
            disabled={!reason.trim() || processingId !== null}
          >
            {processingId ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Withdrawal Dialog */}
      <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Withdrawal</DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Mark this withdrawal as completed by providing the blockchain transaction hash.
              </Alert>
              <Typography variant="body1" gutterBottom>
                <strong>Withdrawal ID:</strong> {selectedWithdrawal.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                <strong>Bank:</strong> {selectedWithdrawal.bankName} - {selectedWithdrawal.bankAccountNumber}
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
