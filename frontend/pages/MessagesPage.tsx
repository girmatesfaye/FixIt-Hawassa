import React, { useState } from "react";
import { Link } from "react-router-dom";

const MessagesPage: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState(0);
  const [newMessage, setNewMessage] = useState("");

  const contacts = [
    {
      id: 0,
      name: "Dawit M.",
      role: "Plumber",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dawit",
      lastMsg: "I can come tomorrow at 10 AM.",
      time: "10:45 AM",
      unread: 2,
      status: "online",
    },
    {
      id: 1,
      name: "Abebe K.",
      role: "Electrician",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abebe",
      lastMsg: "The parts will cost about 500 ETB.",
      time: "Yesterday",
      unread: 0,
      status: "offline",
    },
    {
      id: 2,
      name: "Meron H.",
      role: "Cleaner",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meron",
      lastMsg: "Thank you for the tip!",
      time: "Monday",
      unread: 0,
      status: "online",
    },
  ];

  const messages = [
    {
      id: 1,
      sender: "Dawit M.",
      text: "Hi Abebe, I saw your request for the kitchen sink leak.",
      time: "10:30 AM",
      me: false,
    },
    {
      id: 2,
      sender: "Me",
      text: "Yes, it needs urgent fixing. Water is pooling under the cabinet.",
      time: "10:32 AM",
      me: true,
    },
    {
      id: 3,
      sender: "Dawit M.",
      text: "I can come tomorrow at 10 AM. Will that work for you?",
      time: "10:45 AM",
      me: false,
    },
  ];

  return (
    <div className="h-screen bg-[#f8fafd] dark:bg-background-dark font-sans flex flex-col overflow-hidden">
      {/* Navbar */}
      <header className="shrink-0 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
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
              to="/dashboard"
              className="text-sm font-bold text-gray-500 hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              to="/my-requests"
              className="text-sm font-bold text-gray-500 hover:text-primary transition-colors"
            >
              My Requests
            </Link>
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
            {contacts.map((contact, idx) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(idx)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800/50 ${selectedContact === idx ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"}`}
              >
                <div className="relative shrink-0">
                  <div className="size-12 rounded-full overflow-hidden bg-gray-100">
                    <img src={contact.avatar} alt={contact.name} />
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-surface-dark ${contact.status === "online" ? "bg-green-500" : "bg-gray-300"}`}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-[#120e1b] dark:text-white truncate">
                      {contact.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {contact.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-xs truncate ${contact.unread > 0 ? "font-semibold text-gray-800 dark:text-gray-200" : "text-gray-500"}`}
                    >
                      {contact.lastMsg}
                    </p>
                    {contact.unread > 0 && (
                      <span className="size-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-900/10">
          {/* Chat Header */}
          <header className="h-16 shrink-0 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full overflow-hidden bg-gray-100">
                <img src={contacts[selectedContact].avatar} alt="" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#120e1b] dark:text-white">
                  {contacts[selectedContact].name}
                </h3>
                <p className="text-[10px] font-semibold text-green-500 uppercase tracking-widest">
                  {contacts[selectedContact].status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <button className="hover:text-primary transition-colors">
                <span className="material-symbols-outlined">call</span>
              </button>
              <button className="hover:text-primary transition-colors">
                <span className="material-symbols-outlined">videocam</span>
              </button>
              <button className="hover:text-primary transition-colors">
                <span className="material-symbols-outlined">info</span>
              </button>
            </div>
          </header>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="text-center">
              <span className="text-[10px] font-semibold text-gray-400 uppercase bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                Today
              </span>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.me ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.me ? "bg-primary text-white rounded-tr-none" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700"}`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1 font-semibold uppercase opacity-60 ${msg.me ? "text-right" : "text-left"}`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800">
            <form
              className="flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setNewMessage("");
              }}
            >
              <button
                type="button"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">image</span>
              </button>
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
        </section>
      </main>
    </div>
  );
};

export default MessagesPage;
