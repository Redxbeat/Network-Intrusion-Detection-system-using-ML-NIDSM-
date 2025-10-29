import { toast } from 'react-toastify';

// Default error messages for different HTTP status codes
export const HTTP_ERROR_MESSAGES = {
  400: 'Invalid request data',
  401: 'Unauthorized - please login',
  403: 'Access forbidden',
  404: 'Resource not found',
  500: 'Internal server error',
  502: 'Bad gateway',
  503: 'Service unavailable',
  504: 'Gateway timeout',
};

// Determine if we should retry based on error type
export const shouldRetry = (error) => {
  if (!error.response) {
    // Network error or timeout - good candidate for retry
    return true;
  }

  const status = error.response.status;
  // Only retry on specific status codes
  return [408, 429, 500, 502, 503, 504].includes(status);
};

// Get a human-readable error message
export const getErrorMessage = (error) => {
  if (!error.response) {
    return 'Network error - please check your connection';
  }

  const status = error.response.status;
  const message = error.response.data?.message;

  // Use custom message from API if available, otherwise fallback to default
  return message || HTTP_ERROR_MESSAGES[status] || 'An unexpected error occurred';
};

// Show error toast with custom styling based on error type
export const showErrorToast = (error, options = {}) => {
  const { hideToast = false } = options;
  
  if (hideToast) {
    return;
  }

  const message = getErrorMessage(error);
  const isNetworkError = !error.response;

  toast.error(message, {
    position: "top-right",
    autoClose: isNetworkError ? 10000 : 5000, // Show network errors longer
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Configure retry delays with exponential backoff
export const getRetryDelay = (retryCount) => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 10000; // 10 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  
  // Add some randomness to prevent thundering herd
  return delay + (Math.random() * 1000);
};