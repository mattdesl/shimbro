## shimbro

A tiny browserify-shim helper tool.

## purpose

Nobody wants to edit JSON manually! Save a couple of key-strokes and the pain of JSON typos by running `shimbro` from your module directory.

```shimbro three:THREE jquery:$ TweenLite```

This will add `browserify-shim` as a browserify transform, and then add or update the given shims.

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

## bower dependencies

If you run with the `--bower` or `-b` argument, an interactive session will be run to try and shim out your bower dependencies. 