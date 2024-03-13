import express  from 'express';
import {  NextFunction, Request, Response} from 'express';
import bodyParser from "body-parser"
import path from 'path';

import coreRoutes from './coreRoutes';
import cookieParser from 'cookie-parser';
import compression from "compression";
 
const app = express();

app.set('views', path.join(__dirname, 'views')) ;
app.set("view engine","ejs");    



// Serve static files from the 'views' directory
app.use(compression());

app.use((req, res, next) => {
      //res.setHeader("Content-Security-Policy", "base-uri 'self'; script-src 'self' https://core.dbnetsolutions.co.uk ; object-src 'none';");
      //res.setHeader("Access-Control-Allow-Origin", "*");
      //res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      // Continue to the next middleware
      next();
  });

  app.use((req, res, next) => {
      // Check if the request is for the root path
      if (req.url === '/') {
          // Redirect to /en/
     //     return res.redirect(301, '/en/');
      }
      next();
  });

app.use(express.static(path.join(__dirname, './../public/')));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit:"5mb", extended: true })); 
app.use(express.json({ limit: "5mb" }));
 

app.use(coreRoutes);
// error handler
app.use(function(err: any, req: Request, res : Response, next : NextFunction) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};
    
      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });


export default app;