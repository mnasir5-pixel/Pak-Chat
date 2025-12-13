
import React, { useState, useEffect } from 'react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

type AuthMode = 'login' | 'sign-up' | 'verify' | 'forgot';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  // --- CORE STATE ---
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // --- VERIFICATION STATE ---
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaProblem, setCaptchaProblem] = useState({ q: '2 + 2', a: 4 });
  const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);
  const [showDemoCode, setShowDemoCode] = useState(false);

  // --- UI STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // --- TIMERS ---
  const [timer, setTimer] = useState(0);

  // --- EFFECTS ---
  useEffect(() => {
      const n1 = Math.floor(Math.random() * 10);
      const n2 = Math.floor(Math.random() * 10);
      setCaptchaProblem({ q: `${n1} + ${n2}`, a: n1 + n2 });
  }, [mode]);

  useEffect(() => {
    let score = 0;
    if (password.length > 5) score++;
    if (password.length > 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPasswordStrength(score);
  }, [password]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // --- HELPER FUNCTIONS ---
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const startVerification = (targetEmail: string) => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setTimer(30);
      setIsCaptchaSolved(false); 
      setShowDemoCode(false);
      setMode('verify');
      setSuccessMsg(`Verification code generated for ${targetEmail}`);
  };

  // --- AUTH HANDLERS ---
  const handleStandardAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    
    if (mode === 'sign-up') {
        if (password.length < 6) { setError("Password too short (min 6 chars)."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    }

    setIsLoading(true);

    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');

        if (mode === 'sign-up') {
            if (users[email]) {
                setError("Account exists. Please login.");
                setIsLoading(false);
            } else {
                startVerification(email);
                setIsLoading(false);
            }
        } else if (mode === 'login') {
            if (users[email] && users[email].password === password) {
                onLogin(email);
            } else {
                setError("Invalid credentials.");
            }
            setIsLoading(false);
        } else if (mode === 'forgot') {
            if (users[email]) setSuccessMsg(`Reset link sent to ${email}`);
            else setSuccessMsg(`If registered, email sent to ${email}`);
            setIsLoading(false);
        }
    }, 1000);
  };

  const verifyCode = () => {
      if (!isCaptchaSolved) { setError("Please solve the puzzle first."); return; }
      
      if (verificationCode === generatedCode) {
          const users = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');
          users[email] = { password, createdAt: Date.now(), verified: true };
          localStorage.setItem('pakchat_users_db', JSON.stringify(users));
          
          setSuccessMsg("Verified! Logging in...");
          setTimeout(() => onLogin(email), 800);
      } else {
          setError("Invalid code. Please try again.");
      }
  };

  // --- RENDER VERIFICATION ---
  if (mode === 'verify') {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300 p-8">
                
                <button onClick={() => setMode('sign-up')} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Sign Up
                </button>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify it's you</h2>
                <p className="text-sm text-gray-500 mb-6">Complete the puzzle to receive your code.</p>

                {error && <div className="mb-4 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</div>}

                {/* STEP 1: CAPTCHA */}
                <div className={`mb-6 p-4 rounded-xl border-2 transition-all ${isCaptchaSolved ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Human Check</span>
                        {isCaptchaSolved && <span className="text-green-600 font-bold">✓ Verified</span>}
                    </div>
                    
                    {!isCaptchaSolved ? (
                        <div className="flex gap-3">
                            <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center font-mono text-lg font-bold tracking-widest text-gray-700 dark:text-gray-300">
                                {captchaProblem.q} = ?
                            </div>
                            <input 
                                type="number" 
                                value={captchaAnswer}
                                onChange={(e) => {
                                    setCaptchaAnswer(e.target.value);
                                    if (parseInt(e.target.value) === captchaProblem.a) setIsCaptchaSolved(true);
                                }}
                                className="w-20 p-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="?"
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-green-700 dark:text-green-400">Puzzle solved. You may proceed.</p>
                    )}
                </div>

                {/* STEP 2: CODE INPUT */}
                <div className={`transition-all duration-300 ${!isCaptchaSolved ? 'opacity-50 pointer-events-none filter blur-[1px]' : 'opacity-100'}`}>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase">Verification Code</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-widest text-lg font-mono"
                            maxLength={6}
                        />
                        {isCaptchaSolved && (
                            <div className="absolute right-2 top-2 bottom-2">
                                <button 
                                    onClick={() => setShowDemoCode(!showDemoCode)}
                                    className="h-full px-3 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    {showDemoCode ? generatedCode : "Get Key"}
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        {showDemoCode ? "Use the key displayed above." : "Click 'Get Key' to obtain your access code."}
                    </p>
                </div>

                <button 
                    onClick={verifyCode}
                    disabled={!isCaptchaSolved || verificationCode.length !== 6}
                    className="w-full mt-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Verify & Login
                </button>
            </div>
        </div>
      );
  }

  // 3. MAIN LOGIN / SIGNUP VIEW
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        
        <div className="px-8 pt-8 pb-6">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white font-bold text-2xl">P</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{mode === 'login' ? 'Welcome Back' : 'Get Started'}</h1>
                <p className="text-gray-500 text-sm">Use your email or social account to continue.</p>
            </div>

            {error && (
                <div className="mb-5 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex gap-2 items-center border border-red-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {/* MAIN FORM */}
            <form onSubmit={handleStandardAuth} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1 ml-1">Email Address</label>
                    <input 
                        type="email" 
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="you@example.com"
                        required 
                    />
                </div>

                {mode !== 'forgot' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1 ml-1">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="••••••••"
                                required 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                {showPassword ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                            </button>
                        </div>
                        {mode === 'sign-up' && (
                            <>
                                <div className="mt-3 mb-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1 ml-1">Confirm Password</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" required />
                                </div>
                                <div className="flex gap-1 h-1 mt-2">
                                    {[1,2,3,4].map(l => <div key={l} className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= l ? (passwordStrength < 3 ? 'bg-orange-400' : 'bg-green-500') : 'bg-gray-200 dark:bg-gray-700'}`}></div>)}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                    {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                    {mode === 'login' ? 'Login' : mode === 'sign-up' ? 'Sign Up' : 'Send Link'}
                </button>
            </form>

            {/* Social Options (Visual Only) */}
            {mode !== 'forgot' && (
                <>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                        <div className="relative flex justify-center text-xs uppercase font-bold text-gray-400 tracking-wide"><span className="bg-white dark:bg-gray-800 px-3">Or continue with</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-75" disabled title="Currently disabled. Please use email.">
                            <svg className="w-5 h-5 grayscale opacity-50" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            <span className="text-sm font-semibold">Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-75" disabled title="Currently disabled. Please use email.">
                            <svg className="w-5 h-5 text-[#1877F2] grayscale opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            <span className="text-sm font-semibold">Facebook</span>
                        </button>
                    </div>
                </>
            )}

            {/* Toggle Mode */}
            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                    onClick={() => { setMode(mode === 'login' ? 'sign-up' : 'login'); setError(''); }} 
                    className="font-bold text-indigo-600 hover:underline"
                >
                    {mode === 'login' ? 'Sign Up' : 'Login'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
