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
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import { Add, Remove, Send, Receipt } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { walletApi, type WalletTransaction } from '../api/wallet';
import { statusColors } from '../types';
import toast from 'react-hot-toast';
import { ConfirmPasswordDialog } from '../components/ConfirmPasswordDialog';

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export const WalletPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [lockedBalance, setLockedBalance] = useState<number>(0);
  const [totalDeposited, setTotalDeposited] = useState<number>(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [depositDialog, setDepositDialog] = useState(false);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'withdraw' | 'transfer' | null>(null);
  const [pendingData, setPendingData] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);

  const { register: registerDeposit, handleSubmit: handleDepositSubmit, reset: resetDeposit } = useForm();
  const { register: registerWithdraw, handleSubmit: handleWithdrawSubmit } = useForm();
  const { register: registerTransfer, handleSubmit: handleTransferSubmit } = useForm();

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, transactionsData, limitsData, withdrawalsData] = await Promise.all([
        walletApi.getSummary(),
        walletApi.getTransactions({ limit: 10 }),
        walletApi.getWithdrawalLimits(),
        walletApi.getWithdrawals(),
      ]);

      const balanceNumber = typeof summaryData.wallet.balance === 'number'
        ? summaryData.wallet.balance
        : parseFloat(String(summaryData.wallet.balance)) || 0;

      setBalance(balanceNumber);
      setLockedBalance(summaryData.summary.lockedBalance || 0);
      setTotalDeposited(summaryData.summary.totalDeposited || 0);
      setTotalWithdrawn(summaryData.summary.totalWithdrawn || 0);
      setLimits(limitsData);
      setTransactions(transactionsData.data || []);
      setWithdrawals(withdrawalsData || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wallet data');
      setTransactions([]);
      setWithdrawals([]);
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
      const cleanAmount = data.amount.toString().replace(/[\s,]/g, '');
      const amount = parseFloat(cleanAmount);

      if (isNaN(amount) || amount <= 0) {
        toast.error('Invalid amount');
        return;
      }

      if (limits && amount < limits.minWithdrawal) {
        toast.error(`Minimum withdrawal is ${limits.minWithdrawal.toLocaleString('vi-VN')} VND`);
        return;
      }

      if (limits && amount > limits.maxWithdrawal) {
        toast.error(`Maximum withdrawal is ${limits.maxWithdrawal.toLocaleString('vi-VN')} VND`);
        return;
      }

      if (amount > balance) {
        toast.error('Insufficient balance');
        return;
      }

      const fee = amount * 0.005;
      const netAmount = amount - fee;
      
      setPendingData({
        ...data,
        amount,
        fee,
        netAmount,
      });
      setConfirmAction('withdraw');
      setWithdrawDialog(false);
      setConfirmDialog(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Withdrawal failed';
      toast.error(errorMsg);
      console.error('Withdrawal error:', err.response?.data);
    }
  };

  const handleTransfer = async (data: any) => {
    try {
      const amount = parseFloat(data.amount);
      const toUserId = parseInt(data.toUserId);

      if (isNaN(amount) || amount <= 0) {
        toast.error('Invalid amount');
        return;
      }

      if (isNaN(toUserId) || toUserId <= 0) {
        toast.error('Invalid recipient user ID');
        return;
      }

      if (amount > balance) {
        toast.error('Insufficient balance');
        return;
      }

      setPendingData({
        toUserId,
        amount,
        description: data.description,
      });
      setConfirmAction('transfer');
      setTransferDialog(false);
      setConfirmDialog(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Transfer failed';
      toast.error(errorMsg);
      console.error('Transfer error:', err.response?.data);
    }
  };

  const handleConfirmAction = async (password: string) => {
    try {
      if (confirmAction === 'withdraw') {
        const { description, ...rest } = pendingData;
        const withdrawData = {
          ...rest,
          notes: description,
          password
        };
        await walletApi.withdraw(withdrawData);
        toast.success('Withdrawal request submitted successfully');
        fetchWalletData();
      } else if (confirmAction === 'transfer') {
        const transferData = { ...pendingData, password };
        await walletApi.transfer(transferData);
        toast.success('Transfer completed successfully');
        fetchWalletData();
      }
      
      setConfirmDialog(false);
      setPendingData(null);
      setConfirmAction(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Action failed';
      toast.error(errorMsg);
      console.error('Confirmation error:', err.response?.data);
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
      {/* Header giống ListingsPage */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Wallet
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dùng Grid container giống Listings */}
      <Grid container spacing={3} sx={{ width: '100%' }}>
        {/* Balance Card */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ width: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Available Balance
              </Typography>
              <Typography variant="h3" component="div" sx={{ mb: 2, fontWeight: 600 }}>
                {balance.toLocaleString('vi-VN')} VND
              </Typography>
              
              <Box display="flex" gap={3} mb={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Locked Balance
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {lockedBalance.toLocaleString('vi-VN')} VND
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Deposited
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    +{totalDeposited.toLocaleString('vi-VN')} VND
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Withdrawn
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="error.main">
                    -{totalWithdrawn.toLocaleString('vi-VN')} VND
                  </Typography>
                </Box>
              </Box>

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
                <Button 
                  variant="outlined" 
                  startIcon={<Send />}
                  onClick={() => setTransferDialog(true)}
                >
                  Transfer
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Transactions / Withdrawals Card */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ width: '100%' }}>
            <CardContent>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Transaction History" />
                <Tab label="Withdrawal Requests" icon={<Receipt />} iconPosition="start" />
              </Tabs>

              {activeTab === 0 && (
                <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
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
                        transactions.map((tx) => {
                          const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount)) || 0;
                          return (
                            <TableRow key={tx.id}>
                              <TableCell>{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={tx.type} 
                                  size="small"
                                  color={
                                    tx.type === 'DEPOSIT'
                                      ? 'success'
                                      : tx.type === 'WITHDRAWAL'
                                      ? 'warning'
                                      : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>{tx.description || '-'}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  fontWeight={600}
                                  color={['DEPOSIT', 'REFUND'].includes(tx.type) ? 'success.main' : 'error.main'}
                                >
                                  {['DEPOSIT', 'REFUND'].includes(tx.type) ? '+' : '-'}
                                  {amount.toLocaleString('vi-VN')} VND
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={tx.status} color={statusColors[tx.status]} size="small" />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 1 && (
                <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Bank Info</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Fee</TableCell>
                        <TableCell align="right">Net Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Note</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {withdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No withdrawal requests yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals.map((withdrawal) => {
                          const withdrawalStatusColors: Record<string, any> = {
                            PENDING: 'warning',
                            APPROVED: 'success',
                            REJECTED: 'error',
                          };

                          return (
                            <TableRow key={withdrawal.id}>
                              <TableCell>
                                {new Date(withdrawal.createdAt).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {withdrawal.bankName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {withdrawal.bankAccountNumber} - {withdrawal.bankAccountName}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {parseFloat(String(withdrawal.amount)).toLocaleString('vi-VN')} VND
                              </TableCell>
                              <TableCell align="right">
                                {parseFloat(String(withdrawal.fee)).toLocaleString('vi-VN')} VND
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontWeight="medium" color="error.main">
                                  {parseFloat(String(withdrawal.netAmount)).toLocaleString('vi-VN')} VND
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={withdrawal.status} 
                                  color={withdrawalStatusColors[withdrawal.status] || 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {withdrawal.status === 'REJECTED' && withdrawal.rejectionReason ? (
                                  <Typography variant="caption" color="error">
                                    {withdrawal.rejectionReason}
                                  </Typography>
                                ) : withdrawal.status === 'APPROVED' && withdrawal.approvedAt ? (
                                  <Typography variant="caption" color="success.main">
                                    Approved: {new Date(withdrawal.approvedAt).toLocaleDateString('vi-VN')}
                                  </Typography>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              label="Amount (VND)"
              type="number"
              fullWidth
              required
              helperText={limits ? `Min: ${limits.minWithdrawal.toLocaleString('vi-VN')} VND, Max: ${limits.maxWithdrawal.toLocaleString('vi-VN')} VND` : ''}
            />
            <TextField
              {...registerWithdraw('bankAccountName', { required: true })}
              margin="dense"
              label="Account Holder Name"
              placeholder="NGUYEN VAN A"
              fullWidth
              required
            />
            <TextField
              {...registerWithdraw('bankAccountNumber', { required: true })}
              margin="dense"
              label="Account Number"
              placeholder="0123456789"
              fullWidth
              required
            />
            <TextField
              {...registerWithdraw('bankName', { required: true })}
              margin="dense"
              label="Bank Name"
              placeholder="Vietcombank, Techcombank, ACB..."
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

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onClose={() => setTransferDialog(false)}>
        <DialogTitle>Transfer Funds</DialogTitle>
        <form onSubmit={handleTransferSubmit(handleTransfer)}>
          <DialogContent>
            <TextField
              {...registerTransfer('toUserId', { required: true })}
              autoFocus
              margin="dense"
              label="Recipient User ID"
              type="number"
              fullWidth
              required
              helperText="Enter the user ID of the recipient"
            />
            <TextField
              {...registerTransfer('amount', { required: true })}
              margin="dense"
              label="Amount (VND)"
              type="number"
              fullWidth
              required
              helperText={`Available balance: ${balance.toLocaleString('vi-VN')} VND`}
            />
            <TextField
              {...registerTransfer('description')}
              margin="dense"
              label="Description"
              placeholder="Transfer reason..."
              fullWidth
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTransferDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Transfer</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Password Confirmation Dialog */}
      <ConfirmPasswordDialog
        open={confirmDialog}
        onClose={() => {
          setConfirmDialog(false);
          setPendingData(null);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirmAction}
        title={confirmAction === 'withdraw' ? 'Confirm Withdrawal' : 'Confirm Transfer'}
        action={confirmAction || 'withdraw'}
        details={pendingData || {}}
      />
    </Box>
  );
};

export default WalletPage;
