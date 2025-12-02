import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { Bot, User, Sparkles } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Source {
  source: string;
  page: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

interface MessageBubbleProps {
  message: Message;
  onCitationClick?: (page: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCitationClick }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex w-full gap-4 p-4", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* ... (Avatar) ... */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
        isUser ? "bg-gray-100 text-gray-600" : "bg-blue-600 text-white"
      )}>
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>
      
      {/* Content */}
      <div className={cn(
        "flex max-w-[85%] flex-col gap-1",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Name */}
        <span className="text-xs text-gray-400 ml-1">
          {isUser ? "You" : "DocuMind"}
        </span>

        <div className={cn(
          "rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed overflow-hidden",
          isUser 
            ? "bg-white text-gray-900 rounded-tr-sm" 
            : "bg-blue-600 text-white rounded-tl-sm"
        )}>
          <div className={cn("prose prose-sm max-w-none break-words", isUser ? "dark:prose-invert" : "prose-invert")}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <div className="rounded-md overflow-hidden my-2">
                      <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, borderRadius: '0.375rem' }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className={cn("bg-black/10 rounded px-1 py-0.5", className)} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Sources (Only for assistant) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.map((source, idx) => (
              <button 
                key={idx} 
                onClick={() => onCitationClick?.(source.page)}
                className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                p. {source.page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
