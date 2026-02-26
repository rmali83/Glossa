import React, { useState, useEffect, useRef } from 'react';
import './DashboardPages.css';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            try {
                // Fetch profiles we have chatted with or could chat with
                // For this MVP, we show the main Project Manager (Admin) and any active projects
                const { data: adminProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('full_name', 'Admin') // Specific check for admin
                    .single();

                setConversations([
                    { id: 'admin', name: 'Glossa Project Manager', role: 'Admin', avatar: 'A' },
                    { id: 'support', name: 'Glossa Support', role: 'Support', avatar: 'S' }
                ]);
            } catch (err) {
                console.error('Error fetching conversations:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    useEffect(() => {
        if (!selectedChat) return;

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            setMessages(data || []);
            scrollToBottom();
        };

        fetchMessages();

        // Real-time subscription
        const channel = supabase
            .channel('chat_room')
            .on('postgres_changes', {
                event: 'INSERT',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`
            }, (payload) => {
                if (payload.new.sender_id === selectedChat.id) {
                    setMessages(prev => [...prev, payload.new]);
                    scrollToBottom();
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [selectedChat, user.id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;

        const newMessage = {
            sender_id: user.id,
            receiver_id: selectedChat.id === 'admin' ? '7493e87d-0863-4416-b18c-851912df6495' : selectedChat.id, // Fallback to a default admin ID if needed
            content: messageInput,
        };

        const { data, error } = await supabase.from('messages').insert(newMessage).select().single();

        if (!error && data) {
            setMessages(prev => [...prev, data]);
            setMessageInput('');
            scrollToBottom();
        }
    };

    if (loading) return <div className="dashboard-page loading-state">Loading Messages...</div>;

    return (
        <div className="dashboard-page fade-in" style={{ height: 'calc(100vh - 180px)', display: 'flex', gap: '20px' }}>
            <div className="dashboard-card chat-list-panel" style={{ flex: '0 0 350px', padding: '0', display: 'flex', flexDirection: 'column' }}>
                <div className="card-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3>Communications</h3>
                </div>
                <div className="chat-items-container" style={{ overflowY: 'auto' }}>
                    {conversations.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                            style={{
                                padding: '1.2rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                                background: selectedChat?.id === chat.id ? 'rgba(0, 255, 255, 0.05)' : 'transparent',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', flexShrink: 0 }}>{chat.avatar}</div>
                            <div style={{ flex: '1', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{chat.name}</strong>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#666' }}>{chat.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dashboard-card chat-window-panel" style={{ flex: '1', padding: '0', display: 'flex', flexDirection: 'column' }}>
                {selectedChat ? (
                    <>
                        <div className="chat-header" style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="user-avatar" style={{ width: '40px', height: '40px' }}>{selectedChat.avatar}</div>
                            <div>
                                <h4 style={{ margin: 0 }}>{selectedChat.name}</h4>
                                <span style={{ fontSize: '0.75rem', color: '#52b788' }}>Direct Channel Active</span>
                            </div>
                        </div>

                        <div className="chat-messages" style={{ flex: '1', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {messages.length > 0 ? messages.map((msg, i) => (
                                <div key={i} className={`message ${msg.sender_id === user.id ? 'outgoing' : 'incoming'}`} style={{
                                    alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                                    maxWidth: '75%'
                                }}>
                                    <div style={{
                                        background: msg.sender_id === user.id ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.05)',
                                        color: msg.sender_id === user.id ? '#000' : '#fff',
                                        padding: '10px 15px',
                                        borderRadius: msg.sender_id === user.id ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                                        fontSize: '0.9rem',
                                        fontWeight: msg.sender_id === user.id ? '500' : '400'
                                    }}>
                                        {msg.content}
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: '#555', marginTop: '4px', display: 'block', textAlign: msg.sender_id === user.id ? 'right' : 'left' }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', color: '#444', marginTop: '20%' }}>
                                    <p>No messages yet. Send a message to start the conversation.</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="chat-footer" style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Type a message..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                            />
                            <button type="submit" className="primary-btn">Send</button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
                        <h3>Your Workspace Inbox</h3>
                        <p>Communicate with project managers and support directly.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
