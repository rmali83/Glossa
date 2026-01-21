# Deployment Guide

Your application is configured for deployment on [Vercel](https://vercel.com). The project setup includes:

- **Frontend**: React + Vite
- **Backend**: Vercel Serverless Functions (`api/` directory)
- **Configuration**: `vercel.json` handles routing and rewrites.

## How to Go Live

1. **Open your terminal** in this directory.
2. Run the following command:
   ```bash
   npx vercel
   ```
3. **Follow the prompts**:
   - **Log in** (if asked): It will open your browser.
   - **Set up and deploy?**: Type `y` (Yes).
   - **Which scope?**: Select your account.
   - **Link to existing project?**: `n` (No, unless you already created one).
   - **Project Name**: Press Enter to accept `glossa` or type a new name.
   - **In which directory is your code located?**: Press Enter (defaults to `./`).
   - **Want to modify these settings?**: `n` (No).

4. **Wait for deployment**: Vercel will build and deploy your site. You will get a `Production: https://glossa-xyz.vercel.app` URL.

## Important Notes

- **Data Storage**: In this deployment, the translator onboarding form data will **NOT** be saved to a persistent database (as the local file system is not writable in almost all serverless environments).
- Instead, the data is configured to be **logged** to the Vercel Function Logs. You can view these logs in your Vercel Dashboard under the "Logs" tab of your deployment.
- **To persist data**: In the future, you should connect a database like MongoDB, PostgreSQL (Supabase/Neon), or Firebase.

## Testing Production

After deployment, visit the provided URL and navigate to the "Join Us" page (`/join-us`). Submit the form. It should say "Application received successfully", and you will see the submission in your Vercel Dashboard logs.
