import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../App';
import api from '../hooks/api';
import { Send, MessageSquare, ArrowLeft, Phone, Video } from 'lucide-react';

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket, emit } = useSocket();
  const { startCall } = useCall();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const activeUserIdRef = useRef(userId); // ✅ track active chat without stale closure

  // Keep ref in sync
  useEffect(() => { activeUserIdRef.current = userId; }, [userId]);

  const fetchConversations = useCallback(() => {
    api.get('/messages/conversations').then(r => setConversations(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (userId) {
      loadMessages(userId);
      api.get(`/users/${userId}`).then(r => setActiveUser(r.data)).catch(() => {});
    }
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Real-time incoming messages via Socket.io
  useEffect(() => {
    const handleNewMessage = (msg) => {
      // Only append if this message is from/to the active conversation
      const isFromActiveChat = String(msg.sender_id) === String(activeUserIdRef.current);
      if (isFromActiveChat) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark as read since we're looking at the chat
        api.get(`/messages/${msg.sender_id}`).catch(() => {});
      }
      // Always refresh conversation list for unread counts
      fetchConversations();
    };

    const handleTypingStart = ({ senderId }) => {
      if (String(senderId) === String(activeUserIdRef.current)) setRemoteTyping(true);
    };
    const handleTypingStop = ({ senderId }) => {
      if (String(senderId) === String(activeUserIdRef.current)) setRemoteTyping(false);
    };

    if (!socket) return;
    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, fetchConversations]);
  const loadMessages = async (uid) => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/${uid}`);
      setMessages(res.data);
    } finally { setLoading(false); }
  };

  const selectConvo = (convo) => {
    setActiveUser(convo);
    navigate(`/messages/${convo.other_user_id}`);
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!userId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emit('typing:start', { targetUserId: userId });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      emit('typing:stop', { targetUserId: userId });
    }, 1500);
  };

  const sendMessage = async e => {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    const content = text.trim();
    setText('');
    clearTimeout(typingTimer.current);
    isTypingRef.current = false;
    emit('typing:stop', { targetUserId: userId });

    try {
      const res = await api.post('/messages', { receiver_id: userId, content });
      // ✅ Append own message immediately (don't wait for socket echo)
      setMessages(prev => {
        if (prev.find(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      fetchConversations();
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleCall = (type) => {
    if (!activeUser) return;
    startCall({ id: parseInt(userId), name: activeUser.name }, type);
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex card overflow-hidden">
      {/* Conversations list */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col flex-shrink-0 ${userId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-lg text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <MessageSquare size={32} className="mx-auto mb-2 text-gray-200" />
              No conversations yet
            </div>
          ) : conversations.map(c => (
            <button key={c.other_user_id} onClick={() => selectConvo(c)}
              className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 border-b border-gray-50 transition-colors text-left ${
                userId === String(c.other_user_id) ? 'bg-brand-50' : ''
              }`}>
              <div className="avatar-placeholder w-10 h-10 text-sm flex-shrink-0">{initials(c.name)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-900 truncate">{c.name}</p>
                  {parseInt(c.unread) > 0 && (
                    <span className="w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!userId ? 'hidden md:flex' : 'flex'}`}>
        {!userId ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-gray-400">Select a conversation</h3>
              <p className="text-gray-300 text-sm mt-1">or start one by messaging someone from Browse</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white">
              <button onClick={() => navigate('/messages')} className="md:hidden p-1 hover:bg-gray-100 rounded-xl">
                <ArrowLeft size={18} />
              </button>
              {activeUser && (
                <>
                  <div className="avatar-placeholder w-9 h-9 text-sm">{initials(activeUser.name)}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{activeUser.name}</p>
                    {remoteTyping ? (
                      <p className="text-xs text-brand-500 flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        typing…
                      </p>
                    ) : (
                      <p className="text-xs text-green-500">Online</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCall('audio')} title="Voice call"
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                      <Phone size={18} />
                    </button>
                    <button onClick={() => handleCall('video')} title="Video call"
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                      <Video size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-300 text-sm mb-3">No messages yet. Say hi! 👋</div>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => handleCall('audio')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                      <Phone size={15} /> Voice call
                    </button>
                    <button onClick={() => handleCall('video')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                      <Video size={15} /> Video call
                    </button>
                  </div>
                </div>
              ) : messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && (
                      <div className="avatar-placeholder w-7 h-7 text-xs flex-shrink-0">{initials(msg.sender_name)}</div>
                    )}
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-brand-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                    }`}>
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-brand-100' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <input className="input flex-1 !rounded-2xl" placeholder="Type a message..."
                value={text} onChange={handleTyping} />
              <button type="submit" disabled={!text.trim()}
                className="w-11 h-11 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 transition-colors">
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
