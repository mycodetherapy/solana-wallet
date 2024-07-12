import React, { useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ErrorSnackbarProps {
  errorMessage: string;
  clearError: (arg: string) => void;
}

const ErrorSnackbar: React.FC<ErrorSnackbarProps> = ({
  errorMessage,
  clearError,
}) => {
  const ERROR_DISPLAY_TIME = 6000;

  useEffect(() => {
    if (errorMessage) {
      let timer = setTimeout(() => {
        clearError('');
      }, ERROR_DISPLAY_TIME);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    clearError('');
  };

  return (
    <Snackbar
      open={!!errorMessage}
      autoHideDuration={ERROR_DISPLAY_TIME}
      onClose={handleClose}
    >
      <Alert onClose={handleClose} severity='error' sx={{ width: '100%' }}>
        {errorMessage}
      </Alert>
    </Snackbar>
  );
};

export default ErrorSnackbar;
