import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Contact.css'; // Reusing some base styles

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: signInError } = await signIn({ email, password });
            if (signInError) throw signInError;
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-container page-container" style={{ maxWidth: '450px', marginTop: '100px' }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem' }}>
                <h1 className="text-neon-cyan" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Login</h1>
                <p style={{ color: '#888', textAlign: 'center', marginBottom: '2rem' }}>Welcome back to Glossa</p>

                {error && <div className="error-message" style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(255, 77, 77, 0.2)' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="premium-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="glass-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            className="glass-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
                    Don't have an account? <Link to="/join-us" style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Register</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
