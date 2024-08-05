import {z} from 'zod';

export type Intent = SpawnIntent | AttackIntent | BoatAttackIntent

export type AttackIntent = z.infer<typeof AttackIntentSchema>
export type SpawnIntent = z.infer<typeof SpawnIntentSchema>
export type BoatAttackIntent = z.infer<typeof BoatAttackIntentSchema>

export type Turn = z.infer<typeof TurnSchema>

export type ClientMessage = ClientIntentMessage | ClientJoinMessage
export type ServerMessage = ServerSyncMessage | ServerStartGameMessage

export type ServerSyncMessage = z.infer<typeof ServerTurnMessageSchema>
export type ServerStartGameMessage = z.infer<typeof ServerStartGameMessageSchema>


export type ClientIntentMessage = z.infer<typeof ClientIntentMessageSchema>
export type ClientJoinMessage = z.infer<typeof ClientJoinMessageSchema>



// Zod schemas
const BaseIntentSchema = z.object({
    type: z.enum(['attack', 'spawn', 'boat']),
});

export const AttackIntentSchema = BaseIntentSchema.extend({
    type: z.literal('attack'),
    attackerID: z.number(),
    targetID: z.number().nullable(),
    troops: z.number(),
    targetX: z.number(),
    targetY: z.number()
});


export const SpawnIntentSchema = BaseIntentSchema.extend({
    type: z.literal('spawn'),
    name: z.string(),
    isBot: z.boolean(),
    x: z.number(),
    y: z.number(),
})

export const BoatAttackIntentSchema = BaseIntentSchema.extend({
    type: z.literal('boat'),
    attackerID: z.number(),
    targetID: z.number().nullable(),
    troops: z.number(),
    x: z.number(),
    y: z.number(),
})

const IntentSchema = z.union([AttackIntentSchema, SpawnIntentSchema, BoatAttackIntentSchema]);

const TurnSchema = z.object({
    turnNumber: z.number(),
    intents: z.array(IntentSchema)
})

// Server

const ServerBaseMessageSchema = z.object({
    type: z.string()
})

export const ServerTurnMessageSchema = ServerBaseMessageSchema.extend({
    type: z.literal('turn'),
    turn: TurnSchema,
})

export const ServerStartGameMessageSchema = ServerBaseMessageSchema.extend({
    type: z.literal('start'),
})


export const ServerMessageSchema = z.union([ServerTurnMessageSchema, ServerStartGameMessageSchema]);


// Client

const ClientBaseMessageSchema = z.object({
    type: z.string()
})

export const ClientIntentMessageSchema = ClientBaseMessageSchema.extend({
    type: z.literal('intent'),
    clientID: z.string(),
    //gameID: z.string(),
    intent: IntentSchema
})

export const ClientJoinMessageSchema = ClientBaseMessageSchema.extend({
    type: z.literal('join'),
    clientID: z.string(),
    lobbyID: z.string()
})

export const ClientMessageSchema = z.union([ClientIntentMessageSchema, ClientJoinMessageSchema]);