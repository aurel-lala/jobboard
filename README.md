# JobConnect

A modern job board built with React, TypeScript, and Vite. Candidates can search and apply to roles; employers can post jobs, manage applications, and schedule interviews.

## Features

- **Public job search** — filter by title, company, skills, location, and remote options
- **Role-based auth** — separate candidate and employer experiences
- **Candidate dashboard** — track applications, saved jobs, interviews, and notifications
- **Employer dashboard** — manage listings, review applicants, schedule interviews, and update company profile
- **Company profiles** — browse hiring companies and their open roles
- **Persistent local storage** — data survives page refreshes (client-side demo architecture)

## Tech Stack

- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS
- Zustand-ready service layer (localStorage-backed)
- shadcn/ui components

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

## Usage

1. **Register** as a Job Seeker or Employer
2. **Employers** — complete your company profile, then post jobs from the dashboard
3. **Candidates** — browse jobs, save listings, and submit applications with a cover letter
4. **Employers** — review applications, change status, schedule interviews, and hire candidates

All data is stored in the browser via `localStorage`. Clear site storage to reset the app.

## Project Structure

```
src/
  components/   # UI and layout components
  contexts/     # Auth context
  lib/          # Shared utilities (filtering, redirects)
  pages/        # Route pages
  router/       # App routing and protected routes
  services/     # Auth and jobs data layer
  types/        # Shared TypeScript types
```

## Notes

This is a frontend portfolio project with a localStorage data layer, designed to demonstrate UI/UX, state management, and role-based application flows. `.
