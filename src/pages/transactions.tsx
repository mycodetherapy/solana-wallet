import React, { useState, useEffect } from 'react';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import {
  Keypair,
  Connection,
  clusterApiUrl,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
} from '@solana/web3.js';
import { useRouter } from 'next/router';
import ErrorSnackbar from '@/SnackBars/ErrorSnackbar';

interface WalletInfo {
  publicKey: string;
  secretKey: number[];
  balance: number;
}

const Transactions = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [allWallets, setAllWallets] = useState<WalletInfo[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const router = useRouter();

  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const parsedWallets: WalletInfo[] = JSON.parse(savedWallets);
      setAllWallets(parsedWallets);

      if (parsedWallets.length > 0) {
        const selectedWallet = parsedWallets.find(
          (w) => w.publicKey === (router.query.publicKey as string)
        );
        setWallet(selectedWallet || parsedWallets[0]);
      }
      updateWalletBalances(parsedWallets);
    }
  }, [router.query.publicKey]);

  const updateWalletBalances = async (wallets: WalletInfo[]) => {
    setLoading(true);
    try {
      const updatedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          const balance = await connection.getBalance(
            new PublicKey(wallet.publicKey)
          );
          return { ...wallet, balance };
        })
      );
      setAllWallets(updatedWallets);
      if (wallet) {
        const updatedWallet =
          updatedWallets.find((w) => w.publicKey === wallet.publicKey) || null;
        setWallet(updatedWallet);
      }
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendTransaction = async () => {
    if (!wallet) return;
    setLoading(true);
    const secretKey = Uint8Array.from(wallet.secretKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(recipient),
        lamports: parseFloat(amount) * 1e9,
      })
    );
    try {
      await sendAndConfirmTransaction(connection, transaction, [keypair]);
      await updateWalletBalances(allWallets);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color='primary' size={80} />
      </Backdrop>
      <Box sx={{ padding: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Button variant='contained' onClick={() => router.back()}>
            Back
          </Button>
          <Typography variant='h6'>
            Balance: {wallet ? wallet.balance / 1e9 : '0'} SOL
          </Typography>
        </Box>
        <Box sx={{ marginBottom: 2, maxWidth: '50%' }}>
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
      <ErrorSnackbar errorMessage={error} clearError={setError} />
    </>
  );
};

export default Transactions;
