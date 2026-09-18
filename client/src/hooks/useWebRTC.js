import { useState, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(onIceCandidate) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnection = useRef(null);

  const initLocalStream = useCallback(async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local media', err);
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback((stream) => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    // Add local tracks to connection
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    return pc;
  }, [onIceCandidate]);

  const createOffer = useCallback(async (stream) => {
    const pc = createPeerConnection(stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }, [createPeerConnection]);

  const handleOffer = useCallback(async (offer, stream) => {
    const pc = createPeerConnection(stream);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }, [createPeerConnection]);

  const handleAnswer = useCallback(async (answer) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate) => {
    if (peerConnection.current) {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    initLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    cleanup
  };
}
