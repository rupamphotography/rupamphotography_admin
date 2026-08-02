import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const vercelApiPlugin = () => ({
  name: 'vercel-api-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        const apiRoute = req.url.split('?')[0];
        const filePath = path.join(__dirname, `${apiRoute}.js`);
        
        if (fs.existsSync(filePath)) {
          const env = loadEnv('', process.cwd(), '');
          Object.assign(process.env, env);

          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {};
            } catch (e) {
              req.body = {};
            }
            
            try {
              const module = await import(`file://${filePath}?t=${Date.now()}`);
              await module.default(req, res);
            } catch (err) {
              console.error('API Error:', err);
              res.status(500).json({ error: err.message });
            }
          });
          return;
        }
      }
      next();
    });
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelApiPlugin()],
})
