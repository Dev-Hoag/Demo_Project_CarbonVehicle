import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import { Timer, Gavel } from '@mui/icons-material';
import type { Listing } from '../api/listing';

interface AuctionCardProps {
  listing: Listing;
  currentBid: number | null;
  bidCount: number;
  onPlaceBid: (listing: Listing) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({
  listing,
  currentBid,
  bidCount,
  onPlaceBid,
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!listing.auctionEndTime) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(listing.auctionEndTime!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Ended');
        setIsExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [listing.auctionEndTime]);

  const displayBid = currentBid || listing.startingBid || listing.pricePerKg;

  return (
    <Card
      sx={{
        border: '2px solid #ff9800',
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Chip
            icon={<Gavel />}
            label="AUCTION"
            color="warning"
            size="small"
            sx={{ fontWeight: 600 }}
          />
          {!isExpired && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Timer fontSize="small" color="error" />
              <Typography variant="caption" color="error" fontWeight={600}>
                {timeRemaining}
              </Typography>
            </Box>
          )}
          {isExpired && (
            <Chip label="ENDED" color="default" size="small" />
          )}
        </Box>

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {listing.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
          {listing.description}
        </Typography>

        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              CO₂ Amount:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {listing.co2Amount} kg
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {currentBid ? 'Current Bid:' : 'Starting Bid:'}
            </Typography>
            <Typography variant="h6" color="primary" fontWeight={700}>
              {displayBid.toLocaleString('vi-VN')} VND/kg
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total: {(displayBid * listing.co2Amount).toLocaleString('vi-VN')} VND
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => onPlaceBid(listing)}
          disabled={isExpired || listing.status !== 'ACTIVE'}
          startIcon={<Gavel />}
        >
          {isExpired ? 'Auction Ended' : 'Place Bid'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuctionCard;
