import { useState, useCallback, useEffect } from 'react';

interface Source {
    source: string;
    page: number;
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Model selection state
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const response = await fetch('/api/models');
            if (response.ok) {
                const data = await response.json();
                setModels(data.models || []);
                if (data.models && data.models.length > 0) {
                    // Default to llama3 if available, else first one
                    const defaultModel = data.models.find((m: string) => m.includes('llama3')) || data.models[0];
                    setSelectedModel(defaultModel);
                }
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        }
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('files', file);

        try {
            const response = await fetch('/api/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();

            // Create a local URL for the PDF viewer
            const url = URL.createObjectURL(file);
            setCurrentPdfUrl(url);

            if (data.suggested_questions) {
                setSuggestedQuestions(data.suggested_questions);
            }

            return true;
        } catch (error) {
            console.error('Upload error:', error);
            return false;
        }
    };

    const ingestUrl = async (url: string) => {
        try {
            const response = await fetch('/api/ingest-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) throw new Error('Ingest URL failed');

            const data = await response.json();

            // For URL, we might just use the URL directly if it's accessible, 
            // or we might need a proxy if CORS is an issue.
            // For simplicity, let's assume direct access or use the URL provided.
            setCurrentPdfUrl(url);

            if (data.suggested_questions) {
                setSuggestedQuestions(data.suggested_questions);
            }

            return true;
        } catch (error) {
            console.error('Ingest URL error:', error);
            return false;
        }
    };

    const generateAudio = async () => {
        setIsGeneratingAudio(true);
        try {
            const response = await fetch('/api/audio-summary', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.audio_url) {
                setAudioUrl(data.audio_url);
            }
        } catch (error) {
            console.error('Audio generation error:', error);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const sendMessage = async (content: string) => {
        // Optimistic update
        const userMessage: Message = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setIsStreaming(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    session_id: 'default_session',
                    model: selectedModel
                }),
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage: Message = { role: 'assistant', content: '' };

            setMessages(prev => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                let chunkContent = '';
                let chunkSources = null;

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const data = JSON.parse(line);

                        if (data.token) {
                            chunkContent += data.token;
                        } else if (data.sources) {
                            chunkSources = data.sources;
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }

                if (chunkContent || chunkSources) {
                    assistantMessage.content += chunkContent;
                    if (chunkSources) assistantMessage.sources = chunkSources;

                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { ...assistantMessage };
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsStreaming(false);
        }
    };

    const resetChat = () => {
        setMessages([]);
        setCurrentPdfUrl(null);
        setSuggestedQuestions([]);
        setAudioUrl(null);
        setIsGeneratingAudio(false);
        setCurrentPage(1);
    };

    return {
        messages,
        isStreaming,
        currentPdfUrl,
        suggestedQuestions,
        audioUrl,
        isGeneratingAudio,
        currentPage,
        models,
        selectedModel,
        setSelectedModel,
        setCurrentPage,
        uploadFile,
        ingestUrl,
        sendMessage,
        generateAudio,
        resetChat
    };
}
