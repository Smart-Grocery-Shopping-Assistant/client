import { useEffect, useRef, useState } from "react";
import GroceryList from "./components/GroceryList";
import ChatBox from "./components/ChatBox";
import axiosInstance from "./utils/AxiosInstance";

interface ChatMessage {
  role: "user" | "ai"; // Role can only be 'user' or 'ai'
  content: string;
  reminders?: string[];
}

interface GroceryItemEntry {
  item: string;
  expires: string;
}

interface GroceryRecord {
  id: number;
  items: GroceryItemEntry[];
  prompt?: string;
  timestamp?: string;
  name: string;
  qty: number;
  expiry: string;
}

function App() {
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groceryList, setGroceryList] = useState<GroceryRecord[]>([]);
  const [triggerFetch, setTriggerFetch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = "chat_history";
  const AI_NAME = "Grocy-AI";

  const readHistory = (): ChatMessage[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to read chat history from localStorage:", e);
      return [];
    }
  };

  const writeHistory = (history: ChatMessage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to write chat history to localStorage:", e);
    }
  };

  useEffect(() => {
    const history = readHistory();
    if (history.length) setConversation(history);
  }, []);

  useEffect(() => {
    if (!conversation.length) return;
    writeHistory(conversation);
  }, [conversation]);

  // Add a user message to the conversation
  const handleUserMessage = (message: string) => {
    setConversation((prev) => [...prev, { role: "user", content: message }]);
  };

  // Add an AI message to the conversation
  const handleAiMessage = (message: string, reminders?: string[]) => {
    setConversation((prev) => [
      ...prev,
      {
        role: "ai",
        content: message,
        reminders: reminders || [],
      },
    ]);
  };

  // Handle Check Expiries button click
  const handleCheckExpiries = async () => {
    handleUserMessage(
      "Show me a list of all expiring items in the next 7 days."
    );
    try {
      const response = await axiosInstance.get("/expiry");
      const expiryData = response.data;
      let expiryMessage = "";

      if (Array.isArray(expiryData) && expiryData.length > 0) {
        expiryMessage =
          "Expiring items:\n\n" +
          expiryData.map((item) => `• ${item}`).join("\n");
      } else if (typeof expiryData === "object" && expiryData !== null) {
        expiryMessage =
          "Expiring items:\n\n" + JSON.stringify(expiryData, null, 2);
      } else {
        expiryMessage = "Great news! No items are expiring soon.";
      }

      handleAiMessage(expiryMessage);
    } catch (error) {
      console.error("Failed to fetch expiry items", error);
      handleAiMessage("Error fetching expiry items. Please try again.");
    }
  };

  useEffect(() => {
    const fetchGroceryList = async () => {
      try {
        const items = await axiosInstance.get("/items");
        setGroceryList(items.data);
      } catch (error) {
        console.error("Failed to fetch grocery list", error);
      }
    };
    fetchGroceryList();
  }, [triggerFetch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [isLoading]);

  return (
    <div className="flex w-full h-screen bg-gray-50 text-gray-800">
      {/* Left Sidebar: Grocery List & Quick Actions */}
      <div className="w-1/4 min-w-[300px] h-full shadow-xl bg-white flex flex-col z-10">
        {/* Sidebar Header */}
        <div className="flex w-full h-20 border-b border-gray-100 items-center justify-between shrink-0 px-6">
          <span className="text-xl font-extrabold text-green-600 tracking-tight">
            Your Pantry
          </span>
          <span className="text-xs font-semibold text-gray-400 border border-green-200 bg-green-50 rounded-full px-3 py-1">
            {groceryList.length} Items
          </span>
        </div>

        {/* List Content */}
        <div className="flex flex-col w-full items-center p-4 overflow-y-auto grow custom-scrollbar">
          <GroceryList groceryList={groceryList} />
          {groceryList.length === 0 && (
            <p className="text-gray-400 text-center mt-8">
              Your list is currently empty. Start adding items with {AI_NAME}!
            </p>
          )}
        </div>

        {/* Quick Buttons */}
        <div className="flex flex-col w-full gap-2 py-4 px-6 border-t border-gray-100 shrink-0 bg-gray-50">
          <button
            onClick={handleCheckExpiries}
            className="py-2.5 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-150 hover:cursor-pointer"
          >
            ⏰ Check Expiries soon
          </button>
          <button
            className="py-2.5 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-150 hover:cursor-pointer"
            // onClick={() =>
            //   handleQuickPrompt(
            //     "Suggest some healthy alternatives for the items currently in my list."
            //   )
            // }
          >
            🌱 Healthy Alternatives
          </button>
        </div>
      </div>

      {/* Right Main Chat Area */}
      <div className="w-3/4 flex flex-col items-center bg-gray-50">
        {/* Header */}
        <div className="flex flex-col w-full h-20 border-b border-gray-100 mb-4 justify-center shrink-0 bg-white shadow-sm">
          <span className="text-xl font-bold pl-6 text-indigo-700">
            {AI_NAME}
          </span>
          <span className="text-sm font-normal pl-6 text-gray-500">
            AI-powered pantry management and smart recommendations
          </span>
        </div>

        {/* Chat Messages Display */}
        <div className="flex flex-col w-full px-6 gap-4 max-w-7xl overflow-y-auto grow mb-4 overflow-auto">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`w-full flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[65%] text-sm font-medium px-4 py-2.5 rounded-3xl shadow-sm whitespace-pre-wrap transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                }`}
              >
                {/* Add a subtle role indicator for AI messages */}
                {msg.role === "ai" && (
                  <span className="text-xs font-bold text-indigo-500 block mb-1">
                    {AI_NAME}
                  </span>
                )}
                {msg.content}
                {msg.role === "ai" &&
                  msg.reminders &&
                  msg.reminders.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs font-semibold text-gray-400">
                        Reminders:
                      </span>
                      <ul className="list-disc list-inside text-xs text-gray-500 mt-1">
                        {msg.reminders.map((reminder, rIndex) => (
                          <li key={rIndex}>{reminder}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          ))}

          {/* Typing indicator bubble while waiting for AI response */}
          {isLoading && (
            <div className="w-full flex justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-3xl bg-white text-gray-500 border border-gray-100 rounded-tl-none shadow-sm">
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}

          {/* Scroll Target */}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="shrink-0 p-4 w-full max-w-7xl">
          <ChatBox
            onUserMessage={handleUserMessage}
            onAiMessage={handleAiMessage}
            isLoading={isLoading}
            onLoadingChange={setIsLoading}
            setTriggerFetch={setTriggerFetch}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
