import { sveltekit } from "@sveltejs/kit/vite"
import tailwindcss from "@tailwindcss/vite"
import adapter from "svelte-adapter-bun"
import { defineConfig } from "vite"

const REGEX = /[/\\]/

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(REGEX).includes("node_modules") ? undefined : true,
      },

      adapter: adapter(),

      alias: {
        $lib: "./src/lib",
        $routes: "./src/routes",
        $test: "./src/test",
      },

      typescript: {
        config: (config) => {
          config.include.push("../drizzle.config.ts")
        },
      },
    }),
  ],
})
