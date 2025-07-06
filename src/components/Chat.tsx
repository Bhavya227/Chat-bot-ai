import { useEffect, useRef } from 'react';
import { Message } from './Message';
import { MessageInput } from './MessageInput';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Trash2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Chat = () => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-background">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">AI Chat Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by Groq API</p>
            </div>
          </div>
          
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-6">
                <Bot className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Welcome to AI Chat
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Start a conversation with your AI assistant. Ask questions, get help, or just chat about anything on your mind.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4 bg-card/50 hover:bg-card"
                  onClick={() => sendMessage("What can you help me with?")}
                >
                  <div>
                    <div className="font-medium">What can you help with?</div>
                    <div className="text-sm text-muted-foreground">Learn about my capabilities</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto p-4 bg-card/50 hover:bg-card"
                  onClick={() => sendMessage("Explain quantum computing in simple terms")}
                >
                  <div>
                    <div className="font-medium">Explain quantum computing</div>
                    <div className="text-sm text-muted-foreground">In simple terms</div>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={(message) => sendMessage(message)}
        isLoading={isLoading}
      />
    </div>
  );
};