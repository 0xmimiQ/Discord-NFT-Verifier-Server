"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesToIdsString = exports.verify = void 0;
const moralis_1 = __importDefault(require("moralis"));
const evm_utils_1 = require("@moralisweb3/evm-utils");
const configs_json_1 = __importDefault(require("../configs.json"));
/**
 * Call Moralis API to get the user's an NFT collection holding amount.
 *
 * @param obj An verify info records token contract address and roles information.
 * @returns {Promise<VerifiedResult>} The user's NFT holding amount.
 */
const callVerifiedAPI = async (walletAddress, obj) => {
    const chain = evm_utils_1.EvmChain.CRONOS;
    const address = walletAddress;
    const format = "decimal";
    const limit = 1;
    const tokenAddress = obj.tokenAddress;
    let result = {
        total: 0,
        roles: [],
    };
    try {
        await moralis_1.default.start(configs_json_1.default.moralis);
        const verifiedResponse = await moralis_1.default.EvmApi.account.getNFTsForContract({
            address,
            chain,
            tokenAddress,
            format,
            limit,
        });
        const userHoldingAmount = verifiedResponse.raw.total;
        console.log(`TokenAddress: ${tokenAddress} HoldingAmount: ${userHoldingAmount}`);
        result.total = userHoldingAmount;
        result.roles = obj.roles;
    }
    catch (error) {
        console.error(error);
        result.total = -1;
        result.roles.length = 0;
    }
    finally {
        return result;
    }
};
/**
 * Record the roles available to the user.
 *
 * @param record The user's NFT and the corresponding available roles.
 * @returns The roles recorded.
 */
const recordRoles = (record) => {
    let recordedRoles = [];
    record.roles.forEach((roleData) => {
        if (record.total >= roleData.requiredAmount) {
            recordedRoles.push(roleData);
        }
    });
    return recordedRoles;
};
/**
 * Execute the verify operation.
 * Note that if you add more than 25 contract addresses in your database,
 * you must split the promises into multiple groups before calling the Moralis API,
 * unless you are using the paid API.
 *
 * @returns {Promise<Array<Role>>} The objects of the roles that the user will be assigned.
 */
const verify = async (walletAddress, waitingCheckAddressInfo) => {
    let promises = [];
    let verifiedResults = [];
    let recordedRoles = [];
    try {
        for (let i = 0; i < waitingCheckAddressInfo.length; i++) {
            promises.push(callVerifiedAPI(walletAddress, waitingCheckAddressInfo[i]));
        }
        console.log(`Account: ${walletAddress}\n=====`);
        verifiedResults = await Promise.all(promises);
        for (let i = 0; i < verifiedResults.length; i++) {
            recordedRoles = recordedRoles.concat(recordRoles(verifiedResults[i]));
        }
    }
    catch (error) {
        console.error(error);
        recordedRoles.length = 0;
    }
    finally {
        console.log("=====");
        return recordedRoles;
    }
};
exports.verify = verify;
/**
 * Convert the Role objects to discord id strings.
 * @param roles Array of Roles.
 * @returns Role ids in string.
 */
const rolesToIdsString = (roles) => {
    let roleIds = [];
    roles.forEach((roleInfo) => {
        roleIds.push(roleInfo.roleId);
    });
    return roleIds;
};
exports.rolesToIdsString = rolesToIdsString;
