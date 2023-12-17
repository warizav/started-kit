![image](https://github.com/warizav/started-kit/assets/70666595/ac89c739-a8be-4b65-bd2c-1cace54bd80c)

Paso 1: Configuración del Proyecto
Crea un nuevo directorio para tu proyecto e inicializa un nuevo repositorio de Git.
bash
Copy code
mkdir willycode
cd willycode
git init
Crea un archivo package.json en la raíz del proyecto con la información proporcionada.
json
Copy code
// package.json
{
  "name": "willycode",
  "private": true,
  "version": "0.0.0",
  // ... (resto del contenido del package.json proporcionado)
}
Instala las dependencias del proyecto.
bash
Copy code
npm install
Paso 2: Configuración del Backend (Nest.js)
Instala Nest CLI globalmente si aún no lo has hecho.
bash
Copy code
npm install -g @nestjs/cli
Crea una aplicación Nest.js.
bash
Copy code
nest new api
cd api
Ajusta la configuración de Jest en api/package.json según lo proporcionado.

Crea un archivo tsconfig.node.json en el directorio api para la configuración del entorno Node.

json
Copy code
// api/tsconfig.node.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs"
  }
}
Actualiza los scripts en api/package.json para incluir comandos de desarrollo y construcción.
Paso 3: Configuración del Frontend (Vite con React)
Crea una aplicación Vite con React.
bash
Copy code
cd ..
npm create vite client --template react
cd client
Ajusta la configuración de Vite en client/package.json según lo proporcionado.

Actualiza los scripts en client/package.json para incluir comandos de desarrollo y construcción.

Paso 4: Configuración de lint-staged
Añade el siguiente fragmento a willycode/package.json para configurar lint-staged.
json
Copy code
"lint-staged": {
  "*.ts?(x)": [
    "eslint --fix",
    "prettier --write",
    "git add"
  ]
}
Paso 5: Configuración de Despliegue en Vercel
Crea un archivo vercel.json en la raíz del proyecto con la configuración de despliegue.
json
Copy code
// vercel.json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*", "use": "@vercel/node" },
    { "src": "client", "use": "@vercel/static" }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/api/(.*)", "dest": "api/$1" },
    { "src": "/(.*)", "dest": "client/$1" }
  ]
}
Paso 6: Documentación y Scripts
Actualiza el archivo README.md con instrucciones detalladas sobre cómo ejecutar localmente y desplegar en Vercel.

Agrega scripts en willycode/package.json para facilitar la ejecución local y el despliegue.

Paso 7: Pruebas
Añade pruebas unitarias y de integración según sea necesario tanto para el backend como para el frontend.
Paso 8: Despliegue en Vercel
Crea una cuenta en Vercel (si no tienes una) y vincula tu repositorio de Git.

Despliega tu aplicación en Vercel usando el botón de despliegue desde el dashboard de Vercel o usando la CLI de Vercel.

Con estos pasos, habrás creado un proyecto mono repo con Nest.js y Vite con React, con configuración de linting, pruebas, y despliegue en Vercel. Asegúrate de ajustar cualquier configuración específica según tus necesidades y revisar la documentación oficial de las herramientas utilizadas.
