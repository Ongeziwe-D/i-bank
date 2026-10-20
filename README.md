# i-bank

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

The dashboard requires signing in. During development the login endpoint is mocked
(`src/app/core/auth/mock-auth.interceptor.ts`) and accepts this demo account:

- Email: `john.doe@email.com`
- Password: `Password123!`

## Running with Docker

The image builds the app and serves it with nginx on port 8080.

Demo build, with the mock login and sample data (no backend needed):

```bash
docker build --build-arg BUILD_CONFIGURATION=demo -t i-bank:demo .
docker run --rm -p 8080:8080 i-bank:demo
```

Production build, which calls the real API. nginx forwards `/api` requests unchanged to
`API_UPSTREAM`. Without it, `/api` returns 503:

```bash
docker build -t i-bank .
docker run --rm -p 8080:8080 -e API_UPSTREAM=http://host.docker.internal:3000 i-bank
```

Then open `http://localhost:8080/`.

If the build fails with `self-signed certificate in certificate chain` (a corporate proxy
re-signing HTTPS traffic), export your company's root CA certificate as a PEM file and pass it
as a build secret:

```bash
docker build --secret id=ca,src=company-root-ca.pem --build-arg BUILD_CONFIGURATION=demo -t i-bank:demo .
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
