var parser = require('xml-js');
var myParser = {};

/**
 * The main function
 * @param  {string}  xml    xml which needs to be parsed
 * @param  {object} [xmlns] contains all namespaces
 * @return {object}         parsed js object
 */
myParser.xml2js = function (xml, xmlns) {
    var parsed = parser.xml2js(xml, {
        compact: true
    });

    if (xmlns) {
        // Keep Namespace
        parsed = keepNamespace(parsed, xmlns);
    }

    parsed = cleanseJson(parsed);
    return parsed;
};

/**
 * Keeps the namespace
 * @param  {object} json In which to replace namespace
 * @param  {object} ns   Namespace object
 * @return {object}      Namespace replaced object
 */
function keepNamespace(json, ns) {
    var nsKeys = Object.keys(ns);

    for (var key in json) {
        var parseKey = parseKeyNS(key);
        if (key.indexOf(':') > -1 && nsKeys.indexOf(parseKey) > -1) {
            var index = nsKeys.indexOf(parseKey);
            var prop = '{' + ns[nsKeys[index]] + '}' + key.split(':')[1];

            json[prop] = json[key];
            json[prop] = recursiveNS(json[prop], ns);
        } else {
            json[key] = recursiveNS(json[key], ns);
        }
    }

    json = deleteDuplicates(json, ns);
    return json;
}

/**
 * Intermediate of keepNamespace()
 */
function deleteDuplicates(json, ns) {
    var ret = {};
    var nsKeys = Object.keys(ns);
    if (json.constructor === Array) {
        ret = [];
    }

    if (typeof(json) !== 'object') {
        return json;
    }

    for (var key in json) {
        if (json.constructor === Array) {
            ret.push(recursiveDeleteDuplicates(json[key], ns));
        }
        else {
            var parseKey = parseKeyNS(key);
            if (parseKey && nsKeys.indexOf(parseKey) === -1) {
                ret[key] = recursiveDeleteDuplicates(json[key], ns);
            }
        }
    }
    return ret;
}

/**
 * This function removes the "_text" attribute introduced by the XML parser
 * For more info, check the NPM page of "xml-js", and see response format of the parser
 * @param  {object} json object to cleanse
 * @return {object}      cleaned object
 */
function cleanseJson(json) {
    for (var key in json) {
        var a = recursiveCleanse(json[key]);
        json[key] = a;
    }
    return json;
}

/**
 * HELPER FOR keepNamespace()
 */
function recursiveNS(json, ns) {
    if (typeof(json) !== 'object') {
        return json;
    }
    var nsKeys = Object.keys(ns);

    for (var key in json) {
        var parseKey = parseKeyNS(key);
        if (key.indexOf(':') > -1 && nsKeys.indexOf(parseKey) > -1) {
            var index = nsKeys.indexOf(parseKey);
            var prop = '{' + ns[nsKeys[index]] + '}' + key.split(':')[1];

            json[prop] = json[key];
            json[prop] = recursiveNS(json[prop], ns);
        } else {
            json[key] = recursiveNS(json[key], ns);
        }
    }
    return json;
}

/**
 * HELPER FOR deleteDuplicates()
 */
function recursiveDeleteDuplicates(json, ns) {
    if (typeof(json) !== 'object') {
        return json;
    }

    var nsKeys = Object.keys(ns);
    var ret = {};
    if (json.constructor === Array) {
        ret = [];
    }
    for (var key in json) {
        if (json.constructor === Array) {
            ret.push(recursiveDeleteDuplicates(json[key], ns));
        }
        else {
            var parseKey = parseKeyNS(key);
            if (parseKey && nsKeys.indexOf(parseKey) === -1) {
                ret[key] = recursiveDeleteDuplicates(json[key], ns);
            }
        }
    }
    return ret;
}

/**
 * HELPER FOR cleanseJson()
 */
function recursiveCleanse(json) {
    if (typeof(json) !== 'object') {
        return json;
    }

    for (var key in json) {
        if (key === '_text') {
            return json[key];
        }
        json[key] = recursiveCleanse(json[key]);
    }
    return json;
}

/**
 * parses a key from d: to d and {DAV:} to DAV
 * @param  {string} key key to be parsed
 * @return {string}     parsed key
 */
function parseKeyNS(key) {
    var parseKey = key;
    if (parseKey.indexOf('{') > -1 && parseKey.indexOf('}') > -1) {
        parseKey = parseKey.split('{')[1].split('}')[0];
    } else if (parseKey.indexOf(':') > -1) {
        parseKey = parseKey.split(':')[0];
    }

    return parseKey;
}

module.exports = myParser;
