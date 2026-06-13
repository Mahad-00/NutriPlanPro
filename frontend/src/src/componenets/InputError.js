export default function InputError({ message, className }) {
    if (!message) return null;
    return (
        <p className={className} style={{
            fontSize: '0.8rem',
            color: '#dc2626',
            fontWeight: 400,
            marginTop: '0.25rem',
        }}>
            {message}
        </p>
    );
}
