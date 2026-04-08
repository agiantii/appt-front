
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Github, User as UserIcon, KeyRound, RefreshCw } from 'lucide-react';
import { userApi } from '../../api/user';
import { captchaApi, CaptchaData } from '../../api/captcha';
import { useToast } from '../Common/Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const { addToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // 加载验证码
  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const data = await captchaApi.generate();
      setCaptcha(data);
      setCaptchaAnswer('');
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '验证码加载失败';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 初始加载验证码
  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async () => {
    if (!captcha) {
      const msg = '请先加载验证码';
      setError(msg);
      addToast(msg, 'error');
      return;
    }
      
    if (!captchaAnswer.trim()) {
      const msg = '请输入验证码';
      setError(msg);
      addToast(msg, 'error');
      return;
    }
  
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const res = await userApi.login({ 
          username: email, 
          password,
          captchaId: captcha.id,
          captchaAnswer: captchaAnswer.trim()
        });
        // 登录成功
        if (res.statusCode === 0) {
          addToast(res.message || '登录成功', 'success');
          localStorage.setItem('token', res.data.token);
          onLogin(res.data.token);
        } 
        // 登录失败(statusCode !== 0)
        else {
          const errorMsg = res.message || '登录失败';
          setError(errorMsg);
          addToast(errorMsg, 'error');
          loadCaptcha();
        }
      } else {
        const res = await userApi.register({ 
          username, 
          email, 
          password, 
          registrationCode,
          captchaId: captcha.id,
          captchaAnswer: captchaAnswer.trim()
        });
        // 注册成功
        if (res.statusCode === 0) {
          addToast(res.message || '注册成功,请登录', 'success');
          setMode('login');
          setEmail(username);
          loadCaptcha();
        } 
        // 注册失败
        else {
          const errorMsg = res.message || '注册失败';
          setError(errorMsg);
          addToast(errorMsg, 'error');
          loadCaptcha();
        }
      }
    } catch (err: any) {
      // 仅在网络错误等异常情况下执行
      // const errorMsg = err.response?.data?.message || '操作失败,请稍后重试';
      // setError(errorMsg);
      // addToast(errorMsg, 'error');
      // loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // 如果未打开,不渲染任何内容
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs">
                {error}
              </div>
            )}
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className="w-full bg-accent border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {mode === 'login' ? 'Username or Email' : 'Email address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type={mode === 'login' ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'login' ? 'Enter username or email' : 'name@example.com'}
                  className="w-full bg-accent border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Registration Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={registrationCode}
                    onChange={(e) => setRegistrationCode(e.target.value)}
                    placeholder="Enter registration code"
                    className="w-full bg-accent border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-accent border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
            </div>

            {/* 验证码 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {captcha?.type === 'math' ? '计算题' : '验证码'}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder={captcha?.type === 'math' ? '请输入答案' : '请输入字符'}
                    className="w-full bg-accent border border-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-accent border border-border rounded-lg py-2.5 px-4 text-sm font-mono min-w-[120px] flex items-center justify-center">
                    {captchaLoading ? '加载中...' : captcha?.question || '-'}
                  </div>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    disabled={captchaLoading}
                    className="p-2.5 bg-accent border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                    title="刷新验证码"
                  >
                    <RefreshCw className={`w-4 h-4 ${captchaLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
            </button>

            {/* <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#18181b] px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <button className="w-full bg-accent border border-border text-white flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-accent transition-colors">
              <Github className="w-5 h-5" />
              Github
            </button> */}
          </div>
        </div>

        <div className="bg-accent p-4 text-center border-t border-border">
          <button 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
