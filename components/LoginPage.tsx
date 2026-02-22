import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronLeft, Fingerprint, Sparkles, BellRing, Copy, X as CloseIcon, ClipboardPaste } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'sign-up' | 'verify';

// List of common disposable/dummy email domains to block
const BLACKLISTED_DOMAINS = [
  'ali.com', 'test.com', 'example.com', 'mailinator.com', 'yopmail.com', 
  'temp-mail.org', 'tempmail.com', 'guerrillamail.com', 'sharklasers.com', 
  'dispostable.com', '10minutemail.com', 'trashmail.com', 'getnada.com', 
  'maildrop.cc', 'teleworm.us', 'dayrep.com', 'rhyta.com', 'dummy.com', 
  'placeholder.com', 'anonbox.net', 'fakeinbox.com', 'tempmail.net'
];

const DUMMY_PREFIXES = ['abc', 'test', 'user', 'admin', '123', 'guest', 'none', 'null'];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verification States
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [sentCode, setSentCode] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Simulation State
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  // Password Strength State
  const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: 'bg-gray-200' });

  const evaluatePassword = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 1) setStrength({ score: 1, label: 'Unsafe', color: 'bg-red-500' });
    else if (score === 2) setStrength({ score: 2, label: 'Fair', color: 'bg-yellow-500' });
    else if (score === 3) setStrength({ score: 3, label: 'Strong', color: 'bg-emerald-500' });
    else setStrength({ score: 4, label: 'Military Grade', color: 'bg-blue-500' });
  };

  useEffect(() => {
    if (mode === 'sign-up') evaluatePassword(password);
  }, [password, mode]);

  const triggerSimulatedEmail = (code: string) => {
    setTimeout(() => {
        setNotificationMsg(`📧 Verification Code: ${code}`);
        setShowNotification(true);
    }, 2500);
  };

  /**
   * Enhanced Email Validation
   * Rejects disposable, dummy, and malformed addresses
   */
  const validateRealEmail = (emailStr: string): { isValid: boolean; message?: string } => {
    const trimmedEmail = emailStr.trim().toLowerCase();
    
    // 1. Basic Structure Check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { isValid: false, message: "Please provide a structurally valid email address (e.g., user@domain.com)." };
    }

    const [localPart, domainPart] = trimmedEmail.split('@');

    // 2. Dummy Prefix Check (e.g., abc@...)
    if (DUMMY_PREFIXES.includes(localPart) || localPart.length < 3) {
      return { isValid: false, message: "Security Notice: Generic or 'dummy' email prefixes are not permitted. Please use a legitimate identifier." };
    }

    // 3. Blacklisted Domain Check (Disposable/Dummy domains)
    if (BLACKLISTED_DOMAINS.includes(domainPart)) {
      return { isValid: false, message: `System Notice: The domain '${domainPart}' is flagged as disposable or a placeholder. Please use a valid personal (Gmail, Outlook) or professional provider.` };
    }

    return { isValid: true };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Email first
    const emailValidation = validateRealEmail(email);
    if (!emailValidation.isValid) {
        setError(emailValidation.message || "Invalid Email");
        return;
    }

    setIsLoading(true);

    // Simulated network delay
    await new Promise(r => setTimeout(r, 1200));

    const usersDb: Record<string, User> = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');

    if (mode === 'login') {
      const user = usersDb[email.toLowerCase()];
      if (user && user.password === password) {
        onLogin(user);
      } else {
        setError("The email or password you entered is incorrect. Please try again.");
        setIsLoading(false);
      }
    } else if (mode === 'sign-up') {
      // Confirm Password Match
      if (password !== confirmPassword) {
        setError("Your passwords do not match. Please verify and try again.");
        setIsLoading(false);
        return;
      }

      if (strength.score < 3) {
        setError("Security Policy: Your password must be stronger. Please use uppercase, numbers, and a symbol.");
        setIsLoading(false);
        return;
      }
      
      if (usersDb[email.toLowerCase()]) {
        setError("An account with this email already exists. Try logging in.");
        setIsLoading(false);
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);
      setMode('verify');
      setIsLoading(false);
      
      triggerSimulatedEmail(code);
    }
  };

  const handleVerify = (enteredCodeOverride?: string) => {
    const entered = enteredCodeOverride || verificationCode.join('');
    if (entered === sentCode) {
      const newUser: User = {
        email: email.toLowerCase(),
        name,
        password,
        createdAt: Date.now(),
        verified: true,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      };
      const usersDb = JSON.parse(localStorage.getItem('pakchat_users_db') || '{}');
      usersDb[newUser.email] = newUser;
      localStorage.setItem('pakchat_users_db', JSON.stringify(usersDb));
      onLogin(newUser);
    } else {
      setError("Incorrect verification code. Please check the notification at the top of your screen.");
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newCode = [...verificationCode];
    const digit = val.slice(-1);
    newCode[index] = digit;
    setVerificationCode(newCode);
    
    if (digit && index < 5) {
        otpRefs.current[index + 1]?.focus();
    } else if (digit && index === 5) {
        // Automatic submission when 6th digit is entered manually
        const finalCode = newCode.join('');
        if (finalCode.length === 6) {
            handleVerify(finalCode);
        }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData('text').trim();
    if (data.length === 6 && !isNaN(Number(data))) {
        setVerificationCode(data.split(''));
        otpRefs.current[5]?.focus();
        // Automatic submission on paste
        handleVerify(data);
    }
  };

  const copyToClipboard = (text: string) => {
      const codeOnly = text.split(': ')[1];
      if (codeOnly) {
        navigator.clipboard.writeText(codeOnly);
        setShowNotification(false);
      }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#fbfcfd] dark:bg-[#020203] font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30 overflow-hidden relative">
      
      {/* Simulated Email Notification Toast */}
      {showNotification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-sm px-4 animate-in slide-in-from-top-12 duration-500">
              <div className="bg-white/90 dark:bg-[#121218]/90 backdrop-blur-2xl border border-blue-500/20 rounded-3xl p-4 shadow-[0_20px_50px_-10px_rgba(59,130,246,0.3)] flex items-center justify-between gap-4 ring-1 ring-blue-500/10">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                          <BellRing size={20} className="animate-bounce" />
                      </div>
                      <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-0.5">Inbox: Pak Chat Auth</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{notificationMsg}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1">
                      <button 
                        onClick={() => copyToClipboard(notificationMsg)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy Code"
                      >
                          <Copy size={18} />
                      </button>
                      <button 
                        onClick={() => setShowNotification(false)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                          <CloseIcon size={18} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Visual Identity Side */}
      <div className="hidden lg:flex w-1/2 bg-[#0a66c2] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 opacity-95"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(255,255,255,0.05)_0%,_transparent_70%)]"></div>
        
        <div className="relative z-10 p-16 text-white max-w-xl">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center mb-10 border border-white/20 shadow-2xl animate-pulse">
            <Fingerprint size={44} strokeWidth={1.5} className="text-white" />
          </div>
          <h1 className="text-6xl font-black mb-8 leading-[0.95] tracking-tighter uppercase">Nexus of <br/>Intelligence.</h1>
          <p className="text-blue-100 text-xl font-medium leading-relaxed mb-10 opacity-80">
            "Your workspace is persistent, your data is private, and your intelligence is amplified."
          </p>
          <div className="flex items-center gap-6 py-8 border-t border-white/10">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-blue-600 bg-gray-800 overflow-hidden shadow-xl">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 40}`} alt="User" />
                </div>
              ))}
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-blue-200">Synchronized with 50K+ Thinkers</span>
          </div>
        </div>
      </div>

      {/* Form Content Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700 py-10">
          
          {mode === 'verify' ? (
            <div className="space-y-10 text-center">
               <div className="inline-flex p-6 bg-blue-50 dark:bg-blue-950/30 rounded-[2.5rem] text-blue-600 border border-blue-100 dark:border-blue-900/50 mb-4 shadow-xl shadow-blue-500/10">
                 <ShieldCheck size={48} strokeWidth={2.5} />
               </div>
               <div>
                 <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Validate Access</h2>
                 <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                   Enter the 6-digit security code sent to <br/>
                   <span className="text-blue-600 font-bold">{email}</span>
                 </p>
                 <p className="text-[10px] font-black uppercase text-gray-400 mt-4 tracking-[0.2em] animate-pulse">Waiting for incoming transmission...</p>
               </div>

               <div className="relative group">
                 <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                   {verificationCode.map((digit, idx) => (
                     <input
                       key={idx}
                       ref={el => { otpRefs.current[idx] = el; }}
                       type="text"
                       inputMode="numeric"
                       maxLength={1}
                       value={digit}
                       onChange={(e) => handleOtpChange(idx, e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Backspace' && !digit && idx > 0) otpRefs.current[idx - 1]?.focus();
                       }}
                       className="w-10 h-14 sm:w-14 sm:h-20 text-center text-3xl font-black border-2 border-gray-100 dark:border-white/5 rounded-2xl bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                     />
                   ))}
                 </div>
               </div>

               {error && (
                 <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in shake duration-300">
                   <AlertCircle size={18} className="shrink-0 mt-0.5" />
                   <p className="font-medium text-left leading-relaxed">{error}</p>
                 </div>
               )}

               <div className="space-y-4 pt-4">
                 <button 
                  onClick={() => handleVerify()}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
                 >
                   Manual Synchronize
                 </button>
                 <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => { if(sentCode) triggerSimulatedEmail(sentCode); }}
                        className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        Didn't receive a notification? Resend
                    </button>
                    <button onClick={() => { setMode('sign-up'); setError(null); }} className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
                    <ChevronLeft size={14} /> Incorrect email address
                    </button>
                 </div>
               </div>
            </div>
          ) : (
            <>
              <div className="mb-12 lg:text-left text-center">
                <div className="lg:hidden w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white shadow-2xl">
                    <Fingerprint size={32} />
                </div>
                <h2 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-[0.9] mb-4">
                  {mode === 'login' ? 'Authentication' : 'Registration'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg italic">
                  {mode === 'login' ? 'Continue your intelligent journey.' : 'Initialize your private intelligence workspace.'}
                </p>
              </div>

              {error && (
                <div className="mb-8 p-5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl flex items-start gap-4 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-4">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase text-[10px] tracking-widest mb-1">Authorization Notice</p>
                    <p className="font-medium leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-6">
                {mode === 'sign-up' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Identity Display Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-5 bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/5 rounded-[1.2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Universal Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full pl-12 pr-4 py-5 bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/5 rounded-[1.2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Secure Passkey</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-12 pr-12 py-5 bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/5 rounded-[1.2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  
                  {mode === 'sign-up' && password && (
                    <div className="px-1 pt-3 animate-in fade-in duration-500">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Entropy Strength: <span className={strength.score >= 3 ? 'text-emerald-500' : 'text-orange-500'}>{strength.label}</span></span>
                      </div>
                      <div className="flex gap-1.5 h-1.5">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`flex-1 rounded-full transition-all duration-700 ${strength.score >= i ? strength.color : 'bg-gray-100 dark:bg-white/5'}`} />
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-400 mt-3 font-medium opacity-70 italic">* Recommended: 10+ characters, 1 uppercase, 1 symbol.</p>
                    </div>
                  )}
                </div>

                {mode === 'sign-up' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Confirm Passkey</label>
                    <div className="relative group">
                      <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${password && confirmPassword ? (password === confirmPassword ? 'text-emerald-500' : 'text-red-500') : 'text-gray-400'}`} size={20} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full pl-12 pr-4 py-5 bg-white dark:bg-[#0a0a0f] border rounded-[1.2rem] outline-none focus:ring-4 transition-all font-bold text-sm ${
                            password && confirmPassword 
                            ? (password === confirmPassword 
                                ? 'border-emerald-500 focus:ring-emerald-500/10' 
                                : 'border-red-500 focus:ring-red-500/10') 
                            : 'border-gray-200 dark:border-white/5 focus:ring-blue-500/10 focus:border-blue-500'
                        }`}
                        required
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-5.5 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Authorize Access' : 'Create Intelligence Profile'}</span>
                      <ArrowRight size={20} strokeWidth={3} />
                    </>
                  )}
                </button>

                <div className="pt-10 text-center border-t border-gray-100 dark:border-white/5">
                   <p className="text-sm font-medium text-gray-500">
                     {mode === 'login' ? "Unauthorized user?" : "Existing operative?"}
                     <button 
                        type="button"
                        onClick={() => { setMode(mode === 'login' ? 'sign-up' : 'login'); setError(null); }}
                        className="ml-2 text-blue-600 font-black uppercase tracking-widest text-[11px] hover:underline"
                     >
                       {mode === 'login' ? 'Register Account' : 'Authenticate Identity'}
                     </button>
                   </p>
                </div>
              </form>
            </>
          )}

          <div className="mt-16 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles size={12} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 dark:text-gray-800">Pak Chat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};