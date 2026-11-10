import { Hono } from "hono";
import { serve } from '@hono/node-server';
import { cors } from "hono/cors";


const app = new Hono();

app.use('/salud', cors())


app.get('/salud', (c) => {
    return c.text('Hola estoy vivo')
});

serve({
  fetch: app.fetch,
  port: 3000,
})