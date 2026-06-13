import '../styles/Layout.css';

const bgStyle = {
  background: '#173B35',
  minHeight: '100vh',
};

export default function GuestLayout({ children }) {
  return (
    <div className="layout" style={bgStyle}>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
