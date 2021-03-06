import {expect} from 'chai';
import 'mocha';
import requestArtifacts from 'requestnetworkartifacts';
import RequestNetwork from '../../../src/index';
import Erc20Service from '../../../src/servicesExternal/erc20-service';
import * as utils from '../../utils';

const WEB3 = require('web3');

const BN = WEB3.utils.BN;

const addressRequestERC20 = requestArtifacts('private', 'last-RequestErc20-0x345ca3e014aaf5dca488057592ee47305d9b3e10').networks.private.address;
const addressRequestCore = requestArtifacts('private', 'last-RequestCore').networks.private.address;

let rn: any;
let web3: any;
let defaultAccount: string;
let payer: string;
let payee: string;
let payee2: string;
let payee3: string;
let payeePaymentAddress: string;
let payee3PaymentAddress: string;
let payerRefundAddress: string;
let randomAddress: string;
let currentNumRequest: any;

describe('erc20 createRequestAsPayeeAction', () => {
    const arbitraryAmount = 100000000;
    const arbitraryAmount2 = 20000000;
    const arbitraryAmount3 =  3000000;
    rn = new RequestNetwork('http://localhost:8545', 10000000000, false);
    web3 = rn.requestERC20Service.web3Single.web3;
    const testToken = new Erc20Service('0x345cA3e014Aaf5dcA488057592ee47305D9B3e10');
    const addressTestToken = testToken.getAddress();

    beforeEach(async () => {
        const accounts = await web3.eth.getAccounts();
        defaultAccount = accounts[0].toLowerCase();
        randomAddress = accounts[1].toLowerCase();
        payer = accounts[2].toLowerCase();
        payee = accounts[3].toLowerCase();
        payee2 = accounts[4].toLowerCase();
        payee3 = accounts[5].toLowerCase();
        payerRefundAddress = accounts[6].toLowerCase();
        payer = accounts[7].toLowerCase();
        payeePaymentAddress = accounts[8].toLowerCase();
        payee3PaymentAddress = accounts[9].toLowerCase();
        currentNumRequest = await rn.requestCoreService.getCurrentNumRequest(); 
    });

    it('create request (implicit parameters)', async () => {
        const result = await rn.requestERC20Service.createRequestAsPayee(
                    addressTestToken,
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer)
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.transaction).to.have.property('hash');

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(defaultAccount);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(defaultAccount);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);
        expect(result.request.data, 'request.data is wrong').to.be.undefined;

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.tokenAddress.toLowerCase(), 'tokenAddress is wrong').to.equal(addressTestToken.toLowerCase());
        expect(result.request.currencyContract.payeePaymentAddress, 'payeePaymentAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.payerRefundAddress, 'payerRefundAddress is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[1], 'subPayeesPaymentAddress1 is wrong').to.be.undefined;
    });

    it('create request', async () => {
        const result = await rn.requestERC20Service.createRequestAsPayee(
                    addressTestToken,
                    [payee, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer,
                    [payeePaymentAddress, 0, payee3PaymentAddress],
                    payerRefundAddress,
                    '{"reason":"purchased two large pizzas"}',
                    '',
                    undefined,
                    {from: payee})
            .on('broadcasted', (data: any) => {
                expect(data.transaction, 'data.transaction.hash is wrong').to.have.property('hash');
            });

        expect(result.request.creator.toLowerCase(), 'creator is wrong').to.equal(payee);
        expect(result.request.extension, 'extension is wrong').to.be.undefined;

        expect(result.request.payee.address.toLowerCase(), 'payee is wrong').to.equal(payee);
        utils.expectEqualsBN(result.request.payee.expectedAmount, arbitraryAmount, 'expectedAmount is wrong');
        utils.expectEqualsBN(result.request.payee.balance, 0, 'balance is wrong');

        expect(result.request.payer.toLowerCase(), 'payer is wrong').to.equal(payer);
        expect(result.request.requestId, 'requestId is wrong').to.equal(utils.getRequestId(addressRequestCore, ++currentNumRequest));
        expect(result.request.state, 'state is wrong').to.equal(0);
        expect(result.request.currencyContract.address.toLowerCase(), 'currencyContract is wrong').to.equal(addressRequestERC20);

        utils.expectEqualsObject(result.request.data.data,{"reason": "purchased two large pizzas"}, 'data.data is wrong')
        expect(result.request.data, 'data.hash is wrong').to.have.property('hash');
        expect(result.transaction, 'result.transaction.hash is wrong').to.have.property('hash');

        expect(result.request.subPayees[0].address.toLowerCase(), 'payee2 is wrong').to.equal(payee2);
        utils.expectEqualsBN(result.request.subPayees[0].balance, 0, 'payee2 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[0].expectedAmount, arbitraryAmount2, 'payee2 expectedAmount is wrong');

        expect(result.request.subPayees[1].address.toLowerCase(), 'payee3 is wrong').to.equal(payee3);
        utils.expectEqualsBN(result.request.subPayees[1].balance, 0, 'payee3 balance is wrong');
        utils.expectEqualsBN(result.request.subPayees[1].expectedAmount, arbitraryAmount3, 'payee3 expectedAmount is wrong');

        expect(result.request.currencyContract.tokenAddress.toLowerCase(), 'tokenAddress is wrong').to.equal(addressTestToken.toLowerCase());
        expect(result.request.currencyContract.payeePaymentAddress.toLowerCase(), 'payeePaymentAddress is wrong').to.equal(payeePaymentAddress);
        expect(result.request.currencyContract.payerRefundAddress.toLowerCase(), 'payerRefundAddress is wrong').to.equal(payerRefundAddress);
        expect(result.request.currencyContract.subPayeesPaymentAddress[0], 'subPayeesPaymentAddress0 is wrong').to.be.undefined;
        expect(result.request.currencyContract.subPayeesPaymentAddress[1].toLowerCase(), 'payer is wrong').to.equal(payee3PaymentAddress);
    });


    it('create request _payees not address', async () => {
        try {
            const result = await rn.requestERC20Service.createRequestAsPayee(
                    addressTestToken,
                    ['0xNOTADDRESS'],
                    [arbitraryAmount],
                    payer);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesIdAddress must be valid eth addresses'), 'exception not right');
        }
    });

    it('create request _payer not address', async () => {
        try {
            const result = await rn.requestERC20Service.createRequestAsPayee(
                    addressTestToken,
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    '0xNOTADDRESS');
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_payer must be a valid eth address'), 'exception not right');
        }
    });


    it('create request _payerRefundAddress not address', async () => {
        try {
            const result = await rn.requestERC20Service.createRequestAsPayee(
                    addressTestToken,
                    [defaultAccount, payee2, payee3],
                    [arbitraryAmount, arbitraryAmount2, arbitraryAmount3],
                    payer,
                    [payeePaymentAddress, 0, payee3PaymentAddress],
                    '0xNOTADDRESS');
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_payerRefundAddress must be a valid eth address'), 'exception not right');
        }
    });

    it('create request payer == payee', async () => {
        try {
            const result = await rn.requestERC20Service.createRequestAsPayee(
                    addressTestToken,
                    [defaultAccount],
                    [arbitraryAmount],
                    defaultAccount);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_from must be different than _payer'), 'exception not right');
        }
    });

    it('create request amount < 0', async () => {
        try {
            const result = await rn.requestERC20Service.createRequestAsPayee(
                    addressTestToken,
                    [defaultAccount],
                    [-1],
                    payer);
            expect(false, 'exception not thrown').to.be.true;
        } catch (e) {
            utils.expectEqualsException(e, Error('_expectedAmounts must be positive integers'), 'exception not right');
        }
    });


    it('create request with different array size', async () => {
        try { 
            const result = await rn.requestERC20Service.createRequestAsPayee(
                    addressTestToken,
                    [defaultAccount, payee2],
                    [arbitraryAmount],
                    payer);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('_payeesIdAddress and _expectedAmounts must have the same size'),'exception not right');
        }
    });

    it('token not supported', async () => {
        try { 
            const result = await rn.requestERC20Service.createRequestAsPayee(
                    '0x0000000000000000000000000000000000000000',
                    [defaultAccount],
                    [arbitraryAmount],
                    payer);
            expect(false, 'exception not thrown').to.be.true; 
        } catch (e) {
            utils.expectEqualsException(e, Error('token not supported'),'exception not right');
        }
    });
});

