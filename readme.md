## shimbro

A tiny browserify-shim helper tool.

## install

Since it's meant to be used as a command-line tool, it's easiest to install and use it globally:
```npm install shimbro -g```

## purpose

Nobody wants to edit JSON manually! Run `shimbro` from your module directory to add browserify-shim fields automatically.

## simple

The simplest use just adds the shims using the "global" feature.

```shimbro three:THREE jquery:$ TweenLite```

This will add `browserify-shim` as a browserify transform, and then add or update the given shims. The package.json will now contain:

```
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

## detecting bower dependencies

If you run with the `--bower` or `-b` argument, an interactive session will be run to try and shim out your bower dependencies. This assumes you already have a `bower.json` file.

So a typical usage when setting up your browserify repo might look like this:
```
bower init
bower install jquery threejs gsap fastclick --save
shimbro -b
```

This will walk through the JS files in each bower dependency, and prompt you for the alias and export of that module. Some common libraries (jquery, threejs) will already have the export object declared by default. 

