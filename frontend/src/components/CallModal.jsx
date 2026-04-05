import { useEffect, useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff,
  Phone, PhoneIncoming, Maximize2, Minimize2, Volume2
} from 'lucide-react';

// Format seconds as MM:SS
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function CallModal({
  callState, callType, remoteUser, incomingCall,
  isScreenSharing, remoteScreenSharing,
  isMuted, isVideoOff, callDuration,
  localVideoRef, remoteVideoRef, localStreamRef,
  onAccept, onReject, onEnd,
  onToggleMute, onToggleVideo, onToggleScreenShare,
}) {
  const [pip, setPip] = useState(false); // picture-in-picture local view

  const isVideo = callType === 'video';
  const isActive = callState === 'in-call';
  const isCalling = callState === 'calling';
  const isRinging = callState === 'ringing';

  // ── Incoming call screen ──
  if (isRinging && incomingCall) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-slide-up border border-white/10">
          {/* Pulsing avatar */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping" />
            <div className="absolute inset-2 bg-brand-500/30 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="relative w-full h-full avatar-placeholder text-3xl">
              {incomingCall.callerName?.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-1">Incoming {incomingCall.callType} call</p>
          <h2 className="font-display font-bold text-2xl text-white mb-2">{incomingCall.callerName}</h2>

          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-8">
            {incomingCall.callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
            {incomingCall.callType === 'video' ? 'Video call' : 'Audio call'}
          </div>

          <div className="flex gap-6 justify-center">
            <div className="flex flex-col items-center gap-2">
              <button onClick={onReject}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-red-500/30">
                <PhoneOff size={24} />
              </button>
              <span className="text-gray-400 text-xs">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button onClick={onAccept}
                className="w-16 h-16 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-brand-500/30">
                <Phone size={24} />
              </button>
              <span className="text-gray-400 text-xs">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Calling / Connecting screen ──
  if (isCalling) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full animate-ping" />
            <div className="relative w-full h-full avatar-placeholder text-4xl">
              {remoteUser?.name?.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">{remoteUser?.name}</h2>
          <p className="text-gray-400 text-sm mb-8">Calling… waiting for answer</p>

          <button onClick={onEnd}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center mx-auto transition-all hover:scale-105">
            <PhoneOff size={24} />
          </button>
          <p className="text-gray-500 text-xs mt-3">Cancel</p>
        </div>
      </div>
    );
  }

  // ── Active call screen ──
  if (isActive) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col overflow-hidden">

        {/* Remote video (full screen) */}
        {isVideo ? (
          <div className="relative flex-1 bg-gray-900 overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
              onLoadedMetadata={e => e.target.play().catch(() => {})}
            />

            {/* Remote screenshare badge */}
            {remoteScreenSharing && (
              <div className="absolute top-4 left-4 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm">
                <Monitor size={12} /> Sharing screen
              </div>
            )}

            {/* Call info top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
              <div>
                <p className="font-display font-semibold text-white">{remoteUser?.name}</p>
                <p className="text-brand-300 text-sm font-mono">{fmtTime(callDuration)}</p>
              </div>
              <div className="flex items-center gap-2">
                {isScreenSharing && (
                  <div className="bg-blue-600/80 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                    <Monitor size={12} /> Sharing
                  </div>
                )}
                <div className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                  HD
                </div>
              </div>
            </div>

            {/* Local video (PiP) */}
            <div
              className={`absolute bottom-24 right-4 transition-all duration-300 cursor-pointer group
                ${pip ? 'w-12 h-12 rounded-full overflow-hidden' : 'w-32 h-44 rounded-2xl overflow-hidden'}`}
              onClick={() => setPip(p => !p)}
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
            >
              {isVideoOff ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <VideoOff size={pip ? 16 : 24} className="text-gray-500" />
                </div>
              ) : (
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    // If stream already exists, assign it immediately when ref mounts
                    if (el && localStreamRef?.current) {
                      el.srcObject = localStreamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {pip ? <Maximize2 size={12} className="text-white" /> : <Minimize2 size={16} className="text-white" />}
              </div>
            </div>
          </div>
        ) : (
          /* Audio-only call */
          <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
            {/* Hidden audio element to play remote audio */}
            <audio ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className={`absolute inset-0 bg-brand-500/20 rounded-full ${isActive ? 'animate-pulse' : ''}`} />
                <div className="relative w-full h-full avatar-placeholder text-4xl">
                  {remoteUser?.name?.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-1">{remoteUser?.name}</h2>
              <p className="text-brand-400 font-mono">{fmtTime(callDuration)}</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Volume2 size={14} />
                <span>Audio call</span>
              </div>
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div className="bg-gray-900/95 backdrop-blur-md px-6 py-5 border-t border-white/5">
          <div className="flex items-center justify-center gap-4">

            {/* Mute */}
            <ControlBtn
              onClick={onToggleMute}
              active={isMuted}
              icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              label={isMuted ? 'Unmute' : 'Mute'}
              activeColor="bg-red-600"
            />

            {/* Video toggle (only for video calls) */}
            {isVideo && (
              <ControlBtn
                onClick={onToggleVideo}
                active={isVideoOff}
                icon={isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                label={isVideoOff ? 'Start video' : 'Stop video'}
                activeColor="bg-red-600"
              />
            )}

            {/* Screenshare (only for video calls) */}
            {isVideo && (
              <ControlBtn
                onClick={onToggleScreenShare}
                active={isScreenSharing}
                icon={isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                label={isScreenSharing ? 'Stop share' : 'Share screen'}
                activeColor="bg-blue-600"
              />
            )}

            {/* End call */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={onEnd}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-red-500/30">
                <PhoneOff size={22} />
              </button>
              <span className="text-gray-400 text-[10px]">End call</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ControlBtn({ onClick, active, icon, label, activeColor = 'bg-gray-700' }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 text-white
          ${active ? activeColor : 'bg-white/10 hover:bg-white/20'}`}
      >
        {icon}
      </button>
      <span className="text-gray-400 text-[10px] whitespace-nowrap">{label}</span>
    </div>
  );
}
