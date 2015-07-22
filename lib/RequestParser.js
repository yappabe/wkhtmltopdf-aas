require("console-stamp")(console, "HH:MM:ss.l");

var exports = module.exports = {};

var body = '';
var parsedOptions = {};

function RequestParser() {
    body = '';
}

RequestParser.prototype.onData = function(data)
{
    body = body || '';
    body += data;
    if (body.length > 1e6) {
        this.request.connection.destroy();
    }
}

RequestParser.prototype.onEnd = function(callback)
{
    var jsonData;

    try {
        jsonData = JSON.parse(body);
    } catch (e) {
        return callback(e, null);
    }

    var options = jsonData.options;
    var sourceType = 'url';
    var commandOptions = [];

    if (options != undefined) {
        for(var option in options) {
            commandOptions[option] = (options[option] == true || options[option]  == "true") ? '' : options[option];
        }
    }

    if (jsonData.url == "" || jsonData.url == null) {
        sourceType = 'string'
    }

    body = '';

    parsedOptions = {
        type: sourceType,
        url: jsonData.url || null,
        string: new Buffer(jsonData.contents || '').toString("ascii") || null,
        options: commandOptions,
    };

    return callback(null, parsedOptions);
}

RequestParser.prototype.handle = function(request, response, callback) {
    request.on('data', this.onData);

    requestParser = this;
    request.on('end', function(){
        requestParser.onEnd(callback)
    });

};

module.exports = RequestParser;