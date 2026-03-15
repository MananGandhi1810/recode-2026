"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Hash, Bell, Search, AtSign, Settings, Smile, PlusCircle, Send, Paperclip, MoreHorizontal, MessageSquare, Trash2, Reply, X, FileIcon, Image as ImageIcon, Plus, Lock, Copy, Pencil } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  onCancelReply,
  currentUserMemberId,
  onTyping,
  typingUsers,
  members,
  pendingAttachment,
  setPendingAttachment
}) {
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [mentionSearch, setMentionSearch] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_notifications');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowEmojiPicker(null);
      setShowMoreMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_notifications', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-[#bd93f9]/10");
      setTimeout(() => el.classList.remove("bg-[#bd93f9]/10"), 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (mentionSearch !== null) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredMembers[mentionIndex]) applyMention(filteredMembers[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionSearch(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        onTyping?.(false);
      }
    }
  };

  const handleDeleteClick = (e, msgId) => {
    if (e.shiftKey) {
      onDeleteMessage(msgId);
    } else {
      if (window.confirm("Are you sure you want to delete this message?")) {
        onDeleteMessage(msgId);
      }
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    setInputMessage(val);
    
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf("@");
    if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === " ")) {
      const search = textBeforeCursor.slice(lastAt + 1);
      if (!search.includes(" ")) {
        setMentionSearch(search);
        setMentionIndex(0);
      } else {
        setMentionSearch(null);
      }
    } else {
      setMentionSearch(null);
    }

    if (onTyping) {
       onTyping(true);
       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
       typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
    }
  };

  const applyMention = (member) => {
    const cursor = inputRef.current.selectionStart;
    const textBeforeAt = inputMessage.slice(0, cursor).lastIndexOf("@");
    const replacement = member === "everyone" ? "@everyone " : `@${member.user.name.replace(/\s+/g, '')} `;
    const newVal = inputMessage.slice(0, textBeforeAt) + replacement + inputMessage.slice(cursor);
    setInputMessage(newVal);
    setMentionSearch(null);
    inputRef.current?.focus();
  };

  const filteredMembers = useMemo(() => {
    if (mentionSearch === null) return [];
    const base = members || [];
    const filtered = base.filter(m => m.user.name.toLowerCase().includes(mentionSearch.toLowerCase())).slice(0, 8);
    if ("everyone".includes(mentionSearch.toLowerCase())) return ["everyone", ...filtered];
    return filtered;
  }, [mentionSearch, members]);

  const emojiCategories = [
    { label: "Frequently Used", emojis: ["👍", "❤️", "😂", "😮", "😢", "🔥", "✅", "🚀"] },
    { label: "Smileys", emojis: ["😀", "🤣", "😊", "😇", "😍", "🤔", "🤫", "😴"] },
    { label: "Objects", emojis: ["💻", "📱", "💡", "🔑", "🛡️", "📦", "🎨", "🎮"] }
  ];

  const MentionedText = ({ content, members }) => {
    if (!content) return null;
    const parts = content.split(/(@\w+|@everyone)/g);
    return parts.map((part, i) => {
      if (part === "@everyone") return <span key={i} className="mention">@everyone</span>;
      if (part.startsWith("@")) {
        const name = part.slice(1);
        const exists = members?.some(m => m.user.name.toLowerCase().replace(/\s+/g, '') === name.toLowerCase());
        if (exists) return <span key={i} className="user-mention">{part}</span>;
      }
      return part;
    });
  };

  const typingList = Object.keys(typingUsers || {}).map(uid => members?.find(m => m.userId === uid)?.user?.name).filter(Boolean);

  if (!activeChannel) {
    return (
      <main className="flex-1 bg-[#282a36] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#44475a] flex items-center justify-center mb-6 shadow-2xl text-[#bd93f9]">
          <MessageSquare className="w-10 h-10 opacity-50" />
        </div>
        <h2 className="text-2xl font-bold text-[#f8f8f2] mb-2">Nexus Terminal</h2>
        <p className="text-[#6272a4] max-sm text-sm font-medium">Select a node from the sidebar to establish connection.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#282a36] flex flex-col min-w-0 h-full relative">
      <header className="h-14 px-6 flex items-center justify-between border-b border-[#44475a]/50 bg-[#282a36]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          {activeChannel.isPrivate ? <Lock className="w-5 h-5 text-[#ff79c6]" /> : <Hash className="w-5 h-5 text-[#6272a4]" />}
          <span className="font-semibold text-base text-[#f8f8f2] tracking-tight">{activeChannel.name}</span>
          {activeChannel.description && (
            <span className="hidden md:block text-xs text-[#6272a4] truncate max-w-md ml-3 border-l border-[#44475a] pl-3 font-medium">{activeChannel.description}</span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <Bell 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={cn(
              "w-5 h-5 cursor-pointer transition-colors",
              notificationsEnabled ? "text-[#50fa7b]" : "text-[#6272a4] opacity-50"
            )} 
          />
          {(hasPermission && (hasPermission("MANAGE_CHANNELS") || hasPermission("MANAGE_SERVER"))) && (
            <Settings onClick={onOpenSettings} className="w-5 h-5 text-[#6272a4] hover:text-[#f8f8f2] cursor-pointer transition-colors" />
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pt-8">
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="mb-12 pb-8 border-b border-[#44475a]/30">
             <div className="w-16 h-16 rounded-2xl bg-[#44475a]/50 border border-[#6272a4]/20 flex items-center justify-center mb-6 shadow-xl">
               {activeChannel.isPrivate ? <Lock className="w-8 h-8 text-[#ff79c6]" /> : <Hash className="w-8 h-8 text-[#bd93f9] opacity-80" />}
             </div>
             <h1 className="text-3xl font-bold text-[#f8f8f2] mb-2 tracking-tight">Welcome to #{activeChannel.name}</h1>
             <p className="text-[#6272a4] text-base font-medium">This is the start of the {activeChannel.isPrivate ? "private " : ""}channel.</p>
          </div>

          <div className="space-y-1">
            {messages.map((msg, index) => {
              const prev = messages[index - 1];
              const isSeq = prev && prev.authorId === msg.authorId && !msg.parentMessageId && !msg.parentMessage && (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 300000);
              const reactionsByEmoji = (msg.reactions || []).reduce((acc, r) => {
                if (!acc[r.emoji]) acc[r.emoji] = [];
                acc[r.emoji].push(r);
                return acc;
              }, {});

              return (
                <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex group hover:bg-[#44475a]/30 px-4 py-1.5 -mx-4 transition-all relative rounded-xl", isSeq ? "mt-0.5" : "mt-6")}>
                  {!isSeq ? (
                    <img src={msg.author?.user?.image || `https://ui-avatars.com/api/?name=${msg.author?.user?.name || 'User'}&background=44475a&color=f8f8f2`} className="w-11 h-11 rounded-xl object-cover border border-[#44475a] shadow-lg mr-4 mt-1 shrink-0" alt="" />
                  ) : (
                    <div className="w-11 mr-4 flex justify-end pt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#6272a4] select-none shrink-0 font-medium">
                       {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {!isSeq && (
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="font-semibold text-[15px] text-[#bd93f9] hover:underline cursor-pointer tracking-tight">{msg.author?.user?.name || "Member"}</span>
                        <span className="text-[10px] font-medium text-[#6272a4] uppercase tracking-widest">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      </div>
                    )}

                    {msg.parentMessage && !isSeq && (
                      <div onClick={() => scrollToMessage(msg.parentMessageId)} className="flex items-center gap-2 mb-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer border-l-2 border-[#6272a4] pl-3 group/reply">
                         <Reply className="w-3 h-3 text-[#6272a4]" />
                         <span className="text-xs font-semibold text-[#6272a4]">Replying to</span>
                         <span className="text-xs font-semibold text-[#bd93f9] group-hover/reply:underline">@{msg.parentMessage.author?.user?.name}</span>
                         <span className="text-xs text-[#6272a4] truncate italic">"{msg.parentMessage.content}"</span>
                      </div>
                    )}

                    <div className="text-[15px] text-[#f8f8f2] leading-relaxed prose prose-zinc prose-invert max-w-none break-words font-normal">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {msg.attachments.map((file) => (
                          <div key={file.id} className="group/file relative rounded-xl overflow-hidden border border-[#44475a] bg-[#44475a]/20 hover:border-[#6272a4] transition-all shadow-lg">
                            {file.fileType?.startsWith("image/") ? (
                              <a href={file.url} target="_blank" rel="noopener noreferrer"><img src={file.url} alt={file.fileName} className="max-w-md max-h-[400px] object-contain" /></a>
                            ) : (
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-5 py-4 min-w-[240px]">
                                <div className="w-12 h-12 rounded-xl bg-[#44475a] flex items-center justify-center text-[#f8f8f2] shadow-inner"><Paperclip className="w-6 h-6" /></div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-semibold text-[#f8f8f2] truncate">{file.fileName}</span>
                                  <span className="text-[10px] text-[#6272a4] font-semibold uppercase tracking-widest mt-0.5">{(file.fileSize / 1024).toFixed(1)} KB</span>
                                </div>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {Object.keys(reactionsByEmoji).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {Object.entries(reactionsByEmoji).map(([emoji, reacts]) => {
                          const hasReacted = reacts.some(r => r.memberId === currentUserMemberId || r.member?.userId === user.id);
                          return (
                            <button key={emoji} onClick={() => hasReacted ? onRemoveReaction(msg.id, emoji) : onAddReaction(msg.id, emoji)} className={cn("flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[13px] transition-all font-semibold", hasReacted ? "bg-[#bd93f9]/10 border-[#bd93f9]/40 text-[#bd93f9] shadow-sm" : "bg-[#282a36] border-[#44475a] text-[#6272a4] hover:border-[#6272a4]")}>
                              <span>{emoji}</span><span>{reacts.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="absolute -top-4 right-4 bg-[#44475a] border border-[#6272a4]/50 shadow-2xl rounded-xl flex items-center p-1 opacity-0 group-hover:opacity-100 transition-all z-10 translate-y-1 group-hover:translate-y-0">
                       <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id); setShowMoreMenu(null); }} className="p-2 hover:bg-[#6272a4] rounded-lg text-[#f8f8f2] transition-all"><Smile className="w-4.5 h-4.5"/></button>
                        {showEmojiPicker === msg.id && (
                          <div onClick={e => e.stopPropagation()} className="absolute bottom-full right-0 mb-3 bg-[#282a36] border border-[#44475a] rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 animate-in zoom-in-95 duration-100 backdrop-blur-xl w-64">
                            {emojiCategories.map(cat => (
                              <div key={cat.label} className="mb-3 last:mb-0">
                                <div className="text-[10px] font-semibold uppercase text-[#6272a4] mb-2 px-1 text-left">{cat.label}</div>
                                <div className="grid grid-cols-4 gap-1">
                                  {cat.emojis.map(emoji => (
                                    <button key={emoji} onClick={() => { onAddReaction(msg.id, emoji); setShowEmojiPicker(null); }} className="w-9 h-9 flex items-center justify-center hover:bg-[#44475a] rounded-xl text-xl transition-all active:scale-90">{emoji}</button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                       </div>
                       <button onClick={() => onReply(msg)} className="p-2 hover:bg-[#6272a4] rounded-lg text-[#f8f8f2] transition-all"><Reply className="w-4.5 h-4.5"/></button>
                       
                       <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowMoreMenu(showMoreMenu === msg.id ? null : msg.id); setShowEmojiPicker(null); }} className="p-2 hover:bg-[#6272a4] rounded-lg text-[#f8f8f2] transition-all"><MoreHorizontal className="w-4.5 h-4.5"/></button>
                        {showMoreMenu === msg.id && (
                          <div onClick={e => e.stopPropagation()} className="absolute bottom-full right-0 mb-3 bg-[#282a36] border border-[#44475a] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 animate-in zoom-in-95 duration-100 w-48 py-1.5">
                             <button onClick={() => { navigator.clipboard.writeText(msg.content); setShowMoreMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#f8f8f2] hover:bg-[#bd93f9] hover:text-[#282a36] transition-all"><Copy className="w-4 h-4" /> Copy Text</button>
                             {(hasPermission && (hasPermission("MANAGE_MESSAGES") || msg.author?.userId === user.id)) && (
                               <button onClick={(e) => { handleDeleteClick(e, msg.id); setShowMoreMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#ff5555] hover:bg-[#ff5555] hover:text-[#f8f8f2] transition-all"><Trash2 className="w-4 h-4" /> Delete Message</button>
                             )}
                          </div>
                        )}
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2 bg-[#282a36] border-t border-[#44475a]/50">
        <div className="max-w-5xl mx-auto relative">
          {mentionSearch !== null && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-4 w-64 bg-[#282a36] border border-[#44475a] rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200">
               <div className="p-3 border-b border-[#44475a] text-[10px] font-black uppercase tracking-widest text-[#6272a4]">Members matching "{mentionSearch}"</div>
               <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {filteredMembers.map((m, i) => (
                    <button key={m === "everyone" ? "everyone" : m.id} onClick={() => applyMention(m)} onMouseEnter={() => setMentionIndex(i)} className={cn("w-full flex items-center gap-3 px-4 py-3 transition-all text-left", i === mentionIndex ? "bg-[#bd93f9]/20 text-[#bd93f9]" : "hover:bg-[#44475a] text-[#f8f8f2]")}>
                      {m === "everyone" ? (
                        <div className="w-8 h-8 rounded-full bg-[#bd93f9] flex items-center justify-center text-[#282a36] font-bold text-[10px]">ALL</div>
                      ) : (
                        <img src={m.user.image || `https://ui-avatars.com/api/?name=${m.user.name}`} className="w-8 h-8 rounded-full object-cover" alt=""/>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{m === "everyone" ? "everyone" : m.user.name}</div>
                        {m !== "everyone" && <div className="text-[10px] text-[#6272a4] truncate">{m.user.email}</div>}
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          )}

          <div className="h-4 mb-2 flex items-center px-1">
            {typingList.length > 0 && (
               <div className="text-[10px] font-semibold text-[#6272a4] flex items-center gap-2">
                 <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                 </div>
                 <span>{typingList.join(", ")} {typingList.length === 1 ? "is" : "are"} typing...</span>
               </div>
            )}
          </div>

          {replyingTo && (
            <div className="mb-0 px-4 py-2 bg-[#44475a] border border-[#6272a4]/30 rounded-t-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
               <div className="flex items-center gap-3">
                  <Reply className="w-4 h-4 text-[#bd93f9]" />
                  <span className="text-xs font-semibold text-[#f8f8f2] uppercase tracking-widest">Replying to <span className="text-[#bd93f9]">@{replyingTo.author?.user?.name}</span></span>
               </div>
               <button onClick={onCancelReply} className="p-1 hover:bg-[#6272a4] rounded-md transition-all text-[#6272a4] hover:text-[#f8f8f2]"><X className="w-4 h-4" /></button>
            </div>
          )}

          {pendingAttachment && (
            <div className={cn("px-4 py-3 bg-[#44475a] border-x border-t border-[#6272a4]/30 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200", !replyingTo && "rounded-t-xl")}>
               <div className="flex items-center gap-4">
                  {pendingAttachment.type?.startsWith("image/") ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#6272a4]/50"><img src={pendingAttachment.url} className="w-full h-full object-cover" alt="Preview"/></div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#282a36] flex items-center justify-center text-[#6272a4] border border-[#6272a4]/50"><FileIcon className="w-6 h-6" /></div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#f8f8f2] truncate max-w-[200px]">{pendingAttachment.name}</span>
                    <span className="text-[10px] font-semibold text-[#50fa7b] uppercase tracking-widest">Ready to upload</span>
                  </div>
               </div>
               <button onClick={() => setPendingAttachment(null)} className="p-1.5 hover:bg-[#6272a4] rounded-xl text-[#6272a4] hover:text-[#ff5555] transition-all"><X className="w-5 h-5" /></button>
            </div>
          )}

          <div className={cn("bg-[#44475a]/50 border border-[#6272a4]/30 rounded-2xl overflow-hidden focus-within:border-[#bd93f9]/50 transition-all shadow-2xl", (replyingTo || pendingAttachment) && "rounded-t-none border-t-0")}>
             <div className="flex items-start px-2 py-2">
                <div className="mt-1.5 ml-1 relative">
                   <div className="w-10 h-10 rounded-xl bg-[#44475a] flex items-center justify-center text-[#6272a4] hover:text-[#f8f8f2] transition-all cursor-pointer shadow-inner">
                      <Plus className="w-5 h-5" />
                      <UploadButton 
                        endpoint="chatAttachment" 
                        className="absolute inset-0 opacity-0 ut-button:w-full ut-button:h-full ut-allowed-content:hidden ut-label:hidden" 
                        onClientUploadComplete={(res) => { if (res?.[0]) setPendingAttachment(res[0]); }}
                      />
                   </div>
                </div>
                <textarea ref={inputRef} value={inputMessage} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={`Message #${activeChannel.name}`} className="flex-1 bg-transparent border-none outline-none py-3.5 px-4 resize-none text-[15px] text-[#f8f8f2] min-h-[48px] max-h-[400px] placeholder:text-[#6272a4] font-normal leading-relaxed z-10" rows={1} />
                <div className="flex items-center gap-1 mt-1.5 mr-1">
                  <div 
                    role="button" 
                    onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(showEmojiPicker === 'input' ? null : 'input'); setShowMoreMenu(null); }} 
                    className="p-2.5 text-[#6272a4] hover:text-[#f8f8f2] transition-all rounded-xl hover:bg-[#44475a] relative cursor-pointer"
                  >
                    <Smile className="w-5 h-5" />
                    {showEmojiPicker === 'input' && (
                      <div onClick={e => e.stopPropagation()} className="absolute bottom-full right-0 mb-3 bg-[#282a36] border border-[#44475a] rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] animate-in zoom-in-95 duration-100 backdrop-blur-xl w-64">
                        {emojiCategories.map(cat => (
                          <div key={cat.label} className="mb-3 last:mb-0">
                            <div className="text-[10px] font-semibold uppercase text-[#6272a4] mb-2 px-1 text-left">{cat.label}</div>
                            <div className="grid grid-cols-4 gap-1">
                              {cat.emojis.map(emoji => (
                                <button key={emoji} onClick={(e) => { e.stopPropagation(); setInputMessage(prev => prev + emoji); setShowEmojiPicker(null); }} className="w-9 h-9 flex items-center justify-center hover:bg-[#44475a] rounded-xl text-xl transition-all active:scale-90">{emoji}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={e => {
                      e.preventDefault();
                      if (onSendMessage) onSendMessage(e, pendingAttachment);
                    }}
                    type="submit"
                    disabled={!isConnected || (!inputMessage.trim() && !pendingAttachment)}
                    className={cn("p-2.5 rounded-xl transition-all active:scale-95", (inputMessage.trim() || pendingAttachment) ? "bg-[#bd93f9] text-[#282a36] shadow-lg shadow-[#bd93f9]/20" : "text-[#6272a4]")}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
             </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#6272a4]">
             <div className="flex items-center gap-4"><span>Enter to send</span><span className="opacity-40">Shift + Enter for new line</span></div>
             {isConnected ? <span className="text-[#50fa7b] flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-current animate-pulse" /> Online</span> : <span className="text-[#ff5555]">Offline</span>}
          </div>
        </div>
      </div>
    </main>
  );
}
