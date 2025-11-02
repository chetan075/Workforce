'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Code, 
  Clock, 
  DollarSign, 
  Globe, 
  Target, 
  Zap, 
  Award, 
  Eye, 
  Heart, 
  Bookmark, 
  Share2, 
  MoreHorizontal, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  ChevronDown, 
  ChevronRight, 
  X, 
  Plus, 
  Minus, 
  Settings, 
  BarChart3, 
  PieChart, 
  Activity, 
  Calendar, 
  Building, 
  GraduationCap, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Sparkles,
  Flame,
  Crown,
  Medal,
  Hash,
  AtSign,
  Phone,
  Mail,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Layers,
  Compass,
  Navigation,
  Radio,
  Radar,
  ShoppingBag
} from 'lucide-react';

interface SearchFilters {
  query: string;
  category: 'all' | 'projects' | 'freelancers' | 'services';
  skills: string[];
  location: string;
  budget: {
    min: number;
    max: number;
  };
  experience: 'entry' | 'intermediate' | 'expert' | 'all';
  availability: 'available' | 'busy' | 'all';
  rating: number;
  verified: boolean;
  remote: boolean;
  sortBy: 'relevance' | 'rating' | 'price' | 'date' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'project' | 'freelancer' | 'service';
  title: string;
  description: string;
  user?: {
    id: string;
    name: string;
    profileImage?: string;
    rating: number;
    reviews: number;
    location: string;
    timezone: string;
    isVerified: boolean;
    isOnline: boolean;
  };
  project?: {
    budget: number;
    duration: string;
    difficulty: 'entry' | 'intermediate' | 'expert';
    applicants: number;
    deadline: string;
    isUrgent: boolean;
  };
  service?: {
    price: number;
    deliveryTime: string;
    orders: number;
    category: string;
  };
  skills: string[];
  location: string;
  rating: number;
  featured: boolean;
  trending: boolean;
  matchScore?: number;
  createdAt: string;
  tags: string[];
}

interface Recommendation {
  id: string;
  type: 'project' | 'freelancer' | 'service';
  title: string;
  reason: string;
  confidence: number;
  result: SearchResult;
}

interface TrendingItem {
  id: string;
  type: 'skill' | 'project' | 'freelancer' | 'location';
  name: string;
  growth: number;
  volume: number;
  category?: string;
}

