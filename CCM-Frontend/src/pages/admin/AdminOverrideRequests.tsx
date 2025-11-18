import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, AppBar, Toolbar, IconButton, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Pagination, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { ArrowBack, Logout, AssignmentTurnedIn, Add, Check, Close, Visibility } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { adminOverrideApi } from '../../api/admin-override';

interface OverrideRequest {
  id: number;
  requestType: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: number;
  requestedByAdmin?: { username: string };
  reviewedBy?: number;
  reviewedByAdmin?: { username: string };
  reviewReason?: string;
  targetType?: string;
  targetId?: number;
  additionalData?: any;
  createdAt: string;
  reviewedAt?: string;
}

export const AdminOverrideRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<OverrideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OverrideRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<OverrideRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewReason, setReviewReason] = useState('');
  const [formData, setFormData] = useState({
    requestType: '',
    reason: '',
    targetType: '',
    targetId: '',
  });

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isSuperAdmin = adminUser.is_super_admin;

  useEffect(() => {
    loadRequests();
  }, [page, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        status: statusFilter || undefined,
      };
      const { data } = await adminOverrideApi.getAll(params);
      // Handle different response structures
      const requestsList = Array.isArray(data) ? data : (data.requests || data.data || []);
      setRequests(requestsList);
      setTotalPages(data.totalPages || Math.ceil((data.total || requestsList.length) / 20));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load override requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      const payload = {
        type: formData.requestType as any,
        description: formData.reason,
        priority: 'MEDIUM' as any,
        reason: formData.reason,
        justification: formData.reason,
        targetUserId: formData.targetId ? formData.targetId : undefined,
      };
      await adminOverrideApi.create(payload);
      toast.success('Override request created');
      setOpenCreate(false);
      setFormData({ requestType: '', reason: '', targetType: '', targetId: '' });
      loadRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create request');
    }
  };

  const handleReviewRequest = async () => {
    if (!selectedRequest || !isSuperAdmin) return;
    try {
      if (reviewAction === 'approve') {
        await adminOverrideApi.approve(selectedRequest.id, { comment: reviewReason });
      } else {
        await adminOverrideApi.reject(selectedRequest.id, { comment: reviewReason });
      }
      toast.success(`Request ${reviewAction}d successfully`);
      setOpenReview(false);
      setReviewReason('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${reviewAction} request`);
    }
  };

  const handleViewDetails = async (request: OverrideRequest) => {
    try {
      const { data } = await adminOverrideApi.getById(request.id);
      setViewingRequest(data);
      setOpenView(true);
    } catch (error: any) {
      toast.error('Failed to load request details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Override Requests
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{adminUser.email}</Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            <AssignmentTurnedIn sx={{ mr: 1, verticalAlign: 'middle' }} />
            Override Requests
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreate(true)}
          >
            Create Request
          </Button>
        </Box>

        {/* Status Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Requested By</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">Loading...</TableCell>
                    </TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No requests found</TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{request.requestType}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          {request.reason.length > 50
                            ? `${request.reason.substring(0, 50)}...`
                            : request.reason}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            color={getStatusColor(request.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {request.requestedByAdmin?.username || `Admin ${request.requestedBy}`}
                        </TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewDetails(request)}
                            title="View Details"
                            sx={{ mr: 1 }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {request.status === 'PENDING' && isSuperAdmin && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewAction('approve');
                                  setOpenReview(true);
                                }}
                                title="Approve"
                              >
                                <Check fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewAction('reject');
                                  setOpenReview(true);
                                }}
                                title="Reject"
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          {request.status !== 'PENDING' && (
                            <Typography variant="caption" color="text.secondary">
                              Reviewed
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Create Request Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Override Request</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Request Type"
              value={formData.requestType}
              onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
              fullWidth
              placeholder="e.g., EMERGENCY_WITHDRAWAL, MANUAL_VERIFICATION"
              required
            />
            <TextField
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
            />
            <TextField
              label="Target Type"
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
              fullWidth
              placeholder="e.g., USER, KYC, TRANSACTION"
            />
            <TextField
              label="Target ID"
              value={formData.targetId}
              onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
              fullWidth
              type="number"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateRequest} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Request Dialog */}
      <Dialog open={openReview} onClose={() => setOpenReview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approve' ? 'Approve' : 'Reject'} Override Request
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Typography><strong>Request ID:</strong> {selectedRequest.id}</Typography>
              <Typography><strong>Type:</strong> {selectedRequest.requestType}</Typography>
              <Typography><strong>Reason:</strong> {selectedRequest.reason}</Typography>
              <Typography sx={{ mt: 2, mb: 1 }}><strong>Review Reason (optional):</strong></Typography>
              <TextField
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Explain why you are approving/rejecting this request..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReview(false)}>Cancel</Button>
          <Button
            onClick={handleReviewRequest}
            variant="contained"
            color={reviewAction === 'approve' ? 'success' : 'error'}
          >
            {reviewAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
        <DialogTitle>Override Request Details</DialogTitle>
        <DialogContent>
          {viewingRequest && (
            <Box sx={{ mt: 2 }}>
              <Typography><strong>ID:</strong> {viewingRequest.id}</Typography>
              <Typography><strong>Request Type:</strong> {viewingRequest.requestType}</Typography>
              <Typography><strong>Reason:</strong> {viewingRequest.reason}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                <Typography><strong>Status:</strong></Typography>
                <Chip
                  label={viewingRequest.status}
                  color={getStatusColor(viewingRequest.status)}
                  size="small"
                />
              </Box>
              <Typography>
                <strong>Requested By:</strong>{' '}
                {viewingRequest.requestedByAdmin?.username || `Admin ${viewingRequest.requestedBy}`}
              </Typography>
              {viewingRequest.targetType && (
                <Typography>
                  <strong>Target:</strong> {viewingRequest.targetType} #{viewingRequest.targetId}
                </Typography>
              )}
              <Typography>
                <strong>Created At:</strong> {new Date(viewingRequest.createdAt).toLocaleString()}
              </Typography>
              {viewingRequest.reviewedBy && (
                <>
                  <Typography>
                    <strong>Reviewed By:</strong>{' '}
                    {viewingRequest.reviewedByAdmin?.username || `Admin ${viewingRequest.reviewedBy}`}
                  </Typography>
                  <Typography>
                    <strong>Reviewed At:</strong> {new Date(viewingRequest.reviewedAt!).toLocaleString()}
                  </Typography>
                  {viewingRequest.reviewReason && (
                    <Typography>
                      <strong>Review Reason:</strong> {viewingRequest.reviewReason}
                    </Typography>
                  )}
                </>
              )}
              {viewingRequest.additionalData && (
                <>
                  <Typography sx={{ mt: 2 }}><strong>Additional Data:</strong></Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mt: 1 }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {JSON.stringify(viewingRequest.additionalData, null, 2)}
                    </pre>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
