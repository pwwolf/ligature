import { inject, Service } from 'ligature';
import * as express from 'express';
import * as http from 'http';

export default class Express extends Service {

  private _app: express.Express;

  get app (): express.Express {
    return this._app;
  }

  init () {
    this._app = express();

    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const server = http.createServer(this._app);
    server.listen(port);

    return new Promise((resolve, reject) => {

      server.on('error', (err) => {
        reject(err);
      });

      server.on('listening', () => {
        let addr = server.address();
        console.log(`Listening on ${addr.port}`);
        resolve();
      });
    });
  }

  done () {
    const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
      console.log("YO")
      res.status(500).json({
        message: err.message
      });
    };
    this._app.use(errorHandler);
  }

}