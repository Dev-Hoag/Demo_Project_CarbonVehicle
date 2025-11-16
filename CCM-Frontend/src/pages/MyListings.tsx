import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
} from '@mui/material';
import {
  Refresh,
  Edit,
  Visibility,
  Cancel,
  AttachMoney,
  AddCircle,
} from '@mui/icons-material';
import { listingApi, bidApi, type Listing, type Bid } from '../api/listing';
import { creditApi } from '../api/credit';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const statusColors = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SOLD: 'info',
  CANCELLED: 'error',
} as const;

export const MyListingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [bidsDialog, setBidsDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [editData, setEditData] = useState({ pricePerKg: 0, description: '' });
  const [createData, setCreateData] = useState({
    amount: 0,
    pricePerKg: 0,
    title: '',
    description: '',
    expiresAt: '',
  });
  const [availableCredits, setAvailableCredits] = useState(0);
  const [creating, setCreating] = useState(false);

  const userId = user?.id?.toString() || '0';
  const userUUID = `00000000-0000-0000-0000-${userId.padStart(12, '0')}`;

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await listingApi.getAll({ page: 0, size: 100, sort: 'createdAt,desc' });
      const allListings = response.data.data.content;
      
      // Filter by seller ID
      const myListings = allListings.filter((listing: Listing) => listing.sellerId === userUUID);
      setListings(myListings);
    } catch (err: any) {
      console.error('Failed to fetch listings:', err);
      toast.error('Failed to load listings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewBids = async (listing: Listing) => {
    try {
      setSelectedListing(listing);
      setBidsDialog(true);
      const response = await bidApi.getByListing(listing.id);
      setBids(response.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load bids: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (listing: Listing) => {
    setSelectedListing(listing);
    setEditData({
      pricePerKg: listing.pricePerKg,
      description: listing.description,
    });
    setEditDialog(true);
  };

  const handleUpdateListing = async () => {
    if (!selectedListing) return;

    try {
      await listingApi.update(selectedListing.id, {
        pricePerKg: editData.pricePerKg,
        description: editData.description,
        sellerId: userUUID,
      });
      
      toast.success('Listing updated successfully!');
      setEditDialog(false);
      fetchMyListings();
    } catch (err: any) {
      toast.error('Update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateListing = async () => {
    if (!createData.title || createData.amount <= 0 || createData.pricePerKg <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    if (createData.amount > availableCredits) {
      toast.error(`You only have ${availableCredits.toFixed(2)} kg CO₂ credits available`);
      return;
    }

    try {
      setCreating(true);

      await listingApi.create({
        sellerId: userUUID,
        title: createData.title,
        description: createData.description,
        co2Amount: createData.amount,
        pricePerKg: createData.pricePerKg,
        listingType: 'FIXED_PRICE',
      });

      toast.success('Listing created successfully!');
      setCreateDialog(false);
      setCreateData({
        amount: 0,
        pricePerKg: 0,
        title: '',
        description: '',
        expiresAt: '',
      });
      fetchMyListings();
    } catch (err: any) {
      toast.error('Failed to create listing: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to cancel this listing?')) return;

    try {
      await listingApi.update(listingId, {
        status: 'CANCELLED',
        sellerId: userUUID,
      });
      
      toast.success('Listing cancelled successfully!');
      fetchMyListings();
    } catch (err: any) {
      toast.error('Cancel failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const calculateRevenue = () => {
    return listings
      .filter(l => l.status === 'SOLD')
      .reduce((sum, l) => sum + l.totalPrice, 0);
  };

  const getStatusCounts = () => {
    return {
      active: listings.filter(l => l.status === 'ACTIVE').length,
      sold: listings.filter(l => l.status === 'SOLD').length,
      cancelled: listings.filter(l => l.status === 'CANCELLED').length,
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            My Listings
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage your carbon credit listings in the marketplace
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchMyListings}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddCircle />}
            onClick={async () => {
              setCreateDialog(true);
              // Fetch available credits
              try {
                const response = await creditApi.getByUserId(userUUID);
                setAvailableCredits(response.data.data.balance || 0);
              } catch (err) {
                toast.error('Failed to load credit balance');
              }
            }}
          >
            Create Listing
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Active Listings</Typography>
              <Typography variant="h3" color="success.main" sx={{ fontWeight: 600, mt: 1 }}>
                {statusCounts.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Sold</Typography>
              <Typography variant="h3" color="info.main" sx={{ fontWeight: 600, mt: 1 }}>
                {statusCounts.sold}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Cancelled</Typography>
              <Typography variant="h3" color="error.main" sx={{ fontWeight: 600, mt: 1 }}>
                {statusCounts.cancelled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: 'white' }}>
                {calculateRevenue().toLocaleString()} VND
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Listings Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All My Listings
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>CO₂ Amount</TableCell>
                  <TableCell>Price/kg</TableCell>
                  <TableCell>Total Price</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={3}>
                        No listings yet. List your verified trip credits to start selling!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  listings.map((listing) => (
                    <TableRow key={listing.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {listing.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {listing.description.substring(0, 50)}...
                        </Typography>
                      </TableCell>
                      <TableCell>{listing.co2Amount} kg</TableCell>
                      <TableCell>{listing.pricePerKg.toLocaleString()} VND</TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="primary">
                          {listing.totalPrice.toLocaleString()} VND
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={listing.listingType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={listing.status}
                          color={statusColors[listing.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          {listing.listingType === 'AUCTION' && listing.status === 'ACTIVE' && (
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewBids(listing)}
                              title="View Bids"
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          )}
                          {listing.status === 'ACTIVE' && (
                            <>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(listing)}
                                title="Edit"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleCancelListing(listing.id)}
                                title="Cancel Listing"
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Listing</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Editing: <strong>{selectedListing.title}</strong> ({selectedListing.co2Amount} kg CO₂)
              </Alert>

              <TextField
                fullWidth
                label="Price per kg (VND)"
                type="number"
                value={editData.pricePerKg}
                onChange={(e) => setEditData({ ...editData, pricePerKg: parseFloat(e.target.value) || 0 })}
                inputProps={{ step: '1000', min: '1000' }}
                sx={{ mb: 2, mt: 1 }}
              />

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                sx={{ mb: 2 }}
              />

              <Box p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="body2" gutterBottom>
                  New Total Price: <strong>{(selectedListing.co2Amount * editData.pricePerKg).toLocaleString()} VND</strong>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateListing}>
            Update Listing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bids Dialog */}
      <Dialog open={bidsDialog} onClose={() => setBidsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AttachMoney color="primary" />
            <Typography variant="h6">Bids for {selectedListing?.title}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {bids.length === 0 ? (
            <Alert severity="info">No bids yet for this listing.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bidder ID</TableCell>
                    <TableCell>Bid Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>{bid.bidderId.substring(0, 20)}...</TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="primary">
                          {bid.bidAmount.toLocaleString()} VND
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={bid.status} size="small" />
                      </TableCell>
                      <TableCell>
                        {new Date(bid.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBidsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Listing Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Listing</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            List your earned CO₂ credits for sale on the marketplace
          </Alert>

          <TextField
            fullWidth
            label="Listing Title"
            value={createData.title}
            onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
            placeholder="e.g., Premium EV Credits - Urban Routes"
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Amount (kg CO₂)"
            type="number"
            value={createData.amount}
            onChange={(e) => setCreateData({ ...createData, amount: parseFloat(e.target.value) || 0 })}
            inputProps={{ step: '0.01', min: '0.01', max: availableCredits }}
            helperText={`Available: ${availableCredits.toFixed(2)} kg CO₂`}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Price per kg (VND)"
            type="number"
            value={createData.pricePerKg}
            onChange={(e) => setCreateData({ ...createData, pricePerKg: parseFloat(e.target.value) || 0 })}
            inputProps={{ step: '1000', min: '1000' }}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={createData.description}
            onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
            placeholder="Describe your credits (route type, vehicle, etc.)"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Expires At (Optional)"
            type="date"
            value={createData.expiresAt}
            onChange={(e) => setCreateData({ ...createData, expiresAt: e.target.value })}
            InputLabelProps={{ shrink: true }}
            helperText="Leave empty for 30 days from now"
            sx={{ mb: 2 }}
          />

          {createData.amount > 0 && createData.pricePerKg > 0 && (
            <Box p={2} bgcolor="primary.light" borderRadius={1} sx={{ opacity: 0.9 }}>
              <Typography variant="body1" fontWeight="bold" color="primary.dark">
                Total Value: {(createData.amount * createData.pricePerKg).toLocaleString('vi-VN')} VND
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {createData.amount} kg × {createData.pricePerKg.toLocaleString('vi-VN')} VND/kg
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateListing}
            disabled={creating || !createData.title || createData.amount <= 0 || createData.pricePerKg <= 0}
          >
            {creating ? 'Creating...' : 'Create Listing'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyListingsPage;
