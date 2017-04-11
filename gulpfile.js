'use strict';

const autoprefixer = require('autoprefixer'),
	bourbon = require('node-bourbon').includePaths,
	browserSync = require('browser-sync').create(),
	cache = require('gulp-cache'),
	cachebust = require('gulp-cache-bust'),
	cmq = require('css-mqpacker'),
	cssnano = require('cssnano'),
	del = require('del'),
	gulp = require('gulp'),
	imagemin = require('gulp-imagemin'),
	isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "'dev'",
	notifier = require('node-notifier'),
	plumber = require('gulp-plumber'),
	pngquant = require('imagemin-pngquant'),
	postcss = require('gulp-postcss'),
	processhtml = require('gulp-processhtml'),
	rename = require('gulp-rename'),
	runSequence = require('run-sequence'),
	sass = require('gulp-sass'),
	sassGlob = require('gulp-sass-glob'),
	svgmin = require('gulp-svgmin'),
	svgSprite = require('gulp-svg-sprites'),
	webpack = require('webpack');
/*
 *   STYLES TASKS
 * */

gulp.task('sass', () => {
	const processors = [
		autoprefixer({browsers: ['> 1%', 'last 5 versions', 'not ie < 9']})
	];
	return gulp.src('./src/scss/**/*.scss')
		.pipe(plumber())
		.pipe(sassGlob())
		.pipe(sass({
			outputStyle: 'expanded',
			includePaths: bourbon
		}).on('error', sass.logError))
		.pipe(postcss(processors))
		.pipe(gulp.dest('dev/css/'))
		.pipe(browserSync.stream());
});

gulp.task('cssBuild', () => {
	const processors = [cssnano({discardComments: {removeAll: true}}), cmq()];

	return gulp.src('dev/css/**/*.css')
		.pipe(plumber())
		.pipe(postcss(processors))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest('./build/css'));

});


/*
 *   JS TASKS
 * */


gulp.task('webpack', (callback) => {


	let options = {
		entry: './src/scripts/index',
		output: {
			path: isDev ? './dev/js' : './build/js',
			filename: isDev ? 'app.js' : 'app.min.js'
		},
		watch: isDev,
		devtool: isDev ? 'eval-cheap-source-map' : null,
		watchOptions: {
			aggregateTimeout: 100
		},
		module: {
			loaders: [
				{
					test: /.js?$/,
					loader: 'babel-loader',
					exclude: /node_modules|bower_components/,
					query: {presets: ['babel-preset-latest']}
				}
			]
		},
		resolve: {
			modulesDirectories: ['node_modules', 'bower_components']
		},
		plugins: [
			new webpack.NoErrorsPlugin()
		]
	};
	if (!isDev) {

		options.plugins.push(
			new webpack.optimize.UglifyJsPlugin({
				compress: {
					// don't show unreachable variables etc
					unsafe: true,
					warnings: false
				},
				comments: false,
				mangle: true
			})
		);

	}

	webpack(options, (err, stats) => {

		if (!err) { // no hard error
			// try to get a soft error from stats
			err = stats.toJson().errors[0];
		}

		if (err) {
			notifier.notify({
				title: 'Webpack',
				message: err
			});

			console.error(err);
		} else {
			console.info(stats.toString({
				colors: true
			}));
		}

		// task never errs in watch mode, it waits and recompiles
		if (!options.watch && err) {
			callback(err);
		} else {
			// callback();
		}
	});

});


//
//    GRAPHICS TASK
//

gulp.task('images', () => {
	return gulp.src(['./dev/img/*.{jpg,jpeg,png,gif}', '!./dev/img/sprite/'])
		.pipe(
			cache(
				imagemin({
					multipass: true,
					progressive: true,
					use: [pngquant({quality: '65-80'})]
				})
			)
		)
		.pipe(gulp.dest('./build/img'));
});

gulp.task('svg', () => {
	return gulp.src('./dev/img/*.svg')
		.pipe(svgmin(
			{
				plugins: [
					{
						cleanupIDs: {
							remove: false
						}
					}
				]
			})
		)
		.pipe(gulp.dest('./build/img'));
});

/*
 SVG SPRITE
 */
gulp.task('svgSprite', () => {
	return gulp.src('./dev/img/sprite/*.svg')
		.pipe(svgSprite({
				mode: 'symbols',
				preview: false,
				selector: 'icon-%f',
				svg: {
					symbols: 'sprite.svg'
				}
			}
		))
		.pipe(gulp.dest('./dev/img/'));
});

/*
 **   HTML TASK
 * */

gulp.task('html', () => {
	return gulp.src('./dev/*.html')
		.pipe(processhtml())
		.pipe(cachebust({
			type: 'timestamp'
		}))
		.pipe(gulp.dest('./build'));
});

/**
 * SERVE & WATCH TASKS
 * */

gulp.task('serve', () => {

	browserSync.init({
		server: './dev'
	});
	gulp.watch(['./dev/**/*.*', '!./dev/img/sprite/']).on('change', browserSync.reload);
	gulp.watch('./src/scss/**/*.scss', ['sass']);
});

gulp.task('process', ['serve', 'sass', 'webpack'], () => {
});

//
// 	BUILDING TASKS
//

gulp.task('default', () => {
	gulp.start('process');
});

gulp.task('build', (cb) => {
	runSequence('clean:build',
		'copy', ['cssBuild', 'webpack', 'html', 'images'], cb);
});

/**
 * MISC TASKS
 * */

gulp.task('clean', (cb) => {
	del('build');
	return cache.clearAll(cb);
});

gulp.task('clean:build', () => {
	return del.sync(['./build/**/*', '!./build/img', '!./build/img/**/*']);
});

gulp.task('copy', () => {
	return gulp.src(['./dev/*', '!dev/img/', '!dev/scss', '!dev/scss/**/*', '!dev/css/**/*', '!dev/js/**/*'])
		.pipe(gulp.dest('./build'));
});
