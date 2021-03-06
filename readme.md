## shimbro

A tiny [browserify-shim](https://github.com/thlorenz/browserify-shim) helper tool.

## install

Since it's meant to be used as a command-line tool, it's easiest to install and use it globally:

```npm install shimbro -g```

## purpose

Nobody wants to edit JSON manually! Run `shimbro` from your module directory to add browserify-shim fields automatically.

## simple usage

The simplest use will shim a space-separated list of modules using the "global" feature.

```shimbro three:THREE jquery:$ TweenLite```

This will add `browserify-shim` as a browserify transform, and then add or update the given shims. The package.json will now contain:

```json
  "browserify": {
    "transform": [
      "browserify-shim"
    ]
  },
  "browserify-shim": {
    "three": "global:THREE",
    "jquery": "global:$",
    "TweenLite": "global:TweenLite"
  }
```

If you run it with no arguments, it will add the above with an empty object for `browserify-shim`. 

## bower dependencies

If you run with the `--bower` or `-b` argument, an interactive session will be run to try and shim out your bower dependencies. This assumes you already have a `bower.json` file.

So a typical usage when setting up your browserify repo might look like this:
```
bower init
bower install jquery threejs gsap fastclick --save
shimbro -b --ignore gsap,fastclick
```

This will walk through the JS files in each bower dependency, and prompt you for the alias and export of that module. Some common libraries (jquery, threejs) will already have the export object declared by default. Here's an example of the interactive session:

![screen](http://i.imgur.com/XbkS17T.png)

In the above example, jQuery will be shimmed into the browserify bundle as per usual. However, since I specified `global:` for the THREE.js export, it will not be included in the bundle, but instead will be assumed to already be attached to the window object. This is useful to keep build times fast, and also make use of the CDN for THREE.js. The resulting package.json modifications:

```json
  "browserify": {
    "transform": [
      "browserify-shim"
    ]
  },
  "browserify-shim": {
    "jquery": "$",
    "three": "global:THREE"
  },
  "browser": {
    "jquery": "./bower_components/jquery/dist/jquery.js"
  }
```

Now, in your code:

```js
var $ = require('jquery');
var THREE = require('three');
```

## usage/options

Usage:
```
shimbro [options] [globals]
```

Options:
- `-h, --help`: show help message and quit
- `-b, --bower`: detect using bower.json dependencies
- `-r, --reset`: reset the `browser` and `browserify-shim` fields before adding new entries (by default, we only add to them or update existing aliases)
- `-i, --ignore`: a comma-separated list of globs for bower package names to ignore
- `-o, --only`: a comma-separated list of globs for bower package names; if specified, only these will be shimmed.
- `-c, --components`: override the path to bower_components
- `-d, --dir`: override the default base directory

## advanced overrides

This project uses `wiredep` to determine the bower dependencies, so it will fail on bower packages that don't specify a `main` field (or use incorrect formatting, like a wildcard). You may see an error about a file "not being injected" -- this means that `wiredep` couldn't find the main JS file for that package.

To remedy this, you can specify [overrides](https://github.com/taptapship/wiredep#bower-overrides) in your bower.json. This is also useful for shimming particular module(s) for large bower packages.

Here's an example of an override for [GSAP](https://github.com/greensock/GreenSock-JS). This lets us shim only TweenLite and TimelineLite, rather than the default TweenMax. 

```json
  "overrides": {
    "gsap": {
      "main": [
        "./src/uncompressed/TweenLite.js",
        "./src/uncompressed/TimelineLite.js"
      ]
    }
  }
```

You can then use shimbro to shim in both of these modules under different aliases.