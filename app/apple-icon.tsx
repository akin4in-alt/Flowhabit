import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Emerald badge */}
        <div
          style={{
            width: 108,
            height: 108,
            background: '#10b981',
            borderRadius: 27,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 52,
              fontWeight: 800,
              fontFamily: 'sans-serif',
              letterSpacing: -2,
              display: 'flex',
              lineHeight: 1,
            }}
          >
            HF
          </div>
        </div>
      </div>
    ),
    { width: 180, height: 180 },
  )
}
