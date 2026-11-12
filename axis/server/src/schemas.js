import { z } from 'zod';

export const PAYMENTS = ['bKash / Nagad', 'Cash on delivery', 'Card on delivery'];
export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const text = (max, message) =>
  z.string({ required_error: message, invalid_type_error: message })
    .trim().min(1, message).max(max, `Please keep it under ${max} characters.`);
const name = text(100, 'Please enter your name.');
const email = z.string({ required_error: 'Please enter your email.' })
  .trim().toLowerCase().email('Please enter a valid email.').max(200);
const phone = z.string({ required_error: 'Please enter your phone number.' })
  .trim().regex(/^\+?[\d\s-]{7,20}$/, 'Please enter a valid phone number.');
const key = z.string().trim().min(1).max(60);

const cartItem = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('product'), slug: key }),
  z.object({
    kind: z.literal('custom'),
    config: z.object({
      vessel: key,
      land: key,
      plants: z.array(key).min(1, 'Choose at least one plant.').max(3, 'Three plants fit in one terrarium.'),
      accents: z.array(key).max(10),
    }),
  }),
]);
const cartItems = z.array(cartItem).min(1, 'Your cart is empty.').max(50, 'That is a lot of terrariums! Please call us for large orders.');

export const schemas = {
  subscribe: z.object({ email }),
  member: z.object({ name, email }),
  consultation: z.object({
    name,
    contact: text(200, 'Please add a phone number or email.'),
    message: text(2000, 'Please tell us a little about your space or project.'),
  }),
  contact: z.object({
    name,
    email,
    topic: z.string().trim().max(60).default('General question'),
    message: text(2000, 'Please write a message.'),
  }),
  clinic: z.object({ name, email, message: text(2000, 'Please describe what you see.') }),
  rsvp: z.object({ name, phone, seats: z.coerce.number().int().min(1).max(3) }),
  like: z.object({ liked: z.boolean() }),
  cart: z.object({ items: cartItems }),
  order: z.object({
    customer: z.object({
      name,
      phone,
      address: text(300, 'Please enter a delivery address.'),
      payment: z.enum(PAYMENTS, { errorMap: () => ({ message: 'Please choose a payment method.' }) }),
    }),
    items: cartItems,
  }),
  orderStatus: z.object({ status: z.enum(ORDER_STATUSES) }),
  submissionStatus: z.object({ status: z.enum(['new', 'done']) }),
};