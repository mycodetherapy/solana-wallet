import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Backdrop,
} from '@mui/material';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from '@solana/web3.js';
import ErrorSnackbar from '../SnackBars/ErrorSnackbar';
import { WalletInfo } from '@/interfaces';

const Transactions = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [allWallets, setAllWallets] = useState<WalletInfo[]>([]);
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

  const sendTransaction = async (amount: string, recipient: string) => {
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

  const validationSchema = Yup.object().shape({
    amount: Yup.number()
      .required('Amount is required')
      .positive('Amount must be positive')
      .max(wallet ? wallet.balance / 1e9 : 0, 'Amount exceeds wallet balance'),
    recipient: Yup.string()
      .required('Recipient address is required')
      .notOneOf(
        [wallet ? wallet.publicKey : ''],
        'Cannot send to the same wallet'
      ),
  });

  const ErrorRender = (errName: string) => {
    return (
      <ErrorMessage name={errName}>
        {(msg) => (
          <Typography sx={{ color: 'red', fontSize: 12 }}>{msg}</Typography>
        )}
      </ErrorMessage>
    );
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
        <Formik
          initialValues={{ amount: '', recipient: '' }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            sendTransaction(values.amount, values.recipient);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <Box sx={{ marginBottom: 2, maxWidth: '50%' }}>
                <Field
                  as={TextField}
                  label='Amount (SOL)'
                  name='amount'
                  fullWidth
                  helperText={ErrorRender('amount')}
                />
              </Box>
              <Box sx={{ marginBottom: 2 }}>
                <Field
                  as={TextField}
                  label='Recipient Address'
                  name='recipient'
                  fullWidth
                  helperText={ErrorRender('recipient')}
                />
              </Box>
              <Button variant='contained' type='submit' disabled={isSubmitting}>
                Send
              </Button>
            </Form>
          )}
        </Formik>
      </Box>
      <ErrorSnackbar errorMessage={error} clearError={setError} />
    </>
  );
};

export default Transactions;
