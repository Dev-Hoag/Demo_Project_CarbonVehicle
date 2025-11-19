// File: src/components/NotificationBell.tsx
// Component hiển thị icon chuông notification ở header

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  Button,
  Avatar,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  NotificationsNone,
  DoneAll,
  CheckCircle,
  Error,
  Info,
  Warning,
  LocalShipping,
  ShoppingCart,
  AttachMoney,
  AccountBalance,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  notificationApi,
  type Notification,
  NotificationStatus,
  NotificationType,
} from '../api/notification';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use ref to prevent double connection in React StrictMode
  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    const userId = user.id.toString();
    
    try {
      setLoading(true);
      
      // Get unread count
      const countResponse = await notificationApi.getUnreadCount(userId);
      setUnreadCount(countResponse.data.count);
      
      // Get recent notifications (latest 5)
      const response = await notificationApi.getAll(userId, { page: 1, limit: 5 });
      setRecentNotifications(response.data.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    // Convert numeric userId to UUID format (00000000-0000-0000-0000-000000000038)
    const userId = `00000000-0000-0000-0000-${String(user.id).padStart(12, '0')}`;
    
    // Prevent double connection in React StrictMode
    if (isConnectingRef.current || socketRef.current?.connected) {
      return;
    }
    
    isConnectingRef.current = true;
    
    // Initial fetch
    fetchNotifications();
    
    // 🔥 Connect to WebSocket for real-time notifications
    const newSocket = io('http://localhost:3010/notifications', {
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to notification WebSocket', newSocket.id);
      isConnectingRef.current = false;
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add to recent notifications
      setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast
      toast.success(`New notification: ${notification.title}`, {
        duration: 4000,
        icon: '🔔',
      });
    });

    newSocket.on('unread-count', ({ count }: { count: number }) => {
      console.log('📊 Unread count updated:', count);
      setUnreadCount(count);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notification WebSocket:', reason);
      isConnectingRef.current = false;
    });

    newSocket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      isConnectingRef.current = false;
    });

    socketRef.current = newSocket;

    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      isConnectingRef.current = false;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    if (!user?.id) return;
    const userId = user.id.toString();
    try {
      await notificationApi.markAsRead(notificationId, userId);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    const userId = user.id.toString();
    try {
      await notificationApi.markAllAsRead(userId);
      toast.success('All notifications marked as read');
      fetchNotifications();
      handleClose();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === NotificationStatus.SENT) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.TRIP_VERIFIED:
        navigate('/trips');
        break;
      case NotificationType.LISTING_CREATED:
      case NotificationType.LISTING_SOLD:
        navigate('/listings');
        break;
      case NotificationType.PAYMENT_COMPLETED:
      case NotificationType.CREDIT_ISSUED:
      case NotificationType.WITHDRAWAL_APPROVED:
      case NotificationType.WITHDRAWAL_REJECTED:
        navigate('/wallet');
        break;
      default:
        navigate('/notifications');
    }
    
    handleClose();
  };

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TRIP_VERIFIED:
        return <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />;
      case NotificationType.LISTING_CREATED:
        return <ShoppingCart sx={{ color: '#1976d2', fontSize: 20 }} />;
      case NotificationType.LISTING_SOLD:
        return <LocalShipping sx={{ color: '#f57c00', fontSize: 20 }} />;
      case NotificationType.PAYMENT_COMPLETED:
        return <AttachMoney sx={{ color: '#4caf50', fontSize: 20 }} />;
      case NotificationType.CREDIT_ISSUED:
        return <AccountBalance sx={{ color: '#9c27b0', fontSize: 20 }} />;
      case NotificationType.WITHDRAWAL_APPROVED:
        return <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />;
      case NotificationType.WITHDRAWAL_REJECTED:
        return <Error sx={{ color: '#d32f2f', fontSize: 20 }} />;
      case NotificationType.USER_REGISTERED:
        return <PersonAdd sx={{ color: '#1976d2', fontSize: 20 }} />;
      case NotificationType.SYSTEM_ALERT:
        return <Warning sx={{ color: '#ff9800', fontSize: 20 }} />;
      default:
        return <Info sx={{ color: '#0288d1', fontSize: 20 }} />;
    }
  };

  // Format time ago
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {unreadCount > 0 ? (
            <Notifications />
          ) : (
            <NotificationsNone />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1.5,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box px={2} py={1.5} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} new`}
              color="error"
              size="small"
              sx={{ height: 24, fontSize: '0.75rem' }}
            />
          )}
        </Box>

        <Divider />

        {/* Actions */}
        {unreadCount > 0 && [
          <Box key="actions" px={2} py={1}>
            <Button
              size="small"
              startIcon={<DoneAll />}
              onClick={handleMarkAllAsRead}
              fullWidth
              variant="outlined"
            >
              Mark all as read
            </Button>
          </Box>,
          <Divider key="divider" />
        ]}

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={30} />
            </Box>
          ) : recentNotifications.length === 0 ? (
            <Box textAlign="center" py={4} px={2}>
              <NotificationsNone sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            recentNotifications.map((notification, index) => (
              <div key={notification.id}>
                {index > 0 && <Divider />}
                <MenuItem
                    onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    alignItems: 'flex-start',
                    backgroundColor:
                      notification.status === NotificationStatus.SENT
                        ? 'rgba(25, 118, 210, 0.05)'
                        : 'transparent',
                    borderLeft:
                      notification.status === NotificationStatus.SENT
                        ? '3px solid #1976d2'
                        : '3px solid transparent',
                    '&:hover': {
                      backgroundColor:
                        notification.status === NotificationStatus.SENT
                          ? 'rgba(25, 118, 210, 0.1)'
                          : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight:
                            notification.status === NotificationStatus.SENT ? 600 : 400,
                          mb: 0.5,
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                          {getTimeAgo(notification.createdAt)}
                        </Typography>
                      </Stack>
                    }
                  />
                  {notification.status === NotificationStatus.SENT && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#1976d2',
                        ml: 1,
                        mt: 1,
                      }}
                    />
                  )}
                </MenuItem>
              </div>
            ))
          )}
        </Box>

        {/* Footer */}
        {recentNotifications.length > 0 && [
          <Divider key="footer-divider" />,
          <Box key="footer-box" px={2} py={1.5}>
            <Button
              fullWidth
              size="small"
              onClick={handleViewAll}
              sx={{ textTransform: 'none' }}
            >
              View all notifications
            </Button>
          </Box>
        ]}
      </Menu>
    </>
  );
};

export default NotificationBell;