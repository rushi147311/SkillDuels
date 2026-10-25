import { useEffect, useState } from 'react';
import { getFriendMessages, sendFriendMessage } from '../services/api';
import { socket } from '../services/socket';

export default function FriendChat({ friend, playerId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    getFriendMessages(friend.id)
      .then((response) => {
        if (active) setMessages(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleMessage = (message) => {
      const ids = message.conversationUserIds?.map(String) || [];
      if (!ids.includes(String(playerId)) || !ids.includes(String(friend.id))) return;
      setMessages((current) => (
        current.some((item) => String(item.id) === String(message.id))
          ? current
          : [...current, message]
      ));
    };
    socket.on('friend_message', handleMessage);

    return () => {
      active = false;
      socket.off('friend_message', handleMessage);
    };
  }, [friend.id, playerId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const messageText = text.trim();
    if (!messageText) return;

    setSending(true);
    setError('');
    try {
      const response = await sendFriendMessage(friend.id, messageText);
      setMessages((current) => (
        current.some((item) => String(item.id) === String(response.data.id))
          ? current
          : [...current, response.data]
      ));
      setText('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="friend-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="friend-modal friend-chat-modal" role="dialog" aria-modal="true" aria-labelledby="friend-chat-title">
        <div className="friend-modal-heading">
          <div><span className="dashboard-eyebrow">Direct messages</span><h2 id="friend-chat-title">{friend.username}</h2></div>
          <button type="button" className="friend-modal-close" onClick={onClose} aria-label="Close chat">×</button>
        </div>
        <div className="friend-chat-messages" aria-live="polite">
          {loading && <p className="empty-dashboard">Loading messages...</p>}
          {!loading && messages.length === 0 && <p className="empty-dashboard">Start the conversation.</p>}
          {messages.map((message) => {
            const ownMessage = String(message.senderId) === String(playerId);
            return (
              <div className={`friend-chat-message ${ownMessage ? 'own-message' : ''}`} key={message.id}>
                <span>{message.text}</span>
                <time>{new Date(message.createdAt).toLocaleString()}</time>
              </div>
            );
          })}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <form className="friend-chat-form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="friend-chat-input">Message</label>
          <input
            id="friend-chat-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={2000}
            placeholder="Write a message..."
            required
          />
          <button type="submit" disabled={sending || !text.trim()}>{sending ? '...' : 'Send'}</button>
        </form>
      </section>
    </div>
  );
}
