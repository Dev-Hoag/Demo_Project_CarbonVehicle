import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, AppBar, Toolbar, IconButton, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, TextField, FormControl, InputLabel, Select, MenuItem, Button,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ArrowBack, Logout, Description, Search, Visibility } from '@mui/icons-material';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = 'http://localhost';

const adminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AuditLog {
  id: number;
  adminId: number;
  adminUsername: string;
  actionName: string;
  targetType?: string;
  targetId?: number;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const AdminAuditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    adminId: '',
    actionName: '',
    targetType: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...filters,
      };
      const { data } = await adminApi.get('/api/admin/audit-logs', { params });
      // Handle different response structures
      const logsList = Array.isArray(data) ? data : (data.logs || data.data || []);
      setLogs(logsList);
      setTotalPages(data.totalPages || Math.ceil((data.total || logsList.length) / 20));
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => navigate('/admin/login'), 1500);
      } else {
        toast.error(error.response?.data?.message || 'Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (log: AuditLog) => {
    try {
      const { data } = await adminApi.get(`/api/admin/audit-logs/${log.id}`);
      setSelectedLog(data);
      setOpenDetail(true);
    } catch (error: any) {
      toast.error('Failed to load log details');
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('APPROVE')) return 'success';
    if (action.includes('DELETE') || action.includes('REJECT')) return 'error';
    if (action.includes('UPDATE') || action.includes('LOCK')) return 'warning';
    return 'default';
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
            Audit Logs
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{adminUser.email}</Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
          System Audit Logs
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Filters</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Admin ID"
                value={filters.adminId}
                onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
                size="small"
                sx={{ minWidth: 150 }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.actionName}
                  onChange={(e) => setFilters({ ...filters, actionName: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="CREATE">CREATE</MenuItem>
                  <MenuItem value="UPDATE">UPDATE</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                  <MenuItem value="LOCK">LOCK</MenuItem>
                  <MenuItem value="UNLOCK">UNLOCK</MenuItem>
                  <MenuItem value="APPROVE">APPROVE</MenuItem>
                  <MenuItem value="REJECT">REJECT</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Target Type</InputLabel>
                <Select
                  value={filters.targetType}
                  onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="USER">USER</MenuItem>
                  <MenuItem value="KYC">KYC</MenuItem>
                  <MenuItem value="TRANSACTION">TRANSACTION</MenuItem>
                  <MenuItem value="WITHDRAWAL">WITHDRAWAL</MenuItem>
                  <MenuItem value="WALLET">WALLET</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={() => setPage(1)}
              >
                Search
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Timestamp</strong></TableCell>
                    <TableCell><strong>Admin</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                    <TableCell><strong>Target</strong></TableCell>
                    <TableCell><strong>IP Address</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">Loading...</TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No logs found</TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          {log.adminUsername} (ID: {log.adminId})
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.actionName}
                            color={getActionColor(log.actionName)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {log.targetType && log.targetId
                            ? `${log.targetType} #${log.targetId}`
                            : '-'}
                        </TableCell>
                        <TableCell>{log.ipAddress || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetail(log)}
                            title="View Details"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
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

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Typography><strong>ID:</strong> {selectedLog.id}</Typography>
              <Typography><strong>Admin:</strong> {selectedLog.adminUsername} (ID: {selectedLog.adminId})</Typography>
              <Typography><strong>Action:</strong> {selectedLog.actionName}</Typography>
              <Typography><strong>Target:</strong> {selectedLog.targetType} #{selectedLog.targetId}</Typography>
              <Typography><strong>IP Address:</strong> {selectedLog.ipAddress}</Typography>
              <Typography><strong>User Agent:</strong> {selectedLog.userAgent}</Typography>
              <Typography><strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</Typography>
              {selectedLog.changes && (
                <>
                  <Typography sx={{ mt: 2 }}><strong>Changes:</strong></Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mt: 1 }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
