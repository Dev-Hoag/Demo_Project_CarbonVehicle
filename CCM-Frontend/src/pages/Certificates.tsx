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
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  Download as DownloadIcon,
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
  valid: <ApprovedIcon />,
  expired: <PendingIcon />,
  revoked: <RejectedIcon />,
};

export const CertificatesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        // Query both numeric user_id and UUID-hashed version
        // Backend stores numeric for manual certs, hashed for auto-generated certs
        const [numericCerts, hashedCerts] = await Promise.all([
          certificateApi.getMyCertificates(user.id).catch(() => []),
          certificateApi.getMyCertificates(`00000000-0000-0000-0000-0000000000${String(user.id).padStart(2, '0')}`).catch(() => [])
        ]);
        
        // Merge and deduplicate by certificate ID
        const allCerts = [...numericCerts, ...hashedCerts];
        const uniqueCerts = Array.from(
          new Map(allCerts.map(cert => [cert.id, cert])).values()
        );
        
        setCertificates(uniqueCerts);
      }
    } catch (error: any) {
      console.error('Failed to load certificates:', error);
      toast.error(error.response?.data?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (cert: Certificate) => {
    try {
      setDownloading(cert.id);
      await certificateApi.downloadAndSave(cert.id, `Carbon_Credit_Certificate_${cert.cert_hash}.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(error.response?.data?.message || 'Failed to download certificate');
    } finally {
      setDownloading(null);
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
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        My Certificates
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Certificates
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {certificates.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Valid Certificates
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {certificates.filter(c => c.status === 'valid').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Credits
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {certificates.reduce((sum, c) => sum + Number(c.credit_amount), 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Certificates Table */}
      {certificates.length === 0 ? (
        <Alert severity="info">
          No certificates found. Complete and verify trips to earn carbon credit certificates!
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Certificate ID</TableCell>
                <TableCell>Trip ID</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Hash</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      #{cert.id}
                    </Typography>
                  </TableCell>
                  <TableCell>Trip #{cert.trip_id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {Number(cert.credit_amount).toFixed(2)} Credits
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        backgroundColor: 'grey.100',
                        padding: '4px 8px',
                        borderRadius: 1,
                      }}
                    >
                      {cert.cert_hash.substring(0, 16)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(cert.issue_date).toLocaleDateString()}
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
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={downloading === cert.id ? <CircularProgress size={16} /> : <DownloadIcon />}
                      onClick={() => handleDownload(cert)}
                      disabled={downloading === cert.id || !cert.pdf_url}
                      title={!cert.pdf_url ? 'PDF not available yet' : 'Download certificate PDF'}
                    >
                      {downloading === cert.id ? 'Downloading...' : !cert.pdf_url ? 'PDF Unavailable' : 'Download PDF'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Info Box */}
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>About Carbon Credit Certificates:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            • Certificates are automatically issued when you purchase credits or earn them through verified trips
          </Typography>
          <Typography variant="body2">
            • Each certificate contains a unique cryptographic hash for authenticity verification
          </Typography>
          <Typography variant="body2">
            • Certificates serve as immutable proof of your carbon offset contributions
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default CertificatesPage;
