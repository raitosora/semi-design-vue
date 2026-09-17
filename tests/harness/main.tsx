import { createVaporApp, defineVaporComponent, ref } from "vue";
import Contracts from "../../website/examples/contracts/Protocol.vapor";
import Generic from "../../website/examples/contracts/Generic.vapor";
import { Lifecycle } from "../fixtures/Lifecycle.vapor";
import "./style.css";

const pulses = ref(0);
const disposals = ref(0);
const visible = ref(true);
const contractsMode = new URLSearchParams(location.search).has("contracts");
const app = createVaporApp(
  contractsMode
    ? defineVaporComponent(() => (
        <main>
          <Contracts />
          <Generic />
        </main>
      ))
    : defineVaporComponent(() => (
        <main>
          <h1>Semi Design Vue</h1>
          <p>Vapor compiler and lifecycle fixture</p>
          <button
            onClick={() => {
              visible.value = !visible.value;
            }}
          >
            Toggle fixture
          </button>
          <Lifecycle
            v-if={visible.value}
            label="Lifecycle fixture"
            onDispose={() => {
              disposals.value += 1;
            }}
            onPulse={() => {
              pulses.value += 1;
            }}
          />
          <output aria-label="Lifecycle totals">
            Pulses {pulses.value} / Disposals {disposals.value}
          </output>
        </main>
      )),
);
app.mount("#app");
declare global {
  interface Window {
    unmountFixture: () => void;
  }
}
window.unmountFixture = () => app.unmount();
if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
