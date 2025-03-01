import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Brain, Send, Expand, Shrink, Clock, ChevronRight, ChevronLeft, Paperclip, Loader2, Hash, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessage, deleteMessage, getSessionMessages, deleteChatHistory, deleteSession, type ChatMessage } from '../lib/chat';
import { supabase } from '../lib/supabase';
import { ModelSelector } from './ModelSelector';
import { CodeBlock } from './CodeBlock';

interface ChatWidgetProps {
  userId: string;
}

interface ChatSession {
  id: string;
  preview: string;
  timestamp: string;
}

interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface SavedAssistant {
  id: string;
  title: string;
  createdBy: string;
}

function TokenCount({ count, label }: { count?: number; label: string }) {
  if (typeof count === 'undefined') return null;
  
  return (
    <div className="flex items-center space-x-1 text-xs text-gray-400">
      <Hash className="h-3 w-3" />
      <span>{label}: {count}</span>
    </div>
  );
}

function GlowingText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`chat-glow-text ${className}`}>
      {text.split(' ').map((word, wordIndex) => (
        <React.Fragment key={wordIndex}>
          {wordIndex > 0 && ' '}
          {word.split('').map((char, charIndex) => (
            <span
              key={`${wordIndex}-${charIndex}`}
              style={{
                '--char-index': charIndex + (wordIndex * 10)
              } as React.CSSProperties}
            >
              {char}
            </span>
          ))}
        </React.Fragment>
      ))}
    </span>
  );
}

