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
  Alert,
  Button,
} from '@mui/material';
import { Search, FilterList, Receipt } from '@mui/icons-material';
import { mockTransactionApi, type Transaction } from '../api/mock';
import { statusColors } from '../types';
import toast from 'react-hot-toast';

export const TransactionsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState({ status: 'ALL', search: '' });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await mockTransactionApi.getAll({ limit: 100 });
      setTransactions(response.data);
      setFilteredTransactions(response.data);
    } catch (err) {
      toast.error('Failed to load transactions');
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
    toast.success(`Transaction #${transaction.id} details will be shown here`);
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
      .reduce((sum, t) => sum + t.totalPrice, 0),
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Transaction History
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Mock Data:</strong> These transactions are simulated. Real transaction data will come from backend API.
      </Alert>

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
              ${stats.totalAmount.toFixed(2)}
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
                      <TableCell align="right">{tx.creditAmount}</TableCell>
                      <TableCell align="right">
                        <Typography color="success.main" fontWeight={600}>
                          ${tx.totalPrice.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.status} color={statusColors[tx.status]} size="small" />
                      </TableCell>
                      <TableCell>
                        {new Date(tx.transactionDate).toLocaleDateString()}
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
    </Box>
  );
};

export default TransactionsPage;
