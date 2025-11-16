import React, { useState, useEffect } from 'react';
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
  TablePagination,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Error as ErrorIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/client';

interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  pricePerKg: number;
  totalPrice: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionStats {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  totalCO2Traded: number;
}

export const AdminListingTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchId, setSearchId] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    calculateStats();
  }, [transactions]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: rowsPerPage,
      };

      let url = '/api/transactions';
      if (statusFilter !== 'ALL') {
        url = `/api/transactions/status/${statusFilter}`;
      }

      const response = await apiClient.get(url, { params });
      
      if (response.data.data) {
        setTransactions(response.data.data);
        setTotalElements(response.data.total || response.data.data.length);
      } else {
        setTransactions([]);
        setTotalElements(0);
      }
    } catch (error: any) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (transactions.length === 0) {
      setStats(null);
      return;
    }

    const stats: TransactionStats = {
      totalTransactions: transactions.length,
      completedTransactions: transactions.filter(t => t.status === 'COMPLETED').length,
      pendingTransactions: transactions.filter(t => t.status === 'PENDING').length,
      failedTransactions: transactions.filter(t => t.status === 'FAILED').length,
      totalRevenue: transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.totalPrice, 0),
      totalCO2Traded: transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0),
    };

    setStats(stats);
  };

  const handleSearch = async () => {
    if (!searchId.trim()) {
      loadTransactions();
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get(`/api/transactions/${searchId}`);
      if (response.data.data) {
        setTransactions([response.data.data]);
        setTotalElements(1);
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error('Transaction not found');
      setTransactions([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialog(false);
    setSelectedTransaction(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon color="success" />;
      case 'PENDING':
        return <PendingIcon color="warning" />;
      case 'FAILED':
        return <ErrorIcon color="error" />;
      case 'CANCELLED':
        return <CancelIcon color="disabled" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const transactionSteps = [
    'Reserve Payment',
    'Settle Payment',
    'Transfer Credits',
    'Update Listing',
    'Complete Transaction',
  ];

  const getActiveStep = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'COMPLETED':
        return 5;
      case 'FAILED':
        return 2;
      case 'CANCELLED':
        return 1;
      default:
        return 0;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          🔄 Listing Transactions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor carbon credit purchase transactions
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 3, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.totalTransactions}
                  </Typography>
                </Box>
                <ShoppingCartIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {stats.completedTransactions}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {stats.pendingTransactions}
                  </Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Failed
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {stats.failedTransactions}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {stats.totalRevenue.toLocaleString()}₫
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  CO₂ Traded
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {stats.totalCO2Traded.toFixed(2)} kg
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filters & Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 200 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              placeholder="Search by Transaction ID (UUID)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Stack direction="row" spacing={1} sx={{ minWidth: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setSearchId('');
                  setStatusFilter('ALL');
                  loadTransactions();
                }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Listing ID</TableCell>
                <TableCell>Buyer ID</TableCell>
                <TableCell>Seller ID</TableCell>
                <TableCell align="right">Amount (kg CO₂)</TableCell>
                <TableCell align="right">Price/kg</TableCell>
                <TableCell align="right">Total Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {transaction.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {transaction.listingId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {transaction.buyerId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {transaction.sellerId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>
                        {transaction.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {transaction.pricePerKg.toLocaleString()}₫
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="primary">
                        {transaction.totalPrice.toLocaleString()}₫
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(transaction.status) || undefined}
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(transaction.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewDetails(transaction)}
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

        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog 
        open={detailsDialog} 
        onClose={handleCloseDetails} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Transaction Details
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ pt: 2 }}>
              {/* Basic Info */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Stack direction="row" spacing={2}>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Transaction ID
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {selectedTransaction.id}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box mt={0.5}>
                      <Chip
                        icon={getStatusIcon(selectedTransaction.status) || undefined}
                        label={selectedTransaction.status}
                        color={getStatusColor(selectedTransaction.status)}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Stack>
              </Alert>

              {/* Transaction Flow Stepper */}
              <Typography variant="subtitle2" gutterBottom>
                Transaction Flow (8-Step Atomic Process)
              </Typography>
              <Stepper 
                activeStep={getActiveStep(selectedTransaction.status)} 
                alternativeLabel 
                sx={{ mb: 3 }}
              >
                {transactionSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ my: 2 }} />

              {/* Transaction Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Listing ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedTransaction.listingId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedTransaction.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Buyer ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedTransaction.buyerId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Seller ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedTransaction.sellerId}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Amount (kg CO₂)
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedTransaction.amount.toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Price per kg
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedTransaction.pricePerKg.toLocaleString()}₫
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Price
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {selectedTransaction.totalPrice.toLocaleString()}₫
                  </Typography>
                </Box>
              </Box>
              
              {selectedTransaction.notes && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body2">
                    {selectedTransaction.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminListingTransactionsPage;
