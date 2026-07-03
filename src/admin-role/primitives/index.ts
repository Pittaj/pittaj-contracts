export type AdminRolePrimitives = {
    readonly id: string;
    readonly name: string;
    readonly description: string | null;
    readonly permissions: readonly string[];
    readonly isSystem: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
};