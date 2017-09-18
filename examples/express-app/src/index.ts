import { ServiceLoader, Consumer, Service, ServiceConstructor } from 'ligature';
import Express from './services/express';
import TestRoute from './routes/test';

let routes: Array<ServiceConstructor> = [
  TestRoute
]

//options are optional
let initOptions = new Map();
initOptions.set(Express, { foo: 'bar' });

ServiceLoader.getInstance().init([Express, ...routes], initOptions).then(() => {
  console.log('started!');
}, (err) => {
  console.log('Could not start server', err);
  process.exit(1);
});
