import {z} from 'zod';

export type Intent = SpawnIntent | AttackIntent
export type AttackIntent = z.infer<typeof AttackIntentSchema>
export type SpawnIntent = z.infer<typeof SpawnIntentSchema>


export type ClientMessage = ClientIntentMessage | ClientJoinMessage
export type ServerMessage = ServerSyncMessage | ServerGameMessage

export type ServerSyncMessage = z.infer<typeof ServerSyncMessageSchema>
export type ServerGameMessage = z.infer<typeof ServerGameMessageSchema>


export type ClientIntentMessage = z.infer<typeof ClientIntentMessageSchema>
export type ClientJoinMessage = z.infer<typeof ClientJoinMessageSchema>


// Zod schemas
const BaseIntentSchema = z.object({
    type: z.enum(['attack', 'spawn']),
});

export const AttackIntentSchema = BaseIntentSchema.extend({
    type: z.literal('attack'),
    attackerID: z.number(),
    targetID: z.number().nullable(),
    troops: z.number(),
});


export const SpawnIntentSchema = BaseIntentSchema.extend({
    type: z.literal('spawn'),
    name: z.string(),
    isBot: z.boolean(),
    x: z.number(),
    y: z.number(),
})

const IntentSchema = z.union([AttackIntentSchema, SpawnIntentSchema]);

// Server

const ServerBaseMessageSchema = z.object({
    type: z.string()
})

export const ServerSyncMessageSchema = ServerBaseMessageSchema.extend({
    type: z.literal('sync'),
    intents: z.array(IntentSchema)
})

export const ServerGameMessageSchema = ServerBaseMessageSchema.extend({
    type: z.literal('game'),
    game: z.string()
})


export const ServerMessageSchema = z.union([ServerSyncMessageSchema, ServerGameMessageSchema]);


// Client

const ClientBaseMessageSchema = z.object({
    type: z.string()
})

export const ClientIntentMessageSchema = ClientBaseMessageSchema.extend({
    type: z.literal('intent'),
    intent: IntentSchema
})

export const ClientJoinMessageSchema = ClientBaseMessageSchema.extend({
    type: z.literal('join')
})

export const ClientMessageSchema = z.union([ClientIntentMessageSchema, ClientJoinMessageSchema]);

export class Hi {

}