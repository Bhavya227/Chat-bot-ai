import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface MessageProps {
  message: ChatMessage;
}

export const Message = ({ message }: MessageProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "flex gap-4 p-4 animate-fade-in",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-message",
        isUser 
          ? "bg-gradient-message text-chat-user-foreground" 
          : "bg-gradient-primary text-primary-foreground"
      )}>
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>
      
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 shadow-message transition-smooth",
        isUser 
          ? "bg-gradient-message text-chat-user-foreground rounded-br-sm" 
          : "bg-chat-bot text-chat-bot-foreground rounded-bl-sm border border-border"
      )}>
        <div className="text-sm leading-relaxed">
          {message.content || (message.isStreaming && (
            <span className="inline-flex items-center gap-1">
              <span>Thinking</span>
              <span className="animate-typing">...</span>
            </span>
          ))}
        </div>
        
        {message.isStreaming && message.content && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
            <span>Streaming...</span>
          </div>
        )}
      </div>
    </div>
  );
};