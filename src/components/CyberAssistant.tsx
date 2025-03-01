import React, { useState } from 'react';
import { Bot, Send, X, Maximize2, Minimize2 } from 'lucide-react';

export function CyberAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isBot: boolean }>>([
    { text: "Hello! I'm here to help with basic questions about our services. What would you like to know?", isBot: true }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: message, isBot: false }]);

    // Simple bot responses based on keywords
    const userMessage = message.toLowerCase();
    let botResponse = "I can only answer basic questions about our services. For detailed inquiries, please contact our team.";

    if (userMessage.includes('service') || userMessage.includes('offer')) {
      botResponse = "We offer security consulting and Ansible automation services to help organizations improve their security posture and infrastructure automation.";
    } else if (userMessage.includes('contact') || userMessage.includes('reach')) {
      botResponse = "Please use the contact form on our website to get in touch with our team.";
    } else if (userMessage.includes('price') || userMessage.includes('cost')) {
      botResponse = "Pricing varies based on project scope and requirements. Please contact our sales team for a custom quote.";
    } else if (userMessage.includes('location') || userMessage.includes('where')) {
      botResponse = "We provide remote consulting services globally.";
    }

    // Add bot response with delay
    setTimeout(() => {
      setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 500);

    setMessage('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 group flex items-center space-x-2 bg-navy-900/50 backdrop-blur-sm border border-cyber-blue/20 text-cyber-blue hover:text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300"
      >
        <Bot className="h-6 w-6" />
        <span className="animated-text">
          {Array.from("Quick Help").map((char, index) => (
            <span
              key={index}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {char}
            </span>
          ))}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 w-96 bg-navy-900/90 backdrop-blur-sm rounded-2xl border border-cyber-blue/20 shadow-2xl">
      <div className="flex items-center justify-between p-4 bg-navy-800/50 backdrop-blur-sm border-b border-cyber-blue/30 rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-cyber-blue" />
          <span className="font-medium text-cyber-blue">Quick Help</span>
        </div>
        <div className="flex space-x-2">
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
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-navy-700/50 rounded-lg transition-colors duration-200 text-cyber-blue hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.isBot
                      ? 'bg-navy-800/80 backdrop-blur-sm text-gray-300 border border-cyber-blue/10'
                      : 'bg-navy-800/50 backdrop-blur-sm border border-cyber-blue/30 text-cyber-blue'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-cyber-blue/10">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a basic question..."
                className="flex-1 bg-navy-800/80 backdrop-blur-sm border border-cyber-blue/20 rounded-xl px-4 py-2 text-cyber-blue placeholder-cyber-blue/50 focus:outline-none focus:border-cyber-blue/50 transition-colors duration-200"
              />
              <button
                type="submit"
                className="p-2 bg-navy-800/50 backdrop-blur-sm border border-cyber-blue/30 hover:bg-navy-700/50 rounded-xl transition-all duration-300 text-cyber-blue hover:text-white"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
