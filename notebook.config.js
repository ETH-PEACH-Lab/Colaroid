const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: './notebook/index.tsx',
    mode: 'development',
    plugins: [
        new HtmlWebpackPlugin({
            template: './notebook/index.html',
            imageBaseUrl: `${__dirname.replace(/\\/g, '/')}/dist`,
            indexUrl: `${__dirname}/out/1`,
            filename: './notebook/index.html',
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: './**/*.css', to: '.'},
            ],
        }),
    ],
    devtool: 'eval-source-map',
    externals: {
        vscode: 'commonjs vscode', 
    },
    resolve: {
        fallback: {fs: false},
        extensions: ['.ts', '.tsx', '.js', '.json', '.svg', '.scss'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['awesome-typescript-loader'],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader?sourceMap=true',
                    'resolve-url-loader',
                    'sass-loader?sourceMap=true',
                ],
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'notebook.js',
    },
};