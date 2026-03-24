import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { playJoinSound, playLeaveSound } from '../lib/audio';

export default function VoiceChannel({ channel, onLeave, onParticipantsChange }) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isDeaf, setIsDeaf] = useState(false);
  const [rtcStatus, setRtcStatus] = useState('Подключение...');
  
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // userId -> RTCPeerConnection
  const audioRefs = useRef({}); // userId -> HTMLAudioElement
  const channelRef = useRef(null);

  useEffect(() => {
    if (!channel || !user) return;

    let mounted = true;
    setRtcStatus('Подключение...');

    // 1. Get local audio
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setRtcStatus('Подключено (RTC)');
        
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
            if (onParticipantsChange) onParticipantsChange(channel.id, parts);
          })
          .on('presence', { event: 'join' }, ({ key }) => {
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
            playJoinSound();
            await rtChannel.track({
              user_id: user.id,
              isMuted: isMuted,
              isDeaf: isDeaf
            });
          }
        });

      } catch (err) {
        console.error('Error accessing microphone:', err);
        setRtcStatus('Нет доступа к микрофону');
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
      playLeaveSound();
      if (onParticipantsChange) onParticipantsChange(channel.id, {});
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      Object.values(peersRef.current).forEach(pc => pc.close());
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channel, user]); // Only re-run if channel object or user changes

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
  }, [isMuted, isDeaf, user.id]);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleDeaf = () => setIsDeaf(!isDeaf);

  if (!channel) return null;

  return (
    <div className="voice-connection-panel">
      <div className="voice-connection-info">
        <div className="voice-connection-signal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--status-online)">
            <path d="M4.336 2.571a.882.882 0 0 0-1.248 1.248l16.471 16.47a.882.882 0 1 0 1.248-1.247L4.336 2.571z"/>
          </svg>
          <span className="voice-status-text">{rtcStatus}</span>
        </div>
        <div className="voice-channel-name">{channel.name}</div>
      </div>
      
      <div className="voice-connection-actions">
        {/* Disconnect Button */}
        <button className="voice-action-btn hangup" onClick={onLeave} data-tooltip="Отключиться">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.58.91-1.09.52-2.08 1.19-2.95 2.02-.27.27-.67.27-.95 0L.37 13.2c-.27-.27-.27-.72 0-.99C3.62 9.07 7.58 7 12 7s8.38 2.07 11.63 5.21c.27.27.27.72 0 .99l-2.55 2.55c-.27.27-.67.27-.95 0-.87-.83-1.86-1.5-2.95-2.02-.35-.17-.58-.52-.58-.91v-3.1C15.15 9.25 13.6 9 12 9z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
