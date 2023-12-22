import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton/sandbox';
import { Cell, Dictionary, beginCell, toNano } from '@ton/core';
import { SimpleSmc } from '../wrappers/SimpleSmc';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('SimpleSmc', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('SimpleSmc');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let account1: SandboxContract<TreasuryContract>;
    let account2: SandboxContract<TreasuryContract>;
    let simpleSmc: SandboxContract<SimpleSmc>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        admin = await blockchain.treasury('admin');
        account1 = await blockchain.treasury('account1');
        account2 = await blockchain.treasury('account2');

        let dict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.BigVarUint(4));

        dict.set(account1.address, toNano('2'));
        dict.set(account2.address, toNano('3'));

        simpleSmc = blockchain.openContract(
            SimpleSmc.createFromConfig(
                {
                    admin: admin.address,
                    dict: dict
                }, 
                code
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await simpleSmc.sendDeploy(deployer.getSender(), toNano('10'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: simpleSmc.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        expect((await blockchain.getContract(simpleSmc.address))
            .balance
        )
        .toEqual(9999585000n);
            
        expect((await blockchain.getContract(simpleSmc.address))
            .get('get_value_by_address', [
                {
                    type: 'slice', 
                    cell: beginCell().storeAddress(account1.address).endCell()
                }
            ])
            .stackReader.readBigNumber()
        )
        .toEqual(toNano('2'))
        
    });

    it('should send funds to provided adddress', async () => {

        const payoutRequestResult = await simpleSmc.sendPayoutRequest(admin.getSender(), account1.address);

        expect(payoutRequestResult.transactions).toHaveTransaction({
            from: simpleSmc.address,
            to: account1.address,
            value: toNano('2'),
            success: true
        });

        printTransactionFees(payoutRequestResult.transactions)
    })
});
