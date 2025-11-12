import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Chip,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Receipt,
  ArrowBack,
  Logout,
  FilterList,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { adminWalletsApi, type TransactionDetail, type TransactionListParams } from '../api/admin-wallets';
import toast from 'react-hot-toast';

export const AdminTransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Filters
  const [userId, setUserId] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: TransactionListParams = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (userId) params.userId = userId;
      if (type) params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (minAmount) params.minAmount = parseFloat(minAmount);
      if (maxAmount) params.maxAmount = parseFloat(maxAmount);

      const data = await adminWalletsApi.getTransactionList(params);
      setTransactions(data.items);
      setTotal(data.total);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setUserId('');
    setType('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPage(0);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'success';
      case 'WITHDRAWAL':
        return 'error';
      case 'RESERVE':
        return 'warning';
      case 'RELEASE':
        return 'info';
      case 'REFUND':
        return 'secondary';
      case 'TRANSFER_IN':
        return 'primary';
      case 'TRANSFER_OUT':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'DEPOSIT' || type === 'RELEASE' || type === 'TRANSFER_IN') {
      return <TrendingUp fontSize="small" />;
    }
    return <TrendingDown fontSize="small" />;
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Receipt sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard - Transaction History
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {adminUser.email}
          </Typography>
          <Button
            color="inherit"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin/reports')}
            sx={{ mr: 1 }}
          >
            Reports
          </Button>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          All Transactions ({total})
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DEPOSIT">Deposit</MenuItem>
                  <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
                  <MenuItem value="RESERVE">Reserve</MenuItem>
                  <MenuItem value="RELEASE">Release</MenuItem>
                  <MenuItem value="REFUND">Refund</MenuItem>
                  <MenuItem value="TRANSFER_IN">Transfer In</MenuItem>
                  <MenuItem value="TRANSFER_OUT">Transfer Out</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1.5 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Min Amount"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1.5 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Amount"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <Box display="flex" gap={1} flexDirection="column">
                  <Button variant="contained" onClick={handleApplyFilters} fullWidth>
                    Apply
                  </Button>
                  <Button variant="outlined" onClick={handleClearFilters} fullWidth size="small">
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell align="center">Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Balance Before</TableCell>
                <TableCell align="right">Balance After</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={40} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {tx.userId}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={tx.type}
                        color={getTypeColor(tx.type)}
                        size="small"
                        icon={getTypeIcon(tx.type)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {tx.amount.toLocaleString('vi-VN')} VND
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {tx.balanceBefore.toLocaleString('vi-VN')} VND
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        {tx.balanceAfter.toLocaleString('vi-VN')} VND
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {tx.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {tx.referenceId || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100, 200]}
          />
        </TableContainer>
      </Box>
    </Box>
  );
};
