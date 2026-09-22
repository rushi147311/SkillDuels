import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../services/socket';

export default function WaitingRoom() {
    const { roomId } = useParams();
    const [players, setPlayers] = useState([
        { name: 'Player 1', role: 'Room Creator', status: 'Connected' }
    ]);

    useEffect(() => {
        // Socket room join event
        socket.emit('join_room', { roomCode: roomId, username: 'Player' });

        socket.on('user_joined', (data) => {
            setPlayers((prev) => [
                ...prev,
                { name: data.username, role: 'Participant', status: 'Connected' }
            ]);
        });

        return () => {
            socket.off('user_joined');
        };
    }, [roomId]);

    return (
        <div className="duel-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
            <header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 40px' }}>
                <div className="logo" style={{ fontWeight: 'bold', fontSize: '20px', color: '#2563eb' }}>⚡ SkillDuels</div>
                <button className="live-btn" style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>LIVE COMPETITION</button>
            </header>

            <div className="waiting-main" style={{ textAlign: 'center', marginTop: '30px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px' }}>MATCHMAKING</span>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a', margin: '10px 0' }}>Waiting Room</h1>
                <p style={{ color: '#64748b', marginBottom: '30px' }}>Get ready. Your opponent is joining the duel.</p>

                <div className="waiting-card" style={{ background: '#ffffff', maxWidth: '600px', margin: '0 auto', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}>ROOM ID</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px', color: '#0f172a', background: '#f1f5f9', display: 'inline-block', padding: '8px 24px', borderRadius: '8px', marginBottom: '12px' }}>
                        {roomId || 'WVT61P'}
                    </div>
                    <div style={{ color: '#16a34a', fontSize: '14px', marginBottom: '30px', fontWeight: '500' }}>● Waiting for opponent...</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Players</span>
                        <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{players.length}/2</span>
                    </div>

                    {players.map((player, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#e2e8f0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{player.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{player.role}</div>
                                </div>
                            </div>
                            <div style={{ color: '#16a34a', fontSize: '14px', fontWeight: '500' }}>● {player.status}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}