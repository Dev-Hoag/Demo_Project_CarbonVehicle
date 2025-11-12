import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, useTheme } from '@mui/material';

export const AuthLayout: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
            >
              Carbon Credit Market
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Decarbonize the future, one credit at a time
            </Typography>
          </Box>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
