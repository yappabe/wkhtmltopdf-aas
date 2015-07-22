var http = require('http');
var uuid = require('node-uuid');
var fs = require('fs');
var RequestParser = require('./lib/RequestParser.js');
var Pdf = require('./lib/Pdf.js');
var yaml_config = require('node-yaml-config');
var settings = yaml_config.load(__dirname + '/config/settings.yml');

var RequestParser,
    Pdf;

var server = http.createServer(function(request, response) {

    var ip = request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;

    console.log('Request from %s', ip);

    if (request.headers['api-key'] != settings.server.api_key) {
        var message = 'Invalid api key provided';
        console.error(message);
        response.statusMessage = 'message';
        response.statusCode = 401;
        response.end(message);
        return;
    }

    requestParser = new RequestParser();

    requestParser.handle(request, response, function(error, parsedOptions) {

        if (error) {
            console.error(error);
            response.statusCode = 500;
            response.end('Invalid JSON: ' + error.message);
            return;
        }

        var destination = __dirname + '/' +  uuid.v1() + '.pdf';

        console.info('Parsed request for %s', destination);

        parsedOptions.command = settings.wkhtmltopdf.bin;

        pdfCreator = new Pdf(parsedOptions);

        pdfCreator.generate(
            function(error, stdout, stderror){
                console.log(stdout);
                console.error(stderror);
                response.statusCode = 500;
                response.end('wkhtmltopdf failed');
                return;
            },
            destination,
            function() {
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
                response.setHeader('content-type', 'application/pdf');

                var readStream = fs.createReadStream(destination);
                readStream.pipe(response);
                readStream.on('end', function() {
                    console.log('Sending file %s', destination);
                    fs.unlink(destination);

                });
        });
    });


});

server.listen(settings.server.port, function(){
    console.info("Server listening on: http://0.0.0.0:%s", settings.server.port);
});