export default function SearchDiscoveryPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'recommendations' | 'trending' | 'matching' | 'geographic'>('search');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    skills: [],
    location: '',
    budget: { min: 0, max: 10000 },
    experience: 'all',
    availability: 'all',
    rating: 0,
    verified: false,
    remote: false,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  // Mock data - in real app, this would come from APIs
  const [searchResults, setSearchResults] = useState<SearchResult[]>([
    {
      id: 'proj-1',
      type: 'project',
      title: 'E-commerce Website Development',
      description: 'Looking for an experienced React developer to build a modern e-commerce platform with payment integration and admin dashboard.',
      project: {
        budget: 5000,
        duration: '6 weeks',
        difficulty: 'intermediate',
        applicants: 23,
        deadline: '2024-12-15',
        isUrgent: false
      },
      skills: ['React', 'Node.js', 'MongoDB', 'Payment Integration'],
      location: 'Remote',
      rating: 0,
      featured: true,
      trending: false,
      matchScore: 92,
      createdAt: '2024-10-30T10:00:00Z',
      tags: ['web-development', 'ecommerce', 'full-stack']
    },
    {
      id: 'freelancer-1',
      type: 'freelancer',
      title: 'Sarah Chen - Full Stack Developer',
      description: 'Experienced full-stack developer specializing in React, Node.js, and cloud deployments. 5+ years of experience building scalable web applications.',
      user: {
        id: 'user-1',
        name: 'Sarah Chen',
        profileImage: 'https://i.pravatar.cc/150?u=sarah',
        rating: 4.9,
        reviews: 127,
        location: 'San Francisco, CA',
        timezone: 'PST',
        isVerified: true,
        isOnline: true
      },
      skills: ['React', 'Node.js', 'AWS', 'TypeScript', 'PostgreSQL'],
      location: 'San Francisco, CA',
      rating: 4.9,
      featured: false,
      trending: true,
      matchScore: 88,
      createdAt: '2024-01-15T08:00:00Z',
      tags: ['full-stack', 'react-expert', 'aws-certified']
    },
    {
      id: 'service-1',
      type: 'service',
      title: 'Professional Logo Design',
      description: 'I will create a stunning, professional logo for your business with unlimited revisions and multiple file formats.',
      user: {
        id: 'user-2',
        name: 'Alex Rivera',
        profileImage: 'https://i.pravatar.cc/150?u=alex',
        rating: 4.8,
        reviews: 89,
        location: 'Los Angeles, CA',
        timezone: 'PST',
        isVerified: true,
        isOnline: false
      },
      service: {
        price: 150,
        deliveryTime: '3 days',
        orders: 245,
        category: 'Design'
      },
      skills: ['Logo Design', 'Branding', 'Adobe Illustrator', 'Creative Design'],
      location: 'Los Angeles, CA',
      rating: 4.8,
      featured: false,
      trending: false,
      matchScore: 75,
      createdAt: '2024-09-20T14:30:00Z',
      tags: ['logo-design', 'branding', 'graphic-design']
    }
  ]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: 'rec-1',
      type: 'project',
      title: 'React Native Mobile App',
      reason: 'Based on your React expertise and mobile development interest',
      confidence: 94,
      result: {
        id: 'proj-2',
        type: 'project',
        title: 'React Native Mobile App Development',
        description: 'Need a skilled developer to create a cross-platform mobile app for our fintech startup.',
        project: {
          budget: 8000,
          duration: '8 weeks',
          difficulty: 'expert',
          applicants: 15,
          deadline: '2024-12-20',
          isUrgent: true
        },
        skills: ['React Native', 'TypeScript', 'Firebase', 'Mobile UI/UX'],
        location: 'Remote',
        rating: 0,
        featured: true,
        trending: true,
        createdAt: '2024-10-29T12:00:00Z',
        tags: ['mobile-development', 'react-native', 'fintech']
      }
    },
    {
      id: 'rec-2',
      type: 'freelancer',
      title: 'Mike Johnson - DevOps Engineer',
      reason: 'Highly rated DevOps expert with skills complementary to your stack',
      confidence: 87,
      result: {
        id: 'freelancer-2',
        type: 'freelancer',
        title: 'Mike Johnson - DevOps Engineer',
        description: 'AWS certified DevOps engineer with expertise in CI/CD, containerization, and cloud infrastructure.',
        user: {
          id: 'user-3',
          name: 'Mike Johnson',
          rating: 4.9,
          reviews: 156,
          location: 'Austin, TX',
          timezone: 'CST',
          isVerified: true,
          isOnline: true
        },
        skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
        location: 'Austin, TX',
        rating: 4.9,
        featured: false,
        trending: false,
        createdAt: '2024-02-10T09:30:00Z',
        tags: ['devops', 'aws', 'kubernetes']
      }
    }
  ]);

  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([
    { id: 'trend-1', type: 'skill', name: 'AI/Machine Learning', growth: 45.2, volume: 1250, category: 'Technology' },
    { id: 'trend-2', type: 'skill', name: 'React Native', growth: 32.1, volume: 890, category: 'Mobile Development' },
    { id: 'trend-3', type: 'project', name: 'E-commerce Development', growth: 28.7, volume: 567, category: 'Web Development' },
    { id: 'trend-4', type: 'location', name: 'Remote Work', growth: 156.3, volume: 2340, category: 'Location' },
    { id: 'trend-5', type: 'freelancer', name: 'Blockchain Developers', growth: 67.8, volume: 234, category: 'Blockchain' },
    { id: 'trend-6', type: 'skill', name: 'DevOps', growth: 23.4, volume: 678, category: 'Infrastructure' }
  ]);

  const availableSkills = [
    'React', 'Node.js', 'Python', 'TypeScript', 'JavaScript', 'AWS', 'Docker', 'Kubernetes',
    'MongoDB', 'PostgreSQL', 'GraphQL', 'Vue.js', 'Angular', 'React Native', 'Flutter',
    'Machine Learning', 'AI', 'Blockchain', 'DevOps', 'UI/UX Design', 'Logo Design',
    'Figma', 'Adobe Creative Suite', 'WordPress', 'Shopify', 'Firebase', 'Laravel'
  ];

  const handleSearch = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Filter results based on current filters
      let filtered = searchResults;
      
      if (filters.query) {
        filtered = filtered.filter(result => 
          result.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          result.description.toLowerCase().includes(filters.query.toLowerCase()) ||
          result.skills.some(skill => skill.toLowerCase().includes(filters.query.toLowerCase()))
        );
      }

      if (filters.category !== 'all') {
        filtered = filtered.filter(result => {
          if (filters.category === 'projects') return result.type === 'project';
          if (filters.category === 'freelancers') return result.type === 'freelancer';
          if (filters.category === 'services') return result.type === 'service';
          return true;
        });
      }

      if (filters.skills.length > 0) {
        filtered = filtered.filter(result => 
          filters.skills.some(skill => result.skills.includes(skill))
        );
      }

      if (filters.verified) {
        filtered = filtered.filter(result => 
          result.user?.isVerified === true
        );
      }

      setSearchResults(filtered);
      setLoading(false);
    }, 1000);
  };

  const addSkillFilter = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkillFilter = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 50) return <Flame className="h-4 w-4 text-red-500" />;
    if (growth > 25) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth > 0) return <ArrowUp className="h-4 w-4 text-blue-500" />;
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const time = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search & Discovery</h1>
              <p className="text-gray-600 mt-1">
                Find the perfect projects, freelancers, and opportunities
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-600 hover:text-gray-900 border rounded-lg"
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.skills.length > 0 || filters.verified || filters.location) && (
                  <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                    {filters.skills.length + (filters.verified ? 1 : 0) + (filters.location ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for projects, freelancers, services, or skills..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-24 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700">Quick filters:</span>
            {['Projects', 'Freelancers', 'Services', 'Remote', 'Verified'].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  if (filter === 'Projects') setFilters(prev => ({ ...prev, category: 'projects' }));
                  else if (filter === 'Freelancers') setFilters(prev => ({ ...prev, category: 'freelancers' }));
                  else if (filter === 'Services') setFilters(prev => ({ ...prev, category: 'services' }));
                  else if (filter === 'Remote') setFilters(prev => ({ ...prev, remote: !prev.remote }));
                  else if (filter === 'Verified') setFilters(prev => ({ ...prev, verified: !prev.verified }));
                }}
                className={`px-3 py-1 text-sm rounded-full border ${
                  (filter === 'Projects' && filters.category === 'projects') ||
                  (filter === 'Freelancers' && filters.category === 'freelancers') ||
                  (filter === 'Services' && filters.category === 'services') ||
                  (filter === 'Remote' && filters.remote) ||
                  (filter === 'Verified' && filters.verified)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="projects">Projects</option>
                  <option value="freelancers">Freelancers</option>
                  <option value="services">Services</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="City, State, or Country"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <select
                  value={filters.experience}
                  onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Rating</option>
                  <option value="price">Price</option>
                  <option value="date">Date</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>

            {/* Skills Filter */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {filters.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkillFilter(skill)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSkills.filter(skill => !filters.skills.includes(skill)).slice(0, 10).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => addSkillFilter(skill)}
                    className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Range */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    placeholder="Min ($)"
                    value={filters.budget.min || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      budget: { ...prev.budget, min: parseInt(e.target.value) || 0 } 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max ($)"
                    value={filters.budget.max || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      budget: { ...prev.budget, max: parseInt(e.target.value) || 10000 } 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="mt-6 flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Verified only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.remote}
                  onChange={(e) => setFilters(prev => ({ ...prev, remote: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Remote work</span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'search', name: 'Search Results', icon: Search },
                { id: 'recommendations', name: 'Recommendations', icon: Target },
                { id: 'trending', name: 'Trending', icon: TrendingUp },
                { id: 'matching', name: 'Skill Matching', icon: Zap },
                { id: 'geographic', name: 'Geographic', icon: MapPin }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                    {tab.id === 'search' && searchResults.length > 0 && (
                      <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {searchResults.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Search Results Tab */}
          {activeTab === 'search' && (
            <div className="p-6">
              {searchResults.length > 0 ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                        result.featured ? 'border-blue-200 bg-blue-50' : ''
                      } ${viewMode === 'list' ? 'flex items-start gap-6' : ''}`}
                    >
                      {/* Result Header */}
                      <div className={`${viewMode === 'list' ? 'flex-1' : 'mb-4'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-lg">{result.title}</h3>
                            {result.featured && <Crown className="h-4 w-4 text-yellow-500" />}
                            {result.trending && <Flame className="h-4 w-4 text-red-500" />}
                          </div>
                          {result.matchScore && (
                            <span className={`text-sm font-medium ${getMatchScoreColor(result.matchScore)}`}>
                              {result.matchScore}% match
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">{result.description}</p>

                        {/* Type-specific Info */}
                        {result.type === 'project' && result.project && (
                          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(result.project.budget)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {result.project.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {result.project.applicants} applicants
                            </span>
                            {result.project.isUrgent && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                Urgent
                              </span>
                            )}
                          </div>
                        )}

                        {result.type === 'freelancer' && result.user && (
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{result.user.rating}</span>
                              <span className="text-sm text-gray-600">({result.user.reviews} reviews)</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {result.user.location}
                            </div>
                            {result.user.isOnline && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                Online
                              </span>
                            )}
                            {result.user.isVerified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        )}

                        {result.type === 'service' && result.service && (
                          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(result.service.price)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {result.service.deliveryTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-4 w-4" />
                              {result.service.orders} orders
                            </span>
                          </div>
                        )}

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {result.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {result.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                              +{result.skills.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatTimeAgo(result.createdAt)}</span>
                            <span>•</span>
                            <span className="capitalize">{result.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-red-500">
                              <Heart className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-blue-500">
                              <Bookmark className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {viewMode === 'list' && (
                        <div className="flex-shrink-0">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            View Details
                          </button>
                        </div>
                      )}

                      {viewMode === 'grid' && (
                        <div className="mt-4">
                          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or explore trending opportunities
                  </p>
                  <button
                    onClick={() => setActiveTab('trending')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Explore Trending
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Recommendations</h3>
                <p className="text-gray-600">
                  Based on your profile, skills, and activity, here are personalized suggestions for you.
                </p>
              </div>

              <div className="space-y-6">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Target className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              {rec.confidence}% confidence
                            </span>
                            <span className="text-xs text-gray-500 capitalize">{rec.type}</span>
                          </div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        View Details
                      </button>
                    </div>

                    {/* Recommended Item Preview */}
                    <div className="bg-white rounded-lg p-4 border">
                      <h5 className="font-medium text-gray-900 mb-2">{rec.result.title}</h5>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rec.result.description}</p>
                      
                      {rec.result.project && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatCurrency(rec.result.project.budget)}</span>
                          <span>{rec.result.project.duration}</span>
                          <span className="capitalize">{rec.result.project.difficulty}</span>
                          {rec.result.project.isUrgent && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Urgent</span>
                          )}
                        </div>
                      )}

                      {rec.result.user && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span>{rec.result.user.rating}</span>
                          </div>
                          <span>{rec.result.user.location}</span>
                          {rec.result.user.isVerified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {rec.result.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation Settings */}
              <div className="mt-8 border rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Improve Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Project Types</label>
                    <div className="space-y-2">
                      {['Web Development', 'Mobile Apps', 'UI/UX Design', 'Data Science'].map((type) => (
                        <label key={type} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range Preference</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>$500 - $2,000</option>
                      <option>$2,000 - $5,000</option>
                      <option>$5,000 - $10,000</option>
                      <option>$10,000+</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trending Tab */}
          {activeTab === 'trending' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trending Now</h3>
                <p className="text-gray-600">
                  Discover what's hot in the freelance marketplace right now.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Skills */}
                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-500" />
                    Hot Skills
                  </h4>
                  <div className="space-y-3">
                    {trendingItems.filter(item => item.type === 'skill').map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${index === 0 ? 'text-red-500' : index === 1 ? 'text-orange-500' : index === 2 ? 'text-yellow-500' : 'text-gray-500'}`}>
                            #{index + 1}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">{item.volume} projects</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.growth)}
                          <span className="text-sm font-medium text-green-600">+{item.growth}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Projects */}
                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Popular Projects
                  </h4>
                  <div className="space-y-3">
                    {searchResults.filter(result => result.trending).map((project) => (
                      <div key={project.id} className="p-3 border rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-1">{project.title}</h5>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{project.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {project.project && (
                              <>
                                <span>{formatCurrency(project.project.budget)}</span>
                                <span>{project.project.applicants} applicants</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600">Trending</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Locations */}
                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Hot Locations
                  </h4>
                  <div className="space-y-3">
                    {trendingItems.filter(item => item.type === 'location').map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.volume} opportunities</div>
                        </div>
                        <span className="text-sm font-medium text-green-600">+{item.growth}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Freelancers */}
                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Top Rated This Month
                  </h4>
                  <div className="space-y-3">
                    {searchResults.filter(result => result.type === 'freelancer' && result.featured).map((freelancer) => (
                      <div key={freelancer.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{freelancer.user?.name}</div>
                          <div className="text-sm text-gray-600">{freelancer.user?.location}</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{freelancer.user?.rating}</span>
                          </div>
                          <div className="text-xs text-gray-500">{freelancer.user?.reviews} reviews</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skill Matching Tab */}
          {activeTab === 'matching' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill-Based Matching</h3>
                <p className="text-gray-600">
                  Find the perfect matches based on skill compatibility and expertise levels.
                </p>
              </div>

              {/* Skill Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  <div className="border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Your Skill Profile</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'MongoDB'].map((skill, index) => {
                        const proficiency = [95, 88, 82, 75, 68, 60][index];
                        return (
                          <div key={skill} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{skill}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${proficiency}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 w-8">{proficiency}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Compatibility Score</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">87%</div>
                    <div className="text-sm text-gray-600 mb-4">Average match score</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Excellent (90%+)</span>
                        <span>23%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Good (80-89%)</span>
                        <span>45%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Fair (70-79%)</span>
                        <span>32%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Gap Analysis */}
              <div className="border rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Skill Gap Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">Your Strengths</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Advanced React expertise</li>
                      <li>• Strong TypeScript skills</li>
                      <li>• Full-stack capabilities</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h5 className="font-medium text-yellow-900 mb-2">Growth Opportunities</h5>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Machine Learning basics</li>
                      <li>• DevOps practices</li>
                      <li>• Mobile development</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Market Demand</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• AI/ML integration</li>
                      <li>• Cloud architecture</li>
                      <li>• Blockchain development</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Matched Opportunities */}
              <div className="border rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Best Matches for You</h4>
                <div className="space-y-4">
                  {searchResults.filter(result => result.matchScore && result.matchScore > 80).map((result) => (
                    <div key={result.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{result.title}</h5>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{result.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {result.skills.map((skill) => (
                              <span
                                key={skill}
                                className={`px-2 py-1 rounded text-xs ${
                                  ['React', 'Node.js', 'TypeScript'].includes(skill)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-lg font-bold ${getMatchScoreColor(result.matchScore)}`}>
                            {result.matchScore}%
                          </div>
                          <div className="text-xs text-gray-500">match</div>
                        </div>
                      </div>
                      {result.project && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{formatCurrency(result.project.budget)}</span>
                            <span>{result.project.duration}</span>
                            <span className="capitalize">{result.project.difficulty}</span>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Apply Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Geographic Search Tab */}
          {activeTab === 'geographic' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Geographic Search</h3>
                <p className="text-gray-600">
                  Discover opportunities and talent based on location and time zones.
                </p>
              </div>

              {/* Location Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="City, State, Country"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Radius</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>10 miles</option>
                    <option>25 miles</option>
                    <option>50 miles</option>
                    <option>100 miles</option>
                    <option>Worldwide</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Any</option>
                    <option>EST (UTC-5)</option>
                    <option>CST (UTC-6)</option>
                    <option>MST (UTC-7)</option>
                    <option>PST (UTC-8)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>All</option>
                    <option>Remote Only</option>
                    <option>On-site Only</option>
                    <option>Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="border rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Geographic Distribution</h4>
                <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Interactive map would be displayed here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Showing opportunities and freelancers by location
                    </p>
                  </div>
                </div>
              </div>

              {/* Location-based Results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Local Market Insights</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Average Hourly Rate</div>
                        <div className="text-sm text-gray-600">in your area</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">$75/hr</div>
                        <div className="text-xs text-gray-500">+12% vs national</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Active Projects</div>
                        <div className="text-sm text-gray-600">in your region</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">234</div>
                        <div className="text-xs text-gray-500">this week</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Competition Level</div>
                        <div className="text-sm text-gray-600">freelancer density</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-600">Medium</div>
                        <div className="text-xs text-gray-500">3.2 per project</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Time Zone Compatibility</h4>
                  <div className="space-y-3">
                    {[
                      { zone: 'PST (UTC-8)', overlap: 8, projects: 45 },
                      { zone: 'EST (UTC-5)', overlap: 5, projects: 67 },
                      { zone: 'GMT (UTC+0)', overlap: 3, projects: 23 },
                      { zone: 'IST (UTC+5:30)', overlap: 2, projects: 34 }
                    ].map((tz) => (
                      <div key={tz.zone} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{tz.zone}</div>
                          <div className="text-sm text-gray-600">{tz.overlap}h overlap</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-blue-600">{tz.projects} projects</div>
                          <div className="text-xs text-gray-500">available</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for unimplemented tabs */}
          {!['search', 'recommendations', 'trending', 'matching', 'geographic'].includes(activeTab) && (
            <div className="p-6 text-center py-12">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
              </h3>
              <p className="text-gray-600">
                This section is under development and will be available soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}