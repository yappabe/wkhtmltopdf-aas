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


    if (request.headers['auth-key'] != settings.server.key) {
        console.log('Invalid Key provided %s', request.headers['auth-key']);
        response.statusCode = 401;
        response.statusMessage = 'Invalid Auth Key';
        response.end();
        return;
    }

    requestParser = new RequestParser();

    requestParser.handle(request, response, function(parsedOptions) {

        var destination = __dirname + '/' +  uuid.v1() + '.pdf';

        console.info('Parsed request for %s', destination);

        pdfCreator = new Pdf(parsedOptions);

        pdfCreator.generate(destination, function() {
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
