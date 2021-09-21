const path = require('path');

module.exports = {
    target: 'node',
    entry: './src/colaroid/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    mode: 'development',
    devtool: 'source-map',
    ignoreWarnings: [{ module: /ws\/lib/}],
    externals: {
        vscode: 'commonjs vscode',
        fs: 'commonjs fs',
        crypto: 'commonjs crypto',
    },
    node: {
        __dirname: false,
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['awesome-typescript-loader'],
            },
        ],
    },
};