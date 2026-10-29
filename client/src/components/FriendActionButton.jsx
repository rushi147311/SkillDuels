import { useEffect, useState } from 'react';
import { getFriendStatus, respondToFriendRequest, sendFriendRequest } from '../services/api';

export default function FriendActionButton({ username, relationship, onUpdated, className = '' }) {
  const hasRelationship = relationship !== undefined && relationship !== null;
  const [status, setStatus] = useState(relationship?.status || (
    relationship?.isFriend ? 'friends' : relationship?.friendRequest?.status || 'none'
  ));
  const [requestId, setRequestId] = useState(relationship?.friendRequest?.requestId || null);
  const [loading, setLoading] = useState(!hasRelationship);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasRelationship) return undefined;

    let active = true;
    getFriendStatus(username)
      .then((response) => {
        if (!active) return;
        setStatus(response.data.status);
        setRequestId(response.data.requestId);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasRelationship, username]);

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      if (status === 'received' && requestId) {
        await respondToFriendRequest(requestId, 'accepted');
        setStatus('friends');
      } else {
        const response = await sendFriendRequest(username);
        setRequestId(response.data.requestId);
        setStatus('sent');
      }
      onUpdated?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const label = {
    friends: 'Friends',
    sent: 'Requested',
    received: 'Accept request',
    self: 'You',
    none: 'Add friend',
  }[status] || 'Add friend';
  const disabled = loading || status === 'friends' || status === 'sent' || status === 'self';

  return (
    <span className={`friend-action ${className}`}>
      <button type="button" onClick={handleClick} disabled={disabled} aria-label={`${label}: ${username}`}>
        {loading ? 'Loading...' : label}
      </button>
      {error && <span className="friend-action-error" role="alert">{error}</span>}
    </span>
  );
}
