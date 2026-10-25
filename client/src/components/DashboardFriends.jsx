import { useCallback, useEffect, useState } from 'react';
import {
  createFriendChallenge,
  getCategories,
  getFriendProfile,
  getFriends,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from '../services/api';
import { socket } from '../services/socket';
import FriendChat from './FriendChat';

export default function DashboardFriends({ playerId, onJoinRoom, onOpenRoom }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [acceptedChallenges, setAcceptedChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    getFriends()
      .then((response) => {
        setFriends(response.data.friends);
        setRequests(response.data.requests);
        setAcceptedChallenges(response.data.acceptedChallenges || []);
        setError('');
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const handleFriendsUpdated = ({ userId }) => {
      if (String(userId) === String(playerId)) refresh();
    };
    socket.on('friends_updated', handleFriendsUpdated);
    return () => {
      socket.off('friends_updated', handleFriendsUpdated);
    };
  }, [playerId, refresh]);

  const handleAddFriend = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await sendFriendRequest(username);
      setMessage(`Friend request sent to ${response.data.username}.`);
      setUsername('');
      refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRequest = async (requestId, status) => {
    setSaving(true);
    setError('');
    try {
      const response = await respondToFriendRequest(requestId, status);
      if (response.data.type === 'challenge' && status === 'accepted') {
        await onJoinRoom(response.data.roomCode);
        return;
      }
      refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const openProfile = async (friend) => {
    setSelectedFriend({ ...friend, view: 'profile' });
    setProfile(null);
    setProfileLoading(true);
    setError('');
    try {
      const response = await getFriendProfile(friend.id);
      setProfile(response.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const openChallenge = async (friend) => {
    setSelectedFriend({ ...friend, view: 'challenge' });
    setError('');
    try {
      const response = await getCategories();
      setCategories(response.data);
      setCategoryName(response.data[0]?.name || '');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleChallenge = async () => {
    if (!selectedFriend || !categoryName) return;
    setSaving(true);
    setError('');
    try {
      await createFriendChallenge(selectedFriend.id, categoryName);
      setMessage(`Challenge sent to ${selectedFriend.username}. They can accept it from your friend requests.`);
      setSelectedFriend(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFriend = async (friend) => {
    if (!window.confirm(`Remove ${friend.username} from your friends?`)) return;
    setSaving(true);
    setError('');
    try {
      await removeFriend(friend.id);
      setFriends((current) => current.filter((item) => String(item.id) !== String(friend.id)));
      setMessage(`${friend.username} was removed from your friends.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="dashboard-panel dashboard-list-panel friends-panel">
      <div className="dashboard-section-heading">
        <div><span className="dashboard-eyebrow">Your community</span><h2>Friends</h2></div>
        <span className="heading-badge">{friends.length} connected</span>
      </div>
      <form className="friend-add-form" onSubmit={handleAddFriend}>
        <label className="visually-hidden" htmlFor="friend-username">Friend username</label>
        <input
          id="friend-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Add by username"
          required
        />
        <button type="submit" disabled={saving || !username.trim()}>{saving ? '...' : 'Add'}</button>
      </form>
      {message && <p className="friend-success" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="friends-content">
        {acceptedChallenges.length > 0 && (
          <div className="friend-request-list">
            <h3>Accepted challenges</h3>
            {acceptedChallenges.map((challenge) => (
              <div className="friend-request-row" key={challenge.id}>
                <span>
                  {challenge.isChallenger
                    ? `${challenge.opponent} accepted`
                    : `You accepted ${challenge.opponent}'s challenge`}
                  {' '}({challenge.categoryName})
                </span>
                <button
                  type="button"
                  onClick={() => challenge.isChallenger
                    ? onOpenRoom(challenge.roomCode)
                    : onJoinRoom(challenge.roomCode)}
                >
                  Join duel
                </button>
              </div>
            ))}
          </div>
        )}
        {requests.length > 0 && (
          <div className="friend-request-list">
            <h3>Friend requests</h3>
            {requests.map((request) => (
              <div className="friend-request-row" key={request.id}>
                <span>
                  {request.type === 'challenge'
                    ? `${request.sender.username} challenged you (${request.categoryName})`
                    : request.sender.username}
                </span>
                <div>
                  <button type="button" disabled={saving} onClick={() => handleRequest(request.id, 'accepted')}>
                    {request.type === 'challenge' ? 'Join' : 'Accept'}
                  </button>
                  <button type="button" className="decline-friend" disabled={saving} onClick={() => handleRequest(request.id, 'declined')}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {loading ? <p className="empty-dashboard">Loading friends...</p> : (
          <div className="friends-list">
            {friends.map((friend) => (
              <div className="friend-row" key={friend.id}>
                <span className="friend-avatar">{friend.username.slice(0, 1).toUpperCase()}</span>
                <div className="friend-row-copy"><strong>{friend.username}</strong>
                  <div className="friend-row-actions">
                    <button type="button" onClick={() => openChallenge(friend)}>Challenge</button>
                    <button type="button" onClick={() => setSelectedFriend({ ...friend, view: 'chat' })}>Message</button>
                    <button type="button" onClick={() => openProfile(friend)}>View profile</button>
                  </div>
                </div>
                <button
                  type="button"
                  className="friend-remove-icon"
                  disabled={saving}
                  onClick={() => handleRemoveFriend(friend)}
                  aria-label={`Remove ${friend.username} from friends`}
                  title="Remove friend"
                >
                  −
                </button>
              </div>
            ))}
            {friends.length === 0 && requests.length === 0 && acceptedChallenges.length === 0 && (
              <p className="empty-dashboard">Add a player or accept a friend request to get started.</p>
            )}
          </div>
        )}
      </div>
      {selectedFriend?.view === 'chat' && (
        <FriendChat
          friend={selectedFriend}
          playerId={playerId}
          onClose={() => setSelectedFriend(null)}
        />
      )}
      {selectedFriend?.view === 'profile' && (
        <div className="friend-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedFriend(null);
        }}>
          <section className="friend-modal" role="dialog" aria-modal="true" aria-labelledby="friend-profile-title">
            <div className="friend-modal-heading">
              <div><span className="dashboard-eyebrow">Friend profile</span><h2 id="friend-profile-title">{profile?.username || selectedFriend.username}</h2></div>
              <button type="button" className="friend-modal-close" onClick={() => setSelectedFriend(null)} aria-label="Close profile">×</button>
            </div>
            {profileLoading ? <p className="empty-dashboard">Loading profile...</p> : profile && (
              <div className="friend-profile-stats">
                <div><span>Level</span><strong>{profile.level}</strong></div>
                <div><span>XP</span><strong>{profile.xp}</strong></div>
                <div><span>Wins</span><strong>{profile.wins}</strong></div>
                <div><span>Matches</span><strong>{profile.matches}</strong></div>
              </div>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
          </section>
        </div>
      )}
      {selectedFriend?.view === 'challenge' && (
        <div className="friend-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedFriend(null);
        }}>
          <section className="friend-modal" role="dialog" aria-modal="true" aria-labelledby="friend-challenge-title">
            <div className="friend-modal-heading">
              <div><span className="dashboard-eyebrow">Private duel</span><h2 id="friend-challenge-title">Challenge {selectedFriend.username}</h2></div>
              <button type="button" className="friend-modal-close" onClick={() => setSelectedFriend(null)} aria-label="Close challenge">×</button>
            </div>
            <label className="friend-category-label" htmlFor="friend-challenge-category">Choose a category</label>
            <select id="friend-challenge-category" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} disabled={!categories.length}>
              {categories.map((category) => <option key={category._id} value={category.name}>{category.name}</option>)}
            </select>
            {!categories.length && <p className="empty-dashboard">No categories are available.</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="button" className="friend-modal-primary" disabled={saving || !categoryName} onClick={handleChallenge}>
              {saving ? 'Creating challenge...' : 'Send challenge'}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
