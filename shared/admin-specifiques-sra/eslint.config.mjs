// eslint.config.mjs (ESLint v9+)
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import jsLint from '@eslint/js';
import tsLint from 'typescript-eslint';
// general plugins
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier';
// react plugins
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHookPlugin from 'eslint-plugin-react-hooks';
// airbnb configs
import { configs as xtremConfig } from '@sage/eslint-config-xtrem';
import mochaPlugin from 'eslint-plugin-mocha';
import unicornPlugin from 'eslint-plugin-unicorn';
import xtremPlugin from '@sage/eslint-plugin-xtrem';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import redosPlugin from '@sage/eslint-plugin-redos';
import nodePlugin from 'eslint-plugin-n';
import stylistic from '@stylistic/eslint-plugin';

const airbnbConfig = xtremConfig.airbnb;
const airbnbTypescriptConfig = xtremConfig['airbnb-typescript'];

// Ensure the rules are applied only to TypeScript files
const tsOnlyConfig = cfg => {
    if (Array.isArray(cfg)) {
        return cfg.map(c => tsOnlyConfig(c));
    }
    if (cfg.rules) {
        return { files: ['**/*.{ts,tsx,mts,cts}'], ...cfg };
    }
    return cfg;
};

const artifactFiles = [
    'lib/pages/**/*.{ts,tsx}',
    'lib/widgets/**/*.{ts,tsx}',
    'lib/page-extensions/**/*.{ts,tsx}',
    'lib/page-fragments/**/*.{ts,tsx}',
    'lib/stickers/**/*.{ts,tsx}',
    'api/api.d.ts',
    'lib/menu-items/**/*.{ts,tsx}',
    'lib/client-functions/**/*.{ts,tsx}',
    'lib/shared-functions/**/*.{ts,tsx}',
];

export default defineConfig([
    globalIgnores(['build/**', 'tmp/**', 'node_modules/**', '**/coverage', '**/i18n/*.json']),
    {
        files: artifactFiles,
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        ignores: artifactFiles,
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // js recommended syntax rules
    jsLint.configs.recommended,

    ...tsOnlyConfig([
        // TS recommended syntax rules
        ...tsLint.configs.recommended,
        // Type checked rules including promise rules
        ...tsLint.configs.recommendedTypeChecked,
    ]),
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,

    // React and JSX recommended rules
    jsxA11yPlugin.flatConfigs.recommended,
    reactPlugin.configs.flat.recommended,
    //reactPlugin.configs.flat.all,
    reactPlugin.configs.flat['jsx-runtime'],
    reactHookPlugin.configs['recommended-latest'],

    // Turns off all rules that are unnecessary or might conflict with Prettier.
    // We may need to run prettier --check or prettier --write
    // on the codebase before running eslint to ensure that the code is formatted correctly.
    eslintConfigPrettier,

    // code style rules
    stylistic.configs['disable-legacy'],
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,jsx,tsx}'],
        rules: {
            // Airbnb rules
            ...airbnbConfig.rules,

            '@stylistic/semi': 'error',
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],

            // To reenable the filename case rule
            // 'unicorn/filename-case': [
            //     'error',
            //     {
            //         case: 'kebabCase',
            //     },
            // ],
        },
    },
    {
        files: ['**/*.{ts,mts,cts,tsx}'],
        rules: {
            // Airbnb rules
            ...airbnbTypescriptConfig.rules,

            // TODO: reenable these rules later
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',

            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            // '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unnecessary-type-constraint': 'off',

            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'typeLike',
                    format: ['StrictPascalCase'],
                },
            ],

            // TypeScript files don't need no-undef since TypeScript handles type checking
            'no-undef': 'off',
            'no-underscore-dangle': 'off',
            // we never use default export
            'import/prefer-default-export': 'off',
            // allow cycles in dependencies for now
            'import/no-cycle': 'off',
            // this rule detects bad imperative style so we should fix the code
            'no-param-reassign': ['error', { props: false }],
            'arrow-body-style': 'off',

            '@typescript-eslint/no-use-before-define': 'off',
        },
    },

    {
        files: ['lib/**/*.ts', 'test/**/*.ts'],
        rules: {
            '@sage/xtrem/sql-compatible': 'error',
            '@sage/xtrem/call-super-in-control': 'error',
            'unused-imports/no-unused-imports': 'error',
            'no-await-in-loop': 'off',
            'no-async-promise-executor': 'error',
            'no-promise-executor-return': 'error',
            'no-return-await': 'error',
            'require-await': 'error',
            'prefer-promise-reject-errors': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/await-thenable': 'error',
            'react/forbid-prop-types': 'off',
        },
    },
    {
        files: ['test/**/*.ts'],
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: true,
                },
            ],
        },
    },
    {
        files: ['lib/{pages,page-extensions,stickers}/**/*.ts'],
        rules: {
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            'require-await': 'off',
            '@typescript-eslint/await-thenable': 'off',
            'no-promise-executor-return': 'off',
            'no-return-await': 'off',
        },
    },

    // other plugins
    {
        plugins: {
            mocha: mochaPlugin,
            unicorn: unicornPlugin,
            '@sage/xtrem': xtremPlugin,
            'unused-imports': unusedImportsPlugin,
            '@sage/redos': redosPlugin,
            n: nodePlugin,
            '@stylistic': stylistic,
        },
    },
    {
        files: ['**/*.js'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    // config envs
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },
]);
