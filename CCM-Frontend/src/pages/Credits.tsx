import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
  Refresh,
  SwapHoriz,
  Add,
} from '@mui/icons-material';
import { creditApi, creditTransactionApi, type CreditAccount, type CreditTransaction } from '../api/credit';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const transactionTypeColors = {
  EARNED_FROM_TRIP: 'success',
  PURCHASED_FROM_MARKETPLACE: 'success',
  SOLD_TO_MARKETPLACE: 'warning',
  TRANSFERRED_IN: 'info',
  TRANSFERRED_OUT: 'warning',
  ADJUSTMENT: 'default',
} as const;

const transactionTypeIcons = {
  EARNED_FROM_TRIP: <TrendingUp />,
  PURCHASED_FROM_MARKETPLACE: <Add />,
  SOLD_TO_MARKETPLACE: <TrendingDown />,
  TRANSFERRED_IN: <SwapHoriz />,
  TRANSFERRED_OUT: <SwapHoriz />,
  ADJUSTMENT: <Refresh />,
};

export const CreditsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [recipientId, setRecipientId] = useState<string>('');
  const [transferring, setTransferring] = useState(false);

  const userId = user?.id?.toString() || '0';
  const userUUID = `00000000-0000-0000-0000-${userId.padStart(12, '0')}`;

  useEffect(() => {
    fetchCreditAccount();
    fetchTransactions();
  }, []);

  const fetchCreditAccount = async () => {
    try {
      setLoading(true);
      const response = await creditApi.getByUserId(userUUID);
      setAccount(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch credit account:', err);
      
      // If account doesn't exist, try to create it
      if (err.response?.status === 404) {
        try {
          await creditApi.create(userUUID);
          const response = await creditApi.getByUserId(userUUID);
          setAccount(response.data.data);
          toast.success('Credit account created successfully!');
        } catch (createErr: any) {
          toast.error('Failed to create credit account: ' + (createErr.response?.data?.message || createErr.message));
        }
      } else {
        toast.error('Failed to load credit account: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await creditTransactionApi.getByUserId(userUUID, {
        page: 0,
        size: 50,
      });
      const data = response.data.data?.content || response.data.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || transferAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!recipientId) {
      toast.error('Please enter recipient user ID');
      return;
    }

    const recipientUUID = `00000000-0000-0000-0000-${recipientId.padStart(12, '0')}`;

    try {
      setTransferring(true);
      await creditApi.transfer({
        fromUserId: userUUID,
        toUserId: recipientUUID,
        amount: transferAmount,
        description: `Transfer from user ${userId} to user ${recipientId}`,
      });
      
      toast.success('Credits transferred successfully!');
      setTransferDialog(false);
      setTransferAmount(0);
      setRecipientId('');
      fetchCreditAccount();
      fetchTransactions();
    } catch (err: any) {
      toast.error('Transfer failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!account) {
    return (
      <Box>
        <Alert severity="warning">
          Credit account not found. Please contact support.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Carbon Credits Wallet
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage your carbon credits earned from EV trips
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchCreditAccount();
              fetchTransactions();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SwapHoriz />}
            onClick={() => setTransferDialog(true)}
          >
            Transfer Credits
          </Button>
        </Box>
      </Box>

      {/* Balance Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                    Current Balance
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 600, mt: 1, color: 'white' }}>
                    {account.balance.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
                    kg CO₂ credits
                  </Typography>
                </Box>
                <AccountBalanceWallet sx={{ fontSize: 60, color: 'white', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Earned from Trips
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: 'success.main' }}>
                    {account.totalEarned.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kg CO₂
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 50, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Purchased from Market
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: 'info.main' }}>
                    {account.totalTransferredIn.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kg CO₂
                  </Typography>
                </Box>
                <Add sx={{ fontSize: 50, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Sold on Market
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: 'warning.main' }}>
                    {account.totalTransferredOut.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kg CO₂
                  </Typography>
                </Box>
                <TrendingDown sx={{ fontSize: 50, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>How credits work:</strong> Earn credits from verified EV trips → List credits for sale → 
        Buyers purchase your credits → Money transferred to your wallet. You can also transfer credits to other users.
      </Alert>

      {/* Transaction History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Balance Before</TableCell>
                  <TableCell align="right">Balance After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" py={3}>
                        No transactions yet. Complete verified trips to earn credits!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={transactionTypeIcons[transaction.transactionType]}
                          label={transaction.transactionType.replace('_', ' ')}
                          color={transactionTypeColors[transaction.transactionType]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.description || transaction.source}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          fontWeight="bold"
                          color={
                            ['EARNED_FROM_TRIP', 'PURCHASED_FROM_MARKETPLACE', 'TRANSFERRED_IN'].includes(transaction.transactionType)
                              ? 'success.main'
                              : 'error.main'
                          }
                        >
                          {['EARNED_FROM_TRIP', 'PURCHASED_FROM_MARKETPLACE', 'TRANSFERRED_IN'].includes(transaction.transactionType) ? '+' : '-'}
                          {transaction.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {transaction.balanceBefore.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {transaction.balanceAfter.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Transfer Credits</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Transfer your carbon credits to another user account
          </Alert>

          <TextField
            fullWidth
            label="Recipient User ID"
            type="number"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Enter recipient user ID"
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            fullWidth
            label="Amount (kg CO₂)"
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
            inputProps={{ step: '0.01', min: '0.01', max: account.balance }}
            helperText={`Available: ${account.balance.toFixed(2)} kg CO₂`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialog(false)} disabled={transferring}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTransfer}
            disabled={transferring || !transferAmount || !recipientId}
          >
            {transferring ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditsPage;
