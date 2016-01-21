'use strict'
// Copyright 2016 Net at Work GmbH
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
let Promise = require('rsvp').Promise;
let asp = require('rsvp').denodeify;
let fs = require('graceful-fs');
let path = require('path');
let gutil = require('gulp-util');
let chokidar = require('chokidar');
let pathUtil = require('path');
var spawn = require('child_process').spawn;
var jspmLocal = require('gulp-jspm-local');

let dependencyPath = 'jspm_packages/local';

async function getPackageObjectAsync(repo) {
	let packageFile = path.resolve('..', repo + '/package.json');

	try {
    let lookupJSON = await asp(fs.readFile)(packageFile);
    return JSON.parse(lookupJSON.toString());
	}
	catch (e) {
		if (e.code == 'ENOENT' || e instanceof SyntaxError)
			return { notfound: true };
		throw e;
	}
}

async function watchProject(path, reload) {
    let packageName = path.substring(0, path.indexOf('@'));
    gutil.log("Starting watch for package", gutil.colors.yellow(packageName));

    let project = await getPackageObjectAsync(packageName);
    let projectPath = '../' + packageName;

    let files = []
    if(project.files !== undefined && project.files.length == 0){
        gutil.log("\t",project.files.length, "file(s) defined.");
        files = project.files;
    }
    else {
        gutil.log("\tNo files defined in package.json. All files are included.");
    }

		if(project.directories.lib !== undefined){
        gutil.log(`\tLib path '${project.directories.lib}' found.`);
				executeGulp(projectPath, ["watch"]);
        projectPath += '/' + project.directories.lib;
    }
    else {
        gutil.log("\tNo lib path found. Loading from root.");
    }
	projectPath = pathUtil.resolve(projectPath);
	chokidar
		.watch(`${projectPath}/**/*`, {persistent: true, awaitWriteFinish: true, ignoreInitial: true})
		.on('all', async (event, path) =>
			{
				try {
					gutil.log("Dependent pacakge ", gutil.colors.yellow(packageName), "changed. Updating dependencies.");
					await jspmLocal.updateLocalDependencies([packageName]);
					gutil.log(gutil.colors.yellow("Reloading browser..."))
					reload();
				} catch (e) {
					gutil.log(e);
				}
			});
	}

	function executeGulp(packagePath, tasks) {
	  var isWin = /^win/.test(process.platform);
	  var gulpPath = pathUtil.join(packagePath, 'node_modules', '.bin');
		gutil.log("Using gulp from " + gulpPath)
	  if (isWin) {
	    process.env.Path += ';' + gulpPath;
	  } else {
	    process.env.PATH += ':' + gulpPath;
	  }
	  gutil.log(`Processing ${packagePath}`);
	  var command = 'gulp';
		let gulpFile = pathUtil.join(packagePath, "gulpfile.js");
	  var args = ['--gulpfile=' + gulpFile].concat(tasks);

	  var opts = {
			cwd: packagePath,
	    env: process.env,
	    stdio: 'inherit',
			stderr: 'inherit'
	  }

	  if (isWin) {
	    command = 'cmd';
	    args = [
	      '/s',
	      '/c',
	      'gulp.cmd'
	    ].concat(args);

	    opts.windowsVerbatimArguments = true;
	  }

	  let gulpGulp = spawn(command, args, opts);

	  gulpGulp.on('close', function(code) {
	    var error;

	    if (code && 65 !== code) {
	      error = new gutil.PluginError("gulp-overwatch", `${gulpFile}: returned ${code}`);
				gutil.log(`${gulpFile}: returned ${code}`);
	    }
		});
	}


function isDirectory(fileName) {
    let filePath = path.resolve(dependencyPath, fileName);
    return fs.lstatSync(filePath).isDirectory();
}

export async function watchProjects(reload) {
		gutil.log("Watching local dependencies")
		let files = await asp(fs.readdir)(dependencyPath);
		await Promise.all(files.filter(isDirectory).map(p => watchProject(p, reload)));
}
