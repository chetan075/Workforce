'use client';

import { useState } from 'react';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  Shield, 
  FileText, 
  Award, 
  ExternalLink, 
  Copy,
  Plus,
  Zap,
  Lock,
  Unlock,
  Send,
  Download,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  fetchCryptoWalletBalance, 
  fetchTransactionHistory, 
  fetchNFTPortfolio,
  mintInvoiceNFTSimple,
  mintReputationSBT,
  requestWalletChallenge,
  verifyWalletSignature,
  fetchInvoices,
} from '@/lib/api';
import AptosWallet from '@/lib/aptosWallet';

interface WalletBalance {
  address: string;
  balance: {
    apt: number;
    usdc: number;
    workverse: number;
  };
  lastUpdated: string;
}

interface Transaction {
  hash: string;
  type: string;
  amount: number;
  token: string;
  from: string;
  to: string;
  timestamp: string;
  status: string;
  gasUsed: number;
  description: string;
}

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  contractAddress: string;
  tokenId: string;
  collection: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  rarity: string;
  transferable?: boolean;
}

export default function BlockchainPage() {
  const [activeTab, setActiveTab] = useState<'wallet' | 'contracts' | 'transactions' | 'nfts' | 'defi'>('wallet');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const tabs = [
    { id: 'wallet', name: 'Wallet', icon: Wallet },
    { id: 'contracts', name: 'Smart Contracts', icon: FileText },
    { id: 'transactions', name: 'Transactions', icon: TrendingUp },
    { id: 'nfts', name: 'NFT Portfolio', icon: Award },
    { id: 'defi', name: 'DeFi', icon: Coins }
  ];

  const loadWalletData = async (address: string) => {
    try {
      const [balanceData, transactionData, nftData] = await Promise.all([
        fetchCryptoWalletBalance(address),
        fetchTransactionHistory(address),
        fetchNFTPortfolio(address)
      ]);
      
      setWalletBalance(balanceData);
      setTransactions(transactionData.transactions);
      setNfts(nftData.nfts);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const connectWallet = async () => {
    try {
      const { address, publicKey, provider } = await AptosWallet.connectAptosWallet();
      
      // Request challenge from backend, sign it and verify to obtain token
      try {
        // Request challenge from backend
        const challengeJson = await requestWalletChallenge(address);
        const challenge = challengeJson.challenge;
        
        // Sign the challenge with the wallet
        const sig = await AptosWallet.signMessageWithWallet(provider, challenge);
        
        // Verify signature with backend (this creates user if needed and sets cookie)
        const verifyJson = await verifyWalletSignature(address, sig.signature, publicKey ?? undefined);
        
        // Store token if returned (backend also sets HttpOnly cookie)
        if (verifyJson?.access_token) {
          try { 
            localStorage.setItem('access_token', verifyJson.access_token); 
          } catch (_) {}
        }
        
        console.log('Wallet authentication successful:', verifyJson);
      } catch (err) {
        console.warn('Wallet auth flow failed (proceeding with address only):', err);
        // Still allow wallet connection for read-only operations
      }

      setWalletAddress(address);
      setWalletConnected(true);
      localStorage.setItem('walletAddress', address);
      await loadWalletData(address);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please make sure you have an Aptos wallet installed (Petra, Martian, etc.)');
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setWalletConnected(false);
    setWalletBalance(null);
    setTransactions([]);
    setNfts([]);
    localStorage.removeItem('walletAddress');
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      alert('Address copied to clipboard');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'NFT_MINT':
        return <Award className="h-4 w-4 text-purple-600" />;
      case 'PAYMENT':
        return <Send className="h-4 w-4 text-green-600" />;
      case 'ESCROW_RELEASE':
        return <Unlock className="h-4 w-4 text-blue-600" />;
      case 'SBT_MINT':
        return <Shield className="h-4 w-4 text-orange-600" />;
      default:
        return <Coins className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blockchain Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your crypto wallet, smart contracts, and DeFi activities</p>
            </div>
            
            {!walletConnected ? (
              <button 
                onClick={connectWallet}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{formatAddress(walletAddress!)}</span>
                    <button 
                      onClick={copyAddress} 
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy address to clipboard"
                      aria-label="Copy wallet address"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={disconnectWallet}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {!walletConnected ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Connect your crypto wallet to access blockchain features, manage smart contracts, and view your NFT portfolio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={connectWallet}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <div className="w-6 h-6 bg-orange-500 rounded" />
                MetaMask
              </button>
              <button 
                onClick={connectWallet}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <div className="w-6 h-6 bg-purple-500 rounded" />
                Petra Wallet
              </button>
              <button 
                onClick={connectWallet}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <div className="w-6 h-6 bg-blue-500 rounded" />
                Martian Wallet
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Wallet Overview */}
            {walletBalance && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Coins className="h-8 w-8" />
                    <div>
                      <h3 className="text-lg font-semibold">APT Balance</h3>
                      <p className="text-blue-100 text-sm">Aptos Native Token</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{walletBalance.balance.apt.toFixed(2)} APT</div>
                  <div className="text-blue-100 text-sm mt-1">≈ {formatCurrency(walletBalance.balance.apt * 8.5)}</div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8" />
                    <div>
                      <h3 className="text-lg font-semibold">USDC Balance</h3>
                      <p className="text-green-100 text-sm">USD Coin</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{walletBalance.balance.usdc.toFixed(2)} USDC</div>
                  <div className="text-green-100 text-sm mt-1">≈ {formatCurrency(walletBalance.balance.usdc)}</div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="h-8 w-8" />
                    <div>
                      <h3 className="text-lg font-semibold">WORK Balance</h3>
                      <p className="text-purple-100 text-sm">Workverse Token</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{walletBalance.balance.workverse.toFixed(2)} WORK</div>
                  <div className="text-purple-100 text-sm mt-1">≈ {formatCurrency(walletBalance.balance.workverse * 1.2)}</div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'wallet' | 'contracts' | 'transactions' | 'nfts' | 'defi')}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                          isActive
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm">
              {/* Wallet Tab */}
              {activeTab === 'wallet' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <Send className="h-5 w-5 text-blue-600" />
                          <div className="text-left">
                            <div className="font-medium">Send Tokens</div>
                            <div className="text-sm text-gray-600">Transfer crypto to another wallet</div>
                          </div>
                        </button>
                        
                        <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <Download className="h-5 w-5 text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">Receive Tokens</div>
                            <div className="text-sm text-gray-600">Get your wallet address</div>
                          </div>
                        </button>
                        
                        <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <Plus className="h-5 w-5 text-purple-600" />
                          <div className="text-left">
                            <div className="font-medium">Add Token</div>
                            <div className="text-sm text-gray-600">Import custom tokens</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {transactions.slice(0, 3).map((tx) => (
                          <div key={tx.hash} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                            {getTransactionIcon(tx.type)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{tx.description}</div>
                              <div className="text-xs text-gray-600">{formatDate(tx.timestamp)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} {tx.token}
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tx.status)}`}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Contracts Tab */}
              {activeTab === 'contracts' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Smart Contract Dashboard</h3>
                    <p className="text-gray-600">Deploy and interact with Workverse smart contracts for escrow and payments.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Escrow Contract */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Lock className="h-6 w-6 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">Escrow Contract</h4>
                          <p className="text-sm text-gray-600">Secure payment escrow for projects</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Contract Address:</span>
                          <span className="font-mono">0x1234...5678</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Locked:</span>
                          <span className="font-medium">$12,450</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          Create Escrow
                        </button>
                        <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                          View Contract
                        </button>
                      </div>
                    </div>

                    {/* NFT Minting */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="h-6 w-6 text-purple-600" />
                        <div>
                          <h4 className="font-semibold">NFT Minting</h4>
                          <p className="text-sm text-gray-600">Mint invoice and achievement NFTs</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Minted NFTs:</span>
                          <span className="font-medium">23</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Success Rate:</span>
                          <span className="text-green-600 font-medium">100%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Gas Saved:</span>
                          <span className="font-medium">0.45 APT</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <button 
                          onClick={async () => {
                            try {
                              // First try to fetch invoices to get a real invoice ID
                              const invoiceList = await fetchInvoices();
                              const paidInvoice = invoiceList.find((inv: any) => inv.status === 'PAID');
                              const invoiceId = paidInvoice?.id || 'demo-invoice-id';
                              await mintInvoiceNFTSimple(invoiceId);
                              alert('NFT minting initiated successfully!');
                            } catch (error) {
                              console.error('Mint error:', error);
                              alert(`Error minting NFT: ${error}`);
                            }
                          }}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                          Mint Invoice NFT
                        </button>
                        <button 
                          onClick={() => mintReputationSBT('current-user-id')}
                          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Mint Reputation SBT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                    <p className="text-gray-600">Complete history of all blockchain transactions from your wallet.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((tx) => (
                          <tr key={tx.hash} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {getTransactionIcon(tx.type)}
                                <div>
                                  <div className="font-medium text-sm">{tx.description}</div>
                                  <div className="text-xs text-gray-600 font-mono">{formatAddress(tx.hash)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-sm">
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} {tx.token}
                              </div>
                              <div className="text-xs text-gray-600">Gas: {tx.gasUsed} APT</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {formatDate(tx.timestamp)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tx.status)}`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                className="text-blue-600 hover:text-blue-700 text-sm"
                                title="View on explorer"
                                aria-label="View transaction on blockchain explorer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* NFTs Tab */}
              {activeTab === 'nfts' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">NFT Portfolio</h3>
                    <p className="text-gray-600">Your collection of invoice NFTs, achievement badges, and reputation tokens.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map((nft) => (
                      <div key={nft.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <Award className="h-16 w-16 text-blue-600" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm">{nft.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              nft.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800' :
                              nft.rarity === 'Soul Bound' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {nft.rarity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">{nft.description}</p>
                          
                          <div className="space-y-1 mb-3">
                            {nft.attributes.slice(0, 2).map((attr, index) => (
                              <div key={index} className="flex justify-between text-xs">
                                <span className="text-gray-600">{attr.trait_type}:</span>
                                <span className="font-medium">{attr.value}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50">
                              View Details
                            </button>
                            {nft.transferable !== false && (
                              <button className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                                Transfer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DeFi Tab */}
              {activeTab === 'defi' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">DeFi Features</h3>
                    <p className="text-gray-600">Stake your tokens, provide liquidity, and earn rewards in the Workverse ecosystem.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Staking */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="h-6 w-6 text-yellow-600" />
                        <div>
                          <h4 className="font-semibold">WORK Token Staking</h4>
                          <p className="text-sm text-gray-600">Stake WORK tokens to earn rewards</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Staked Amount:</span>
                          <span className="font-medium">500 WORK</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">APY:</span>
                          <span className="text-green-600 font-medium">12.5%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Rewards Earned:</span>
                          <span className="font-medium">15.4 WORK</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm">
                          Stake More
                        </button>
                        <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                          Claim Rewards
                        </button>
                      </div>
                    </div>

                    {/* Liquidity */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">Liquidity Pools</h4>
                          <p className="text-sm text-gray-600">Provide liquidity and earn fees</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pool Share:</span>
                          <span className="font-medium">0.05%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Value:</span>
                          <span className="font-medium">$1,250</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Fees Earned:</span>
                          <span className="text-green-600 font-medium">$12.45</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          Add Liquidity
                        </button>
                        <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                          Remove Liquidity
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coming Soon Features */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">🚀 Coming Soon</h4>
                    <p className="text-purple-800 text-sm mb-4">
                      We&apos;re working on exciting new DeFi features to enhance your Workverse experience.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Yield Farming</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Governance Voting</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Cross-chain Bridge</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}