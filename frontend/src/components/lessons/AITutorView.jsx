import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { askAI } from '../../api/aiService';
import { getUsageStats } from '../../api/subscriptionService';

const AITutorView = ({ lessonId, lessonTitle, initialPrompt, aiConfig }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [config, setConfig] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch usage stats on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const stats = await getUsageStats();
        setUsageInfo(stats);
      } catch (err) {
        console.error('Failed to fetch usage stats:', err);
      }
    };
    fetchUsage();
  }, []);

  // Parse AI configuration
  useEffect(() => {
    if (aiConfig) {
      try {
        const parsedConfig = typeof aiConfig === 'string' ? JSON.parse(aiConfig) : aiConfig;
        setConfig(parsedConfig);
      } catch (err) {
        console.error('Failed to parse AI config:', err);
        setConfig(null);
      }
    }
  }, [aiConfig]);

  // Initialize with welcome message and lesson context
  useEffect(() => {
    let welcomeContent = `Hello! I'm your AI tutor for "${lessonTitle}". I'm here to help you understand the concepts and answer any questions you have. What would you like to know?`;
    
    // Use custom welcome message if available in config
    if (config && config.welcome_message) {
      welcomeContent = config.welcome_message;
    } else if (initialPrompt) {
      // Use initial prompt as context for a more personalized welcome
      welcomeContent = `Hello! I'm your AI tutor for "${lessonTitle}". ${initialPrompt}\n\nI'm here to help you understand the concepts and answer any questions you have. What would you like to know?`;
    }

    const welcomeMessage = {
      id: 'welcome',
      type: 'ai',
      content: welcomeContent,
      timestamp: new Date().toISOString()
    };

    // Add context message if we have detailed initial prompt
    if (initialPrompt && !config?.welcome_message) {
      const contextMessage = {
        id: 'context',
        type: 'ai',
        content: `📚 **Lesson Context:**\n${initialPrompt}`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage, contextMessage]);
    } else {
      setMessages([welcomeMessage]);
    }
  }, [lessonTitle, initialPrompt, config]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await askAI(lessonId, inputMessage, '', config);
      
      // Check for subscription/limit errors
      if (response.error) {
        if (response.subscription_required || response.limit_exceeded) {
          setSubscriptionError(response.error);
          setError(null);
          
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            type: 'error',
            content: response.error,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }
      }
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.ai_response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Refresh usage stats after successful message
      try {
        const { getUsageStats } = await import('../../api/subscriptionService');
        const stats = await getUsageStats();
        setUsageInfo(stats);
      } catch (err) {
        console.error('Failed to refresh usage stats:', err);
        // Fallback to usage_info from response if available
        if (response.usage_info) {
          setUsageInfo({
            chats_used: response.usage_info.chats_used,
            tokens_used: response.usage_info.tokens_used,
            chats_remaining: response.usage_info.remaining_chats,
            tokens_remaining: response.usage_info.remaining_tokens,
            chat_limit: response.usage_info.chats_used + (typeof response.usage_info.remaining_chats === 'number' ? response.usage_info.remaining_chats : 50),
            token_limit: response.usage_info.tokens_used + (typeof response.usage_info.remaining_tokens === 'number' ? response.usage_info.remaining_tokens : 100000)
          });
        }
      }
    } catch (err) {
      console.error('Failed to get AI response:', err);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      // Check if it's a subscription/limit error
      if (err.response?.status === 403 || err.response?.status === 429) {
        const errorData = err.response?.data || err.data;
        const errorText = errorData?.error || err.message;
        setSubscriptionError(errorText);
        setError(null);
        errorMessage = errorText;
      } else {
        setError(err.message || 'Failed to get response from AI tutor. Please try again.');
        setSubscriptionError(null);
        errorMessage = err.message || error;
      }
      
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">AI Tutor</h3>
          <p className="text-sm text-gray-600">Ask me anything about this lesson</p>
          {config && (
            <p className="text-xs text-blue-600 mt-1">
              🎯 Configured for: {config.subject || 'General'} • {config.difficulty_level || 'All levels'}
            </p>
          )}
          {/* Usage Info */}
          {usageInfo && (
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <span>
                💬 Chats: {usageInfo.chats_used || 0} / {usageInfo.chats_remaining === 'unlimited' ? '∞' : usageInfo.chat_limit || usageInfo.chats_remaining || 'N/A'}
              </span>
              <span>
                🎯 Tokens: {(usageInfo.tokens_used || 0).toLocaleString()} / {usageInfo.tokens_remaining === 'unlimited' ? '∞' : (usageInfo.token_limit?.toLocaleString() || usageInfo.tokens_remaining || 'N/A')}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {config && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Configured
            </span>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 pb-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !inputMessage.trim() || isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Send'
            )}
          </button>
        </form>
        
        {/* Help text */}
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* Subscription Error / Upgrade Notice */}
      {subscriptionError && (
        <div className="px-4 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-yellow-600">⚠️</span>
                  <p className="text-yellow-800 text-sm font-medium">
                    {subscriptionError}
                  </p>
                </div>
                <Link
                  to="/subscription"
                  className="inline-block mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  View Subscription Plans →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITutorView; 