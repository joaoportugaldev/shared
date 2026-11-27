/**
 * An authenticated user calling a use case.
 * `type` is plain text because this package does not know Auth's user types;
 * modules must ask their AuthProvider instead of comparing it.
 */
export type UserActor = Readonly<{
  kind: "user";
  id: string;
  type: string;
  /** Id of the user who started the impersonation session, kept for auditing. */
  impersonatedBy?: string;
}>;

/** A worker, webhook or routine calling a use case without a logged-in user. */
export type SystemActor = Readonly<{
  kind: "system";
  name: string;
}>;

/**
 * Who is calling a use case. It is mandatory so that a missing user is never
 * mistaken for a system call.
 */
export type Actor = UserActor | SystemActor;
