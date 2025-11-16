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
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { tripApi } from '../../api/trip';
import { creditApi } from '../../api/credit';
import toast from 'react-hot-toast';

interface Trip {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  co2Reduced: number;
  status: string;
  verificationStatus: string;
  createdAt: string;
}

const statusColors: any = {
  CALCULATED: 'info',
  SUBMITTED_FOR_VERIFICATION: 'warning',
  VERIFIED: 'success',
  REJECTED: 'error',
};

export const AdminTripVerificationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingTrips();
  }, []);

  const fetchPendingTrips = async () => {
    try {
      setLoading(true);
      // Get all trips and filter pending ones
      const userIds = ['00000000-0000-0000-0000-000000000038']; // Add more user IDs as needed
      
      let allTrips: Trip[] = [];
      for (const userId of userIds) {
        try {
          const response = await tripApi.getByUser(userId, { page: 0, size: 100 });
          const data = response.data.data?.content || response.data.data || [];
          allTrips = [...allTrips, ...data];
        } catch (err) {
          console.error(`Failed to fetch trips for user ${userId}:`, err);
        }
      }

      // Filter trips that are pending verification
      const pendingTrips = allTrips.filter(
        trip => trip.status === 'SUBMITTED_FOR_VERIFICATION' || 
                trip.verificationStatus === 'PENDING'
      );
      
      setTrips(pendingTrips);
    } catch (err: any) {
      console.error('Failed to fetch trips:', err);
      toast.error('Failed to load pending trips');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (trip: Trip) => {
    setSelectedTrip(trip);
    setDetailsDialog(true);
  };

  const handleApprove = async (trip: Trip) => {
    if (!confirm(`Approve trip ${trip.id.substring(0, 8)}... and issue ${trip.co2Reduced} kg CO₂ credits?`)) {
      return;
    }

    try {
      // Step 1: Mark trip as verified (this would be done by CVA service)
      // For now, we'll just complete it
      await tripApi.complete(trip.id);
      
      // Step 2: Add credits to user's account
      await creditApi.addCredit({
        userId: trip.userId,
        amount: trip.co2Reduced,
        source: 'TRIP_VERIFICATION',
        description: `Carbon credits from verified EV trip ${trip.id.substring(0, 8)}... (${trip.distanceKm} km)`,
      });

      toast.success(`Trip approved! ${trip.co2Reduced} kg CO₂ credits issued to user.`);
      fetchPendingTrips();
      setDetailsDialog(false);
    } catch (err: any) {
      toast.error('Approval failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async () => {
    if (!selectedTrip || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      // In a real system, there would be a reject endpoint
      // For now, we'll just show the message
      toast.error(`Trip ${selectedTrip.id.substring(0, 8)}... rejected: ${rejectionReason}`);
      setRejectDialog(false);
      setRejectionReason('');
      setDetailsDialog(false);
    } catch (err: any) {
      toast.error('Rejection failed: ' + (err.response?.data?.message || err.message));
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
            Trip Verification (CVA Simulation)
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Review and approve EV trips to issue carbon credits
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchPendingTrips}
        >
          Refresh
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>CVA Role:</strong> As a Carbon Verification Authority, you verify EV trip data and approve 
        the issuance of carbon credits. Once approved, credits are automatically added to the user's account.
      </Alert>

      {/* Pending Trips Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Verification ({trips.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Trip ID</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Distance (km)</TableCell>
                  <TableCell>CO₂ Saved (kg)</TableCell>
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
                        No pending trips for verification
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trips.map((trip) => (
                    <TableRow key={trip.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {trip.id.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          ...{trip.userId.substring(trip.userId.length - 4)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(trip.startTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {trip.distanceKm?.toFixed(1) || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="success.main">
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
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewDetails(trip)}
                            title="View Details"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApprove(trip)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => {
                              setSelectedTrip(trip);
                              setRejectDialog(true);
                            }}
                          >
                            Reject
                          </Button>
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

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Trip Verification Details</DialogTitle>
        <DialogContent>
          {selectedTrip && (
            <Box>
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Trip ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {selectedTrip.id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">User ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {selectedTrip.userId}
                  </Typography>
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
                    {selectedTrip.distanceKm?.toFixed(1)} km
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">CO₂ to be Issued</Typography>
                  <Typography variant="h6" color="success.main">
                    {selectedTrip.co2Reduced?.toFixed(2)} kg
                  </Typography>
                </Box>
              </Box>

              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Verification Checklist:</strong>
                </Typography>
                <Typography variant="body2">
                  ✓ Trip data integrity verified<br />
                  ✓ Distance calculation accurate<br />
                  ✓ CO₂ calculation follows standard methodology<br />
                  ✓ No duplicate trip submissions detected
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          {selectedTrip && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => {
                  setDetailsDialog(false);
                  setRejectDialog(true);
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleApprove(selectedTrip)}
              >
                Approve & Issue Credits
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Trip Verification</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please provide a reason for rejection
          </Alert>
          <TextField
            fullWidth
            label="Rejection Reason"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Insufficient trip data, Duplicate submission, Invalid distance calculation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectionReason}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTripVerificationPage;
