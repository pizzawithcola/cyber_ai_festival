import React, { useState, useEffect } from 'react'

const reviews = [
  {
    name: 'Sarah M.',
    weight: '85kg → 73kg',
    time: '28 days',
    rating: 5,
    text: 'Really effective! The AI-recommended diet plan was perfectly tailored to my preferences',
    avatar: '👩‍🦰'
  },
  {
    name: 'James W.',
    weight: '92kg → 82kg',
    time: '35 days',
    rating: 5,
    text: 'No restrictive dieting, and I still eat what I love. The workout plan is scientific and practical',
    avatar: '👨‍💼'
  },
  {
    name: 'Emma Z.',
    weight: '78kg → 68kg',
    time: '42 days',
    rating: 5,
    text: 'I love the daily encouragement messages. They really kept me motivated',
    avatar: '👩‍🦱'
  },
  {
    name: 'Michael C.',
    weight: '88kg → 76kg',
    time: '40 days',
    rating: 5,
    text: 'The community support is amazing. So many people cheering each other on',
    avatar: '👨‍💻'
  },
]

const SocialProof: React.FC = () => {
  const [currentReview, setCurrentReview] = useState(0)
  const [usersCount] = useState('1,234,567')
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const review = reviews[currentReview]

  return (
    <div style={{ padding: '24px 16px', background: '#f9fafb' }}>
      {/* Users Count */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#10b981',
          marginBottom: '4px'
        }}>
          {usersCount}+
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Users Successfully Lost Weight
        </div>
      </div>

      {/* Review Carousel */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb'
      }}>
        {/* User Info */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff8c42, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px'
          }}>
            {review.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a2942' }}>
              {review.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {review.weight} • {review.time}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: '12px', fontSize: '14px' }}>
          {'⭐'.repeat(review.rating)}
        </div>

        {/* Review Text */}
        <div style={{
          fontSize: '13px',
          color: '#374151',
          lineHeight: '1.6',
          marginBottom: '8px'
        }}>
          "{review.text}"
        </div>

        {/* Privacy Warning (small) */}
        <div
          onClick={() => setShowPrivacyWarning(!showPrivacyWarning)}
          style={{
            fontSize: '10px',
            color: '#9ca3af',
            cursor: 'pointer',
            textDecoration: 'underline',
            opacity: 0.7
          }}
        >
          {showPrivacyWarning ? 'Hide' : 'View'} Data Usage Policy
        </div>

        {showPrivacyWarning && (
          <div style={{
            marginTop: '8px',
            padding: '8px',
            background: '#fef3c7',
            borderRadius: '6px',
            fontSize: '10px',
            color: '#92400e',
            lineHeight: '1.5'
          }}>
            📊 User data anonymized for example purposes. We use such data for AI model training and optimization.
          </div>
        )}
      </div>

      {/* Carousel Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '6px',
        marginBottom: '20px'
      }}>
        {reviews.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentReview(i)}
            style={{
              width: i === currentReview ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === currentReview ? '#3b82f6' : '#e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          />
        ))}
      </div>

      {/* App Store Rating */}
      <div style={{
        textAlign: 'center',
        padding: '12px',
        background: 'linear-gradient(135deg, rgba(255,140,66,0.05), rgba(59,130,246,0.05))',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a2942', marginBottom: '6px' }}>
          App Store Rating
        </div>
        <div style={{ fontSize: '18px', marginBottom: '4px' }}>
          ⭐⭐⭐⭐☆ <span style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>4.8</span>
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          From 128,456 reviews
        </div>
      </div>
    </div>
  )
}

export default SocialProof
