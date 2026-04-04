import { createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { useWebRTC } from './hooks/useWebRTC';
import CallModal from './components/CallModal';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Matches from './pages/Matches';
import Exchanges from './pages/Exchanges';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

// ── Call context — lets any page trigger a call ──
export const CallContext = createContext(null);
export const useCall = () => useContext(CallContext);

function CallProvider({ children }) {
  const webrtc = useWebRTC();
  const visible = ['ringing', 'calling', 'in-call'].includes(webrtc.callState);

  return (
    <CallContext.Provider value={{ startCall: webrtc.startCall }}>
      {children}
      {visible && (
        <CallModal
          callState={webrtc.callState}
          callType={webrtc.callType}
          remoteUser={webrtc.remoteUser}
          incomingCall={webrtc.incomingCall}
          isScreenSharing={webrtc.isScreenSharing}
          remoteScreenSharing={webrtc.remoteScreenSharing}
          isMuted={webrtc.isMuted}
          isVideoOff={webrtc.isVideoOff}
          callDuration={webrtc.callDuration}
          localVideoRef={webrtc.localVideoRef}
          remoteVideoRef={webrtc.remoteVideoRef}
          onAccept={webrtc.acceptCall}
          onReject={webrtc.rejectCall}
          onEnd={webrtc.endCall}
          onToggleMute={webrtc.toggleMute}
          onToggleVideo={webrtc.toggleVideo}
          onToggleScreenShare={webrtc.toggleScreenShare}
        />
      )}
    </CallContext.Provider>
  );
}

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-body">Loading SkillSwap...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const GuestOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CallProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
              <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
              <Route path="/" element={<Protected><Layout /></Protected>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="browse" element={<Browse />} />
                <Route path="matches" element={<Matches />} />
                <Route path="exchanges" element={<Exchanges />} />
                <Route path="messages" element={<Messages />} />
                <Route path="messages/:userId" element={<Messages />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:userId" element={<Profile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CallProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
