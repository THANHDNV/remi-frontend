import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import { REMI, MasterChef, multicall } from '../config/abi'
import addresses from '../config/addresses'

export const getContract = (abi: any, address: string, web3: Web3, chainId?: number) =>
  new web3.eth.Contract(abi as unknown as AbiItem, address)

export const getREMIContract = (web3: Web3) =>
  getContract(REMI, addresses.REMI, web3)

export const getMasterChefContract = (web3: Web3) =>
  getContract(MasterChef, addresses.MasterChef, web3)

export const getMulticallContract = (web3: Web3) =>
  getContract(multicall, addresses.multicall, web3)