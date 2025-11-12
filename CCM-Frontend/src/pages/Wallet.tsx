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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add, Remove, Send } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { walletApi, type WalletTransaction } from '../api/wallet';
import { statusColors } from '../types';
import toast from 'react-hot-toast';

export const WalletPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [depositDialog, setDepositDialog] = useState(false);
  const [withdrawDialog, setWithdrawDialog] = useState(false);

  const { register: registerDeposit, handleSubmit: handleDepositSubmit, reset: resetDeposit } = useForm();
  const { register: registerWithdraw, handleSubmit: handleWithdrawSubmit, reset: resetWithdraw } = useForm();

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [walletData, transactionsData] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions({ limit: 10 }),
      ]);

      // Convert balance to number (API returns string)
      const balanceNumber = typeof walletData.balance === 'number'
        ? walletData.balance
        : parseFloat(String(walletData.balance)) || 0;

      setBalance(balanceNumber);
      setTransactions(transactionsData.transactions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wallet data');
      setTransactions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleDeposit = async (data: any) => {
    try {
      const response = await walletApi.deposit({
        amount: parseFloat(data.amount),
        paymentMethod: data.paymentMethod || 'VNPAY',
        description: data.description,
      });
      
      // If payment URL is returned, open it in new tab
      if (response.paymentUrl) {
        toast.success('Redirecting to payment gateway...');
        window.open(response.paymentUrl, '_blank');
      } else {
        toast.success('Deposit initiated successfully');
      }
      
      setDepositDialog(false);
      resetDeposit();
      fetchWalletData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    }
  };

  const handleWithdraw = async (data: any) => {
    try {
      await walletApi.withdraw({
        amount: parseFloat(data.amount),
        bankAccount: data.bankAccount,
        description: data.description,
      });
      toast.success('Withdrawal initiated successfully');
      setWithdrawDialog(false);
      resetWithdraw();
      fetchWalletData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Wallet
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Balance Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            Available Balance
          </Typography>
          <Typography variant="h3" component="div" sx={{ mb: 2, fontWeight: 600 }}>
            ${balance.toFixed(2)}
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDepositDialog(true)}
            >
              Deposit
            </Button>
            <Button
              variant="outlined"
              startIcon={<Remove />}
              onClick={() => setWithdrawDialog(true)}
            >
              Withdraw
            </Button>
            <Button variant="outlined" startIcon={<Send />}>
              Transfer
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Recent Transactions
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!transactions || transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>{tx.description || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={['DEPOSIT', 'REFUND'].includes(tx.type) ? 'success.main' : 'error.main'}
                        >
                          {['DEPOSIT', 'REFUND'].includes(tx.type) ? '+' : '-'}${tx.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.status} color={statusColors[tx.status]} size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={depositDialog} onClose={() => setDepositDialog(false)}>
        <DialogTitle>Deposit Funds</DialogTitle>
        <form onSubmit={handleDepositSubmit(handleDeposit)}>
          <DialogContent>
            <TextField
              {...registerDeposit('amount', { required: true })}
              autoFocus
              margin="dense"
              label="Amount"
              type="number"
              fullWidth
              required
            />
            <TextField
              {...registerDeposit('paymentMethod')}
              margin="dense"
              label="Payment Method"
              fullWidth
              select
              defaultValue="VNPAY"
            >
              <option value="VNPAY">VNPay (Sandbox - May have issues)</option>
              <option value="TEST">Test Gateway (Recommended for demo)</option>
              <option value="MOMO">Momo</option>
            </TextField>
            <TextField
              {...registerDeposit('description')}
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDepositDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Deposit</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)}>
        <DialogTitle>Withdraw Funds</DialogTitle>
        <form onSubmit={handleWithdrawSubmit(handleWithdraw)}>
          <DialogContent>
            <TextField
              {...registerWithdraw('amount', { required: true })}
              autoFocus
              margin="dense"
              label="Amount"
              type="number"
              fullWidth
              required
            />
            <TextField
              {...registerWithdraw('bankAccount', { required: true })}
              margin="dense"
              label="Bank Account"
              fullWidth
              required
            />
            <TextField
              {...registerWithdraw('description')}
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWithdrawDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Withdraw</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default WalletPage;
