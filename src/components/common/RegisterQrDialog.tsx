import React from 'react';
import { Box, Dialog, IconButton } from '@mui/material';
import { QrCode as QrCodeIcon, X } from 'lucide-react';
import QRCode from '../functional/QRCode';
import { ArcadeTypography } from '../ui';
import { ARCADE_COLORS } from '../../theme/theme';

/**
 * Venue helper: shows a scannable QR code that points at the registration page,
 * so a player standing at a station can sign up on their own phone.
 * The URL is derived from the current origin, so both the local dev server and
 * the deployed CloudFront domain produce a scannable code without any config.
 */
const registerUrl = (): string => `${window.location.origin}/register`;

interface RegisterQrDialogProps {
  open: boolean;
  onClose: () => void;
}

const RegisterQrDialog: React.FC<RegisterQrDialogProps> = ({ open, onClose }) => {
  const url = registerUrl();
  const color = ARCADE_COLORS.lime;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            // Sized to the content on purpose. The MUI default (maxWidth="xs" +
            // fullWidth) is 444px wide, and the QR card is only ~250px, so it
            // left a fat dead gutter beside the card.
            width: 344,
            maxWidth: '92vw',
            display: 'flex',
            flexDirection: 'column',
            // Centre every row with flexbox. Relying on the inherited text-align
            // does not reliably centre a non-block child, which is what pushed
            // the QR card off to one side.
            alignItems: 'center',
            backgroundColor: '#050510',
            backgroundImage: 'none',
            border: `2px solid ${color}70`,
            borderRadius: '6px',
            boxShadow: `0 0 30px ${color}40, inset 0 0 40px ${color}08`,
            px: 2.5,
            py: 2.5,
            m: 2,
            textAlign: 'center',
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        size="small"
        aria-label="close"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          color: `${ARCADE_COLORS.white}50`,
          transition: 'color 0.2s ease',
          '&:hover': { color: ARCADE_COLORS.red, backgroundColor: `${ARCADE_COLORS.red}12` },
        }}
      >
        <X size={18} />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%', mb: 1.5 }}>
        <QrCodeIcon size={18} color={color} />
        <ArcadeTypography arcadeSize="xs" arcadeColor="lime" component="span" sx={{ letterSpacing: '0.15em' }}>
          NEW PLAYER?
        </ArcadeTypography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <QRCode value={url} size={190} />
      </Box>
    </Dialog>
  );
};

export default RegisterQrDialog;
