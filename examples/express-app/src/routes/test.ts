import { inject, Consumer } from 'ligature';
import Express from '../services/express';

export default class TestRoute extends Consumer {

  @inject
  private express: Express;

  init () {
    this.express.app.get('/test', (req, res, next) => {
      res.json({ testing: true });
    });

    this.express.app.get('/error', (req, res, next) => {
      next(new Error('Testing error handler.'));
    });
  }

}
