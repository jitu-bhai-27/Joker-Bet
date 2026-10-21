import express from 'express';
import { Plugin } from 'vite';
import { apiRouter } from './apiRouter';

export function jokerBetApiPlugin(): Plugin {
  return {
    name: 'jokerbet-api-plugin',
    configureServer(server) {
      const app = express();
      app.use(express.json());
      app.use('/api', apiRouter);

      server.middlewares.use(app);
    },
  };
}
