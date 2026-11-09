import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { initAnalytics } from "./services/analytics";

initAnalytics();

createApp(App).use(router).mount("#app");
