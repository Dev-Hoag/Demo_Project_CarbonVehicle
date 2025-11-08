import React from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

/**
 * MainLayout Component
 * Main layout with header and content area
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children, title = 'Carbon Credit Marketplace' }) => {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {user && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {user.email}
              </Typography>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
    </Box>
  );
};

export default MainLayout;
