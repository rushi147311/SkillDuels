import { useEffect, useState } from 'react';
import { getCategories } from '../services/api';

export default function DashboardCreateRoom({ onCreateRoom, loading, error }) {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [roomType, setRoomType] = useState('public');

  useEffect(() => {
    let active = true;

    getCategories()
      .then((response) => {
        if (!active) return;
        setCategories(response.data);
        setCategoryName(response.data[0]?.name || '');
      })
      .catch((requestError) => {
        if (active) setCategoryError(requestError.message);
      })
      .finally(() => {
        if (active) setCategoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreateRoom({ categoryName, roomType });
  };

  return (
    <section className="dashboard-panel create-room-panel">
      <div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">Ready to play?</span><h2>Create a room</h2></div><span className="room-icon">⚡</span></div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="dashboard-category">Category</label>
        <select
          id="dashboard-category"
          value={categoryName}
          onChange={(event) => setCategoryName(event.target.value)}
          disabled={categoryLoading || categories.length === 0}
        >
          {categoryLoading && <option value="">Loading categories...</option>}
          {!categoryLoading && categories.length === 0 && <option value="">No categories available</option>}
          {categories.map((category) => <option key={category._id} value={category.name}>{category.name}</option>)}
        </select>
        {categoryError && <p className="form-error">Could not load categories: {categoryError}</p>}
        <fieldset>
          <legend>Room visibility</legend>
          <div className="room-type-options">
            <label><input type="radio" name="room-type" value="public" checked={roomType === 'public'} onChange={(event) => setRoomType(event.target.value)} /> Public</label>
            <label><input type="radio" name="room-type" value="private" checked={roomType === 'private'} onChange={(event) => setRoomType(event.target.value)} /> Private</label>
          </div>
        </fieldset>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" disabled={loading || categoryLoading || !categoryName}>{loading ? 'Creating...' : 'Create Room'} <span>→</span></button>
      </form>
    </section>
  );
}