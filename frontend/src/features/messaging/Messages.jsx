import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageApi } from '../../api/message.api';
import { userApi } from '../../api/user.api';
import { PageShell } from '../../components/Layout';
import { toast } from 'react-toastify';
import { Send, Search, User } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Charger les utilisateurs et conversations
  useEffect(() => {
    loadUsers();
    loadConversations();
  }, []);

  // Écouter les nouveaux messages
  useEffect(() => {
    if (socket) {
      socket.on('new-message', (message) => {
        if (message.receiver_id === user.id || message.sender_id === user.id) {
          loadConversations();
          if (selectedUser && 
              (message.sender_id === selectedUser.id || message.receiver_id === selectedUser.id)) {
            setMessages(prev => [...prev, message]);
          }
        }
      });

      return () => {
        socket.off('new-message');
      };
    }
  }, [socket, selectedUser, user.id]);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============================================
  // CHARGER LES UTILISATEURS ACTIFS
  // ============================================
  const loadUsers = async () => {
    try {
      console.log('🔄 Chargement des utilisateurs...');
      const res = await userApi.getActive();
      console.log('📋 Utilisateurs reçus:', res.data);
      
      // Filtrer pour exclure l'utilisateur connecté
      const activeUsers = (res.data.users || []).filter(u => u.id !== user.id);
      setUsers(activeUsers);
      
      console.log(`👥 ${activeUsers.length} utilisateurs chargés`);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      
      // 🔥 FALLBACK : Utiliser l'API /users si /active échoue
      try {
        console.log('🔄 Tentative avec /users...');
        const fallbackRes = await userApi.getAll();
        const allUsers = (fallbackRes.data.users || []).filter(u => u.id !== user.id);
        setUsers(allUsers);
        console.log(`👥 ${allUsers.length} utilisateurs chargés (fallback)`);
      } catch (fallbackError) {
        console.error('❌ Erreur fallback:', fallbackError);
        toast.error('❌ Impossible de charger la liste des utilisateurs');
      }
    }
  };

  // ============================================
  // CHARGER LES CONVERSATIONS
  // ============================================
  const loadConversations = async () => {
    try {
      const res = await messageApi.getConversations();
      setConversations(res.data.conversations || []);
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error);
    }
  };

  // ============================================
  // CHARGER LES MESSAGES D'UNE CONVERSATION
  // ============================================
  const loadMessages = async (userId) => {
    try {
      setLoading(true);
      const res = await messageApi.getConversation(userId);
      setMessages(res.data.messages || []);
      
      // Trouver l'utilisateur dans la liste
      const selected = users.find(u => u.id === userId);
      if (selected) {
        setSelectedUser(selected);
      } else {
        // Si l'utilisateur n'est pas dans la liste, le récupérer
        const userRes = await userApi.getById(userId);
        setSelectedUser(userRes.data.user);
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
      toast.error('❌ Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ENVOYER UN MESSAGE
  // ============================================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !selectedUser) return;

    setIsSending(true);
    try {
      const messageData = {
        receiver_id: selectedUser.id,
        content: newMessage.trim()
      };

      const res = await messageApi.sendMessage(messageData);
      setMessages(prev => [...prev, res.data.message]);
      setNewMessage('');
      await loadConversations();

      if (socket) {
        socket.emit('private-message', {
          receiverId: selectedUser.id,
          message: res.data.message
        });
      }
    } catch (error) {
      console.error('❌ Erreur envoi:', error);
      
      // Si la conversation n'existe pas, la créer
      if (error.response?.status === 404 || error.response?.data?.message?.includes('conversation')) {
        try {
          await messageApi.createConversation(selectedUser.id);
          // Réessayer d'envoyer
          const retryRes = await messageApi.sendMessage({
            receiver_id: selectedUser.id,
            content: newMessage.trim()
          });
          setMessages(prev => [...prev, retryRes.data.message]);
          setNewMessage('');
          await loadConversations();
          toast.success('✅ Message envoyé avec succès');
        } catch (createError) {
          toast.error('❌ Impossible de créer la conversation');
        }
      } else {
        toast.error(`❌ ${error.response?.data?.message || 'Erreur lors de l\'envoi'}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(search) ||
       u.username?.toLowerCase().includes(search))
    );
  });

  return (
    <PageShell active="messages" title="الرسائل" subtitle="تواصل مع فريقك">
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-2xl border border-slate-200 overflow-hidden">
        
        {/* ============ SIDEBAR GAUCHE ============ */}
        <div className="w-80 border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">المحادثات</h3>
            <div className="relative mt-2">
              <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
              <input
                type="text"
                placeholder="بحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a5b3e]/30"
              />
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div className="flex-1 overflow-y-auto">
            {loading && users.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5b3e] mx-auto"></div>
                <p className="text-sm text-slate-400 mt-2">Chargement...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {searchTerm ? 'لا يوجد نتائج مطابقة' : 'لا يوجد مستخدمين نشطين'}
              </div>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => loadMessages(u.id)}
                  className={`w-full text-right p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center gap-3 ${
                    selectedUser?.id === u.id ? 'bg-[#1a5b3e]/5 border-r-2 border-[#1a5b3e]' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1a5b3e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(u.full_name || u.username)?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {u.full_name || u.username}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      @{u.username}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ============ ZONE DE CONVERSATION ============ */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col">
            {/* En-tête */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a5b3e] flex items-center justify-center text-white font-bold text-sm">
                {(selectedUser.full_name || selectedUser.username)?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{selectedUser.full_name || selectedUser.username}</p>
                <p className="text-xs text-slate-400">@{selectedUser.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5b3e]"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>💬 لا توجد رسائل بعد</p>
                  <p className="text-sm mt-1">أرسل رسالة لبدء المحادثة</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        msg.sender_id === user.id
                          ? 'bg-[#1a5b3e] text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender_id === user.id ? 'text-white/60' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone d'envoi */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a5b3e]/30"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-[#1a5b3e] hover:bg-[#0f3d28] text-white rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <User className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">اختر مستخدمًا لبدء المحادثة</p>
            <p className="text-sm">انقر على أي مستخدم في القائمة لفتح الدردشة</p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Messages;