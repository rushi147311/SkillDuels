import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin`;

function AdminPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Category Form State
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // Question Form State
  const [selectedCatId, setSelectedCatId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCatId && activeTab === 'questions') {
      fetchQuestions(selectedCatId);
    }
  }, [selectedCatId, activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/categories`);
      const data = res.data.data || [];
      setCategories(data);
      if (data.length > 0 && !selectedCatId) {
        setSelectedCatId(data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchQuestions = async (catId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/questions/category/${catId}`);
      setQuestions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return alert('Category name is required');
    try {
      await axios.post(`${API_BASE_URL}/categories`, { name: categoryName, description: categoryDesc });
      setCategoryName('');
      setCategoryDesc('');
      fetchCategories();
      alert('Category created successfully!');
    } catch (err) {
      alert('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const handleSelectCategoryToManage = (catId) => {
    setSelectedCatId(catId);
    setActiveTab('questions');
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedCatId) return alert('Please select a category');
    if (!questionText.trim()) return alert('Question statement is required');
    if (options.some(opt => opt.trim() === '')) return alert('Fill all 4 options');

    try {
      await axios.post(`${API_BASE_URL}/questions`, {
        categoryId: selectedCatId,
        questionText,
        options,
        correctAnswer: Number(correctAnswer),
        difficulty
      });
      setQuestionText('');
      setOptions(['', '', '', '']);
      fetchQuestions(selectedCatId);
      alert('Question saved successfully!');
    } catch (err) {
      alert('Failed to save question');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/questions/${id}`);
      fetchQuestions(selectedCatId);
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  const handleOptionChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredQuestions = questions.filter(q => 
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`admin-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <aside className="sidebar">
        <div className="brand-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f97316', fontSize: '1.8rem', animation: 'pulse 2s infinite' }}>⚡</span>
            <span>SkillDuels</span>
          </div>
          <span className="brand-badge">ADMIN</span>
        </div>

        <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        <nav className="nav-menu">
          <button 
            className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            📂 Categories ({categories.length})
          </button>
          <button 
            className={`nav-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            🧩 Questions ({questions.length})
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button 
            className="nav-btn logout-btn" 
            onClick={() => {
              if(window.confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('skillDuelsToken');
                localStorage.removeItem('skillDuelsPlayerId');
                window.location.href = '/login';
              }
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Categories</h4>
            <div className="value">{categories.length}</div>
          </div>
          <div className="stat-card">
            <h4>Questions (Current Category)</h4>
            <div className="value">{questions.length}</div>
          </div>
        </div>

        {activeTab === 'categories' ? (
          <div className="section-card">
            <div className="top-bar">
              <h1>Category Engine</h1>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <form onSubmit={handleAddCategory} className="form-container">
              <div className="form-group">
                <label>Category Name</label>
                <input 
                  className="form-control"
                  type="text" 
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. JavaScript, DBMS, React"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-control"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="Short description..."
                  rows="2"
                />
              </div>
              <button type="submit" className="btn-submit">Add Category</button>
            </form>

            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat, idx) => (
                    <tr key={cat._id}>
                      <td>{idx + 1}</td>
                      <td><strong>{cat.name}</strong></td>
                      <td style={{ color: 'var(--text-sub)' }}>{cat.description || 'N/A'}</td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn-action btn-view" 
                            onClick={() => handleSelectCategoryToManage(cat._id)}
                          >
                            Manage Questions
                          </button>
                          <button 
                            className="btn-action btn-delete" 
                            onClick={() => handleDeleteCategory(cat._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-sub)' }}>
                        No categories found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="section-card">
            <div className="top-bar">
              <h1>Question Bank</h1>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Select Category</label>
              <select 
                className="form-control"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleAddQuestion} className="form-container">
              <div className="form-group">
                <label>Question Statement</label>
                <input 
                  className="form-control"
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter full question..."
                  required
                />
              </div>

              <div className="options-grid">
                {options.map((opt, idx) => (
                  <div key={idx} className="form-group">
                    <label>Option {idx + 1}</label>
                    <input 
                      className="form-control"
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Correct Choice</label>
                  <select 
                    className="form-control" 
                    value={correctAnswer} 
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                  >
                    {options.map((_, idx) => (
                      <option key={idx} value={idx}>Option {idx + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select 
                    className="form-control" 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-submit">Save Question</button>
            </form>

            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Options</th>
                    <th>Correct Choice</th>
                    <th>Difficulty</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q, idx) => (
                    <tr key={q._id}>
                      <td>{idx + 1}</td>
                      <td>{q.questionText}</td>
                      <td style={{ color: 'var(--text-sub)' }}>{q.options?.join(', ')}</td>
                      <td>Option {Number(q.correctAnswer) + 1}</td>
                      <td><span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span></td>
                      <td>
                        <button 
                          className="btn-action btn-delete" 
                          onClick={() => handleDeleteQuestion(q._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredQuestions.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-sub)' }}>
                        No questions in this category
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPage;