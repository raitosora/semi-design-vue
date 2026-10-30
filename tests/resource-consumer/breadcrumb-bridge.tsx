import { defineVaporComponent } from "vue";
import Breadcrumb from "semi-ui-vue/breadcrumb";
export interface BreadcrumbInteropBridgeProps {
  label: string;
}
export default defineVaporComponent<
  BreadcrumbInteropBridgeProps,
  {},
  string,
  {}
>(
  (props) => (
    <Breadcrumb data-breadcrumb-interop="">
      {() => (
        <>
          <Breadcrumb.Item>{() => <slot />}</Breadcrumb.Item>
          <Breadcrumb.Item>
            {() => <span data-breadcrumb-interop-label="">{props.label}</span>}
          </Breadcrumb.Item>
        </>
      )}
    </Breadcrumb>
  ),
  { props: ["label"], inheritAttrs: false },
);
