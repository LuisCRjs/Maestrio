import { Hono } from "hono";
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/salud', (c) => {
    return c.text('Hola estoy vivo')
});

serve({
  fetch: app.fetch,
  port: 3000,
})