import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.property.name='from'][arguments.0.value='profiles']",
          message: "When fetching OTHER members (discover/matches/chat), use supabase.from('profiles_public') so emails stay hidden. Only the current user's own profile, onboarding update, and admin moderation may use 'profiles'.",
        },
      ],
    },
  },
  {
    // Allowed places that legitimately use the base 'profiles' table.
    files: [
      "src/hooks/useProfile.ts",
      "src/pages/Onboarding.tsx",
      "src/pages/app/Admin.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
);
