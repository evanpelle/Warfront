import {z} from 'zod';


interface BaseIntent {
    type: string;
}

export interface AttackIntent extends BaseIntent {
    type: 'attack';
    targetID: string;
    troops: number;
}


export type Intent = AttackIntent;

// Zod schemas
const BaseIntentSchema = z.object({
    type: z.string(),
});

export const AttackIntentSchema = BaseIntentSchema.extend({
    type: z.literal('attack'),
    targetID: z.string(),
    troops: z.number(),
});

export const IntentSchema = z.discriminatedUnion('type', [
    AttackIntentSchema,
]);