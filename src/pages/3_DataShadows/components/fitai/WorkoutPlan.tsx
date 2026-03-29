import React from 'react'

const workouts = [
  { id: 1, name: 'Full Body Burn', duration: 45, difficulty: 'Hard', calories: 380, image: '💪' },
  { id: 2, name: 'Cardio Blast', duration: 30, difficulty: 'Medium', calories: 250, image: '🏃' },
  { id: 3, name: 'Yoga Flow', duration: 50, difficulty: 'Easy', calories: 120, image: '🧘' },
  { id: 4, name: 'HIIT Training', duration: 20, difficulty: 'Very Hard', calories: 320, image: '⚡' },
]

const WorkoutPlan: React.FC = () => {

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Weekly Schedule */}
      <div style={{ padding: 16, background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>This Week's Plan</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                background: day === 'Mon' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Workout */}
      <div className="card" style={{ margin: '16px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2942', marginBottom: 12 }}>Today's Recommendation</div>
        <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💪</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a2942', marginBottom: 4 }}>Full Body Burn</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>45 min • Hard • 380 kcal</div>
          <button className="btn btn-primary">▶ Start Workout</button>
        </div>
      </div>

      {/* Available Workouts */}
      <div style={{ padding: '16px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2942', marginBottom: 12 }}>Available Workouts</div>
        {workouts.map((workout) => (
          <div key={workout.id} className="card" style={{ margin: '0 0 12px 0' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ fontSize: 32 }}>{workout.image}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2942', marginBottom: 4 }}>
                  {workout.name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  ⏱️ {workout.duration} min • {workout.difficulty} • 🔥 {workout.calories} kcal
                </div>
              </div>
              <button className="icon-btn" style={{ alignSelf: 'center' }}>→</button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Coaching */}
      <div className="card" style={{ margin: '0 12px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2942', marginBottom: 12 }}>🤖 AI Coach Says</div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
          "You've been consistent this week! Your endurance has improved by 15%. Let's push harder with HIIT training today to maximize calorie burn and build muscle."
        </div>
        <div style={{ marginTop: 12, padding: 12, background: '#fff3cd', borderRadius: 8, border: '1px solid #ffc107' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#856404' }}>
            📊 Your data is being analyzed by advanced machine learning models to provide these recommendations.
          </div>
        </div>
      </div>

      {/* Past Workouts */}
      <div style={{ padding: '0 12px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2942', marginBottom: 12 }}>Recent Activity</div>
        {[
          { date: 'Today', workout: 'Cardio Blast', time: '30 min', cal: 250 },
          { date: 'Yesterday', workout: 'Full Body Burn', time: '45 min', cal: 380 },
          { date: '2 days ago', workout: 'Yoga Flow', time: '50 min', cal: 120 },
        ].map((activity, i) => (
          <div key={i} className="card" style={{ margin: '0 0 8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2942' }}>
                  {activity.workout}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {activity.date} • {activity.time}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                {activity.cal} kcal
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WorkoutPlan
