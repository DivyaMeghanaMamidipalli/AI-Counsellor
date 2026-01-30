import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { counsellorApi } from '../../api/counsellor';
import { useUniversitiesStore } from '../../store/universitiesStore';
import { useAuthStore } from '../../store/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ActionSuggestion[];
  recommendations?: {
    dream: number[];
    target: number[];
    safe: number[];
  };
  tasks?: Array<{
    id: number;
    title: string;
    stage?: string;
    status: string;
  }>;
  lockedUniversities?: Array<{
    id: number;
    name: string;
    category?: string;
  }>;
  shortlistedUniversities?: Array<{
    id: number;
    name: string;
    category?: string;
  }>;
}

interface ActionSuggestion {
  type: 'shortlist' | 'lock' | 'create_task' | 'update_task' | 'generate_tasks';
  label: string;
  data: any;
  status?: 'executed' | 'skipped' | 'failed' | string;
}

interface ChatWindowProps {
  onActionExecute?: (action: ActionSuggestion) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onActionExecute }) => {
  const userId = useAuthStore((state) => state.user?.id || 'guest');
  const storageKey = useMemo(() => `ai-counsellor-chat:${userId}`, [userId]);
  const { recommendations, shortlisted, locked, fetchAll } = useUniversitiesStore();
  const defaultMessages = useMemo<Message[]>(() => ([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Counsellor. I'm here to guide you through your study abroad journey. How can I help you today?",
      timestamp: new Date(),
    },
  ]), []);
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setMessages(defaultMessages);
        setIsHydrated(true);
        return;
      }
      const parsed = JSON.parse(stored) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
      if (parsed.length > 0) {
        setMessages(parsed.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })));
      } else {
        setMessages(defaultMessages);
      }
    } catch {
      setMessages(defaultMessages);
    } finally {
      setIsHydrated(true);
    }
  }, [storageKey, defaultMessages]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    try {
      const serialized = messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      }));
      localStorage.setItem(storageKey, JSON.stringify(serialized));
    } catch {
      // ignore storage errors
    }
  }, [messages, isHydrated, storageKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const allUniversities = useMemo(() => (
    [
      ...(recommendations?.dream || []),
      ...(recommendations?.target || []),
      ...(recommendations?.safe || []),
      ...shortlisted,
      ...locked,
    ]
  ), [recommendations, shortlisted, locked]);

  const getUniversityName = (id: number) => {
    const uni = allUniversities.find((item) => item.id === id);
    return uni?.name || `University #${id}`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await counsellorApi.sendMessage(userMessage.content);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply || 'Here is what I recommend based on your profile.',
        timestamp: new Date(),
        recommendations: response.recommendations,
        tasks: response.tasks,
        lockedUniversities: response.locked_universities,
        shortlistedUniversities: response.shortlisted_universities,
        actions: (response.actions || []).map((action) => ({
          type: (action.type as ActionSuggestion['type']) || 'create_task',
          label: `${(action.status || 'executed').toUpperCase()}: ${action.message}`,
          status: action.status,
          data: action,
        })),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I ran into an issue while processing that. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await sendMessage(input);
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

              {message.recommendations && (
                <div className="mt-3 space-y-3">
                  {(message.recommendations.dream?.length > 0 ||
                    message.recommendations.target?.length > 0 ||
                    message.recommendations.safe?.length > 0) ? (
                    <>
                      <div className="text-xs font-semibold text-nude-700">Recommended universities</div>
                      {message.recommendations.dream?.length > 0 && (
                        <div>
                          <div className="text-[11px] text-nude-600 mb-1">🌟 Dream</div>
                          <ul className="text-xs text-nude-800 space-y-1">
                            {message.recommendations.dream.map((id) => (
                              <li key={`dream-${id}`}>{getUniversityName(id)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {message.recommendations.target?.length > 0 && (
                        <div>
                          <div className="text-[11px] text-nude-600 mb-1">🎯 Target</div>
                          <ul className="text-xs text-nude-800 space-y-1">
                            {message.recommendations.target.map((id) => (
                              <li key={`target-${id}`}>{getUniversityName(id)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {message.recommendations.safe?.length > 0 && (
                        <div>
                          <div className="text-[11px] text-nude-600 mb-1">🛟 Safe</div>
                          <ul className="text-xs text-nude-800 space-y-1">
                            {message.recommendations.safe.map((id) => (
                              <li key={`safe-${id}`}>{getUniversityName(id)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-nude-600">No recommendations returned.</div>
                  )}
                </div>
              )}

              {message.actions && message.actions.some((action) => action.type === 'shortlist') && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-nude-700">Shortlisted</div>
                  <ul className="text-xs text-nude-800 space-y-1 mt-1">
                    {message.actions
                      .filter((action) => action.type === 'shortlist')
                      .map((action, idx) => (
                        <li key={`shortlist-${idx}`}>
                          {getUniversityName(action.data?.university_id)}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {message.lockedUniversities && message.lockedUniversities.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-nude-700">Locked universities</div>
                  <ul className="text-xs text-nude-800 space-y-1 mt-1">
                    {message.lockedUniversities.map((uni) => (
                      <li key={`locked-${uni.id}`}>
                        {uni.name}
                        {uni.category ? ` (${uni.category})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {message.shortlistedUniversities && message.shortlistedUniversities.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-nude-700">Shortlisted (not locked)</div>
                  <ul className="text-xs text-nude-800 space-y-1 mt-1">
                    {message.shortlistedUniversities.map((uni) => (
                      <li key={`short-${uni.id}`}>
                        {uni.name}
                        {uni.category ? ` (${uni.category})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {message.tasks && message.tasks.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-nude-700">Tasks</div>
                  <ul className="text-xs text-nude-800 space-y-1 mt-1">
                    {message.tasks.map((task) => (
                      <li key={`task-${task.id}`}>
                        {task.title} — {task.status.replace('_', ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.actions.map((action, idx) => (
                    action.status ? (
                      <div
                        key={idx}
                        className="w-full px-3 py-2 text-xs bg-nude-50 text-nude-700 rounded-lg border border-nude-200"
                      >
                        {action.label}
                      </div>
                    ) : (
                      <button
                        key={idx}
                        onClick={() => onActionExecute?.(action)}
                        className="w-full px-3 py-2 text-sm bg-white text-sand-700 rounded-lg hover:bg-sand-50 transition-colors border border-sand-300"
                      >
                        {action.label}
                      </button>
                    )
                  ))}
                </div>
              )}

              {(message.recommendations || (message.actions && message.actions.some((action) => action.type === 'shortlist')) || message.tasks || message.lockedUniversities || message.shortlistedUniversities) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/universities?tab=recommendations"
                    className="px-3 py-1.5 text-xs bg-white text-sand-700 rounded-lg hover:bg-sand-50 transition-colors border border-sand-300"
                  >
                    Open recommended universities
                  </Link>
                  <Link
                    to="/universities?tab=shortlisted"
                    className="px-3 py-1.5 text-xs bg-white text-sand-700 rounded-lg hover:bg-sand-50 transition-colors border border-sand-300"
                  >
                    Open shortlisted universities
                  </Link>
                  <Link
                    to="/applications"
                    className="px-3 py-1.5 text-xs bg-white text-sand-700 rounded-lg hover:bg-sand-50 transition-colors border border-sand-300"
                  >
                    Open application tasks
                  </Link>
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
            <button
              onClick={() => sendMessage('Recommend universities')}
              className="px-3 py-1.5 text-xs bg-nude-100 text-nude-700 rounded-full hover:bg-nude-200 transition-colors"
            >
            Recommend universities
          </button>
            <button
              onClick={() => sendMessage('Profile analysis')}
              className="px-3 py-1.5 text-xs bg-nude-100 text-nude-700 rounded-full hover:bg-nude-200 transition-colors"
            >
            Profile analysis
          </button>
            <button
              onClick={() => sendMessage('Application help')}
              className="px-3 py-1.5 text-xs bg-nude-100 text-nude-700 rounded-full hover:bg-nude-200 transition-colors"
            >
            Application help
          </button>
        </div>
      </div>
    </div>
  );
};
