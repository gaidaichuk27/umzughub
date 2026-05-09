const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const express = require('express');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/**
 * Application root (reuse across projects):
 *   app/index.js    — webpack entry
 *   app/index.html  — HTML template
 *   app/scss/       — global Sass entry + partials
 */
const APP_DIR = path.resolve(__dirname, 'app');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    const prodSourceMap =
        env &&
        (env.sourceMap === true ||
            env.sourceMap === '1' ||
            env.sourceMap === 1);

    /** Leave root-absolute URLs as-is (any domain; assets served from site `/img/`, etc.). */
    const cssLoaderUrlFilter = (url) => !url.startsWith('/');

    /**
     * Extract CSS in dev + prod so `url(/images/…)` and `url(/fonts/…)` hit the dev server
     * like normal requests (style-loader inlining often breaks asset URLs).
     */
    const styleLoader = MiniCssExtractPlugin.loader;

    const sassLoaderOptions = {
        sourceMap: !isProduction,
        sassOptions: {
            includePaths: [path.join(APP_DIR, 'scss')],
        },
    };

    const sassModuleRule = {
        test: /\.module\.s[ac]ss$/i,
        use: [
            styleLoader,
            {
                loader: 'css-loader',
                options: {
                    modules: true,
                    localIdentName: isProduction
                        ? '[hash:base64:8]'
                        : '[path][name]__[local]--[hash:base64:5]',
                    sourceMap: !isProduction,
                    importLoaders: 1,
                    url: { filter: cssLoaderUrlFilter },
                    esModule: false,
                },
            },
            {
                loader: 'sass-loader',
                options: sassLoaderOptions,
            },
        ],
    };

    const sassGlobalRule = {
        test: /\.s[ac]ss$/i,
        exclude: /\.module\.s[ac]ss$/i,
        use: [
            styleLoader,
            {
                loader: 'css-loader',
                options: {
                    sourceMap: !isProduction,
                    importLoaders: 1,
                    url: { filter: cssLoaderUrlFilter },
                    esModule: false,
                },
            },
            {
                loader: 'sass-loader',
                options: sassLoaderOptions,
            },
        ],
    };

    return {
        mode: argv.mode || 'development',

        entry: {
            app: path.join(APP_DIR, 'index.js'),
        },

        resolve: {
            alias: {
                '@': APP_DIR,
            },
        },

        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/',
            clean: isProduction,
        },

        /** Full source maps spike Node memory on large legacy CSS trees; use `npm run build:map` if needed. */
        devtool: isProduction
            ? prodSourceMap
                ? 'source-map'
                : false
            : 'eval-cheap-module-source-map',

        module: {
            rules: [
                sassModuleRule,
                sassGlobalRule,
                {
                    test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: isProduction
                            ? 'images/[name].[hash:8][ext]'
                            : 'images/[name][ext]',
                    },
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: isProduction
                            ? 'fonts/[name].[hash:8][ext]'
                            : 'fonts/[name][ext]',
                    },
                },
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                },
            ],
        },

        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(APP_DIR, 'img'),
                        to: 'img',
                        noErrorOnMissing: true,
                    },
                    /**
                     * Root URLs like `/datenschutzerklerung.pdf` — flatten `app/pdf/*.pdf` into `dist/`.
                     */
                    {
                        context: path.join(APP_DIR, 'pdf'),
                        from: '*.pdf',
                        to: '.',
                        noErrorOnMissing: true,
                    },
                ],
            }),
            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: '[id].css',
            }),
            new HtmlWebpackPlugin({
                template: path.join(APP_DIR, 'index.html'),
                /** After CDN jQuery/Bootstrap/Magnific at bottom of template — matches legacy PHP script order. */
                inject: 'body',
                scriptLoading: 'blocking',
            }),
        ],

        watchOptions: {
            ignored: /node_modules/,
            aggregateTimeout: 300,
        },

        devServer: {
            port: 8080,
            host: 'localhost',
            /**
             * Serve `app/img` at `/img` via Express so `<img src="/img/logo.png">` always works
             * regardless of webpack-dev-server static quirks on Windows.
             */
            setupMiddlewares: (middlewares) => {
                /** Root-level PDFs (`/foo.pdf`) from `app/pdf/` — same as production static deploy. */
                middlewares.unshift({
                    name: 'umzughub-static-pdf',
                    middleware: (req, res, next) => {
                        if (!req.path.toLowerCase().endsWith('.pdf')) {
                            next();
                            return;
                        }
                        express.static(path.join(APP_DIR, 'pdf'), {
                            etag: true,
                            index: false,
                            fallthrough: true,
                        })(req, res, next);
                    },
                });
                /** Serve before webpack middleware so `/img/*` is never answered as HTML. */
                middlewares.unshift({
                    name: 'umzughub-static-img',
                    path: '/img',
                    middleware: express.static(path.join(APP_DIR, 'img'), {
                        etag: true,
                        index: false,
                        fallthrough: false,
                    }),
                });
                return middlewares;
            },
            static: false,
            historyApiFallback: false,
            compress: true,
            open: true,
            hot: true,
            liveReload: true,
            client: {
                overlay: {
                    errors: true,
                    warnings: false,
                },
            },
            devMiddleware: {
                publicPath: '/',
            },
        },

        stats: isProduction ? 'normal' : 'minimal',

        performance: {
            hints: isProduction ? 'warning' : false,
        },
    };
};
