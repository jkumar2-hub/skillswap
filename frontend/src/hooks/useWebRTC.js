import { useRef, useState, useCallback, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export function useWebRTC() {
  const { emit, on, off } = useSocket();
  const { user } = useAuth();

  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video');
  const [remoteUser, setRemoteUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // ── Refs (avoid stale closures) ──
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const pendingCandidates = useRef([]);
  const callTypeRef = useRef('video');      // ← sync with callType state
  const remoteUserRef = useRef(null);       // ← sync with remoteUser state
  const incomingCallRef = useRef(null);     // ← sync with incomingCall state
  const callStateRef = useRef('idle');      // ← sync with callState state

  // Keep refs in sync with state
  useEffect(() => { callTypeRef.current = callType; }, [callType]);
  useEffect(() => { remoteUserRef.current = remoteUser; }, [remoteUser]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  // ── Timer ──
  const startTimer = useCallback(() => {
    clearInterval(callTimerRef.current);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(callTimerRef.current);
    setCallDuration(0);
  }, []);

  // ── Cleanup everything ──
  const cleanupCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.oniceconnectionstatechange = null;
      peerRef.current.close();
    }
    localStreamRef.current = null;
    screenStreamRef.current = null;
    peerRef.current = null;
    pendingCandidates.current = [];

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    stopTimer();
  }, [stopTimer]);

  // ── End call ──
  const endCall = useCallback(() => {
    const targetId = remoteUserRef.current?.id || incomingCallRef.current?.callerId;
    if (targetId) emit('call:end', { targetUserId: targetId });

    cleanupCall();
    setCallState('idle');
    setRemoteUser(null);
    setIncomingCall(null);
    setIsScreenSharing(false);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [emit, cleanupCall]);

  // ── Create peer connection ──
  const createPeer = useCallback((targetUserId) => {
    // Close any existing peer
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        emit('webrtc:ice-candidate', { targetUserId, candidate: e.candidate });
      }
    };

    // ✅ Handle remote stream
    peer.ontrack = (e) => {
      console.log('📹 Remote track received:', e.track.kind);
      if (e.streams && e.streams[0]) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      }
    };

    // ✅ Use iceConnectionState as it's more reliable than connectionState
    peer.oniceconnectionstatechange = () => {
      console.log('ICE state:', peer.iceConnectionState);
      if (peer.iceConnectionState === 'connected' || peer.iceConnectionState === 'completed') {
        setCallState('in-call');
        startTimer();
      }
      if (peer.iceConnectionState === 'failed') {
        peer.restartIce();
      }
      if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'closed') {
        if (callStateRef.current === 'in-call') endCall();
      }
    };

    peerRef.current = peer;
    return peer;
  }, [emit, startTimer, endCall]);

  // ── Get user media ──
  const getMedia = useCallback(async (type) => {
    // Stop any existing streams first
    localStreamRef.current?.getTracks().forEach(t => t.stop());

    const constraints = type === 'audio'
      ? { audio: { echoCancellation: true, noiseSuppression: true }, video: false }
      : {
          audio: { echoCancellation: true, noiseSuppression: true },
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      console.log('🎥 Got local media:', stream.getTracks().map(t => t.kind));
      return stream;
    } catch (err) {
      console.error('Media error:', err);
      if (err.name === 'NotFoundError') throw new Error('Camera/microphone not found. Check your device.');
      if (err.name === 'NotAllowedError') throw new Error('Please allow camera/microphone permissions and try again.');
      throw new Error('Could not access media devices.');
    }
  }, []);

  // ── Drain pending ICE candidates ──
  const drainCandidates = useCallback(async () => {
    if (!peerRef.current || !peerRef.current.remoteDescription) return;
    while (pendingCandidates.current.length > 0) {
      const candidate = pendingCandidates.current.shift();
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { console.warn('ICE candidate error:', e); }
    }
  }, []);

  // ── Initiate call ──
  const startCall = useCallback(async (targetUser, type = 'video') => {
    setRemoteUser(targetUser);
    setCallType(type);
    setCallState('calling');
    emit('call:initiate', {
      targetUserId: targetUser.id,
      callType: type,
      callerName: user?.name,
    });
  }, [emit, user]);

  // ── Accept incoming call ──
  const acceptCall = useCallback(async () => {
    const incoming = incomingCallRef.current;
    if (!incoming) return;
    const { callerId, callType: type } = incoming;

    setCallType(type);
    setIncomingCall(null);
    emit('call:answer', { callerId, accepted: true });

    try {
      const stream = await getMedia(type);
      const peer = createPeer(callerId);
      stream.getTracks().forEach(track => {
        console.log('Adding track:', track.kind);
        peer.addTrack(track, stream);
      });
      // ICE candidates will be queued until offer arrives
    } catch (err) {
      alert(err.message);
      emit('call:answer', { callerId, accepted: false });
      setCallState('idle');
    }
  }, [emit, getMedia, createPeer]);

  // ── Reject incoming call ──
  const rejectCall = useCallback(() => {
    const incoming = incomingCallRef.current;
    if (incoming) emit('call:answer', { callerId: incoming.callerId, accepted: false });
    setIncomingCall(null);
    setCallState('idle');
  }, [emit]);

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  }, []);

  // ── Toggle video ──
  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(v => !v);
  }, []);

  // ── Toggle screenshare ──
  const toggleScreenShare = useCallback(async () => {
    const targetId = remoteUserRef.current?.id;
    if (!targetId || !peerRef.current) return;

    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(videoTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
      emit('call:screenshare', { targetUserId: targetId, active: false });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
        emit('call:screenshare', { targetUserId: targetId, active: true });
      } catch (err) {
        if (err.name !== 'NotAllowedError') alert('Could not start screen sharing');
      }
    }
  }, [isScreenSharing, emit]);

  // ── Socket event listeners ──
  useEffect(() => {
    const handleIncoming = ({ callerId, callerName, callType }) => {
      console.log('📞 Incoming call from', callerName, callType);
      setIncomingCall({ callerId, callerName, callType });
      setCallState('ringing');
    };

    // Caller receives: callee accepted, now send offer
    const handleAnswered = async ({ accepted, answererId }) => {
      if (!accepted) {
        alert('Call was declined.');
        cleanupCall();
        setCallState('idle');
        setRemoteUser(null);
        return;
      }

      const type = callTypeRef.current; // ✅ Use ref, not stale closure
      console.log('✅ Call accepted, creating offer. type:', type);

      try {
        const stream = await getMedia(type);
        const peer = createPeer(answererId);

        stream.getTracks().forEach(track => {
          console.log('Caller adding track:', track.kind);
          peer.addTrack(track, stream);
        });

        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video',
        });
        await peer.setLocalDescription(offer);
        emit('webrtc:offer', { targetUserId: answererId, offer });
        console.log('📤 Offer sent');
      } catch (err) {
        console.error('Offer error:', err);
        alert(err.message);
        endCall();
      }
    };

    // Callee receives the offer → create answer
    const handleOffer = async ({ offer, callerId }) => {
      console.log('📥 Got offer from', callerId);
      if (!peerRef.current) {
        console.warn('No peer connection when offer arrived');
        return;
      }
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        await drainCandidates(); // ✅ Drain any queued ICE candidates

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        emit('webrtc:answer', { targetUserId: callerId, answer });
        console.log('📤 Answer sent');
      } catch (err) {
        console.error('Answer error:', err);
      }
    };

    // Caller receives the answer
    const handleAnswer = async ({ answer }) => {
      console.log('📥 Got answer');
      if (!peerRef.current) return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await drainCandidates(); // ✅ Drain any queued ICE candidates
      } catch (err) {
        console.error('Set remote description error:', err);
      }
    };

    // ICE candidate received
    const handleIce = async ({ candidate }) => {
      if (!peerRef.current || !peerRef.current.remoteDescription) {
        // Queue it — remote description not set yet
        pendingCandidates.current.push(candidate);
        return;
      }
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { console.warn('ICE error:', e); }
    };

    const handleScreenShare = ({ active }) => setRemoteScreenSharing(active);

    const handleEnded = () => {
      console.log('📵 Call ended by remote');
      cleanupCall();
      setCallState('idle');
      setRemoteUser(null);
      setIncomingCall(null);
      setIsScreenSharing(false);
      setIsMuted(false);
      setIsVideoOff(false);
    };

    on('call:incoming', handleIncoming);
    on('call:answered', handleAnswered);
    on('webrtc:offer', handleOffer);
    on('webrtc:answer', handleAnswer);
    on('webrtc:ice-candidate', handleIce);
    on('call:screenshare', handleScreenShare);
    on('call:ended', handleEnded);

    return () => {
      off('call:incoming', handleIncoming);
      off('call:answered', handleAnswered);
      off('webrtc:offer', handleOffer);
      off('webrtc:answer', handleAnswer);
      off('webrtc:ice-candidate', handleIce);
      off('call:screenshare', handleScreenShare);
      off('call:ended', handleEnded);
    };
  }, [on, off, emit, getMedia, createPeer, endCall, cleanupCall, drainCandidates]);

  return {
    callState, callType, remoteUser, incomingCall,
    isScreenSharing, remoteScreenSharing,
    isMuted, isVideoOff, callDuration,
    localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleVideo, toggleScreenShare,
  };
}
