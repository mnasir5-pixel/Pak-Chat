
import React, { useState, useEffect } from 'react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

type AuthMode = 'login' | 'sign-up' | 'verify' | 'forgot' | 'reset-password';

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
  const [verificationContext, setVerificationContext] = useState<'signup' | 'reset'>('signup');

  // --- UI STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  const startVerification = (targetEmail: string, context: 'signup' | 'reset') => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setTimer(30);
      setIsCaptchaSolved(false); 
      setShowDemoCode(false);
      setVerificationContext(context);
      setMode('verify');
      setSuccessMsg(`Verification code sent to ${targetEmail}`);
      setVerificationCode('');
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
                setError("Account already exists on this device. Please login.");
                setIsLoading(false);
            } else {
                startVerification(email, 'signup');
                setIsLoading(false);
            }
        } else if (mode === 'login') {
            if (users[email] && users[email].password === password) {
                onLogin(email);
            } else {
                setError("Invalid email or password.");
            }
            setIsLoading(false);
        } else if (mode === 'forgot') {
            if (users[email]) {
                startVerification(email, 'reset');
            } else {
                setError("No account found with this email.");
            }
            setIsLoading(false);
        }
    }, 800);
  };

  const verifyCode = () => {
      if (!isCaptchaSolved) { setError("Please solve the puzzle first."); return; }
      
      if (verificationCode === generatedCode) {
          if (verificationContext === 'signup') {
              const users = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');
              users[email] = { password, createdAt: Date.now(), verified: true };
              localStorage.setItem('pakchat_users_db', JSON.stringify(users));
              
              setSuccessMsg("Verified! Logging in...");
              setTimeout(() => onLogin(email), 800);
          } else {
              // Reset Password Context
              setSuccessMsg("Verified. Please set a new password.");
              setMode('reset-password');
              setPassword('');
              setConfirmPassword('');
          }
      } else {
          setError("Invalid code. Please try again.");
      }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      if (password.length < 6) { setError("Password too short."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }

      const users = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');
      if (users[email]) {
          users[email].password = password;
          localStorage.setItem('pakchat_users_db', JSON.stringify(users));
          setSuccessMsg("Password updated! Please login.");
          setTimeout(() => {
              setMode('login');
              setPassword('');
              setConfirmPassword('');
              setSuccessMsg('');
          }, 1500);
      } else {
          setError("Error updating account.");
      }
  };

  // --- RENDER VERIFICATION ---
  if (mode === 'verify') {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300 p-8">
                
                <button onClick={() => setMode(verificationContext === 'signup' ? 'sign-up' : 'forgot')} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify it's you</h2>
                <p className="text-sm text-gray-500 mb-6">Complete the puzzle to view your verification code.</p>

                {error && <div className="mb-4 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</div>}
                {successMsg && <div className="mb-4 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">{successMsg}</div>}

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
                    {verificationContext === 'signup' ? 'Complete Sign Up' : 'Verify & Reset'}
                </button>
            </div>
        </div>
      );
  }

  // --- RENDER RESET PASSWORD ---
  if (mode === 'reset-password') {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300 p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
                <p className="text-sm text-gray-500 mb-6">Create a new secure password for {email}</p>

                {error && <div className="mb-4 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</div>}

                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1 ml-1">New Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
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
                        <div className="flex gap-1 h-1 mt-2">
                            {[1,2,3,4].map(l => <div key={l} className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= l ? (passwordStrength < 3 ? 'bg-orange-400' : 'bg-green-500') : 'bg-gray-200 dark:bg-gray-700'}`}></div>)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1 ml-1">Confirm Password</label>
                        <div className="relative">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="••••••••"
                                required 
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                {showConfirmPassword ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg mt-4">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // 3. MAIN LOGIN / SIGNUP / FORGOT VIEW
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        
        <div className="px-8 pt-8 pb-6">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white font-bold text-2xl">P</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {mode === 'login' ? 'Welcome Back' : mode === 'forgot' ? 'Reset Password' : 'Get Started'}
                </h1>
                <p className="text-gray-500 text-sm">
                    {mode === 'forgot' ? "Enter your email to receive a recovery code." : "Use your email or social account to continue."}
                </p>
            </div>

            {error && (
                <div className="mb-5 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex gap-2 items-center border border-red-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="mb-5 p-3 bg-green-50 text-green-600 text-xs rounded-lg flex gap-2 items-center border border-green-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {successMsg}
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
                        <div className="flex justify-between items-center mb-1 ml-1">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Password</label>
                            {mode === 'login' && (
                                <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs text-indigo-600 hover:text-indigo-800">
                                    Forgot Password?
                                </button>
                            )}
                        </div>
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
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)} 
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                            placeholder="••••••••" 
                                            required 
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                            {showConfirmPassword ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                                        </button>
                                    </div>
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
                    {mode === 'login' ? 'Login' : mode === 'sign-up' ? 'Sign Up' : 'Send Code'}
                </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                {mode === 'login' 
                    ? "Don't have an account? " 
                    : mode === 'forgot'
                        ? "Remember your password? "
                        : "Already have an account? "}
                <button 
                    onClick={() => { 
                        if(mode === 'forgot') setMode('login');
                        else setMode(mode === 'login' ? 'sign-up' : 'login'); 
                        setError(''); 
                    }} 
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
