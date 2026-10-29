import { useCallback, useEffect, useRef, useState } from 'react';
import { getFriends } from '../services/api';
import { socket } from '../services/socket';

export default function FriendNotifications() {
  const [notification, setNotification] = useState('');
  const knownRequestIds = useRef(null);
  const notificationTimer = useRef(null);

  const showNotification = useCallback((text) => {
    setNotification(text);
    window.clearTimeout(notificationTimer.current);
    notificationTimer.current = window.setTimeout(() => setNotification(''), 5000);
  }, []);

  const refreshRequests = useCallback(() => {
    const playerId = localStorage.getItem('skillDuelsPlayerId');
    if (!localStorage.getItem('skillDuelsToken') || !playerId) return;
    getFriends()
      .then((response) => {
        const requests = response.data.requests;
        const currentRequestIds = new Set(requests.map((request) => String(request.id)));
        if (knownRequestIds.current) {
          const newRequest = requests.find((request) => (
            !knownRequestIds.current.has(String(request.id))
          ));
          if (newRequest) {
            showNotification(newRequest.type === 'challenge'
              ? `${newRequest.sender.username} challenged you to a ${newRequest.categoryName} duel.`
              : `${newRequest.sender.username} sent you a friend request.`);
          }
        }
        knownRequestIds.current = currentRequestIds;
      })
      .catch((error) => console.error('Unable to check friend notifications:', error));
  }, [showNotification]);

  useEffect(() => {
    const handleFriendsUpdated = ({ userId }) => {
      const playerId = localStorage.getItem('skillDuelsPlayerId');
      if (String(userId) === String(playerId)) refreshRequests();
    };
    const handleMessage = (message) => {
      const playerId = localStorage.getItem('skillDuelsPlayerId');
      if (String(message.recipientId) === String(playerId)) {
        showNotification(`${message.senderUsername} sent you a message.`);
      }
    };

    socket.on('connect', refreshRequests);
    socket.on('friends_updated', handleFriendsUpdated);
    socket.on('friend_message', handleMessage);
    if (socket.connected) refreshRequests();

    return () => {
      socket.off('connect', refreshRequests);
      socket.off('friends_updated', handleFriendsUpdated);
      socket.off('friend_message', handleMessage);
      window.clearTimeout(notificationTimer.current);
    };
  }, [refreshRequests, showNotification]);

  return notification
    ? <div className="friend-toast" role="status" aria-live="polite">{notification}</div>
    : null;
}
