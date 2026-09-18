import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getPusherInstance } from '../hooks/usePusher';
import { useWebRTC } from '../hooks/useWebRTC';
import api from '../lib/api';
import IncomingCallModal from '../components/Call/IncomingCallModal';
import ActiveCallOverlay from '../components/Call/ActiveCallOverlay';

const CallContext = createContext({});

export function CallProvider({ children }) {
  const { user } = useAuth();
  const [callState, setCallState] = useState('idle'); // 'idle', 'ringing', 'in-call'
  const [incomingCallData, setIncomingCallData] = useState(null); // { callerId, callerName, offer, isVideo }
  const [activeCallData, setActiveCallData] = useState(null); // { remoteId, remoteName, isVideo, isInitiator }

  // Expose an onIceCandidate callback to useWebRTC
  const handleIceCandidate = useCallback(async (candidate) => {
    if (!activeCallData) return;
    try {
      await api.post('/call/signal', {
        type: 'ice-candidate',
        recipientId: activeCallData.remoteId,
        payload: { candidate }
      });
    } catch (err) {
      console.error('Failed to send ICE candidate', err);
    }
  }, [activeCallData]);

  const {
    localStream,
    remoteStream,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    cleanup
  } = useWebRTC(handleIceCandidate);

  // 1. Subscribe to Global User Channel for incoming signals
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const pusher = getPusherInstance(token);
    const channelName = `private-user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('call-signal', async (data) => {
      const { type, callerId, callerName, payload } = data;

      if (type === 'ring') {
        if (callState !== 'idle') {
          // Already busy
          await api.post('/call/signal', { type: 'decline', recipientId: callerId, payload: { reason: 'busy' } });
          return;
        }
        setIncomingCallData({ callerId, callerName, offer: payload.offer, isVideo: payload.isVideo });
        setCallState('ringing');
      }

      if (type === 'accept') {
        if (callState === 'ringing' && activeCallData?.isInitiator) {
          // They accepted our call
          await handleAnswer(payload.answer);
          setCallState('in-call');
        }
      }

      if (type === 'decline' || type === 'end') {
        endCallLocal();
      }

      if (type === 'ice-candidate') {
        await addIceCandidate(payload.candidate);
      }
    });

    return () => {
      pusher.unsubscribe(channelName);
    };
  }, [user, callState, activeCallData, handleAnswer, addIceCandidate]);

  // 2. Outgoing Call Logic
  const startCall = async (recipientId, recipientName, isVideo = true) => {
    try {
      const stream = await initLocalStream(isVideo);
      setActiveCallData({ remoteId: recipientId, remoteName: recipientName, isVideo, isInitiator: true });
      setCallState('ringing'); // Ringing out

      const offer = await createOffer(stream);
      await api.post('/call/signal', {
        type: 'ring',
        recipientId,
        payload: { offer, isVideo }
      });
    } catch (err) {
      console.error('Failed to start call', err);
      endCallLocal();
    }
  };

  // 3. Incoming Call Responses
  const acceptCall = async () => {
    if (!incomingCallData) return;
    try {
      const stream = await initLocalStream(incomingCallData.isVideo);
      setActiveCallData({ 
        remoteId: incomingCallData.callerId, 
        remoteName: incomingCallData.callerName, 
        isVideo: incomingCallData.isVideo, 
        isInitiator: false 
      });
      
      const answer = await handleOffer(incomingCallData.offer, stream);
      await api.post('/call/signal', {
        type: 'accept',
        recipientId: incomingCallData.callerId,
        payload: { answer }
      });
      
      setIncomingCallData(null);
      setCallState('in-call');
    } catch (err) {
      console.error('Failed to accept call', err);
      endCallLocal();
    }
  };

  const declineCall = async () => {
    if (incomingCallData) {
      await api.post('/call/signal', {
        type: 'decline',
        recipientId: incomingCallData.callerId
      });
    }
    setIncomingCallData(null);
    setCallState('idle');
  };

  const endCall = async () => {
    if (activeCallData) {
      await api.post('/call/signal', {
        type: 'end',
        recipientId: activeCallData.remoteId
      });
    }
    endCallLocal();
  };

  const endCallLocal = () => {
    cleanup();
    setCallState('idle');
    setIncomingCallData(null);
    setActiveCallData(null);
  };

  return (
    <CallContext.Provider value={{ startCall, endCall }}>
      {children}
      
      {/* Modals rendered globally */}
      {callState === 'ringing' && incomingCallData && (
        <IncomingCallModal 
          callerName={incomingCallData.callerName} 
          isVideo={incomingCallData.isVideo}
          onAccept={acceptCall} 
          onDecline={declineCall} 
        />
      )}
      
      {callState === 'in-call' && (
        <ActiveCallOverlay 
          localStream={localStream}
          remoteStream={remoteStream}
          remoteName={activeCallData?.remoteName}
          isVideo={activeCallData?.isVideo}
          onEnd={endCall}
        />
      )}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
