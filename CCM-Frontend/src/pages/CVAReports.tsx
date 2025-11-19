/**
 * CVA Reports Page
 * Báo cáo tín chỉ đã phát hành dành cho CVA
 */

import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  Button,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import {
  Download,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Assessment,
  TrendingUp,
  Speed,
} from '@mui/icons-material';
import { cvaReportsApi, type CVACreditReport } from '../api/cva-reports';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const CVAReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<CVACreditReport | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await cvaReportsApi.getCreditIssuanceReport({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setReport(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load CVA report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const blob = await cvaReportsApi.exportReportCSV({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cva_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load report data</Alert>
      </Box>
    );
  }

  const { summary, monthly_issuance, verifier_performance } = report;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            CVA Credit Issuance Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {report.report_period}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Generated at: {new Date(report.generated_at).toLocaleString()}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportCSV}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </Box>

      {/* Date Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box flex="1" minWidth="200px">
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box flex="1" minWidth="200px">
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box flex="1" minWidth="200px">
              <Button variant="contained" fullWidth onClick={fetchReport}>
                Apply Filters
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Box display="flex" gap={3} flexWrap="wrap" mb={3}>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Verifications
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {summary.total_verifications}
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {summary.approved_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary.approval_rate}% approval rate
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Credits Issued
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {summary.total_credits_issued.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    tonnes CO₂e
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    CO₂ Saved
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {summary.total_co2_saved_kg.toFixed(0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kg CO₂
                  </Typography>
                </Box>
                <Speed sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {summary.pending_count}
                  </Typography>
                </Box>
                <HourglassEmpty sx={{ fontSize: 30, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {summary.rejected_count}
                  </Typography>
                </Box>
                <Cancel sx={{ fontSize: 30, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Monthly Issuance Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Monthly Credit Issuance
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly_issuance.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_credits" fill="#1976d2" name="Credits Issued" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Issuance Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Monthly Breakdown
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Approved</TableCell>
                  <TableCell align="right">Credits Issued</TableCell>
                  <TableCell align="right">CO₂ Saved (kg)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthly_issuance.map((row) => (
                  <TableRow key={`${row.year}-${row.month}`}>
                    <TableCell>
                      {row.month_name} {row.year}
                    </TableCell>
                    <TableCell align="right">{row.approved_count}</TableCell>
                    <TableCell align="right">{row.total_credits.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.total_co2_kg.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Verifier Performance */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Verifier Performance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Verifier ID</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Approved</TableCell>
                  <TableCell align="right">Rejected</TableCell>
                  <TableCell align="right">Pending</TableCell>
                  <TableCell align="right">Credits Issued</TableCell>
                  <TableCell align="right">Avg Time (hours)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {verifier_performance.map((row) => (
                  <TableRow key={row.verifier_id}>
                    <TableCell>
                      <Chip label={row.verifier_id} size="small" />
                    </TableCell>
                    <TableCell align="right">{row.total_verifications}</TableCell>
                    <TableCell align="right">
                      <Typography color="success.main">{row.approved_count}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="error.main">{row.rejected_count}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="warning.main">{row.pending_count}</Typography>
                    </TableCell>
                    <TableCell align="right">{row.total_credits_issued.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {row.avg_processing_time_hours?.toFixed(1) || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CVAReportsPage;
