import Web3 from 'web3'
import { HttpProviderOptions } from 'web3-core-helpers'

export const getWeb3NoAccount = () => {
  const httpProvider = new Web3.providers.HttpProvider(
    'https://data-seed-prebsc-1-s1.binance.org:8545/',
    { timeout: 10000 } as HttpProviderOptions
  )
  const web3NoAccount = new Web3(httpProvider)
  return web3NoAccount
}
