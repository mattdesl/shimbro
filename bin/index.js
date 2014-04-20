var optimist = require('optimist')
		.usage('Adds shims to browserify-shim field.\nUsage: $0 [modules]')
		.alias('h', 'help')
		.describe('h', 'show help message')
		.alias('b', 'bower')
		.describe('b', 'detect using bower dependencies')
		.alias('o', 'only')
		.describe('o', 'only checks matched bower packages, comma-separated')
		.alias('i', 'ignore')
		.describe('i', 'comma-separated ignores for --bower dependencies')
		// .alias('f', 'bowerFile')
		// .describe('f', 'path to bower file')
		// .default('f', './bower.json')
		.alias('c', 'components')
		.describe('c', 'path to bower_components')
		.default('c', 'bower_components')
		.alias('d', 'dir')
		.default('d', '.')
		.describe('d', 'base directory');

var argv = optimist.argv;

var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var detect = require('./detect');

function hasTransform(transforms, key) {
	for (var i=0; i<transforms.length; i++) {
		var t = transforms[i];
		//Case 1: element is just a string to the transform
		if (typeof t === "string" && t == key)
			return true;
		//Case 2: element is a sub array with the transform as index 0
		else if (t[0] == key) {
			return true;
		}
	}
	return false;
}

function addTransformField(pkg) {
	var TRANSFORM = 'browserify-shim';

	//if no 'browserify' field is present
	if (!pkg.browserify) {
		pkg.browserify = {
			'transform': [TRANSFORM]
		};
	} 
	//if the field is present but has no 'transform' config
	else if (!pkg.browserify.transform) {
		pkg.browserify.transform = [TRANSFORM];	
	}
	//if the field is present and already has a 'transform' config
	else {
		var trs = pkg.browserify.transform;

		//There are a couple different cases for the 'transform' config:
		//	1. a single string
		//	2. an array of transforms, each of which can be either:
		//		A: another string
		//		B: an array with the first element being the transform name

		//if it's just a string, make it into an array
		if (typeof trs === 'string') {
			trs = [ trs ];
		}

		if (!Array.isArray(trs))
			throw "browserify 'transform' config is not a string or array";

		//now add 'browserify-shim' if it's not already present
		if (!hasTransform(trs, TRANSFORM)) 
			trs.push(TRANSFORM);

		//and update the package
		pkg.browserify.transform = trs;
	}
}

function removeAlias(pkg, alias) {
	if (pkg.browser && pkg.browser[alias])
		delete pkg.browser[alias];
}

function addAlias(pkg, alias, file) {
	if (!pkg.browser) {
		pkg.browser = {};
	}
	file = path.normalize( path.join( argv.d, file ) );


	//TODO: this is hack. browserify-shim should work without a leading period
	if (file.indexOf('.') !== 0)
		file = "."+path.sep+file;

	pkg.browser[alias] = file;
}

function addShims(pkg, args) {
	var FIELD = 'browserify-shim';

	//make the field if it doesn't exist
	if (!pkg[FIELD])
		pkg[FIELD] = {};

	var shims = pkg[FIELD];

	if (typeof shims === "string")
		throw "shim config file not supported";

	//only add or update the necessary shims..
	for (var i=0; i<args.length; i++) {
		//If it's a string, treat as global
		if (typeof args[i] === "string") {
			var a = args[i];
			var arr = a.split(':');
			var key = arr[0];
			var exports = arr[1];
			
			shims[key] = "global:" + (exports||key);
		} 
		//otherwise assume its a Shim object from detect.js
		else {
			var shim = args[i];
			var key = shim.alias;

			if (shim.file)
				addAlias(pkg, shim.alias, shim.file);
			else
				removeAlias(pkg, shim.alias);

			shims[key] = key;

			//if we have no dependencies, we might be able to just use a string...
			if (!shim.dependencies || shim.dependencies.length === 0) {
				if (shim.exports)
					shims[key] = shim.exports;	
			} else {
				shims[key] = {};

				shims[key].depends = shim.dependencies;
				
				if (shim.exports)
					shims[key].exports = shim.exports;
			}	

		}
	}
}

function shim(jsonPath, args) {
	var file = fs.readFileSync(jsonPath);
	var pkg = JSON.parse(file);

	//add browserify, transform, and browserify-transform (if needed) to JSON
	addTransformField(pkg);

	//add the shims in
	addShims(pkg, args);

	//surprisingly NPM init etc. just seem to use a hard-coded indentation
	fs.writeFile(jsonPath, JSON.stringify(pkg, undefined, 2));

	console.log(chalk.bgGreen("Successfully updated package.json"));
}

function start(shims) {
	var file = path.join( argv.d, 'package.json' );
	shim(file, shims)
}

if (require.main === module) {
	if (argv.help) {
		console.log(optimist.help());
	} else {
		if (!argv.bower && argv._.length===0) {
			console.log(chalk.green("Added empty shim fields to package.json\nUse -h for help."));
		}

		var globalShims = argv._;

		if (!fs.existsSync( path.join(argv.d, 'package.json') )) {
			console.log(chalk.red("Couldn't find package.json at directory "+argv.d));
		} else {
			if (argv.bower) {
				var ignore = (argv.ignore||"").split(",");
				var only = (argv.only||"").split(",");
				detect({ 
					only: only,
					ignore: ignore,
					directory: argv.components,
					bowerJson: argv.bowerFile,
				}, function(shims) {
					start( shims.concat(globalShims) );
				});
			} else {
				start(globalShims);
			}
		}
	}
		
}

module.exports = shim;
