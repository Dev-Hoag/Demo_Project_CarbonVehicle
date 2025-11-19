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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ValidIcon,
  Cancel as RevokedIcon,
  HourglassEmpty as ExpiredIcon,
  Block as RevokeIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { certificateApi, type Certificate } from '../api/certificate';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const statusColors = {
  valid: 'success',
  expired: 'warning',
  revoked: 'error',
} as const;

const statusIcons = {
  valid: <ValidIcon />,
  expired: <ExpiredIcon />,
  revoked: <RevokedIcon />,
};

type StatusFilter = 'all' | 'valid' | 'expired' | 'revoked';

export const CVACertificatesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Revoke dialog
  const [revokeDialog, setRevokeDialog] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Generate dialog
  const [generateDialog, setGenerateDialog] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    verification_id: '',
    trip_id: '',
    user_id: '',
    credit_amount: '',
    template_id: 1,
  });

  useEffect(() => {
    loadCertificates();
  }, [page, statusFilter]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificateApi.getAllCertificates({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setCertificates(response.items || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Failed to load certificates:', error);
      toast.error(error.response?.data?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeClick = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setRevokeReason('');
    setRevokeDialog(true);
  };

  const handleRevoke = async () => {
    if (!selectedCertificate || !revokeReason.trim()) {
      toast.error('Please provide a revocation reason');
      return;
    }

    if (revokeReason.trim().length < 10) {
      toast.error('Revocation reason must be at least 10 characters');
      return;
    }

    try {
      setProcessing(true);
      await certificateApi.revokeCertificate(
        selectedCertificate.id,
        user?.id,
        revokeReason.trim()
      );
      toast.success('Certificate revoked successfully');
      setRevokeDialog(false);
      setRevokeReason('');
      loadCertificates();
    } catch (error: any) {
      console.error('Revoke failed:', error);
      toast.error(error.response?.data?.message || 'Failed to revoke certificate');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateClick = () => {
    setGenerateForm({
      verification_id: '',
      trip_id: '',
      user_id: '',
      credit_amount: '',
      template_id: 1,
    });
    setGenerateDialog(true);
  };

  const handleGenerate = async () => {
    const { verification_id, trip_id, user_id, credit_amount, template_id } = generateForm;
    
    if (!verification_id || !trip_id || !user_id || !credit_amount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setProcessing(true);
      await certificateApi.createCertificate({
        verification_id: parseInt(verification_id),
        trip_id: parseInt(trip_id),
        user_id: parseInt(user_id),
        credit_amount: parseFloat(credit_amount),
        template_id,
      });
      toast.success('Certificate generated successfully!');
      setGenerateDialog(false);
      loadCertificates();
    } catch (error: any) {
      console.error('Generate failed:', error);
      toast.error(error.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    try {
      await certificateApi.downloadAndSave(certificate.id, `certificate_${certificate.id}.pdf`);
      toast.success('Certificate downloaded');
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(error.response?.data?.message || 'Failed to download certificate');
    }
  };

  const getStatusCounts = () => {
    return {
      all: total,
      valid: certificates.filter(c => c.status === 'valid').length,
      expired: certificates.filter(c => c.status === 'expired').length,
      revoked: certificates.filter(c => c.status === 'revoked').length,
    };
  };

  if (loading && page === 1) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Certificate Management
          </Typography>
          <Typography color="text.secondary">
            Manage all certificates in the system
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCertificates}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleGenerateClick}
          >
            Generate Certificate
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Certificates
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {statusCounts.all}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Valid
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              {statusCounts.valid}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Expired
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              {statusCounts.expired}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Revoked
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              {statusCounts.revoked}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="valid">Valid</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="revoked">Revoked</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Trip ID</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Certificate Hash</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      No certificates found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>{cert.id}</TableCell>
                    <TableCell>{cert.user_id}</TableCell>
                    <TableCell>{cert.trip_id}</TableCell>
                    <TableCell>{cert.credit_amount} kg CO₂</TableCell>
                    <TableCell>
                      <Tooltip title={cert.cert_hash}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {cert.cert_hash.substring(0, 12)}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {new Date(cert.issue_date).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusIcons[cert.status]}
                        label={cert.status.toUpperCase()}
                        color={statusColors[cert.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {cert.pdf_url && (
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(cert)}
                              color="primary"
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {cert.status === 'valid' && (
                          <Tooltip title="Revoke Certificate">
                            <IconButton
                              size="small"
                              onClick={() => handleRevokeClick(cert)}
                              color="error"
                            >
                              <RevokeIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {total > pageSize && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialog} onClose={() => setRevokeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revoke Certificate</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Certificate ID: {selectedCertificate?.id}
          </Typography>
          <TextField
            label="Revocation Reason *"
            fullWidth
            multiline
            rows={4}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            helperText="Minimum 10 characters"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleRevoke}
            variant="contained"
            color="error"
            disabled={processing || !revokeReason.trim()}
          >
            {processing ? <CircularProgress size={20} /> : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Dialog */}
      <Dialog open={generateDialog} onClose={() => setGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Certificate Manually</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            For special cases where certificate needs to be generated manually
          </Typography>
          <TextField
            label="Verification ID *"
            fullWidth
            type="number"
            value={generateForm.verification_id}
            onChange={(e) => setGenerateForm({ ...generateForm, verification_id: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Trip ID *"
            fullWidth
            type="number"
            value={generateForm.trip_id}
            onChange={(e) => setGenerateForm({ ...generateForm, trip_id: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="User ID *"
            fullWidth
            type="number"
            value={generateForm.user_id}
            onChange={(e) => setGenerateForm({ ...generateForm, user_id: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Credit Amount (kg CO₂) *"
            fullWidth
            type="number"
            value={generateForm.credit_amount}
            onChange={(e) => setGenerateForm({ ...generateForm, credit_amount: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Template</InputLabel>
            <Select
              value={generateForm.template_id}
              label="Template"
              onChange={(e) => setGenerateForm({ ...generateForm, template_id: e.target.value as number })}
            >
              <MenuItem value={1}>Default Template</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            variant="contained"
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
