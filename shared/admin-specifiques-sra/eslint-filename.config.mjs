// This file is the filename ESLint rules (experimental)
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['build/**', 'tmp/**', 'node_modules/**', '**/coverage', '**/i18n/*.json']),
    {
        plugins: {
            unicorn,
        },
        ignores: ['**/*.js', '**/*.ts'],
        rules: {
            'unicorn/filename-case': [
                'error',
                {
                    case: 'kebabCase',
                    ignore: [/^(Jenkinsfile|Dockerfile|(CHANGELOG|README)\.md|node-\$\..+)$/],
                },
            ],
        },
    },
]);
