// File: src/components/NotificationPreferences.tsx
// Dialog cài đặt preferences cho notifications

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Email,
  Sms,
  PhoneIphone,
  Notifications,
} from '@mui/icons-material';
import { notificationApi } from '../api/notification';
import toast from 'react-hot-toast';

interface NotificationPreferencesDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationPreferencesDialog: React.FC<NotificationPreferencesDialogProps> = ({
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
  });

  useEffect(() => {
    if (open) {
      fetchPreferences();
    }
  }, [open]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getPreferences();
      setPreferences(response.data);
    } catch (err) {
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await notificationApi.updatePreferences(preferences);
      toast.success('Preferences updated successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Notification Preferences</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} mt={1}>
            <Alert severity="info">
              Control which channels you want to receive notifications through.
            </Alert>

            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Email color="action" />
                    <Box>
                      <Typography variant="subtitle2">Email Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications via email
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant={preferences.emailEnabled ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() =>
                      setPreferences({ ...preferences, emailEnabled: !preferences.emailEnabled })
                    }
                  >
                    {preferences.emailEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Sms color="action" />
                    <Box>
                      <Typography variant="subtitle2">SMS Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications via SMS
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant={preferences.smsEnabled ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() =>
                      setPreferences({ ...preferences, smsEnabled: !preferences.smsEnabled })
                    }
                  >
                    {preferences.smsEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <PhoneIphone color="action" />
                    <Box>
                      <Typography variant="subtitle2">Push Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive push notifications on your device
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant={preferences.pushEnabled ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() =>
                      setPreferences({ ...preferences, pushEnabled: !preferences.pushEnabled })
                    }
                  >
                    {preferences.pushEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Notifications color="action" />
                    <Box>
                      <Typography variant="subtitle2">In-App Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show notifications inside the app
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant={preferences.inAppEnabled ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() =>
                      setPreferences({ ...preferences, inAppEnabled: !preferences.inAppEnabled })
                    }
                  >
                    {preferences.inAppEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationPreferencesDialog;