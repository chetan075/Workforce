'use client';

import { useState, useEffect } from 'react';
import { 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  Code, 
  Download, 
  Share, 
  Edit, 
  Trash2, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  X,
  ArrowLeft,
  ArrowRight,
  Eye,
  Unlock,
  Loader,
  AlertTriangle,
  FileSpreadsheet,
  Presentation,
  Database,
  Package,
  Hash,
  Calendar,
  User,
  HardDrive,
  Lock,
  Globe,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Star,
  Info,
  Settings,
  RefreshCw
} from 'lucide-react';

interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  mimeType: string;
  created: string;
  modified: string;
  owner: string;
  permissions: string[];
  description?: string;
  tags: string[];
  thumbnail?: string;
  isEncrypted: boolean;
  cloudProvider?: string;
}

interface PreviewProps {
  file: FileData | null;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function FilePreviewPage() {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [files] = useState<FileData[]>([
    {
      id: '1',
      name: 'Project_Proposal.pdf',
      type: 'pdf',
      size: 2048576,
      url: '/sample-files/project-proposal.pdf',
      mimeType: 'application/pdf',
      created: '2024-10-15T10:30:00Z',
      modified: '2024-10-30T14:45:00Z',
      owner: 'John Doe',
      permissions: ['read', 'write', 'share'],
      description: 'Comprehensive project proposal for Q4 initiative',
      tags: ['proposal', 'project', 'Q4'],
      isEncrypted: true,
      cloudProvider: 'Google Drive'
    },
    {
      id: '2',
      name: 'team_photo.jpg',
      type: 'image',
      size: 1536000,
      url: 'https://picsum.photos/1200/800?random=1',
      mimeType: 'image/jpeg',
      created: '2024-10-20T16:22:00Z',
      modified: '2024-10-20T16:22:00Z',
      owner: 'Jane Smith',
      permissions: ['read', 'share'],
      description: 'Annual team building event photo',
      tags: ['team', 'photo', 'event'],
      thumbnail: 'https://picsum.photos/200/150?random=1',
      isEncrypted: false,
      cloudProvider: 'AWS S3'
    },
    {
      id: '3',
      name: 'presentation.pptx',
      type: 'presentation',
      size: 5242880,
      url: '/sample-files/presentation.pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      created: '2024-10-25T09:15:00Z',
      modified: '2024-10-31T11:30:00Z',
      owner: 'Mike Johnson',
      permissions: ['read', 'write'],
      description: 'Client presentation for upcoming meeting',
      tags: ['presentation', 'client', 'meeting'],
      isEncrypted: false
    },
    {
      id: '4',
      name: 'database_backup.sql',
      type: 'database',
      size: 15728640,
      url: '/sample-files/backup.sql',
      mimeType: 'application/sql',
      created: '2024-10-31T02:00:00Z',
      modified: '2024-10-31T02:00:00Z',
      owner: 'System',
      permissions: ['read'],
      description: 'Automated daily database backup',
      tags: ['backup', 'database', 'system'],
      isEncrypted: true,
      cloudProvider: 'Dropbox'
    },
    {
      id: '5',
      name: 'demo_video.mp4',
      type: 'video',
      size: 52428800,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      mimeType: 'video/mp4',
      created: '2024-10-28T14:20:00Z',
      modified: '2024-10-28T14:20:00Z',
      owner: 'Sarah Wilson',
      permissions: ['read', 'write', 'share'],
      description: 'Product demonstration video for marketing',
      tags: ['video', 'demo', 'marketing'],
      isEncrypted: false,
      cloudProvider: 'OneDrive'
    },
    {
      id: '6',
      name: 'financial_report.xlsx',
      type: 'spreadsheet',
      size: 1048576,
      url: '/sample-files/report.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      created: '2024-10-29T08:45:00Z',
      modified: '2024-10-31T16:20:00Z',
      owner: 'David Chen',
      permissions: ['read', 'write'],
      description: 'Q3 financial analysis and projections',
      tags: ['finance', 'report', 'Q3'],
      isEncrypted: true
    }
  ]);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  const getFileIcon = (type: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
    
    switch (type) {
      case 'image':
        return <Image className={`${sizeClass} text-green-600`} />;
      case 'pdf':
        return <FileText className={`${sizeClass} text-red-600`} />;
      case 'video':
        return <Video className={`${sizeClass} text-purple-600`} />;
      case 'audio':
        return <Music className={`${sizeClass} text-yellow-600`} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={`${sizeClass} text-green-600`} />;
      case 'presentation':
        return <Presentation className={`${sizeClass} text-orange-600`} />;
      case 'archive':
        return <Archive className={`${sizeClass} text-purple-600`} />;
      case 'code':
        return <Code className={`${sizeClass} text-blue-600`} />;
      case 'database':
        return <Database className={`${sizeClass} text-indigo-600`} />;
      default:
        return <File className={`${sizeClass} text-gray-600`} />;
    }
  };

  const openPreview = (file: FileData) => {
    setSelectedFile(file);
  };

  const closePreview = () => {
    setSelectedFile(null);
  };

  const navigateToNext = () => {
    if (selectedFile) {
      const currentIndex = files.findIndex(f => f.id === selectedFile.id);
      const nextIndex = (currentIndex + 1) % files.length;
      setSelectedFile(files[nextIndex]);
    }
  };

  const navigateToPrevious = () => {
    if (selectedFile) {
      const currentIndex = files.findIndex(f => f.id === selectedFile.id);
      const previousIndex = currentIndex === 0 ? files.length - 1 : currentIndex - 1;
      setSelectedFile(files[previousIndex]);
    }
  };

  const currentIndex = selectedFile ? files.findIndex(f => f.id === selectedFile.id) : -1;
  const hasNext = currentIndex < files.length - 1;
  const hasPrevious = currentIndex > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">File Preview System</h1>
          <p className="text-gray-600">
            Preview and interact with files across multiple formats and types
          </p>
        </div>

        {/* File Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openPreview(file)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                {file.thumbnail && file.type === 'image' ? (
                  <img 
                    src={file.thumbnail} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    {getFileIcon(file.type, 'lg')}
                    <span className="text-xs mt-2 uppercase font-medium">{file.type}</span>
                  </div>
                )}
                
                {/* Preview Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* File Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </h3>
                  {file.isEncrypted && (
                    <Lock className="h-4 w-4 text-yellow-600 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{formatFileSize(file.size)}</p>
                
                {file.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {file.description}
                  </p>
                )}

                {/* Tags */}
                {file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {file.tags.slice(0, 2).map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {file.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{file.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Cloud Provider */}
                {file.cloudProvider && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Globe className="h-3 w-3 mr-1" />
                    {file.cloudProvider}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {selectedFile && (
          <FilePreviewModal
            file={selectedFile}
            onClose={closePreview}
            onNext={navigateToNext}
            onPrevious={navigateToPrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        )}
      </div>
    </div>
  );
}

function FilePreviewModal({ file, onClose, onNext, onPrevious, hasNext, hasPrevious }: PreviewProps) {
  if (!file) return null;
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'details' | 'activity'>('preview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrevious) onPrevious();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious, hasNext, hasPrevious]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const renderPreviewContent = () => {
    switch (file.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            <img
              src={file.url}
              alt={file.name}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('Failed to load image');
              }}
              className="transition-transform duration-300"
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full">
            <video
              src={file.url}
              controls
              className="max-w-full max-h-full"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('Failed to load video');
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'pdf':
        return (
          <div className="h-full">
            <iframe
              src={`${file.url}#view=FitH`}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              title={file.name}
            />
          </div>
        );

      case 'code':
      case 'database':
        return (
          <div className="h-full p-4 bg-gray-900 text-gray-100 overflow-auto">
            <pre className="text-sm font-mono">
              {/* Placeholder for code content */}
              <code>
                {`-- ${file.name}
-- This is a preview of the file content
-- Actual content would be loaded from the server

SELECT * FROM users 
WHERE created_date >= '2024-01-01'
ORDER BY id DESC
LIMIT 100;

-- Additional content would continue here...`}
              </code>
            </pre>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {getFileIcon(file.type, 'lg')}
            <h3 className="text-lg font-medium mt-4 mb-2">Preview Not Available</h3>
            <p className="text-sm text-center max-w-md">
              Preview is not supported for this file type. You can download the file to view its contents.
            </p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download File
            </button>
          </div>
        );
    }
  };

  const getFileIcon = (type: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-12 w-12' : 'h-6 w-6';
    
    switch (type) {
      case 'image':
        return <Image className={`${sizeClass} text-green-600`} />;
      case 'pdf':
        return <FileText className={`${sizeClass} text-red-600`} />;
      case 'video':
        return <Video className={`${sizeClass} text-purple-600`} />;
      case 'audio':
        return <Music className={`${sizeClass} text-yellow-600`} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={`${sizeClass} text-green-600`} />;
      case 'presentation':
        return <Presentation className={`${sizeClass} text-orange-600`} />;
      case 'archive':
        return <Archive className={`${sizeClass} text-purple-600`} />;
      case 'code':
        return <Code className={`${sizeClass} text-blue-600`} />;
      case 'database':
        return <Database className={`${sizeClass} text-indigo-600`} />;
      default:
        return <File className={`${sizeClass} text-gray-600`} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {getFileIcon(file.type)}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{file.name}</h2>
              <p className="text-sm text-gray-600">{formatFileSize(file.size)} • {file.mimeType}</p>
            </div>
          </div>
          
          {file.isEncrypted && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              <Lock className="h-3 w-3" />
              Encrypted
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous file"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next file"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* View Controls */}
          {file.type === 'image' && (
            <>
              <button
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Zoom out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600 px-2">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(300, zoom + 25))}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Zoom in"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={() => setRotation((rotation - 90) % 360)}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Rotate left"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setRotation((rotation + 90) % 360)}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Rotate right"
              >
                <RotateCw className="h-5 w-5" />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-2" />
            </>
          )}

          {/* Action Buttons */}
          <button className="p-2 text-gray-600 hover:text-gray-900" title="Download">
            <Download className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900" title="Share">
            <Share className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900" title="Edit">
            <Edit className="h-5 w-5" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Preview */}
        <div className="flex-1 relative bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading File</h3>
                <p className="text-gray-600">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 inline mr-2" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {!error && renderPreviewContent()}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b">
            <nav className="flex">
              {[
                { id: 'preview', name: 'Preview', icon: Eye },
                { id: 'details', name: 'Details', icon: Info },
                { id: 'activity', name: 'Activity', icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-left border rounded hover:bg-gray-50">
                      <Download className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Download Original</span>
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-left border rounded hover:bg-gray-50">
                      <Share className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Share File</span>
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-left border rounded hover:bg-gray-50">
                      <Edit className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Edit in App</span>
                    </button>
                  </div>
                </div>

                {file.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600">{file.description}</p>
                  </div>
                )}

                {file.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {file.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">File Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">File ID:</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-gray-100 px-1 rounded">{file.id}</code>
                        <button 
                          onClick={() => copyToClipboard(file.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Size:</span>
                      <span className="text-sm font-medium">{formatFileSize(file.size)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">{file.mimeType}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium">{formatDate(file.created)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Modified:</span>
                      <span className="text-sm font-medium">{formatDate(file.modified)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Owner:</span>
                      <span className="text-sm font-medium">{file.owner}</span>
                    </div>

                    {file.cloudProvider && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Storage:</span>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-blue-600" />
                          <span className="text-sm font-medium">{file.cloudProvider}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Encryption:</span>
                      <div className="flex items-center gap-1">
                        {file.isEncrypted ? (
                          <>
                            <Lock className="h-3 w-3 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-600">Encrypted</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3 text-gray-400" />
                            <span className="text-sm font-medium text-gray-400">Not encrypted</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Permissions</h3>
                  <div className="space-y-2">
                    {file.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 capitalize">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'File accessed', user: 'You', time: '5 minutes ago' },
                    { action: 'Shared with team', user: file.owner, time: '2 hours ago' },
                    { action: 'File modified', user: file.owner, time: '1 day ago' },
                    { action: 'File uploaded', user: file.owner, time: '3 days ago' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">by {activity.user}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}