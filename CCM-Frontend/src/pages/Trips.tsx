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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  LinearProgress,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Upload,
  Refresh,
  Delete,
  CheckCircle,
  Info,
  Timeline,
  CloudUpload,
  Visibility,
  Calculate,
  Check,
  Storefront,
} from '@mui/icons-material';
import { tripApi, type Trip } from '../api/trip';
import { listingApi } from '../api/listing';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'warning',
  CALCULATED: 'info',
  SUBMITTED_FOR_VERIFICATION: 'primary',
  UNDER_REVIEW: 'secondary',
  VERIFIED: 'success',
  REJECTED: 'error',
  COMPLETED: 'success',
} as const;

const verificationColors = {
  NOT_SUBMITTED: 'default',
  PENDING: 'info',
  VERIFIED: 'success',
  REJECTED: 'error',
  UNVERIFIED: 'default',
  SUBMITTED: 'info',
} as const;

export const TripsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [uploading, setUploading] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalTrips: 0,
    totalDistance: 0,
    totalCO2: 0,
    verifiedTrips: 0,
  });
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [listingDialog, setListingDialog] = useState(false);
  const [listingData, setListingData] = useState({
    pricePerKg: 50000, // Default price 50,000 VND/kg
    description: '',
  });
  const [userListings, setUserListings] = useState<any[]>([]);

  const userId = user?.id?.toString() || '0';
  const userUUID = `00000000-0000-0000-0000-${userId.padStart(12, '0')}`;

  useEffect(() => {
    fetchTrips();
    fetchSummary();
    fetchUserListings();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripApi.getByUser(userUUID, {
        page: 0,
        size: 50,
        sort: 'createdAt,desc',
      });
      
      const data = response.data.data?.content || response.data.data || [];
      setTrips(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch trips:', err);
      toast.error('Failed to load trips: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await tripApi.getSummary(userUUID);
      console.log('Summary response:', response.data);
      const data = response.data.data;
      console.log('Summary data:', data);
      setSummaryData({
        totalTrips: data?.totalTrips || 0,
        totalDistance: data?.totalDistanceKm || 0,
        totalCO2: data?.totalCO2Reduced || 0,
        verifiedTrips: data?.verifiedTrips || 0,
      });
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const fetchUserListings = async () => {
    try {
      const response = await listingApi.getAll({ page: 0, size: 100 });
      const allListings = response.data.data.content;
      // Filter by seller ID - include all statuses to check if trip is listed/sold
      const myListings = allListings.filter(
        (listing: any) => listing.sellerId === userUUID
      );
      setUserListings(myListings);
    } catch (err) {
      console.error('Failed to fetch user listings:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Auto-detect format from file extension
      const ext = file.name.split('.').pop()?.toUpperCase();
      if (ext === 'CSV' || ext === 'JSON') {
        setFileFormat(ext as 'CSV' | 'JSON');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', userUUID);
      formData.append('vehicleId', userUUID); // Using same UUID for demo
      formData.append('format', fileFormat);

      await tripApi.upload(formData);
      toast.success('Trip data uploaded successfully!');
      setUploadDialog(false);
      setSelectedFile(null);
      fetchTrips();
      fetchSummary();
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitVerification = async (tripId: string) => {
    try {
      await tripApi.submitVerification(tripId);
      toast.success('Trip submitted for verification!');
      fetchTrips();
    } catch (err: any) {
      toast.error('Submission failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await tripApi.delete(tripId);
      toast.success('Trip deleted successfully!');
      fetchTrips();
      fetchSummary();
    } catch (err: any) {
      toast.error('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewDetails = async (tripId: string) => {
    try {
      setLoadingDetails(true);
      setDetailsDialog(true);
      const response = await tripApi.getById(tripId);
      setSelectedTrip(response.data.data);
    } catch (err: any) {
      toast.error('Failed to load trip details: ' + (err.response?.data?.message || err.message));
      setDetailsDialog(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRecalculateCO2 = async (tripId: string) => {
    try {
      await tripApi.calculate(tripId);
      toast.success('CO₂ recalculated successfully!');
      fetchTrips();
      fetchSummary();
      if (selectedTrip?.id === tripId) {
        handleViewDetails(tripId);
      }
    } catch (err: any) {
      toast.error('Recalculation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    try {
      await tripApi.complete(tripId);
      toast.success('Trip marked as completed!');
      fetchTrips();
      fetchSummary();
      if (selectedTrip?.id === tripId) {
        handleViewDetails(tripId);
      }
    } catch (err: any) {
      toast.error('Complete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateListing = async (trip: Trip) => {
    setSelectedTrip(trip);
    setListingData({
      pricePerKg: 50000,
      description: `Carbon credits from verified EV trip on ${new Date(trip.startTime).toLocaleDateString()}`,
    });
    setListingDialog(true);
  };

  const handleSubmitListing = async () => {
    if (!selectedTrip || !listingData.pricePerKg || listingData.pricePerKg <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const listingPayload = {
        title: `Carbon Credits from ${selectedTrip.distanceKm?.toFixed(1)} km EV Trip`,
        description: listingData.description || `High-quality carbon credits verified from electric vehicle usage. Trip completed on ${new Date(selectedTrip.startTime).toLocaleDateString()}.`,
        co2Amount: selectedTrip.co2Reduced,
        pricePerKg: listingData.pricePerKg,
        sellerId: userUUID,
        listingType: 'FIXED_PRICE' as const,
        tripId: selectedTrip.id, // Link listing to trip
      };

      console.log('Creating listing with payload:', listingPayload);
      await listingApi.create(listingPayload);

      toast.success('Listing created successfully! Check "My Listings" or "Marketplace" to view it.');
      setListingDialog(false);
      fetchTrips();
      fetchUserListings(); // Refresh listings to update button states
    } catch (err: any) {
      console.error('Create listing error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.response?.data?.message);
      toast.error('Failed to create listing: ' + (err.response?.data?.message || err.message));
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            My EV Trips
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Upload trip data to calculate CO₂ savings and earn carbon credits
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchTrips();
              fetchSummary();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialog(true)}
          >
            Upload Trip Data
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Trips
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    {summaryData.totalTrips}
                  </Typography>
                </Box>
                <Timeline sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Distance
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    {summaryData.totalDistance.toFixed(1)} km
                  </Typography>
                </Box>
                <Info sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    CO₂ Saved
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: 'success.main' }}>
                    {summaryData.totalCO2.toFixed(2)} kg
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Verified Trips
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    {summaryData.verifiedTrips}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of {summaryData.totalTrips} total
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>How it works:</strong> Upload your EV trip data (CSV or JSON) → System calculates CO₂ savings → 
        Submit for verification → Receive carbon credits → List credits for sale
      </Alert>

      {/* Trips Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Trip History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Trip ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Distance (km)</TableCell>
                  <TableCell align="right">Avg Speed (km/h)</TableCell>
                  <TableCell align="right">CO₂ Saved (kg)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={3}>
                        No trips yet. Upload your first trip data!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trips.map((trip) => (
                    <TableRow key={trip.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {trip.id.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(trip.startTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">{trip.distanceKm?.toFixed(1) || '-'}</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">
                        <Typography color="success.main" fontWeight="bold">
                          {trip.co2Reduced?.toFixed(2) || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trip.status}
                          color={statusColors[trip.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trip.verificationStatus}
                          color={verificationColors[trip.verificationStatus as keyof typeof verificationColors] || 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewDetails(trip.id)}
                            title="View Details"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {trip.status === 'CALCULATED' && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleRecalculateCO2(trip.id)}
                              title="Recalculate CO₂"
                            >
                              <Calculate fontSize="small" />
                            </IconButton>
                          )}
                          {trip.status === 'VERIFIED' && trip.co2Reduced > 0 && (() => {
                            // Check if trip already has a listing (active, pending, or sold)
                            const hasListing = userListings.some(
                              listing => listing.tripId === trip.id && 
                                         (listing.status === 'ACTIVE' || listing.status === 'PENDING' || listing.status === 'SOLD')
                            );
                            return (
                              <Button
                                size="small"
                                variant="outlined"
                                color={hasListing ? 'success' : 'secondary'}
                                startIcon={<Storefront />}
                                onClick={() => handleCreateListing(trip)}
                                disabled={hasListing}
                              >
                                {hasListing ? 'Already Listed' : 'List for Sale'}
                              </Button>
                            );
                          })()}
                          {(trip.verificationStatus === 'NOT_SUBMITTED' && trip.status === 'CALCULATED') && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleSubmitVerification(trip.id)}
                            >
                              Submit for Verification
                            </Button>
                          )}
                          {trip.status === 'VERIFIED' && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleCompleteTrip(trip.id)}
                              title="Mark as Complete"
                            >
                              <Check fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTrip(trip.id)}
                            disabled={trip.status === 'VERIFIED' || trip.status === 'COMPLETED'}
                            title={trip.status === 'VERIFIED' || trip.status === 'COMPLETED' ? 'Cannot delete verified/completed trips' : 'Delete Trip'}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
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

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CloudUpload color="primary" />
            <Typography variant="h6">Upload Trip Data</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Upload a CSV or JSON file containing your EV trip data. The system will automatically calculate CO₂ savings.
          </Alert>

          <TextField
            select
            fullWidth
            label="File Format"
            value={fileFormat}
            onChange={(e) => setFileFormat(e.target.value as 'CSV' | 'JSON')}
            sx={{ mb: 2 }}
          >
            <MenuItem value="CSV">CSV (Comma Separated)</MenuItem>
            <MenuItem value="JSON">JSON (JavaScript Object Notation)</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<Upload />}
            sx={{ mb: 2 }}
          >
            {selectedFile ? selectedFile.name : 'Choose File'}
            <input
              type="file"
              hidden
              accept=".csv,.json"
              onChange={handleFileSelect}
            />
          </Button>

          {selectedFile && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Typography>
            </Box>
          )}

          {uploading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trip Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Info color="primary" />
            <Typography variant="h6">Trip Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : selectedTrip ? (
            <Box>
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Trip ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {selectedTrip.id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={selectedTrip.status}
                      color={statusColors[selectedTrip.status as keyof typeof statusColors]}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Start Time</Typography>
                  <Typography variant="body1">
                    {new Date(selectedTrip.startTime).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">End Time</Typography>
                  <Typography variant="body1">
                    {new Date(selectedTrip.endTime).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Distance</Typography>
                  <Typography variant="h6" color="primary">
                    {selectedTrip.distanceKm?.toFixed(1) || '-'} km
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">CO₂ Reduced</Typography>
                  <Typography variant="h6" color="success.main">
                    {selectedTrip.co2Reduced?.toFixed(2) || '-'} kg
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Verification Status</Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={selectedTrip.verificationStatus}
                      color={verificationColors[selectedTrip.verificationStatus as keyof typeof verificationColors] || 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1">
                    {new Date(selectedTrip.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                {selectedTrip.verifiedAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Verified At</Typography>
                    <Typography variant="body1">
                      {new Date(selectedTrip.verifiedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>

              {selectedTrip.rejectionReason && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600}>Rejection Reason:</Typography>
                  <Typography variant="body2">{selectedTrip.rejectionReason}</Typography>
                </Alert>
              )}

              {selectedTrip.statusDescription && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">{selectedTrip.statusDescription}</Typography>
                </Alert>
              )}

              <Box display="flex" gap={1} flexWrap="wrap">
                {selectedTrip.status === 'CALCULATED' && (
                  <Button
                    variant="outlined"
                    startIcon={<Calculate />}
                    onClick={() => {
                      handleRecalculateCO2(selectedTrip.id);
                    }}
                  >
                    Recalculate CO₂
                  </Button>
                )}
                {selectedTrip.canSubmit && selectedTrip.verificationStatus === 'NOT_SUBMITTED' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => {
                      handleSubmitVerification(selectedTrip.id);
                      setDetailsDialog(false);
                    }}
                  >
                    Submit for Verification
                  </Button>
                )}
                {selectedTrip.status === 'VERIFIED' && !selectedTrip.isFinal && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Check />}
                    onClick={() => {
                      handleCompleteTrip(selectedTrip.id);
                      setDetailsDialog(false);
                    }}
                  >
                    Mark as Complete
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <Typography>No trip data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Listing Dialog */}
      <Dialog open={listingDialog} onClose={() => setListingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Storefront color="secondary" />
            <Typography variant="h6">List Carbon Credits for Sale</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTrip && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                You are listing <strong>{selectedTrip.co2Reduced?.toFixed(2)} kg CO₂</strong> credits 
                from your verified EV trip.
              </Alert>

              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mb={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Trip Distance</Typography>
                  <Typography variant="h6">{selectedTrip.distanceKm?.toFixed(1)} km</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">CO₂ Credits</Typography>
                  <Typography variant="h6" color="success.main">
                    {selectedTrip.co2Reduced?.toFixed(2)} kg
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Price per kg CO₂ (VND)"
                type="number"
                value={listingData.pricePerKg}
                onChange={(e) => setListingData({ ...listingData, pricePerKg: parseFloat(e.target.value) || 0 })}
                inputProps={{ step: '1000', min: '1000' }}
                sx={{ mb: 2 }}
                helperText="Suggested: 50,000 - 150,000 VND per kg"
              />

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={listingData.description}
                onChange={(e) => setListingData({ ...listingData, description: e.target.value })}
                placeholder="Describe your carbon credits listing..."
                sx={{ mb: 2 }}
              />

              <Box p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Listing Summary
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">CO₂ Amount:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {selectedTrip.co2Reduced?.toFixed(2)} kg
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">Price per kg:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {listingData.pricePerKg.toLocaleString()} VND
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" borderTop="1px solid" borderColor="grey.300" pt={1}>
                  <Typography variant="subtitle2">Total Value:</Typography>
                  <Typography variant="h6" color="primary">
                    {(selectedTrip.co2Reduced * listingData.pricePerKg).toLocaleString()} VND
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Once listed, buyers can purchase your carbon credits. You'll receive payment to your wallet 
                  after successful transaction.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setListingDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmitListing}
            disabled={!listingData.pricePerKg || listingData.pricePerKg <= 0}
          >
            Create Listing
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripsPage;
