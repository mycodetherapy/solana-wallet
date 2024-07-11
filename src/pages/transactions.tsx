import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import {
  Keypair,
  Connection,
  clusterApiUrl,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
} from '@solana/web3.js';
import Cookies from 'js-cookie';

interface WalletInfo {
  publicKey: string;
  secretKey: number[];
  balance: number;
}

const Transactions = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  useEffect(() => {
    const savedWallets = Cookies.get('wallets');
    if (savedWallets) {
      const parsedWallets: WalletInfo[] = JSON.parse(savedWallets);
      setWallets(parsedWallets);
      if (parsedWallets.length > 0) {
        setWallet(parsedWallets[parsedWallets.length - 1]);
      }
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
    if (wallet) {
      const updatedWallet =
        updatedWallets.find((w) => w.publicKey === wallet.publicKey) || null;
      setWallet(updatedWallet);
    }
    Cookies.set('wallets', JSON.stringify(updatedWallets));
  };

  const sendTransaction = async () => {
    if (!wallet) return;

    const secretKey = Uint8Array.from(wallet.secretKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(recipient),
        lamports: parseFloat(amount) * 1e9,
      })
    );

    await sendAndConfirmTransaction(connection, transaction, [keypair]);
    await updateWalletBalances(wallets);
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
        <Button variant='contained' onClick={() => window.history.back()}>
          Back
        </Button>
        <Typography variant='h6'>
          Balance: {wallet ? wallet.balance / 1e9 : '0'} SOL
        </Typography>
      </Box>
      <Box sx={{ marginBottom: 2 }}>
        <TextField
          label='Amount (SOL)'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
        />
      </Box>
      <Box sx={{ marginBottom: 2 }}>
        <TextField
          label='Recipient Address'
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          fullWidth
        />
      </Box>
      <Button variant='contained' onClick={sendTransaction}>
        Send
      </Button>
    </Box>
  );
};

export default Transactions;
