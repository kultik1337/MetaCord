import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function VoiceChannel({ channel, onLeave }) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isDeaf, setIsDeaf] = useState(false);
  
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // userId -> RTCPeerConnection
  const audioRefs = useRef({}); // userId -> HTMLAudioElement
  const channelRef = useRef(null);

  useEffect(() => {
    if (!channel || !user) return;

    let mounted = true;

    // 1. Get local audio
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        
        // 2. Connect to Realtime channel for signaling
        const rtChannel = supabase.channel(`voice:${channel.id}`, {
          config: {
            presence: { key: user.id },
            broadcast: { self: false }
          }
        });
        channelRef.current = rtChannel;

        rtChannel
          .on('presence', { event: 'sync' }, () => {
            const state = rtChannel.presenceState();
            const parts = {};
            for (const key in state) {
              parts[key] = state[key][0]; // Take first presence object for the user
            }
            setParticipants(parts);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            if (key === user.id) return;
            // Initiate WebRTC connection to new user
            createPeerConnection(key, true);
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            if (peersRef.current[key]) {
              peersRef.current[key].close();
              delete peersRef.current[key];
            }
            if (audioRefs.current[key]) {
              audioRefs.current[key].srcObject = null;
              delete audioRefs.current[key];
            }
          })
          .on('broadcast', { event: 'signal' }, async ({ payload }) => {
            const { from, signal } = payload;
            if (!from || from === user.id) return;

            if (!peersRef.current[from]) {
              createPeerConnection(from, false);
            }
            const pc = peersRef.current[from];

            if (signal.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              rtChannel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { to: from, from: user.id, signal: pc.localDescription }
              });
            } else if (signal.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(signal));
            }
          });

        rtChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await rtChannel.track({
              user_id: user.id,
              isMuted: isMuted,
              isDeaf: isDeaf
            });
          }
        });

      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Не удалось получить доступ к микрофону. Проверьте разрешения!');
        if (onLeave) onLeave();
      }
    };

    const createPeerConnection = async (targetUserId, initiator) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peersRef.current[targetUserId] = pc;

      // Add local track
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { to: targetUserId, from: user.id, signal: event.candidate }
          });
        }
      };

      // Handle remote track
      pc.ontrack = (event) => {
        if (!audioRefs.current[targetUserId]) {
          const audio = new Audio();
          audio.autoplay = true;
          audioRefs.current[targetUserId] = audio;
        }
        audioRefs.current[targetUserId].srcObject = event.streams[0];
      };

      if (initiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { to: targetUserId, from: user.id, signal: pc.localDescription }
        });
      }
    };

    initAudio();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      Object.values(peersRef.current).forEach(pc => pc.close());
      supabase.removeChannel(channelRef.current);
    };
  }, [channel?.id, user?.id]);

  // Update presence on mute/deaf toggle
  useEffect(() => {
    if (channelRef.current && channelRef.current.state === 'joined') {
      channelRef.current.track({ user_id: user.id, isMuted, isDeaf });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, isDeaf]);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleDeaf = () => setIsDeaf(!isDeaf);

  const getAvatarColor = (id) => {
    const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#e78fd7'];
    if (!id) return colors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const participantsList = Object.entries(participants);

  return (
    <div className="voice-channel-container">
      <div className="chat-header glass">
        <span className="channel-hash-icon">🔊</span>
        <span className="channel-title">{channel.name}</span>
      </div>

      <div className="voice-grid">
        {participantsList.map(([userId, state]) => (
          <div key={userId} className={`voice-participant ${state.isMuted ? 'muted' : ''}`}>
            <div className="voice-avatar-wrapper">
              <div 
                className="voice-avatar" 
                style={{ backgroundColor: getAvatarColor(userId) }}
              >
                {userId.substring(0, 2).toUpperCase()}
              </div>
              {state.isMuted && (
                <div className="status-badge mute-badge">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531v-4.118a3.52 3.52 0 0 0-3.53-3.529 3.52 3.52 0 0 0-3.53 3.53v4.117c0 2.001 1.529 3.531 3.53 3.531z" fillOpacity=".3" />
                    <path d="M21.5 11.412a.882.882 0 1 0-1.765 0 7.735 7.735 0 0 1-7.735 7.735 7.735 7.735 0 0 1-7.735-7.735.882.882 0 1 0-1.765 0 9.477 9.477 0 0 0 8.618 9.423v2.871h-3.53a.882.882 0 1 0 0 1.765h8.823a.882.882 0 1 0 0-1.765h-3.529v-2.871a9.477 9.477 0 0 0 8.618-9.423z"/>
                    <path d="M4.336 2.571a.882.882 0 0 0-1.248 1.248l16.471 16.47a.882.882 0 1 0 1.248-1.247L4.336 2.571z"/>
                  </svg>
                </div>
              )}
            </div>
            <span className="voice-name">{userId === user.id ? 'Ты' : 'Пользователь ' + userId.substring(0, 4)}</span>
          </div>
        ))}
      </div>

      <div className="voice-controls glass">
        <button className={`control-btn ${isMuted ? 'danger' : ''}`} onClick={toggleMute} title="Микрофон">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            {isMuted ? (
              <>
                <path d="M21.5 11.412a.882.882 0 1 0-1.765 0 7.735 7.735 0 0 1-7.735 7.735 7.735 7.735 0 0 1-7.735-7.735.882.882 0 1 0-1.765 0 9.477 9.477 0 0 0 8.618 9.423v2.871h-3.53a.882.882 0 1 0 0 1.765h8.823a.882.882 0 1 0 0-1.765h-3.529v-2.871a9.477 9.477 0 0 0 8.618-9.423z"/>
                <path d="M4.336 2.571a.882.882 0 0 0-1.248 1.248l16.471 16.47a.882.882 0 1 0 1.248-1.247L4.336 2.571z"/>
              </>
            ) : (
              <>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </>
            )}
          </svg>
        </button>
        <button className={`control-btn ${isDeaf ? 'danger' : ''}`} onClick={toggleDeaf} title="Наушники">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            {isDeaf ? (
              <path d="M12 2C6.48 2 2 6.48 2 12v6c0 1.1.9 2 2 2h3v-7H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-2v7h3c1.1 0 2-.9 2-2v-6c0-5.52-4.48-10-10-10zm-1 15v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4H11z" fillOpacity=".3" />
            ) : (
              <path d="M12 2C6.48 2 2 6.48 2 12v6c0 1.1.9 2 2 2h3v-7H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-2v7h3c1.1 0 2-.9 2-2v-6c0-5.52-4.48-10-10-10zm-5 11v5H4v-5h3zm13 5h-3v-5h3v5z"/>
            )}
          </svg>
        </button>
        <button className="control-btn hangup" onClick={() => onLeave && onLeave()} title="Отключиться">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.58.91-1.09.52-2.08 1.19-2.95 2.02-.27.27-.67.27-.95 0L.37 13.2c-.27-.27-.27-.72 0-.99C3.62 9.07 7.58 7 12 7s8.38 2.07 11.63 5.21c.27.27.27.72 0 .99l-2.55 2.55c-.27.27-.67.27-.95 0-.87-.83-1.86-1.5-2.95-2.02-.35-.17-.58-.52-.58-.91v-3.1C15.15 9.25 13.6 9 12 9z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
