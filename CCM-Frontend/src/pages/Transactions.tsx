import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
} from '@mui/material';
import { Search, FilterList, Receipt, Close, ContentCopy } from '@mui/icons-material';
import { transactionApi, type Transaction } from '../api/listing';
import { statusColors } from '../types';
import toast from 'react-hot-toast';

export const TransactionsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState({ status: 'ALL', search: '' });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch all transactions from Transaction Service
      const response = await transactionApi.getRecent(100);
      const txData = response.data.data || response.data || [];
      setTransactions(txData);
      setFilteredTransactions(txData);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      toast.error('Failed to load transactions');
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    if (filter.status !== 'ALL') {
      filtered = filtered.filter(t => t.status === filter.status);
    }

    if (filter.search) {
      filtered = filtered.filter(t =>
        t.id.toString().includes(filter.search) ||
        t.listingId.toString().includes(filter.search)
      );
    }

    setFilteredTransactions(filtered);
  }, [filter, transactions]);

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailDialog(true);
  };

  const handleCloseDetail = () => {
    setDetailDialog(false);
    setSelectedTransaction(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Calculate statistics
  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'COMPLETED').length,
    pending: transactions.filter(t => t.status === 'PENDING').length,
    totalAmount: transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (Number(t.totalPrice) || 0), 0),
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Transaction History
      </Typography>

      {/* Statistics Cards */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Transactions
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Completed
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
              {stats.completed}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Pending
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {stats.pending}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total Value
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {(stats.totalAmount || 0).toLocaleString('vi-VN')} VND
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Search by ID or Listing ID..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Status"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Listing ID</TableCell>
                  <TableCell>Buyer ID</TableCell>
                  <TableCell>Seller ID</TableCell>
                  <TableCell align="right">Credits</TableCell>
                  <TableCell align="right">Total Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          #{tx.id}
                        </Typography>
                      </TableCell>
                      <TableCell>#{tx.listingId}</TableCell>
                      <TableCell>User #{tx.buyerId}</TableCell>
                      <TableCell>User #{tx.sellerId}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600}>
                          {tx.amount} kg
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="success.main" fontWeight={600}>
                          {tx.totalPrice.toLocaleString('vi-VN')} VND
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.status} color={statusColors[tx.status]} size="small" />
                      </TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<Receipt />}
                          onClick={() => handleViewDetails(tx)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={detailDialog} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Transaction Details
            </Typography>
            <Button onClick={handleCloseDetail} size="small">
              <Close />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransaction && (
            <Stack spacing={2.5}>
              {/* Transaction Info */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  TRANSACTION INFORMATION
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                    <Typography variant="body2" fontWeight={600}>#{selectedTransaction.id.substring(0, 8)}...</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Listing ID</Typography>
                    <Typography variant="body2" fontWeight={600}>#{selectedTransaction.listingId.substring(0, 8)}...</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={selectedTransaction.status} color={statusColors[selectedTransaction.status]} size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedTransaction.transactionType}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body2" fontWeight={600}>{new Date(selectedTransaction.createdAt).toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Credit Details */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  CREDIT DETAILS
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">CO₂ Amount</Typography>
                    <Typography variant="h6" color="success.main" fontWeight={600}>{selectedTransaction.amount} kg</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Price per kg</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedTransaction.pricePerKg.toLocaleString('vi-VN')} VND</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body1" fontWeight={600}>Total Price</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={600}>{selectedTransaction.totalPrice.toLocaleString('vi-VN')} VND</Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Parties */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  PARTIES INVOLVED
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Buyer</Typography>
                    <Typography variant="body2" fontWeight={600}>User #{selectedTransaction.buyerId.substring(30)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Seller</Typography>
                    <Typography variant="body2" fontWeight={600}>User #{selectedTransaction.sellerId.substring(30)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Payment Status</Typography>
                    <Chip label={selectedTransaction.paymentStatus} color={selectedTransaction.paymentStatus === 'PAID' ? 'success' : 'default'} size="small" />
                  </Box>
                </Stack>
              </Box>

              {/* Notes */}
              {selectedTransaction.notes && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    NOTES
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    {selectedTransaction.notes}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDetail} variant="outlined">
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<ContentCopy />}
            onClick={() => {
              navigator.clipboard.writeText(selectedTransaction?.id || '');
              toast.success('Transaction ID copied!');
            }}
          >
            Copy ID
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsPage;
