import app from "./app"
import http from "http";


const port = process.env.PORT || 3000

console.log(`dbns-app-core initializing on ${port}`)

app.set('port', port);

export const server = http.createServer(app);

// server timeout is 60 seconds. 
// we have handlers on some routes to catch before this and process.
server.timeout = 60000 

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


function onError(error : any) {
      if (error.syscall !== 'listen') {
            throw error;
      }

      var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

      // handle specific listen errors with friendly messages
      switch (error.code) {
            case 'EACCES':
                  console.error(bind + ' requires elevated privileges');
                  process.exit(1);
                  break;
            case 'EADDRINUSE':
                  console.error(bind + ' is already in use');
                  process.exit(1);
                  break;
            default:
                  throw error;
      }
}

    
function onListening() {
      var addr = server.address() ?? "";
      var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
          
      console.log('dbns-app-core listening on ' + bind);

 
}
