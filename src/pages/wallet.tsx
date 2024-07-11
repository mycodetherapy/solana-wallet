import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
} from '@mui/material';
import { Keypair, Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { useRouter } from 'next/router';
import { ContentCopy } from '@mui/icons-material';

interface WalletInfo {
  publicKey: string;
  secretKey: number[];
  balance: number;
}

const Wallet = () => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const router = useRouter();

  useEffect(() => {
    const savedWallets = localStorage.getItem('wallets');
    const savedSelectedWallet = localStorage.getItem('selectedWallet');
    if (savedWallets) {
      const parsedWallets: WalletInfo[] = JSON.parse(savedWallets);
      setWallets(parsedWallets);
      if (parsedWallets.length > 0) {
        const wallet = parsedWallets?.find(
          (w) => w.publicKey === savedSelectedWallet
        );
        setSelectedWallet(wallet || parsedWallets[0]);
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
    if (selectedWallet) {
      const updatedWallet =
        updatedWallets.find((w) => w.publicKey === selectedWallet.publicKey) ||
        null;
      setSelectedWallet(updatedWallet);
    }
    localStorage.setItem('wallets', JSON.stringify(updatedWallets));
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
    setSelectedWallet(newWallet);
    localStorage.setItem('wallets', JSON.stringify(updatedWallets));
    localStorage.setItem('selectedWallet', newWallet.publicKey);
  };

  const handleSelectWallet = (wallet: WalletInfo) => {
    setSelectedWallet(wallet);
    localStorage.setItem('selectedWallet', wallet.publicKey);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        console.log('Copied to clipboard successfully!');
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
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
        {selectedWallet && (
          <>
            <Typography variant='h6'>
              Balance: {selectedWallet.balance / 1e9} SOL
            </Typography>
            <Button
              variant='contained'
              onClick={() =>
                router.push(
                  `/transactions?publicKey=${selectedWallet.publicKey}`
                )
              }
            >
              CREATE TRANSACTION
            </Button>
          </>
        )}
      </Box>
      <List>
        {wallets.map((wallet, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton
              selected={
                wallet.publicKey ===
                (selectedWallet && selectedWallet.publicKey)
              }
              onClick={() => handleSelectWallet(wallet)}
              sx={{
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <ListItemText
                sx={{ wordBreak: 'break-all' }}
                primary={`Address: ${wallet.publicKey}`}
              />
              <IconButton
                onClick={() =>
                  copyToClipboard(selectedWallet?.publicKey.toString() || '')
                }
              >
                <ContentCopy />
              </IconButton>
              <Typography variant='body1'>
                Balance: {wallet.balance / 1e9} SOL
              </Typography>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {/* Warning danger!!! */}
      {selectedWallet && (
        <>
          <Typography
            variant='body2'
            sx={{
              backgroundColor: '#A6BDD7',
              padding: 2,
              border: '1px solid',
              borderRadius: 1,
              wordBreak: 'break-all',
            }}
          >
            Private Key: {selectedWallet?.secretKey.toString()}
            <IconButton
              onClick={() =>
                copyToClipboard(selectedWallet?.secretKey.toString() || '')
              }
            >
              <ContentCopy />
            </IconButton>
          </Typography>
        </>
      )}
    </Box>
  );
};

export default Wallet;
