import {
  createComponent,
  createFor,
  defineVaporComponent,
  type ShallowRef,
} from "vue";
import { CardContentView } from "./render.js";
import type { CardContent } from "./types.js";
export interface CardActionEntry {
  readonly content: CardContent;
  readonly index: number;
}
const Item = defineVaporComponent<{ entry: CardActionEntry }, {}, string, {}>(
  (props) => (
    <div
      class="semi-card-body-actions-item"
      x-semi-prop={`actions.${props.entry.index}`}
    >
      <CardContentView content={props.entry.content} />
    </div>
  ),
  { props: ["entry"], inheritAttrs: false },
);
/** Source actions are keyed by their array index, including sparse array gaps. */
export const CardActions = defineVaporComponent<
  { entries: CardActionEntry[] },
  {},
  string,
  {}
>(
  (props) =>
    createFor(
      () => props.entries,
      (entry: ShallowRef<CardActionEntry>) =>
        createComponent(Item, { entry: () => entry.value }),
      (entry) => entry.index,
    ),
  { props: ["entries"], inheritAttrs: false },
);
