import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Keypair, Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import Cookies from 'js-cookie';

interface WalletInfo {
  publicKey: string;
  secretKey: number[];
  balance: number;
}

const Wallet = () => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  useEffect(() => {
    const savedWallets = Cookies.get('wallets');
    if (savedWallets) {
      const parsedWallets: WalletInfo[] = JSON.parse(savedWallets);
      updateWalletBalances(parsedWallets);
    }
  }, []);

  const updateWalletBalances = async (wallets: WalletInfo[]) => {
    const updatedWallets = await Promise.all(
      wallets.map(async (wallet) => {
        const balance = await connection.getBalance(
          new PublicKey(wallet.publicKey)
        );
        return { ...wallet, balance };
      })
    );
    setWallets(updatedWallets);
    Cookies.set('wallets', JSON.stringify(updatedWallets));
  };

  const airdropSol = async (publicKey: string) => {
    const response = await fetch(`https://api.devnet.solana.com`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'requestAirdrop',
        params: [publicKey, 1e9],
      }),
    });
    const json = await response.json();
    await connection.confirmTransaction(json.result);
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance;
  };

  const createWallet = async () => {
    const newKeypair = Keypair.generate();
    const balance = await airdropSol(newKeypair.publicKey.toBase58());

    const newWallet = {
      publicKey: newKeypair.publicKey.toBase58(),
      secretKey: Array.from(newKeypair.secretKey),
      balance,
    };

    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    Cookies.set('wallets', JSON.stringify(updatedWallets));
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 2,
        }}
      >
        <Button variant='contained' onClick={createWallet}>
          Create Wallet
        </Button>
      </Box>
      {wallets.reverse().map((wallet, index) => (
        <Box key={index} sx={{ marginBottom: 2 }}>
          <Typography variant='body1'>Address: {wallet.publicKey}</Typography>
          <Typography variant='body1'>
            Balance: {wallet.balance / 1e9} SOL
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default Wallet;
