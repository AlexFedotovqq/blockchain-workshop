/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { OrangeTokenWrapper } from '../lib/contracts/OrangeTokenWrapper';
import { CONFIG } from '../config';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<OrangeTokenWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [tokenTotalSupply, setTokenTotalSupply] = useState<string | undefined>();
    const [userTokenBalance, setUserTokenBalance] = useState<string | undefined>();
    const [Balance, setBalance] = useState<string | undefined>();
    const [BalanceOfAddress, setBalanceOfAddress] = useState<string | undefined>();
    const [transferToAddress, setTransferToAddress] = useState<string | undefined>();
    const [tansferValue, setTansferValue] = useState<string | undefined>();
    const [transferTx, setTransferTx] = useState<string | undefined>();
    const [approveTx, setApproveTx] = useState<string | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new OrangeTokenWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to transfer token in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getTotalSupply() {
        const value = await contract.getTotalSupply();
        toast('Successfully get total supply.', { type: 'success' });

        setTokenTotalSupply(value);
    }

    async function getBlanceOfAddress() {
        const value = await contract.getBalanceOfAddress(BalanceOfAddress);
        toast('Successfully get address balance.', { type: 'success' });

        setBalance(value);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new OrangeTokenWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setTokenTotalSupply(undefined);
        const value = await _contract.getBalanceOfAddress(polyjuiceAddress);
        setUserTokenBalance(value)

    }

    async function transfer() {
        try {
            setTransactionInProgress(true);
            const transactionHash = await contract.transfer(transferToAddress, tansferValue , account);
            toast(
                'Successfully Transfered',
                { type: 'success' }
            );
            // console.log(transactionHash,"transactionHash");
            setTransferTx(transactionHash.transactionHash)
            const value = await contract.getBalanceOfAddress(polyjuiceAddress);
            setUserTokenBalance(value)
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />
            <p>
                The button below will deploy a Token smart contract where you can tranfer a
                number token. 
            </p>
            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            {userTokenBalance ? <>&nbsp;&nbsp;Your Token Balance: {userTokenBalance.toString()}</> : null}
            <br />
            <br />
            <button onClick={getTotalSupply} disabled={!contract}>
                Get Total Supply
            </button>
            {tokenTotalSupply ? <>&nbsp;&nbsp;Orange Token Total Supply: {tokenTotalSupply.toString()}</> : null}
            <br />
            <br />
            <input
                type="string"
                defaultValue="address"
                onChange={e => setBalanceOfAddress(e.target.value)}
            />
            <button onClick={getBlanceOfAddress} disabled={!contract}>
                Get Balance
            </button>
            {Balance ? <>&nbsp;&nbsp;Orange Token Balance: {Balance.toString()}</> : null}
            <br />
            <br />
            <input
                type="string"
                defaultValue="address"
                onChange={e => setTransferToAddress(e.target.value)}
            />
            <input
                type="string"
                defaultValue="value"
                onChange={e => setTansferValue(e.target.value)}
            />
            <button onClick={transfer} disabled={!contract}>
                Transfer
            </button>
            {transferTx ? <>&nbsp;&nbsp;Success : {transferTx}</> : null}
            <br />
            <br />
            <br />
            <br />
            <hr />
            The contract is deployed on Nervos Layer 2 - Godwoken + Polyjuice. After each
            transaction you might need to wait up to 120 seconds for the status to be reflected.
            <ToastContainer />
        </div>
    );
}
