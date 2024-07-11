import React from 'react';
import { Box, Button } from '@mui/material';
import Link from 'next/link';

const Home = () => {
  return (
    <Box sx={{ padding: 2 }}>
      <Link href='/wallet' passHref>
        <Button variant='contained' fullWidth>
          Wallet
        </Button>
      </Link>
      <Link href='/transactions' passHref>
        <Button variant='contained' fullWidth>
          Transactions
        </Button>
      </Link>
    </Box>
  );
};

export default Home;
