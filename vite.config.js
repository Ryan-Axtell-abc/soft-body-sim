import {defineConfig} from "vite";
import {ViteEjsPlugin} from "vite-plugin-ejs";

export default defineConfig({
  plugins: [
    // Without Data
    ViteEjsPlugin(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        carlevel: './car-level.html'
      }
    }
  }
});

