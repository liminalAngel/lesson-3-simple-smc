import { Address, Dictionary, toNano } from '@ton/core';
import { SimpleSmc } from '../wrappers/SimpleSmc';
import { compile, NetworkProvider } from '@ton/blueprint';
import { randomAddress } from '@ton/test-utils';

export async function run(provider: NetworkProvider) {

    let dict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.BigVarUint(4));

    dict.set(randomAddress(), toNano('1'));
    dict.set(randomAddress(), toNano('2'));

    const simpleSmc = provider.open(
        SimpleSmc.createFromConfig(
            {
                admin: provider.sender().address as Address,
                dict: dict
            }, 
            await compile('SimpleSmc')
        )
    );

    await simpleSmc.sendDeploy(provider.sender(), toNano('4'));

    await provider.waitForDeploy(simpleSmc.address);

    // run methods on `simpleSmc`
}
