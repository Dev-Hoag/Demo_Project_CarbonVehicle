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
  InputAdornment,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  AccountBalance,
  Search,
  ArrowBack,
  Logout,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import { adminWalletsApi, type WalletDetail, type WalletListParams } from '../api/admin-wallets';
import toast from 'react-hot-toast';

export const AdminWalletsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<WalletDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  useEffect(() => {
    fetchWallets();
  }, [page, rowsPerPage, sortBy, sortOrder]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const params: WalletListParams = {
        page: page + 1, // Backend uses 1-indexed
        limit: rowsPerPage,
        sortBy,
        sortOrder,
      };

      if (search) params.search = search;
      if (status) params.status = status as any;
      if (minBalance) params.minBalance = parseFloat(minBalance);
      if (maxBalance) params.maxBalance = parseFloat(maxBalance);

      const data = await adminWalletsApi.getWalletList(params);
      setWallets(data.items);
      setTotal(data.total);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(0); // Reset to first page
    fetchWallets();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setMinBalance('');
    setMaxBalance('');
    setSortBy('created_at');
    setSortOrder('DESC');
    setPage(0);
  };

  const handleViewDetail = (userId: string) => {
    navigate(`/admin/wallets/${userId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'warning';
      case 'CLOSED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <AccountBalance sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard - Wallet Management
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
          All Wallets ({total})
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Search User ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Min Balance"
                  value={minBalance}
                  onChange={(e) => setMinBalance(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Balance"
                  value={maxBalance}
                  onChange={(e) => setMaxBalance(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box display="flex" gap={1}>
                  <Button variant="contained" onClick={handleApplyFilters} fullWidth>
                    Apply
                  </Button>
                  <Button variant="outlined" onClick={handleClearFilters} fullWidth>
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Wallets Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User ID</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right">Locked</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Total Deposited</TableCell>
                <TableCell align="right">Total Withdrawn</TableCell>
                <TableCell align="center">Transactions</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={40} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : wallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No wallets found
                  </TableCell>
                </TableRow>
              ) : (
                wallets.map((wallet) => (
                  <TableRow key={wallet.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {wallet.userId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(wallet.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {wallet.balance.toLocaleString('vi-VN')} VND
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="warning.main">
                        {wallet.lockedBalance.toLocaleString('vi-VN')} VND
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main">
                        {wallet.availableBalance.toLocaleString('vi-VN')} VND
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={wallet.status}
                        color={getStatusColor(wallet.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main">
                        {wallet.totalDeposited.toLocaleString('vi-VN')} VND
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="error.main">
                        {wallet.totalWithdrawn.toLocaleString('vi-VN')} VND
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={wallet.totalTransactions}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetail(wallet.userId)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
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
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </TableContainer>
      </Box>
    </Box>
  );
};
