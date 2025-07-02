import antfu from '@antfu/eslint-config'

export default antfu(
  {
    react: true,
    typescript: true,
  },
  {
    ignores: [
      '.next/*',
      'node_modules/*',
      'apps/web/.next/*',
      'apps/web/node_modules/*',
      'packages/ui/src/components/ui/*',
      '**/constants-generated.ts',
    ],
  },
)

// export default antfu(
//   {
//     formatters: true,
//     ignores: [
//       '**/.nuxt/**',
//       '**/cache',
//       '**/dist',
//       '**/.temp',
//       '**/*.svg',
//       '**/*.md',
//       '**/*.toml',
//       '.next/*',
//       'node_modules/*',
//       'apps/web/.next/*',
//       'apps/web/node_modules/*',
//       'packages/ui/src/components/ui/*',
//       '**/constants-generated.ts',
//     ],
//   },
// )
