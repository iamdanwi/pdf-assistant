import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';

import { Send, Paperclip, Loader2, Play, FileText, Sparkles, Link as LinkIcon, ChevronDown, Bot, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export const ChatInterface = () => {
  const { 
    messages, 
    isStreaming, 
    currentPdfUrl, 
    suggestedQuestions,
    audioUrl,
    isGeneratingAudio,
    models,
    selectedModel,
    setSelectedModel,
    uploadFile, 
    ingestUrl,
    sendMessage,
    generateAudio,
    resetChat
  } = useChat();
  
  const [input, setInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [audioUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await uploadFile(file);
    setIsUploading(false);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsUploading(true);
    await ingestUrl(urlInput);
    setIsUploading(false);
    setShowUrlInput(false);
    setUrlInput('');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-white border-r border-gray-200 md:flex">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 bg-blue-600 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">DocuMind</span>
          </div>
          <button 
            onClick={resetChat}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition-colors"
            title="New Chat"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-4">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Sources</h3>
             {currentPdfUrl ? (
                <div className="group flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                    <FileText size={16} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">Document.pdf</span>
                    <span className="text-[10px] text-blue-600/70 font-medium uppercase">Active Source</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 text-center bg-gray-50/50">
                  <p className="text-xs text-gray-400">No sources added</p>
                </div>
              )}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {showUrlInput ? (
              <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm animate-in slide-in-from-bottom-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(false)}
                    className="flex-1 rounded-lg bg-gray-100 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <Paperclip size={18} />
                  Upload PDF
                </button>
                <button
                  onClick={() => setShowUrlInput(true)}
                  disabled={isUploading}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <LinkIcon size={18} />
                  Add from URL
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col transition-all duration-300 w-full relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex h-16 items-center justify-end px-6">
          {/* Audio Player Control */}
          {currentPdfUrl && (
            <div className="flex items-center gap-2">
              {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" controls />}
              <button
                onClick={generateAudio}
                disabled={isGeneratingAudio}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 text-sm font-medium text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isGeneratingAudio ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                {audioUrl ? "Play Summary" : "Generate Audio"}
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-20">
          <div className="mx-auto flex flex-col gap-6 max-w-3xl">
            {messages.length === 0 && (
              <div className="mt-20 flex flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">How can I help you today?</h3>
                
                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                  <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(q)}
                          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={idx} 
                message={msg} 
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6 pb-8">
          <div className="mx-auto max-w-3xl">
            <form onSubmit={handleSubmit} className="relative flex items-center rounded-full border border-gray-200 bg-white shadow-lg shadow-gray-100 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 p-1.5 pl-4">
              
              {/* Model Selector in Input */}
              <div className="relative flex items-center border-r border-gray-200 pr-3 mr-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[140px] h-8 border-none bg-transparent focus:ring-0 focus:ring-offset-0 px-2 text-xs font-medium text-gray-600 hover:text-gray-900">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.length > 0 ? (
                      models.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">
                          {model}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled className="text-xs">
                        Loading models...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message DocuMind..."
                className="flex-1 bg-transparent py-3 text-sm placeholder:text-gray-400 focus:outline-none"
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {isStreaming ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              </button>
            </form>
            <p className="mt-3 text-center text-[10px] text-gray-400">
              DocuMind can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
