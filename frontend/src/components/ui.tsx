import React, { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

// ── FormField wrapper ─────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}
export function FormField({ label, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <label className="ibh-label">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-ibh-muted tracking-wide">{hint}</p>}
      {error && <p className="text-[10px] text-red-400 tracking-wide">{error}</p>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx('ibh-input', error && 'border-red-500/60 focus:border-red-400', className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={clsx(
        'ibh-input appearance-none cursor-pointer',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23C8963E\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_16px_center] pr-10',
        error && 'border-red-500/60',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx('ibh-input resize-y min-h-[100px] leading-relaxed', error && 'border-red-500/60', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// ── Checkbox ──────────────────────────────────────────────────────────────────
interface CheckboxProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}
export function Checkbox({ label, checked, onChange, className }: CheckboxProps) {
  return (
    <label className={clsx('flex items-center gap-3 cursor-pointer group', className)}>
      <div
        onClick={() => onChange(!checked)}
        className={clsx(
          'w-4 h-4 border flex-shrink-0 relative transition-all duration-200',
          checked ? 'bg-gold border-gold' : 'border-gold/40 group-hover:border-gold/70'
        )}
      >
        {checked && (
          <svg className="absolute inset-0 w-full h-full p-[3px]" viewBox="0 0 10 10">
            <path d="M1.5 5l3 3 4-4" stroke="#0D0D0D" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className={clsx('text-xs tracking-wide transition-colors', checked ? 'text-ibh-cream' : 'text-ibh-muted')}>
        {label}
      </span>
    </label>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  reviewing:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approved:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:   'bg-red-500/10 text-red-400 border-red-500/20',
  waitlisted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('text-[9px] font-medium tracking-[0.2em] uppercase border px-2.5 py-1', STATUS_STYLES[status] ?? 'bg-white/5 text-ibh-muted border-white/10')}>
      {status}
    </span>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx('animate-spin text-gold', className)} />;
}

// ── Section heading ───────────────────────────────────────────────────────────
interface SectionHeadProps {
  num: string;
  title: string;
}
export function SectionHead({ num, title }: SectionHeadProps) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <span className="font-cormorant text-[11px] text-gold tracking-[0.2em] min-w-[24px]">{num}</span>
      <span className="text-[11px] font-medium tracking-[0.3em] uppercase text-ibh-cream">{title}</span>
      <div className="flex-1 h-px bg-gold/20" />
    </div>
  );
}

// ── Gold divider ──────────────────────────────────────────────────────────────
export function GoldDivider({ className }: { className?: string }) {
  return <div className={clsx('ibh-divider', className)} />;
}
