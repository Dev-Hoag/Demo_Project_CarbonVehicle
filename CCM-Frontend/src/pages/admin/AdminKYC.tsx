import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  Assessment as StatsIcon,
  AccountBalance,
  Logout,
  VerifiedUser,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  getPendingDocuments,
  getAllDocuments,
  approveDocument,
  rejectDocument,
  getKycStatistics,
  type KycDocument,
  type KycStatistics,
} from '../../api/admin-kyc';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const AdminKYC: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [statistics, setStatistics] = useState<KycStatistics | null>(null);

  // Auth check
  const token = localStorage.getItem('adminToken');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    }
  }, [token, navigate]);

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingDocId, setProcessingDocId] = useState<number | null>(null);

  // Load statistics
  const loadStatistics = async () => {
    try {
      const stats = await getKycStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
    }
  };

  // Load documents
  const loadDocuments = async () => {
    setLoading(true);
    try {
      let response;
      if (statusFilter === 'PENDING') {
        response = await getPendingDocuments(page + 1, limit);
      } else if (statusFilter === 'ALL') {
        response = await getAllDocuments(page + 1, limit);
      } else {
        response = await getAllDocuments(page + 1, limit, statusFilter);
      }
      setDocuments(response.documents);
      setTotal(response.total);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [page, limit, statusFilter]);

  useEffect(() => {
    loadStatistics();
  }, []);

  // Handle preview
  const handlePreview = (doc: KycDocument) => {
    setSelectedDoc(doc);
    setPreviewOpen(true);
  };

  // Handle approve
  const handleApprove = async (docId: number) => {
    if (!window.confirm('Are you sure you want to approve this document?')) {
      return;
    }

    setProcessingDocId(docId);
    try {
      await approveDocument(docId);
      toast.success('Document approved successfully');
      loadDocuments();
      loadStatistics();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve document');
    } finally {
      setProcessingDocId(null);
    }
  };

  // Handle reject
  const handleRejectClick = (doc: KycDocument) => {
    setSelectedDoc(doc);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingDocId(selectedDoc.id);
    try {
      await rejectDocument(selectedDoc.id, rejectionReason);
      toast.success('Document rejected successfully');
      setRejectDialogOpen(false);
      setSelectedDoc(null);
      setRejectionReason('');
      loadDocuments();
      loadStatistics();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject document');
    } finally {
      setProcessingDocId(null);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format document type
  const formatDocType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Admin Header */}
      <AppBar position="static">
        <Toolbar>
          <VerifiedUser sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard - KYC Management
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {adminUser.email}
          </Typography>
          <Button
            color="inherit"
            startIcon={<AccountBalance />}
            onClick={() => navigate('/admin/withdrawals')}
            sx={{ mr: 1 }}
          >
            Withdrawals
          </Button>
          <Button
            color="inherit"
            startIcon={<StatsIcon />}
            onClick={() => navigate('/admin/reports')}
            sx={{ mr: 1 }}
          >
            Reports
          </Button>
          <IconButton
            color="inherit"
            onClick={() => {
              loadDocuments();
              loadStatistics();
            }}
            title="Refresh"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          KYC Document Management
        </Typography>

      {/* Statistics Cards */}
      {statistics && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.totalDocuments}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Documents
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.pendingDocuments}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.approvedDocuments}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.rejectedDocuments}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.totalUsersWithKyc}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Users with KYC
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatsIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{statistics.usersFullyVerified}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Fully Verified
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Status Filter Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={statusFilter}
          onChange={(_, newValue) => {
            setStatusFilter(newValue);
            setPage(0);
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Pending" value="PENDING" />
          <Tab label="All" value="ALL" />
          <Tab label="Approved" value="APPROVED" />
          <Tab label="Rejected" value="REJECTED" />
        </Tabs>
      </Paper>

      {/* Documents Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Document Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uploaded At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">No documents found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.id}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{doc.user?.fullName || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.user?.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDocType(doc.documentType)}</TableCell>
                    <TableCell>{doc.documentNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={doc.status} color={getStatusColor(doc.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      {new Date(doc.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handlePreview(doc)}
                          title="Preview"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {doc.status === 'PENDING' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(doc.id)}
                              disabled={processingDocId === doc.id}
                              title="Approve"
                            >
                              {processingDocId === doc.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <ApproveIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRejectClick(doc)}
                              disabled={processingDocId === doc.id}
                              title="Reject"
                            >
                              <RejectIcon fontSize="small" />
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
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Document Preview
          {selectedDoc && (
            <Chip
              label={selectedDoc.status}
              color={getStatusColor(selectedDoc.status)}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  User: <strong>{selectedDoc.user?.fullName}</strong> ({selectedDoc.user?.email})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Document Type: <strong>{formatDocType(selectedDoc.documentType)}</strong>
                </Typography>
                {selectedDoc.documentNumber && (
                  <Typography variant="body2" color="text.secondary">
                    Document Number: <strong>{selectedDoc.documentNumber}</strong>
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Uploaded: <strong>{new Date(selectedDoc.createdAt).toLocaleString()}</strong>
                </Typography>
                {selectedDoc.rejectionReason && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <strong>Rejection Reason:</strong> {selectedDoc.rejectionReason}
                  </Alert>
                )}
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                {selectedDoc.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${selectedDoc.fileUrl}`}
                    alt="Document"
                    style={{ maxWidth: '100%', maxHeight: '500px' }}
                  />
                ) : (
                  <iframe
                    src={`${import.meta.env.VITE_API_BASE_URL}${selectedDoc.fileUrl}`}
                    style={{ width: '100%', height: '500px', border: 'none' }}
                    title="Document Preview"
                  />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          {selectedDoc && selectedDoc.status === 'PENDING' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => {
                  setPreviewOpen(false);
                  handleApprove(selectedDoc.id);
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => {
                  setPreviewOpen(false);
                  handleRejectClick(selectedDoc);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Document</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please provide a clear reason for rejection. This will be visible to the user.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Document is not clear, expired, or does not match requirements"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectSubmit}
            disabled={!rejectionReason.trim() || processingDocId !== null}
            startIcon={processingDocId !== null ? <CircularProgress size={20} /> : <RejectIcon />}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default AdminKYC;
