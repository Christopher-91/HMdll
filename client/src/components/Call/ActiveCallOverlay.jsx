import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import './Call.css';

export default function ActiveCallOverlay({ localStream, remoteStream, remoteName, isVideo, onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(isVideo);

  // Bind streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  return (
    <div className="active-call-overlay">
      <div className="active-call-header">
        <h2 className="active-call-name">{remoteName}</h2>
        <span className="active-call-timer">In Call</span>
      </div>

      <div className="active-call-video-container">
        {/* Remote Video (Main) */}
        {remoteStream && isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
        ) : (
          <div className="audio-only-placeholder">
            <span>{remoteName?.[0]?.toUpperCase() || '?'}</span>
          </div>
        )}

        {/* Local Video (PiP) */}
        {localStream && isVideo && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video-pip"
          />
        )}
        
        {/* Render Audio Element if it's an audio call (so we can hear them!) */}
        {remoteStream && !isVideo && (
          <audio ref={remoteVideoRef} autoPlay />
        )}
      </div>

      <div className="active-call-controls">
        <button 
          className={`control-btn ${!audioEnabled ? 'muted' : ''}`}
          onClick={toggleAudio}
        >
          {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        
        {isVideo && (
          <button 
            className={`control-btn ${!videoEnabled ? 'muted' : ''}`}
            onClick={toggleVideo}
          >
            {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        )}

        <button 
          className="control-btn hangup-btn"
          onClick={onEnd}
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
