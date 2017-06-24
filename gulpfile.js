/* eslint-disable quotes, new-cap, max-len, one-var, no-invalid-this, padded-blocks */

let gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    plumber = require('gulp-plumber'),
    gutil = require('gulp-util'),
    livereload = require('gulp-livereload');
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    del = require('del');


gulp.task('develop', function() {
  livereload.listen();
  nodemon({
    script: 'app.js',
    ext: 'js coffee ejs',
    stdout: false,
    env: {'NODE_ENV': 'development', 'PORT': '3000', 'REDIS_URL': 'redis://h:p22fad4700c45fa29f34c04f1101c818cd68c835161a09da4beb6cf4a33334cfb@ec2-34-206-77-235.compute-1.amazonaws.com:41999',
      'MONGODB_URI': 'mongodb://heroku_l2sh3rqr:kh61lmnt0g4fp1gq8dvhects85@ds151941.mlab.com:51941/heroku_l2sh3rqr',
      'ADMIN_PASS': 'cGFzc3dvcmQ=', 'COOKIE_NAME': 'D761396384741FE3E8BD3A3721EE1',
    },
  }).on('readable', function() {
    this.stdout.on('data', function(chunk) {
      if(/^Express server listening on port/.test(chunk)) {
        livereload.changed(__dirname);
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
});

// style

gulp.task('styles', function() {
  return gulp.src('public/css/*.css')
    .pipe(gulp.dest('public/dist/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(cssnano())
    .pipe(gulp.dest('public/dist/css'))
    .pipe(notify({message: 'Styles task complete'}));
});

// scripts
gulp.task('scripts', function() {
  return gulp.src('public/js/*.js')
    .pipe(plumber(function(error) {
                gutil.log(error.message);
                this.emit('end');
    }))
    .pipe(gulp.dest('public/dist/js'))
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    // .pipe(concat('main.js'))
    // .pipe(gulp.dest('public/dist/js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('public/dist/js'))
    .pipe(notify({message: 'Scripts task complete'}));
});

// images
gulp.task('images', function() {
  return gulp.src('public/img/*.{jpeg,jpg,png,svg}')
    .pipe(imagemin({optimizationLevel: 3, progressive: true, interlaced: true, svgoPlugins: [{removeViewBox: true}]}))
    .pipe(gulp.dest('public/dist/img'))
    .pipe(notify({message: 'Images task complete'}));
});

// clean
gulp.task('clean', function() {
    return del(['public/dist/css', 'public/dist/js', 'public/dist/img']);
});

// run
gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts', 'images', 'watch', 'develop');
});

// Watch
gulp.task('watch', function() {
  // Watch .css files
  gulp.watch('public/css/*.css', ['styles']);

  // Watch .js files
  gulp.watch('public/js/*.js', ['scripts']);

  // Watch image files
  gulp.watch('public/img/*', ['images']);

  // Create LiveReload server
  livereload.listen();

  // Watch any files in dist/, reload on change
  gulp.watch(['public/dist/**']).on('change', livereload.changed);

  gulp.watch(['socket/**']).on('change', livereload.changed);

});

// gulp.task('default', [
//   'develop'
// ]);
