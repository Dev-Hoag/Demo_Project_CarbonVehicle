import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Cancel,
  Pending,
  Visibility,
  Close,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import {
  kycApi,
  type DocumentType,
  type KycDocument,
  type KycStatus,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_DESCRIPTIONS,
} from '../api/kyc';
import toast from 'react-hot-toast';

export const KYCPage: React.FC = () => {
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; doc?: KycDocument }>({
    open: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      documentType: '' as DocumentType,
      documentNumber: '',
    },
  });

  const watchDocumentType = watch('documentType');

  useEffect(() => {
    fetchKycData();
  }, []);

  const fetchKycData = async () => {
    try {
      setLoading(true);
      const [status, docs] = await Promise.all([
        kycApi.getKycStatus(),
        kycApi.getMyDocuments(),
      ]);
      setKycStatus(status);
      setDocuments(docs);
    } catch (error: any) {
      console.error('Failed to fetch KYC data:', error);
      toast.error(error.response?.data?.message || 'Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadDocument = async (data: { documentType: DocumentType; documentNumber: string }) => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploadingDoc(true);
      await kycApi.uploadDocument({
        file: selectedFile,
        documentType: data.documentType,
        documentNumber: data.documentNumber || undefined,
      });
      toast.success('Document uploaded successfully');
      setUploadDialogOpen(false);
      reset();
      setSelectedFile(null);
      fetchKycData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await kycApi.deleteDocument(docId);
      toast.success('Document deleted successfully');
      fetchKycData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    reset();
    setSelectedFile(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle fontSize="small" />;
      case 'REJECTED':
        return <Cancel fontSize="small" />;
      case 'PENDING':
        return <Pending fontSize="small" />;
      default:
        return null;
    }
  };

  const getOverallStatusMessage = () => {
    if (!kycStatus) return null;

    switch (kycStatus.kycStatus) {
      case 'APPROVED':
        return (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Your KYC verification is complete. Your account is fully verified.
          </Alert>
        );
      case 'REJECTED':
        return (
          <Alert severity="error" sx={{ mb: 3 }}>
            ❌ Your KYC verification was rejected. Please check the rejection reasons below and resubmit.
          </Alert>
        );
      case 'PENDING':
        return (
          <Alert severity="info" sx={{ mb: 3 }}>
            ⏳ Your KYC documents are under review. This usually takes 1-3 business days.
          </Alert>
        );
      default:
        return (
          <Alert severity="warning" sx={{ mb: 3 }}>
            📄 Please upload your KYC documents to verify your identity and access all features.
          </Alert>
        );
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
          KYC Verification
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setUploadDialogOpen(true)}
          disabled={kycStatus?.kycStatus === 'APPROVED'}
        >
          Upload Document
        </Button>
      </Box>

      {getOverallStatusMessage()}

      {/* KYC Status Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Verification Status
            </Typography>
            <Chip
              label={kycStatus?.kycStatus || 'NOT_SUBMITTED'}
              color={getStatusColor(kycStatus?.kycStatus || 'NOT_SUBMITTED')}
              icon={getStatusIcon(kycStatus?.kycStatus || 'NOT_SUBMITTED') || undefined}
            />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Total Documents: {documents.length} | 
            Approved: {documents.filter(d => d.status === 'APPROVED').length} | 
            Pending: {documents.filter(d => d.status === 'PENDING').length} | 
            Rejected: {documents.filter(d => d.status === 'REJECTED').length}
          </Typography>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Your Documents
          </Typography>

          {documents.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No documents uploaded yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => setUploadDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Upload Your First Document
              </Button>
            </Box>
          ) : (
            <List>
              {documents.map((doc) => (
                <ListItem
                  key={doc.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {DOCUMENT_TYPE_LABELS[doc.documentType]}
                        </Typography>
                        <Chip
                          size="small"
                          label={doc.status}
                          color={getStatusColor(doc.status)}
                          icon={getStatusIcon(doc.status) || undefined}
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        {doc.documentNumber && (
                          <Typography variant="body2" color="text.secondary">
                            Document Number: {doc.documentNumber}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Uploaded: {new Date(doc.createdAt).toLocaleString()}
                        </Typography>
                        {doc.verifiedAt && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Verified: {new Date(doc.verifiedAt).toLocaleString()}
                          </Typography>
                        )}
                        {doc.rejectionReason && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            Rejection Reason: {doc.rejectionReason}
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => setPreviewDialog({ open: true, doc })}
                      sx={{ mr: 1 }}
                    >
                      <Visibility />
                    </IconButton>
                    {doc.status === 'PENDING' && (
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteDocument(doc.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload KYC Document
          <IconButton
            onClick={handleCloseUploadDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit(handleUploadDocument)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <FormControl fullWidth error={!!errors.documentType}>
                  <InputLabel>Document Type *</InputLabel>
                  <Select
                    {...register('documentType', { required: 'Document type is required' })}
                    label="Document Type *"
                    value={watchDocumentType}
                  >
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {watchDocumentType && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    {DOCUMENT_TYPE_DESCRIPTIONS[watchDocumentType]}
                  </Typography>
                )}
              </Box>

              <Box>
                <TextField
                  {...register('documentNumber')}
                  fullWidth
                  label="Document Number (Optional)"
                  placeholder="e.g., 001234567890"
                  helperText="Enter the document number if available"
                />
              </Box>

              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUpload />}
                  sx={{ height: 56 }}
                >
                  {selectedFile ? selectedFile.name : 'Choose File *'}
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Accepted: JPG, PNG, PDF (Max 5MB)
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUploadDialog} disabled={uploadingDoc}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploadingDoc || !selectedFile}
              startIcon={uploadingDoc ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {uploadingDoc ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Document Preview
          <IconButton
            onClick={() => setPreviewDialog({ open: false })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewDialog.doc && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {DOCUMENT_TYPE_LABELS[previewDialog.doc.documentType]}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status: <Chip
                  size="small"
                  label={previewDialog.doc.status}
                  color={getStatusColor(previewDialog.doc.status)}
                />
              </Typography>
              {previewDialog.doc.fileUrl.endsWith('.pdf') ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" my={2}>
                    PDF files cannot be previewed. 
                  </Typography>
                  <Button
                    variant="outlined"
                    href={`http://localhost${previewDialog.doc.fileUrl}`}
                    target="_blank"
                  >
                    Download PDF
                  </Button>
                </Box>
              ) : (
                <Box
                  component="img"
                  src={`http://localhost${previewDialog.doc.fileUrl}`}
                  alt={DOCUMENT_TYPE_LABELS[previewDialog.doc.documentType]}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    mt: 2,
                  }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KYCPage;
