
module.exports.uuid = function () {
    return Number(new Date().valueOf()).toString(36);
}
