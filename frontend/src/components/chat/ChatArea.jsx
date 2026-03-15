"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Hash, Bell, Search, AtSign, Settings, Smile, PlusCircle, Send, Paperclip, MoreHorizontal, MessageSquare, Trash2, Reply, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UploadButton } from "@/lib/uploadthing";

export default function ChatArea({ 
  activeChannel, 
  messages, 
  user, 
  onSendMessage, 
  inputMessage, 
  setInputMessage, 
  isConnected,
  onDeleteMessage,
  onAddReaction,
  onRemoveReaction,
  hasPermission,
  onOpenSettings,
  onReply,
  replyingTo,
  onCancelReply
}) {
  const scrollRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e);
    }
  };

  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✅", "🚀"];

  if (!activeChannel) {
    return (
      <main className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl text-indigo-500">
          <MessageSquare className="w-10 h-10 opacity-50" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">Nexus Terminal</h2>
        <p className="text-zinc-500 max-w-sm text-sm font-medium leading-relaxed">Select a channel from the sidebar to establish a secure communication uplink.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-zinc-950 flex flex-col min-w-0 h-full relative">
      {/* Channel Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-zinc-500" />
          <span className="font-bold text-base text-zinc-100 tracking-tight">{activeChannel.name}</span>
          {activeChannel.description && (
            <span className="hidden md:block text-xs text-zinc-500 truncate max-w-md ml-3 border-l border-zinc-800 pl-3 font-medium">{activeChannel.description}</span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <Bell className="w-5 h-5 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors" />
          <Settings onClick={onOpenSettings} className="w-5 h-5 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors" />
        </div>
      </header>

      {/* Messages Scroller */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pt-8">
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="mb-12 pb-8 border-b border-zinc-900/50">
             <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl">
               <Hash className="w-8 h-8 text-white opacity-80" />
             </div>
             <h1 className="text-3xl font-bold text-white mb-2 tracking-tight italic">Welcome to #{activeChannel.name}</h1>
             <p className="text-zinc-500 text-base font-medium">This is the secure start of the channel.</p>
          </div>

          <div className="space-y-1">
            {messages.map((msg, index) => {
              const prev = messages[index - 1];
              const isSeq = prev && prev.authorId === msg.authorId && (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 300000);
              const reactionsByEmoji = (msg.reactions || []).reduce((acc, r) => {
                if (!acc[r.emoji]) acc[r.emoji] = [];
                acc[r.emoji].push(r);
                return acc;
              }, {});

              return (
                <div key={msg.id} className={cn("flex group hover:bg-zinc-900/40 px-4 py-1.5 -mx-4 transition-all relative rounded-xl", isSeq ? "mt-0" : "mt-6")}>
                  {!isSeq ? (
                    <img src={msg.author?.user?.image || `https://ui-avatars.com/api/?name=${msg.author?.user?.name || 'User'}&background=27272a&color=e4e4e7`} className="w-11 h-11 rounded-xl object-cover border border-zinc-800 shadow-lg mr-4 mt-1 shrink-0" alt="" />
                  ) : (
                    <div className="w-11 mr-4 flex justify-end pt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-zinc-600 select-none shrink-0 font-bold">
                       {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {!isSeq && (
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="font-bold text-[15px] text-indigo-400 hover:underline cursor-pointer tracking-tight">{msg.author?.user?.name || "Member"}</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      </div>
                    )}

                    {/* Reply Context */}
                    {msg.parentMessage && !isSeq && (
                      <div className="flex items-center gap-2 mb-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer border-l-2 border-zinc-800 pl-3">
                         <Reply className="w-3 h-3 text-zinc-500" />
                         <span className="text-xs font-bold text-zinc-400">Replying to</span>
                         <span className="text-xs font-bold text-indigo-500">@{msg.parentMessage.author?.user?.name}</span>
                         <span className="text-xs text-zinc-500 truncate italic">"{msg.parentMessage.content}"</span>
                      </div>
                    )}

                    <div className="text-[15px] text-zinc-300 leading-relaxed prose prose-zinc prose-invert max-w-none break-words font-medium">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {msg.attachments.map((file) => (
                          <div key={file.id} className="group/file relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all shadow-lg">
                            {file.fileType?.startsWith("image/") ? (
                              <a href={file.url} target="_blank" rel="noopener noreferrer"><img src={file.url} alt={file.fileName} className="max-w-md max-h-[400px] object-contain" /></a>
                            ) : (
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-5 py-4 min-w-[240px]">
                                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-inner"><Paperclip className="w-6 h-6" /></div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold text-zinc-100 truncate">{file.fileName}</span>
                                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{(file.fileSize / 1024).toFixed(1)} KB</span>
                                </div>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reactions */}
                    {Object.keys(reactionsByEmoji).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {Object.entries(reactionsByEmoji).map(([emoji, reacts]) => {
                          const hasReacted = reacts.some(r => r.member?.userId === user.id || r.memberId === user.memberId);
                          return (
                            <button key={emoji} onClick={() => hasReacted ? onRemoveReaction(msg.id, emoji) : onAddReaction(msg.id, emoji)} className={cn("flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[13px] transition-all font-bold", hasReacted ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400 shadow-sm" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600")}>
                              <span>{emoji}</span><span>{reacts.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Floating Action Bar */}
                    <div className="absolute -top-4 right-4 bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl flex items-center p-1 opacity-0 group-hover:opacity-100 transition-all z-10 translate-y-1 group-hover:translate-y-0">
                       <div className="relative">
                        <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"><Smile className="w-4.5 h-4.5"/></button>
                        {showEmojiPicker === msg.id && (
                          <div className="absolute bottom-full right-0 mb-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex gap-1.5 z-20 animate-in zoom-in-95 duration-100 backdrop-blur-xl">
                            {commonEmojis.map(emoji => (
                              <button key={emoji} onClick={() => { onAddReaction(msg.id, emoji); setShowEmojiPicker(null); }} className="w-9 h-9 flex items-center justify-center hover:bg-zinc-800 rounded-xl text-xl transition-all active:scale-90">{emoji}</button>
                            ))}
                          </div>
                        )}
                       </div>
                       <button onClick={() => onReply(msg)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"><Reply className="w-4.5 h-4.5"/></button>
                       {(hasPermission("MANAGE_MESSAGES") || msg.author?.userId === user.id) && (
                         <button onClick={() => onDeleteMessage(msg.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-400 transition-all"><Trash2 className="w-4.5 h-4.5"/></button>
                       )}
                       <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"><MoreHorizontal className="w-4.5 h-4.5"/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="px-6 pb-8 pt-2 bg-zinc-950 border-t border-zinc-900/50">
        <div className="max-w-5xl mx-auto">
          
          {replyingTo && (
            <div className="mb-3 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-t-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
               <div className="flex items-center gap-3">
                  <Reply className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Replying to <span className="text-indigo-400">@{replyingTo.author?.user?.name}</span></span>
               </div>
               <button onClick={onCancelReply} className="p-1 hover:bg-zinc-800 rounded-md transition-all text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className={cn("bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-all shadow-2xl backdrop-blur-xl", replyingTo && "rounded-t-none border-t-0")}>
             <div className="flex items-start px-3 py-2">
                <div className="mt-2.5 ml-1">
                   <UploadButton
                    endpoint="chatAttachment"
                    className="ut-button:h-9 ut-button:w-9 ut-button:bg-zinc-800 ut-button:hover:bg-zinc-700 ut-button:rounded-xl ut-button:text-zinc-400 ut-button:hover:text-white ut-allowed-content:hidden transition-all shadow-inner"
                    content={{ button: <PlusCircle className="w-5.5 h-5.5"/> }}
                    onClientUploadComplete={(res) => { if (res?.[0]) onSendMessage(null, res[0]); }}
                  />
                </div>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Secure uplink to #${activeChannel.name}...`}
                  className="flex-1 bg-transparent border-none outline-none py-4 px-4 resize-none text-[15px] text-zinc-100 min-h-[56px] max-h-[400px] placeholder:text-zinc-600 font-bold tracking-tight"
                  rows={1}
                />
                <div className="flex items-center gap-2 mt-2.5 mr-2">
                  <button type="button" className="p-2 text-zinc-500 hover:text-white transition-all rounded-xl hover:bg-zinc-800"><Smile className="w-6 h-6" /></button>
                  <button onClick={onSendMessage} type="submit" disabled={!isConnected || (!inputMessage.trim() && true)} className={cn("p-2.5 rounded-xl transition-all shadow-xl active:scale-95", inputMessage.trim() ? "bg-indigo-600 text-white shadow-indigo-500/20" : "text-zinc-700")}>
                    <Send className="w-6 h-6" />
                  </button>
                </div>
             </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
             <div className="flex items-center gap-4">
                <span>Enter to send</span>
                <span className="opacity-40">Shift + Enter for new line</span>
             </div>
             {isConnected ? <span className="text-emerald-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Uplink Active</span> : <span className="text-rose-500">Uplink Offline</span>}
          </div>
        </div>
      </div>
    </main>
  );
}
