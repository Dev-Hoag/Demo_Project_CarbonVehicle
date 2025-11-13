import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Pagination,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Add, Receipt, FilterList, Refresh } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { paymentApi, type Payment } from '../api/payment';
import { statusColors } from '../types';
import toast from 'react-hot-toast';

export const PaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getPaymentHistory({ 
        page, 
        limit,
        status: statusFilter || undefined,
      });
      setPayments(response.payments || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load payments');
      setPayments([]); // Set empty array on error to prevent undefined errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, limit, statusFilter]);

  const handleInitiatePayment = async (data: any) => {
    try {
      await paymentApi.initiatePayment({
        amount: parseFloat(data.amount),
        currency: data.currency || 'USD',
        paymentMethod: data.paymentMethod,
        description: data.description,
      });
      toast.success('Payment initiated successfully');
      setCreateDialog(false);
      reset();
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  const handleViewDetails = async (paymentId: number) => {
    try {
      const payment = await paymentApi.getPaymentById(paymentId);
      setSelectedPayment(payment);
    } catch (err: any) {
      toast.error('Failed to load payment details');
    }
  };

  const handleCancelPayment = async (paymentId: number) => {
    try {
      await paymentApi.cancelPayment(paymentId);
      toast.success('Payment cancelled');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel payment');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'PENDING').length,
    completed: payments.filter(p => p.status === 'COMPLETED').length,
    failed: payments.filter(p => p.status === 'FAILED').length,
    totalAmount: payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Payments
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
          New Payment
        </Button>
      </Box>

      {/* Statistics */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Payments
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Pending
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {stats.pending}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Completed
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
              {stats.completed}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Failed
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
              {stats.failed}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Amount
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              ${stats.totalAmount.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
            <FilterList color="action" />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Filters
            </Typography>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={() => {
                setStatusFilter('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          </Box>
          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="PROCESSING">Processing</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="EXPIRED">Expired</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Per Page</InputLabel>
              <Select
                value={limit}
                label="Per Page"
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Payment History
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No payments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          #{payment.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography color="primary.main" fontWeight={600}>
                          ${payment.amount.toFixed(2)} {payment.currency}
                        </Typography>
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{payment.description || '-'}</TableCell>
                      <TableCell>
                        <Chip label={payment.status} color={statusColors[payment.status]} size="small" />
                      </TableCell>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<Receipt />}
                          onClick={() => handleViewDetails(payment.id)}
                        >
                          Details
                        </Button>
                        {payment.status === 'PENDING' && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleCancelPayment(payment.id)}
                            sx={{ ml: 1 }}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {total > limit && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={Math.ceil(total / limit)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Initiate New Payment</DialogTitle>
        <form onSubmit={handleSubmit(handleInitiatePayment)}>
          <DialogContent>
            <TextField
              {...register('amount', { required: true })}
              margin="normal"
              label="Amount"
              type="number"
              fullWidth
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <TextField
              {...register('currency')}
              margin="normal"
              label="Currency"
              fullWidth
              select
              defaultValue="USD"
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="VND">VND</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
            </TextField>
            <TextField
              {...register('paymentMethod', { required: true })}
              margin="normal"
              label="Payment Method"
              fullWidth
              select
              required
              defaultValue="BANK_TRANSFER"
            >
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
              <MenuItem value="E_WALLET">E-Wallet</MenuItem>
              <MenuItem value="CRYPTO">Cryptocurrency</MenuItem>
            </TextField>
            <TextField
              {...register('description')}
              margin="normal"
              label="Description"
              fullWidth
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Initiate Payment</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onClose={() => setSelectedPayment(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Payment ID:</strong> #{selectedPayment.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> ${selectedPayment.amount.toFixed(2)} {selectedPayment.currency}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Method:</strong> {selectedPayment.paymentMethod}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> <Chip label={selectedPayment.status} color={statusColors[selectedPayment.status]} size="small" />
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Description:</strong> {selectedPayment.description || 'N/A'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Created:</strong> {new Date(selectedPayment.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Updated:</strong> {new Date(selectedPayment.updatedAt).toLocaleString()}
              </Typography>
              {selectedPayment.transactionId && (
                <Typography variant="body2" gutterBottom>
                  <strong>Transaction ID:</strong> {selectedPayment.transactionId}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPayment(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsPage;
