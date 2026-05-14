import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#0f172a',
          borderRadius: 112,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Emerald badge */}
        <div
          style={{
            width: 304,
            height: 304,
            background: '#10b981',
            borderRadius: 76,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Monogram */}
          <div
            style={{
              color: 'white',
              fontSize: 156,
              fontWeight: 800,
              fontFamily: 'sans-serif',
              letterSpacing: -6,
              display: 'flex',
              lineHeight: 1,
            }}
          >
            HF
          </div>
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  )
}
