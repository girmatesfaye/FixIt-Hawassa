import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../services/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

const MessagesPage: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const currentRole = getStoredRole();
  const homePath = currentRole === "worker" ? "/worker-hub" : "/dashboard";

  // Fetch current user
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMe(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch me", err);
      }
    };
    fetchMe();
  }, []);

  // Fetch Threads (from active requests)
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/requests/mine`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRequests(
            (data.requests || []).filter((request: any) => request.assignedWorkerId),
          );
        }
      } catch (err) {
        console.error("Failed to fetch requests", err);
      }
    };
    fetchRequests();
  }, []);

  // Fetch specific thread messages
  const fetchMessages = async (requestId: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/messages/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    if (selectedContact !== null && requests[selectedContact]) {
      const requestId = requests[selectedContact].id;
      fetchMessages(requestId);
      // Setup simple polling for updates (in absence of websockets)
      const interval = setInterval(() => {
        fetchMessages(requestId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContact, requests]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || selectedContact === null) return;

    try {
      const token = getAuthToken();
      const requestId = requests[selectedContact].id;
      
      const res = await fetch(`${API_BASE_URL}/messages/${requestId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: newMessage })
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages(requestId);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const getContactName = (req: any) => {
    if (!me) return "Unknown";
    if (req.clientUserId && req.clientUserId._id === me.id) {
        return req.assignedWorkerId ? req.assignedWorkerId.name : "Unassigned Worker";
    }
    return req.clientUserId ? req.clientUserId.name : "Client";
  };

  return (
    <div className="h-screen bg-[#f8fafd] dark:bg-background-dark font-sans flex flex-col overflow-hidden">
      {/* Navbar */}
      <header className="shrink-0 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link to={homePath} className="flex items-center gap-2">
              <div className="size-9 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined font-bold">
                  handyman
                </span>
              </div>
              <h2 className="text-base font-bold tracking-tight dark:text-white">
                FixIt Hawassa
              </h2>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to={homePath}
              className="text-sm font-bold text-gray-500 hover:text-primary transition-colors"
            >
              {currentRole === "worker" ? "Worker Hub" : "Home"}
            </Link>
            {currentRole === "client" ? (
              <Link
                to="/my-requests"
                className="text-sm font-bold text-gray-500 hover:text-primary transition-colors"
              >
                My Requests
              </Link>
            ) : null}
            <Link to="/messages" className="text-sm font-bold text-primary">
              Messages
            </Link>
            <div className="size-10 rounded-full bg-gray-100 overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="User"
              />
            </div>
          </nav>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 flex overflow-hidden max-w-[1440px] mx-auto w-full border-x border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark">
        {/* Sidebar */}
        <aside className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full h-10 pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {requests.map((contact, idx) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(idx)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800/50 ${selectedContact === idx ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"}`}
              >
                <div className="relative shrink-0">
                  <div className="size-12 rounded-full overflow-hidden bg-gray-100">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getContactName(contact)}`} alt={getContactName(contact)} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-[#120e1b] dark:text-white truncate">
                      {getContactName(contact)}
                    </h4>
                    <span className="text-[10px] font-semibold text-gray-400">
                      Request
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-xs truncate text-gray-500`}
                    >
                      {contact.category}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-900/10">
          {selectedContact !== null ? (
            <>
              {/* Chat Header */}
              <header className="h-16 shrink-0 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full overflow-hidden bg-gray-100">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getContactName(requests[selectedContact])}`} alt="" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#120e1b] dark:text-white">
                      {getContactName(requests[selectedContact])}
                    </h3>
                  </div>
                </div>
              </header>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {messages.map((msg) => {
                  const isMe = msg.senderId === me?.id;
                  return (
                  <div
                    key={msg._id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${isMe ? "bg-primary text-white rounded-tr-none" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700"}`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div
                        className={`text-[10px] mt-1 font-semibold uppercase opacity-60 ${isMe ? "text-right" : "text-left"}`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800">
                <form
                  className="flex items-center gap-3"
                  onSubmit={sendMessage}
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full h-11 px-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="size-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
               Select a conversation to start messaging
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MessagesPage;
