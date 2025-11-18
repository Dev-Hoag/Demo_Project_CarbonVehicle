import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
} from '@mui/icons-material';
import { verificationApi, type Verification } from '../api/verification';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
} as const;

const statusIcons = {
  PENDING: <PendingIcon />,
  APPROVED: <ApprovedIcon />,
  REJECTED: <RejectedIcon />,
};

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const VerificationsPage: React.FC = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, []);

  useEffect(() => {
    filterVerifications();
  }, [verifications, statusFilter]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const response = await verificationApi.getAllVerifications();
      setVerifications(Array.isArray(response) ? response : response.items || []);
    } catch (error: any) {
      console.error('Failed to load verifications:', error);
      toast.error(error.response?.data?.message || 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const filterVerifications = () => {
    if (statusFilter === 'ALL') {
      setFilteredVerifications(verifications);
    } else {
      setFilteredVerifications(verifications.filter(v => v.status === statusFilter));
    }
  };

  const handleApproveClick = (verification: Verification) => {
    setSelectedVerification(verification);
    setRemarks('');
    setApproveDialog(true);
  };

  const handleRejectClick = (verification: Verification) => {
    setSelectedVerification(verification);
    setRemarks('');
    setRejectDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedVerification) return;

    try {
      setProcessing(true);
      await verificationApi.approveVerification(selectedVerification.id, {
        remarks: remarks || undefined,
      });
      toast.success('Verification approved successfully!');
      setApproveDialog(false);
      loadVerifications();
    } catch (error: any) {
      console.error('Approve failed:', error);
      toast.error(error.response?.data?.message || 'Failed to approve verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !remarks.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    if (remarks.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      setProcessing(true);
      await verificationApi.rejectVerification(selectedVerification.id, {
        remarks: remarks.trim(),
      });
      toast.success('Verification rejected');
      setRejectDialog(false);
      setRemarks('');
      loadVerifications();
    } catch (error: any) {
      console.error('Reject failed:', error);
      toast.error(error.response?.data?.message || 'Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusCounts = () => {
    return {
      ALL: verifications.length,
      PENDING: verifications.filter(v => v.status === 'PENDING').length,
      APPROVED: verifications.filter(v => v.status === 'APPROVED').length,
      REJECTED: verifications.filter(v => v.status === 'REJECTED').length,
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Trip Verifications
        </Typography>
        <Typography color="text.secondary">
          Review and approve carbon credit verifications from EV owners
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box sx={{ flex: '1 1 200px' }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Verifications
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {statusCounts.ALL}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px' }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Review
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {statusCounts.PENDING}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px' }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {statusCounts.APPROVED}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px' }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {statusCounts.REJECTED}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs Filter */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={statusFilter} onChange={(_, value) => setStatusFilter(value)}>
          <Tab label={`All (${statusCounts.ALL})`} value="ALL" />
          <Tab label={`Pending (${statusCounts.PENDING})`} value="PENDING" />
          <Tab label={`Approved (${statusCounts.APPROVED})`} value="APPROVED" />
          <Tab label={`Rejected (${statusCounts.REJECTED})`} value="REJECTED" />
        </Tabs>
      </Card>

      {/* Verifications Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Trip ID</TableCell>
                <TableCell>Carbon Saved (kg)</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVerifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      No verifications found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVerifications.map((verification) => (
                  <TableRow key={verification.id} hover>
                    <TableCell>#{verification.id}</TableCell>
                    <TableCell>{verification.user_id}</TableCell>
                    <TableCell>#{verification.trip_id}</TableCell>
                    <TableCell>{verification.carbon_saved_kg?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>{verification.credit_amount?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={statusIcons[verification.status]}
                        label={verification.status}
                        color={statusColors[verification.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(verification.created_at).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      {verification.status === 'PENDING' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleApproveClick(verification)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleRejectClick(verification)}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                      {verification.status === 'APPROVED' && (
                        <Typography variant="caption" color="success.main">
                          ✓ Verified {verification.verified_at && `on ${new Date(verification.verified_at).toLocaleDateString('vi-VN')}`}
                        </Typography>
                      )}
                      {verification.status === 'REJECTED' && verification.rejection_reason && (
                        <Typography variant="caption" color="error.main">
                          {verification.rejection_reason}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Verify that this trip meets the carbon credit requirements?
          </Typography>
          {selectedVerification && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2"><strong>ID:</strong> #{selectedVerification.id}</Typography>
              <Typography variant="body2"><strong>Trip:</strong> #{selectedVerification.trip_id}</Typography>
              <Typography variant="body2"><strong>Carbon Saved:</strong> {selectedVerification.carbon_saved_kg?.toFixed(2)} kg</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any comments or notes..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={16} /> : <ApproveIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Verification</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please provide a clear reason for rejection. This will be visible to the user.
          </Alert>
          {selectedVerification && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2"><strong>ID:</strong> #{selectedVerification.id}</Typography>
              <Typography variant="body2"><strong>Trip:</strong> #{selectedVerification.trip_id}</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            required
            multiline
            rows={4}
            label="Rejection Reason"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Explain why this verification is being rejected (minimum 10 characters)..."
            error={remarks.trim().length > 0 && remarks.trim().length < 10}
            helperText={
              remarks.trim().length === 0 
                ? 'Rejection reason is required' 
                : remarks.trim().length < 10 
                  ? `${10 - remarks.trim().length} more characters required` 
                  : `${remarks.trim().length}/2000 characters`
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={processing || remarks.trim().length < 10}
            startIcon={processing ? <CircularProgress size={16} /> : <RejectIcon />}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
