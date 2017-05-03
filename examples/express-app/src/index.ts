import { ServiceLoader, Consumer, Service, ServiceConstructor } from 'ligature';
import Express from './services/express';
import TestRoute from './routes/test';

let routes : Array<ServiceConstructor> = [
  TestRoute
]

ServiceLoader.getInstance().init([Express, ...routes]).then(() => {
  console.log('started!');
}, (err) => {
  console.log('Could not start server', err);
  process.exit(1);
});
