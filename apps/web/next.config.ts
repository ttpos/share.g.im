import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './messages/en.json'
  }
})

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      loader: 'worker-loader',
      options: {
        filename: 'static/[name].[hash].js',
        publicPath: '/_next/'
      }
    })
    return config
  }
}

export default withNextIntl(nextConfig)
