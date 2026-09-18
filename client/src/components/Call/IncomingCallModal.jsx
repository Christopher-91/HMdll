import { Phone, PhoneOff, Video } from 'lucide-react';
import './Call.css';

export default function IncomingCallModal({ callerName, isVideo, onAccept, onDecline }) {
  return (
    <div className="call-modal-overlay">
      <div className="call-modal">
        <div className="call-modal-avatar animate-pulse">
          <span>{callerName?.[0]?.toUpperCase() || '?'}</span>
        </div>
        
        <h3 className="call-modal-name">{callerName}</h3>
        <p className="call-modal-status">
          Incoming {isVideo ? 'Video' : 'Audio'} Call...
        </p>
        
        <div className="call-modal-actions">
          <button 
            className="call-btn decline-btn" 
            onClick={onDecline}
            aria-label="Decline Call"
          >
            <PhoneOff size={24} />
          </button>
          <button 
            className="call-btn accept-btn" 
            onClick={onAccept}
            aria-label="Accept Call"
          >
            {isVideo ? <Video size={24} /> : <Phone size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}
