import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Gavel } from '@mui/icons-material';
import type { Listing } from '../api/listing';
import { auctionApi } from '../api/listing';
import toast from 'react-hot-toast';

interface BidDialogProps {
  open: boolean;
  onClose: () => void;
  listing: Listing | null;
  currentBid: number | null;
  onBidPlaced: () => void;
}

export const BidDialog: React.FC<BidDialogProps> = ({
  open,
  onClose,
  listing,
  currentBid,
  onBidPlaced,
}) => {
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const minimumBid = currentBid
    ? currentBid + 100
    : listing?.startingBid || listing?.pricePerKg || 0;

  useEffect(() => {
    if (open && minimumBid) {
      setBidAmount(minimumBid);
    }
  }, [open, minimumBid]);

  const handlePlaceBid = async () => {
    if (!listing) return;

    if (bidAmount < minimumBid) {
      toast.error(`Minimum bid is ${minimumBid.toLocaleString('vi-VN')} VND`);
      return;
    }

    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('Please login to place a bid');
        return;
      }

      await auctionApi.placeBid(listing.id, bidAmount, userId);
      toast.success('Bid placed successfully! You are currently the highest bidder.');
      onBidPlaced();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to place bid';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!listing) return null;

  const totalAmount = bidAmount * listing.co2Amount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Gavel color="warning" />
          <Typography variant="h6" fontWeight={600}>
            Place Your Bid
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          {listing.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {listing.description}
        </Typography>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            CO₂ Amount: <strong>{listing.co2Amount} kg</strong>
          </Typography>
          
          {currentBid ? (
            <Typography variant="body2" color="text.secondary">
              Current highest bid:{' '}
              <strong style={{ color: '#ff9800' }}>
                {currentBid.toLocaleString('vi-VN')} VND/kg
              </strong>
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Starting bid:{' '}
              <strong style={{ color: '#1976d2' }}>
                {listing.startingBid?.toLocaleString('vi-VN')} VND/kg
              </strong>
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Minimum bid:{' '}
            <strong style={{ color: '#d32f2f' }}>
              {minimumBid.toLocaleString('vi-VN')} VND/kg
            </strong>
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Minimum bid increment is 100 VND per kg
        </Alert>

        <TextField
          fullWidth
          label="Your Bid (VND/kg)"
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          inputProps={{
            min: minimumBid,
            step: 100,
          }}
          helperText={`Minimum: ${minimumBid.toLocaleString('vi-VN')} VND`}
        />

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'primary.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'primary.200',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total Amount
          </Typography>
          <Typography variant="h5" color="primary" fontWeight={700}>
            {totalAmount.toLocaleString('vi-VN')} VND
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({bidAmount.toLocaleString('vi-VN')} VND/kg × {listing.co2Amount} kg)
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePlaceBid}
          disabled={loading || bidAmount < minimumBid}
          startIcon={loading ? <CircularProgress size={20} /> : <Gavel />}
        >
          {loading ? 'Placing Bid...' : 'Place Bid'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BidDialog;
