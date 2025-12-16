
import React, { useState, useEffect, useRef } from 'react';

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
  const [name, setName] = useState('');
  
  // --- VERIFICATION STATE ---
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [verificationContext, setVerificationContext] = useState<'signup' | 'reset'>('signup');

  // --- UI STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // --- PASSWORD STRENGTH ---
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  // --- REFS ---
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- EFFECTS ---
  useEffect(() => {
    evaluatePasswordStrength(password);
  }, [password]);

  // --- HELPERS ---
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const evaluatePasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) { setPasswordScore(0); setPasswordFeedback(''); return; }

    if (pass.length > 7) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    setPasswordScore(score);

    if (score < 3) setPasswordFeedback('Weak: Use numbers & symbols');
    else if (score < 5) setPasswordFeedback('Good');
    else setPasswordFeedback('Strong');
  };

  const startVerification = (targetEmail: string, context: 'signup' | 'reset') => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Simulated SMS/Email Code:", code); // For developer ease
      setGeneratedCode(code);
      setVerificationContext(context);
      setMode('verify');
      setSuccessMsg(`We sent a 6-digit code to ${targetEmail}`);
      setVerificationCode(['', '', '', '', '', '']);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multi-char
    const newOtp = [...verificationCode];
    newOtp[index] = value;
    setVerificationCode(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // --- AUTH HANDLERS ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    
    setIsLoading(true);

    // Simulate Network Request
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');

        if (mode === 'sign-up') {
            if (passwordScore < 3) {
                setError("Password is too weak. Please strengthen it.");
                setIsLoading(false);
                return;
            }
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setIsLoading(false);
                return;
            }
            if (users[email]) {
                setError("Account already exists. Please login.");
            } else {
                startVerification(email, 'signup');
            }
        } else if (mode === 'login') {
            if (users[email] && users[email].password === password) {
                onLogin(email);
            } else {
                setError("Invalid email or password.");
            }
        } else if (mode === 'forgot') {
            if (users[email]) {
                startVerification(email, 'reset');
            } else {
                setError("No account found with this email.");
            }
        }
        setIsLoading(false);
    }, 1200);
  };

  const verifyCode = () => {
      const enteredCode = verificationCode.join('');
      if (enteredCode === generatedCode || enteredCode === '123456') { // Backdoor for testing if needed
          if (verificationContext === 'signup') {
              const users = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');
              users[email] = { password, name, createdAt: Date.now(), verified: true };
              localStorage.setItem('pakchat_users_db', JSON.stringify(users));
              localStorage.setItem('pakchat_user_name', name); // Auto-set profile name
              
              setSuccessMsg("Account verified! Logging in...");
              setTimeout(() => onLogin(email), 800);
          } else {
              setSuccessMsg("Verified. Set your new password.");
              setMode('reset-password');
              setPassword('');
              setConfirmPassword('');
          }
      } else {
          setError("Invalid verification code.");
      }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordScore < 3) { setError("Password is too weak."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }

      const users = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');
      if (users[email]) {
          users[email].password = password;
          localStorage.setItem('pakchat_users_db', JSON.stringify(users));
          setSuccessMsg("Password updated! Redirecting to login...");
          setTimeout(() => {
              setMode('login');
              setPassword('');
              setConfirmPassword('');
              setSuccessMsg('');
          }, 1500);
      }
  };

  // --- RENDER COMPONENTS ---

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc] dark:bg-[#0f172a] font-sans transition-colors duration-300">
      
      {/* LEFT SIDE: BRANDING (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         
         <div className="relative z-10 text-white p-12 max-w-lg">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/30 shadow-2xl">
                <span className="text-3xl font-bold">P</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">Connect intelligently with Pak Chat.</h1>
            <p className="text-indigo-100 text-lg leading-relaxed">
               Experience the next generation of AI communication. Secure, fast, and designed for you.
            </p>
            
            <div className="mt-12 flex gap-4">
                <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-gray-300" style={{ backgroundImage: `url(https://i.pravatar.cc/150?img=${i + 10})`, backgroundSize: 'cover' }}></div>
                    ))}
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-sm font-bold">10k+ Users</span>
                    <span className="text-xs text-indigo-200">Joined this week</span>
                </div>
            </div>
         </div>
      </div>

      {/* RIGHT SIDE: FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12">
        <div className="w-full max-w-md space-y-8">
            
            {/* Header Mobile */}
            <div className="lg:hidden text-center mb-8">
               <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">P</div>
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pak Chat</h2>
            </div>

            {/* Title Section */}
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {mode === 'login' ? 'Welcome back' : mode === 'sign-up' ? 'Create an account' : mode === 'verify' ? 'Verify Code' : 'Reset Password'}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {mode === 'login' ? 'Please enter your details to sign in.' : mode === 'sign-up' ? 'Enter your details to get started.' : mode === 'verify' ? `Enter the code we sent to ${email}` : 'Choose a strong password.'}
                </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-600 dark:text-green-400 text-sm animate-in slide-in-from-top-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                    {successMsg}
                </div>
            )}

            {/* 1. VERIFICATION VIEW */}
            {mode === 'verify' ? (
                <div className="space-y-6">
                    <div className="flex gap-2 justify-center">
                        {verificationCode.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={el => { if (el) otpRefs.current[idx] = el; }}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        ))}
                    </div>
                    
                    {/* Simulated Code Display for UX testing */}
                    <div className="text-center">
                        <p className="text-xs text-gray-400 mb-2">Development Mode: Your code is</p>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono rounded tracking-widest">{generatedCode}</span>
                    </div>

                    <button onClick={verifyCode} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95">
                        Verify Account
                    </button>
                    <button onClick={() => setMode('login')} className="w-full text-center text-sm text-gray-500 hover:text-indigo-600">Cancel</button>
                </div>
            ) : (
                /* 2. LOGIN / SIGNUP / RESET FORM */
                <form onSubmit={mode === 'reset-password' ? handlePasswordReset : handleAuth} className="space-y-5">
                    
                    {mode === 'sign-up' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Ali Khan"
                                required
                            />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'sign-up' || mode === 'forgot') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    )}

                    {(mode === 'login' || mode === 'sign-up' || mode === 'reset-password') && (
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                {mode === 'login' && (
                                    <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${error && mode !== 'login' ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all`}
                                    placeholder="••••••••"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                                </button>
                            </div>
                            
                            {/* Password Strength Meter */}
                            {(mode === 'sign-up' || mode === 'reset-password') && (
                                <div className="mt-3">
                                    <div className="flex gap-1 h-1.5 mb-2">
                                        {[1,2,3,4,5].map(step => (
                                            <div key={step} className={`flex-1 rounded-full transition-all duration-500 ${passwordScore >= step ? (passwordScore < 3 ? 'bg-red-500' : passwordScore < 5 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                        ))}
                                    </div>
                                    <p className={`text-xs text-right ${passwordScore < 3 ? 'text-red-500' : passwordScore < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {passwordFeedback}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {(mode === 'sign-up' || mode === 'reset-password') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                                    {showConfirmPassword ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            mode === 'login' ? 'Sign in' : mode === 'sign-up' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Code' : 'Set New Password'
                        )}
                    </button>

                    {/* Toggle Links */}
                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        {mode === 'login' ? (
                            <>Don't have an account? <button type="button" onClick={() => { setMode('sign-up'); setError(''); }} className="font-bold text-indigo-600 hover:text-indigo-500">Sign up</button></>
                        ) : mode === 'forgot' ? (
                            <><button type="button" onClick={() => { setMode('login'); setError(''); }} className="font-bold text-indigo-600 hover:text-indigo-500">Back to Login</button></>
                        ) : (
                            <>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(''); }} className="font-bold text-indigo-600 hover:text-indigo-500">Login</button></>
                        )}
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

