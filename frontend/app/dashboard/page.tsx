'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign, 
  MessageSquare, 
  FileText, 
  Star,
  Search,
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react';
import InvoiceTable from '../../components/InvoiceTable';
import { fetchInvoices, getUserTrustScore } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';
import CreateInvoiceModal from '../../components/CreateInvoiceModal';
import TrustScoreDisplay from '../../components/TrustScoreDisplay';

type Invoice = { id: string; title: string; amount: number; status: string };

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalEarnings: number;
  monthlyEarnings: number;
  completedTasks: number;
  rating: number;
  pendingInvoices: number;
  unreadMessages: number;
}

interface RecentActivity {
  id: string;
  type: 'project' | 'payment' | 'message' | 'review';
  title: string;
  description: string;
  time: string;
  status?: 'pending' | 'completed' | 'urgent';
}

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const quickLinks: QuickLink[] = [
  {
    title: 'Find Work',
    description: 'Browse opportunities',
    href: '/opportunities',
    icon: Search,
    color: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    title: 'Upload Files',
    description: 'Add documents',
    href: '/upload',
    icon: Upload,
    color: 'bg-green-600 hover:bg-green-700'
  },
  {
    title: 'Create Invoice',
    description: 'Generate invoice',
    href: '/invoices/create',
    icon: FileText,
    color: 'bg-purple-600 hover:bg-purple-700'
  },
  {
    title: 'Browse Services',
    description: 'Find freelancers',
    href: '/services',
    icon: Users,
    color: 'bg-orange-600 hover:bg-orange-700'
  },
  {
    title: 'Start Chat',
    description: 'Send message',
    href: '/chat',
    icon: MessageSquare,
    color: 'bg-pink-600 hover:bg-pink-700'
  },
  {
    title: 'View Profile',
    description: 'Edit profile',
    href: '/profile',
    icon: Star,
    color: 'bg-yellow-600 hover:bg-yellow-700'
  }
];

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creating, setCreating] = useState(false);
  const { loading, user } = useAuth();
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [blockchainStats, setBlockchainStats] = useState({
    nftInvoices: 0,
    verifiedTransactions: 0,
    ipfsFiles: 0,
    totalSecuredValue: 0
  });
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 24,
    activeProjects: 3,
    totalEarnings: 45000,
    monthlyEarnings: 8500,
    completedTasks: 156,
    rating: 4.8,
    pendingInvoices: 2,
    unreadMessages: 5
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'project',
      title: 'E-commerce Project Completed',
      description: 'Successfully delivered the React e-commerce platform',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Received',
      description: '$2,500 from TechStartup Co.',
      time: '1 day ago',
      status: 'completed'
    },
    {
      id: '3',
      type: 'message',
      title: 'New Message',
      description: 'Client inquiry about mobile app project',
      time: '2 days ago',
      status: 'pending'
    }
  ]);

  // Calculate blockchain statistics from invoices
  const calculateBlockchainStats = useCallback((invoices: Invoice[]) => {
    const nftInvoices = invoices.filter(inv => (inv as any).nftTokenId).length;
    const verifiedTransactions = invoices.filter(inv => (inv as any).isVerified).length;
    const ipfsFiles = invoices.reduce((sum, inv) => sum + ((inv as any).ipfsFiles?.length || 0), 0);
    const totalSecuredValue = invoices
      .filter(inv => (inv as any).blockchainHash)
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    setBlockchainStats({
      nftInvoices,
      verifiedTransactions,
      ipfsFiles,
      totalSecuredValue
    });
  }, []);

  // Load invoice list when auth state is resolved and user is authenticated
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    const load = async () => {
      try {
        const data = await fetchInvoices();
        setInvoices(data || []);
        calculateBlockchainStats(data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [loading, user, calculateBlockchainStats]);

    // Load trust score
  useEffect(() => {
    if (!user?.id) return;
    const loadTrustScore = async () => {
      try {
        const response = await getUserTrustScore(user.id);
        // Handle both object response and direct score response
        const score = typeof response === 'object' ? response.trustScore : response;
        setTrustScore(score);
      } catch (e) {
        console.error('Failed to load trust score:', e);
      }
    };
    loadTrustScore();
  }, [user?.id]);

  // recentActivity and stats initialized inline

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return <Briefcase className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'review': return <Star className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'urgent': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Workverse</h1>
          <p className="text-gray-400">Here&apos;s what's happening with your freelance work today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
            <p className="text-sm text-gray-400">Total Projects</p>
            <p className="text-xs text-green-400">+{stats.activeProjects} active</p>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
            <p className="text-sm text-gray-400">Total Earnings</p>
            <p className="text-xs text-green-400">+{formatCurrency(stats.monthlyEarnings)} this month</p>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-600/20 rounded-lg">
              <Star className="h-6 w-6 text-yellow-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.rating}</p>
            <p className="text-sm text-gray-400">Average Rating</p>
            <p className="text-xs text-green-400">{stats.completedTasks} reviews</p>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-400" />
            </div>
            {stats.unreadMessages > 0 && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.unreadMessages}</p>
            <p className="text-sm text-gray-400">Unread Messages</p>
            <p className="text-xs text-gray-500">{stats.pendingInvoices} pending invoices</p>
          </div>
        </div>
      </div>

      {/* Blockchain Stats */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Blockchain Security</h2>
            <p className="text-slate-400">Your invoices secured on the Aptos blockchain</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm text-purple-400 font-medium">Powered by Aptos</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{blockchainStats.nftInvoices}</p>
                <p className="text-xs text-gray-400">NFT Invoices</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-600/20 rounded-lg">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{blockchainStats.verifiedTransactions}</p>
                <p className="text-xs text-gray-400">Verified</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{blockchainStats.ipfsFiles}</p>
                <p className="text-xs text-gray-400">IPFS Files</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-600/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatCurrency(blockchainStats.totalSecuredValue)}</p>
                <p className="text-xs text-gray-400">Secured Value</p>
              </div>
            </div>
          </div>
        </div>

        {trustScore !== null && (
          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TrustScoreDisplay
                userId={user?.id || ''}
                currentScore={trustScore}
                canUpdate={false}
              />
            </div>
            <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Blockchain Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300">Immutable invoice records with cryptographic proof</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300">Decentralized file storage with IPFS integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300">Transparent trust scoring and reputation tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300">Smart contract-based escrow and payment automation</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`p-4 rounded-lg ${link.color} transition-colors group`}
            >
              <div className="flex flex-col items-center text-center">
                <link.icon className="h-8 w-8 text-white mb-2" />
                <span className="text-white font-medium text-sm">{link.title}</span>
                <span className="text-white/70 text-xs mt-1">{link.description}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <Link
              href="/notifications"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm">{activity.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-500 text-xs">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Navigation */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Explore Platform</h2>
          <div className="space-y-3">
            <Link
              href="/opportunities"
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-700/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Work Opportunities</h3>
                  <p className="text-gray-400 text-sm">Find new projects and gigs</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/services"
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-700/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Browse Services</h3>
                  <p className="text-gray-400 text-sm">Hire talented freelancers</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/files"
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-700/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">File Management</h3>
                  <p className="text-gray-400 text-sm">Organize project files</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/reputation"
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-700/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Reputation & Reviews</h3>
                  <p className="text-gray-400 text-sm">Build your professional reputation</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Invoices</h2>
          <Link
            href="/invoices"
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <InvoiceTable invoices={invoices.slice(0, 5)} />
      </div>

      {/* System Status */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-white font-medium">All Systems Operational</p>
              <p className="text-gray-400 text-sm">Platform running smoothly</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-white font-medium">Payments Processing</p>
              <p className="text-gray-400 text-sm">99.9% uptime</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-white font-medium">Maintenance Scheduled</p>
              <p className="text-gray-400 text-sm">Nov 15, 2:00 AM UTC</p>
            </div>
          </div>
        </div>
      </div>

      {creating && (
        <CreateInvoiceModal
          open={creating}
          onClose={() => setCreating(false)}
          onSave={(invoice) => {
            setInvoices([...invoices, invoice]);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
