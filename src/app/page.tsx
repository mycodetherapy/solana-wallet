import React from 'react';
import { Box, Button } from '@mui/material';
import Link from 'next/link';

const Home = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 2 }}>
      <Link href='/wallet' passHref>
        <Button variant='contained' fullWidth size='large'>
          Wallets
        </Button>
      </Link>
      <Link href='/transactions' passHref>
        <Button variant='contained' fullWidth size='large'>
          Transactions
        </Button>
      </Link>
    </Box>
  );
};

export default Home;
