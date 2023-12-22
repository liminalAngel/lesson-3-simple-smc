import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode, toNano } from '@ton/core';

export type SimpleSmcConfig = {
    admin: Address;
    dict: Dictionary<Address, bigint>
};

export function simpleSmcConfigToCell(config: SimpleSmcConfig): Cell { // c4
    return beginCell()
        .storeAddress(config.admin)
        .storeDict(config.dict)
    .endCell();
}

export class SimpleSmc implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new SimpleSmc(address);
    }

    static createFromConfig(config: SimpleSmcConfig, code: Cell, workchain = 0) {
        const data = simpleSmcConfigToCell(config);
        const init = { code, data };
        return new SimpleSmc(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendPayoutRequest(provider: ContractProvider, via: Sender, toAddress: Address) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32)
                .storeAddress(toAddress)
            .endCell(),
        });
    }
}
