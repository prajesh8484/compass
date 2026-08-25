import logoImg from '../../assets/logo.png';

interface AppLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AppLogo({ size = 24, className = '', style = {} }: AppLogoProps) {
  return (
    <img
      src={logoImg}
      alt="Compass Logo"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size > 32 ? '22%' : '6px',
        objectFit: 'contain',
        userSelect: 'none',
        pointerEvents: 'none',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
