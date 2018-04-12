# gren - modern json grepper

inspired by [gron](https://www.npmjs.com/package/gron) and [jq.node](https://www.npmjs.com/package/jq.node)

## usage

    gren [flags] <source>

      -f <regex>   filter flattened json by specified regex
      -g <path>    get value in JSON at specified path
      -u           unflatten output - display JSON

examples

    $ gren package.json -f 'de(vDe)?pendencies'
    json.dependencies = {};
    json.dependencies["json-colorizer"] = "^1.1.0";
    json.dependencies.bent = "^1.1.0";
    json.dependencies.chalk = "^2.3.2";
    json.dependencies.lodash = "^4.17.5";
    json.dependencies.minimist = "^1.2.0";
    json.devDependencies = {};
    json.devDependencies.jest = "^22.4.3";

    $ gren package.json -f gren
    json.bin.gren = "bin/gren";
    json.main = "bin/gren";
    json.name = "gren";

    $  gren package.json -f gren -u
    {
      "bin": {
        "gren": "bin/gren"
      },
      "main": "bin/gren",
      "name": "gren"
    }

    $ gren package.json -g version
    0.0.1

    $ gren package.json -g bin.gren
    bin/gren

