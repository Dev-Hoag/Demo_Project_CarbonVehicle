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
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { creditApi, type CreditAccount, type CreditStatistics } from '../../api/credit';

export const AdminCreditsPage: React.FC = () => {
  const [credits, setCredits] = useState<CreditAccount[]>([]);
  const [statistics, setStatistics] = useState<CreditStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [searchUserId, setSearchUserId] = useState('');
  const [selectedCredit, setSelectedCredit] = useState<CreditAccount | null>(null);
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentSource, setAdjustmentSource] = useState('MANUAL_ADJUSTMENT');
  const [adjustmentDescription, setAdjustmentDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCredits();
    loadStatistics();
  }, [page, rowsPerPage]);

  const loadCredits = async () => {
    setLoading(true);
    try {
      const response = await creditApi.getAll({
        page,
        size: rowsPerPage,
        sort: 'createdAt,desc',
      });
      console.log('Credits API response:', response.data);
      
      // Unwrap nested data structure: response.data.data
      const actualData = response.data.data || response.data;
      
      // Handle both paginated and non-paginated responses
      if (actualData.content) {
        setCredits(actualData.content);
        setTotalElements(actualData.totalElements || 0);
      } else if (Array.isArray(actualData)) {
        setCredits(actualData);
        setTotalElements(actualData.length);
      } else {
        console.warn('Unexpected credits response format:', actualData);
        setCredits([]);
        setTotalElements(0);
      }
    } catch (error: any) {
      console.error('Failed to load credits:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to load credit accounts');
      setCredits([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await creditApi.getStatistics();
      console.log('Statistics API response:', response.data);
      // Unwrap nested data: response.data.data contains actual statistics
      setStatistics(response.data.data || response.data);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
      console.error('Error response:', error.response);
      // Don't show error toast for statistics failure
    }
  };

  const handleSearch = async () => {
    if (!searchUserId.trim()) {
      loadCredits();
      return;
    }

    setLoading(true);
    try {
      const response = await creditApi.getByUserId(searchUserId);
      const actualData = response.data.data || response.data;
      setCredits([actualData]);
      setTotalElements(1);
    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error('User not found or no credit account');
      setCredits([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjustment = (credit: CreditAccount, type: 'add' | 'deduct') => {
    setSelectedCredit(credit);
    setAdjustmentType(type);
    setAdjustmentAmount('');
    setAdjustmentDescription('');
    setAdjustmentDialog(true);
  };

  const handleCloseAdjustment = () => {
    setAdjustmentDialog(false);
    setSelectedCredit(null);
    setAdjustmentAmount('');
    setAdjustmentDescription('');
  };

  const handleAdjustment = async () => {
    if (!selectedCredit || !adjustmentAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    setProcessing(true);
    try {
      if (adjustmentType === 'add') {
        await creditApi.addCredit({
          userId: selectedCredit.userId,
          amount,
          source: adjustmentSource,
          description: adjustmentDescription || `Manual credit addition by admin`,
        });
        toast.success(`Added ${amount} kg CO₂ credits`);
      } else {
        await creditApi.deductCredit({
          userId: selectedCredit.userId,
          amount,
          reason: adjustmentSource,
          description: adjustmentDescription || `Manual credit deduction by admin`,
        });
        toast.success(`Deducted ${amount} kg CO₂ credits`);
      }

      handleCloseAdjustment();
      loadCredits();
      loadStatistics();
    } catch (error: any) {
      console.error('Adjustment failed:', error);
      toast.error(error.response?.data?.message || 'Failed to adjust credits');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          💳 Credit Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage user carbon credit accounts and transactions
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Users
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {statistics?.totalUsers ?? 0}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Credits
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {(statistics?.totalCredits ?? 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kg CO₂
                  </Typography>
                </Box>
                <BalanceIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Transactions
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {statistics?.totalTransactions ?? 0}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Average Balance
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {(statistics?.averageBalance ?? 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kg CO₂
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Search & Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search by User ID (UUID)"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchUserId('');
                loadCredits();
              }}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Credits Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account ID</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right">Total Earned</TableCell>
                <TableCell align="right">Total Spent</TableCell>
                <TableCell align="right">Transferred In</TableCell>
                <TableCell align="right">Transferred Out</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !credits || credits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No credit accounts found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                credits.map((credit) => (
                  <TableRow key={credit.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {credit.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {credit.userId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${credit.balance.toFixed(2)} kg`}
                        color={credit.balance > 0 ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {credit.totalEarned.toFixed(2)} kg
                    </TableCell>
                    <TableCell align="right">
                      {credit.totalSpent.toFixed(2)} kg
                    </TableCell>
                    <TableCell align="right">
                      {credit.totalTransferredIn.toFixed(2)} kg
                    </TableCell>
                    <TableCell align="right">
                      {credit.totalTransferredOut.toFixed(2)} kg
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(credit.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Add Credits">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenAdjustment(credit, 'add')}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deduct Credits">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenAdjustment(credit, 'deduct')}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Tooltip>
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

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialog} onClose={handleCloseAdjustment} maxWidth="sm" fullWidth>
        <DialogTitle>
          {adjustmentType === 'add' ? '➕ Add Credits' : '➖ Deduct Credits'}
        </DialogTitle>
        <DialogContent>
          {selectedCredit && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  User ID: <strong>{selectedCredit.userId.substring(0, 16)}...</strong>
                </Typography>
                <Typography variant="body2">
                  Current Balance: <strong>{selectedCredit.balance.toFixed(2)} kg CO₂</strong>
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Amount (kg CO₂)"
                type="number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Source/Reason</InputLabel>
                <Select
                  value={adjustmentSource}
                  onChange={(e) => setAdjustmentSource(e.target.value)}
                  label="Source/Reason"
                >
                  <MenuItem value="MANUAL_ADJUSTMENT">Manual Adjustment</MenuItem>
                  <MenuItem value="ADMIN_CORRECTION">Admin Correction</MenuItem>
                  <MenuItem value="REFUND">Refund</MenuItem>
                  <MenuItem value="PENALTY">Penalty</MenuItem>
                  <MenuItem value="BONUS">Bonus</MenuItem>
                  <MenuItem value="SYSTEM_ERROR">System Error Fix</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Description"
                value={adjustmentDescription}
                onChange={(e) => setAdjustmentDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Enter reason for this adjustment..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdjustment} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleAdjustment}
            variant="contained"
            color={adjustmentType === 'add' ? 'success' : 'error'}
            disabled={processing || !adjustmentAmount}
          >
            {processing ? 'Processing...' : adjustmentType === 'add' ? 'Add Credits' : 'Deduct Credits'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCreditsPage;
