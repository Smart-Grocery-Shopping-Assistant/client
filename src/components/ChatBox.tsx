import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react'; // <-- Use type-only import for FC
import { BiSend } from "react-icons/bi";
import axiosInstance from '../utils/AxiosInstance';

// 1. Type the Props Interface
interface ChatInputProps {
    onUserMessage: (message: string) => void;
    onAiMessage: (message: string) => void;
    isLoading: boolean;
    onLoadingChange: (loading: boolean) => void;
    setTriggerFetch: (value: boolean) => void;
}

// 2. Specify the Functional Component (FC) and use the Props Interface
const ChatBox: FC<ChatInputProps> = ({
    onUserMessage,
    onAiMessage,
    isLoading,
    onLoadingChange,
    setTriggerFetch,
}) => {
    const [question, setQuestion] = useState('');
    
    // 3. Type the Ref as a reference to an HTMLTextAreaElement
    const textareaRef = useRef<HTMLTextAreaElement>(null); 

    // Auto-grow logic for the textarea
    useEffect(() => {
        // Use optional chaining and type guard to ensure ref.current exists and is a textarea
        if (textareaRef.current) { 
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [question]); 

    const handleSendClick = async () => {
        if (!question.trim() || isLoading) return;

        const message = question.trim();
        onLoadingChange(true);

        // 1. Notify parent about the user message
        onUserMessage(message);

        // 2. Clear input and reset height
        setQuestion('');
        if (textareaRef.current) {
            // Reset height to initial minimum height (56px) after sending
            textareaRef.current.style.height = '56px';
        }

        try {
            // Call the generate-text API
            const response = await axiosInstance.post('/items', {
                prompt: message
            });

            console.log('API Response:', response.data);
            
            // FIX 1: Extract the success message from the backend response
            let aiContent = response.data.message || 
                            `Successfully added ${response.data.count || 0} items.`;
            
            onAiMessage(aiContent);
        } catch (error: any) {
            
            // FIX 2: Handle specific error formats from the Flask server
            let errorMessage = 'Unknown error occurred.';
            
            if (error.response) {
                // Error structure from Flask server response (e.g., 400, 429)
                const status = error.response.status;
                const data = error.response.data;

                if (status === 429) {
                    // Specific message for Quota Exhaustion error
                    errorMessage = `API Quota Error (429): Your daily/minute limit has been reached. Please wait.`;
                } else if (data.error) {
                    // General error message from the Flask JSON body (e.g., parsing error, 400 Bad Request)
                    errorMessage = `Server Error (${status}): ${data.error}`;
                } else {
                    // Fallback for any other HTTP error response
                    errorMessage = `HTTP Error ${status}: ${error.response.statusText}`;
                }
            } else if (error.request) {
                // Request was made but no response was received (e.g., server down, network issue)
                errorMessage = 'Network Error: The server did not respond.';
            } else {
                // Something happened in setting up the request that triggered an Error
                errorMessage = error.message;
            }

            onAiMessage(`Error: ${errorMessage}`);
        } finally {
            onLoadingChange(false);
            setTriggerFetch(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter key press (if Shift is NOT held)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleSendClick();
        }
    };
    
    const isDisabled = !question.trim() || isLoading;

    return (
        <div className="flex items-end px-4 mb-8 gap-2"> 
            <textarea
                ref={textareaRef} 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows={1} 
                className="grow min-w-0 pl-6 pr-16 py-3 min-h-14 rounded-2xl border border-gray-300 outline-none shadow-xl transition-all duration-300 bg-white resize-none overflow-hidden"
                placeholder="Ask the Smart Grocery Assistant..."
            />
            
            <button 
                onClick={handleSendClick}
                disabled={isDisabled} 
                className={`cursor-pointer shrink-0 p-1 mb-1 transition-opacity ${!question.trim() ? 'opacity-50' : 'opacity-100'}`}
            >
                {isLoading ? (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">
                        <span className="animate-pulse">...</span>
                    </div>
                ) : (
                    <BiSend 
                        size={40} 
                        className="rounded-full bg-blue-500 flex p-2 text-white hover:bg-blue-600 transition-colors"
                    />
                )}
            </button>
        </div>
    );
};

export default ChatBox;