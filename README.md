# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Deploying to Netlify (CI)

This repo includes a Netlify config and a GitHub Actions workflow that will automatically build and deploy the site to Netlify when you push to `main`.

What you need to do in the repository settings:

- Create two repository secrets (Settings → Secrets → Actions):
	- `NETLIFY_AUTH_TOKEN` — a Personal Access Token from your Netlify account (User settings → Applications → Personal access tokens).
	- `NETLIFY_SITE_ID` — the Site ID for your Netlify site (Site settings → Site information → copy "Site ID").

Steps to enable automatic deploys:

1. Create a site on Netlify (choose "Create a new site from Git" → GitHub → select this repository).
2. In the site settings copy the Site ID and add it to your GitHub repo secrets as `NETLIFY_SITE_ID`.
3. Generate a Netlify Personal Access Token and add it to your repo secrets as `NETLIFY_AUTH_TOKEN`.
4. Push to `main` — GitHub Actions will run `npm ci` → `npm run build` and then deploy using the Netlify CLI.

You can also deploy manually from your machine with the Netlify CLI:

```powershell
# install CLI (one-time)
npm install -g netlify-cli

# build
npm run build

# deploy (interactive for first-time, or use --prod to publish)
netlify deploy --dir=build --prod
```

After the site is live, generate a QR code for the published HTTPS URL (see below).

## Quick QR generation (PowerShell)

Replace the `$url` value with your published site URL:

```powershell
$url = 'https://your-site.netlify.app'
$qr = 'https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=' + [System.Web.HttpUtility]::UrlEncode($url)
Start-Process $qr
```

## Notes about PWA & audio precaching

- The build process copies audio files from `src/assets/ragas` into `public/assets/ragas` (via `scripts/move_audio.js`) before `npm run build` so they can be precached by the service worker.
- The service worker will attempt to read `public/assets/ragas/manifest.json` during install and precache those audio files. If you add new audio files, they will be included automatically when you build.


### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
