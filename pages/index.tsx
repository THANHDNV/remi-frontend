import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import Web3 from 'web3'
import { useDebouncedCallback } from 'use-debounce'
import { Injected } from '../connectors'
import { setupNetwork } from '../utils/setupNetwork'
import { getMasterChefContract, getMulticallContract, getREMIContract } from '../utils/contracts'
import { getWeb3NoAccount } from '../utils/getWeb3NoAccount'
import addresses from '../config/addresses'
import { Interface } from 'ethers/lib/utils'
import { REMI } from '../config/abi'
import BigNumber from 'bignumber.js';

const REMIInterface = new Interface(REMI)

const Home: NextPage = () => {
  const { activate, deactivate, active, library, account } = useWeb3React()
  const [web3, setWeb3] = useState<Web3>()
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [tokenId, setTokenId] = useState<string>('')
  const [withdrawTokenId, setWithdrawTokenId] = useState<string>('')
  const [approved, setApproved] = useState(false)
  const [tokenIds, setTokenIds] = useState<number[]>([])

  useEffect(() => {
    setWeb3(!!library ? new Web3(library) : getWeb3NoAccount())
  }, [library])

  const onClickConnect = () => {
    activate(Injected, async (error) => {
      if (error instanceof UnsupportedChainIdError) {
        const hasSetup = await setupNetwork({
          id: 97,
          name: 'BSC - Testnet',
          rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
          symbol: 'BNB'
        })

        if (hasSetup) {
          activate(Injected)
        }
      }
    });
  }

  const onClickDisconnect = () => {
    deactivate()
  }

  const onClickBuyRemi = () => {
    if (web3) {
      setLoading(true)
      getREMIContract(web3).methods.mint().send({
        from: account,
        value: Web3.utils.toWei('0.01', 'ether')
      }).finally(() => {
        setLoading(false)
      })
    }
  }

  const onChangeTokenId = useDebouncedCallback((tokenId: string) => {
    if (web3) {
      getREMIContract(web3).methods.getApproved(tokenId).call().then((approvedAddress: string) => {
        if (approvedAddress === addresses.MasterChef) {
          setApproved(true)
        }
      })
    }
  }, 200, { maxWait: 1000 })

  useEffect(() => {
    const interval = setInterval(() => {
      if (web3 && account) {
        getREMIContract(web3).methods.balanceOf(account).call().then((balance: string) => {
          setBalance(parseInt(balance))
          if (parseInt(balance) > 0) {
            const calls = (Array(parseInt(balance)).fill(0)).map((_, index) => {
              return [
                addresses.REMI,
                REMIInterface.encodeFunctionData('tokenOfOwnerByIndex', [account, index])
              ]
            })
            console.log(calls)
            getMulticallContract(web3).methods.aggregate(calls).call().then(({ returnData }: any) => {
              const res = returnData.map((call: any) => REMIInterface.decodeFunctionResult('tokenOfOwnerByIndex', call))
              setTokenIds(res.map((id: any) => (new BigNumber(id)).toNumber()))
            })
          }
        })
      }
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [web3, account])

  const onClickApprove = async () => {
    if (web3 && tokenId) {
      setLoading(true)
      try {
        if (await getREMIContract(web3).methods.ownerOf(tokenId).call() !== account) {
          alert('You don\'t own this NFT')
          throw new Error('You don\'t own this NFT')
        }
        const approvedAddress = await getREMIContract(web3).methods.getApproved(tokenId).call()
        if (approvedAddress !== addresses.MasterChef) {
          await getREMIContract(web3).methods.approve(
            addresses.MasterChef,
            tokenId,
          ).send({
            from: account
          })
        }
      } catch (error) {
        console.log(error)
      }
      setLoading(false)
    }
  }

  const onClickDeposit = async () => {
    if (web3 && tokenId) {
      setLoading(true)
      try {
        if (await getREMIContract(web3).methods.ownerOf(tokenId).call() !== account) {
          alert('You don\'t own this NFT')
          throw new Error('You don\'t own this NFT')
        }
        await getMasterChefContract(web3).methods.deposit(
          tokenId
        ).send({
          from: account
        })
      } catch (error: any) {
        console.log(error)
      }
      setLoading(false)
    }
  }

  const onWithdrawTokenId = async () => {
    if (web3 && withdrawTokenId) {
      setLoading(true)
      try {
        const tokenOwner = await getMasterChefContract(web3).methods.nftOwner(withdrawTokenId).call()
        if (tokenOwner !== account) {
          alert('You don\'t own this NFT or NFT not in MasterChef')
          throw new Error('You don\'t own this NFT or NFT not in MasterChef')
        }
        await getMasterChefContract(web3).methods.withdraw(
          withdrawTokenId
        ).send({
          from: account
        })
      } catch (error) {
        console.log(error)
      }
      setLoading(false)
    }
  }

  const onClaimReward = async () => {
    if (web3 && withdrawTokenId) {
      setLoading(true)
      try {
        await getMasterChefContract(web3).methods.claimReward().send({
          from: account
        })
      } catch (error) {
        console.log(error)
      }
      setLoading(false)
    }
  }

  return (
    <div>
      {!active && (
        <button disabled={loading} onClick={onClickConnect}>Connect wallet</button>
      )}
      {active && (
        <>
          <button disabled={loading} onClick={onClickDisconnect}>Disconnect</button>
          <div>
            REMI NFT:{' '}
            <button disabled={loading} onClick={onClickBuyRemi}>Buy REMI</button>{' '}
            {balance} NFT
          </div>
          <div>
            Token IDs: {tokenIds.join(', ')}
          </div>
          <div>
            Deposit Token Id: <input value={tokenId} onChange={(e) => {
              setTokenId(e.target.value)
              onChangeTokenId(e.target.value)
            }} />
          </div>
          <div>
            Withdraw Token Id: <input value={withdrawTokenId} onChange={(e) => {
              setWithdrawTokenId(e.target.value)
            }} />
          </div>
          <div>
            MasterChef:{' '}
            <button disabled={loading || approved || !tokenId} onClick={onClickApprove}>Approve</button>{' '}
            <button disabled={loading || !approved || !tokenId} onClick={onClickDeposit}>Deposit NFT</button>{' '}
            <button disabled={loading || !withdrawTokenId} onClick={onWithdrawTokenId}>Withdraw NFT</button>{' '}
            <button disabled={loading} onClick={onClaimReward}>Claim reward</button>
          </div>
        </>
      )}
    </div>
  )
}

export default Home
