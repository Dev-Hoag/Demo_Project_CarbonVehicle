import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import adminService from '../../services/admin';
import type { UserFilters } from '../../services/admin';
import UserDetailDialog from '../../components/admin/UserDetailDialog';
import UserWalletDetailDialog from '../../components/admin/UserWalletDetailDialog';

interface ManagedUser {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  externalUserId?: string;
  userType: 'EV_OWNER' | 'BUYER' | 'CVA'; // ✅ Fixed: Match backend enum
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'DELETED';
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  data: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ActionDialogState {
  open: boolean;
  type: 'lock' | 'suspend' | 'delete' | null;
  userId: number | null;
  reason: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Action dialog
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    type: null,
    userId: null,
    reason: '',
  });

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionHistory, setActionHistory] = useState<any[]>([]);
  const [historyUserId, setHistoryUserId] = useState<number | null>(null);

  // Wallet detail dialog
  const [walletDetailDialog, setWalletDetailDialog] = useState(false);
  const [walletUserId, setWalletUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, statusFilter, userTypeFilter, includeDeleted]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: UserFilters = {
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        search: searchQuery || undefined,
        status: (statusFilter as any) || undefined,
        userType: (userTypeFilter as any) || undefined,
        includeDeleted,
      };

      const response: UserListResponse = await adminService.users.getAllUsers(filters);
      setUsers(response.data);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0); // Reset to first page
    fetchUsers();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleLockUser = async (userId: number, reason: string) => {
    try {
      await adminService.users.lockUser(userId, reason);
      setActionDialog({ open: false, type: null, userId: null, reason: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to lock user');
    }
  };

  const handleUnlockUser = async (userId: number) => {
    try {
      await adminService.users.unlockUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlock user');
    }
  };

  const handleSuspendUser = async (userId: number, reason: string) => {
    try {
      await adminService.users.suspendUser(userId, reason);
      setActionDialog({ open: false, type: null, userId: null, reason: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId: number) => {
    try {
      await adminService.users.unsuspendUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unsuspend user');
    }
  };

  const handleDeleteUser = async (userId: number, reason: string) => {
    try {
      await adminService.users.deleteUser(userId, reason);
      setActionDialog({ open: false, type: null, userId: null, reason: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleViewDetail = (user: ManagedUser) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleViewHistory = async (userId: number) => {
    setHistoryUserId(userId);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const response = await adminService.users.getUserActionHistory(userId, 1, 50);
      setActionHistory(response.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load action history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedUser(null);
  };

  const openActionDialog = (type: 'lock' | 'suspend' | 'delete', userId: number) => {
    setActionDialog({ open: true, type, userId, reason: '' });
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, type: null, userId: null, reason: '' });
  };

  const confirmAction = () => {
    if (!actionDialog.userId || !actionDialog.type) return;

    if (actionDialog.type === 'lock') {
      handleLockUser(actionDialog.userId, actionDialog.reason);
    } else if (actionDialog.type === 'suspend') {
      handleSuspendUser(actionDialog.userId, actionDialog.reason);
    } else if (actionDialog.type === 'delete') {
      handleDeleteUser(actionDialog.userId, actionDialog.reason);
    }
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
      ACTIVE: 'success',
      LOCKED: 'error',
      SUSPENDED: 'warning',
      DELETED: 'default',
    };
    return <Chip label={status} color={colors[status] || 'default'} size="small" />;
  };

  const getUserTypeChip = (userType: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'info'> = {
      EV_OWNER: 'primary', // ✅ Fixed: Changed from VEHICLE to EV_OWNER
      BUYER: 'secondary',
      CVA: 'info',
    };
    const labels: Record<string, string> = {
      EV_OWNER: 'EV Owner',
      BUYER: 'Buyer',
      CVA: 'CVA',
    };
    return <Chip label={labels[userType] || userType} color={colors[userType] || 'default'} size="small" variant="outlined" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
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
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 250 }}
            size="small"
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="LOCKED">Locked</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
              <MenuItem value="DELETED">Deleted</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>User Type</InputLabel>
            <Select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)} label="User Type">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="EV_OWNER">EV Owner</MenuItem>
              <MenuItem value="BUYER">Buyer</MenuItem>
              <MenuItem value="CVA">CVA</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Include Deleted</InputLabel>
            <Select
              value={includeDeleted ? 'true' : 'false'}
              onChange={(e) => setIncludeDeleted(e.target.value === 'true')}
              label="Include Deleted"
            >
              <MenuItem value="false">No</MenuItem>
              <MenuItem value="true">Yes</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
            Search
          </Button>

          <IconButton onClick={fetchUsers} color="primary">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>User Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>KYC Status</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.fullName || 'N/A'}</TableCell>
                      <TableCell>{getUserTypeChip(user.userType)}</TableCell>
                      <TableCell>{getStatusChip(user.status)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.kycStatus} 
                          color={user.kycStatus === 'APPROVED' ? 'success' : user.kycStatus === 'REJECTED' ? 'error' : 'default'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info" onClick={() => handleViewDetail(user)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Action History">
                          <IconButton size="small" color="primary" onClick={() => handleViewHistory(user.id)}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View Wallet">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              // Use externalUserId for wallet query (real User Service ID)
                              const userId = user.externalUserId ? parseInt(user.externalUserId) : user.id;
                              setWalletUserId(userId);
                              setWalletDetailDialog(true);
                            }}
                          >
                            <WalletIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {user.status === 'ACTIVE' && (
                          <>
                            <Tooltip title="Lock User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openActionDialog('lock', user.id)}
                              >
                                <LockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Suspend User">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => openActionDialog('suspend', user.id)}
                              >
                                <SuspendIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {user.status === 'LOCKED' && (
                          <Tooltip title="Unlock User">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleUnlockUser(user.id)}
                            >
                              <UnlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {user.status === 'SUSPENDED' && (
                          <Tooltip title="Activate User">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleUnsuspendUser(user.id)}
                            >
                              <ActivateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {user.status !== 'DELETED' && (
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openActionDialog('delete', user.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>

      {/* Action Dialog (Lock/Suspend/Delete) */}
      <Dialog open={actionDialog.open} onClose={closeActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionDialog.type === 'lock' && 'Lock User'}
          {actionDialog.type === 'suspend' && 'Suspend User'}
          {actionDialog.type === 'delete' && 'Delete User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={actionDialog.reason}
            onChange={(e) => setActionDialog({ ...actionDialog, reason: e.target.value })}
            placeholder="Enter reason for this action..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionDialog}>Cancel</Button>
          <Button
            onClick={confirmAction}
            color={actionDialog.type === 'delete' ? 'error' : 'warning'}
            variant="contained"
            disabled={!actionDialog.reason.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Detail Dialog */}
      <UserDetailDialog
        open={detailDialogOpen}
        user={selectedUser as any}
        onClose={handleCloseDetailDialog}
        onUserUpdated={fetchUsers}
      />

      {/* Action History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          User Action History {historyUserId && `(User ID: ${historyUserId})`}
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : actionHistory.length === 0 ? (
            <Alert severity="info">No action history found for this user.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                    <TableCell><strong>Performed By</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actionHistory.map((history: any) => (
                    <TableRow key={history.id}>
                      <TableCell>
                        {new Date(history.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={history.actionType || history.action || 'UNKNOWN'} 
                          size="small"
                          color={
                            (history.actionType || history.action || '')?.includes('LOCK') || 
                            (history.actionType || history.action || '')?.includes('DELETE') 
                              ? 'error' 
                              : (history.actionType || history.action || '')?.includes('UNLOCK') || 
                                (history.actionType || history.action || '')?.includes('UNSUSPEND')
                              ? 'success'
                              : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {history.performedBy?.username || 
                         history.performedBy?.email || 
                         history.adminUsername || 
                         'System'}
                      </TableCell>
                      <TableCell>{history.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Wallet Detail Dialog */}
      <UserWalletDetailDialog
        open={walletDetailDialog}
        onClose={() => {
          setWalletDetailDialog(false);
          setWalletUserId(null);
        }}
        userId={walletUserId || 0}
        userName={users.find(u => u.id === walletUserId)?.fullName}
      />
    </Box>
  );
};

export default AdminUsersPage;
