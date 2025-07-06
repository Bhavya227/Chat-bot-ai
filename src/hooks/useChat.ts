import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';

const FASTAPI_URL = 'http://localhost:8000'; // Update this with your FastAPI server URL

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id 
          ? { ...msg, content, isStreaming: false }
          : msg
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (userMessage: string, systemPrompt = "You are a helpful AI assistant.") => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    
    // Add user message
    addMessage({
      content: userMessage,
      role: 'user'
    });

    // Add streaming assistant message
    const assistantMessageId = addMessage({
      content: '',
      role: 'assistant',
      isStreaming: true
    });

    try {
      const response = await fetch(`${FASTAPI_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_query: userMessage,
          system_prompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        accumulatedContent += chunk;
        
        // Update the streaming message
        updateMessage(assistantMessageId, accumulatedContent);
      }

    } catch (error) {
      console.error('Chat error:', error);
      updateMessage(assistantMessageId, 'Sorry, I encountered an error. Please make sure your FastAPI backend is running on http://localhost:8000');
      toast({
        title: "Connection Error",
        description: "Failed to connect to the chat backend. Please ensure your FastAPI server is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateMessage]);

  return {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    clearMessages,
    sendMessage,
  };
};