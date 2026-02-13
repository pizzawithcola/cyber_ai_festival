import React, { useState } from 'react'
import { useFitAI } from './fitaiContext'

const ProfilePage: React.FC = () => {
  const { userData } = useFitAI()
  const [stats] = useState({
    totalWorkouts: 142,
    totalCalories: 24500,
    streakDays: 23,
    personalRecords: 8,
  })

  const badges = [
    { icon: '🔥', name: 'Starter' },
    { icon: '⚡', name: '7-Day Streak' },
    { icon: '💯', name: '100 Workouts' },
    { icon: '🎯', name: 'Goal Setter' },
  ]

  const leaderboard = [
    { rank: 1, name: 'Alex Chen', score: 2840 },
    { rank: 2, name: 'Jordan Lee', score: 2720 },
    { rank: 3, name: 'Sarah Johnson', score: 2580 },
    { rank: 4, name: 'User', score: 1850, isUser: true },
    { rank: 5, name: 'Emma Davis', score: 1620 },
  ]

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <div className="profile-name">{userData.name || 'User'}</div>
        <div className="profile-meta">
          Level {Math.floor(Math.random() * 10) + 5} • {stats.totalWorkouts} Workouts
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ padding: '16px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div className="stat-box">
            <div className="stat-number">{stats.totalWorkouts}</div>
            <div className="stat-label">Total Workouts</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{stats.streakDays}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{Math.floor(stats.totalCalories / 1000)}k</div>
            <div className="stat-label">Calories Burned</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{stats.personalRecords}</div>
            <div className="stat-label">PRs Achieved</div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="badges-section">
        <div className="badges-title">Achievements Unlocked</div>
        <div className="badges-list">
          {badges.map((badge, i) => (
            <div key={i} className="badge-item">
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-name">{badge.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div style={{ padding: '16px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2942', marginBottom: 12 }}>Global Leaderboard</div>
        {leaderboard.map((item) => (
          <div key={item.rank} className="leaderboard-item" style={item.isUser ? { background: 'rgba(16, 185, 129, 0.05)' } : {}}>
            <div className={`rank ${item.rank <= 3 ? 'top' : ''}`}>{item.rank}</div>
            <div className="leaderboard-info">
              <div className="leaderboard-name">{item.name}</div>
              <div className="leaderboard-stat">{item.score} points</div>
            </div>
            <div className="leaderboard-score">
              {item.isUser ? '📍 You' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Profile Button */}
      <div style={{ padding: '0 12px 20px' }}>
        <button className="btn btn-secondary" style={{ width: '100%' }}>
          ✏️ Edit Profile
        </button>
      </div>

      {/* Social Stats */}
      <div className="card" style={{ margin: '0 12px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2942', marginBottom: 12 }}>
          Friends & Community
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>128</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Friends</div>
          </div>
          <div style={{ borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>4.2k</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Followers</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>23</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Challenges</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
