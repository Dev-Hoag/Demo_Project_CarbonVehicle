import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Gavel, CheckCircle, Cancel, TrendingUp } from '@mui/icons-material';
import { auctionApi } from '../api/listing';
import toast from 'react-hot-toast';

interface Bid {
  id: string;
  listingId: string;
  listingTitle?: string;
  bidAmount: number;
  status: 'ACTIVE' | 'OUTBID' | 'WON' | 'LOST';
  isWinning: boolean;
  createdAt: string;
  co2Amount?: number;
  auctionEndTime?: string;
}

type TabValue = 'all' | 'active' | 'won' | 'lost' | 'outbid';

export const MyBidsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentTab, setCurrentTab] = useState<TabValue>('all');

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      const response = await auctionApi.getMyBids();
      setBids(response.data);
      toast.success('Loaded your bids');
    } catch (err: any) {
      console.error('Failed to fetch bids:', err);
      toast.error('Failed to load your bids');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBids = (): Bid[] => {
    switch (currentTab) {
      case 'active':
        return bids.filter(b => b.status === 'ACTIVE' && b.isWinning);
      case 'won':
        return bids.filter(b => b.status === 'WON');
      case 'lost':
        return bids.filter(b => b.status === 'LOST');
      case 'outbid':
        return bids.filter(b => b.status === 'OUTBID');
      default:
        return bids;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'WON':
        return 'success';
      case 'ACTIVE':
        return 'warning';
      case 'OUTBID':
      case 'LOST':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WON':
        return <CheckCircle fontSize="small" />;
      case 'ACTIVE':
        return <TrendingUp fontSize="small" />;
      case 'OUTBID':
      case 'LOST':
        return <Cancel fontSize="small" />;
      default:
        return <Gavel fontSize="small" />;
    }
  };

  const calculateTimeRemaining = (endTime?: string): string => {
    if (!endTime) return 'N/A';
    
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredBids = getFilteredBids();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Gavel sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Bids
        </Typography>
      </Box>

      {bids.length === 0 ? (
        <Alert severity="info">
          You haven't placed any bids yet. Visit the marketplace to start bidding on auctions!
        </Alert>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Tabs 
                value={currentTab} 
                onChange={(_, value) => setCurrentTab(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab 
                  label={`All (${bids.length})`} 
                  value="all" 
                />
                <Tab 
                  label={`Active (${bids.filter(b => b.status === 'ACTIVE' && b.isWinning).length})`} 
                  value="active" 
                />
                <Tab 
                  label={`Won (${bids.filter(b => b.status === 'WON').length})`} 
                  value="won" 
                />
                <Tab 
                  label={`Lost (${bids.filter(b => b.status === 'LOST').length})`} 
                  value="lost" 
                />
                <Tab 
                  label={`Outbid (${bids.filter(b => b.status === 'OUTBID').length})`} 
                  value="outbid" 
                />
              </Tabs>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Listing</TableCell>
                  <TableCell align="right">My Bid</TableCell>
                  <TableCell align="right">CO₂ Amount</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Time Left</TableCell>
                  <TableCell align="right">Bid Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBids.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No bids in this category</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBids.map((bid) => (
                    <TableRow key={bid.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {bid.listingTitle || `Listing ${bid.listingId.substring(0, 8)}...`}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color="primary">
                          {bid.bidAmount.toLocaleString()} VND/kg
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {bid.co2Amount ? `${bid.co2Amount} kg` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getStatusIcon(bid.status)}
                          label={bid.status}
                          color={getStatusColor(bid.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {bid.isWinning && bid.status === 'ACTIVE' && (
                          <Chip
                            label="Winning"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, fontWeight: 600 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          color={bid.auctionEndTime && new Date(bid.auctionEndTime) > new Date() ? 'warning.main' : 'text.secondary'}
                          fontWeight={600}
                        >
                          {calculateTimeRemaining(bid.auctionEndTime)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="text.secondary">
                          {new Date(bid.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {bid.status === 'WON' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          >
                            Pay Now
                          </Button>
                        )}
                        {bid.status === 'OUTBID' && bid.auctionEndTime && new Date(bid.auctionEndTime) > new Date() && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          >
                            Bid Again
                          </Button>
                        )}
                        {bid.status === 'ACTIVE' && (
                          <Button
                            variant="outlined"
                            size="small"
                            disabled
                            sx={{ fontWeight: 600 }}
                          >
                            Winning
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default MyBidsPage;
