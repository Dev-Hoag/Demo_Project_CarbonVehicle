/**
 * Format number as VND currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format date to Vietnamese format
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Format date to short format (DD/MM/YYYY)
 */
export const formatDateShort = (date: string | Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get status color for MUI components
 */
export const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const statusLower = status.toLowerCase();
  
  if (['completed', 'approved', 'active', 'success'].includes(statusLower)) {
    return 'success';
  }
  if (['failed', 'rejected', 'cancelled', 'error'].includes(statusLower)) {
    return 'error';
  }
  if (['pending', 'processing'].includes(statusLower)) {
    return 'warning';
  }
  if (['expired', 'suspended'].includes(statusLower)) {
    return 'default';
  }
  
  return 'info';
};

/**
 * Delay function for async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};
