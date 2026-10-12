import { z } from 'zod';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/),id=z.string().uuid();
export const bookingSchema=z.object({
  propertyId:id,kind:z.enum(['table','room','event']),eventId:id.optional(),
  date,time:z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration:z.union([z.literal(90),z.literal(120),z.literal(180)]).optional(),
  nights:z.number().int().min(1).max(30).optional(),guests:z.number().int().min(1).max(12),
  notes:z.string().trim().max(1000).default(''),requestKey:id,
}).strict().superRefine((x,ctx)=>{
  if(x.kind==='event'&&!x.eventId)ctx.addIssue({code:'custom',message:'Choose an event.'});
  if(x.kind!=='event'&&x.eventId)ctx.addIssue({code:'custom',message:'Unexpected event.'});
  if(x.kind==='table'&&(!x.time||!x.duration))ctx.addIssue({code:'custom',message:'Choose time and duration.'});
  if(x.kind==='room'&&!x.nights)ctx.addIssue({code:'custom',message:'Choose nights.'});
});
export type BookingInput=z.output<typeof bookingSchema>;
export const reservationIdSchema=z.object({id}).strict();
export const completionSchema=z.object({id,amountTetri:z.number().int().min(0).max(10000000)}).strict();
export const rewardSchema=z.object({rewardId:z.enum(['dessert','wine','experience']),requestKey:id}).strict();
export const profileSchema=z.object({phone:z.string().trim().max(30).default(''),birthday:z.union([date,z.literal('')]).default(''),marketingConsent:z.boolean()}).strict();
