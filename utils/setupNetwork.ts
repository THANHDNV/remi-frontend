// Set of helper functions to facilitate wallet setup

interface WindowChain {
  ethereum?: {
    isMetaMask?: true
    request: (...args: any[]) => Promise<void>
  }
}

interface Network {
  id: number
  name: string
  symbol?: string
  rpcUrl: string
  blockExplorerUrl?: string
}

export const setupNetwork = async (appNetwork: Network) => {
  const provider = (window as WindowChain).ethereum
  if (provider) {
    let isSuccessful = true;
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{
        chainId: `0x${appNetwork.id.toString(16)}`
      }]
    }).catch(async (switchError) => {
      if (switchError.code === 4902) {
        // wallet dont have the network id, try adding it
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${appNetwork.id.toString(16)}`,
            chainName: appNetwork.name,
            nativeCurrency: {
              name: appNetwork.symbol,
              symbol: appNetwork.symbol,
              decimals: 18,
            },
            rpcUrls: [appNetwork.rpcUrl],
            blockExplorerUrls: [appNetwork.blockExplorerUrl],
          }]
        }).then(async () => {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{
              chainId: `0x${appNetwork.id.toString(16)}`
            }]
          })
        })
      }
      throw switchError
    }).catch((error) => {
      console.log('RPC Error: ', error)
      if (error.code !== 4902) {
        isSuccessful = false
      }
    })
    return isSuccessful;
  } else {
    console.error("Can't setup the network on metamask because window.ethereum is undefined")
    return false
  }
}
