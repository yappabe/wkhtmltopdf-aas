var child_process = require('child_process');
var fs = require('fs');
require("console-stamp")(console, "HH:MM:ss.l");

var exports = module.exports = {};

function Pdf(config) {
    config.command = config.command || 'wkhtmltopdf';
    config.type = config.type || 'string';
    config.url =  config.url || null;
    config.string =  config.string || null;
    config.destination = config.destination || null;
    config.options = config.options || [];
    this.config = config;
}

Pdf.prototype.generate = function(onError, destination, callback) {

    this.config.destination =  destination || this.config.destination;
    var command = this.config.command;
    var commandArray = [];
    var thisObject = this;
    var type = this.config.type;
    var tempHtmlFile = this.config.destination + '.html';

    for(var option in this.config.options) {
        commandArray.push('--' + option);
        if(this.config.options[option] != '') {
            commandArray.push(this.config.options[option]);
        }
    }

    if (type == 'url') {
        commandArray.push(this.config.url);
    } else {
        fs.writeFileSync(tempHtmlFile, this.config.string);
        commandArray.push(tempHtmlFile);
    }


    commandArray.push(this.config.destination);

    console.info('Running: %s %s', command, commandArray.join(' '));

    child_process.execFile(command, commandArray, function(error, stdout, stderr){

        if (error) {
            onError(error, stdout, stderr);
        }

        if (type == 'string') {
            fs.unlink(tempHtmlFile);
        }

        callback();
    });


};

module.exports = Pdf;


