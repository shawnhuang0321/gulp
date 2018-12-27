const gulp = require('gulp');
var $ = require('gulp-load-plugins')();
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const minimist = require('minimist');

const envOptions = {
  string: 'env',
  default: { env: 'develop' },
}

const options = minimist(process.argv.slice(2), envOptions);
console.log(options);

gulp.task('copyHTML', () => {
  return gulp.src('./source/**/*.html')
    .pipe(gulp.dest('./public/'))
})

gulp.task('clean', () => {
  return gulp.src(['./public'], { read: false })
    .pipe($.clean());
})

// jade
gulp.task('jade', () => {
  return gulp.src('./source/**/*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      pretty: true,
    }))
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.stream())
})

// sass
gulp.task('sass', () => {
  const plugins = [
    autoprefixer({ browsers: ['last 3 version', '> 5%', 'ie 8'] }),
  ];

  return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    // 編譯完成 CSS
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === 'production', $.minifyCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream())
})

// images
gulp.task('image-min', () => {
  return gulp.src('./source/images/*')
    .pipe($.if(options.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/images'))
})

// babel
gulp.task('babel', () =>
  gulp.src('./source/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'production', $.uglify({
      compress: {
        drop_console: true,
      }
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream())
);

// browser-sync
gulp.task('browser-sync', function () {
  browserSync.init({
    server: {
      baseDir: "./public",
    }
  });
});

// watch
gulp.task('watch', () => {
  gulp.watch('./source/scss/**/*.scss', ['sass'])
  gulp.watch('./source/**/*.jade', ['jade'])
  gulp.watch('./source/js/*.js', ['babel'])
})

gulp.task('build', $.sequence('clean', 'jade', 'sass', 'babel', 'image-min'))

gulp.task('default', ['jade', 'sass', 'babel', 'image-min', 'browser-sync', 'watch']);