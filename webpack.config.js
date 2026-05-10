const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const express = require('express');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const sharp = require('sharp');
const webpack = require('webpack');

/**
 * Application root (reuse across projects):
 *   app/index.js    — webpack entry
 *   app/index.html  — HTML template
 *   app/scss/       — global Sass entry + partials
 */
const APP_DIR = path.resolve(__dirname, 'app');

/**
 * After PNG is optimized, emit responsive WebPs for hero img srcset / LCP preloads.
 */
function emitMainWebpPlugin() {
    const webpOptsDefault = { quality: 76, effort: 4 };
    const webpOptsMobile = { quality: 68, effort: 4 };
    const WIDTH_INTRINSIC = 728;
    const WIDTH_DESKTOP_MAX = 1200;

    async function resizeWebp(input, width, webpOpts = webpOptsDefault) {
        let pipeline = sharp(input).rotate();
        if (width) {
            pipeline = pipeline.resize(width, undefined, {
                withoutEnlargement: true,
                fit: 'inside',
            });
        }
        return pipeline.webp(webpOpts).toBuffer();
    }

    return {
        apply(compiler) {
            compiler.hooks.thisCompilation.tap(
                'EmitMainWebpPlugin',
                (compilation) => {
                    compilation.hooks.processAssets.tapPromise(
                        {
                            name: 'EmitMainWebpPlugin',
                            stage:
                                webpack.Compilation
                                    .PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE + 50,
                        },
                        async () => {
                            const mainPng = 'img/main.png';
                            const asset = compilation.getAsset(mainPng);
                            if (!asset) {
                                return;
                            }
                            const src = asset.source;
                            const buffer =
                                typeof src.buffer === 'function'
                                    ? src.buffer()
                                    : Buffer.from(src.source());

                            const buf480 = await resizeWebp(
                                buffer,
                                480,
                                webpOptsMobile
                            );
                            const buf728 = await resizeWebp(
                                buffer,
                                WIDTH_INTRINSIC
                            );
                            const buf1200 = await resizeWebp(
                                buffer,
                                WIDTH_DESKTOP_MAX
                            );

                            compilation.emitAsset(
                                'img/main-480.webp',
                                new webpack.sources.RawSource(buf480)
                            );
                            compilation.emitAsset(
                                'img/main-728.webp',
                                new webpack.sources.RawSource(buf728)
                            );
                            compilation.emitAsset(
                                'img/main-1200.webp',
                                new webpack.sources.RawSource(buf1200)
                            );
                        }
                    );
                }
            );
        },
    };
}

