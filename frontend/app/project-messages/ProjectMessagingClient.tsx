"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  MessageSquare, 
  Users, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Send,
  Paperclip,
  User,
  Hash,
  ArrowLeft
} from 'lucide-react';
import { fetchWorkOpportunities, fetchMe } from '@/lib/api';

interface ProjectChannel {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  projectTitle: string;
  type: 'general' | 'updates' | 'files' | 'custom';
  memberCount: number;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  };
  unreadCount: number;
  isPrivate: boolean;
  createdAt: string;
}

interface ProjectMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'CLIENT' | 'FREELANCER';
  createdAt: string;
  channelId: string;
  mentions: string[];
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  clientId: string;
  clientName: string;
  freelancerId?: string;
  freelancerName?: string;
  createdAt: string;
  deadline?: string;
  channels: ProjectChannel[];
}

export default function ProjectMessagingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ProjectChannel | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showMobileChannels, setShowMobileChannels] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileChannels(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = await fetchMe();
      setCurrentUser(user);
      
      // Mock project data with channels
      const mockProjects: Project[] = [
        {
          id: 'proj_001',
          title: 'E-commerce Website Redesign',
          description: 'Complete redesign of the company e-commerce platform',
          budget: 5000,
          status: 'ACTIVE',
          clientId: '1',
          clientName: 'Sarah Johnson',
          freelancerId: user.id,
          freelancerName: user.name,
          createdAt: '2025-10-28T10:00:00Z',
          deadline: '2025-12-01T00:00:00Z',
          channels: [
            {
              id: 'ch_001',
              name: 'general',
              description: 'General project discussion',
              projectId: 'proj_001',
              projectTitle: 'E-commerce Website Redesign',
              type: 'general',
              memberCount: 2,
              lastMessage: {
                content: 'The wireframes look great! Ready to move to the next phase.',
                senderId: '1',
                senderName: 'Sarah Johnson',
                createdAt: '2025-11-01T15:30:00Z'
              },
              unreadCount: 3,
              isPrivate: false,
              createdAt: '2025-10-28T10:00:00Z'
            },
            {
              id: 'ch_002',
              name: 'design-updates',
              description: 'Design reviews and updates',
              projectId: 'proj_001',
              projectTitle: 'E-commerce Website Redesign',
              type: 'updates',
              memberCount: 2,
              lastMessage: {
                content: 'Updated the color scheme based on your feedback',
                senderId: user.id,
                senderName: user.name,
                createdAt: '2025-11-01T14:20:00Z'
              },
              unreadCount: 0,
              isPrivate: false,
              createdAt: '2025-10-29T09:15:00Z'
            },
            {
              id: 'ch_003',
              name: 'files',
              description: 'Project files and documents',
              projectId: 'proj_001',
              projectTitle: 'E-commerce Website Redesign',
              type: 'files',
              memberCount: 2,
              unreadCount: 1,
              isPrivate: false,
              createdAt: '2025-10-28T10:30:00Z'
            }
          ]
        },
        {
          id: 'proj_002',
          title: 'Mobile App Development',
          description: 'iOS and Android app for restaurant ordering',
          budget: 8000,
          status: 'ACTIVE',
          clientId: '2',
          clientName: 'Mike Chen',
          freelancerId: user.id,
          freelancerName: user.name,
          createdAt: '2025-10-25T14:20:00Z',
          deadline: '2025-11-30T00:00:00Z',
          channels: [
            {
              id: 'ch_004',
              name: 'general',
              description: 'General project discussion',
              projectId: 'proj_002',
              projectTitle: 'Mobile App Development',
              type: 'general',
              memberCount: 2,
              lastMessage: {
                content: 'The prototype is ready for testing',
                senderId: user.id,
                senderName: user.name,
                createdAt: '2025-11-01T11:45:00Z'
              },
              unreadCount: 0,
              isPrivate: false,
              createdAt: '2025-10-25T14:20:00Z'
            }
          ]
        }
      ];
      
      setProjects(mockProjects);
      
      // Auto-select project if projectId is provided
      if (projectId) {
        const project = mockProjects.find(p => p.id === projectId);
        if (project) {
          setSelectedProject(project);
          if (project.channels.length > 0) {
            setSelectedChannel(project.channels[0]);
            loadChannelMessages(project.channels[0].id);
          }
        }
      } else if (mockProjects.length > 0 && !isMobile) {
        setSelectedProject(mockProjects[0]);
        if (mockProjects[0].channels.length > 0) {
          setSelectedChannel(mockProjects[0].channels[0]);
          loadChannelMessages(mockProjects[0].channels[0].id);
        }
      }
      
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannelMessages = async (channelId: string) => {
    // Mock messages for the channel
    const mockMessages: ProjectMessage[] = [
      {
        id: '1',
        content: 'Welcome to the project! Let\'s discuss the initial requirements.',
        senderId: '1',
        senderName: 'Sarah Johnson',
        senderRole: 'CLIENT',
        createdAt: '2025-10-28T10:30:00Z',
        channelId: channelId,
        mentions: []
      },
      {
        id: '2',
        content: 'Thanks! I\'ve reviewed the brief and have some initial ideas. I\'ll share the wireframes by end of day.',
        senderId: currentUser?.id || 'user',
        senderName: currentUser?.name || 'You',
        senderRole: 'FREELANCER',
        createdAt: '2025-10-28T11:15:00Z',
        channelId: channelId,
        mentions: []
      },
      {
        id: '3',
        content: 'Perfect! Looking forward to seeing them. Also, I\'ve uploaded the brand guidelines to the files channel.',
        senderId: '1',
        senderName: 'Sarah Johnson',
        senderRole: 'CLIENT',
        createdAt: '2025-10-28T12:00:00Z',
        channelId: channelId,
        mentions: []
      },
      {
        id: '4',
        content: 'The wireframes look great! Ready to move to the next phase.',
        senderId: '1',
        senderName: 'Sarah Johnson',
        senderRole: 'CLIENT',
        createdAt: '2025-11-01T15:30:00Z',
        channelId: channelId,
        mentions: []
      }
    ];
    
    setMessages(mockMessages);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChannel || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      const newMessage: ProjectMessage = {
        id: Date.now().toString(),
        content: messageText.trim(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        createdAt: new Date().toISOString(),
        channelId: selectedChannel.id,
        mentions: []
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      
      // Update channel's last message
      if (selectedProject) {
        setSelectedProject(prev => prev ? {
          ...prev,
          channels: prev.channels.map(ch => 
            ch.id === selectedChannel.id 
              ? {
                  ...ch,
                  lastMessage: {
                    content: newMessage.content,
                    senderId: newMessage.senderId,
                    senderName: newMessage.senderName,
                    createdAt: newMessage.createdAt
                  }
                }
              : ch
          )
        } : null);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleChannelSelect = (channel: ProjectChannel) => {
    setSelectedChannel(channel);
    loadChannelMessages(channel.id);
    
    if (isMobile) {
      setShowMobileChannels(false);
    }
    
    // Mark channel as read
    if (selectedProject) {
      setSelectedProject(prev => prev ? {
        ...prev,
        channels: prev.channels.map(ch => 
          ch.id === channel.id ? { ...ch, unreadCount: 0 } : ch
        )
      } : null);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateString);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'general':
        return <Hash className="h-4 w-4" />;
      case 'updates':
        return <AlertCircle className="h-4 w-4" />;
      case 'files':
        return <Paperclip className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getProjectStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'text-green-600 bg-green-100', text: 'Active' };
      case 'COMPLETED':
        return { color: 'text-blue-600 bg-blue-100', text: 'Completed' };
      case 'PAUSED':
        return { color: 'text-yellow-600 bg-yellow-100', text: 'Paused' };
      default:
        return { color: 'text-gray-600 bg-gray-100', text: status };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-screen bg-white shadow-lg overflow-hidden">
          {/* Projects and Channels Sidebar */}
          {(showMobileChannels || !isMobile) && (
            <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r border-gray-200 flex flex-col`}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-gray-900">Project Messages</h1>
                  <button
                    onClick={() => setShowChannelModal(true)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    title="Create new channel"
                    aria-label="Create new channel"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Projects List */}
              <div className="flex-1 overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No active projects</h3>
                    <p className="text-gray-500 mt-1">Start working on projects to access team messaging</p>
                  </div>
                ) : (
                  projects.map((project) => {
                    const isSelected = selectedProject?.id === project.id;
                    const status = getProjectStatus(project.status);
                    
                    return (
                      <div key={project.id} className="mb-4">
                        {/* Project Header */}
                        <div
                          onClick={() => {
                            setSelectedProject(project);
                            if (project.channels.length > 0) {
                              setSelectedChannel(project.channels[0]);
                              loadChannelMessages(project.channels[0].id);
                            }
                          }}
                          className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                            isSelected ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{project.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{project.clientName}</span>
                            {project.freelancerName && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{project.freelancerName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Channels for selected project */}
                        {isSelected && (
                          <div className="bg-gray-50">
                            {project.channels.map((channel) => (
                              <div
                                key={channel.id}
                                onClick={() => handleChannelSelect(channel)}
                                className={`px-6 py-3 cursor-pointer hover:bg-gray-100 border-l-4 ${
                                  selectedChannel?.id === channel.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {getChannelIcon(channel.type)}
                                    <span className="text-sm font-medium text-gray-900">
                                      {channel.name}
                                    </span>
                                    {channel.isPrivate && (
                                      <span className="text-xs text-gray-500">(Private)</span>
                                    )}
                                  </div>
                                  {channel.unreadCount > 0 && (
                                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                      {channel.unreadCount}
                                    </span>
                                  )}
                                </div>
                                {channel.lastMessage && (
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    {channel.lastMessage.senderName}: {channel.lastMessage.content}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Message Area */}
          {(!showMobileChannels || !isMobile) && (
            <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col`}>
              {selectedChannel ? (
                <>
                  {/* Channel Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isMobile && (
                          <button
                            onClick={() => setShowMobileChannels(true)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title="Back to channels"
                            aria-label="Back to channels"
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </button>
                        )}
                        
                        {getChannelIcon(selectedChannel.type)}
                        
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            #{selectedChannel.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {selectedChannel.description} • {selectedChannel.memberCount} members
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                          title="Search in channel"
                          aria-label="Search in channel"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                        <button 
                          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                          title="Channel settings"
                          aria-label="Channel settings"
                        >
                          <Filter className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg inline-block">
                      Project: {selectedProject?.title}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-200px)]">
                    {messages.map((message, index) => {
                      const isOwn = message.senderId === currentUser?.id;
                      const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);
                      
                      return (
                        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            {showAvatar && (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                            
                            <div className={`px-4 py-2 rounded-lg ${
                              isOwn 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            } ${!showAvatar && !isOwn ? 'ml-10' : ''}`}>
                              {!isOwn && showAvatar && (
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium">{message.senderName}</span>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    message.senderRole === 'CLIENT' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {message.senderRole}
                                  </span>
                                </div>
                              )}
                              
                              <p className="text-sm">{message.content}</p>
                              
                              <div className={`flex items-center justify-between mt-1 ${
                                isOwn ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">{formatTime(message.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex items-end space-x-2">
                      <button
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                        title="Attach file"
                        aria-label="Attach file"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      
                      <div className="flex-1">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          placeholder={`Message #${selectedChannel.name}...`}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={sendingMessage}
                        />
                      </div>
                      
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendingMessage}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send message"
                        aria-label="Send message"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900">Select a channel</h3>
                    <p className="text-gray-500 mt-1">Choose a project and channel to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
