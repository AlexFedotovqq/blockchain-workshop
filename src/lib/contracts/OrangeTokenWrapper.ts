import Web3 from 'web3';
import * as OrangeTokenJSON from '../../../build/contracts/OrangeToken.json';
import { OrangeToken } from '../../types/OrangeToken';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class OrangeTokenWrapper {
    web3: Web3;

    contract: OrangeToken;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(OrangeTokenJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getTotalSupply() {
        const data = await this.contract.methods.totalSupply().call();

        return data;
    }

    async getBalanceOfAddress(Address: string) {
        const data = await this.contract.methods.balanceOf(Address).call();

        return data;
    }

    async transfer(toAddress: string, value: string, fromAddress: string) {
        console.log(toAddress, "toAddress");
        console.log(value,"value"); 
        const tx = await this.contract.methods.transfer(toAddress, value).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async approve(toAddress: string,value: number, fromAddress: string) {
        const tx = await this.contract.methods.approve(toAddress, value).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: OrangeTokenJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
