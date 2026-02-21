import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Sparkles, BarChart3, FolderOpen } from 'lucide-react';
import inukkiMark from '@/assets/inukki-mark.svg';
import { lovable } from '@/integrations/lovable/index';
export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const {
    signIn,
    signUp,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check if user came from email confirmation
  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    if (accessToken) {
      toast({
        title: 'Email confirmed!',
        description: 'Your account is now active. Welcome to Inukki!'
      });
    }
  }, [location, toast]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        setSignUpSuccess(true);
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-5 rounded-2xl flex items-center justify-center">
            <img src={inukkiMark} alt="Inukki" className="w-24 h-24" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">
            Inukki
          </h1>
          <p className="text-sm italic text-muted-foreground mb-2">unexpectedly yours</p>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your intelligent wardrobe assistant. Organize, style, and discover your perfect look.
          </p>
        </motion.div>

        {/* Auth Form */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="w-full max-w-sm">
          {signUpSuccess ? <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} className="bg-card rounded-2xl border-2 border-strong p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center border-2 border-strong">
                <CheckCircle className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Check your email</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We've sent a confirmation link to <strong className="text-foreground">{email}</strong>. 
                Click the link to activate your account.
              </p>
              <Button variant="outline" onClick={() => {
            setSignUpSuccess(false);
            setIsSignUp(false);
            setEmail('');
            setPassword('');
            setDisplayName('');
          }} className="w-full border-2 border-strong">
                Back to Sign In
              </Button>
            </motion.div> : <div className="bg-card rounded-2xl border-2 border-strong p-6">
            <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-lg border-2 border-strong">
              <button type="button" onClick={() => setIsSignUp(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isSignUp ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
                Sign In
              </button>
              <button type="button" onClick={() => setIsSignUp(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isSignUp ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isSignUp && <motion.div key="name" initial={{
                opacity: 0,
                height: 0
              }} animate={{
                opacity: 1,
                height: 'auto'
              }} exit={{
                opacity: 0,
                height: 0
              }}>
                    <Label htmlFor="displayName">Name</Label>
                    <Input id="displayName" type="text" placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1" />
                  </motion.div>}
              </AnimatePresence>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="mt-1" />
              </div>

              <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90 transition-opacity border-2 border-strong" disabled={loading}>
                {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-strong" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-strong"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast({
                      title: 'Error',
                      description: error.message,
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </form>
          </div>}

          {/* Features */}
          {!signUpSuccess && <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[{
            icon: FolderOpen,
            label: 'Organize'
          }, {
            icon: Sparkles,
            label: 'AI Styling'
          }, {
            icon: BarChart3,
            label: 'Insights'
          }].map(feature => <div key={feature.label} className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <feature.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{feature.label}</span>
              </div>)}
          </div>}
        </motion.div>
      </div>
    </div>;
}