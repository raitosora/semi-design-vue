/** Notifications have no meaningful return value. Dispatch each event once. */
export type ChangeCallback<T, E = Event> = (value: T, event: E) => void;

/** Call directly: Vue emit cannot carry a decision or a returned Promise. */
export type DecisionCallback<T> = (
  value: T,
) => boolean | void | Promise<boolean | void>;
