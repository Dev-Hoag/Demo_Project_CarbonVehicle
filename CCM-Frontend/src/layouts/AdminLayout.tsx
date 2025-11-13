import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  VerifiedUser as VerifiedUserIcon,
  AccountBalanceWallet as WalletIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  MonetizationOn as MoneyIcon,
  SwapHoriz as TransactionIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

interface AdminMenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const menuItems: AdminMenuItem[] = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { title: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
  { title: 'KYC Management', path: '/admin/kyc', icon: <VerifiedUserIcon /> },
  { title: 'Withdrawals', path: '/admin/withdrawals', icon: <MoneyIcon /> },
  { title: 'Transactions', path: '/admin/transactions', icon: <TransactionIcon /> },
  { title: 'Wallets', path: '/admin/wallets', icon: <WalletIcon /> },
  { title: 'Reports', path: '/admin/reports', icon: <AssessmentIcon /> },
];

export const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get admin user from localStorage
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const adminToken = localStorage.getItem('adminToken');

  React.useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
    }
  }, [adminToken, navigate]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Logo/Title */}
      <Box sx={{ p: 2, bgcolor: 'primary.dark' }}>
        <Typography variant="h6" color="white" fontWeight={700}>
          🛡️ Admin Panel
        </Typography>
        <Typography variant="caption" color="grey.300">
          Carbon Credit Market
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? 'inherit' : 'text.secondary' }}>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Admin Info */}
      <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Logged in as
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {adminUser.email || 'Admin'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'primary.dark',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Admin Dashboard
          </Typography>

          <IconButton onClick={handleMenuClick} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
              {adminUser.email?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            <MenuItem onClick={() => { handleNavigate('/admin/settings'); handleMenuClose(); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              mt: '64px',
              height: 'calc(100% - 64px)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          p: 3,
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
