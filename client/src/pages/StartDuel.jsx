import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';

export default function StartDuel() {
    const [roomInput, setRoomInput] = useState('');
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        socket.emit('create_room', { roomCode: generatedRoomId });
        navigate(`/waiting/${generatedRoomId}`);
    };

    const handleJoinRoom = () => {
        if (!roomInput.trim()) return;
        navigate(`/waiting/${roomInput.trim().toUpperCase()}`);
    };

    return (
        <div className="duel-container" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <div className="logo" style={{ fontWeight: 'bold', fontSize: '20px', color: '#2563eb' }}>⚡ SkillDuels</div>
                <button className="live-btn" style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>LIVE COMPETITION</button>
            </header>

            <div className="duel-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '60px 80px', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="left-hero" style={{ maxWidth: '500px' }}>
                    <span className="badge" style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold', letterSpacing: '1px' }}>REAL-TIME QUIZ BATTLE</span>
                    <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#0f172a', margin: '15px 0', lineHeight: '1.2' }}>Challenge.<br />Compete. Win.</h1>
                    <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.5' }}>Create a private room or join your opponent and prove your skills in a live match.</p>
                </div>

                <div className="right-card" style={{ background: '#ffffff', width: '400px', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.05)', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div className="gamepad-icon" style={{ fontSize: '28px', marginBottom: '15px' }}>🎮</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Start a Duel</h2>
                    <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '25px' }}>Create a room and invite your opponent.</p>
                    
                    <button className="create-room-btn" onClick={handleCreateRoom} style={{ width: '100%', background: '#2563eb', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginBottom: '20px' }}>
                        Create Room →
                    </button>

                    <div className="divider" style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', margin: '15px 0', position: 'relative' }}>OR</div>

                    <input 
                        type="text" 
                        placeholder="Enter Room ID" 
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value)}
                        className="room-input"
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                    />

                    <button className="join-room-btn" onClick={handleJoinRoom} style={{ width: '100%', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
}