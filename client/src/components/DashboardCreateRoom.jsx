import { useState } from 'react';

const categories = ['Technology', 'General Knowledge'];

export default function DashboardCreateRoom({ onCreateRoom, loading, error }) {
  const [categoryName, setCategoryName] = useState(categories[0]);
  const [roomType, setRoomType] = useState('public');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreateRoom({ categoryName, roomType });
  };

  return (
    <section className="dashboard-panel create-room-panel">
      <div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">Ready to play?</span><h2>Create a room</h2></div><span className="room-icon">⚡</span></div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="dashboard-category">Category</label>
        <select id="dashboard-category" value={categoryName} onChange={(event) => setCategoryName(event.target.value)}>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <fieldset>
          <legend>Room visibility</legend>
          <div className="room-type-options">
            <label><input type="radio" name="room-type" value="public" checked={roomType === 'public'} onChange={(event) => setRoomType(event.target.value)} /> Public</label>
            <label><input type="radio" name="room-type" value="private" checked={roomType === 'private'} onChange={(event) => setRoomType(event.target.value)} /> Private</label>
          </div>
        </fieldset>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" disabled={loading}>{loading ? 'Creating...' : 'Create Room'} <span>→</span></button>
      </form>
    </section>
  );
}