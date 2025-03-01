import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Minimize2, Maximize2, Loader2, Wand2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../components/CodeBlock';
import { type ChatMessage } from '../lib/chat';

interface AIChatTemplateProps {
  title: string;
  systemPrompt: string;
  initialMessage?: string;
  model?: string;
  userId: string;
  onSendMessage?: (message: string) => Promise<void>;
  onClose?: () => void;
  className?: string;
  isAdmin?: boolean;
  onConfigureAssistant?: () => void;
}

const MessageContent = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter
            style={atomDark}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
    }}
  >
    {content}
  </ReactMarkdown>
);

export function AIChatTemplate({
  title,
  systemPrompt,
  initialMessage = "Hello! How can I assist you today?",
  model = "gpt-4",
  userId,
  onSendMessage,
  onClose,
  className = "",
  isAdmin = false,
  onConfigureAssistant
}: AIChatTemplateProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: initialMessage }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      
      const response = await onSendMessage?.(userMessage);
      
      if (response?.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an error processing your request. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-navy-900/50 backdrop-blur-sm border border-cyber-blue/20 text-cyber-blue hover:text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="font-medium">{title}</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`${
        isMinimized ? 'h-12' : 'h-[600px]'
      } w-[400px] bg-navy-900/90 rounded-2xl border border-cyber-blue/20 shadow-xl flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 bg-navy-800/50 backdrop-blur-sm border-b border-cyber-blue/30 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-cyber-blue" />
            <span className="font-medium text-cyber-blue">{title}</span>
          </div>
          <div className="flex space-x-2">
            {isAdmin && onConfigureAssistant && (
              <button
                onClick={onConfigureAssistant}
                className="p-2 hover:bg-navy-800/50 rounded-lg text-gray-400 hover:text-white"
              >
                <Wand2 className="h-4 w-4" />
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
              onClick={onClose}
              className="p-1.5 hover:bg-navy-700/50 rounded-lg transition-colors duration-200 text-cyber-blue hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-cyber-blue/20 text-white'
                        : 'bg-navy-800/50 text-white'
                    }`}
                  >
                    <MessageContent content={message.content} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-navy-800/50 rounded-lg p-3">
                    <Loader2 className="h-5 w-5 animate-spin text-cyber-blue" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-cyber-blue/20">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-navy-800/50 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-cyber-blue/20 focus:outline-none focus:border-cyber-blue"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 bg-cyber-blue/20 rounded-lg border border-cyber-blue text-cyber-blue hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
