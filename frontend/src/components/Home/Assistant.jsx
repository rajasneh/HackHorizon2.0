import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { MessageCircle, X, Send } from "lucide-react";

export const Assistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", message: "Hello this is meetz AI, how can i help you" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    
    // update local msgs with user msg
    const newHistory = [...messages, { role: "user", message: userMessage }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/ai/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          user_msg: userMessage,
          conversation: messages // Pass existing history up to this point
        })
      });
      
      const data = await res.json();
      if (res.ok && data.response) {
        setMessages([...newHistory, { role: "assistant", message: data.response }]);
      } else {
        setMessages([...newHistory, { role: "assistant", message: "Sorry, I ran into an error." }]);
      }
    } catch(err) {
      setMessages([...newHistory, { role: "assistant", message: "Network error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen ? (
          <div className="bg-white w-80 h-96 sm:w-96 sm:h-[28rem] shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-[#CD2128] px-4 py-3 flex justify-between items-center text-white">
              <span className="font-semibold">Meetz AI Assistant</span>
              <button onClick={() => setIsOpen(false)} className="hover:bg-[#A91D22] transition-colors p-1 rounded">
                <X size={20} />
              </button>
            </div>
            
            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`max-w-[85%] p-3 rounded-lg text-sm sm:text-base whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#CD2128] text-white self-end rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 self-start rounded-bl-none shadow-sm'}`}>
                  {msg.message}
                </div>
              ))}
              {isLoading && (
                <div className="bg-white shadow-sm border border-gray-200 text-gray-800 self-start p-3 rounded-lg rounded-bl-none text-sm animate-pulse">
                  Typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 bg-white border-t border-gray-200 flex gap-2 items-center">
              <input 
                type="text" 
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm sm:text-base focus:outline-none focus:border-[#CD2128]"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="bg-[#CD2128] text-white p-2 rounded-full hover:bg-[#A91D22] transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-[#CD2128] hover:bg-[#A91D22] text-white p-4 rounded-full shadow-xl transition-transform hover:scale-105 animate-bounce-slow flex items-center justify-center"
          >
            <MessageCircle size={32} />
          </button>
        )}
      </div>
    </>
  );
};
