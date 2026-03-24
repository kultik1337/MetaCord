import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServerBar from './components/ServerBar';
import ChannelSidebar from './components/ChannelSidebar';
import ChatArea from './components/ChatArea';
import MemberList from './components/MemberList';
import DMSidebar from './components/DMSidebar';
import DMChatArea from './components/DMChatArea';
import FriendsView from './components/FriendsView';
import UserBar from './components/UserBar';
import VoiceChannel from './components/VoiceChannel';
import { CreateServerModal, JoinServerModal, CreateChannelModal, InviteModal } from './components/Modals';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <img src="/logo.png" alt="MetaCord" style={{ width: 80, height: 80, marginBottom: 16 }} />
      <div className="loading-spinner" />
      <span style={{ color: 'var(--text-muted)', marginTop: 8 }}>Загрузка MetaCord...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
}

function MainApp() {
  const { user, profile } = useAuth();
  
  // State
  const [servers, setServers] = useState([]);
  const [activeServerId, setActiveServerId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);
  const [voiceParticipants, setVoiceParticipants] = useState({});
  const [isDMView, setIsDMView] = useState(false);
  const [dmConversations, setDmConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [showMemberList, setShowMemberList] = useState(true);
  const [showFriends, setShowFriends] = useState(true);
  
  // Modals
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  // Load user's servers
  useEffect(() => {
    if (!user) return;
    
    const loadServers = async () => {
      const { data: memberData } = await supabase
        .from('server_members')
        .select('server_id')
        .eq('user_id', user.id);
      
      if (memberData?.length) {
        const serverIds = memberData.map(m => m.server_id);
        const { data: serverData } = await supabase
          .from('servers')
          .select('*')
          .in('id', serverIds)
          .order('created_at', { ascending: true });
        
        if (serverData) {
          setServers(serverData);
          if (!activeServerId && serverData.length > 0 && !isDMView) {
            setActiveServerId(serverData[0].id);
          }
        }
      }
    };

    loadServers();
  }, [user?.id]);

  // Load channels for active server
  useEffect(() => {
    if (!activeServerId) {
      setChannels([]);
      return;
    }

    const loadChannels = async () => {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', activeServerId)
        .order('position', { ascending: true });
      
      if (data) {
        setChannels(data);
        if (data.length > 0) {
          const firstText = data.find(c => c.type === 'text');
          setActiveChannelId(firstText ? firstText.id : null);
        } else {
          setActiveChannelId(null);
        }
      }
    };

    loadChannels();
  }, [activeServerId]);

  // Load DM conversations
  useEffect(() => {
    if (!user) return;

    const loadDMs = async () => {
      const { data: myMemberships } = await supabase
        .from('dm_members')
        .select('conversation_id')
        .eq('user_id', user.id);
      
      if (myMemberships?.length) {
        const convIds = myMemberships.map(m => m.conversation_id);
        const { data: convs } = await supabase
          .from('direct_conversations')
          .select('*')
          .in('id', convIds)
          .order('created_at', { ascending: false });
        
        if (convs) setDmConversations(convs);
      }
    };

    loadDMs();
  }, [user?.id]);

  // Handlers
  const handleSelectServer = (serverId) => {
    setIsDMView(false);
    setActiveServerId(serverId);
    setActiveConvId(null);
  };

  const handleSelectDM = () => {
    setIsDMView(true);
    setActiveServerId(null);
    setActiveChannelId(null);
    setShowFriends(true);
    setActiveConvId(null);
  };

  const handleSelectChannel = (channelId) => {
    const ch = channels.find(c => c.id === channelId);
    if (!ch) return;
    if (ch.type === 'voice') {
      setActiveVoiceChannel(ch); // Does not replace text channel
    } else {
      setActiveChannelId(channelId);
    }
  };

  const handleCreateServer = async (name) => {
    const { data: server } = await supabase
      .from('servers')
      .insert({ name, owner_id: user.id })
      .select()
      .single();
    
    if (server) {
      await supabase.from('server_members').insert({
        server_id: server.id,
        user_id: user.id,
        role: 'owner'
      });
      
      await supabase.from('channels').insert({
        server_id: server.id,
        name: 'общий',
        type: 'text',
        position: 0
      });

      setServers(prev => [...prev, server]);
      setActiveServerId(server.id);
      setIsDMView(false);
    }
  };

  const handleJoinServer = async (inviteCode) => {
    const { data: server } = await supabase
      .from('servers')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();
    
    if (!server) return { error: 'Сервер с таким кодом не найден' };

    const { data: existing } = await supabase
      .from('server_members')
      .select('id')
      .eq('server_id', server.id)
      .eq('user_id', user.id)
      .single();

    if (existing) return { error: 'Вы уже на этом сервере' };

    await supabase.from('server_members').insert({
      server_id: server.id,
      user_id: user.id,
      role: 'member'
    });

    setServers(prev => [...prev, server]);
    setActiveServerId(server.id);
    setIsDMView(false);
    return {};
  };

  const handleCreateChannel = async (name) => {
    if (!activeServerId) return;
    const { data } = await supabase
      .from('channels')
      .insert({
        server_id: activeServerId,
        name,
        type: 'text',
        position: channels.length
      })
      .select()
      .single();
    
    if (data) {
      setChannels(prev => [...prev, data]);
      setActiveChannelId(data.id);
    }
  };

  const handleStartDM = async (otherUserId) => {
    // Use RPC to atomically create DM (avoids RLS race condition)
    const { data: convId, error } = await supabase.rpc('create_dm', { other_user_id: otherUserId });
    
    if (error) {
      console.error('Error creating DM:', error);
      return;
    }

    // Reload DM conversations
    const { data: myMemberships } = await supabase
      .from('dm_members')
      .select('conversation_id')
      .eq('user_id', user.id);
    
    if (myMemberships?.length) {
      const convIds = myMemberships.map(m => m.conversation_id);
      const { data: convs } = await supabase
        .from('direct_conversations')
        .select('*')
        .in('id', convIds)
        .order('created_at', { ascending: false });
      if (convs) setDmConversations(convs);
    }

    setActiveConvId(convId);
  };

  const activeServer = servers.find(s => s.id === activeServerId);
  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="app-layout">
      <ServerBar
        servers={servers}
        activeServerId={activeServerId}
        onSelectServer={handleSelectServer}
        onSelectDM={handleSelectDM}
        isDMView={isDMView}
        onCreateServer={() => setShowCreateServer(true)}
        onJoinServer={() => setShowJoinServer(true)}
      />

      <div className="sidebar-container">
        {isDMView ? (
          <DMSidebar
            conversations={dmConversations}
            activeConvId={activeConvId}
            onSelectConversation={(id) => { setActiveConvId(id); setShowFriends(false); }}
            onStartDM={(id) => { handleStartDM(id); setShowFriends(false); }}
            onShowFriends={() => { setShowFriends(true); setActiveConvId(null); }}
            showFriends={showFriends}
          />
        ) : (
          <ChannelSidebar
            server={activeServer}
            channels={channels}
            activeChannelId={activeChannelId}
            activeVoiceChannel={activeVoiceChannel}
            voiceParticipants={voiceParticipants}
            onSelectChannel={handleSelectChannel}
            onCreateChannel={() => setShowCreateChannel(true)}
            onInvite={() => setShowInvite(true)}
          />
        )}
        
        {/* Voice Connection Panel stays globally visible in Sidebar container */}
        <VoiceChannel
          channel={activeVoiceChannel}
          onParticipantsChange={(channelId, parts) => setVoiceParticipants(prev => ({ ...prev, [channelId]: parts }))}
          onLeave={() => setActiveVoiceChannel(null)}
        />
        <UserBar />
      </div>

      <div className="chat-content-container" style={{ flex: 1, display: 'flex' }}>
        {isDMView ? (
          showFriends ? (
            <FriendsView onStartDM={(id) => { handleStartDM(id); setShowFriends(false); }} />
          ) : (
            <DMChatArea conversationId={activeConvId} />
          )
        ) : (
          <>
            <ChatArea channel={activeChannel} serverId={activeServerId} />
            {showMemberList && activeServerId && (
              <MemberList serverId={activeServerId} />
            )}
          </>
        )}
      </div>

      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onCreate={handleCreateServer}
        />
      )}
      {showJoinServer && (
        <JoinServerModal
          onClose={() => setShowJoinServer(false)}
          onJoin={handleJoinServer}
        />
      )}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreate={handleCreateChannel}
        />
      )}
      {showInvite && activeServer && (
        <InviteModal
          server={activeServer}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/channels/*" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
