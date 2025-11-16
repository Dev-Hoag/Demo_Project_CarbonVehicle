import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Flag as FlagIcon,
  RemoveCircle as UnflagIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Gavel as AuctionIcon,
  AttachMoney as FixedPriceIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { adminListingsApi, type ManagedListing, type ListingFilters } from '../../api/admin-listings';

export const AdminListingsPage: React.FC = () => {
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [ownerIdFilter, setOwnerIdFilter] = useState('');

  // Dialogs
  const [selectedListing, setSelectedListing] = useState<ManagedListing | null>(null);
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [flagDialog, setFlagDialog] = useState(false);
  const [unflagDialog, setUnflagDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form data
  const [reason, setReason] = useState('');
  const [flagType, setFlagType] = useState('');

  useEffect(() => {
    loadListings();
  }, [page, rowsPerPage, statusFilter, typeFilter]);

  const loadListings = async () => {
    setLoading(true);
    try {
      // Only include non-empty filters
      const filters: ListingFilters = {};
      if (statusFilter && statusFilter !== '') filters.status = statusFilter as any;
      if (typeFilter && typeFilter !== '') filters.listingType = typeFilter as any;
      if (ownerIdFilter && ownerIdFilter.trim() !== '') filters.ownerId = ownerIdFilter.trim();

      console.log('Loading listings with filters:', filters);
      const response = await adminListingsApi.getAll(page + 1, rowsPerPage, filters);
      console.log('Listings API response:', response.data);

      const actualData = response.data.data || response.data;
      if (actualData.data) {
        setListings(actualData.data);
        setTotal(actualData.total || 0);
      } else if (Array.isArray(actualData)) {
        setListings(actualData);
        setTotal(actualData.length);
      } else {
        setListings([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('Failed to load listings:', error);
      console.error('Error response data:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to load listings';
      toast.error(errorMsg);
      setListings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadListings();
  };

  const handleReset = () => {
    setStatusFilter('');
    setTypeFilter('');
    setOwnerIdFilter('');
    setPage(0);
    loadListings();
  };

  const handleOpenDialog = (listing: ManagedListing, dialogType: string) => {
    setSelectedListing(listing);
    setReason('');
    setFlagType('');
    
    switch (dialogType) {
      case 'suspend':
        setSuspendDialog(true);
        break;
      case 'activate':
        setActivateDialog(true);
        break;
      case 'flag':
        setFlagDialog(true);
        break;
      case 'unflag':
        setUnflagDialog(true);
        break;
      case 'detail':
        setDetailDialog(true);
        break;
    }
  };

  const handleCloseDialogs = () => {
    setSuspendDialog(false);
    setActivateDialog(false);
    setFlagDialog(false);
    setUnflagDialog(false);
    setDetailDialog(false);
    setSelectedListing(null);
    setReason('');
    setFlagType('');
  };

  const handleSuspend = async () => {
    if (!selectedListing || !reason) {
      toast.error('Please provide a reason');
      return;
    }

    setProcessing(true);
    try {
      await adminListingsApi.suspend(selectedListing.id, { reason });
      toast.success('Listing suspended successfully');
      handleCloseDialogs();
      loadListings();
    } catch (error: any) {
      console.error('Suspend failed:', error);
      toast.error(error.response?.data?.message || 'Failed to suspend listing');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedListing || !reason) {
      toast.error('Please provide a reason');
      return;
    }

    setProcessing(true);
    try {
      await adminListingsApi.activate(selectedListing.id, { reason });
      toast.success('Listing activated successfully');
      handleCloseDialogs();
      loadListings();
    } catch (error: any) {
      console.error('Activate failed:', error);
      toast.error(error.response?.data?.message || 'Failed to activate listing');
    } finally {
      setProcessing(false);
    }
  };

  const handleFlag = async () => {
    if (!selectedListing || !flagType || !reason) {
      toast.error('Please fill in all fields');
      return;
    }

    setProcessing(true);
    try {
      await adminListingsApi.flag(selectedListing.id, { flagType, reason });
      toast.success('Listing flagged successfully');
      handleCloseDialogs();
      loadListings();
    } catch (error: any) {
      console.error('Flag failed:', error);
      toast.error(error.response?.data?.message || 'Failed to flag listing');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnflag = async () => {
    if (!selectedListing || !reason) {
      toast.error('Please provide a reason');
      return;
    }

    setProcessing(true);
    try {
      await adminListingsApi.unflag(selectedListing.id, { reason });
      toast.success('Listing unflagged successfully');
      handleCloseDialogs();
      loadListings();
    } catch (error: any) {
      console.error('Unflag failed:', error);
      toast.error(error.response?.data?.message || 'Failed to unflag listing');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SOLD': return 'info';
      case 'CANCELLED': return 'default';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          📋 Listings Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          UC10, UC11: Monitor, suspend, activate, and flag carbon credit listings
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="SOLD">Sold</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="FIXED_PRICE">Fixed Price</MenuItem>
                <MenuItem value="AUCTION">Auction</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Owner ID (UUID)"
              value={ownerIdFilter}
              onChange={(e) => setOwnerIdFilter(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
              Search
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset}>
              Reset
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Listing ID</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="right">Amount (kg CO₂)</TableCell>
                <TableCell align="right">Price/kg</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Flag</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !listings || listings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No listings found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                listings.map((listing) => (
                  <TableRow key={listing.id} hover>
                    <TableCell>{listing.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {listing.externalListingId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {listing.ownerId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{Number(listing.creditsAmount).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(listing.pricePerCredit).toLocaleString()} ₫</TableCell>
                    <TableCell>
                      <Chip
                        icon={listing.listingType === 'AUCTION' ? <AuctionIcon /> : <FixedPriceIcon />}
                        label={listing.listingType === 'AUCTION' ? 'Auction' : 'Fixed'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={listing.status}
                        color={getStatusColor(listing.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {listing.flagType ? (
                        <Chip
                          label={listing.flagType}
                          color="warning"
                          size="small"
                          icon={<FlagIcon />}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{formatDate(listing.createdAt)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(listing, 'detail')}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {listing.status === 'ACTIVE' && (
                          <Tooltip title="Suspend">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDialog(listing, 'suspend')}
                            >
                              <SuspendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {listing.status === 'SUSPENDED' && (
                          <Tooltip title="Activate">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenDialog(listing, 'activate')}
                            >
                              <ActivateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {!listing.flagType ? (
                          <Tooltip title="Flag">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleOpenDialog(listing, 'flag')}
                            >
                              <FlagIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Unflag">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(listing, 'unflag')}
                            >
                              <UnflagIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
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
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>🚫 Suspend Listing</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Listing: <strong>{selectedListing.externalListingId.substring(0, 16)}...</strong>
                </Typography>
                <Typography variant="body2">
                  This will suspend the listing and notify the owner.
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Reason *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={4}
                placeholder="Explain why this listing is being suspended..."
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleSuspend}
            variant="contained"
            color="error"
            disabled={processing || !reason}
          >
            {processing ? 'Processing...' : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={activateDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>✅ Activate Listing</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Listing: <strong>{selectedListing.externalListingId.substring(0, 16)}...</strong>
                </Typography>
                <Typography variant="body2">
                  This will reactivate the listing and notify the owner.
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Reason *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={4}
                placeholder="Explain why this listing is being activated..."
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleActivate}
            variant="contained"
            color="success"
            disabled={processing || !reason}
          >
            {processing ? 'Processing...' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>🚩 Flag Listing</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Listing: <strong>{selectedListing.externalListingId.substring(0, 16)}...</strong>
                </Typography>
                <Typography variant="body2">
                  Flag this listing for review.
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Flag Type *</InputLabel>
                <Select
                  value={flagType}
                  onChange={(e) => setFlagType(e.target.value)}
                  label="Flag Type *"
                >
                  <MenuItem value="SUSPICIOUS_PRICE">Suspicious Price</MenuItem>
                  <MenuItem value="FRAUDULENT">Fraudulent</MenuItem>
                  <MenuItem value="POLICY_VIOLATION">Policy Violation</MenuItem>
                  <MenuItem value="SPAM">Spam</MenuItem>
                  <MenuItem value="INAPPROPRIATE">Inappropriate Content</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Reason *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={4}
                placeholder="Describe the issue..."
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleFlag}
            variant="contained"
            color="warning"
            disabled={processing || !flagType || !reason}
          >
            {processing ? 'Processing...' : 'Flag'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unflag Dialog */}
      <Dialog open={unflagDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>⚪ Unflag Listing</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Listing: <strong>{selectedListing.externalListingId.substring(0, 16)}...</strong>
                </Typography>
                <Typography variant="body2">
                  Current Flag: <strong>{selectedListing.flagType}</strong>
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Reason *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={4}
                placeholder="Explain why this flag is being removed..."
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleUnflag}
            variant="contained"
            disabled={processing || !reason}
          >
            {processing ? 'Processing...' : 'Unflag'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <DialogTitle>📋 Listing Details</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Listing ID</Typography>
                  <Typography variant="body2" fontFamily="monospace">{selectedListing.externalListingId}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Owner ID</Typography>
                  <Typography variant="body2" fontFamily="monospace">{selectedListing.ownerId}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Credits Amount</Typography>
                  <Typography variant="body2">{Number(selectedListing.creditsAmount).toFixed(2)} kg CO₂</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Price per kg</Typography>
                  <Typography variant="body2">{Number(selectedListing.pricePerCredit).toLocaleString()} ₫</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2">{selectedListing.listingType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={selectedListing.status} color={getStatusColor(selectedListing.status) as any} size="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Typography variant="body2">{formatDate(selectedListing.createdAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Last Synced</Typography>
                  <Typography variant="body2">{formatDate(selectedListing.syncedAt)}</Typography>
                </Box>
              </Box>

              {selectedListing.suspensionReason && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity="warning">
                    <Typography variant="caption" fontWeight={600}>Suspension Reason:</Typography>
                    <Typography variant="body2">{selectedListing.suspensionReason}</Typography>
                  </Alert>
                </Box>
              )}

              {selectedListing.flagType && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="error">
                    <Typography variant="caption" fontWeight={600}>Flag: {selectedListing.flagType}</Typography>
                    <Typography variant="body2">{selectedListing.flagReason}</Typography>
                  </Alert>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminListingsPage;
