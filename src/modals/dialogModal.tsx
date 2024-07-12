import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  content: string;
  acceptTitle: string;
  cancelAction: () => void;
  acceptAction: () => void;
}

export const DialogModal: React.FC<ConfirmationModalProps> = ({
  open,
  cancelAction,
  acceptAction,
  acceptTitle,
  title,
  content,
}) => {
  return (
    <Dialog open={open} onClose={acceptAction}>
      <DialogTitle sx={{ textAlign: 'center' }}>{title}</DialogTitle>
      <DialogContent
        sx={{
          fontFamily: 'Arial, sans-serif',
          whiteSpace: 'pre-line',
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        {content.split('\n').map((line, index) => (
          <Typography key={index} sx={{ marginBottom: 1.5 }}>
            {line
              .split('"')
              .map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button onClick={cancelAction} color='primary'>
          Cancell
        </Button>
        <Button onClick={acceptAction} color='primary'>
          {acceptTitle}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
