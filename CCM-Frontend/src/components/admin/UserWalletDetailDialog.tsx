import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import adminService from '../../services/admin';

interface UserWalletDetailDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string | number;
  userName?: string;
}

interface WalletDetail {
  id: string;
  userId: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalTransactions: number;
  totalDeposited: number;
  totalWithdrawn: number;
  lastTransaction?: {
    id: string;
    type: string;
    amount: number;
    createdAt: string;
  };
}

const UserWalletDetailDialog: React.FC<UserWalletDetailDialogProps> = ({
  open,
  onClose,
  userId,
  userName,
}) => {
  const [loading, setLoading] = useState(false);
  const [walletDetail, setWalletDetail] = useState<WalletDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadWalletDetail();
    }
  }, [open, userId]);

  const loadWalletDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.wallets.getUserWalletDetail(userId);
      setWalletDetail(data);
    } catch (error: any) {
      let errorMsg = error.response?.data?.message || 'Failed to load wallet details';
      
      // Handle specific error cases
      if (errorMsg.includes('Wallet not found') || error.response?.status === 404) {
        errorMsg = `This user does not have a wallet yet. Wallet will be created automatically when user makes their first transaction.`;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      ACTIVE: 'success',
      SUSPENDED: 'warning',
      CLOSED: 'error',
      PENDING: 'warning',
      COMPLETED: 'success',
      FAILED: 'error',
    };
    return colors[status] || 'default';
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <TrendingUpIcon fontSize="small" color="success" />;
      case 'WITHDRAWAL':
        return <TrendingDownIcon fontSize="small" color="error" />;
      case 'TRANSFER':
        return <TransferIcon fontSize="small" color="primary" />;
      default:
        return <WalletIcon fontSize="small" />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WalletIcon />
          <Typography variant="h6">
            Wallet Detail {userName ? `- ${userName}` : `- User #${userId}`}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && walletDetail && (
          <Box>
            {/* Wallet Info */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Available Balance
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(walletDetail.availableBalance || 0)}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Locked Balance
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {formatCurrency(walletDetail.lockedBalance || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>

            {/* Wallet Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <Chip label={walletDetail.status} color={getStatusColor(walletDetail.status)} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Created: {formatDate(walletDetail.createdAt)}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Statistics */}
            <Typography variant="h6" gutterBottom>
              Transaction Statistics
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: 150, flex: '1 1 auto' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Deposited
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(walletDetail.totalDeposited || 0)}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 150, flex: '1 1 auto' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Withdrawn
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatCurrency(walletDetail.totalWithdrawn || 0)}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 150, flex: '1 1 auto' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Transactions
                </Typography>
                <Typography variant="h6">
                  {walletDetail.totalTransactions || 0}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Last Transaction */}
            <Typography variant="h6" gutterBottom>
              Last Transaction
            </Typography>
            {walletDetail.lastTransaction ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTransactionTypeIcon(walletDetail.lastTransaction.type)}
                          <Typography variant="body2">{walletDetail.lastTransaction.type}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={walletDetail.lastTransaction.type === 'DEPOSIT' ? 'success.main' : 
                                 walletDetail.lastTransaction.type === 'WITHDRAWAL' ? 'error.main' : 'inherit'}
                        >
                          {walletDetail.lastTransaction.type === 'WITHDRAWAL' ? '-' : '+'}
                          {formatCurrency(walletDetail.lastTransaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{formatDate(walletDetail.lastTransaction.createdAt)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No transactions yet</Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {walletDetail && (
          <Button variant="contained" onClick={loadWalletDetail} disabled={loading}>
            Refresh
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserWalletDetailDialog;
