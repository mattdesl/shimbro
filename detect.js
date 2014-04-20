var wiredep = require('wiredep');
var path = require('path');
var inquirer = require('inquirer');
var _ = require('underscore');
var chalk = require('chalk');
var minimatch = require('minimatch');

//Looks like you have a few Bower JS dependencies!

var common = {
	'jquery': '$',
	'threejs': 'THREE',
	'underscore': '_',
	'lodash': '_',
	'zepto': '$',
};
var commonDependencyExports = {
	'jquery': 'jQuery'
}

function run(options, stack, shims, callback) {
	if (stack.length === 0) {
		if (callback)
			callback(shims);
		return;
	}

	var item = stack.shift();
	if (!item) {
		run(options, stack, shims, callback);
		return;
	}

	var pkgName = item.name,
		file = item.file,
		pkg = item.pkg,
		fileBase = path.basename(file),
		dirBase = path.dirname(file);

	console.log(chalk.bgGreen(pkgName), chalk.grey(dirBase+path.sep)+chalk.bold.grey(fileBase));


	var firstQ = { 
		name: 'allow',
		message: "Should I shim this file?",
		default: true,
		type: 'confirm'
	};

	var otherQ = [
		{
			name: 'alias',
		 	message: 'What is the alias for this module?',
		 	default: pkgName
		},
		{
			name: 'exports',
			message: 'What does this module export to window?',
			default: function(answers) {
				if (answers.alias && answers.alias in common)
					return common[answers.alias];
			}
		}
	];

	
	for (var k in pkg.dependencies) {
		otherQ.push({
			message: 'What does the '+chalk.bgGreen(k)+' dependency export to window?',
			name: 'dependency_'+k,
			default: function(dep, answers) {
				if (dep in commonDependencyExports)
					return commonDependencyExports[dep];
				else if (dep in common)
					return common[dep]
			}.bind(this, k)
		});
	}



	inquirer.prompt(firstQ, function(answers) {
		if (!answers.allow) {
			console.log(chalk.red("Ignoring"), chalk.bold.red(fileBase), "\n");
			run(options, stack, shims, callback);
		} else {
			inquirer.prompt(otherQ, function(answers) {
				var shim = {
					alias: answers.alias,
					exports: answers.exports,
					dependencies: extractDependencies(answers),
					file: file,
				};
				shims.push(shim);

				//If we want to expose using window.* then just ignore the file path
				if (shim.exports.indexOf("global:") === 0) {
					shim.file = undefined;
				}

				console.log("\n");
				run(options, stack, shims, callback);
			});
		}
	});

	// var old = Object.keys(window).length;
	// require(path);
	// console.log(old, "->", Object.keys(window).length);
}

function extractDependencies(answers) {
	var deps = [];
	for (var k in answers) {
		if (k.indexOf('dependency_') === 0) {
			var alias = k.substring('dependency_'.length);
			var exports = answers[k];
			if (!exports || exports == alias)
				deps.push(alias);
			else
				deps.push(alias+":"+exports);
		}
	}
	return deps;
}

function isMatch(packageName, matches) {
	if (!matches)
		return false;
	if (typeof matches === "string")
		matches = [ matches ];
	for (var i=0; i<matches.length; i++) {
		if ( minimatch(packageName, matches[i]) )
			return true;
	}
	return false;
}

function detect(options, callback) {
	var prompts = [];
	var paths = wiredep(options);
	var pkgCount = 0;

	var shims = [];
	
	var only = options.only;
	if (!only || only.length===0 || (only.length===1&&!only[0]) )
		only = undefined;

	for (var k in paths.packages) {
		var pkg = paths.packages[k];

		//if the package was ignored by the user
		if (isMatch(k, options.ignore))
			continue;

		//if we've specified "only" field and it doesn't match...
		if (only && !isMatch(k, only)) {
			continue;
		}

		if (pkg.type.indexOf('.js') !== -1) {
			pkgCount++;

			//get all JS files
			var jsFiles = pkg.main.filter(function(file) {
				return path.extname(file) === '.js'
			});

			jsFiles.forEach(function(file) {
				prompts.push( { name: k, file: file, pkg: pkg } );
			});
		}
	}

	var depCount = Object.keys(paths.packages).length,
		deps = (depCount===1 ? "dependency" : "dependencies");
	var str;
	if (depCount === pkgCount)
		str = "Checking "+depCount+" bower "+deps;
	else 
		str = "Checking "+pkgCount+" of "+depCount+" bower "+deps
	console.log(chalk.bgCyan(str)+"\n");

	run(options, prompts, shims, callback);
}

// if (require.main === module) {
// 	detect({
// 		// ignore: ['jquery-*', 'threejs', 'handlebars', 'fastclick', 'gsap']
// 	}, function(shims) {
// 		// console.log(shims);
// 	});
// }

module.exports = detect;