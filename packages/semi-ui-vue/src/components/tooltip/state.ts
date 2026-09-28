import type { Position } from "./types.js";
export type Listener = () => void;
export type Events = Readonly<Record<string, (event: Event) => void>>;
export interface State {
  readonly visible: boolean;
  readonly isInsert: boolean;
  readonly displayNone: boolean;
  readonly placement: Position | undefined;
  readonly containerStyle: Readonly<Record<string, string | number>>;
  readonly isPositionUpdated: boolean;
  readonly triggerEventSet: Events;
  readonly portalEventSet: Events;
}
