[![NPM version][npm-image]][npm-url]

A gulp task for updating your local dependencies installed by [jspm-local](https://github.com/Netatwork-de/jspm-local) endpoint.
It monitors the project directories of local dependencies for changes. When a change is detected, the local dependencies are updated using [gulp-jspm-local](https://github.com/Netatwork-de/gulp-jspm-local).

Combined with [gulp-watch](https://www.npmjs.com/package/gulp-watch), this can be used to recompile the main solution whenever a dependency changes.

## Installation

Install `gulp-overwatch` using npm into your global or local repository.

```bash
npm install gulp-overwatch --save-dev
```
## Usage

Setup a gulp task `overwatch` using this code:

```js
var gulp = require('gulp');
var overwatch = require('gulp-overwatch');
var browserSync = require('browser-sync');

gulp.task('_overwatch', function() {
	return overwatch.watchProjects(browserSync.reload);
});

gulp.task('overwatch', ['_overwatch', 'watch']);
```


## License

[Apache 2.0](/LICENSE)

[npm-url]: https://npmjs.org/package/gulp-overwatch
[npm-image]: http://img.shields.io/npm/v/gulp-overwatch.svg
