import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Upload, X, ArrowRight, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import {
  FormField, Input, Select, Textarea,
  Checkbox, SectionHead, GoldDivider, Spinner,
} from './ui';
import { submitApplication } from '../lib/api';
import type { ApplicationFormData } from '../types';

// ── Zod schema ─────────────────────────────────────────────────────────────────
const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  date_of_birth: z.string().min(1, 'Required'),
  gender: z.string().min(1, 'Required'),
  nationality: z.string().optional(),
  location: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(5, 'Required'),
  instagram: z.string().optional(),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  height_cm: z.coerce.number().positive().optional(),
  weight_kg: z.coerce.number().positive().optional(),
  bust_cm: z.coerce.number().positive().optional(),
  waist_cm: z.coerce.number().positive().optional(),
  hips_cm: z.coerce.number().positive().optional(),
  shoe_size_eu: z.coerce.number().positive().optional(),
  hair_color: z.string().optional(),
  eye_color: z.string().optional(),
  skin_tone: z.string().optional(),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  experience: z.string().optional(),
  prev_agency: z.string().optional(),
  campaigns: z.string().max(400).optional(),
  bio: z.string().min(20, 'Please tell us more about yourself (min 20 chars)').max(600),
  availability: z.string().optional(),
  travel_pref: z.string().optional(),
  hear_about: z.string().optional(),
  emergency_contact: z.string().optional(),
  consent: z.literal(true, { errorMap: () => ({ message: 'You must agree to proceed' }) }),
});

// ── Step config ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Personal',      fields: ['first_name','last_name','date_of_birth','gender','nationality','location'] },
  { id: 2, label: 'Contact',       fields: ['email','phone','instagram','portfolio_url'] },
  { id: 3, label: 'Measurements',  fields: [] },
  { id: 4, label: 'Categories',    fields: ['categories'] },
  { id: 5, label: 'Experience',    fields: ['bio'] },
  { id: 6, label: 'Photos',        fields: [] },
  { id: 7, label: 'Availability',  fields: ['consent'] },
];

const CATEGORIES = [
  'Fashion & Runway','Commercial & Print','Fitness & Lifestyle',
  'Editorial','Brand Ambassador','Events & Promotions',
];

