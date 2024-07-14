
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';


export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { // add this object
        tsconfigRootDir: import.meta.dirname,
        project: ['./tsconfig.json'],
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off'
    },
  },
  {
    ignores: [
      'dist',
      'docs',
      'test',
      '.yarn',
      '.pnp.loader.mjs',
      '.pnp.cjs',
    ],
  }
);