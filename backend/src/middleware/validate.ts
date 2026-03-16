import { z } from 'zod';

export const applicationSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  date_of_birth: z.string().min(1),
  gender: z.string().min(1),
  nationality: z.string().optional(),
  location: z.string().min(1).max(150),
  email: z.string().email(),
  phone: z.string().min(5).max(50),
  instagram: z.string().optional(),
  portfolio_url: z.string().url().optional().or(z.literal('')),
  height_cm: z.coerce.number().positive().optional(),
  weight_kg: z.coerce.number().positive().optional(),
  bust_cm: z.coerce.number().positive().optional(),
  waist_cm: z.coerce.number().positive().optional(),
  hips_cm: z.coerce.number().positive().optional(),
  shoe_size_eu: z.coerce.number().positive().optional(),
  hair_color: z.string().optional(),
  eye_color: z.string().optional(),
  skin_tone: z.string().optional(),
  categories: z.union([z.array(z.string()), z.string()]).transform((v) =>
    typeof v === 'string' ? JSON.parse(v) : v
  ),
  experience: z.string().optional(),
  prev_agency: z.string().optional(),
  campaigns: z.string().max(400).optional(),
  bio: z.string().min(1).max(600),
  availability: z.string().optional(),
  travel_pref: z.string().optional(),
  hear_about: z.string().optional(),
  emergency_contact: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'approved', 'rejected', 'waitlisted']),
  admin_notes: z.string().optional(),
  notify_model: z.boolean().optional().default(true),
});
