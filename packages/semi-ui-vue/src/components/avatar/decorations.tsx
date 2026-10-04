import { defineVaporComponent } from "vue";
import type { AvatarProps } from "./types.js";
import { AvatarContentView } from "./render.js";

export function avatarDecorationId(): string {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) =>
    value.toString(16).padStart(8, "0"),
  ).join("");
}

const TopBackground = defineVaporComponent<
  { start: string; end: string },
  {},
  string,
  {}
>(
  (props) => {
    // Random per-instance IDs do not share an app counter or collide between apps.
    const gradient = `semi-avatar-gradient-${avatarDecorationId()}`;
    const filter = `semi-avatar-filter-${avatarDecorationId()}`;
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="52"
        viewBox="0 0 51 52"
        width="51"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#${filter})`}>
          <path
            d="M40.4918 46.5592C44.6795 43.176 46.261 34.1333 47.5301 25.6141C49.5854 11.8168 39.6662 1 25.8097 1C11.2857 1 3 11.4279 3 25.3518C3 33.7866 6.29361 43.8947 10.4602 46.5592C12.5868 47.9192 12.5868 47.9051 25.8097 47.9192C38.3651 47.9282 38.5352 48.14 40.4918 46.5592Z"
            fill={`url(#${gradient})`}
          />
        </g>
        <defs>
          <filter
            color-interpolation-filters="sRGB"
            filterUnits="userSpaceOnUse"
            height="51.3549"
            id={filter}
            width="49.2216"
            x="0.789215"
            y="0.447304"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="1.65809" />
            <feGaussianBlur stdDeviation="1.10539" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"
            />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow_6_2"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_6_2"
              mode="normal"
              result="shape"
            />
          </filter>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={gradient}
            x1="17.671"
            x2="17.671"
            y1="31.7392"
            y2="47.9333"
          >
            <stop stop-color={props.start} />
            <stop offset="1" stop-color={props.end} />
          </linearGradient>
        </defs>
      </svg>
    );
  },
  { props: ["start", "end"], inheritAttrs: false },
);

export const AvatarTop = defineVaporComponent<
  { source: AvatarProps },
  {},
  string,
  {}
>(
  (props) => (
    <>
      {props.source.topSlot?.render ? (
        <AvatarContentView content={props.source.topSlot.render} />
      ) : (
        <div
          class={[
            "semi-avatar-top_slot-wrapper",
            props.source.topSlot?.className,
            props.source.contentMotion && "semi-avatar-animated",
          ]}
          style={props.source.topSlot?.style}
        >
          <div
            class={[
              "semi-avatar-top_slot-bg",
              `semi-avatar-top_slot-bg-${props.source.size}`,
            ]}
          >
            <div
              class={[
                "semi-avatar-top_slot-bg-svg",
                `semi-avatar-top_slot-bg-svg-${props.source.size}`,
              ]}
            >
              <TopBackground
                end={
                  props.source.topSlot?.gradientEnd ??
                  "var(--semi-color-primary)"
                }
                start={
                  props.source.topSlot?.gradientStart ??
                  "var(--semi-color-primary)"
                }
              />
            </div>
          </div>
          <div class="semi-avatar-top_slot">
            <div
              class={[
                "semi-avatar-top_slot-content",
                `semi-avatar-top_slot-content-${props.source.size}`,
              ]}
              style={{ color: props.source.topSlot?.textColor }}
            >
              <AvatarContentView content={props.source.topSlot?.text} />
            </div>
          </div>
        </div>
      )}
    </>
  ),
  { props: ["source"], inheritAttrs: false },
);
export const AvatarBottom = defineVaporComponent<
  { source: AvatarProps },
  {},
  string,
  {}
>(
  (props) => (
    <>
      {props.source.bottomSlot?.render ? (
        <AvatarContentView content={props.source.bottomSlot.render} />
      ) : (
        <div
          class="semi-avatar-bottom_slot"
          style={props.source.bottomSlot?.style}
        >
          <span
            class={[
              `semi-avatar-bottom_slot-shape_${props.source.bottomSlot?.shape}`,
              `semi-avatar-bottom_slot-shape_${props.source.bottomSlot?.shape}-${props.source.size}`,
              props.source.bottomSlot?.className,
            ]}
            style={{
              backgroundColor: props.source.bottomSlot?.bgColor,
              color: props.source.bottomSlot?.textColor,
            }}
          >
            <AvatarContentView content={props.source.bottomSlot?.text} />
          </span>
        </div>
      )}
    </>
  ),
  { props: ["source"], inheritAttrs: false },
);
export const AvatarBorder = defineVaporComponent<
  { source: AvatarProps },
  {},
  string,
  {}
>(
  (props) => (
    <>
      <span
        class={[
          "semi-avatar-additionalBorder",
          `semi-avatar-additionalBorder-${props.source.size}`,
          `semi-avatar-${props.source.shape}`,
        ]}
        style={{
          borderColor:
            typeof props.source.border === "object"
              ? props.source.border.color
              : undefined,
        }}
      />
      {typeof props.source.border === "object" && props.source.border.motion ? (
        <span
          class={[
            "semi-avatar-additionalBorder",
            `semi-avatar-additionalBorder-${props.source.size}`,
            `semi-avatar-${props.source.shape}`,
            "semi-avatar-additionalBorder-animated",
          ]}
          style={{ borderColor: props.source.border.color }}
        />
      ) : null}
    </>
  ),
  { props: ["source"], inheritAttrs: false },
);
