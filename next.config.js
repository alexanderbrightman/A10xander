const webpack = require('webpack')
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for three.js and react-globe.gl
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
      
      // Replace missing three.js optional imports with stubs
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^three\/webgpu$/,
          path.resolve(__dirname, 'lib/webpack-stubs/three-webgpu-stub.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^three\/tsl$/,
          path.resolve(__dirname, 'lib/webpack-stubs/three-tsl-stub.js')
        )
      )
      
      // Also handle the case where it's imported as a relative path from three
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /node_modules\/three\/webgpu/,
          path.resolve(__dirname, 'lib/webpack-stubs/three-webgpu-stub.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /node_modules\/three\/tsl/,
          path.resolve(__dirname, 'lib/webpack-stubs/three-tsl-stub.js')
        )
      )
    }
    
    return config
  },
}

module.exports = nextConfig

