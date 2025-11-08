import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useAuth } from '../shared/contexts/AuthContext';
import MainLayout from '../shared/components/MainLayout';
import { userServiceApi } from '../shared/api/user-service.api';
import type { KycDocument } from '../shared/types/user.types';
import { DocumentType } from '../shared/types/user.types';
import { KYC_STATUS_LABELS, MAX_FILE_SIZE } from '../shared/utils/constants';
import { getStatusColor, formatFileSize, formatDate } from '../shared/utils/formatters';

export const KycPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    documentType: DocumentType.ID_CARD,
    file: null as File | null,
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await userServiceApi.getMyKycDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentTypeChange = (e: SelectChangeEvent<DocumentType>) => {
    setFormData(prev => ({
      ...prev,
      documentType: e.target.value as DocumentType,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File không được vượt quá ${formatFileSize(MAX_FILE_SIZE)}`);
        return;
      }
      setFormData(prev => ({ ...prev, file }));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.file) {
      setError('Vui lòng chọn file');
      return;
    }

    try {
      setSubmitting(true);
      // submitKyc expects FormData with documentType and file
      await userServiceApi.submitKyc({
        documentType: formData.documentType,
        file: formData.file,
      } as any);
      setSuccess('Nộp tài liệu thành công! Đang chờ xét duyệt.');
      setFormData({
        documentType: DocumentType.ID_CARD,
        file: null,
      });
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      await loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Nộp tài liệu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckIcon color="success" />;
      case 'REJECTED':
        return <RejectIcon color="error" />;
      case 'PENDING':
      default:
        return <PendingIcon color="warning" />;
    }
  };

  if (loading) {
    return (
      <MainLayout title="Xác thực KYC">
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Xác thực KYC">
      <Container maxWidth="md">
        {/* Status Overview */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Trạng thái KYC
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip
              label={KYC_STATUS_LABELS[user?.kycStatus || 'NOT_SUBMITTED']}
              color={getStatusColor(user?.kycStatus || 'NOT_SUBMITTED')}
            />
          </Box>
          {user?.kycStatus === 'NOT_SUBMITTED' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Bạn chưa nộp tài liệu KYC. Vui lòng nộp đầy đủ tài liệu để xác thực tài khoản.
            </Alert>
          )}
          {user?.kycStatus === 'PENDING' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Tài liệu của bạn đang được xem xét. Vui lòng đợi kết quả.
            </Alert>
          )}
          {user?.kycStatus === 'APPROVED' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Tài khoản của bạn đã được xác thực thành công! ✅
            </Alert>
          )}
          {user?.kycStatus === 'REJECTED' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Tài liệu KYC của bạn bị từ chối. Vui lòng kiểm tra lại và nộp lại tài liệu hợp lệ.
            </Alert>
          )}
        </Paper>

        {/* Upload Form */}
        <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Nộp tài liệu KYC
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Loại tài liệu</InputLabel>
              <Select
                value={formData.documentType}
                label="Loại tài liệu"
                onChange={handleDocumentTypeChange}
                disabled={submitting}
              >
                <MenuItem value={DocumentType.ID_CARD}>CMND/CCCD</MenuItem>
                <MenuItem value={DocumentType.PASSPORT}>Hộ chiếu</MenuItem>
                <MenuItem value={DocumentType.DRIVER_LICENSE}>Bằng lái xe</MenuItem>
                <MenuItem value={DocumentType.VEHICLE_REGISTRATION}>Đăng ký xe</MenuItem>
                <MenuItem value={DocumentType.BUSINESS_LICENSE}>Giấy phép kinh doanh</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3 }}>
              <input
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                disabled={submitting}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={submitting}
                  fullWidth
                >
                  Chọn file
                </Button>
              </label>
              {formData.file && (
                <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                  Đã chọn: {formData.file.name} ({formatFileSize(formData.file.size)})
                </Typography>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                Định dạng: JPG, PNG, PDF. Tối đa {formatFileSize(MAX_FILE_SIZE)}
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting || !formData.file}
              startIcon={submitting ? <CircularProgress size={20} /> : <UploadIcon />}
              sx={{ mt: 3 }}
            >
              {submitting ? 'Đang nộp...' : 'Nộp tài liệu'}
            </Button>
          </Box>
        </Paper>

        {/* Documents List */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tài liệu đã nộp ({documents.length})
          </Typography>

          {documents.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Chưa có tài liệu nào được nộp
            </Alert>
          ) : (
            <List>
              {documents.map((doc) => (
                <ListItem
                  key={doc.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    {getStatusIcon(doc.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${doc.documentType} - ${doc.documentNumber}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          Trạng thái: <strong>{doc.status}</strong>
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          Ngày nộp: {formatDate(doc.createdAt)}
                        </Typography>
                        {doc.verifiedAt && (
                          <>
                            <br />
                            <Typography component="span" variant="caption" color="text.secondary">
                              Ngày xét duyệt: {formatDate(doc.verifiedAt)}
                            </Typography>
                          </>
                        )}
                        {doc.rejectionReason && (
                          <>
                            <br />
                            <Typography component="span" variant="caption" color="error">
                              Lý do từ chối: {doc.rejectionReason}
                            </Typography>
                          </>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default KycPage;