export function ChatWidget({ userId }: ChatWidgetProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [createdAssistants, setCreatedAssistants] = useState<SavedAssistant[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState('chatgpt-4o-latest');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      loadMessages();
      loadChatSessions();
    }
  }, [isChatOpen, sessionId]);

  useEffect(() => {
    const savedModel = localStorage.getItem('preferred_model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    async function loadCreatedAssistants() {
      const { data, error } = await supabase
        .from('assistants')
        .select('*')
        .eq('createdBy', userId);

      if (error) {
        console.error('Error loading assistants:', error);
      } else {
        setCreatedAssistants(data || []);
      }
    }

    loadCreatedAssistants();
  }, [userId]);

  const handleAssistantSelect = (assistant: SavedAssistant) => {
    console.log('Selected Assistant:', assistant);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function loadMessages() {
    try {
      const messages = await getSessionMessages(sessionId, userId);
      setChatMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function loadChatSessions() {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('session_id, content, created_at')
        .eq('user_id', userId)
        .eq('is_bot', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessionMap = new Map<string, ChatSession>();
      data?.forEach(msg => {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            id: msg.session_id,
            preview: msg.content,
            timestamp: new Date(msg.created_at).toLocaleString()
          });
        }
      });

      setChatSessions(Array.from(sessionMap.values()));
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      setError('Failed to load chat history');
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const result = await deleteMessage(messageId, userId);
      
      if (!result.success) {
        setError(result.error);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Remove the message and its corresponding response from the UI
      setChatMessages(prev => {
        const index = prev.findIndex(msg => msg.id === messageId);
        if (index === -1) return prev;
        
        // If this is a user message and the next message is a bot response, remove both
        if (!prev[index].is_bot && prev[index + 1]?.is_bot) {
          return [...prev.slice(0, index), ...prev.slice(index + 2)];
        }
        // Otherwise just remove this message
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });

      await loadChatSessions();
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    const userMessage = message.trim();
    setMessage('');
    setIsTyping(true);

    // Add user message immediately
    const userMessageObj: ChatMessage = {
      id: crypto.randomUUID(),
      content: userMessage,
      is_bot: false,
      created_at: new Date().toISOString()
    };

    // Add temporary bot message for streaming
    const botMessageObj: ChatMessage = {
      id: crypto.randomUUID(),
      content: '',
      is_bot: true,
      created_at: new Date().toISOString(),
      isStreaming: true
    };

    setChatMessages(prev => [...prev, userMessageObj, botMessageObj]);

    try {
      const result = await sendMessage(
        userMessage,
        userId,
        sessionId,
        (chunk) => {
          setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.is_bot && lastMessage.isStreaming) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + chunk }
              ];
            }
            return prev;
          });
        },
        selectedModel
      );

      if (!result.success) {
        setError(result.error);
        setTimeout(() => setError(null), 3000);
      }

      // Remove streaming flag after completion
      setChatMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.is_bot && lastMessage.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, isStreaming: false }
          ];
        }
        return prev;
      });

      await loadChatSessions();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    setIsMinimized(false);
  };

  const startNewChat = () => {
    setSessionId(crypto.randomUUID());
    setChatMessages([]);
  };

  const switchSession = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('preferred_model', model);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large: Maximum size is 5MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx'];
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        throw new Error('Invalid file type');
      }

      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `chat-uploads/${sessionId}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('chat-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-uploads')
        .getPublicUrl(filePath);

      const upload: FileUpload = {
        id: fileName,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl
      };

      setUploads(prev => [...prev, upload]);

      const fileMessage = `Uploaded file: ${file.name}`;
      await sendMessage(fileMessage, userId, sessionId);
      await loadMessages();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteHistory = async () => {
    if (!window.confirm('Are you sure you want to delete all chat messages? This action cannot be undone.')) {
      return;
    }

    const { success, error } = await deleteChatHistory(userId);
    if (success) {
      setChatMessages([]);
      setChatSessions([]);
      setSessionId(crypto.randomUUID());
    } else {
      setError(error || 'Failed to delete chat history');
    }
  };

  const handleDeleteSession = async (sessionToDelete: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    const { success, error } = await deleteSession(sessionToDelete, userId);
    if (success) {
      // Remove the session from the list
      setChatSessions(prev => prev.filter(session => session.id !== sessionToDelete));
      
      // If we're currently viewing this session, start a new one
      if (sessionId === sessionToDelete) {
        setChatMessages([]);
        setSessionId(crypto.randomUUID());
      }
    } else {
      setError(error || 'Failed to delete chat session');
    }
  };

  return (
    <div className={`fixed transition-all duration-300 ${
      !isChatOpen 
        ? 'bottom-6 right-6 z-[1000]'
        : isFullScreen
          ? 'inset-0 z-[1000]'
          : 'bottom-6 right-6 z-[1000] w-[800px]'
    }`}>
      {!isChatOpen ? (
        <button
          onClick={() => {
            setIsChatOpen(true);
            setIsFullScreen(true);
          }}
          className="group flex items-center space-x-2 bg-navy-900/50 backdrop-blur-sm border border-cyber-blue/20 text-cyber-blue hover:text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300"
        >
          <MessageSquare className="h-5 w-5" />
          <GlowingText text="Chat with AI" />
        </button>
      ) : (
        <div className={`bg-navy-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-cyber-blue/20 flex ${
          isFullScreen ? 'h-full' : 'h-[600px]'
        }`}>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-navy-800/80 backdrop-blur-sm border border-cyber-blue/20 rounded-r-lg transition-all duration-300 text-cyber-blue hover:text-white group ${
              isSidebarCollapsed ? '-translate-x-1' : 'translate-x-[17.5rem]'
            }`}
            title={isSidebarCollapsed ? "Show History" : "Hide History"}
          >
            <div className="transition-transform duration-300 transform group-hover:scale-110">
              {isSidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </div>
          </button>

          <div
            className={`border-r border-cyber-blue/10 transition-all duration-300 ${
              isSidebarCollapsed ? 'w-0 opacity-0' : 'w-72 opacity-100'
            } ${isMinimized ? 'hidden' : 'flex flex-col'}`}
          >
            {!isSidebarCollapsed && (
              <>
                <div className="p-4 border-b border-cyber-blue/10">
                  <button
                    onClick={startNewChat}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg text-cyber-blue hover:text-white transition-all duration-200"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <GlowingText text="New Chat" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {chatSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => switchSession(session.id)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors ${
                        session.id === sessionId ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2 flex-grow overflow-hidden">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{session.preview}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete this conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </button>
                  ))}
                  <div className="flex items-center space-x-2 mb-4">
                    <button
                      onClick={handleDeleteHistory}
                      className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete all chat messages"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete History
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 bg-navy-800/50 backdrop-blur-sm border-b border-cyber-blue/30 rounded-t-2xl flex items-center space-x-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-cyber-blue" />
                <GlowingText text="AI Assistant" />
              </div>
              
              <div className="assistant-selection">
                <label className="block text-sm font-medium text-gray-400">Select AI Assistant</label>
                <select
                  onChange={(e) => handleAssistantSelect(createdAssistants.find(a => a.id === e.target.value) || createdAssistants[0])}
                  className="mt-1 block w-full bg-navy-800/50 text-white border border-cyber-blue/20 rounded-lg focus:outline-none focus:border-cyber-blue"
                >
                  {createdAssistants.map(assistant => (
                    <option key={assistant.id} value={assistant.id}>{assistant.title}</option>
                  ))}
                </select>
              </div>

              <div className="w-64">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                />
              </div>

              <div className="flex-1" />
              
              <div className="flex space-x-2">
                {!isMinimized && (
                  <button
                    onClick={toggleFullScreen}
                    className="p-1.5 hover:bg-navy-700/50 rounded-lg transition-colors duration-200 text-cyber-blue hover:text-white"
                    title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                  >
                    {isFullScreen ? (
                      <Shrink className="h-4 w-4" />
                    ) : (
                      <Expand className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-navy-700/50 rounded-lg transition-colors duration-200 text-cyber-blue hover:text-white"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsChatOpen(false);
                    setIsFullScreen(false);
                  }}
                  className="p-1.5 hover:bg-navy-700/50 rounded-lg transition-colors duration-200 text-cyber-blue hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                  isFullScreen ? 'h-[calc(100vh-8rem)]' : 'max-h-[400px]'
                }`}>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        !msg.is_bot ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl chat-message-glow ${
                          !msg.is_bot
                            ? 'bg-navy-800/50 backdrop-blur-sm border border-cyber-blue/30'
                            : 'bg-navy-800/80 backdrop-blur-sm border border-cyber-blue/10'
                        } group relative`}
                        onMouseMove={handleMouseMove}
                      >
                        {!msg.is_bot && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute -left-10 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-navy-700/50 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300"
                            title="Delete message"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <div className={`prose prose-invert max-w-none ${!msg.is_bot ? '' : 'text-gray-300'}`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                              code: ({ node, inline, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                
                                if (!inline && language) {
                                  return (
                                    <CodeBlock
                                      language={language}
                                      value={String(children).replace(/\n$/, '')}
                                    />
                                  );
                                }
                                
                                return (
                                  <code
                                    className="bg-navy-700/50 px-1.5 py-0.5 rounded text-cyber-blue"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ node, ...props }) => <pre className="bg-transparent my-4" {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-4 border-cyber-blue/30 pl-4 italic" {...props} />
                              ),
                              a: ({ node, ...props }) => (
                                <a className="text-cyber-blue hover:text-white transition-colors" {...props} />
                              ),
                              table: ({ node, ...props }) => (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-cyber-blue/20" {...props} />
                                </div>
                              ),
                              th: ({ node, ...props }) => (
                                <th className="px-3 py-2 text-left text-sm font-semibold border-b border-cyber-blue/20" {...props} />
                              ),
                              td: ({ node, ...props }) => (
                                <td className="px-3 py-2 text-sm border-b border-cyber-blue/10" {...props} />
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {msg.isStreaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-cyber-blue/50 animate-pulse" />
                        )}
                        {msg.usage && (
                          <div className="mt-2 flex items-center space-x-3 border-t border-cyber-blue/10 pt-2">
                            <TokenCount count={msg.usage.promptTokens} label="Prompt" />
                            <TokenCount count={msg.usage.completionTokens} label="Response" />
                            <TokenCount count={msg.usage.totalTokens} label="Total" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-cyber-blue/10">
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isTyping}
                      className={`p-2 bg-navy-800/50 backdrop-blur-sm border border-cyber-blue/30 hover:bg-navy-700/50 rounded-xl transition-all duration-300 text-cyber-blue hover:text-white ${
                        (isUploading || isTyping) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Paperclip className="h-5 w-5" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isTyping ? 'AI is typing...' : 'Type a message...'}
                      disabled={isTyping}
                      className={`flex-1 bg-navy-800/80 backdrop-blur-sm border border-cyber-blue/20 rounded-xl px-4 py-2 chat-input-glow focus:outline-none focus:border-cyber-blue/50 transition-colors duration-200 ${
                        isTyping ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || isTyping}
                      className={`p-2 bg-navy-800/50 backdrop-blur-sm border border-cyber-blue/30 hover:bg-navy-700/50 rounded-xl transition-all duration-300 text-cyber-blue hover:text-white ${
                        (!message.trim() || isTyping) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isTyping ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
