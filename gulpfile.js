/*--------------------------------------------------------------------------
	load modules
--------------------------------------------------------------------------*/
const $ = {
	browserSync: require("browser-sync"),
	gulp: require("gulp"),
	plugins: require("gulp-load-plugins")(),
	webpack: require("webpack"),
	webpackStream: require("webpack-stream"),
	webpackConfig: require("./webpack.config")
};


/*--------------------------------------------------------------------------
	config
--------------------------------------------------------------------------*/
const PATH = {
	src: "./src/",
	dist: "./dist/"
};


/*--------------------------------------------------------------------------
	default
--------------------------------------------------------------------------*/
$.gulp.task("default", [
	"webpack",
	"sass",
	"browserSync",
	"watch"
]);


/*--------------------------------------------------------------------------
	watch
--------------------------------------------------------------------------*/
$.gulp.task("watch", () => {
	$.gulp.watch([PATH.src + "assets/css/**/*.scss"], ["sass"]);
	$.gulp.watch([
		PATH.src + "js/**/*.js",
		PATH.src + "shader/**/*.{glsl,vert,frag}"
	], ["webpack"]);
	$.gulp.watch([
		PATH.dist + "**/*.html",
		PATH.dist + "assets/css/**/*.css",
		PATH.dist + "assets/js/**/*.js",
	])
	.on("change", () => {
		$.browserSync.reload();
	});
});


/*--------------------------------------------------------------------------
	browserSync
--------------------------------------------------------------------------*/
$.gulp.task("browserSync", () => {
	$.browserSync.init({
		server: {baseDir: PATH.dist}
	});
});


/*--------------------------------------------------------------------------
	css
--------------------------------------------------------------------------*/
$.gulp.task("sass", () => {
	$.plugins.rubySass(PATH.src + "css/**/*.scss", {
		style: "compressed"
	})
		.pipe($.plugins.plumber())
		.pipe($.plugins.pleeease({
			browsers: ["last 2 version"],
			minifier: false,
			sourcemaps: false,
			mqpacker: false
		}))
		.pipe($.gulp.dest(PATH.dist + "assets/css"));
});


/*--------------------------------------------------------------------------
	webpack
--------------------------------------------------------------------------*/
$.gulp.task("webpack", () => {
	$.webpackStream($.webpackConfig, $.webpack)
		.pipe($.plugins.plumber())
		.pipe($.gulp.dest(PATH.dist + "assets/js"));
});