function deferExtractedCssPlugin() {
    return {
        apply(compiler) {
            compiler.hooks.compilation.tap(
                'DeferExtractedCssPlugin',
                (compilation) => {
                    HtmlWebpackPlugin.getCompilationHooks(
                        compilation
                    ).alterAssetTagGroups.tap(
                        'DeferExtractedCssPlugin',
                        (data) => {
                            data.headTags = data.headTags.map((tag) => {
                                if (
                                    tag.tagName !== 'link' ||
                                    !tag.attributes ||
                                    tag.attributes.rel !== 'stylesheet' ||
                                    !tag.attributes.href
                                ) {
                                    return tag;
                                }
                                const href = tag.attributes.href;
                                return {
                                    ...tag,
                                    attributes: {
                                        href,
                                        rel: 'preload',
                                        as: 'style',
                                        onload: "this.onload=null;this.rel='stylesheet'",
                                    },
                                };
                            });
                            return data;
                        }
                    );
                }
            );
        },
    };
}

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    const prodSourceMap =
        env &&
        (env.sourceMap === true ||
            env.sourceMap === '1' ||
            env.sourceMap === 1);

    /** Maps bundled `app.css` back to `style.css`, `respons.css`, etc. in DevTools (dev always; prod with `npm run build:map`). */
    const useCssSourceMap = !isProduction || prodSourceMap;

    /** Leave root-absolute URLs as-is (any domain; assets served from site `/img/`, etc.). */
    const cssLoaderUrlFilter = (url) => !url.startsWith('/');

    /**
     * Extract CSS in dev + prod so `url(/images/…)` and `url(/fonts/…)` hit the dev server
     * like normal requests (style-loader inlining often breaks asset URLs).
     */
    const styleLoader = MiniCssExtractPlugin.loader;

    const sassLoaderOptions = {
        sourceMap: useCssSourceMap,
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
                    sourceMap: useCssSourceMap,
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
                    sourceMap: useCssSourceMap,
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

        /** Full source maps spike Node memory on large legacy CSS trees; use `npm run build:map` if needed.
         *  Dev uses `cheap-module-source-map` so Chrome maps `app.css` rules back to `style.css` / `respons.css`. */
        devtool: isProduction
            ? prodSourceMap
                ? 'source-map'
                : false
            : 'cheap-module-source-map',

        ...(isProduction
            ? {
                  optimization: {
                      minimize: true,
                      minimizer: [
                          '...',
                          new ImageMinimizerPlugin({
                              minimizer: {
                                  implementation:
                                      ImageMinimizerPlugin.sharpMinify,
                                  options: {
                                      encodeOptions: {
                                          jpeg: {
                                              quality: 77,
                                              mozjpeg: true,
                                              progressive: true,
                                          },
                                          png: {
                                              compressionLevel: 9,
                                              quality: 78,
                                          },
                                          webp: { quality: 77, effort: 4 },
                                          gif: {},
                                          avif: { quality: 72 },
                                          tiff: { quality: 78 },
                                      },
                                  },
                              },
                              generator: [
                                  {
                                      preset: 'webp',
                                      implementation:
                                          ImageMinimizerPlugin.sharpGenerate,
                                      options: {
                                          encodeOptions: {
                                              webp: {
                                                  quality: 77,
                                                  effort: 4,
                                              },
                                          },
                                      },
                                  },
                              ],
                              test: /\.(jpe?g|png|gif|webp|avif|tiff?)$/i,
                          }),
                      ],
                  },
              }
            : {}),

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
                    /**
                     * PDFs placed directly under `app/` (e.g. Gewerbeanmeldung_*.pdf) — same root URLs in `dist/`.
                     * Runs after `app/pdf` so duplicate filenames in `app/` overwrite if both exist.
                     */
                    {
                        context: APP_DIR,
                        from: '*.pdf',
                        to: '.',
                        noErrorOnMissing: true,
                    },
                    {
                        from: path.join(APP_DIR, 'thanks.php'),
                        to: 'thanks.php',
                        noErrorOnMissing: true,
                    },
                    {
                        context: APP_DIR,
                        from: 'fav.png',
                        to: '.',
                        noErrorOnMissing: true,
                    },
                    {
                        context: APP_DIR,
                        from: '.htaccess',
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
                /** After CDN jQuery/Bootstrap/Magnific — deferred bundle runs after parse in document order. */
                inject: 'body',
                scriptLoading: 'defer',
            }),
            deferExtractedCssPlugin(),
            emitMainWebpPlugin(),
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
                /**
                 * Lighthouse / PageSpeed: avoid "cache TTL: none" on static assets during local dev.
                 * Exclude webpack HMR chunks — caching those breaks hot reload.
                 */
                middlewares.unshift({
                    name: 'umzughub-cache-headers',
                    middleware: (req, res, next) => {
                        const urlPath = (req.path || '').split('?')[0];
                        if (urlPath.includes('hot-update')) {
                            next();
                            return;
                        }
                        if (
                            urlPath.startsWith('/images/') ||
                            urlPath.startsWith('/fonts/') ||
                            urlPath.startsWith('/img/')
                        ) {
                            res.setHeader(
                                'Cache-Control',
                                'public, max-age=31536000, immutable'
                            );
                            next();
                            return;
                        }
                        if (/^\/app\.(js|css)$/.test(urlPath)) {
                            res.setHeader(
                                'Cache-Control',
                                'public, max-age=3600, must-revalidate'
                            );
                            next();
                            return;
                        }
                        if (
                            /\.(?:jpg|jpeg|png|gif|webp|svg|ico)$/i.test(urlPath)
                        ) {
                            res.setHeader(
                                'Cache-Control',
                                'public, max-age=31536000, immutable'
                            );
                        }
                        next();
                    },
                });
                /** `/foo.pdf`: prefer `app/pdf/`, then same basename under `app/` (matches CopyWebpackPlugin order). */
                middlewares.unshift({
                    name: 'umzughub-static-pdf',
                    middleware: (req, res, next) => {
                        const urlPath = (req.path || '').split('?')[0];
                        if (!urlPath.toLowerCase().endsWith('.pdf')) {
                            next();
                            return;
                        }
                        const base = path.basename(urlPath);
                        if (!base || base.includes('..')) {
                            next();
                            return;
                        }
                        const inPdfDir = path.join(APP_DIR, 'pdf', base);
                        const inAppRoot = path.join(APP_DIR, base);
                        const resolvedPdf = path.resolve(inPdfDir);
                        const resolvedRoot = path.resolve(inAppRoot);
                        const appResolved = path.resolve(APP_DIR);
                        if (
                            !resolvedPdf.startsWith(path.join(appResolved, 'pdf')) ||
                            !resolvedRoot.startsWith(appResolved)
                        ) {
                            next();
                            return;
                        }
                        if (fs.existsSync(inPdfDir) && fs.statSync(inPdfDir).isFile()) {
                            res.sendFile(inPdfDir);
                            return;
                        }
                        if (
                            fs.existsSync(inAppRoot) &&
                            fs.statSync(inAppRoot).isFile()
                        ) {
                            res.sendFile(inAppRoot);
                            return;
                        }
                        next();
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
                        maxAge: 31536000000,
                        immutable: true,
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
