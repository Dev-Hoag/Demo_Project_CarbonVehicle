import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Logout,
  Refresh,
  AccountBalance,
  Assessment,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export default function AdminWithdrawals() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const token = localStorage.getItem('adminToken');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchWithdrawals();
  }, [activeTab]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const status = activeTab === 0 ? 'PENDING' : activeTab === 1 ? 'APPROVED' : 'REJECTED';
      const url = activeTab === 0 
        ? 'http://localhost/api/admin/withdrawals/pending'
        : `http://localhost/api/admin/withdrawals?status=${status}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWithdrawals(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    try {
      await axios.post(
        `http://localhost/api/admin/withdrawals/${selectedWithdrawal.id}/approve`,
        { adminNote: 'Approved by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Withdrawal approved successfully!');
      setApproveDialog(false);
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal');
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await axios.post(
        `http://localhost/api/admin/withdrawals/${selectedWithdrawal.id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Withdrawal rejected');
      setRejectDialog(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Admin Header */}
      <AppBar position="static">
        <Toolbar>
          <AccountBalance sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard - Withdrawal Management
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {adminUser.email}
          </Typography>
          <Button
            color="inherit"
            startIcon={<Assessment />}
            onClick={() => navigate('/admin/reports')}
            sx={{ mr: 1 }}
          >
            Reports
          </Button>
          <IconButton color="inherit" onClick={fetchWithdrawals} title="Refresh">
            <Refresh />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Withdrawal Requests
          </Typography>

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Pending" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
          </Tabs>

          {loading ? (
            <Typography>Loading...</Typography>
          ) : withdrawals.length === 0 ? (
            <Alert severity="info">No withdrawals found</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Fee</TableCell>
                    <TableCell>Net Amount</TableCell>
                    <TableCell>Bank Info</TableCell>
                    <TableCell>Status</TableCell>
                    {activeTab === 0 && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        {new Date(withdrawal.createdAt).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>{withdrawal.userId}</TableCell>
                      <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                      <TableCell>{formatCurrency(withdrawal.fee)}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(withdrawal.netAmount)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          <strong>{withdrawal.bankAccountName}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {withdrawal.bankName} - {withdrawal.bankAccountNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={withdrawal.status}
                          color={getStatusColor(withdrawal.status)}
                          size="small"
                        />
                      </TableCell>
                      {activeTab === 0 && (
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setApproveDialog(true);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setRejectDialog(true);
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)}>
        <DialogTitle>Approve Withdrawal</DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to approve this withdrawal?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>User:</strong> {selectedWithdrawal.userId}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Net Amount:</strong> {formatCurrency(selectedWithdrawal.netAmount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Bank:</strong> {selectedWithdrawal.bankName}
                </Typography>
                <Typography variant="body2">
                  <strong>Account:</strong> {selectedWithdrawal.bankAccountNumber}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action will deduct {formatCurrency(selectedWithdrawal.amount)} from the user's wallet.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success">
            Confirm Approval
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)}>
        <DialogTitle>Reject Withdrawal</DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Provide a reason for rejecting this withdrawal:
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>User:</strong> {selectedWithdrawal.userId}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                sx={{ mt: 2 }}
                placeholder="e.g., Invalid bank account information"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
