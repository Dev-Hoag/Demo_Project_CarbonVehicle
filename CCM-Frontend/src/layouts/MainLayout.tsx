import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingIcon,
  ListAlt as ListIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const drawerWidth = 240;

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { title: 'Wallet', path: '/wallet', icon: <WalletIcon /> },
  { title: 'Payments', path: '/payments', icon: <PaymentIcon /> },
  { title: 'Listings', path: '/listings', icon: <ListIcon /> },
  { title: 'Transactions', path: '/transactions', icon: <ShoppingIcon /> },
  { title: 'Profile', path: '/profile', icon: <PersonIcon /> },
  { title: 'KYC Verification', path: '/kyc', icon: <VerifiedUserIcon /> },
  { title: 'Admin', path: '/admin', icon: <AdminIcon />, adminOnly: true },
];

export const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const drawer = (
    <Box>
      <Toolbar />
      <Divider />
      <List>
        {menuItems
          .filter(item => !item.adminOnly || user?.userType === 'CVA')
          .map(item => (
            <ListItem key={item.title} disablePadding>
              <ListItemButton onClick={() => handleNavigate(item.path)}>
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      bgcolor: 'background.default',
    }}>
      
      {/* FULL WIDTH APPBAR */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Carbon Credit Market
          </Typography>

          <IconButton onClick={handleMenuClick} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
              {user?.fullName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            <MenuItem onClick={() => { handleNavigate('/profile'); handleMenuClose(); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>

            <MenuItem onClick={() => { handleNavigate('/settings'); handleMenuClose(); }}>
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

      {/* DRAWER */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth },
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
              mt: '64px',
              height: 'calc(100% - 64px)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* MAIN CONTENT - FIXED */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          p: 3,
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;