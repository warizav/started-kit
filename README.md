# Starter Kit Project

![image](https://github.com/warizav/started-kit/assets/70666595/ac89c739-a8be-4b65-bd2c-1cace54bd80c)

## Description
This document outlines the steps to set up a mono repo project using Nest.js and Vite with React, named "Starter Kit." It includes project configuration, backend and frontend setup, linting, testing, and deployment to Vercel.

### Summary
The Starter Kit provides a solid foundation for projects using Nest.js on the backend and Vite with React on the frontend. The steps include initial project setup, dependency installation, configuration adjustments for Jest, Vite, and lint-staged, along with instructions for testing and deployment on Vercel.

### Step 1: Project Setup
1. Create a new directory for your project and initialize a new Git repository.

    ```bash
    mkdir starter-kit
    cd starter-kit
    git init
    ```

2. Create a `package.json` file in the project's root with the provided information.

    ```json
    // package.json
    {
      "name": "starter-kit",
      "private": true,
      "version": "0.0.0",
      // ... (rest of the package.json content provided)
    }
    ```

3. Install project dependencies.

    ```bash
    npm install
    ```

### Step 2: Backend Configuration (Nest.js)
1. Install Nest CLI globally if not already installed.

    ```bash
    npm install -g @nestjs/cli
    ```

2. Create a Nest.js application.

    ```bash
    nest new api
    cd api
    ```

3. Adjust Jest configuration in `api/package.json` as provided.

4. Create a `tsconfig.node.json` file in the `api` directory for Node environment configuration.

    ```json
    // api/tsconfig.node.json
    {
      "extends": "./tsconfig.json",
      "compilerOptions": {
        "module": "commonjs"
      }
    }
    ```

5. Update scripts in `api/package.json` to include development and build commands.

### Step 3: Frontend Configuration (Vite with React)
1. Create a Vite application with React.

    ```bash
    cd ..
    npm create vite client --template react
    cd client
    ```

2. Adjust Vite configuration in `client/package.json` as provided.

3. Update scripts in `client/package.json` to include development and build commands.

### Step 4: lint-staged Configuration
1. Add the following snippet to `starter-kit/package.json` to configure lint-staged.

    ```json
    "lint-staged": {
      ".ts?(x)": [
        "eslint --fix",
        "prettier --write",
        "git add"
      ]
    }
    ```

### Step 5: Vercel Deployment Configuration
1. Create a `vercel.json` file in the project's root with deployment configuration.

    ```json
    // vercel.json
    {
      "version": 2,
      "builds": [
        {
          "src": "api/**/",
          "use": "@vercel/node"
        },
        {
          "src": "client",
          "use": "@vercel/static"
        }
      ],
      "routes": [
        {
          "handle": "filesystem"
        },
        {
          "src": "/api/(.*)",
          "dest": "api/$1"
        },
        {
          "src": "/(.*)",
          "dest": "client/$1"
        }
      ]
    }
    ```

### Step 6: Documentation and Scripts
1. Update the `README.md` file with detailed instructions on how to run locally and deploy to Vercel.

2. Add scripts in `starter-kit/package.json` to facilitate local execution and deployment.

### Step 7: Testing
1. Add unit and integration tests as needed for both the backend and frontend.

### Step 8: Vercel Deployment
1. Create an account on Vercel (if not already done) and link your Git repository.

2. Deploy your application on Vercel using the deploy button from the Vercel dashboard or the Vercel CLI.

Following these steps, you will have created a mono repo project with Nest.js and Vite with React, including linting, testing, and deployment on Vercel. Be sure to adjust any specific configurations according to your needs and review the official documentation of the tools used.


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