// ── Dropzone component ────────────────────────────────────────────────────────
function PhotoDropzone({ photos, setPhotos }: { photos: File[]; setPhotos: (f: File[]) => void }) {
  const onDrop = useCallback((accepted: File[]) => {
    const next = [...photos, ...accepted].slice(0, 6);
    setPhotos(next);
  }, [photos, setPhotos]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 5 * 1024 * 1024, maxFiles: 6,
  });

  const remove = (i: number) => setPhotos(photos.filter((_, idx) => idx !== i));

  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx(
          'border border-dashed p-10 text-center cursor-pointer transition-all duration-300',
          isDragActive ? 'border-gold bg-gold/5' : 'border-gold/30 hover:border-gold/60 hover:bg-gold/[0.03]'
        )}
      >
        <input {...getInputProps()} />
        <Upload size={32} className="mx-auto mb-4 text-gold/40" />
        <p className="text-xs tracking-widest text-ibh-muted mb-1">
          {isDragActive ? 'Drop photos here...' : 'Click or drag & drop your photos'}
        </p>
        <p className="text-[10px] text-gold/50 tracking-wide">JPG / PNG · Max 5MB · Up to 6 photos</p>
      </div>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {photos.map((f, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(f)}
                alt=""
                className="w-20 h-20 object-cover border border-gold/20"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-12">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={clsx(
              'w-7 h-7 flex items-center justify-center text-[10px] font-medium border transition-all duration-300',
              step > s.id ? 'bg-gold border-gold text-ibh-dark' :
              step === s.id ? 'border-gold text-gold' :
              'border-white/10 text-ibh-muted'
            )}>
              {step > s.id ? <CheckCircle2 size={12} /> : s.id}
            </div>
            <span className={clsx('text-[8px] tracking-wider uppercase hidden sm:block', step === s.id ? 'text-gold' : 'text-ibh-muted/50')}>
              {s.label}
            </span>
          </div>
          {i < total - 1 && (
            <div className={clsx('flex-1 h-px mb-4 transition-all duration-500', step > s.id ? 'bg-gold' : 'bg-white/10')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register, control, handleSubmit, trigger, watch,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(schema),
    defaultValues: { categories: [] },
    mode: 'onBlur',
  });

  const categories = watch('categories') || [];

  const toggleCategory = (cat: string, onChange: (v: string[]) => void) => {
    onChange(categories.includes(cat) ? categories.filter((c) => c !== cat) : [...categories, cat]);
  };

  const nextStep = async () => {
    const fields = STEPS[step - 1].fields as (keyof ApplicationFormData)[];
    const ok = fields.length === 0 || await trigger(fields);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length));
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: ApplicationFormData) => {
    setSubmitting(true);
    try {
      await submitApplication(data, photos);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center px-6 py-20"
      >
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 border border-gold rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle2 size={32} className="text-gold" />
          </motion.div>
          <h2 className="font-cormorant text-5xl font-light text-ibh-cream mb-3">
            Application<br /><em className="text-gold-light italic">Received</em>
          </h2>
          <p className="text-xs text-ibh-muted leading-loose tracking-wide max-w-sm mx-auto mt-4 mb-8">
            Thank you for applying to IBH Company. Our team reviews every submission personally and will reach out within 5–7 business days.
          </p>
          <GoldDivider className="mb-8" />
          <p className="text-[10px] text-ibh-muted/60 tracking-widest uppercase">
            Check your inbox for a confirmation email.
          </p>
        </div>
      </motion.div>
    );
  }

  const slide = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 } };

  return (
    <section className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16 animate-fade-up">
          <span className="ibh-section-tag block mb-5">Model Application Form</span>
          <h2 className="font-cormorant text-5xl md:text-6xl font-light text-ibh-cream leading-tight mb-4">
            Tell Us<br /><em className="italic text-gold-light">About Yourself</em>
          </h2>
          <p className="text-xs text-ibh-muted leading-loose tracking-wide max-w-md mx-auto">
            All information is kept strictly confidential.<br />
            Fields marked <span className="text-gold">*</span> are required.
          </p>
        </div>

        <StepBar step={step} total={STEPS.length} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Personal ── */}
            {step === 1 && (
              <motion.div key="step1" {...slide} transition={{ duration: 0.3 }}>
                <SectionHead num="01" title="Personal Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="First Name" required error={errors.first_name?.message}>
                    <Input {...register('first_name')} placeholder="Your first name" error={!!errors.first_name} />
                  </FormField>
                  <FormField label="Last Name" required error={errors.last_name?.message}>
                    <Input {...register('last_name')} placeholder="Your last name" error={!!errors.last_name} />
                  </FormField>
                  <FormField label="Date of Birth" required error={errors.date_of_birth?.message}>
                    <Input type="date" {...register('date_of_birth')} error={!!errors.date_of_birth} />
                  </FormField>
                  <FormField label="Gender" required error={errors.gender?.message}>
                    <Select {...register('gender')} error={!!errors.gender}>
                      <option value="">Select gender</option>
                      <option>Female</option><option>Male</option>
                      <option>Non-binary</option><option>Prefer not to say</option>
                    </Select>
                  </FormField>
                  <FormField label="Nationality">
                    <Input {...register('nationality')} placeholder="e.g. Ghanaian, Nigerian..." />
                  </FormField>
                  <FormField label="City / Country" required error={errors.location?.message}>
                    <Input {...register('location')} placeholder="e.g. Accra, Ghana" error={!!errors.location} />
                  </FormField>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Contact ── */}
            {step === 2 && (
              <motion.div key="step2" {...slide} transition={{ duration: 0.3 }}>
                <SectionHead num="02" title="Contact Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Email Address" required error={errors.email?.message}>
                    <Input type="email" {...register('email')} placeholder="your@email.com" error={!!errors.email} />
                  </FormField>
                  <FormField label="Phone Number" required error={errors.phone?.message}>
                    <Input type="tel" {...register('phone')} placeholder="+233 xx xxx xxxx" error={!!errors.phone} />
                  </FormField>
                  <FormField label="Instagram Handle">
                    <Input {...register('instagram')} placeholder="@yourhandle" />
                  </FormField>
                  <FormField label="Portfolio / Website" error={errors.portfolio_url?.message}>
                    <Input type="url" {...register('portfolio_url')} placeholder="https://yourportfolio.com" error={!!errors.portfolio_url} />
                  </FormField>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Measurements ── */}
            {step === 3 && (
              <motion.div key="step3" {...slide} transition={{ duration: 0.3 }}>
                <SectionHead num="03" title="Physical Measurements" />
                <p className="text-xs text-ibh-muted mb-6 tracking-wide">All measurements are optional and used for casting purposes only.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  {[
                    { label: 'Height (cm)', name: 'height_cm', placeholder: '175' },
                    { label: 'Weight (kg)', name: 'weight_kg', placeholder: '60' },
                    { label: 'Bust / Chest (cm)', name: 'bust_cm', placeholder: '86' },
                    { label: 'Waist (cm)', name: 'waist_cm', placeholder: '64' },
                    { label: 'Hips (cm)', name: 'hips_cm', placeholder: '90' },
                    { label: 'Shoe Size (EU)', name: 'shoe_size_eu', placeholder: '39' },
                  ].map(({ label, name, placeholder }) => (
                    <FormField key={name} label={label}>
                      <Input type="number" {...register(name as keyof ApplicationFormData)} placeholder={placeholder} />
                    </FormField>
                  ))}
                  <FormField label="Hair Color">
                    <Input {...register('hair_color')} placeholder="e.g. Black" />
                  </FormField>
                  <FormField label="Eye Color">
                    <Input {...register('eye_color')} placeholder="e.g. Brown" />
                  </FormField>
                  <FormField label="Skin Tone">
                    <Select {...register('skin_tone')}>
                      <option value="">Select tone</option>
                      {['Fair','Light','Medium','Olive','Tan','Deep','Rich'].map((t) => <option key={t}>{t}</option>)}
                    </Select>
                  </FormField>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Categories ── */}
            {step === 4 && (
              <motion.div key="step4" {...slide} transition={{ duration: 0.3 }}>
                <SectionHead num="04" title="Modeling Category" />
                <p className="text-xs text-ibh-muted mb-6 tracking-wide">
                  Select all categories you are interested in.
                  {errors.categories && <span className="text-red-400 ml-2">{errors.categories.message}</span>}
                </p>
                <Controller
                  name="categories"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CATEGORIES.map((cat) => (
                        <label
                          key={cat}
                          className={clsx(
                            'flex items-center gap-3 p-4 border cursor-pointer transition-all duration-200',
                            categories.includes(cat)
                              ? 'border-gold/60 bg-gold/5'
                              : 'border-white/5 hover:border-gold/20'
                          )}
                        >
                          <div
                            onClick={() => toggleCategory(cat, onChange)}
                            className={clsx(
                              'w-4 h-4 border flex-shrink-0 transition-all',
                              categories.includes(cat) ? 'bg-gold border-gold' : 'border-gold/40'
                            )}
                          >
                            {categories.includes(cat) && (
                              <svg className="w-full h-full p-[3px]" viewBox="0 0 10 10">
                                <path d="M1.5 5l3 3 4-4" stroke="#0D0D0D" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className={clsx('text-xs tracking-wide', categories.includes(cat) ? 'text-ibh-cream' : 'text-ibh-muted')}>
                            {cat}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </motion.div>
            )}

            {/* ── STEP 5: Experience ── */}
            {step === 5 && (
              <motion.div key="step5" {...slide} transition={{ duration: 0.3 }}>
                <SectionHead num="05" title="Experience & Background" />
                <div className="flex flex-col gap-5">
                  <FormField label="Experience Level">
                    <Select {...register('experience')}>
                      <option value="">Select your level</option>
                      <option>New Face — No prior experience</option>
                      <option>Emerging — Some experience (under 2 years)</option>
                      <option>Experienced — 2–5 years</option>
                      <option>Established — 5+ years</option>
                    </Select>
                  </FormField>
                  <FormField label="Previous Agencies / Representation">
                    <Input {...register('prev_agency')} placeholder="e.g. Previously with XYZ Models, or none" />
                  </FormField>
                  <FormField label="Notable Campaigns or Clients" hint="Max 400 characters">
                    <Textarea {...register('campaigns')} placeholder="List any notable brands, campaigns, or projects..." rows={3} maxLength={400} />
                  </FormField>
                  <FormField label="Tell Us About Yourself" required error={errors.bio?.message} hint="Max 600 characters">
                    <Textarea
                      {...register('bio')}
                      placeholder="Share your story — what drives you, what you bring to the industry, and why you want to join IBH Company..."
                      rows={5}
                      maxLength={600}
                      error={!!errors.bio}
                    />
                  </FormField>
                </div>
              </motion.div>
            )}

            {/* ── STEP 6: Photos ── */}
            {step === 6 && (
              <motion.div key="step6" {...slide} transition={{ duration: 0.3 }}>
                <SectionHead num="06" title="Photos" />
                <p className="text-xs text-ibh-muted mb-6 tracking-wide">
                  Submit clear, recent photos. Include a headshot and full-length shot where possible.
                </p>
                <PhotoDropzone photos={photos} setPhotos={setPhotos} />
              </motion.div>
            )}

            {/* ── STEP 7: Availability + Consent ── */}
            {step === 7 && (
              <motion.div key="step7" {...slide} transition={{ duration: 0.3 }}>
                <SectionHead num="07" title="Availability & Final Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                  <FormField label="Availability">
                    <Select {...register('availability')}>
                      <option value="">Select availability</option>
                      <option>Full-time</option><option>Part-time</option>
                      <option>Weekends only</option><option>Project-by-project</option>
                    </Select>
                  </FormField>
                  <FormField label="Willing to Travel?">
                    <Select {...register('travel_pref')}>
                      <option value="">Select preference</option>
                      <option>Local only</option><option>Nationally</option>
                      <option>Internationally</option><option>No preference</option>
                    </Select>
                  </FormField>
                  <FormField label="How Did You Hear About Us?">
                    <Select {...register('hear_about')}>
                      <option value="">Select an option</option>
                      <option>Instagram</option><option>Word of mouth</option>
                      <option>Events / Shows</option><option>Website</option><option>Other</option>
                    </Select>
                  </FormField>
                  <FormField label="Emergency Contact (Name & Phone)">
                    <Input {...register('emergency_contact')} placeholder="Name — Phone number" />
                  </FormField>
                </div>

                <GoldDivider className="mb-8" />

                {/* Consent block */}
                <div className="border border-gold/20 bg-gold/[0.03] p-7 mb-8 relative">
                  <span className="font-cormorant text-7xl text-gold/10 absolute top-0 left-4 leading-none select-none">"</span>
                  <p className="text-[11px] text-ibh-muted leading-loose tracking-wide mb-5">
                    By submitting this application, I confirm that all information provided is accurate and truthful. I understand that IBH Company may use submitted photographs and information solely for talent evaluation. I acknowledge that submission does not guarantee representation or employment, and that IBH Company reserves the right to accept or decline any application at its sole discretion. I agree to review and sign the formal Model Upfront Agreement prior to any booking or engagement.
                  </p>
                  <Controller
                    name="consent"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Checkbox
                        checked={!!value}
                        onChange={(v) => onChange(v)}
                        label={
                          <span>
                            I have read and agree to the above statement. I confirm I am at least <strong className="text-gold">18 years of age</strong> or have parental / guardian consent to apply.
                          </span>
                        }
                      />
                    )}
                  />
                  {errors.consent && (
                    <p className="text-[10px] text-red-400 mt-3 tracking-wide">{errors.consent.message}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="ibh-btn-outline text-sm"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < STEPS.length ? (
              <button type="button" onClick={nextStep} className="ibh-btn-primary">
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="ibh-btn-primary"
              >
                {submitting ? (
                  <><Spinner size={16} /><span>Submitting...</span></>
                ) : (
                  <><span>Submit Application</span><ChevronRight size={16} /></>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
