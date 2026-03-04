import { Workspace } from '@/bindings';

/**
 * Extended Workspace type that includes fields provided by the backend 
 * but missing from the basic Workspace binding, or specific to the UI's
 * runtime representation.
 */
export interface RuntimeWorkspace extends Workspace {
    id?: string;
    status?: string;
    workspace_type?: string;
    release_id?: string | null;
    last_activated_at?: string | null;
    context_hash?: string | null;
}
