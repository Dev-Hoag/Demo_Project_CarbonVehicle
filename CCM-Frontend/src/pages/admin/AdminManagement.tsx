import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, AppBar, Toolbar, IconButton, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Stack
} from '@mui/material';
import { 
  ArrowBack, Logout, PersonAdd, Lock, LockOpen, Edit, AdminPanelSettings, Visibility 
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = 'http://localhost';

// Axios instance with admin auth
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

interface Admin {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export const AdminManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'ADMIN',
    isSuperAdmin: false,
  });

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.get('/api/admin/auth/admins');
      // Handle different response structures
      const adminsList = Array.isArray(data) ? data : (data.admins || data.data || []);
      console.log('Loaded admins:', adminsList); // Debug log
      setAdmins(adminsList);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        password: '',
        role: admin.role,
        isSuperAdmin: admin.isSuperAdmin,
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        password: '',
        role: 'ADMIN',
        isSuperAdmin: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAdmin(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingAdmin) {
        // Update admin
        await adminApi.put(`/api/admin/auth/admins/${editingAdmin.id}`, formData);
        toast.success('Admin updated successfully');
      } else {
        // Create new admin
        await adminApi.post('/api/admin/auth/admins', formData);
        toast.success('Admin created successfully');
      }
      handleCloseDialog();
      loadAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleLockAdmin = async (id: number) => {
    if (!confirm('Are you sure you want to lock this admin?')) return;
    try {
      await adminApi.post(`/api/admin/auth/admins/${id}/lock`, { reason: 'Locked by super admin' });
      toast.success('Admin locked successfully');
      loadAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to lock admin');
    }
  };

  const handleUnlockAdmin = async (id: number) => {
    try {
      await adminApi.post(`/api/admin/auth/admins/${id}/unlock`);
      toast.success('Admin unlocked successfully');
      await loadAdmins(); // Wait for reload
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to unlock admin';
      toast.error(errorMsg);
      console.error('Unlock error:', error.response?.data);
      // Reload anyway to sync UI with actual state
      await loadAdmins();
    }
  };

  const handleViewAdmin = async (id: number) => {
    try {
      const { data } = await adminApi.get(`/api/admin/auth/admins/${id}`);
      setViewingAdmin(data);
      setOpenViewDialog(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load admin details');
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
            Admin Management
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
            <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle' }} />
            Admin Users Management
          </Typography>
          {adminUser.isSuperAdmin && (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => handleOpenDialog()}
            >
              Add New Admin
            </Button>
          )}
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Username</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Full Name</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Last Login</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">Loading...</TableCell>
                    </TableRow>
                  ) : admins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">No admins found</TableCell>
                    </TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>{admin.id}</TableCell>
                        <TableCell>{admin.username}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>{admin.fullName}</TableCell>
                        <TableCell>
                          <Chip
                            label={admin.isSuperAdmin ? 'SUPER ADMIN' : admin.role}
                            color={admin.isSuperAdmin ? 'error' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={admin.isActive ? 'Active' : 'Locked'}
                            color={admin.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {admin.lastLoginAt
                            ? new Date(admin.lastLoginAt).toLocaleString()
                            : 'Never'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewAdmin(admin.id)}
                              title="View Details"
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            {adminUser.isSuperAdmin && admin.id !== adminUser.id && (
                              <>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenDialog(admin)}
                                  title="Edit"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                {admin.isActive ? (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleLockAdmin(admin.id)}
                                    title="Lock"
                                  >
                                    <Lock fontSize="small" />
                                  </IconButton>
                                ) : (
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleUnlockAdmin(admin.id)}
                                    title="Unlock"
                                  >
                                    <LockOpen fontSize="small" />
                                  </IconButton>
                                )}
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Create/Edit Admin Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAdmin ? 'Edit Admin' : 'Create New Admin'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!!editingAdmin}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              sx={{ mb: 2 }}
            />
            {!editingAdmin && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                sx={{ mb: 2 }}
              />
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role || 'ADMIN'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MODERATOR">Moderator</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Super Admin</InputLabel>
              <Select
                value={formData.isSuperAdmin ? 'yes' : 'no'}
                onChange={(e) =>
                  setFormData({ ...formData, isSuperAdmin: e.target.value === 'yes' })
                }
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAdmin ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Admin Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Admin Details</DialogTitle>
        <DialogContent>
          {viewingAdmin && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>ID:</strong> {viewingAdmin.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Username:</strong> {viewingAdmin.username}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {viewingAdmin.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Full Name:</strong> {viewingAdmin.fullName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1" component="div">
                  <strong>Role:</strong>
                </Typography>
                <Chip
                  label={viewingAdmin.isSuperAdmin ? 'SUPER ADMIN' : viewingAdmin.role}
                  color={viewingAdmin.isSuperAdmin ? 'error' : 'primary'}
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1" component="div">
                  <strong>Status:</strong>
                </Typography>
                <Chip
                  label={viewingAdmin.isActive ? 'Active' : 'Locked'}
                  color={viewingAdmin.isActive ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Typography variant="body1" gutterBottom>
                <strong>Last Login:</strong>{' '}
                {viewingAdmin.lastLoginAt
                  ? new Date(viewingAdmin.lastLoginAt).toLocaleString()
                  : 'Never'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Created At:</strong> {new Date(viewingAdmin.createdAt).toLocaleString()}
              </Typography>
              {viewingAdmin.updatedAt && (
                <Typography variant="body1" gutterBottom>
                  <strong>Updated At:</strong> {new Date(viewingAdmin.updatedAt).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
