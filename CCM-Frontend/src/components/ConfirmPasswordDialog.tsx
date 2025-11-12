import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Divider,
  Alert,
} from '@mui/material';
import { Lock, Warning } from '@mui/icons-material';

interface ConfirmPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title: string;
  action: 'withdraw' | 'transfer';
  details: {
    amount?: number;
    fee?: number;
    netAmount?: number;
    toUserId?: number;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
    description?: string;
  };
}

export const ConfirmPasswordDialog: React.FC<ConfirmPasswordDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  action,
  details,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) {
      return;
    }
    
    console.log('🔐 Password entered:', password);
    console.log('🔐 Password length:', password.length);
    console.log('🔐 Password trimmed:', password.trim());
    
    setLoading(true);
    try {
      await onConfirm(password);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '0';
    return amount.toLocaleString('vi-VN');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Warning color="warning" />
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please confirm your password to proceed with this transaction.
        </Alert>

        {/* Transaction Details */}
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Transaction Details
          </Typography>
          <Divider sx={{ my: 1 }} />

          {action === 'withdraw' && (
            <>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Amount:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatAmount(details.amount)} VND
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Fee (0.5%):</Typography>
                <Typography variant="body2" color="error.main">
                  -{formatAmount(details.fee)} VND
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" fontWeight={600}>
                  Net Amount:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {formatAmount(details.netAmount)} VND
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Bank:</Typography>
                <Typography variant="body2">{details.bankName}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Account:</Typography>
                <Typography variant="body2">{details.bankAccountNumber}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Account Name:</Typography>
                <Typography variant="body2">{details.bankAccountName}</Typography>
              </Box>
            </>
          )}

          {action === 'transfer' && (
            <>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Amount:</Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  -{formatAmount(details.amount)} VND
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">To User ID:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  #{details.toUserId}
                </Typography>
              </Box>
              {details.description && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Description:</Typography>
                  <Typography variant="body2">{details.description}</Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Password Input */}
        <TextField
          autoFocus
          fullWidth
          type="password"
          label="Confirm Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && password.trim()) {
              handleConfirm();
            }
          }}
          InputProps={{
            startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          helperText="Enter your account password to confirm this transaction"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!password.trim() || loading}
        >
          {loading ? 'Processing...' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
