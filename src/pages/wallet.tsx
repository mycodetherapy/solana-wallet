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
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { Keypair, Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { useRouter } from 'next/router';
import { ContentCopy } from '@mui/icons-material';
import ErrorSnackbar from '@/snackBars/errorSnackbar';
import { WalletInfo } from '@/interfaces';
import { SALES_CONTENT, STORE } from '@/constants';
import { DialogModal } from '@/modals/dialogModal';

const Wallet = () => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [openSalesModal, setOpenSalesModal] = useState<boolean>(false);
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
      setWallets(updatedWallets);
      if (selectedWallet) {
        const updatedWallet =
          updatedWallets.find(
            (w) => w.publicKey === selectedWallet.publicKey
          ) || null;
        setSelectedWallet(updatedWallet);
      }
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const airdropSol = async (publicKey: string) => {
    setLoading(true);
    let balance = 0;
    try {
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
      balance = await connection.getBalance(new PublicKey(publicKey));
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
      return balance;
    }
  };

  const createWallet = async () => {
    if (wallets.length >= 2) return setOpenSalesModal(!openSalesModal);
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
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        console.log('Copied to clipboard successfully!');
      },
      (err) => {
        console.error('Could not copy text: ', err);
        fallbackCopyTextToClipboard(text);
      }
    );
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      const msg = successful ? 'successful' : 'unsuccessful';
      console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  };

  const goToStore = () => {
    window.open(STORE, '_blank');
  };
  const handleGoToStore = () => {
    goToStore();
    setOpenSalesModal(!openSalesModal);
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
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Button variant='contained' onClick={createWallet}>
            Create new wallet
          </Button>
          {selectedWallet && (
            <>
              <Button
                variant='contained'
                onClick={() =>
                  router.push(
                    `/transactions?publicKey=${selectedWallet.publicKey}`
                  )
                }
              >
                Create transaction
              </Button>
              <Typography variant='h6'>
                Balance: {selectedWallet.balance / 1e9} SOL
              </Typography>
            </>
          )}
        </Box>
        <List>
          {wallets?.map((wallet, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                selected={
                  wallet.publicKey ===
                  (selectedWallet && selectedWallet.publicKey)
                }
                onClick={() => handleSelectWallet(wallet)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  borderRadius: 1,
                }}
              >
                <ListItemText
                  sx={{
                    wordBreak: 'break-all',
                  }}
                  primary={
                    <Typography>
                      {`Address: ${wallet.publicKey}`}
                      <IconButton
                        sx={{ marginLeft: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(wallet.publicKey.toString() || '');
                        }}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Typography>
                  }
                />
                <Typography variant='body1'>
                  Balance: {wallet.balance / 1e9} SOL
                </Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>

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
                sx={{ marginLeft: 2 }}
                onClick={() =>
                  copyToClipboard(selectedWallet?.secretKey.toString() || '')
                }
              >
                <ContentCopy />
              </IconButton>
            </Typography>
          </>
        )}
        <ErrorSnackbar errorMessage={error} clearError={setError} />
        <DialogModal
          open={openSalesModal}
          acceptAction={handleGoToStore}
          cancelAction={() => setOpenSalesModal(!openSalesModal)}
          acceptTitle={'Hire'}
          title={'Limit reached!'}
          content={SALES_CONTENT}
        />
      </Box>
    </>
  );
};

export default Wallet;
