import React, { useState, useEffect } from 'react';
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
  Stack,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import adminKycApi, { 
  type KycDocument, 
  type KycDocumentListResponse 
} from '../../api/admin-kyc';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const AdminKYC: React.FC = () => {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingDocId, setProcessingDocId] = useState<number | null>(null);

  // Load documents
  const loadDocuments = async () => {
    setLoading(true);
    try {
      let response: KycDocumentListResponse;
      if (statusFilter === 'PENDING') {
        response = await adminKycApi.getPendingDocuments(page + 1, limit);
      } else if (statusFilter === 'ALL') {
        response = await adminKycApi.getAllDocuments(page + 1, limit);
      } else {
        response = await adminKycApi.getAllDocuments(page + 1, limit, statusFilter);
      }
      setDocuments(response.documents);
      setTotal(response.total);

      // Update statistics from the loaded data
      calculateStatistics(response.documents);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (docs: KycDocument[]) => {
    setStatistics({
      total: docs.length,
      pending: docs.filter(d => d.status === 'PENDING').length,
      approved: docs.filter(d => d.status === 'APPROVED').length,
      rejected: docs.filter(d => d.status === 'REJECTED').length,
    });
  };

  // Load statistics from API
  const loadStatistics = async () => {
    try {
      const stats = await adminKycApi.getKycStatistics();
      setStatistics({
        total: stats.totalDocuments || 0,
        pending: stats.pendingDocuments || 0,
        approved: stats.approvedDocuments || 0,
        rejected: stats.rejectedDocuments || 0,
      });
    } catch (error: any) {
      console.error('Failed to load KYC statistics:', error);
      // Fallback: calculate from loaded documents
      if (documents.length > 0) {
        setStatistics({
          total: documents.length,
          pending: documents.filter(d => d.status === 'PENDING').length,
          approved: documents.filter(d => d.status === 'APPROVED').length,
          rejected: documents.filter(d => d.status === 'REJECTED').length,
        });
      }
    }
  };

  useEffect(() => {
    loadDocuments();
    loadStatistics();
  }, [page, limit, statusFilter]);

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
      await adminKycApi.approveDocument(docId);
      toast.success('Document approved successfully');
      loadDocuments();
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
      await adminKycApi.rejectDocument(selectedDoc.id, rejectionReason);
      toast.success('Document rejected successfully');
      setRejectDialogOpen(false);
      setSelectedDoc(null);
      setRejectionReason('');
      loadDocuments();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">KYC Document Management</Typography>
        <IconButton onClick={loadDocuments} color="primary" title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Statistics Cards */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <Card sx={{ flex: '1 1 150px', minWidth: 150 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StatsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">{statistics.total}</Typography>
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
              <Typography variant="h6">{statistics.pending}</Typography>
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
              <Typography variant="h6">{statistics.approved}</Typography>
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
              <Typography variant="h6">{statistics.rejected}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Rejected
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Status Filter Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={statusFilter}
          onChange={(_, newValue) => {
            setStatusFilter(newValue);
            setPage(0);
          }}
        >
          <Tab label="Pending" value="PENDING" />
          <Tab label="All" value="ALL" />
          <Tab label="Approved" value="APPROVED" />
          <Tab label="Rejected" value="REJECTED" />
        </Tabs>
      </Paper>

      {/* Documents Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            No documents found
          </Alert>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Document Type</TableCell>
                  <TableCell>Document Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted At</TableCell>
                  <TableCell>Verified At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.id}</TableCell>
                    <TableCell>
                      {doc.user?.email || `User #${doc.userId}`}
                      {doc.user?.fullName && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {doc.user.fullName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDocType(doc.documentType)}</TableCell>
                    <TableCell>{doc.documentNumber}</TableCell>
                    <TableCell>
                      <Chip label={doc.status} color={getStatusColor(doc.status) as any} size="small" />
                    </TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell>{doc.verifiedAt ? formatDate(doc.verifiedAt) : '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handlePreview(doc)}
                        title="View Document"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={total}
              rowsPerPage={limit}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </TableContainer>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>User:</strong> {selectedDoc.user?.email || `User #${selectedDoc.userId}`}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Document Type:</strong> {formatDocType(selectedDoc.documentType)}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Document Number:</strong> {selectedDoc.documentNumber}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong>{' '}
                <Chip label={selectedDoc.status} color={getStatusColor(selectedDoc.status) as any} size="small" />
              </Typography>
              {selectedDoc.rejectionReason && selectedDoc.status === 'REJECTED' && (
                <Typography variant="subtitle1" gutterBottom color="error">
                  <strong>Rejection Reason:</strong> {selectedDoc.rejectionReason}
                </Typography>
              )}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={selectedDoc.fileUrl}
                  alt="Document"
                  style={{ maxWidth: '100%', maxHeight: '500px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Provide a detailed reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectSubmit}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim() || processingDocId !== null}
          >
            {processingDocId ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminKYC;
