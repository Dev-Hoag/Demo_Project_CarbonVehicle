import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Search, Add, FilterList, Person } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { listingApi, auctionApi, type Listing } from '../api/listing';
import { AuctionCard } from '../components/AuctionCard';
import { BidDialog } from '../components/BidDialog';
import { walletApi } from '../api/wallet';
import { statusColors } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const ListingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [bidDialog, setBidDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0);
  const [filter, setFilter] = useState({ status: 'ALL', search: '' });
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [auctionData, setAuctionData] = useState<Record<string, { currentBid: number | null; bidCount: number }>>({});

  const { register, handleSubmit, reset } = useForm();

  // Helper function to check if listing belongs to current user
  const isOwnListing = (listing: Listing): boolean => {
    if (!user?.id) return false;
    const userId = user.id.toString();
    const expectedSellerId = `00000000-0000-0000-0000-${userId.padStart(12, '0')}`;
    return listing.sellerId === expectedSellerId;
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await listingApi.getAll({ page: 0, size: 50, sort: 'createdAt,desc' });
      const data = response.data.data.content;
      setListings(data);
      setFilteredListings(data);
      
      // Fetch auction data for auction listings
      const auctionListings = data.filter((l: Listing) => l.listingType === 'AUCTION');
      const auctionDataMap: Record<string, { currentBid: number | null; bidCount: number }> = {};
      
      await Promise.all(
        auctionListings.map(async (listing: Listing) => {
          try {
            const [bidCountRes, currentBidRes] = await Promise.all([
              auctionApi.getBidCount(listing.id),
              auctionApi.getCurrentBid(listing.id).catch((err) => {
                // 404 is expected when no bids exist yet - suppress error
                if (err.response?.status === 404) return null;
                throw err;
              }),
            ]);
            auctionDataMap[listing.id] = {
              currentBid: currentBidRes?.data?.bidAmount || null,
              bidCount: bidCountRes?.data || 0,
            };
          } catch (err) {
            auctionDataMap[listing.id] = { currentBid: null, bidCount: 0 };
          }
        })
      );
      
      setAuctionData(auctionDataMap);
    } catch (err: any) {
      console.error('Failed to fetch listings:', err);
      console.error('Error response:', err.response);
      toast.error('Failed to load listings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    let filtered = [...listings];

    if (filter.status !== 'ALL') {
      filtered = filtered.filter(l => l.status === filter.status);
    }

    if (filter.search) {
      filtered = filtered.filter(l =>
        l.title.toLowerCase().includes(filter.search.toLowerCase()) ||
        l.description.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    setFilteredListings(filtered);
  }, [filter, listings]);

  const handleCreateListing = async (data: any) => {
    try {
      // Convert numeric user ID to UUID format (deterministic)
      // Format: 00000000-0000-0000-0000-{userId padded to 12 digits}
      const userId = user?.id?.toString() || '0';
      const sellerId = `00000000-0000-0000-0000-${userId.padStart(12, '0')}`;
      
      const listingData: any = {
        title: data.title || `Carbon Credit Listing - ${new Date().toLocaleDateString()}`,
        description: data.description || '',
        co2Amount: parseFloat(data.co2Amount),
        sellerId,
        listingType: data.listingType || 'FIXED_PRICE',
      };

      // Add fields based on listing type
      if (data.listingType === 'AUCTION') {
        listingData.startingBid = parseFloat(data.startingBid);
        listingData.reservePrice = parseFloat(data.reservePrice || data.startingBid);
        listingData.durationHours = parseInt(data.durationHours || '24');
      } else {
        listingData.pricePerKg = parseFloat(data.pricePerKg);
      }
      
      console.log('📤 Sending listing data:', JSON.stringify(listingData, null, 2));
      
      await listingApi.create(listingData);
      toast.success('Listing created successfully');
      setCreateDialog(false);
      reset();
      fetchListings();
    } catch (err: any) {
      console.error('❌ Create listing error:', err);
      console.error('❌ Response data:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error('Failed to create listing: ' + errorMsg);
    }
  };

  const handleViewDetail = async (listing: Listing) => {
    setSelectedListing(listing);
    setPurchaseAmount(listing.co2Amount);
    setLoadingWallet(true);
    setWalletBalance(0); // Reset to 0 first
    
    // Show dialog immediately with loading state
    setDetailDialog(true);
    
    // Fetch wallet balance in background
    try {
      const summaryData = await walletApi.getSummary();
      console.log('Full wallet summary response:', summaryData);
      console.log('Wallet object:', summaryData.wallet);
      console.log('Balance value:', summaryData.wallet.balance);
      const balanceNumber = parseFloat(String(summaryData.wallet.balance)) || 0;
      console.log('Parsed balance number:', balanceNumber);
      setWalletBalance(balanceNumber);
      console.log('After setWalletBalance, state should be:', balanceNumber);
    } catch (err: any) {
      console.error('Failed to fetch wallet balance:', err);
      toast.error('Failed to load wallet balance');
      setWalletBalance(0);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedListing) return;

    const userId = user?.id?.toString() || '0';
    const buyerId = `00000000-0000-0000-0000-${userId.padStart(12, '0')}`;

    // Validate not buying own listing
    if (selectedListing.sellerId === buyerId) {
      toast.error('You cannot purchase your own listing!');
      return;
    }

    // Validate purchase amount
    if (!purchaseAmount || purchaseAmount <= 0) {
      toast.error('Please enter a valid purchase amount');
      return;
    }

    if (purchaseAmount > selectedListing.co2Amount) {
      toast.error(`Maximum available: ${selectedListing.co2Amount} kg`);
      return;
    }

    // Calculate total price
    const totalPrice = purchaseAmount * selectedListing.pricePerKg;

    // Check wallet balance
    if (totalPrice > walletBalance) {
      toast.error(`Insufficient balance! You need ${totalPrice.toLocaleString()} VND but only have ${walletBalance.toLocaleString()} VND`);
      return;
    }

    // Confirm purchase
    if (!confirm(`Confirm purchase of ${purchaseAmount} kg CO₂ credits for ${totalPrice.toLocaleString()} VND?`)) {
      return;
    }

    try {
      const purchaseData = {
        buyerId,
        amount: purchaseAmount,
      };
      console.log('📦 Sending purchase request:', purchaseData);
      console.log('🆔 Listing ID:', selectedListing.id);
      
      await listingApi.purchase(selectedListing.id, purchaseData);
      toast.success(`Purchase completed! ${purchaseAmount} kg CO₂ credits purchased for ${totalPrice.toLocaleString()} VND`);
      setPurchaseDialog(false);
      setDetailDialog(false);
      fetchListings();
    } catch (err: any) {
      console.error('❌ Purchase error:', err);
      console.error('📋 Error response:', err.response?.data);
      toast.error('Purchase failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePlaceBid = (listing: Listing) => {
    setSelectedListing(listing);
    setBidDialog(true);
  };
  
  const handleBidPlaced = () => {
    fetchListings();
    setBidDialog(false);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Carbon Credit Listings
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
          Create Listing
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Mock Data:</strong> These listings are simulated. Real listings will come from backend API.
      </Alert>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by seller or description..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterList />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="SOLD">Sold</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Found {filteredListings.length} listings
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      <Grid container spacing={3}>
        {filteredListings.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography align="center" color="text.secondary">
                  No listings found
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredListings.map((listing) => (
            <Grid key={listing.id} size={{ xs: 12, md: 6, lg: 4 }}>
              {(listing.listingType as string) === 'AUCTION' ? (
                <AuctionCard
                  listing={listing}
                  currentBid={auctionData[listing.id]?.currentBid || null}
                  bidCount={auctionData[listing.id]?.bidCount || 0}
                  onPlaceBid={handlePlaceBid}
                />
              ) : (
                <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  border: isOwnListing(listing) ? '2px solid #1976d2' : undefined,
                  position: 'relative',
                  overflow: 'hidden',
                  background: isOwnListing(listing) 
                    ? 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 60%, #bbdefb 100%)'
                    : undefined,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { 
                    transform: 'translateY(-8px)',
                    boxShadow: isOwnListing(listing) 
                      ? '0 12px 24px rgba(0,0,0,0.15)'
                      : '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => handleViewDetail(listing)}
              >
                {/* Your Listing Badge */}
                {isOwnListing(listing) && (
                  <Chip
                    icon={<Person />}
                    label="YOUR LISTING"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                      background: '#1976d2',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 32,
                      '& .MuiChip-icon': {
                        color: 'white',
                        fontSize: 18
                      },
                      boxShadow: '0 2px 8px rgba(25,118,210,0.4)'
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, pt: isOwnListing(listing) ? 5 : 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2.5}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32', mb: 0.5 }}>
                        {listing.co2Amount}
                        <Typography component="span" variant="h6" sx={{ ml: 0.5, color: 'text.secondary' }}>kg CO₂</Typography>
                      </Typography>
                      <Chip 
                        label={(listing.listingType as string) === 'AUCTION' ? 'AUCTION' : 'FIXED PRICE'} 
                        size="small" 
                        sx={{ 
                          background: (listing.listingType as string) === 'AUCTION' ? 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)' : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                    <Chip 
                      label={listing.status} 
                      color={statusColors[listing.status]} 
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    {listing.title}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2.5, color: 'text.secondary', lineHeight: 1.6 }}>
                    {listing.description}
                  </Typography>

                  <Box display="flex" gap={1.5} mb={2}>
                    <Box 
                      flex={1} 
                      sx={{ 
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        borderRadius: 2,
                        p: 1.5,
                        border: '1px solid #90caf9'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Price/kg
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1565c0' }}>
                        {listing.pricePerKg.toLocaleString()}
                        <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>₫</Typography>
                      </Typography>
                    </Box>
                    <Box 
                      flex={1} 
                      sx={{ 
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        borderRadius: 2,
                        p: 1.5,
                        border: '1px solid #81c784'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Total
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b5e20' }}>
                        {listing.totalPrice.toLocaleString()}
                        <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>₫</Typography>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.7 }}>
                    <Typography variant="caption" color="text.secondary">
                      📅 {new Date(listing.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Typography>
                  </Box>
                </CardContent>

                {listing.status === 'ACTIVE' && (
                  <Box p={2} pt={0}>
                    {isOwnListing(listing) ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        disabled
                        sx={{ 
                          cursor: 'not-allowed',
                          borderColor: '#1976d2',
                          color: '#1976d2',
                          fontWeight: 600,
                          py: 1.2,
                          borderRadius: 2
                        }}
                      >
                        🔒 Your Listing - Cannot Purchase
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          background: (listing.listingType as string) === 'AUCTION' 
                            ? 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)'
                            : 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          py: 1.2,
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(46,125,50,0.3)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 16px rgba(46,125,50,0.4)',
                            background: (listing.listingType as string) === 'AUCTION'
                              ? 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)'
                              : 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListing(listing);
                          setPurchaseAmount(listing.co2Amount);
                          if ((listing.listingType as string) === 'AUCTION') {
                            setBidDialog(true);
                          } else {
                            setPurchaseDialog(true);
                          }
                        }}
                      >
                        {(listing.listingType as string) === 'AUCTION' ? '🎯 Place Bid' : '🛒 Buy Now'}
                      </Button>
                    )}
                  </Box>
                )}
              </Card>
              )}
            </Grid>
          ))
        )}
      </Grid>

      {/* Create Listing Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Listing</DialogTitle>
        <form onSubmit={handleSubmit(handleCreateListing)}>
          <DialogContent>
            <TextField
              {...register('listingType')}
              select
              margin="normal"
              label="Listing Type"
              fullWidth
              defaultValue="FIXED_PRICE"
              helperText="Choose between auction or fixed price"
            >
              <MenuItem value="FIXED_PRICE">Fixed Price</MenuItem>
              <MenuItem value="AUCTION">Auction</MenuItem>
            </TextField>

            <TextField
              {...register('title', { 
                required: 'Title is required',
                minLength: { value: 10, message: 'Title must be at least 10 characters' },
                maxLength: { value: 200, message: 'Title cannot exceed 200 characters' }
              })}
              margin="normal"
              label="Listing Title"
              fullWidth
              placeholder="e.g., Carbon Credit from EV Trip"
              required
              helperText="At least 10 characters"
            />
            <TextField
              {...register('co2Amount', { 
                required: 'CO2 amount is required',
                min: { value: 0.1, message: 'Minimum 0.1 kg' },
                max: { value: 10000, message: 'Maximum 10000 kg' }
              })}
              margin="normal"
              label="CO2 Amount (kg)"
              type="number"
              inputProps={{ step: '0.01', min: '0.1', max: '10000' }}
              fullWidth
              required
            />
            
            {/* Fixed Price Fields */}
            <TextField
              {...register('pricePerKg', { 
                min: { value: 1000, message: 'Minimum 1000 VND' }
              })}
              margin="normal"
              label="Price per kg (VND) - For Fixed Price"
              type="number"
              inputProps={{ step: '1000', min: '1000' }}
              fullWidth
              helperText="Only required for Fixed Price listings"
            />

            {/* Auction Fields */}
            <TextField
              {...register('startingBid', { 
                min: { value: 1000, message: 'Minimum 1000 VND' }
              })}
              margin="normal"
              label="Starting Bid (VND/kg) - For Auction"
              type="number"
              inputProps={{ step: '100', min: '1000' }}
              fullWidth
              helperText="Only required for Auction listings"
            />

            <TextField
              {...register('reservePrice', { 
                min: { value: 1000, message: 'Minimum 1000 VND' }
              })}
              margin="normal"
              label="Reserve Price (VND/kg) - Optional"
              type="number"
              inputProps={{ step: '100', min: '1000' }}
              fullWidth
              helperText="Minimum price to sell (optional)"
            />

            <TextField
              {...register('durationHours')}
              margin="normal"
              label="Auction Duration (hours)"
              type="number"
              inputProps={{ step: '1', min: '1', max: '168' }}
              fullWidth
              defaultValue="24"
              helperText="How long the auction runs (1-168 hours)"
            />

            <TextField
              {...register('description', { 
                required: 'Description is required',
                maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' }
              })}
              margin="normal"
              label="Description"
              fullWidth
              multiline
              rows={3}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Listing Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedListing?.title}</Typography>
            <Chip 
              label={selectedListing?.status} 
              color={selectedListing ? statusColors[selectedListing.status] : 'default'} 
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">CO₂ Amount</Typography>
                      <Typography variant="h5">{selectedListing.co2Amount} kg</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Price per kg</Typography>
                      <Typography variant="h5" color="primary">
                        {selectedListing.pricePerKg ? selectedListing.pricePerKg.toFixed(2) : 'N/A'} VND
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Price</Typography>
                      <Typography variant="h4" color="success.main">
                        {selectedListing.totalPrice ? selectedListing.totalPrice.toFixed(2) : 'N/A'} VND
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>Description</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedListing.description}
                </Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Listed on: {new Date(selectedListing.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          {selectedListing?.status === 'ACTIVE' && (
            <>
              {selectedListing.listingType === 'AUCTION' ? (
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={() => {
                    setDetailDialog(false);
                    setBidDialog(true);
                  }}
                >
                  Place Bid
                </Button>
              ) : (
                <Button 
                  variant="contained"
                  onClick={() => {
                    setDetailDialog(false);
                    setPurchaseDialog(true);
                  }}
                >
                  Purchase Now
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog} onClose={() => setPurchaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Purchase Carbon Credits</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Listing: {selectedListing.title}
                </Typography>
              </Alert>

              <TextField
                label="Amount (kg CO₂)"
                type="number"
                fullWidth
                margin="normal"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                inputProps={{ 
                  step: '0.01', 
                  min: '0.01', 
                  max: selectedListing.co2Amount 
                }}
                helperText={`Available: ${selectedListing.co2Amount} kg | Price: ${selectedListing.pricePerKg ? selectedListing.pricePerKg.toLocaleString() : 'N/A'} VND/kg`}
              />

              <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Purchase Summary
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">Amount:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {purchaseAmount.toFixed(2)} kg CO₂
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">Price per kg:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {selectedListing.pricePerKg ? selectedListing.pricePerKg.toLocaleString() : 'N/A'} VND
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" borderTop="1px solid" borderColor="grey.300" pt={1} mb={1}>
                  <Typography variant="subtitle2">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">
                    {(purchaseAmount * selectedListing.pricePerKg).toLocaleString()} VND
                  </Typography>
                </Box>
                {loadingWallet ? (
                  <CircularProgress size={20} />
                ) : (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Your Wallet Balance:</Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={walletBalance >= (purchaseAmount * selectedListing.pricePerKg) ? 'success.main' : 'error.main'}
                    >
                      {walletBalance.toLocaleString()} VND
                    </Typography>
                  </Box>
                )}
              </Box>

              {walletBalance < (purchaseAmount * selectedListing.pricePerKg) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Insufficient balance! Please deposit money to your wallet first.
                </Alert>
              )}

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  By purchasing, you agree that the carbon credits will be transferred to your account 
                  and the payment will be deducted from your wallet.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handlePurchase}
            disabled={
              !purchaseAmount || 
              purchaseAmount <= 0 || 
              loadingWallet ||
              (selectedListing ? walletBalance < (purchaseAmount * selectedListing.pricePerKg) : false)
            }
          >
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bid Dialog */}
      <BidDialog
        open={bidDialog}
        onClose={() => setBidDialog(false)}
        listing={selectedListing}
        currentBid={selectedListing ? auctionData[selectedListing.id]?.currentBid || null : null}
        onBidPlaced={handleBidPlaced}
      />
    </Box>
  );
};

export default ListingsPage;
