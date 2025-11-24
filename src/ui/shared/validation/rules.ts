import { z } from 'zod';

// Regex patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  number: /[0-9]/,
  symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
};

// Field rules with built-in error messages
export const rules = {
  required: (field: string) => z.string().min(1, { message: `${field} is required` }),

  email: () =>
    z
      .string()
      .min(1, { message: 'Email is required' })
      .regex(patterns.email, { message: 'Invalid email address' }),

  password: ({ minLength = 8, maxLength = 128 } = {}) =>
    z
      .string()
      .min(1, { message: 'Password is required' })
      .superRefine((val, ctx) => {
        const errors: string[] = [];

        if (val.length < minLength) {
          errors.push(`At least ${minLength} characters`);
        }
        if (val.length > maxLength) {
          errors.push(`At most ${maxLength} characters`);
        }
        if (!patterns.lowercase.test(val)) {
          errors.push('A lowercase letter');
        }
        if (!patterns.uppercase.test(val)) {
          errors.push('An uppercase letter');
        }
        if (!patterns.number.test(val)) {
          errors.push('A number');
        }
        if (!patterns.symbol.test(val)) {
          errors.push('A symbol');
        }

        if (errors.length > 0) {
          ctx.addIssue({
            code: 'custom',
            message: `Password must contain: ${errors.join(', ').toLowerCase()}`,
          });
        }
      }),

  name: ({ minLength = 2, maxLength = 50 } = {}) =>
    z
      .string()
      .min(1, { message: 'Name is required' })
      .min(minLength, { message: `Name must be at least ${minLength} characters` })
      .max(maxLength, { message: `Name must be at most ${maxLength} characters` }),

  confirmPassword: () => z.string().min(1, { message: 'Please confirm your password' }),
};

// Refinement helpers
export const refinements = {
  passwordsMatch: <T extends { password: string; confirmPassword: string }>(data: T) =>
    data.password === data.confirmPassword,
};

export const refinementMessages = {
  passwordsMatch: { message: 'Passwords do not match', path: ['confirmPassword'] },
};
