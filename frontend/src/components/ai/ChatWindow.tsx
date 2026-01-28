import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ActionSuggestion[];
}

interface ActionSuggestion {
  type: 'shortlist' | 'lock' | 'create_task';
  label: string;
  data: any;
}

interface ChatWindowProps {
  onActionExecute?: (action: ActionSuggestion) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onActionExecute }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Counsellor. I'm here to guide you through your study abroad journey. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I understand your query. Based on your profile, I can help you with university recommendations, application guidance, or answer any specific questions you have. What would you like to focus on?",
        timestamp: new Date(),
        actions: [
          {
            type: 'shortlist',
            label: 'View University Recommendations',
            data: {},
          },
        ],
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-soft border border-nude-100">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-nude-200">
        <div className="w-10 h-10 bg-gradient-to-br from-sand-600 to-nude-600 rounded-full flex items-center justify-center text-white text-xl">
          🤖
        </div>
        <div>
          <h3 className="font-semibold text-nude-900">AI Counsellor</h3>
          <p className="text-xs text-nude-600">Online • Ready to help</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-sand-700 text-white'
                  : 'bg-nude-100 text-nude-900'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => onActionExecute?.(action)}
                      className="w-full px-3 py-2 text-sm bg-white text-sand-700 rounded-lg hover:bg-sand-50 transition-colors border border-sand-300"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-nude-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-nude-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-nude-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-nude-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-nude-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your study abroad journey..."
            className="flex-1 px-4 py-3 rounded-lg border-2 border-nude-200 focus:border-sand-500 focus:outline-none resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            variant="primary"
            className="px-6"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button className="px-3 py-1.5 text-xs bg-nude-100 text-nude-700 rounded-full hover:bg-nude-200 transition-colors">
            Recommend universities
          </button>
          <button className="px-3 py-1.5 text-xs bg-nude-100 text-nude-700 rounded-full hover:bg-nude-200 transition-colors">
            Profile analysis
          </button>
          <button className="px-3 py-1.5 text-xs bg-nude-100 text-nude-700 rounded-full hover:bg-nude-200 transition-colors">
            Application help
          </button>
        </div>
      </div>
    </div>
  );
};
