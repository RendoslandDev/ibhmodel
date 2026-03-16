import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FormField, Input, Spinner } from '../components/ui';

interface LoginForm {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async ({ email, password }: LoginForm) => {
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ibh-dark flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(200,150,62,0.06),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-10">
          <p className="font-cormorant text-3xl font-light tracking-[0.15em] text-ibh-cream mb-1">
            IBH <span className="text-gold">COMPANY</span>
          </p>
          <p className="text-[10px] tracking-[0.4em] text-ibh-muted uppercase">Admin Portal</p>
        </div>

        <div className="border border-gold/15 bg-ibh-dark-3 p-8">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t border-l border-gold/30" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b border-r border-gold/30" />

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <FormField label="Email Address" required error={errors.email?.message}>
              <Input
                type="email"
                {...register('email', { required: 'Required' })}
                placeholder="admin@ibhcompany.com"
                error={!!errors.email}
                autoComplete="email"
              />
            </FormField>

            <FormField label="Password" required error={errors.password?.message}>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', { required: 'Required' })}
                  placeholder="••••••••"
                  error={!!errors.password}
                  autoComplete="current-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ibh-muted hover:text-gold transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </FormField>

            <button type="submit" disabled={loading} className="ibh-btn-primary justify-center mt-2">
              {loading ? (
                <><Spinner size={16} /><span>Signing in...</span></>
              ) : (
                <><LogIn size={15} /><span>Sign In</span></>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
