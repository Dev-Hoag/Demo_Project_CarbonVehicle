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
import { Search, Add, FilterList } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { mockListingApi, type Listing } from '../api/mock';
import { statusColors } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const ListingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [filter, setFilter] = useState({ status: 'ALL', search: '' });

  const { register, handleSubmit, reset } = useForm();

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await mockListingApi.getAll({ limit: 50 });
      setListings(response.data);
      setFilteredListings(response.data);
    } catch (err) {
      toast.error('Failed to load listings');
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
        l.sellerName.toLowerCase().includes(filter.search.toLowerCase()) ||
        l.description.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    setFilteredListings(filtered);
  }, [filter, listings]);

  const handleCreateListing = async (data: any) => {
    try {
      await mockListingApi.create({
        sellerId: user?.id || 1,
        sellerName: user?.fullName || 'Unknown',
        creditId: Math.floor(Math.random() * 100),
        creditAmount: parseFloat(data.creditAmount),
        pricePerCredit: parseFloat(data.pricePerCredit),
        totalPrice: parseFloat(data.creditAmount) * parseFloat(data.pricePerCredit),
        description: data.description,
      });
      toast.success('Listing created successfully');
      setCreateDialog(false);
      reset();
      fetchListings();
    } catch (err) {
      toast.error('Failed to create listing');
    }
  };

  const handleBuyListing = async (listing: Listing) => {
    try {
      // In real app, this would call transaction API
      toast.success(`Purchased ${listing.creditAmount} credits for $${listing.totalPrice.toFixed(2)}`);
      fetchListings();
    } catch (err) {
      toast.error('Purchase failed');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Carbon Credit Listings
        </Typography>
        {user?.userType === 'EV_OWNER' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
            Create Listing
          </Button>
        )}
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
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {listing.creditAmount} Credits
                    </Typography>
                    <Chip label={listing.status} color={statusColors[listing.status]} size="small" />
                  </Box>

                  <Typography color="text.secondary" gutterBottom>
                    Seller: {listing.sellerName}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {listing.description}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Price per Credit
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${listing.pricePerCredit.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2" color="text.secondary">
                        Total Price
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        ${listing.totalPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Listed on: {new Date(listing.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>

                {listing.status === 'ACTIVE' && user?.userType === 'BUYER' && (
                  <Box p={2} pt={0}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleBuyListing(listing)}
                    >
                      Buy Now
                    </Button>
                  </Box>
                )}
              </Card>
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
              {...register('creditAmount', { required: true })}
              margin="normal"
              label="Credit Amount"
              type="number"
              fullWidth
              required
            />
            <TextField
              {...register('pricePerCredit', { required: true })}
              margin="normal"
              label="Price per Credit ($)"
              type="number"
              fullWidth
              required
            />
            <TextField
              {...register('description', { required: true })}
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
    </Box>
  );
};

export default ListingsPage;
