
module.exports.parse = function (querystring) {
    // key=value&key=value ...
    // returns Object as {key: value, ...}

    const pairs = /(\w+)=([^&]+)/g;
    const matches = querystring
        .match(pairs)
        .map(string => string.split('='))
        .map(([key, value]) => ({[key]: value}));

    const object = Object.assign.apply({}, matches);
    return object;
}
