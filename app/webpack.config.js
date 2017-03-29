var CopyWebpackPlugin = require("copy-webpack-plugin");
var webpack = require('webpack');
var distDir = __dirname + "/dist";

module.exports = {
    entry: "./client/index.tsx",
    output: {
        filename: "bundle.js",
        path: distDir
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    plugins: [
        new CopyWebpackPlugin([
                { from: "node_modules/react/dist/react.min.js", to: distDir },
                { from: "node_modules/react-dom/dist/react-dom.min.js", to: distDir },
            ]),
        new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('development')
            })
    ],
    module: {
        loaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { 
                test: /\.js$/, 
                loader: "source-map-loader" 
            },
            { 
                test: /\.tsx?$/, 
                loader: "awesome-typescript-loader?configFileName=./client/ts/tsconfig.json"
            }
        ]
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },
    target: "atom"
};
