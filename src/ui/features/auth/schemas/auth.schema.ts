import { z } from 'zod';
import {
  rules,
  refinements,
  refinementMessages,
} from '../../../shared/validation/rules';

export const loginSchema = z.object({
  email: rules.email(),
  password: rules.required('Password'),
});

export const registerSchema = z
  .object({
    name: rules.name(),
    email: rules.email(),
    password: rules.password(),
    confirmPassword: rules.confirmPassword(),
  })
  .refine(refinements.passwordsMatch, refinementMessages.passwordsMatch);

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
