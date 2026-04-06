import React, { useState, useRef, useCallback } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onImageChange?: (newImageSrc: string) => void
  allowImageChange?: boolean
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(props.src)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { onImageChange, allowImageChange = false, src, alt, style, className, ...rest } = props

  const handleError = () => {
    setDidError(true)
  }

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setCurrentSrc(result)
        setDidError(false)
        if (onImageChange) {
          onImageChange(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }, [onImageChange])

  const handleClick = useCallback(() => {
    if (allowImageChange && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [allowImageChange])

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle relative ${className ?? ''}`}
      style={style}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[100px] p-4">
        {/* iFONG Default Placeholder */}
        <div 
          className="text-2xl font-black italic tracking-wider"
          style={{
            fontFamily: "Inter, sans-serif",
            color: "rgba(223,255,0,0.6)",
            textShadow: "0 0 20px rgba(223,255,0,0.3)",
            marginBottom: "8px"
          }}
        >
          iFONG
        </div>
        <p className="text-xs text-gray-500 mb-2">Default Placeholder</p>
        {allowImageChange && (
          <button
            type="button"
            className="px-3 py-1 text-xs rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors cursor-pointer"
            style={{
              fontFamily: "Inter, sans-serif",
              fontStyle: "italic"
            }}
          >
            Change Image
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
    </div>
  ) : (
    <div className="relative inline-block" onClick={handleClick}>
      <img 
        src={currentSrc || src} 
        alt={alt} 
        className={className} 
        style={style} 
        {...rest} 
        onError={handleError} 
      />
      {allowImageChange && (
        <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="px-2 py-1 text-xs rounded bg-black/70 text-white backdrop-blur-sm hover:bg-black/90 transition-colors cursor-pointer"
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontStyle: "italic"
            }}
          >
            📷 Change
          </button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
    </div>
  )
}
