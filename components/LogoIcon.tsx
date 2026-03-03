import React from 'react';

interface LogoIconProps {
  className?: string;
}

/**
 * Wisefunnel Central Logo Component
 * Using the new shape logo provided by the user.
 */
const LogoIcon: React.FC<LogoIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <img 
      src="https://iwvlmpgeodctctmaacja.supabase.co/storage/v1/object/sign/Logos/logo_wisefunnel_shape.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81YWQxY2Y0Zi0wZTkzLTRhMWUtOTM0NC1hYWJlZjM2ZjEzMWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMb2dvcy9sb2dvX3dpc2VmdW5uZWxfc2hhcGUucG5nIiwiaWF0IjoxNzY5MTc5MjcxLCJleHAiOjE5MjY4NTkyNzF9.TpVVTbV6gQbWPG0NfUajQOj6YX8UM0rCoh9t3BRXZxA"
      alt="Wisefunnel Logo"
      className={`${className} object-contain`}
      loading="eager"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

export default LogoIcon;